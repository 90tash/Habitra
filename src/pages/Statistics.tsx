import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip
} from 'recharts';
import { 
  format, startOfWeek, eachDayOfInterval, endOfWeek, 
  startOfMonth, endOfMonth, isSameMonth, isSameDay, isToday, 
  addMonths, subMonths 
} from 'date-fns';
import { Flame, TrendingUp, Zap, ChevronLeft, ChevronRight, 
  CheckCircle2, Circle, LayoutGrid, Calendar as CalendarIcon, 
  Sprout, Trophy, HelpCircle
} from 'lucide-react';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGamification } from '@/hooks/use-gamification';
import { BADGES, Badge } from '@/lib/gamification';
import XPBar from '@/components/gamification/XPBar';
import InsightCard from '@/components/gamification/InsightCard';

import { Habit, DailyLog } from '@/lib/types';

const COLORS = ['#7C5CFC', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FB1', '#A66CFF'];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '14px',
    fontSize: '11px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  }
};

type SubTab = 'stats' | 'calendar' | 'seedling' | 'badges';

export default function Statistics() {
  const [activeTab, setActiveTab] = useState<SubTab>('stats');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const { 
    xp, 
    level, 
    unlockedBadges, 
    consistencyScore: consistency, 
    habits, 
    allLogs: logs,
    insights 
  } = useGamification();

  // --- STATS TAB DATA ---
  const weekData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      const total = habits.filter(h => h.is_active).length || 1;
      return { day: format(day, 'EEE'), completed: dayLogs.filter(l => l.is_completed).length };
    });
  }, [logs, habits]);

  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const monthStr = format(d, 'yyyy-MM');
    const monthLogs = logs.filter(l => l.date.startsWith(monthStr));
    return { month: format(d, 'MMM'), completed: monthLogs.filter(l => l.is_completed).length };
  }), [logs]);

  const radarData = useMemo(() => habits.slice(0, 6).map(h => {
    const habitLogs = logs.filter(l => l.habit_id === h.id);
    return { habit: h.title.length > 8 ? h.title.slice(0, 8) + '…' : h.title, score: habitLogs.length ? Math.round((habitLogs.filter(l => l.is_completed).length / habitLogs.length) * 100) : 0 };
  }), [habits, logs]);

  // --- CALENDAR TAB DATA ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dateCompletionMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    logs.forEach(log => {
      if (!map[log.date]) map[log.date] = { total: 0, completed: 0 };
      map[log.date].total++;
      if (log.is_completed) map[log.date].completed++;
    });
    return map;
  }, [logs]);

  const getIntensity = (date: Date) => {
    const data = dateCompletionMap[format(date, 'yyyy-MM-dd')];
    if (!data || data.total === 0) return 0;
    return Math.ceil((data.completed / data.total) * 4);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayHabits = habits.map(habit => ({ 
    ...habit, 
    log: logs.find(l => l.date === selectedDateStr && l.habit_id === habit.id) 
  }));

  return (
    <div className="px-4 pt-6 pb-32 space-y-6">
      <motion.div variants={itemVariants} initial="initial" animate="animate">
        <h1 className="text-3xl font-bold font-space gradient-text">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">Growth & performance tracking</p>
      </motion.div>

      {/* Sub-tab Navigation */}
      <div className="flex bg-muted/30 p-1.5 rounded-[22px] border border-white/5 sticky top-2 z-40 backdrop-blur-xl">
        <SubTabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={LayoutGrid} label="Stats" />
        <SubTabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={CalendarIcon} label="Calendar" />
        <SubTabButton active={activeTab === 'seedling'} onClick={() => setActiveTab('seedling')} icon={Sprout} label="Seedling" />
        <SubTabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={Trophy} label="Badges" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* --- STATS TAB --- */}
          {activeTab === 'stats' && (
            <>
              <motion.div variants={itemVariants}><XPBar xp={xp} /></motion.div>
              
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Flame} label="Consistency" value={`${consistency}%`} color="text-orange-400" />
                <StatCard icon={TrendingUp} label="Total XP" value={xp} color="text-accent" />
              </div>

              <ChartSection title="This Week" iconColor="bg-primary">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weekData} barSize={26}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'hsl(var(--primary)/0.08)', radius: 8 }} />
                    <Bar dataKey="completed" radius={[8,8,0,0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSection>

              <ChartSection title="Monthly Overview" iconColor="bg-chart-4">
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={monthlyData} barSize={22}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'hsl(var(--primary)/0.08)', radius: 8 }} />
                    <Bar dataKey="completed" fill="hsl(var(--chart-4)/0.8)" radius={[7,7,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSection>

              {radarData.length >= 3 && (
                <ChartSection title="Habit Performance" iconColor="bg-chart-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="habit" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.18} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartSection>
              )}

              <InsightCard habits={habits} logs={logs} />
            </>
          )}

          {/* --- CALENDAR TAB --- */}
          {activeTab === 'calendar' && (
            <>
              <div className="glass rounded-3xl p-5 border border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-white/5"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="text-lg font-bold font-space">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-white/5"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                    <div key={d} className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map(day => {
                    const inMonth = isSameMonth(day, currentMonth);
                    const selected = isSameDay(day, selectedDate);
                    const today = isToday(day);
                    const intensity = getIntensity(day);

                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setSelectedDate(day)}
                        className={`h-11 w-full rounded-2xl text-[11px] font-bold relative transition-all overflow-hidden ${
                          !inMonth ? 'opacity-20' :
                          selected ? 'text-primary-foreground shadow-lg shadow-primary/20' :
                          today ? 'text-primary ring-2 ring-primary/30' :
                          'text-foreground hover:bg-white/5'
                        }`}
                        style={selected ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' } : {}}
                      >
                        {!selected && intensity > 0 && inMonth && (
                          <div className="absolute inset-1 rounded-xl opacity-30"
                            style={{ background: `hsl(var(--primary)/${['', '0.3', '0.5', '0.7', '0.9'][intensity]})` }} />
                        )}
                        <span className="relative z-10">{format(day, 'd')}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {isToday(selectedDate) ? 'Today\'s History' : `${format(selectedDate, 'MMM d')} History`}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-lg">
                    {selectedDayHabits.filter(h => h.log?.is_completed).length}/{habits.length} COMPLETED
                  </span>
                </div>

                <div className="grid gap-3">
                  {selectedDayHabits.map((habit, i) => (
                    <div key={habit.id} className="relative rounded-[20px] overflow-hidden border border-white/5 flex items-center gap-4 p-4 bg-white/[0.03] backdrop-blur-sm">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                        {habit.icon || '🎯'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{habit.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                          {habit.log ? `${habit.log.current_value}/${habit.target_value} ${habit.unit}` : '0 progress'}
                        </p>
                      </div>
                      {habit.log?.is_completed
                        ? <CheckCircle2 className="h-5 w-5 text-primary" />
                        : <Circle className="h-5 w-5 text-white/10" />
                      }
                    </div>
                  ))}
                  {habits.length === 0 && (
                    <div className="text-center py-10 opacity-40">
                      <p className="text-xs">No habits to show for this day</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* --- SEEDLING TAB --- */}
          {activeTab === 'seedling' && (
            <div className="space-y-6">
              <div className="glass rounded-[32px] p-8 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/10 to-transparent" />
                
                <motion.div 
                  animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-8xl mb-6 relative z-10 drop-shadow-[0_0_30px_rgba(124,92,252,0.3)]"
                >
                  {level.icon}
                </motion.div>
                
                <h2 className="text-2xl font-bold font-space text-white">{level.title}</h2>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">Your consistency is the sunlight that helps you grow.</p>
                
                <div className="w-full mt-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Level Progress</span>
                    <span className="text-xs font-bold font-space">{xp} XP</span>
                  </div>
                  <XPBar xp={xp} />
                  <p className="text-[10px] text-muted-foreground italic mt-2">Next evolution at {level.level + 1}000 XP</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <GrowthUnlockCard title="New Badge Slots" level={2} currentLevel={level.level} desc="Unlock the ability to display more achievements." />
                <GrowthUnlockCard title="Custom Themes" level={5} currentLevel={level.level} desc="Personalize your dashboard with premium accents." />
                <GrowthUnlockCard title="Smart Predictions" level={10} currentLevel={level.level} desc="AI-powered insights based on your growth trends." />
              </div>
            </div>
          )}

          {/* --- BADGES TAB --- */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Achievements</h3>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  {unlockedBadges.length}/{BADGES.length} EARNED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {BADGES.map((badge) => {
                  const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
                  return (
                    <motion.button
                      key={badge.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBadge(badge)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-[24px] border transition-all relative overflow-hidden",
                        isUnlocked 
                          ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(124,92,252,0.1)]" 
                          : "bg-white/[0.02] border-white/5 grayscale opacity-40"
                      )}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <p className="text-[10px] font-bold text-center leading-tight line-clamp-1">{badge.title}</p>
                      {isUnlocked && (
                        <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Badge Details Popup */}
              <AnimatePresence>
                {selectedBadge && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="glass rounded-[32px] p-8 border border-white/10 w-full max-w-xs text-center relative"
                    >
                      <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 text-muted-foreground">
                        <Circle className="h-5 w-5 fill-white/5 border-none" />
                      </button>
                      <span className="text-6xl mb-4 inline-block">{selectedBadge.icon}</span>
                      <h3 className="text-xl font-bold font-space mt-2">{selectedBadge.title}</h3>
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        {selectedBadge.desc}
                      </p>
                      <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <HelpCircle className="h-4 w-4" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">How to earn</span>
                        </div>
                        <p className="text-[10px] text-white/70 mt-2 font-medium">
                          {getBadgeRequirement(selectedBadge.id)}
                        </p>
                      </div>
                      <Button onClick={() => setSelectedBadge(null)} className="w-full mt-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                        Awesome
                      </Button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SubTabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-[18px] transition-all relative overflow-hidden",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.div layoutId="subTabBg" className="absolute inset-0 rounded-[16px] bg-white/5 border border-white/5 shadow-xl" />
      )}
      <Icon className={cn("h-4 w-4 relative z-10", active && "animate-in zoom-in-75 duration-300")} />
      <span className="text-[9px] font-bold uppercase tracking-widest relative z-10">{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass rounded-2xl p-4 border border-white/5 space-y-2">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color.replace('text-', 'bg-') + '/10')}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-xl font-bold font-space">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function ChartSection({ title, children, iconColor }: any) {
  return (
    <div className="glass rounded-3xl p-4 border border-white/5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
        <div className={cn("h-1.5 w-1.5 rounded-full", iconColor)} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function GrowthUnlockCard({ title, level, currentLevel, desc }: any) {
  const isLocked = currentLevel < level;
  return (
    <div className={cn(
      "p-4 rounded-2xl border flex items-center gap-4 transition-all",
      isLocked ? "bg-white/[0.01] border-white/5 opacity-50" : "bg-primary/5 border-primary/20"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center font-bold",
        isLocked ? "bg-muted text-muted-foreground" : "bg-primary text-white"
      )}>
        {level}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
      </div>
      {isLocked && <Zap className="h-3.5 w-3.5 text-muted-foreground/30" />}
    </div>
  );
}

function getBadgeRequirement(id: string): string {
  switch(id) {
    case 'first-step': return 'Complete your first habit session.';
    case 'streak-3': return 'Maintain an active streak for 3 consecutive days.';
    case 'streak-7': return 'Maintain an active streak for 7 consecutive days.';
    case 'habit-master': return 'Reach a 30-day streak on any single habit.';
    case 'perfectionist': return 'Complete all your active habits in a single day.';
    case 'early-bird': return 'Complete a habit before 8:00 AM.';
    case 'night-owl': return 'Complete a habit after 10:00 PM.';
    case 'century': return 'Log a total of 100 habit completions.';
    default: return 'Keep growing your habits to unlock this achievement!';
  }
}
