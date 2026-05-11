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
    const preferences = appStore.getPreferences();
    const [revH, revM] = (preferences.dailyReviewTime || '22:00').split(':').map(Number);

    // Schedule/Cancel native alarm if on Android
    if (Capacitor.getPlatform() === 'android') {
      if (enabled) {
        Midnight.schedule({ 
          hour: revH, 
          minute: revM,
          reminderMethod: preferences.reminderMethod || 'nag'
        }).catch(err => console.error('Failed to schedule native midnight alarm:', err));
      } else {
        Midnight.cancel().catch(err => console.error('Failed to cancel native midnight alarm:', err));
      }
    }

    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      
      const todayStr = format(now, 'yyyy-MM-dd');
      const preferences = appStore.getPreferences();
      const [revH, revM] = (preferences.dailyReviewTime || '22:00').split(':').map(Number);

      const session = getMidnightSession();

      // Case 1: Trigger at custom review time (or within 5 mins)
      // Only if reminders are enabled
      if (enabled) {
        const isCustomTimeWindow = h === revH && m >= revM && m <= revM + 5;
        if (isCustomTimeWindow && !firedRef.current && session?.lastPromptedDate !== todayStr) {
          firedRef.current = true;
          saveMidnightSession({ lastPromptedDate: todayStr, triggeredAt: new Date().toISOString() });
          trigger(todayStr);
          return;
        }

        // Case 2: "Catch-up" Mode (5 hours past review time)
        const catchUpHour = (revH + 5) % 24;
        if (h === catchUpHour && session?.lastPromptedDate !== todayStr) {
          saveMidnightSession({ lastPromptedDate: todayStr, isCatchUp: true });
          trigger(todayStr);
        }

        // Reset firedRef when out of the trigger window
        if (h !== revH || (m < revM || m > revM + 5)) {
          firedRef.current = false;
        }
      }
    };

    // App Launch Catch-up Check (Runs regardless of 'enabled' toggle for push reminders)
    const runLaunchCheck = () => {
      const yesterday = subDays(new Date(), 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      const session = getMidnightSession();

      // If we haven't dismissed or completed yesterday's prompt, trigger it
      if (session?.lastPromptedDate !== yesterdayStr || !session?.dismissed) {
        // We trigger for Yesterday
        onTrigger?.(yesterdayStr);
      }
    };

    // Delay checks slightly to let app initialize
    const launchTimeout = setTimeout(runLaunchCheck, 1500);
    const firstCheckTimeout = setTimeout(checkTime, 2500);
    intervalRef.current = setInterval(checkTime, 60 * 1000);

    return () => {
      clearTimeout(launchTimeout);
      clearTimeout(firstCheckTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    };
  }, [enabled, trigger]);

  return { snooze };
}
