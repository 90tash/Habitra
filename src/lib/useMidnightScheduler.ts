/**
 * useMidnightScheduler
 * 
 * Watches the clock and fires a callback at the user-defined day end time.
 * Also supports a "snooze" mechanism that re-fires after N minutes.
 * Persists dismissal state in localStorage so it only triggers once per day.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { subDays, format } from 'date-fns';
import { appStore } from '@/store/appStore';
import Midnight from './midnightPlugin';

const STORAGE_KEY = 'habitra-midnight-session';

export type MidnightSession = {
  lastPromptedDate?: string;
  dismissed?: boolean;
  completedCount?: number;
  snoozed?: boolean;
  triggeredAt?: string;
  isCatchUp?: boolean;
  lastUpdate?: string;
};

export function getMidnightSession(): MidnightSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MidnightSession;
  } catch {
    return null;
  }
}

export function saveMidnightSession(data: Partial<MidnightSession>) {
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

export function isMidnightSessionDismissedToday(dateStr: string) {
  const session = getMidnightSession();
  return session?.lastPromptedDate === dateStr && session.dismissed === true;
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

    const preferences = appStore.getPreferences();
    const [revH, revM] = (preferences.dailyReviewTime || '22:00').split(':').map(Number);

    // Schedule native alarm if on Android
    if (Capacitor.getPlatform() === 'android') {
      Midnight.schedule({ hour: revH, minute: revM }).catch(err => console.error('Failed to schedule native midnight alarm:', err));
    }

    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      
      const identity = appStore.getIdentity();
      const createdDate = identity.created_at ? new Date(identity.created_at) : now;
      const isFirstDay = createdDate.toDateString() === now.toDateString();

      const preferences = appStore.getPreferences();
      const [revH, revM] = (preferences.dailyReviewTime || '22:00').split(':').map(Number);

      // Smart Date Logic:
      // If the review time is between 00:00 and 05:59, we are asking about "Yesterday".
      // If the review time is between 06:00 and 23:59, we are asking about "Today".
      const isLateNightReview = revH >= 0 && revH < 6;
      const targetDate = isLateNightReview 
        ? subDays(now, 1) // Reviewing yesterday
        : now;            // Reviewing today
      
      const targetDateStr = format(targetDate, 'yyyy-MM-dd');
      const session = getMidnightSession();

      // Case 1: Trigger at custom review time (or within 5 mins)
      const isCustomTimeWindow = h === revH && m >= revM && m <= revM + 5;
      
      if (isCustomTimeWindow && !firedRef.current && session?.lastPromptedDate !== targetDateStr) {
        firedRef.current = true;
        saveMidnightSession({ lastPromptedDate: targetDateStr, triggeredAt: new Date().toISOString() });
        trigger(targetDateStr);
        return;
      }

      // Case 2: "Catch-up" Mode (5 hours past review time)
      const catchUpHour = (revH + 5) % 24;
      if (h === catchUpHour && session?.lastPromptedDate !== targetDateStr) {
        saveMidnightSession({ lastPromptedDate: targetDateStr, isCatchUp: true });
        trigger(targetDateStr);
      }

      // Reset firedRef when out of the trigger window
      if (h !== revH || (m < revM || m > revM + 5)) {
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
