import React, { useEffect, useState } from 'react';
import { AlarmClock, Bell, Check, Smartphone, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Midnight, { isMidnightPluginAvailable } from '@/lib/midnightPlugin';
import type { ReminderPermissionStatus } from '@/lib/midnightPlugin';

export const DEFAULT_REMINDER_PERMISSIONS: ReminderPermissionStatus = {
  notifications: true,
  exactAlarm: true,
  fullScreenIntent: true,
  overlay: true,
};

type ReminderPermissionsPanelProps = {
  className?: string;
  hideWhenComplete?: boolean;
  intro?: string;
  autoRequestNotifications?: boolean;
};

export default function ReminderPermissionsPanel({
  className,
  hideWhenComplete = true,
  intro = 'Enable these for reliable day-end reminders. Habitra still works if you skip them, but reminders may be delayed or less visible.',
  autoRequestNotifications = false,
}: ReminderPermissionsPanelProps) {
  const [reminderPermissions, setReminderPermissions] = useState<ReminderPermissionStatus>(DEFAULT_REMINDER_PERMISSIONS);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [autoNotificationRequested, setAutoNotificationRequested] = useState(false);
  const isAndroid = Capacitor.getPlatform() === 'android';

  const refreshReminderPermissions = async () => {
    if (!isAndroid) {
      setReminderPermissions(DEFAULT_REMINDER_PERMISSIONS);
      return;
    }

    if (!isMidnightPluginAvailable()) {
      setReminderPermissions({
        notifications: false,
        exactAlarm: false,
        fullScreenIntent: false,
        overlay: false,
      });
      return;
    }

    try {
      setReminderPermissions(await Midnight.checkReminderPermissions());
    } catch {
      setReminderPermissions(DEFAULT_REMINDER_PERMISSIONS);
    }
  };

  useEffect(() => {
    refreshReminderPermissions();

    const handleFocus = () => {
      refreshReminderPermissions();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAndroid]);

  useEffect(() => {
    if (!isAndroid || !autoRequestNotifications || autoNotificationRequested || reminderPermissions.notifications) return;

    const timer = setTimeout(() => {
      setAutoNotificationRequested(true);
      requestReminderPermission('notifications');
    }, 500);

    return () => clearTimeout(timer);
  }, [autoNotificationRequested, autoRequestNotifications, isAndroid, reminderPermissions.notifications]);

  const requestReminderPermission = async (permission: keyof ReminderPermissionStatus) => {
    if (!isAndroid || !isMidnightPluginAvailable()) return;

    setPermissionLoading(true);
    try {
      if (permission === 'notifications') await Midnight.requestNotificationPermission();
      if (permission === 'exactAlarm') await Midnight.requestExactAlarmPermission();
      if (permission === 'fullScreenIntent') await Midnight.requestFullScreenIntentPermission();
      if (permission === 'overlay') await Midnight.requestOverlayPermission();
    } catch (error) {
      console.error(`Failed to request ${permission} permission:`, error);
    } finally {
      [500, 1200, 2500, 4000].forEach((delay, index, delays) => {
        setTimeout(() => {
          refreshReminderPermissions().finally(() => {
            if (index === delays.length - 1) setPermissionLoading(false);
          });
        }, delay);
      });
    }
  };

  const reminderPermissionItems = [
    {
      key: 'notifications' as const,
      title: 'Notifications',
      description: 'Shows your day-end habit check-in.',
      icon: Bell,
      granted: reminderPermissions.notifications,
      action: 'Allow notifications',
    },
    {
      key: 'exactAlarm' as const,
      title: 'Exact alarms',
      description: 'Keeps the reminder close to your chosen day-end time.',
      icon: AlarmClock,
      granted: reminderPermissions.exactAlarm,
      action: 'Enable exact alarms',
    },
    {
      key: 'fullScreenIntent' as const,
      title: 'Lock-screen check-in',
      description: 'Lets Habitra open the check-in from urgent reminders.',
      icon: Smartphone,
      granted: reminderPermissions.fullScreenIntent,
      action: 'Enable lock-screen check-in',
    },
    {
      key: 'overlay' as const,
      title: 'Display over apps',
      description: 'Helps the check-in appear above the lock screen or other apps.',
      icon: X,
      granted: reminderPermissions.overlay,
      action: 'Enable display over apps',
    },
  ];

  const missingReminderPermissions = reminderPermissionItems.some(item => !item.granted);

  if (!isAndroid || (hideWhenComplete && !missingReminderPermissions)) return null;

  return (
    <div className={cn("bg-orange-500/5 border border-orange-500/20 rounded-[24px] p-5 space-y-4 shadow-lg backdrop-blur-sm", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3 text-orange-400">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold">Reminder Permissions</p>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">{intro}</p>
      </div>

      <div className="space-y-2">
        {reminderPermissionItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/40 p-3">
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                item.granted ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-400"
              )}>
                {item.granted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
              {!item.granted && (
                <Button
                  type="button"
                  disabled={permissionLoading}
                  onClick={() => requestReminderPermission(item.key)}
                  variant="outline"
                  className="h-9 rounded-xl border-orange-500/30 px-3 text-[10px] font-bold text-orange-400 hover:bg-orange-500/10"
                >
                  {item.action}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
