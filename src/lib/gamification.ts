import { Habit, DailyLog } from './types';

/**
 * Gamification Engine — XP, Levels, Badges, Achievements
 */

export interface Level {
  level: number;
  title: string;
  subtitle: string;
  folklore: string;
  xpRequired: number;
  tier: 'Initiate' | 'Builder' | 'Legend';
  color: string;
  isRare?: boolean;
  isApex?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  icon: string;
  desc: string;
  xp: number;
  minRank?: number;
}

export const LEVELS: Level[] = [
  { 
    level: 1, 
    title: 'Nomad', 
    subtitle: 'Rootless, but moving',
    folklore: 'The Nomad belongs nowhere yet — and that is precisely the point. They carry no fixed identity, no settled routine, no proof of who they are becoming. Only momentum. They have left whatever was comfortable and entered the open road with nothing but a habit chosen and a direction pointed. Most people never leave. The Nomad already has.',
    xpRequired: 0, 
    tier: 'Initiate',
    color: '#94A3B8' // slate-400 (Grey)
  },
  { 
    level: 2, 
    title: 'Seeker', 
    subtitle: 'In pursuit of something true',
    folklore: 'The Seeker has tasted enough of the path to want more. They are no longer drifting — they are searching, with growing intention, for the version of themselves that waits further ahead. Some days the road is clear. Some days it disappears into fog. The Seeker walks either way.',
    xpRequired: 100, 
    tier: 'Initiate',
    color: '#CBD5E1' // slate-300
  },
  { 
    level: 3, 
    title: 'Squire', 
    subtitle: 'Apprentice to their own discipline',
    folklore: 'The Squire serves the habit before the habit serves them. They wake early for it. They sacrifice comfort for it. They are not yet a knight — but they sharpen a knight\'s blade. Quietly. Consistently. Without applause. This is where most people turn back. The Squire does not.',
    xpRequired: 250, 
    tier: 'Initiate',
    color: '#E2E8F0' // slate-200
  },
  { 
    level: 4, 
    title: 'Ranger', 
    subtitle: 'Sovereign of wild terrain',
    folklore: 'The Ranger has earned the wilderness. They move through chaotic days — travel, illness, grief, disruption — without losing the thread. They have built something resilient enough to survive the unexpected. No fortress, no perfect conditions, no ideal morning. Just the Ranger and the habit, moving through whatever the world throws between them.',
    xpRequired: 500, 
    tier: 'Builder',
    color: '#10B981' // emerald-500
  },
  { 
    level: 5, 
    title: 'Guardian', 
    subtitle: 'Protector of the streak',
    folklore: 'Something shifted the day the Guardian was named. They stopped building a habit and started protecting one. The difference is everything. What was once a goal is now a thing worth defending — a flame carried through rain that they refuse, on principle, to let go out. They have become the keeper of their own promise.',
    xpRequired: 900, 
    tier: 'Builder',
    color: '#059669' // emerald-600
  },
  { 
    level: 6, 
    title: 'Knight', 
    subtitle: 'Sworn to the code',
    folklore: 'The Knight does not need reasons anymore. They made a vow to themselves on a day they barely remember, and they have kept it ever since — not because it is always easy, not because the world rewards it, but because a knight does not break an oath. Discipline is no longer something they practice. It is something they are.',
    xpRequired: 1500, 
    tier: 'Builder',
    color: '#047857' // emerald-700
  },
  { 
    level: 7, 
    title: 'Champion', 
    subtitle: 'Victorious over the self',
    folklore: 'Every Champion has a story of the day they almost quit. They remember it precisely — the hour, the exhaustion, the voice that said enough. And they remember what they said back. Champions are not made in victories. They are made in that exact moment of refusal. Everything after is just evidence.',
    xpRequired: 2500, 
    tier: 'Legend',
    color: '#A855F7', // purple-500
    isRare: true 
  },
  { 
    level: 8, 
    title: 'Warden', 
    subtitle: 'Keeper of the highest ground',
    folklore: 'The Warden watches over territory that others gave up long ago. They have climbed high enough to see clearly — not the short arc of a single streak, but the long shape of a life being deliberately constructed. From this height, old distractions look small. Old doubts look smaller. The Warden guards a different kind of wealth now.',
    xpRequired: 4000, 
    tier: 'Legend',
    color: '#9333EA', // purple-600
    isRare: true 
  },
  { 
    level: 9, 
    title: 'Sovereign', 
    subtitle: 'Ruler of the self',
    folklore: 'The Sovereign answers to no external authority. No alarm forces them. No guilt drives them. No reward waits at the end of each day except the one they already carry — the knowledge that they are exactly who they decided to become. They have stopped fighting their habits. They have become them. The throne was always theirs. It just took this long to sit in it.',
    xpRequired: 6000, 
    tier: 'Legend',
    color: '#7E22CE', // purple-700
    isRare: true 
  },
  { 
    level: 10, 
    title: 'Monarch', 
    subtitle: 'The undisputed ruler of self',
    folklore: 'The Monarch was not crowned — they were recognised. There is no ceremony here, no committee that decided. The title arrived because there was simply no other word left. They have ruled themselves so completely, for so long, that discipline is no longer a practice — it is a reign. Kingdoms are built by many hands, but a Monarch is built by one, alone, every single day, without exception. This is the highest seat on the Ascendant Path.',
    xpRequired: 9000, 
    tier: 'Legend',
    color: '#F59E0B', // amber-500 (Gold)
    isApex: true 
  },
];

