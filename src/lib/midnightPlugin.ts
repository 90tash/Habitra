import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ReminderPermissionStatus {
  notifications: boolean;
  exactAlarm: boolean;
  fullScreenIntent: boolean;
  overlay: boolean;
}

export interface MidnightPlugin {
  schedule(): Promise<{ exact: boolean }>;
  checkTrigger(): Promise<{ isMidnightAlarm: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  checkReminderPermissions(): Promise<ReminderPermissionStatus>;
  requestNotificationPermission(): Promise<void>;
  requestExactAlarmPermission(): Promise<void>;
  requestFullScreenIntentPermission(): Promise<void>;
}

const Midnight = registerPlugin<MidnightPlugin>('Midnight');

export const isMidnightPluginAvailable = () => Capacitor.getPlatform() !== 'android' || Capacitor.isPluginAvailable('Midnight');

export default Midnight;
