import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import HabitCard from '@/components/habits/HabitCard';
import DayProgress from '@/components/habits/DayProgress';
import StreakBadge from '@/components/habits/StreakBadge';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import MidnightPopup from '@/components/habits/MidnightPopup';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import { getTodayStr, getGreeting, getRandomQuote } from '@/lib/habitUtils';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { evaluateBadges, Badge } from '@/lib/gamification';
import type { Habit, DailyLog, DailyLogInput } from '@/lib/types';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [midnightCheckDate, setMidnightCheckDate] = useState<string>(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [footerQuote] = useState(() => getRandomQuote());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const todayStr = getTodayStr();
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Using Repository pattern for all data access
  const { data: habits = [], isLoading: habitsLoading, isError: habitsError } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: HabitRepository.listActive,
  });
  const { data: todayLogs = [] } = useQuery<DailyLog[]>({
    queryKey: ['dailyLogs', todayStr],
    queryFn: LogRepository.forToday,
  });
  const { data: yesterdayLogs = [] } = useQuery<DailyLog[]>({
    queryKey: ['dailyLogs', yesterdayStr],
    queryFn: () => LogRepository.forDate(yesterdayStr),
  });
  const { data: allLogs = [] } = useQuery<DailyLog[]>({
    queryKey: ['allLogs'],
    queryFn: () => LogRepository.recent(500),
  });

  const checkLogs = midnightCheckDate === todayStr ? todayLogs : yesterdayLogs;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    queryClient.invalidateQueries({ queryKey: ['allLogs'] });
  };

  const createHabitMutation = useMutation({
    mutationFn: HabitRepository.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
  const createLogMutation = useMutation({
    mutationFn: (data: DailyLogInput) => LogRepository.upsert(data.habit_id, data.date, data.current_value, data.target_value, data.is_completed),
    onSuccess: invalidate,
  });
  const updateLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DailyLog> }) => LogRepository.update(id, data),
    onSuccess: invalidate,
  });
  const getLogForHabit = (habitId: string) => todayLogs.find(l => l.habit_id === habitId);

  const checkBadges = async (targetHabit: Habit, isNowComplete: boolean) => {
    if (!isNowComplete) return;

    // Check badges before
    const badgesBefore = evaluateBadges(habits, allLogs);
    
    // Simulate updated state for immediate feedback
    const simulatedLogs = [...allLogs];
    const existingLogIdx = simulatedLogs.findIndex(l => l.habit_id === targetHabit.id && l.date === todayStr);
    
    if (existingLogIdx !== -1) {
      simulatedLogs[existingLogIdx] = { ...simulatedLogs[existingLogIdx], is_completed: true };
    } else {
      simulatedLogs.push({ 
        id: 'temp', habit_id: targetHabit.id, date: todayStr, is_completed: true, 
        current_value: targetHabit.target_value, target_value: targetHabit.target_value, 
        completed_at: new Date().toISOString(), notes: '' 
      });
    }

    const simulatedHabits = habits.map(h => h.id === targetHabit.id ? { ...h, current_streak: (h.current_streak || 0) + 1, best_streak: Math.max((h.current_streak || 0) + 1, h.best_streak || 0) } : h);
    
    const badgesAfter = evaluateBadges(simulatedHabits, simulatedLogs);
    const newBadge = badgesAfter.find(b => !badgesBefore.some(prev => prev.id === b.id));
    
    if (newBadge) {
      setUnlockedBadge(newBadge);
    }
  };

  const handleIncrement = async (habit: Habit, log?: DailyLog) => {
    const newVal = (log?.current_value || 0) + 1;
    const isComplete = newVal >= habit.target_value;
    
    if (log) {
      await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: newVal, is_completed: isComplete, completed_at: isComplete ? new Date().toISOString() : null } });
    } else {
      await createLogMutation.mutateAsync({ habit_id: habit.id, date: todayStr, current_value: newVal, target_value: habit.target_value, is_completed: isComplete });
    }
    
    if (isComplete) {
      await checkBadges(habit, true);
      await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
    }
  };

  const handleDecrement = async (habit: Habit, log?: DailyLog) => {
    if (!log || log.current_value <= 0) return;
    await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: log.current_value - 1, is_completed: false, completed_at: null } });
  };

  const handleComplete = async (habit: Habit, log?: DailyLog) => {
    if (log) {
      await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: habit.target_value, is_completed: true, completed_at: new Date().toISOString() } });
    } else {
      await createLogMutation.mutateAsync({ habit_id: habit.id, date: todayStr, current_value: habit.target_value, target_value: habit.target_value, is_completed: true });
    }
    await checkBadges(habit, true);
    await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
  };

  const handleAddHabit = () => {
    setShowCreate(true);
  };

  const completedCount = todayLogs.filter(l => l.is_completed).length;
  const bestStreak = useMemo(() => Math.max(...habits.map(h => h.best_streak || 0), 0), [habits]);
  const currentStreak = useMemo(() => Math.max(...habits.map(h => h.current_streak || 0), 0), [habits]);

  const handleTrigger = useCallback((targetDate: string) => {
    // Smart Priority Logic:
    // If we trigger for Today, first check if Yesterday is done.
    const today = getTodayStr();
    if (targetDate === today) {
      const yesterdayIncomplete = habits.some(h => {
        if (h.created_date) {
          const localCreatedDateStr = format(new Date(h.created_date), 'yyyy-MM-dd');
          if (localCreatedDateStr > yesterdayStr) return false;
        }
        const log = yesterdayLogs.find(l => l.habit_id === h.id);
        return !log?.is_completed;
      });

      if (yesterdayIncomplete) {
        setMidnightCheckDate(yesterdayStr);
        return;
      }
    }
    
    setMidnightCheckDate(targetDate);
  }, [habits, yesterdayLogs, yesterdayStr]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-5 pt-8 pb-32 space-y-7 min-h-screen flex flex-col">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-4xl font-bold font-space tracking-tight gradient-text leading-none">Today</h1>
          <p className="text-lg font-space font-bold text-foreground uppercase tracking-wider pt-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/notifications')}
            className="h-12 w-12 rounded-[18px] flex items-center justify-center bg-white/[0.03] border border-white/5 backdrop-blur-xl transition-all shadow-xl"
            aria-label="Notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
            onClick={handleAddHabit}
            className="h-12 w-12 rounded-[18px] flex items-center justify-center shadow-[0_8px_20px_-5px_hsl(var(--primary)/0.3)] glow-primary transition-all relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}
            aria-label="Add habit">
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            <Plus className="h-6 w-6 text-white relative z-10" />
          </motion.button>
        </div>
      </motion.div>

      {/* Day Progress & Streaks */}
      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <DayProgress completed={completedCount} total={habits.length} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3.5">
          <StreakBadge streak={currentStreak} label="Active Streak" />
          <StreakBadge streak={bestStreak} label="All-Time Best" accent />
        </motion.div>
      </div>

      {/* Habits list */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 mt-2 px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Today&apos;s Rituals</h2>
          {habits.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {completedCount}/{habits.length}
              </span>
            </div>
          )}
        </div>

        {habitsLoading ? (
          <LoadingState count={3} />
        ) : habitsError ? (
          <div className="rounded-3xl p-8 text-center text-xs text-muted-foreground bg-white/[0.02] border border-white/5 backdrop-blur-md">
            Failed to load habits. Pull to refresh.
          </div>
        ) : (
          <div className="space-y-4">
            {habits.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {habits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} log={getLogForHabit(habit.id)}
                      onIncrement={handleIncrement} onDecrement={handleDecrement} onComplete={handleComplete} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className={`flex flex-col ${habits.length > 0 ? 'pt-1' : 'pt-4'}`}>
              <Button 
                onClick={handleAddHabit}
                className="w-full h-12 rounded-[22px] text-white shadow-2xl glow-primary transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">
                  {habits.length === 0 ? 'Create Your First Habit' : 'Create a New Habit'}
                </span>
              </Button>
              {habits.length === 0 && (
                <p className="text-[10px] text-muted-foreground/40 text-center mt-4 uppercase tracking-[0.3em] font-black">
                  Start your journey today
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Trademark Style Footer Quote */}
      <motion.div 
        variants={itemVariants}
        className="pt-6 pb-4 text-center border-t border-foreground/10 mt-auto relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background">
          <div className="h-1 w-1 rounded-full bg-foreground/20" />
        </div>
        <div className="px-10 mt-2">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium italic">
            &ldquo;{footerQuote.text}&rdquo;
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-[1px] w-4 bg-foreground/10" />
            <p className="text-[9px] text-primary/40 font-black uppercase tracking-[0.2em]">{footerQuote.author}</p>
            <div className="h-[1px] w-4 bg-foreground/10" />
          </div>
        </div>
      </motion.div>

      <CreateHabitSheet open={showCreate} onClose={() => setShowCreate(false)} editHabit={null}
        onSave={(data) => createHabitMutation.mutate(data)} />


      <MidnightPopup habits={habits} logs={checkLogs} date={midnightCheckDate}
        onTrigger={handleTrigger}
        onSaveProgress={async (habit: Habit, log: DailyLog | undefined, value: number, completed: boolean, targetDate: string) => {
          if (log) {
            await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: value, is_completed: completed, completed_at: completed ? new Date().toISOString() : null } });
          } else {
            await createLogMutation.mutateAsync({ habit_id: habit.id, date: targetDate, current_value: value, target_value: habit.target_value, is_completed: completed });
          }
          if (completed) await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
        }}
      />

      <BadgeUnlockToast badge={unlockedBadge} onClose={() => setUnlockedBadge(null)} />
    </motion.div>
  );
}
