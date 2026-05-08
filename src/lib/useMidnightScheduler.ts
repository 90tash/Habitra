// @ts-nocheck
/**
 * useMidnightScheduler
 * 
 * Watches the clock and fires a callback at exactly midnight (00:00).
 * Also supports a "snooze" mechanism that re-fires after N minutes.
 * Persists dismissal state in localStorage so it only triggers once per day.
 */
import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'habitra-midnight-session';

export function getMidnightSessionKey() {
  return new Date().toDateString();
}

export function getMidnightSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMidnightSession(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...data,
    date: new Date().toDateString(),
    savedAt: new Date().toISOString(),
  }));
}

export function clearMidnightSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isMidnightSessionDismissedToday() {
  const session = getMidnightSession();
  return session?.date === new Date().toDateString() && session?.dismissed === true;
}

export function useMidnightScheduler({ onTrigger, enabled = true }) {
  const snoozeTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const firedRef = useRef(false);

  const trigger = useCallback(() => {
    if (!enabled) return;
    onTrigger?.();
  }, [onTrigger, enabled]);

  const snooze = useCallback((minutes = 10) => {
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    snoozeTimeoutRef.current = setTimeout(() => {
      trigger();
    }, minutes * 60 * 1000);
  }, [trigger]);

  useEffect(() => {
    if (!enabled) return;

    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const todayKey = now.toDateString();

      // Fire at midnight (00:00) or if it's already past midnight and not fired yet today
      const isMidnight = h === 0 && m === 0;

      // Also check: if it's between 00:00 and 00:05 and we haven't fired today yet
      const isJustPastMidnight = h === 0 && m <= 5;

      const session = getMidnightSession();
      const firedToday = session?.date === todayKey && session?.triggered === true;

      if ((isMidnight || (isJustPastMidnight && !firedRef.current)) && !firedToday) {
        firedRef.current = true;
        saveMidnightSession({ triggered: true, dismissed: false });
        trigger();
      }

      // Reset firedRef at 00:06 for next day
      if (h === 0 && m >= 6) {
        firedRef.current = false;
      }
      if (h > 0) {
        firedRef.current = false;
      }
    };

    checkTime();
    intervalRef.current = setInterval(checkTime, 30 * 1000); // check every 30 seconds

    return () => {
      clearInterval(intervalRef.current);
      if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    };
  }, [enabled, trigger]);

  return { snooze };
}
