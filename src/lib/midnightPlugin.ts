import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ReminderPermissionStatus {
  notifications: boolean;
  exactAlarm: boolean;
  fullScreenIntent: boolean;
  overlay: boolean;
}

export interface MidnightPlugin {
  schedule(options: { hour: number; minute: number; reminderMethod?: string }): Promise<{ exact: boolean }>;
  cancel(): Promise<void>;
  dismiss(): Promise<void>;
  stopVibration(): Promise<void>;
  checkTrigger(): Promise<{ isMidnightAlarm: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  checkReminderPermissions(): Promise<ReminderPermissionStatus>;
  requestNotificationPermission(): Promise<void>;
  requestExactAlarmPermission(): Promise<void>;
  requestFullScreenIntentPermission(): Promise<void>;
  setPendingCount(options: { count: number }): Promise<void>;
}

const Midnight = registerPlugin<MidnightPlugin>('Midnight');

export const isMidnightPluginAvailable = () => Capacitor.getPlatform() !== 'android' || Capacitor.isPluginAvailable('Midnight');

export default Midnight;
