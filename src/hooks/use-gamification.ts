import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Habit, DailyLog } from '@/lib/types';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { 
  computeTotalXP, 
  getLevelForXP, 
  getLevelProgress, 
  getNextLevel,
  evaluateBadges,
  calcConsistencyScore,
  generateInsights
} from '@/lib/gamification';

/**
 * useGamification
 * 
 * Centralized hook to compute all gamification and insight data.
 * Memoizes results to prevent expensive re-calculations on every render.
 */
export function useGamification() {
  const { data: habits = [] } = useQuery<Habit[]>({ 
    queryKey: ['habits'], 
    queryFn: HabitRepository.list,
  });

  const { data: allLogs = [] } = useQuery<DailyLog[]>({ 
    queryKey: ['allLogs'], 
    queryFn: () => LogRepository.recent(1000),
  });

  return useMemo(() => {
    const xp = computeTotalXP(allLogs, habits);
    const level = getLevelForXP(xp);
    const progress = getLevelProgress(xp);
    const nextLevel = getNextLevel(xp);
    const unlockedBadges = evaluateBadges(habits, allLogs);
    const consistencyScore = calcConsistencyScore(allLogs, habits);
    const insights = generateInsights(habits, allLogs);

    // Favourite/Least Favourite logic
    const habitStats = habits.length > 0 ? habits.map(h => {
      const completions = allLogs.filter(l => l.habit_id === h.id && l.is_completed).length;
      return { ...h, completions };
    }).sort((a, b) => b.completions - a.completions) : [];

    return {
      xp,
      level,
      progress,
      nextLevel,
      unlockedBadges,
      consistencyScore,
      insights,
      habits,
      allLogs,
      stats: {
        favourite: habitStats[0] || null,
        leastFavourite: habitStats[habitStats.length - 1] || null,
      }
    };
  }, [habits, allLogs]);
}
