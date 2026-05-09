package app.habitra.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Vibrator;
import android.os.VibrationEffect;
import androidx.core.app.NotificationCompat;

public class MidnightReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "midnight_alarm_channel";
    public static final String ACTION_ALARM = "app.habitra.mobile.ACTION_MIDNIGHT_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            MidnightPlugin.scheduleAlarm(context);
            return;
        }

        if (ACTION_ALARM.equals(action)) {
            showNotification(context);
            vibrate(context);
        }
    }

    private void showNotification(Context context) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Midnight Check-in",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alarm for daily habit check-in");
            channel.enableVibration(true);
            notificationManager.createNotificationChannel(channel);
        }

        Intent fullScreenIntent = new Intent(context, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("isMidnightAlarm", true);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context, 0, fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) // Should be your app icon
            .setContentTitle("Midnight Check-in")
            .setContentText("Time to log your habits for the day!")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true)
            .setOngoing(true);

        notificationManager.notify(1001, builder.build());
    }

    private void vibrate(Context context) {
        Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(1000);
            }
        }
    }
}
