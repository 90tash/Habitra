import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, CheckCheck, Bell, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

import MidnightHabitRow from './MidnightHabitRow';
import MidnightCompletionScreen from './MidnightCompletionScreen';
import {
  useMidnightScheduler,
  saveMidnightSession,
  getMidnightSession,
  isMidnightSessionDismissedToday,
} from '@/lib/useMidnightScheduler';
import type { Habit, DailyLog } from '@/lib/types';

const MAX_SNOOZES = 3;
const SNOOZE_MINUTES = 10;

interface MidnightPopupProps {
  habits: Habit[];
  logs: DailyLog[];
  onSaveProgress: (habit: Habit, log: DailyLog | undefined, value: number, completed: boolean) => Promise<void>;
}

interface HabitChange {
  habit: Habit;
  log?: DailyLog;
  update: {
    value: number;
    completed: boolean;
    skipped: boolean;
  };
}

export default function MidnightPopup({ habits, logs, onSaveProgress }: MidnightPopupProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'habits' | 'result'>('habits');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [snoozeCountdown, setSnoozeCountdown] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, HabitChange>>({});
  const [saving, setSaving] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const incompleteHabits = habits.filter(h => {
    const log = logs.find(l => l.habit_id === h.id);
    return !log?.is_completed;
  });

  const open = useCallback(() => {
    if (isMidnightSessionDismissedToday()) return;
    if (incompleteHabits.length === 0) return;
    setPhase('habits');
    setPendingChanges({});
    setVisible(true);
  }, [incompleteHabits.length]);

  useEffect(() => {
    const session = getMidnightSession();
    const today = new Date().toDateString();
    if (session?.date === today && session?.triggered && !session?.dismissed) {
      setTimeout(open, 1200);
    }
  }, [open]);  

  const { snooze } = useMidnightScheduler({ onTrigger: open, enabled: true });

  const handleHabitChange = useCallback((habit: Habit, log: DailyLog | undefined, update: HabitChange['update']) => {
    setPendingChanges(prev => ({ ...prev, [habit.id]: { habit, log, update } }));
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    const changes = Object.values(pendingChanges);
    for (const { habit, log, update } of changes) {
      if (update.skipped) continue;
      await onSaveProgress(habit, log, update.value, update.completed);
    }
    const completedNow = changes.filter(c => c.update.completed).length;
    const alreadyDone = logs.filter(l => l.is_completed).length;
    const totalDone = completedNow + alreadyDone;
    saveMidnightSession({ triggered: true, dismissed: true, completedCount: totalDone });
    setSaving(false);
    setPhase('result');
  };

  const handleCompleteAll = () => {
    const allChanges: Record<string, HabitChange> = {};
    incompleteHabits.forEach(habit => {
      const log = logs.find(l => l.habit_id === habit.id);
      allChanges[habit.id] = { habit, log, update: { value: habit.target_value, completed: true, skipped: false } };
    });
    setPendingChanges(allChanges);
  };

  const handleSnooze = () => {
    if (snoozeCount >= MAX_SNOOZES) return;
    const newCount = snoozeCount + 1;
    setSnoozeCount(newCount);
    setVisible(false);
    saveMidnightSession({ triggered: true, dismissed: false, snoozed: true });

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
    snooze(SNOOZE_MINUTES);
  };


  const handleDismiss = () => {
    saveMidnightSession({ triggered: true, dismissed: true });
    setVisible(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSnoozeCountdown(null);
  };

  const handleResultClose = () => {
    setVisible(false);
    setPhase('habits');
  };

  const completedInPending = Object.values(pendingChanges).filter(c => c.update.completed).length;
  const alreadyCompleted = logs.filter(l => l.is_completed).length;
  const totalCompleted = completedInPending + alreadyCompleted;
  const totalHabits = habits.length;

  const motivationalHeader = () => {
    const ratio = totalHabits > 0 ? alreadyCompleted / totalHabits : 0;
    if (ratio >= 0.8) return 'Almost there — finish strong! 💪';
    if (ratio >= 0.5) return "You're past halfway — great work! ⚡";
    return 'One last chance to close today strong.';
  };

  const canSnooze = snoozeCount < MAX_SNOOZES;

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
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="relative flex flex-col h-full max-w-md mx-auto w-full px-4"
                >
                  <div className="pt-12 pb-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, -15, 15, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                          className="h-11 w-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center"
                        >
                          <Moon className="h-5 w-5 text-primary" />
                        </motion.div>
                        <div>
                          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
                            Midnight Check-In
                          </p>
                          <h1 className="text-xl font-bold font-space text-white leading-tight mt-0.5">
                            {incompleteHabits.length} habit{incompleteHabits.length !== 1 ? 's' : ''} unfinished
                          </h1>
                        </div>
                      </div>
                      {canSnooze && (
                        <Button size="icon" variant="ghost"
                          className="h-9 w-9 rounded-xl text-white/40 hover:text-white hover:bg-white/10 mt-1"
                          onClick={handleSnooze}>
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
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-[11px] text-white/40 whitespace-nowrap">
                        {alreadyCompleted}/{totalHabits} done
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pb-2">
                    {incompleteHabits.map((habit, i) => (
                      <MidnightHabitRow
                        key={habit.id}
                        habit={habit}
                        log={logs.find(l => l.habit_id === habit.id)}
                        index={i}
                        onChange={handleHabitChange}
                      />
                    ))}
                  </div>

                  <div className="pt-4 pb-8 space-y-2.5">
                    {incompleteHabits.length > 1 && (
                      <Button variant="ghost"
                        className="w-full h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 text-xs font-medium gap-1.5"
                        onClick={handleCompleteAll}>
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all as completed
                      </Button>
                    )}
                    <Button onClick={handleSaveAll} disabled={saving}
                      className="w-full h-12 rounded-2xl font-semibold text-sm bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 text-white shadow-lg shadow-primary/30 border-0">
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : 'Save & Close'}
                    </Button>
                    <div className="flex gap-2">
                      {canSnooze && (
                        <Button variant="ghost"
                          className="flex-1 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 text-xs gap-1.5"
                          onClick={handleSnooze}>
                          <Clock className="h-3.5 w-3.5" />
                          Remind in {SNOOZE_MINUTES}m
                          <span className="text-white/25">({MAX_SNOOZES - snoozeCount} left)</span>
                        </Button>
                      )}
                      <Button variant="ghost"
                        className="flex-1 h-10 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 text-xs gap-1.5"
                        onClick={handleDismiss}>
                        <X className="h-3.5 w-3.5" />
                        Skip tonight
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative flex-1 max-w-md mx-auto w-full">
                  <MidnightCompletionScreen
                    completedCount={totalCompleted}
                    totalCount={totalHabits}
                    onClose={handleResultClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
