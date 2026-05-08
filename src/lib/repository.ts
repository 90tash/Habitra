import { LocalDataStore } from './localDataStore';
import { getTodayStr } from './habitUtils';
import type { DailyLog, Habit, HabitInput, LocalUser } from './types';

export const HabitRepository = {
  listActive: () => LocalDataStore.Habit.filter({ is_active: true }, 'sort_order'),
  list: () => LocalDataStore.Habit.list('sort_order'),
  create: (data: HabitInput) => LocalDataStore.Habit.create(data),
  update: (id: string, data: Partial<HabitInput>) => LocalDataStore.Habit.update(id, data),
  delete: async (id: string) => {
    await LocalDataStore.Habit.delete(id);
    await LocalDataStore.deleteLogsForHabit(id);
    return { id };
  },
  updateStreak: (habit: Habit, completed: boolean) => {
    if (!completed) return Promise.resolve();
    const newStreak = (habit.current_streak || 0) + 1;
    return LocalDataStore.Habit.update(habit.id, {
      current_streak: newStreak,
      best_streak: Math.max(newStreak, habit.best_streak || 0),
    });
  },
};

export const LogRepository = {
  forToday: () => LocalDataStore.DailyLog.filter({ date: getTodayStr() }),
  forDate: (date: string) => LocalDataStore.DailyLog.filter({ date }),
  recent: (limit = 500) => LocalDataStore.DailyLog.list('-date', limit),
  update: (id: string, data: Partial<DailyLog>) => LocalDataStore.DailyLog.update(id, data),
  upsert: async (habitId: string, date: string, currentValue: number, targetValue: number, completed: boolean) => {
    const existing = await LocalDataStore.DailyLog.filter({ habit_id: habitId, date });
    const payload = {
      habit_id: habitId,
      date,
      current_value: currentValue,
      target_value: targetValue,
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      notes: '',
    };
    if (existing.length > 0) return LocalDataStore.DailyLog.update(existing[0].id, payload);
    return LocalDataStore.DailyLog.create(payload);
  },
};

export const UserRepository = {
  me: async (): Promise<LocalUser> => ({ id: 'local-user', full_name: 'Local User', email: 'local@habitra.app' }),
  updateProfile: async (data: Partial<LocalUser>) => data,
};
