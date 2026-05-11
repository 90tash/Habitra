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

    private static final int NOTIFICATION_ID = 1001;
    private static final int MAX_CYCLES = 3;
    private static final long SNOOZE_MS = 10 * 60 * 1000;
    private static final long VIBRATE_DURATION_MS = 60 * 1000;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        SharedPreferences prefs = context.getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            int h = prefs.getInt("review_hour", 22);
            int m = prefs.getInt("review_minute", 0);
            MidnightPlugin.scheduleAlarm(context, h, m);
            return;
        }

        if (ACTION_DISMISS.equals(action)) {
            stopReminderService(context);
            prefs.edit().putInt("alarm_cycle_count", 0).apply();
            return;
        }

        if (ACTION_STOP_VIBRATE.equals(action)) {
            stopReminderServiceVibration(context);
            int cycle = prefs.getInt("alarm_cycle_count", 0);
            if (cycle < MAX_CYCLES) {
                scheduleNextAlarm(context, SNOOZE_MS - VIBRATE_DURATION_MS, ACTION_ALARM);
            } else {
                schedule6AMFallback(context);
            }
            return;
        }

        if (ACTION_ALARM.equals(action)) {
            int cycle = prefs.getInt("alarm_cycle_count", 0) + 1;
            prefs.edit().putInt("alarm_cycle_count", cycle).apply();
            
            startReminderService(context, "Review Reminder (Attempt " + cycle + ")", true);
            
            // Auto-stop vibration logic now handled by service + this timer
            scheduleNextAlarm(context, VIBRATE_DURATION_MS, ACTION_STOP_VIBRATE);
            return;
        }

        if (ACTION_SILENT_6AM.equals(action)) {
            startReminderService(context, "Morning Check-in", false);
            return;
        }
    }

    private void startReminderService(Context context, String title, boolean vibrate) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("shouldVibrate", vibrate);
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

    private void stopReminderServiceVibration(Context context) {
        // We restart the service WITHOUT vibration to update the notification
        // but stop the buzzing.
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.putExtra("title", "Review Reminder (Snoozed)");
        serviceIntent.putExtra("shouldVibrate", false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    private void scheduleNextAlarm(Context context, long delayMs, String action) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, MidnightReceiver.class);
        intent.setAction(action);
        PendingIntent pi = PendingIntent.getBroadcast(context, 3, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
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
