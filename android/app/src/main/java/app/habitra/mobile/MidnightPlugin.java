package app.habitra.mobile;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Calendar;

import android.os.Vibrator;
import android.os.VibrationEffect;

@CapacitorPlugin(name = "Midnight")
public class MidnightPlugin extends Plugin {
    private static final int POST_NOTIFICATIONS_REQUEST_CODE = 4101;

    @PluginMethod
    public void stopVibration(PluginCall call) {
        Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) {
            v.cancel();
        }
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            Intent intent = new Intent(getContext(), MidnightReceiver.class);
            intent.setAction(MidnightReceiver.ACTION_ALARM);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                getContext(), 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pendingIntent);
            
            // Also cancel the 6 AM fallback
            Intent fallbackIntent = new Intent(getContext(), MidnightReceiver.class);
            fallbackIntent.setAction(MidnightReceiver.ACTION_SILENT_6AM);
            PendingIntent fallbackPI = PendingIntent.getBroadcast(
                getContext(), 4, fallbackIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(fallbackPI);
        }
        
        // Clear preferences
        getContext().getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE)
            .edit()
            .remove("review_hour")
            .remove("review_minute")
            .apply();

        call.resolve();
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(1002); // Corrected to 1002 to match HabitReminderService
        }
        
        // Also stop the service explicitly to remove any floating bubbles
        Intent serviceIntent = new Intent(getContext(), HabitReminderService.class);
        getContext().stopService(serviceIntent);

        // Also stop any running vibration
        Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) v.cancel();
        
        // --- NEW: Cancel secondary nag/snooze alarms ---
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            // Cancel Snooze/Action Alarm (ID 3)
            Intent alarmIntent = new Intent(getContext(), MidnightReceiver.class);
            alarmIntent.setAction(MidnightReceiver.ACTION_ALARM);
            PendingIntent snoozePI = PendingIntent.getBroadcast(
                getContext(), 3, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            am.cancel(snoozePI);

            // Cancel Stop Vibrate Timer (ID 8)
            Intent stopVibrateIntent = new Intent(getContext(), MidnightReceiver.class);
            stopVibrateIntent.setAction(MidnightReceiver.ACTION_STOP_VIBRATE);
            PendingIntent stopVibratePI = PendingIntent.getBroadcast(
                getContext(), 8, stopVibrateIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            am.cancel(stopVibratePI);
        }
        // ------------------------------------------------

        // Reset cycle count
        getContext().getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE)
            .edit()
            .putInt("alarm_cycle_count", 0)
            .apply();

        call.resolve();
    }

    @PluginMethod
    public void setPendingCount(PluginCall call) {
        Integer count = call.getInt("count", 0);
        getContext().getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE)
            .edit()
            .putInt("pending_habit_count", count)
            .apply();
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        String method = call.getString("reminderMethod", "nag"); // Default to nag

        if (hour == null || minute == null) {
            call.reject("Hour and minute are required");
            return;
        }

        // Save for reboot persistence and background retrieval
        getContext().getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE)
            .edit()
            .putInt("review_hour", hour)
            .putInt("review_minute", minute)
            .putString("reminder_method", method)
            .apply();

        boolean exact = scheduleAlarm(getContext(), hour, minute);
        JSObject ret = new JSObject();
        ret.put("exact", exact);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkTrigger(PluginCall call) {
        boolean isMidnight = getActivity().getIntent().getBooleanExtra("isMidnightAlarm", false);
        // Clear it so it doesn't trigger again on reload.
        getActivity().getIntent().removeExtra("isMidnightAlarm");

        JSObject ret = new JSObject();
        ret.put("isMidnightAlarm", isMidnight);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasOverlayPermission(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void checkReminderPermissions(PluginCall call) {
        call.resolve(getReminderPermissions(getContext()));
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                POST_NOTIFICATIONS_REQUEST_CODE
            );
        }
        call.resolve();
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExactAlarms(getContext())) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestFullScreenIntentPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && !canUseFullScreenIntent(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void setForegroundState(PluginCall call) {
        Boolean isForeground = call.getBoolean("isForeground", false);
        getContext().getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("app_is_foreground", isForeground)
            .apply();
        call.resolve();
    }

    private static JSObject getReminderPermissions(Context context) {
        JSObject ret = new JSObject();
        ret.put("notifications", hasNotificationPermission(context));
        ret.put("exactAlarm", canScheduleExactAlarms(context));
        ret.put("fullScreenIntent", canUseFullScreenIntent(context));
        ret.put("overlay", hasOverlayPermission(context));
        return ret;
    }

    private static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    private static boolean canUseFullScreenIntent(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true;
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return notificationManager != null && notificationManager.canUseFullScreenIntent();
    }

    private static boolean hasOverlayPermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return Settings.canDrawOverlays(context);
    }

    public static boolean scheduleAlarm(Context context, int hour, int minute) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return false;

        Intent intent = new Intent(context, MidnightReceiver.class);
        intent.setAction(MidnightReceiver.ACTION_ALARM);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        // If it's already past the time today, schedule for tomorrow.
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1);
        }

        boolean canUseExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && canUseExact) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
                return true;
            }

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M && canUseExact) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
                return true;
            }
        } catch (SecurityException ignored) {
            canUseExact = false;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
        }

        return false;
    }
}
