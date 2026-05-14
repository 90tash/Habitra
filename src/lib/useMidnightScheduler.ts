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
import { HabitRepository, LogRepository } from './repository';

const STORAGE_KEY = 'habitra-midnight-session-v2';

export type DateSession = {
  dismissed?: boolean;
  completedCount?: number;
  snoozed?: boolean;
  triggeredAt?: string;
  isCatchUp?: boolean;
  lastUpdate?: string;
};

export type MidnightSession = Record<string, DateSession>;

export function getMidnightSession(): MidnightSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MidnightSession;
  } catch {
    return {};
  }
}

export function saveMidnightSession(dateStr: string, data: Partial<DateSession>) {
  const session = getMidnightSession();
  const current = session[dateStr] || {};
  session[dateStr] = {
    ...current,
    ...data,
    lastUpdate: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearMidnightSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if we have already prompted the user for a specific date
 */
export function hasPromptedForDate(dateStr: string) {
  const session = getMidnightSession();
  return !!session[dateStr];
}

export function isMidnightSessionDismissed(dateStr: string) {
  const session = getMidnightSession();
  return session[dateStr]?.dismissed === true;
}

const updateNativePendingCount = async () => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    const activeHabits = await HabitRepository.listActive();
    const todayLogs = await LogRepository.forToday();
    
    const completedHabitIds = new Set(
      todayLogs.filter(log => log.is_completed).map(log => log.habit_id)
    );
    
    const pendingCount = activeHabits.filter(h => !completedHabitIds.has(h.id)).length;
    await Midnight.setPendingCount({ count: pendingCount });
  } catch (err) {
    console.error('Failed to update native pending count:', err);
  }
};

interface UseMidnightSchedulerProps {
  onTrigger: (date: string) => void;
  enabled?: boolean;
}

export function useMidnightScheduler({ onTrigger, enabled = true }: UseMidnightSchedulerProps) {
  const snoozeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const hasRunLaunchCheckRef = useRef(false);

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
        })
        .then(() => updateNativePendingCount())
        .catch(err => console.error('Failed to schedule native midnight alarm:', err));
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

      // Periodically update the pending count on Android
      if (m % 15 === 0) { // Every 15 minutes
        updateNativePendingCount();
      }

      // Case 1: Trigger at custom review time (or within 5 mins)
      // Only if reminders are enabled
      if (enabled) {
        const isCustomTimeWindow = h === revH && m >= revM && m <= revM + 5;
        if (isCustomTimeWindow && !firedRef.current && !session[todayStr]?.dismissed) {
          firedRef.current = true;
          // Refresh count right before trigger
          updateNativePendingCount().finally(() => {
            saveMidnightSession(todayStr, { triggeredAt: new Date().toISOString() });
            trigger(todayStr);
          });
          return;
        }

        // Case 2: "Catch-up" Mode (5 hours past review time)
        const catchUpHour = (revH + 5) % 24;
        if (h === catchUpHour && !session[todayStr]?.dismissed) {
          saveMidnightSession(todayStr, { isCatchUp: true });
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
      if (hasRunLaunchCheckRef.current) return;
      hasRunLaunchCheckRef.current = true;

      const yesterday = subDays(new Date(), 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      const session = getMidnightSession();
      const identity = appStore.getIdentity();

      // Birth Date Guard: If the app was installed AFTER yesterday, we never prompt for yesterday.
      if (identity.created_at) {
        const installDateStr = identity.created_at.split('T')[0];
        if (installDateStr > yesterdayStr) {
          return;
        }
      }

      // If we haven't dismissed or completed yesterday's prompt, trigger it
      if (!session[yesterdayStr]?.dismissed) {
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
