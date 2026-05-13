package app.habitra.mobile;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;

public class MidnightReceiver extends BroadcastReceiver {
    public static final String ACTION_ALARM = "app.habitra.mobile.ACTION_MIDNIGHT_ALARM";
    public static final String ACTION_DISMISS = "app.habitra.mobile.ACTION_DISMISS";
    public static final String ACTION_STOP_VIBRATE = "app.habitra.mobile.ACTION_STOP_VIBRATE";
    public static final String ACTION_SILENT_6AM = "app.habitra.mobile.ACTION_SILENT_6AM";
    public static final String ACTION_SWIPE = "app.habitra.mobile.ACTION_NOTIFICATION_SWIPE";
    public static final String ACTION_SNOOZE = "app.habitra.mobile.ACTION_SNOOZE";

    private static final int NOTIFICATION_ID = 1002;
    private static final int MAX_CYCLES = 3;
    private static final long SNOOZE_MS = 10 * 60 * 1000;
    private static final long VIBRATE_DURATION_MS = 30 * 1000;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        SharedPreferences prefs = context.getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE);
        String method = prefs.getString("reminder_method", "nag");

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            int h = prefs.getInt("review_hour", 22);
            int m = prefs.getInt("review_minute", 0);
            MidnightPlugin.scheduleAlarm(context, h, m);
            return;
        }

        if (ACTION_DISMISS.equals(action)) {
            stopReminderService(context);
            
            // --- NEW: Cancel secondary nag/snooze alarms ---
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                // Cancel Snooze (ID 3)
                Intent snoozeIntent = new Intent(context, MidnightReceiver.class);
                snoozeIntent.setAction(MidnightReceiver.ACTION_ALARM);
                PendingIntent snoozePI = PendingIntent.getBroadcast(
                    context, 3, snoozeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                am.cancel(snoozePI);

                // Cancel Stop Vibrate Timer (ID 8)
                Intent stopVibrateIntent = new Intent(context, MidnightReceiver.class);
                stopVibrateIntent.setAction(MidnightReceiver.ACTION_STOP_VIBRATE);
                PendingIntent stopVibratePI = PendingIntent.getBroadcast(
                    context, 8, stopVibrateIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                am.cancel(stopVibratePI);
            }
            // ------------------------------------------------

            // Re-schedule tomorrow's alarm to keep the daily cycle alive
            int h = prefs.getInt("review_hour", 22);
            int m = prefs.getInt("review_minute", 0);
            MidnightPlugin.scheduleAlarm(context, h, m);

            prefs.edit().putInt("alarm_cycle_count", 0).apply();
            return;
        }

        if (ACTION_SNOOZE.equals(action)) {
            stopReminderService(context);
            scheduleNextAlarm(context, SNOOZE_MS, ACTION_ALARM);
            return;
        }

        if (ACTION_SWIPE.equals(action)) {
            // User swiped it away. If method is "nag", we re-ping in 10 mins.
            if ("nag".equals(method)) {
                scheduleNextAlarm(context, SNOOZE_MS, ACTION_ALARM);
            }
            return;
        }

        if (ACTION_STOP_VIBRATE.equals(action)) {
            stopReminderService(context);
            int cycle = prefs.getInt("alarm_cycle_count", 0);
            if (cycle < MAX_CYCLES) {
                scheduleNextAlarm(context, SNOOZE_MS - VIBRATE_DURATION_MS, ACTION_ALARM);
            } else {
                schedule6AMFallback(context);
            }
            return;
        }

        if (ACTION_ALARM.equals(action)) {
            // Check if app is in foreground. If so, skip the noisy notification service 
            // as the in-app popup will handle it.
            boolean isForeground = prefs.getBoolean("app_is_foreground", false);
            if (isForeground) {
                return;
            }

            int cycle = prefs.getInt("alarm_cycle_count", 0) + 1;
            prefs.edit().putInt("alarm_cycle_count", cycle).apply();
            
            startReminderService(context, "Review Reminder (Attempt " + cycle + ")", true, method);
            
            // Auto-stop vibration logic now handled by service + this timer
            scheduleNextAlarm(context, VIBRATE_DURATION_MS, ACTION_STOP_VIBRATE);
            return;
        }

        if (ACTION_SILENT_6AM.equals(action)) {
            startReminderService(context, "Morning Check-in", false, method);
            return;
        }
    }

    private void startReminderService(Context context, String title, boolean vibrate, String method) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("shouldVibrate", vibrate);
        serviceIntent.putExtra("reminderMethod", method);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    private void stopReminderService(Context context) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        context.stopService(serviceIntent);
    }

    private void scheduleNextAlarm(Context context, long delayMs, String action) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, MidnightReceiver.class);
        intent.setAction(action);
        // Use unique requestCodes for different actions to avoid overwriting
        int requestCode = ACTION_STOP_VIBRATE.equals(action) ? 8 : 3;
        PendingIntent pi = PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        long triggerAt = System.currentTimeMillis() + delayMs;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    private void schedule6AMFallback(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, MidnightReceiver.class);
        intent.setAction(ACTION_SILENT_6AM);
        PendingIntent pi = PendingIntent.getBroadcast(context, 4, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 6);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
        }
    }
}
