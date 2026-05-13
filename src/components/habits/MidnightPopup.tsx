import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, CheckCheck, Bell, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { format, subDays } from 'date-fns';
import Midnight from '@/lib/midnightPlugin';

import MidnightHabitRow from './MidnightHabitRow';
import MidnightCompletionScreen from './MidnightCompletionScreen';
import {
  useMidnightScheduler,
  saveMidnightSession,
  getMidnightSession,
} from '@/lib/useMidnightScheduler';
import type { Habit, DailyLog } from '@/lib/types';

const MAX_SNOOZES = 3;
const SNOOZE_MINUTES = 10;

interface MidnightPopupProps {
  habits: Habit[];
  logs: DailyLog[];
  date: string;
  onTrigger: (date: string) => void;
  onSaveProgress: (habit: Habit, log: DailyLog | undefined, value: number, completed: boolean, date: string) => Promise<void>;
}

export default function MidnightPopup({ habits, logs, date, onTrigger, onSaveProgress }: MidnightPopupProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'habits' | 'result'>('habits');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [snoozeCountdown, setSnoozeCountdown] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const incompleteHabits = habits.filter(h => {
    if (h.created_date) {
      const localCreatedDateStr = format(new Date(h.created_date), 'yyyy-MM-dd');
      if (date < localCreatedDateStr) return false;
    }
    const log = logs.find(l => l.habit_id === h.id);
    return !log?.is_completed;
  });

  const open = useCallback((triggerDate?: string) => {
    if (visible) return;
    if (incompleteHabits.length === 0) return;
    
    // Initialize centralized values from existing logs
    const initialValues: Record<string, number> = {};
    incompleteHabits.forEach(h => {
      const log = logs.find(l => l.habit_id === h.id);
      initialValues[h.id] = log?.current_value || 0;
    });
    setValues(initialValues);

    if (Capacitor.getPlatform() === 'android') {
      Midnight.dismiss().catch(() => {});
    }

    setPhase('habits');
    setVisible(true);
  }, [incompleteHabits, logs, visible]);

  useEffect(() => {
    const checkNativeTrigger = () => {
      if (Capacitor.getPlatform() === 'android') {
        Midnight.checkTrigger().then(res => {
          if (res.isMidnightAlarm) {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            onTrigger(todayStr);
          }
        });
      }
    };

    checkNativeTrigger();

    let appStateListener: any = null;
    const setupListener = async () => {
      appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          setTimeout(checkNativeTrigger, 500);
        }
      });
    };
    setupListener();

    const session = getMidnightSession();
    if (session?.lastPromptedDate === date && !session?.dismissed) {
      setTimeout(() => open(date), 50);
    }

    return () => {
      if (appStateListener) appStateListener.remove();
    };
  }, [open, date, onTrigger]);  

  useEffect(() => {
    if (visible && incompleteHabits.length === 0 && phase === 'habits' && !saving) {
      setVisible(false);
    }
  }, [visible, incompleteHabits.length, phase, saving]);

  const { snooze } = useMidnightScheduler({ 
    onTrigger: useCallback((d: string) => {
      onTrigger(d);
      setTimeout(() => open(d), 100);
    }, [onTrigger, open]), 
    enabled: true,
    habits
  });

  const handleHabitChange = (habitId: string, val: number) => {
    setValues(prev => ({ ...prev, [habitId]: val }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const savePromises = incompleteHabits.map(habit => {
        const value = values[habit.id] ?? (logs.find(l => l.habit_id === habit.id)?.current_value || 0);
        const log = logs.find(l => l.habit_id === habit.id);
        const completed = value >= (habit.target_value || 1);
        return onSaveProgress(habit, log, value, completed, date);
      });

      await Promise.all(savePromises);

      const alreadyDone = logs.filter(l => l.is_completed).length;
      const completedNow = incompleteHabits.filter(h => (values[h.id] ?? 0) >= (h.target_value || 1)).length;
      
      saveMidnightSession({ lastPromptedDate: date, dismissed: true, completedCount: alreadyDone + completedNow });
      
      if (Capacitor.getPlatform() === 'android') {
        Midnight.dismiss().catch(() => {});
      }

      setPhase('result');
    } catch (error) {
      console.error('Failed to save habit progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAll = () => {
    const allCompleted: Record<string, number> = {};
    incompleteHabits.forEach(habit => {
      allCompleted[habit.id] = habit.target_value || 1;
    });
    setValues(allCompleted);
  };

  const handleSnooze = () => {
    if (snoozeCount >= MAX_SNOOZES) return;
    setSnoozeCount(prev => prev + 1);
    setVisible(false);
    saveMidnightSession({ lastPromptedDate: date, dismissed: false, snoozed: true });

    if (Capacitor.getPlatform() === 'android') {
      Midnight.dismiss().catch(() => {});
    }

    let remaining = SNOOZE_MINUTES * 60;
    setSnoozeCountdown(remaining);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      remaining--;
      setSnoozeCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setSnoozeCountdown(null);
      }
    }, 1000);
    snooze(date, SNOOZE_MINUTES);
  };

  const handleDismiss = () => {
    saveMidnightSession({ lastPromptedDate: date, dismissed: true });
    if (Capacitor.getPlatform() === 'android') {
      Midnight.dismiss().catch(() => {});
    }
    setVisible(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSnoozeCountdown(null);
  };

  const handleResultClose = () => {
    setVisible(false);
    setPhase('habits');
  };

  const alreadyCompleted = logs.filter(l => l.is_completed).length;
  const totalHabits = habits.length;
  const isYesterday = date !== format(new Date(), 'yyyy-MM-dd');

  const motivationalHeader = () => {
    if (isYesterday) return "You missed yesterday's check-in! Don't worry, you can still log your progress now.";
    const ratio = totalHabits > 0 ? alreadyCompleted / totalHabits : 0;
    if (ratio >= 0.8) return 'Almost there — finish strong! 💪';
    if (ratio >= 0.5) return "You're past halfway — great work! ⚡";
    return 'One last chance to close today strong.';
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {snoozeCountdown !== null && !visible && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-primary/90 text-primary-foreground rounded-full px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            Reminder in {formatCountdown(snoozeCountdown)}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex flex-col"
            style={{ background: 'rgba(8,10,22,0.95)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #7C5CFC 0%, transparent 70%)' }} />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, #4ECDC4 0%, transparent 70%)' }} />
            </div>

            <AnimatePresence mode="wait">
              {phase === 'habits' ? (
                <motion.div
                  key="habits"
                  initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="relative flex flex-col h-full max-w-md mx-auto w-full px-4"
                >
                  <div className="pt-12 pb-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 4 }}
                          className="h-11 w-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center"
                        >
                          <Moon className="h-5 w-5 text-primary" />
                        </motion.div>
                        <div>
                          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
                            {isYesterday ? "Yesterday's Catch-Up" : 'Daily Check-In'}
                          </p>
                          <h1 className="text-xl font-bold font-space text-white leading-tight mt-0.5">
                            {isYesterday ? "Yesterday's Habits" : `${incompleteHabits.length} habit${incompleteHabits.length !== 1 ? 's' : ''} unfinished`}
                          </h1>
                        </div>
                      </div>
                      {snoozeCount < MAX_SNOOZES && (
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-white/40 hover:text-white" onClick={handleSnooze}>
                          <Bell className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-white/50 mt-3 leading-relaxed">{motivationalHeader()}</p>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          animate={{ width: `${totalHabits > 0 ? (alreadyCompleted / totalHabits) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/40">{alreadyCompleted}/{totalHabits} done</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pb-2">
                    {incompleteHabits.map((habit, i) => (
                      <MidnightHabitRow
                        key={habit.id}
                        habit={habit}
                        log={logs.find(l => l.habit_id === habit.id)}
                        value={values[habit.id] ?? 0}
                        index={i}
                        onChange={(v) => handleHabitChange(habit.id, v)}
                      />
                    ))}
                  </div>

                  <div className="pt-4 pb-8 space-y-2.5">
                    {incompleteHabits.length > 1 && (
                      <Button variant="ghost" className="w-full h-10 text-white/50 text-xs font-medium gap-1.5" onClick={handleCompleteAll}>
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all as completed
                      </Button>
                    )}
                    <Button onClick={handleSaveAll} disabled={saving}
                      className="w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg border-0">
                      {saving ? 'Saving...' : 'Save & Close'}
                    </Button>
                    <div className="flex gap-2">
                      {snoozeCount < MAX_SNOOZES && (
                        <Button variant="ghost" className="flex-1 h-10 text-white/40 text-xs" onClick={handleSnooze}>
                          <Clock className="h-3.5 w-3.5 mr-1.5" /> Remind in {SNOOZE_MINUTES}m
                        </Button>
                      )}
                      <Button variant="ghost" className="flex-1 h-10 text-white/30 text-xs" onClick={handleDismiss}>
                        <X className="h-3.5 w-3.5 mr-1.5" /> Maybe later
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex-1 max-w-md mx-auto w-full">
                  <MidnightCompletionScreen completedCount={alreadyCompleted + incompleteHabits.filter(h => (values[h.id] ?? 0) >= (h.target_value || 1)).length} totalCount={totalHabits} onClose={handleResultClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
