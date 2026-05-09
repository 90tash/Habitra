import { registerPlugin } from '@capacitor/core';

export interface MidnightPlugin {
  schedule(): Promise<void>;
  checkTrigger(): Promise<{ isMidnightAlarm: boolean }>;
}

const Midnight = registerPlugin<MidnightPlugin>('Midnight');

export default Midnight;
