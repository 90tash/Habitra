import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { 
  format, subDays, startOfWeek, eachDayOfInterval, endOfWeek, 
  startOfMonth, endOfMonth, isSameMonth, isSameDay, isToday, 
  addMonths, subMonths 
} from 'date-fns';
import { Target, Flame, TrendingUp, Zap, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { computeTotalXP, calcConsistencyScore } from '@/lib/gamification';
import XPBar from '@/components/gamification/XPBar';
import InsightCard from '@/components/gamification/InsightCard';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { Button } from '@/components/ui/button';

import { Habit, DailyLog } from '@/lib/types';

const COLORS = ['#7C5CFC', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FB1', '#A66CFF'];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
  gradFrom?: string;
  gradTo?: string;
}

function StatCard({ icon: Icon, label, value, color = 'text-primary', gradFrom, gradTo }: StatCardProps) {
  return (
    <motion.div variants={itemVariants}
      className="relative rounded-2xl overflow-hidden card-shadow p-4"
      style={{ background: gradFrom ? `linear-gradient(135deg, ${gradFrom}, ${gradTo})` : 'hsl(var(--card)/0.85)', backdropFilter: 'blur(20px)' }}>
      <Icon className={`h-4 w-4 ${color} mb-2.5 opacity-80`} />
      <p className="text-2xl font-bold font-space">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </motion.div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '14px',
    fontSize: '11px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  }
};

export default function Statistics() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['habits'], queryFn: HabitRepository.list });
  const { data: logs = [] } = useQuery<DailyLog[]>({ queryKey: ['allLogs'], queryFn: () => LogRepository.recent(1000) });

  const weekData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      const total = habits.filter(h => h.is_active).length || 1;
      return { day: format(day, 'EEE'), completed: dayLogs.filter(l => l.is_completed).length, pct: Math.round((dayLogs.filter(l => l.is_completed).length / total) * 100) };
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

  const totalCompleted = logs.filter(l => l.is_completed).length;
  const bestStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);
  const avgRate = logs.length ? Math.round((totalCompleted / logs.length) * 100) : 0;
  const xp = computeTotalXP(logs, habits);
  const consistency = calcConsistencyScore(logs, habits);

  // Calendar Logic
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

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayLogs = logs.filter(l => l.date === selectedDateStr);
  const selectedDayHabits = habits.map(habit => ({ 
    ...habit, 
    log: selectedDayLogs.find(l => l.habit_id === habit.id) 
  }));

  const getIntensity = (date: Date) => {
    const data = dateCompletionMap[format(date, 'yyyy-MM-dd')];
    if (!data || data.total === 0) return 0;
    return Math.ceil((data.completed / data.total) * 4);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-4 pt-6 pb-28 space-y-4">

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-space gradient-text">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">Your progress analytics & tracking</p>
      </motion.div>

      <motion.div variants={itemVariants}><XPBar xp={xp} /></motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Target}     label="Total Done"   value={totalCompleted} />
        <StatCard icon={Flame}      label="Best Streak"  value={`${bestStreak}d`} color="text-orange-400" />
        <StatCard icon={TrendingUp} label="Avg Rate"     value={`${avgRate}%`} color="text-accent" />
        <StatCard icon={Zap}        label="Consistency"  value={`${consistency}%`} color="text-chart-3" />
      </div>

      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary inline-block" />This Week
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weekData} barSize={26}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip 
              {...tooltipStyle} 
              formatter={(v) => [v, 'completed']} 
              cursor={{ fill: 'hsl(var(--primary)/0.08)', radius: 8 }}
            />
            <Bar dataKey="completed" radius={[8,8,0,0]}
              fill="url(#barGrad)" />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary)/0.5)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Calendar Section (Moved from Calendar tab) */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-bold font-space">{format(currentMonth, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
            <div key={d} className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
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
                className={`h-9 w-full rounded-xl text-[10px] font-semibold relative transition-all overflow-hidden ${
                  !inMonth ? 'opacity-20' :
                  selected ? 'text-primary-foreground shadow-lg' :
                  today ? 'text-primary ring-1.5 ring-primary/50' :
                  'text-foreground hover:bg-muted/60'
                }`}
                style={selected ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' } : {}}
              >
                {!selected && intensity > 0 && inMonth && (
                  <div className="absolute inset-1 rounded-lg opacity-25"
                    style={{ background: `hsl(var(--primary)/${['', '0.3', '0.5', '0.7', '0.9'][intensity]})` }} />
                )}
                <span className="relative z-10">{format(day, 'd')}</span>
                {today && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day details */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')} History
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
            {selectedDayHabits.filter(h => h.log?.is_completed).length}/{habits.length} done
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid gap-2">
            {selectedDayHabits.map((habit, i) => (
              <motion.div key={habit.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 340, damping: 28 }}
                className="relative rounded-xl overflow-hidden border border-border/20 flex items-center gap-3 p-3 bg-card/40 backdrop-blur-sm"
                style={{
                  borderLeft: habit.log?.is_completed ? `3px solid ${habit.color || '#7C5CFC'}` : '3px solid transparent',
                }}>
                <span className="text-lg">{habit.icon || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{habit.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {habit.log ? `${habit.log.current_value}/${habit.target_value} ${habit.unit || 'times'}` : 'No progress'}
                  </p>
                </div>
                {habit.log?.is_completed
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: habit.color || 'hsl(var(--accent))' }} />
                  : <Circle className="h-4 w-4 text-muted-foreground/20 shrink-0" />
                }
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {habits.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-4">No habits created yet</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-chart-4 inline-block" />Monthly Overview
        </h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={monthlyData} barSize={22}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip 
              {...tooltipStyle} 
              formatter={(v) => [v, 'completed']} 
              cursor={{ fill: 'hsl(var(--primary)/0.08)', radius: 8 }}
            />
            <Bar dataKey="completed" fill="hsl(var(--chart-4)/0.8)" radius={[7,7,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {radarData.length >= 3 && (
        <motion.div variants={itemVariants}
          className="glass rounded-2xl p-4 card-shadow border border-border/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-5 inline-block" />Habit Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="habit" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div variants={itemVariants}><InsightCard habits={habits} logs={logs} /></motion.div>
    </motion.div>
  );
}
