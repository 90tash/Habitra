export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'mindfulness'
  | 'learning'
  | 'productivity'
  | 'social'
  | 'creativity'
  | 'finance'
  | 'other';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

export type EntityBase = {
  id: string;
  created_date?: string;
  updated_date?: string;
};

export type Habit = EntityBase & {
  title: string;
  description: string;
  icon: string;
  category: HabitCategory;
  color: string;
  frequency: HabitFrequency;
  timeOfDay: TimeOfDay;
  target_value: number;
  unit: string;
  reminder_time?: string;
  current_streak: number;
  best_streak: number;
  is_active: boolean;
  sort_order: number;
};

export type HabitInput = Omit<Habit, keyof EntityBase | 'current_streak' | 'best_streak'> & {
  current_streak?: number;
  best_streak?: number;
};

export type DailyLog = EntityBase & {
  habit_id: string;
  date: string;
  current_value: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  notes: string;
};

export type DailyLogInput = Omit<DailyLog, keyof EntityBase | 'completed_at' | 'notes'> & {
  completed_at?: string | null;
  notes?: string;
};



export type LocalUser = {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  tags?: string[];
  avatarUri?: string | null;
  bannerUri?: string | null;
  accentColor: string;
  created_at?: string;
};

export interface UserPreferences {
  dailyReviewTime: string; // e.g. "00:00"
  onboardingCompleted: boolean;
}

export type AuthError = {
  type: 'user_not_registered' | 'auth_required' | 'server_error';
  message?: string;
} | null;

