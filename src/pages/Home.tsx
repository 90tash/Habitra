// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

import HabitCard from '@/components/habits/HabitCard';
import DayProgress from '@/components/habits/DayProgress';
import QuoteCard from '@/components/habits/QuoteCard';
import StreakBadge from '@/components/habits/StreakBadge';
import HeatmapCalendar from '@/components/habits/HeatmapCalendar';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import MidnightPopup from '@/components/habits/MidnightPopup';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { getTodayStr, getGreeting } from '@/lib/habitUtils';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { canAddHabit } from '@/lib/subscription';

// Free tier limit badge shown when approaching/at limit
function FreeLimitBanner({ habitCount, onUpgrade }) {
  if (habitCount < 4) return null;
  const atLimit = habitCount >= 5;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${atLimit ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/8 border border-primary/15'}`}>
      <Lock className={`h-4 w-4 shrink-0 ${atLimit ? 'text-destructive' : 'text-primary'}`} />
      <div className="flex-1">
        <p className="text-xs font-semibold">{atLimit ? 'Habit limit reached' : `${5 - habitCount} free slot${5 - habitCount !== 1 ? 's' : ''} left`}</p>
        <p className="text-[10px] text-muted-foreground">Upgrade to Premium for unlimited habits</p>
      </div>
      <button onClick={onUpgrade} className="text-[10px] font-bold text-primary whitespace-nowrap hover:underline">
        Upgrade →
      </button>
    </motion.div>
  );
}

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
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();
  const todayStr = getTodayStr();

  // Using Repository pattern for all data access
  const { data: habits = [], isLoading: habitsLoading, isError: habitsError } = useQuery({
    queryKey: ['habits'],
    queryFn: HabitRepository.listActive,
  });
  const { data: todayLogs = [] } = useQuery({
    queryKey: ['dailyLogs', todayStr],
    queryFn: LogRepository.forToday,
  });
  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: () => LogRepository.recent(500),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    queryClient.invalidateQueries({ queryKey: ['allLogs'] });
  };

  const createHabitMutation = useMutation({
    mutationFn: HabitRepository.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
  const createLogMutation = useMutation({
    mutationFn: (data) => LogRepository.upsert(data.habit_id, data.date, data.current_value, data.target_value, data.is_completed),
    onSuccess: invalidate,
  });
  const updateLogMutation = useMutation({
    mutationFn: ({ id, data }) => LogRepository.update(id, data),
    onSuccess: invalidate,
  });
  const getLogForHabit = (habitId) => todayLogs.find(l => l.habit_id === habitId);

  const handleIncrement = async (habit, log) => {
    const newVal = (log?.current_value || 0) + 1;
    const isComplete = newVal >= habit.target_value;
    if (log) {
      await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: newVal, is_completed: isComplete, completed_at: isComplete ? new Date().toISOString() : null } });
    } else {
      await createLogMutation.mutateAsync({ habit_id: habit.id, date: todayStr, current_value: newVal, target_value: habit.target_value, is_completed: isComplete });
    }
    if (isComplete) await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
  };

  const handleDecrement = async (habit, log) => {
    if (!log || log.current_value <= 0) return;
    await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: log.current_value - 1, is_completed: false, completed_at: null } });
  };

  const handleComplete = async (habit, log) => {
    if (log) {
      await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: habit.target_value, is_completed: true, completed_at: new Date().toISOString() } });
    } else {
      await createLogMutation.mutateAsync({ habit_id: habit.id, date: todayStr, current_value: habit.target_value, target_value: habit.target_value, is_completed: true });
    }
    await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
  };

  const handleAddHabit = () => {
    // Free tier: max 5 habits
    if (!canAddHabit(null, habits.length)) {
      setShowPaywall(true);
      return;
    }
    setShowCreate(true);
  };

  const completedCount = todayLogs.filter(l => l.is_completed).length;
  const bestStreak = useMemo(() => Math.max(...habits.map(h => h.best_streak || 0), 0), [habits]);
  const currentStreak = useMemo(() => Math.max(...habits.map(h => h.current_streak || 0), 0), [habits]);

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
        <motion.button
          whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04 }}
          onClick={handleAddHabit}
          className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg glow-primary transition-all"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}
          aria-label="Add habit">
          <Plus className="h-5 w-5 text-white" />
        </motion.button>
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

      {/* Free tier limit banner */}
      <motion.div variants={itemVariants}>
        <FreeLimitBanner habitCount={habits.length} onUpgrade={() => setShowPaywall(true)} />
      </motion.div>

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

      <CreateHabitSheet open={showCreate} onClose={() => setShowCreate(false)}
        onSave={(data) => createHabitMutation.mutate(data)} />

      {/* Lazy-load Paywall */}
      <AnimatePresence>
        {showPaywall && (
          <PaywallLazy onClose={() => setShowPaywall(false)} onUpgrade={() => setShowPaywall(false)} />
        )}
      </AnimatePresence>

      <MidnightPopup habits={habits} logs={todayLogs} onMarkComplete={handleComplete}
        onSaveProgress={async (habit, log, value, completed) => {
          if (log) {
            await updateLogMutation.mutateAsync({ id: log.id, data: { current_value: value, is_completed: completed, completed_at: completed ? new Date().toISOString() : null } });
          } else {
            await createLogMutation.mutateAsync({ habit_id: habit.id, date: todayStr, current_value: value, target_value: habit.target_value, is_completed: completed });
          }
          if (completed) await HabitRepository.updateStreak(habit, true).then(() => queryClient.invalidateQueries({ queryKey: ['habits'] }));
        }}
      />
    </motion.div>
  );
}

// Inline lazy wrapper — avoids importing Paywall at module level
function PaywallLazy({ onClose, onUpgrade }) {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('@/pages/Paywall').then(m => setComp(() => m.default));
  }, []);
  if (!Comp) return null;
  return <Comp onClose={onClose} onUpgrade={onUpgrade} />;
}
