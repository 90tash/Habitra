import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import HabitCard from '@/components/habits/HabitCard';
import DayProgress from '@/components/habits/DayProgress';
import QuoteCard from '@/components/habits/QuoteCard';
import StreakBadge from '@/components/habits/StreakBadge';
import HeatmapCalendar from '@/components/habits/HeatmapCalendar';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import MidnightPopup from '@/components/habits/MidnightPopup';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import { getTodayStr, getGreeting } from '@/lib/habitUtils';
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
        // Birth Date Check: Only habits created ON or BEFORE yesterday count.
        if (h.created_date && h.created_date.split('T')[0] > yesterdayStr) return false;
        
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
      className="px-4 pt-6 pb-28 space-y-4">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{getGreeting()}</p>
          <h1 className="text-3xl font-bold font-space mt-0.5 gradient-text">Habitra</h1>
          <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04 }}
            onClick={() => navigate('/notifications')}
            className="h-11 w-11 rounded-2xl flex items-center justify-center bg-muted/40 border border-border/40 transition-all"
            aria-label="Notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04 }}
            onClick={handleAddHabit}
            className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg glow-primary transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}
            aria-label="Add habit">
            <Plus className="h-5 w-5 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Day Progress */}
      <motion.div variants={itemVariants}>
        <DayProgress completed={completedCount} total={habits.length} />
      </motion.div>

      {/* Streak badges */}
      {habits.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <StreakBadge streak={currentStreak} label="Active Streak" />
          <StreakBadge streak={bestStreak} label="All-Time Best" accent />
        </motion.div>
      )}

      {/* Quote */}
      <motion.div variants={itemVariants}><QuoteCard /></motion.div>


      {/* Habits list */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Today's Habits</h2>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
            {completedCount}/{habits.length}
          </span>
        </div>

        {habitsLoading ? (
          <LoadingState count={3} />
        ) : habitsError ? (
          <div className="rounded-2xl p-6 text-center text-sm text-muted-foreground bg-muted/30">
            Failed to load habits. Pull to refresh.
          </div>
        ) : habits.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="Start your journey"
            description="Build habits that shape who you become — one day at a time"
            action={{ label: '✨ Create First Habit', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} log={getLogForHabit(habit.id)}
                  onIncrement={handleIncrement} onDecrement={handleDecrement} onComplete={handleComplete} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Heatmap */}
      {allLogs.length > 0 && (
        <motion.div variants={itemVariants}>
          <HeatmapCalendar logs={allLogs} weeks={10} />
        </motion.div>
      )}

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
