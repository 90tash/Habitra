package app.habitra.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.MotionEvent;
import android.util.DisplayMetrics;
import android.animation.ValueAnimator;
import android.view.animation.DecelerateInterpolator;
import android.content.SharedPreferences;
import android.widget.ImageView;
import android.widget.TextView;
import android.provider.Settings;
import android.app.KeyguardManager;
import android.media.AudioAttributes;

public class HabitReminderService extends Service {
    private static final String CHANNEL_ID = "habitra_ongoing_service_v1";
    private static final int NOTIFICATION_ID = 1002;
    private Vibrator vibrator;
    private Handler handler = new Handler();
    private PowerManager.WakeLock wakeLock;
    private WindowManager windowManager;
    private View floatingView;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            android.os.VibratorManager vibratorManager = (android.os.VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            vibrator = vibratorManager.getDefaultVibrator();
        } else {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent.getStringExtra("title");
        boolean shouldVibrate = intent.getBooleanExtra("shouldVibrate", true);
        String method = intent.getStringExtra("reminderMethod");

        createNotificationChannel();
        
        // Log Now Action
        Intent logIntent = new Intent(this, MainActivity.class);
        logIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        logIntent.putExtra("isMidnightAlarm", true);
        PendingIntent logPI = PendingIntent.getActivity(this, 1, logIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Snooze Action
        Intent snoozeIntent = new Intent(this, MidnightReceiver.class);
        snoozeIntent.setAction(MidnightReceiver.ACTION_SNOOZE);
        PendingIntent snoozePI = PendingIntent.getBroadcast(this, 6, snoozeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Dismiss Action
        Intent dismissIntent = new Intent(this, MidnightReceiver.class);
        dismissIntent.setAction(MidnightReceiver.ACTION_DISMISS);
        PendingIntent dismissPI = PendingIntent.getBroadcast(this, 7, dismissIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Intent for swipe detection (Nag Mode)
        Intent swipeIntent = new Intent(this, MidnightReceiver.class);
        swipeIntent.setAction(MidnightReceiver.ACTION_SWIPE);
        PendingIntent swipePI = PendingIntent.getBroadcast(this, 5, swipeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText("Time to check in your habits!")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(logPI)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_edit, "Log Now", logPI)
            .addAction(android.R.drawable.ic_menu_recent_history, "Snooze", snoozePI)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPI);

        // If bubble is active, lower the notification priority so it doesn't "peek" 
        // and cover the top of the screen (redundant with the bubble).
        if ("bubble".equals(method)) {
            builder.setPriority(NotificationCompat.PRIORITY_LOW);
        } else {
            builder.setPriority(NotificationCompat.PRIORITY_MAX);
        }

        if ("nag".equals(method)) {
            builder.setDeleteIntent(swipePI);
        }

        Notification notification = builder.build();

        // Start as foreground but immediately stop-foreground-detach to make it swipable
        startForeground(NOTIFICATION_ID, notification);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_DETACH);
        } else {
            stopForeground(false);
        }

        if ("bubble".equals(method)) {
            showFloatingBubble();
        }

        if (shouldVibrate) {
            startLoopingVibration();
            acquireWakeLock();
        } else {
            if (vibrator != null) vibrator.cancel();
        }

        return START_NOT_STICKY;
    }

    private void showFloatingBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return;
        }

        if (floatingView != null) return; // Already showing

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (windowManager == null) return;

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 150;

        LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);
        floatingView = inflater.inflate(getResources().getIdentifier("floating_reminder_layout", "layout", getPackageName()), null);

        // Update Dynamic Content
        TextView titleText = floatingView.findViewById(getResources().getIdentifier("title_text", "id", getPackageName()));
        TextView subtextText = floatingView.findViewById(getResources().getIdentifier("subtext_text", "id", getPackageName()));
        
        SharedPreferences prefs = getSharedPreferences("habitra_reminders", Context.MODE_PRIVATE);
        int pendingCount = prefs.getInt("pending_habit_count", 0);
        
        if (pendingCount > 0) {
            titleText.setText("Check-in Required");
            subtextText.setText(pendingCount + " habits remaining today");
        } else {
            titleText.setText("Daily Log");
            subtextText.setText("Tap to review your habits");
        }

        floatingView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private boolean isDragging = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isDragging = false;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        int deltaX = (int) (event.getRawX() - initialTouchX);
                        int deltaY = (int) (event.getRawY() - initialTouchY);
                        
                        // Small threshold for dragging to avoid accidental moves during tap
                        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                            isDragging = true;
                            params.x = initialX + deltaX;
                            params.y = initialY + deltaY;
                            windowManager.updateViewLayout(floatingView, params);
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        if (!isDragging) {
                            // It was a tap
                            v.performClick();
                        } else {
                            // Snap to edge logic
                            snapToEdge(params);
                        }
                        return true;
                }
                return false;
            }
        });

        floatingView.setOnClickListener(v -> {
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("isMidnightAlarm", true);
            startActivity(intent);
            stopSelf();
        });

        windowManager.addView(floatingView, params);
    }

    private void snapToEdge(WindowManager.LayoutParams params) {
        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(metrics);
        int screenWidth = metrics.widthPixels;
        int viewWidth = floatingView.getWidth();

        int targetX = (params.x + viewWidth / 2 < screenWidth / 2) ? 0 : screenWidth - viewWidth;

        ValueAnimator animator = ValueAnimator.ofInt(params.x, targetX);
        animator.setDuration(300);
        animator.setInterpolator(new DecelerateInterpolator());
        animator.addUpdateListener(animation -> {
            params.x = (int) animation.getAnimatedValue();
            if (floatingView != null && floatingView.getParent() != null) {
                windowManager.updateViewLayout(floatingView, params);
            }
        });
        animator.start();
    }

    private void startLoopingVibration() {
        if (vibrator != null && vibrator.hasVibrator()) {
            vibrator.cancel();

            KeyguardManager kgm = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            boolean isLocked = kgm != null && kgm.isKeyguardLocked();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                VibrationEffect effect;
                if (!isLocked) {
                    // Short vibration (WhatsApp style) - Unlocked
                    effect = VibrationEffect.createWaveform(new long[]{0, 200, 100, 200}, -1);
                } else {
                    // Persistent vibration (Alarm style) - Locked
                    effect = VibrationEffect.createWaveform(new long[]{0, 800, 800}, 0);
                }
                
                // Use Alarm attributes to break through "Do Not Disturb" if allowed
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build();
                
                vibrator.vibrate(effect, audioAttributes);
            } else {
                if (!isLocked) {
                    vibrator.vibrate(new long[]{0, 200, 100, 200}, -1);
                } else {
                    vibrator.vibrate(new long[]{0, 800, 800}, 0);
                }
            }
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            // Increased duration to 30 seconds for better visibility
            wakeLock = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "Habitra:ServiceWake");
            wakeLock.acquire(30000);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Habit Reminder Task",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        if (vibrator != null) vibrator.cancel();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (windowManager != null && floatingView != null) {
            windowManager.removeView(floatingView);
        }
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
