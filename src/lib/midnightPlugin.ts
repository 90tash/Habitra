import { registerPlugin } from '@capacitor/core';

export interface MidnightPlugin {
  schedule(): Promise<void>;
  checkTrigger(): Promise<{ isMidnightAlarm: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
}

const Midnight = registerPlugin<MidnightPlugin>('Midnight');

export default Midnight;
