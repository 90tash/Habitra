// @ts-nocheck
/**
 * Gamification Engine — XP, Levels, Badges, Achievements
 */

export const LEVELS = [
  { level: 1, title: 'Seedling',    xpRequired: 0,    icon: '🌱' },
  { level: 2, title: 'Sprout',      xpRequired: 100,  icon: '🌿' },
  { level: 3, title: 'Grower',      xpRequired: 250,  icon: '🪴' },
  { level: 4, title: 'Builder',     xpRequired: 500,  icon: '🔨' },
  { level: 5, title: 'Achiever',    xpRequired: 900,  icon: '⚡' },
  { level: 6, title: 'Champion',    xpRequired: 1500, icon: '🏆' },
  { level: 7, title: 'Legend',      xpRequired: 2500, icon: '🌟' },
  { level: 8, title: 'Master',      xpRequired: 4000, icon: '💎' },
  { level: 9, title: 'Grandmaster', xpRequired: 6000, icon: '👑' },
  { level: 10,title: 'Transcendent',xpRequired: 9000, icon: '🔮' },
];

export const BADGES = [
  { id: 'first_habit',    title: 'First Step',      icon: '👟', desc: 'Complete your first habit',          xp: 25  },
  { id: 'streak_3',       title: 'On Fire',         icon: '🔥', desc: '3-day streak on any habit',          xp: 50  },
  { id: 'streak_7',       title: 'Week Warrior',    icon: '⚔️', desc: '7-day streak on any habit',          xp: 100 },
  { id: 'streak_14',      title: 'Fortnight Force', icon: '💪', desc: '14-day streak on any habit',         xp: 200 },
  { id: 'streak_30',      title: 'Monthly Master',  icon: '📅', desc: '30-day streak on any habit',         xp: 500 },
  { id: 'perfect_day',    title: 'Perfect Day',     icon: '✨', desc: 'Complete all habits in a day',       xp: 75  },
  { id: 'perfect_week',   title: 'Perfect Week',    icon: '🌟', desc: 'Perfect completion for 7 days',      xp: 300 },
  { id: 'five_habits',    title: 'Habit Stack',     icon: '📚', desc: 'Track 5 habits simultaneously',      xp: 100 },
  { id: 'early_bird',     title: 'Early Bird',      icon: '🐦', desc: 'Complete a habit before 8am',        xp: 50  },
  { id: 'night_owl',      title: 'Night Owl',       icon: '🦉', desc: 'Complete a habit after 10pm',        xp: 50  },
  { id: 'comeback',       title: 'Comeback Kid',    icon: '🔄', desc: 'Resume a habit after missing 3 days',xp: 75  },
  { id: 'centurion',      title: 'Centurion',       icon: '💯', desc: '100 total habit completions',        xp: 250 },
];

export function getLevelForXP(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(xp) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].xpRequired) return LEVELS[i];
  }
  return null; // max level
}

export function getLevelProgress(xp) {
  const current = getLevelForXP(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.xpRequired - current.xpRequired;
  const earned = xp - current.xpRequired;
  return Math.round((earned / range) * 100);
}

export function calcXPForCompletion(habit, isStreak = false) {
  let xp = 10; // base
  if (isStreak) xp += Math.min(habit.current_streak || 0, 20); // streak bonus, cap 20
  return xp;
}

// Compute total XP from all logs
export function computeTotalXP(logs, habits) {
  let xp = 0;
  const completedLogs = logs.filter(l => l.is_completed);
  completedLogs.forEach(log => {
    const habit = habits.find(h => h.id === log.habit_id);
    xp += habit ? calcXPForCompletion(habit) : 10;
  });
  return xp;
}

// Evaluate which badges are unlocked
export function evaluateBadges(habits, logs) {
  const unlocked = new Set();
  const totalCompleted = logs.filter(l => l.is_completed).length;

  if (totalCompleted >= 1) unlocked.add('first_habit');
  if (totalCompleted >= 100) unlocked.add('centurion');
  if (habits.length >= 5) unlocked.add('five_habits');

  const maxStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);
  if (maxStreak >= 3)  unlocked.add('streak_3');
  if (maxStreak >= 7)  unlocked.add('streak_7');
  if (maxStreak >= 14) unlocked.add('streak_14');
  if (maxStreak >= 30) unlocked.add('streak_30');

  // Perfect day: check if any single date has all habits completed
  const dateMap = {};
  logs.forEach(l => {
    if (!dateMap[l.date]) dateMap[l.date] = { total: 0, completed: 0 };
    dateMap[l.date].total++;
    if (l.is_completed) dateMap[l.date].completed++;
  });
  const habitCount = habits.filter(h => h.is_active).length;
  const hasPerfectDay = Object.values(dateMap).some(d => d.total >= habitCount && d.completed === d.total && habitCount > 0);
  if (hasPerfectDay) unlocked.add('perfect_day');

  return BADGES.filter(b => unlocked.has(b.id));
}

// Consistency score: % of days with ≥50% completion in last 30 days
export function calcConsistencyScore(logs, habits, days = 30) {
  const habitCount = habits.filter(h => h.is_active).length || 1;
  let activeDays = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter(l => l.date === dateStr);
    const completed = dayLogs.filter(l => l.is_completed).length;
    if (completed / habitCount >= 0.5) activeDays++;
  }
  return Math.round((activeDays / days) * 100);
}

// Smart insights
export function generateInsights(habits, logs) {
  const insights = [];
  if (logs.length === 0) return [{ icon: '👋', text: 'Start tracking habits to unlock insights.' }];

  const habitCount = habits.filter(h => h.is_active).length || 1;
  const last7 = logs.filter(l => {
    const d = new Date(l.date);
    return (new Date() - d) / 86400000 <= 7;
  });
  const rate7 = last7.length ? Math.round((last7.filter(l => l.is_completed).length / (habitCount * 7)) * 100) : 0;

  if (rate7 >= 80) insights.push({ icon: '🔥', text: `You're on a roll! ${rate7}% completion rate this week.` });
  else if (rate7 >= 50) insights.push({ icon: '⚡', text: `Solid week — ${rate7}% completion. Keep pushing!` });
  else if (rate7 < 30) insights.push({ icon: '💙', text: `Tough week with ${rate7}% completion. Progress, not perfection.` });

  const bestHabit = habits.reduce((best, h) => (h.current_streak || 0) > (best?.current_streak || 0) ? h : best, null);
  if (bestHabit?.current_streak > 1) {
    insights.push({ icon: '🏅', text: `"${bestHabit.title}" is your strongest habit — ${bestHabit.current_streak} day streak!` });
  }

  const weakHabit = habits.find(h => (h.current_streak || 0) === 0 && h.is_active);
  if (weakHabit) {
    insights.push({ icon: '🎯', text: `"${weakHabit.title}" needs attention — start a streak today.` });
  }

  const score = calcConsistencyScore(logs, habits);
  if (score >= 70) insights.push({ icon: '📈', text: `${score}% consistency over 30 days — excellent!` });
  else if (score > 0) insights.push({ icon: '📊', text: `${score}% consistency in 30 days. Small daily steps compound.` });

  return insights.slice(0, 4);
}