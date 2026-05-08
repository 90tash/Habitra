/**
 * Subscription / Monetization layer.
 * Free tier: up to 5 habits, basic stats.
 * Premium: unlimited habits, advanced analytics, premium themes, all badges, export.
 *
 * In production, integrate with Stripe or in-app billing here.
 * For now, premium status is stored on the user profile.
 */

export const PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
};

export const LIMITS = {
  [PLANS.FREE]: {
    maxHabits: 5,
    advancedStats: false,
    premiumThemes: false,
    exportData: false,
    unlimitedHistory: false,
  },
  [PLANS.PREMIUM]: {
    maxHabits: Infinity,
    advancedStats: true,
    premiumThemes: true,
    exportData: true,
    unlimitedHistory: true,
  },
};

export const PREMIUM_PRICE = '$3.99/month';
export const PREMIUM_PRICE_ANNUAL = '$29.99/year';

export function getPlan(user) {
  return user?.plan === PLANS.PREMIUM ? PLANS.PREMIUM : PLANS.FREE;
}

export function canAddHabit(user, currentHabitCount) {
  const plan = getPlan(user);
  return currentHabitCount < LIMITS[plan].maxHabits;
}

export function hasFeature(user, feature) {
  const plan = getPlan(user);
  return !!LIMITS[plan][feature];
}

export const PREMIUM_FEATURES = [
  { icon: '♾️', title: 'Unlimited Habits',    desc: 'Track as many habits as you want' },
  { icon: '📊', title: 'Advanced Analytics',  desc: 'Deep insights, trends & export' },
  { icon: '🎨', title: 'Premium Themes',      desc: 'AMOLED, custom accents & more' },
  { icon: '🏆', title: 'All Achievements',    desc: 'Unlock all badges & milestones' },
  { icon: '☁️', title: 'Cloud Backup',        desc: 'Sync across all your devices' },
  { icon: '📤', title: 'Export Data',         desc: 'CSV, JSON export of all logs' },
];