export const BADGES: Badge[] = [
  // --- RANK SPECIFIC BADGES ---
  { id: 'nomad_spirit',   title: 'Wanderer',        icon: '⛺', desc: 'Complete 5 sessions as a Nomad',    xp: 50,  minRank: 1 },
  { id: 'seeker_truth',   title: 'Truth Finder',    icon: '🔍', desc: 'Reach a 5-day streak as a Seeker',  xp: 100, minRank: 2 },
  { id: 'knight_vow',     title: 'Vow Keeper',      icon: '🗡️', desc: 'Maintain 100% consistency as a Knight', xp: 500, minRank: 6 },
  { id: 'monarch_reign',  title: 'Eternal Ruler',   icon: '🏛️', desc: 'Rule your habits for 7 perfect days as Monarch', xp: 1000, minRank: 10 },

  // --- GENERAL BADGES ---
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

export function getLevelForXP(xp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(xp: number): Level | null {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].xpRequired) return LEVELS[i];
  }
  return null; // max level
}

export function getLevelProgress(xp: number): number {
  const current = getLevelForXP(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.xpRequired - current.xpRequired;
  const earned = xp - current.xpRequired;
  return Math.round((earned / range) * 100);
}

export function calcXPForCompletion(habit: Habit, isStreak = false): number {
  let xp = 10; // base
  if (isStreak) xp += Math.min(habit.current_streak || 0, 20); // streak bonus, cap 20
  return xp;
}

// Compute total XP from all logs
export function computeTotalXP(logs: DailyLog[], habits: Habit[]): number {
  let xp = 0;
  const completedLogs = logs.filter(l => l.is_completed);
  completedLogs.forEach(log => {
    const habit = habits.find(h => h.id === log.habit_id);
    xp += habit ? calcXPForCompletion(habit) : 10;
  });
  return xp;
}

// Evaluate which badges are unlocked
export function evaluateBadges(habits: Habit[], logs: DailyLog[]): Badge[] {
  const unlocked = new Set<string>();
  const totalCompleted = logs.filter(l => l.is_completed).length;
  
  // Need rank for rank-specific badges
  const xp = computeTotalXP(logs, habits);
  const currentRank = getLevelForXP(xp).level;

  if (totalCompleted >= 1) unlocked.add('first_habit');
  if (totalCompleted >= 100) unlocked.add('centurion');
  if (habits.length >= 5) unlocked.add('five_habits');

  const maxStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);
  if (maxStreak >= 3)  unlocked.add('streak_3');
  if (maxStreak >= 7)  unlocked.add('streak_7');
  if (maxStreak >= 14) unlocked.add('streak_14');
  if (maxStreak >= 30) unlocked.add('streak_30');

  // Perfect day
  const dateMap: Record<string, { total: number; completed: number }> = {};
  logs.forEach(l => {
    if (!dateMap[l.date]) dateMap[l.date] = { total: 0, completed: 0 };
    dateMap[l.date].total++;
    if (l.is_completed) dateMap[l.date].completed++;
  });
  const habitCount = habits.filter(h => h.is_active).length;
  const perfectDates = Object.entries(dateMap).filter(([_, d]) => d.total >= habitCount && d.completed === d.total && habitCount > 0);
  if (perfectDates.length > 0) unlocked.add('perfect_day');
  if (perfectDates.length >= 7) unlocked.add('perfect_week');

  // --- RANK SPECIFIC LOGIC ---
  if (currentRank >= 1 && totalCompleted >= 5) unlocked.add('nomad_spirit');
  if (currentRank >= 2 && maxStreak >= 5) unlocked.add('seeker_truth');
  
  const consistency = calcConsistencyScore(logs, habits, 30);
  if (currentRank >= 6 && consistency >= 100) unlocked.add('knight_vow');
  
  if (currentRank >= 10 && perfectDates.length >= 7) unlocked.add('monarch_reign');

  return BADGES.filter(b => unlocked.has(b.id));
}

// Consistency score: % of days with ≥50% completion in last 30 days
export function calcConsistencyScore(logs: DailyLog[], habits: Habit[], days = 30): number {
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

export interface Insight {
  icon: string;
  text: string;
}

// Smart insights
export function generateInsights(habits: Habit[], logs: DailyLog[]): Insight[] {
  const insights: Insight[] = [];
  if (logs.length === 0) return [{ icon: '👋', text: 'Start tracking habits to unlock insights.' }];

  const habitCount = habits.filter(h => h.is_active).length || 1;
  const last7 = logs.filter(l => {
    const d = new Date(l.date);
    return (new Date().getTime() - d.getTime()) / 86400000 <= 7;
  });
  const rate7 = last7.length ? Math.round((last7.filter(l => l.is_completed).length / (habitCount * 7)) * 100) : 0;

  if (rate7 >= 80) insights.push({ icon: '🔥', text: `You're on a roll! ${rate7}% completion rate this week.` });
  else if (rate7 >= 50) insights.push({ icon: '⚡', text: `Solid week — ${rate7}% completion. Keep pushing!` });
  else if (rate7 < 30) insights.push({ icon: '💙', text: `Tough week with ${rate7}% completion. Progress, not perfection.` });

  const bestHabit = habits.reduce((best: Habit | null, h: Habit) => (h.current_streak || 0) > (best?.current_streak || 0) ? h : best, null);
  if (bestHabit && (bestHabit.current_streak || 0) > 1) {
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