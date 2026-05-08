export const APP_FEATURES = {
  maxHabits: Infinity,
  advancedStats: true,
  customThemes: true,
  exportData: true,
  unlimitedHistory: true,
  achievements: true,
} as const;

export function canAddHabit() {
  return true;
}

export function hasFeature(feature: keyof typeof APP_FEATURES) {
  return Boolean(APP_FEATURES[feature]);
}
