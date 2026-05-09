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
import Midnight from './midnightPlugin';

const STORAGE_KEY = 'habitra-midnight-session';

export function getMidnightSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMidnightSession(data: any) {
  const current = getMidnightSession() || {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...current,
    ...data,
    lastUpdate: new Date().toISOString(),
  }));
}

export function clearMidnightSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if we have already prompted the user for a specific date
 */
export function hasPromptedForDate(dateStr: string) {
  const session = getMidnightSession();
  return session?.lastPromptedDate === dateStr;
}

interface UseMidnightSchedulerProps {
  onTrigger: (date: string) => void;
  enabled?: boolean;
}

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
      
      const todayStr = format(now, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');

      const session = getMidnightSession();

      // Case 1: Exactly Midnight (or within 5 mins)
      // Trigger for "Yesterday" (the day that just ended)
      const isMidnightWindow = h === 0 && m <= 5;
      if (isMidnightWindow && !firedRef.current && session?.lastPromptedDate !== yesterdayStr) {
        firedRef.current = true;
        saveMidnightSession({ lastPromptedDate: yesterdayStr, triggeredAt: new Date().toISOString() });
        trigger(yesterdayStr);
        return;
      }

      // Case 2: "Catch-up" Mode
      // If we haven't prompted for yesterday yet, and it's later in the day
      if (h >= 5 && session?.lastPromptedDate !== yesterdayStr) {
        // We only trigger catch-up once per day
        saveMidnightSession({ lastPromptedDate: yesterdayStr, isCatchUp: true });
        trigger(yesterdayStr);
      }

      // Reset firedRef when out of midnight window
      if (h > 0 || m > 5) {
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
