// @ts-nocheck
/**
 * Onboarding state management.
 * Tracks whether the user has completed onboarding and which step they're on.
 */

const KEY = 'hp_onboarding_v2';

export function isOnboardingComplete() {
  try { return localStorage.getItem(KEY) === 'done'; }
  catch { return true; }
}

export function markOnboardingComplete() {
  try { localStorage.setItem(KEY, 'done'); }
  catch {}
}

export function resetOnboarding() {
  try { localStorage.removeItem(KEY); }
  catch {}
}

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome to Habitra',
    subtitle: 'Your personal habit tracker & life coach',
    description: 'Build powerful daily habits, track your streaks, and unlock your potential — one day at a time.',
    cta: 'Get Started',
  },
  {
    id: 'tracking',
    emoji: '📊',
    title: 'Track What Matters',
    subtitle: 'Visual progress, every day',
    description: 'See your streaks grow, visualize your consistency with heatmaps, and celebrate every win.',
    cta: 'Sounds Good',
  },
  {
    id: 'gamification',
    emoji: '🏆',
    title: 'Level Up Your Life',
    subtitle: 'Earn XP & unlock achievements',
    description: 'Complete habits to earn XP, level up your profile, and unlock badges that celebrate your progress.',
    cta: 'I\'m In',
  },
  {
    id: 'focus',
    emoji: '🎯',
    title: 'Focus Mode & More',
    subtitle: 'Built-in Pomodoro & ambient sounds',
    description: 'Use Focus Mode with ambient sounds to stay in the zone during deep work sessions.',
    cta: 'Let\'s Go',
  },
];
