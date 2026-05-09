/**
 * useMidnightScheduler
 * 
 * Watches the clock and fires a callback at exactly midnight (00:00).
 * Also supports a "snooze" mechanism that re-fires after N minutes.
 * Persists dismissal state in localStorage so it only triggers once per day.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { subDays, format } from 'date-fns';
import { appStore } from '@/store/appStore';
import Midnight from './midnightPlugin';
...
export function useMidnightScheduler({ onTrigger, enabled = true }: UseMidnightSchedulerProps) {
  const snoozeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  const trigger = useCallback((date: string) => {
    if (!enabled) return;
    onTrigger?.(date);
  }, [onTrigger, enabled]);

  const snooze = useCallback((date: string, minutes = 10) => {
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    snoozeTimeoutRef.current = setTimeout(() => {
      trigger(date);
    }, minutes * 60 * 1000);
  }, [trigger]);

  useEffect(() => {
    if (!enabled) return;

    // Schedule native alarm if on Android
    if (Capacitor.getPlatform() === 'android') {
      Midnight.schedule().catch(err => console.error('Failed to schedule native midnight alarm:', err));
    }

    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      
      const preferences = appStore.getPreferences();
      const [endH, endM] = preferences.dayEndTime.split(':').map(Number);

      const todayStr = format(now, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');

      const session = getMidnightSession();

      // Case 1: Trigger at custom day end time (or within 5 mins)
      const isCustomTimeWindow = h === endH && m >= endM && m <= endM + 5;
      
      if (isCustomTimeWindow && !firedRef.current && session?.lastPromptedDate !== yesterdayStr) {
        firedRef.current = true;
        saveMidnightSession({ lastPromptedDate: yesterdayStr, triggeredAt: new Date().toISOString() });
        trigger(yesterdayStr);
        return;
      }

      // Case 2: "Catch-up" Mode
      // Trigger catch-up if we haven't prompted for yesterday yet and it's 5 hours past the day end time
      let catchUpHour = (endH + 5) % 24;
      if (h === catchUpHour && session?.lastPromptedDate !== yesterdayStr) {
        saveMidnightSession({ lastPromptedDate: yesterdayStr, isCatchUp: true });
        trigger(yesterdayStr);
      }

      // Reset firedRef when out of the trigger window
      if (h !== endH || m > endM + 5) {
        firedRef.current = false;
      }
    };

    // Delay first check slightly to let app initialize
    const timeout = setTimeout(checkTime, 2000);
    intervalRef.current = setInterval(checkTime, 60 * 1000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    };
  }, [enabled, trigger]);

  return { snooze };
}
