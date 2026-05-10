import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Pencil, 
  Trash2, 
  Flame, 
  Trophy, 
  BarChart3, 
  Calendar as CalendarIcon, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Star,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  subMonths, 
  addMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isFuture
} from 'date-fns';
import { 
  XAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { Button } from '@/components/ui/button';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import LoadingState from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, x: -20 }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function HabitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: habit, isLoading: habitLoading } = useQuery({
    queryKey: ['habit', id],
    queryFn: () => HabitRepository.getById(id!),
    enabled: !!id
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['habitLogs', id],
    queryFn: () => LogRepository.forHabit(id!),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => HabitRepository.delete(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      navigate('/');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => HabitRepository.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit', id] });
      setIsEditOpen(false);
    }
  });

  // Analytics Calculations
  const analytics = useMemo(() => {
    if (!habit || !logs) return null;

    const totalCompletions = logs.filter(l => l.is_completed).length;
    const completionRate = logs.length > 0 ? (totalCompletions / logs.length) * 100 : 0;
    
    // Weekly data for chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = logs.find(l => l.date === dateStr);
      return {
        name: format(date, 'EEE'),
        value: log?.is_completed ? 100 : 0,
        fullDate: dateStr
      };
    }).reverse();

    // Most active day
    const dayCounts: Record<string, number> = {};
    logs.filter(l => l.is_completed).forEach(l => {
      const dayName = format(new Date(l.date), 'EEEE');
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Missed days count (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    });
    const missedCount = last30Days.filter(d => !logs.find(l => l.date === d && l.is_completed)).length;

    return {
      totalCompletions,
      completionRate,
      weeklyChart: last7Days,
      mostActiveDay,
      missedCount
    };
  }, [habit, logs]);

  if (habitLoading || logsLoading) return <div className="p-8"><LoadingState count={4} /></div>;
  if (!habit) return <div className="p-8 text-center">Habit not found</div>;

  const habitColor = habit.color || 'hsl(var(--primary))';

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="px-4 pt-6 pb-28 space-y-6"
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)} className="rounded-xl">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{habit.title}" and all its history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate(habit.id)}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Title Section */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h1 className="text-4xl font-bold font-space tracking-tight">{habit.title}</h1>
        <div className="flex flex-wrap gap-2">
          <div 
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            style={{ 
              backgroundColor: `${habitColor}15`, 
              color: habitColor,
              border: `1px solid ${habitColor}30`,
              boxShadow: `0 0 10px ${habitColor}10`
            }}
          >
            <Star className="h-3 w-3 fill-current" />
            {habit.category}
          </div>
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/50">
            {habit.frequency}
          </div>
          {habit.reminder_time && (
            <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/50">
              🔔 {habit.reminder_time}
            </div>
          )}
        </div>
        {habit.description && (
          <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-border/50 pl-3">
            {habit.description}
          </p>
        )}
      </motion.div>

      {/* Analytics Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {/* Streak Card */}
        <div className="glass p-3 rounded-2xl border border-border/30 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative z-10">
            <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold font-space">{habit.current_streak}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Streak</p>
            <p className="text-[9px] text-orange-500/70 font-medium mt-1">Best: {habit.best_streak}</p>
          </div>
        </div>

        {/* Total Card */}
        <div className="glass p-3 rounded-2xl border border-border/30 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative z-10">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold font-space">{analytics?.totalCompletions}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Finished</p>
            <p className="text-[9px] text-blue-500/70 font-medium mt-1">This month: {logs.filter(l => l.is_completed && new Date(l.date).getMonth() === new Date().getMonth()).length}</p>
          </div>
        </div>

        {/* Rate Card */}
        <div className="glass p-3 rounded-2xl border border-border/30 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative z-10">
            <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold font-space">{Math.round(analytics?.completionRate || 0)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
            <p className="text-[9px] text-green-500/70 font-medium mt-1">Target: {habit.target_value}</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Insights */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Progress Insights</h2>
        </div>
        
        <div className="glass p-5 rounded-2xl border border-border/30">
          <div className="h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.weeklyChart}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={habitColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={habitColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: '11px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={habitColor} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Most Active</p>
                <p className="text-xs font-bold">{analytics?.mostActiveDay}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right justify-end">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Days Missed</p>
                <p className="text-xs font-bold text-destructive">{analytics?.missedCount}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Tracking History</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold min-w-[80px] text-center">{format(selectedMonth, 'MMM yyyy')}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="glass p-4 rounded-3xl border border-border/30">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-[10px] font-bold text-muted-foreground text-center py-1 uppercase">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const start = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 1 });
              const end = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
              const days = eachDayOfInterval({ start, end });

              return days.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const log = logs.find(l => l.date === dateStr);
                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                const completed = log?.is_completed;
                const today = isToday(day);
                const future = isFuture(day);

                return (
                  <div key={i} className="aspect-square flex items-center justify-center relative">
                    {today && (
                      <motion.div 
                        layoutId="todayCircle"
                        className="absolute inset-0 rounded-full border-2 border-primary/40 m-0.5"
                        animate={{ scale: [0.95, 1.05, 0.95] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    <button
                      disabled={future}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all relative z-10",
                        !isCurrentMonth ? "opacity-20" : "",
                        completed ? "text-white shadow-lg" : "hover:bg-muted/50",
                        future ? "opacity-30 cursor-default" : ""
                      )}
                      style={completed ? { 
                        backgroundColor: habitColor,
                        boxShadow: `0 4px 12px ${habitColor}40`
                      } : {}}
                    >
                      {format(day, 'd')}
                      {completed && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-white/20"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                        />
                      )}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </motion.div>

      {/* Daily Notes Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Progress Notes</h2>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/30 flex items-center gap-4 group hover:border-primary/30 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Coming Soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">Attach reflections and photos to your daily logs.</p>
          </div>
        </div>
      </motion.div>

      <CreateHabitSheet 
        open={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        editHabit={habit}
        onSave={(data) => updateMutation.mutate(data)}
      />
    </motion.div>
  );
}
