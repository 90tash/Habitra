import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import type { HabitCategory } from './types';

export const HABIT_COLORS = [
  '#7C5CFC', '#5CE1E6', '#FF6B6B', '#FFD93D', '#6BCB77',
  '#4D96FF', '#FF8FB1', '#A66CFF', '#FF9F45', '#54BAB9'
];

export const HABIT_CATEGORIES: Array<{ value: HabitCategory; label: string; icon: string }> = [
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'fitness', label: 'Fitness', icon: '🏋️' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'productivity', label: 'Productivity', icon: '⚡' },
  { value: 'social', label: 'Social', icon: '👥' },
  { value: 'creativity', label: 'Creativity', icon: '🎨' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'other', label: 'Other', icon: '✨' }
];

export const HABIT_ICONS = [
  '💧', '📖', '🏃', '🧘', '💪', '🎯', '📝', '🍎', '😴', '🧠',
  '🎵', '🌱', '☕', '💊', '🚶', '🎨', '💻', '🧹', '🙏', '📱'
];

export const MOTIVATIONAL_QUOTES = [
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Your habits shape your identity, and your identity shapes your habits.", author: "James Clear" },
  { text: "Every action you take is a vote for the person you wish to become.", author: "James Clear" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Consistency is more important than perfection.", author: "Unknown" }
];

export function getRandomQuote() {
  const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[idx];
}

export function getTodayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getProgressPercent(current: number, target: number) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getWeekDays() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getLast30Days() {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export function getCategoryInfo(category: HabitCategory) {
  return HABIT_CATEGORIES.find(c => c.value === category) || HABIT_CATEGORIES[8];
}
