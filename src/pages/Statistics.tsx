// @ts-nocheck
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { format, subDays, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';
import { Target, Flame, TrendingUp, Zap } from 'lucide-react';
import { computeTotalXP, calcConsistencyScore } from '@/lib/gamification';
import XPBar from '@/components/gamification/XPBar';
import InsightCard from '@/components/gamification/InsightCard';
import { HabitRepository, LogRepository } from '@/lib/repository';

const COLORS = ['#7C5CFC', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FB1', '#A66CFF'];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

function StatCard({ icon: Icon, label, value, color = 'text-primary', gradFrom, gradTo }) {
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
  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: HabitRepository.list });
  const { data: logs = [] } = useQuery({ queryKey: ['allLogs'], queryFn: () => LogRepository.recent(1000) });

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

  const trendData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === dateStr);
    const total = habits.filter(h => h.is_active).length || 1;
    return { date: format(date, 'MM/dd'), rate: Math.round((dayLogs.filter(l => l.is_completed).length / total) * 100) };
  }), [logs, habits]);

  const categoryData = useMemo(() => {
    const counts = {};
    habits.forEach(h => { const c = h.category || 'other'; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [habits]);

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

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-4 pt-6 pb-28 space-y-4">

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-space gradient-text">Statistics</h1>
        <p className="text-xs text-muted-foreground mt-1">Your progress analytics</p>
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
            <Tooltip {...tooltipStyle} formatter={(v) => [v, 'completed']} />
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

      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent inline-block" />14-Day Trend
        </h3>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={2} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'completion']} />
            <Line type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} strokeLinecap="round" />
          </LineChart>
        </ResponsiveContainer>
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
            <Tooltip {...tooltipStyle} formatter={(v) => [v, 'completed']} />
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

      {categoryData.length > 0 && (
        <motion.div variants={itemVariants}
          className="glass rounded-2xl p-4 card-shadow border border-border/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2 inline-block" />Categories
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs capitalize flex-1 truncate">{cat.name}</span>
                  <span className="text-xs font-semibold">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}><InsightCard habits={habits} logs={logs} /></motion.div>
    </motion.div>
  );
}
