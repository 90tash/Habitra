import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HabitRepository, LogRepository } from '@/lib/repository';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: HabitRepository.list });
  const { data: logs = [] } = useQuery({ queryKey: ['allLogs'], queryFn: () => LogRepository.recent(1000) });

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dateCompletionMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      if (!map[log.date]) map[log.date] = { total: 0, completed: 0 };
      map[log.date].total++;
      if (log.is_completed) map[log.date].completed++;
    });
    return map;
  }, [logs]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayLogs = logs.filter(l => l.date === selectedDateStr);
  const selectedDayHabits = habits.map(habit => ({ ...habit, log: selectedDayLogs.find(l => l.habit_id === habit.id) }));

  const getIntensity = (date) => {
    const data = dateCompletionMap[format(date, 'yyyy-MM-dd')];
    if (!data || data.total === 0) return 0;
    return Math.ceil((data.completed / data.total) * 4);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-4 pt-6 pb-28 space-y-4">

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-space gradient-text">Calendar</h1>
        <p className="text-xs text-muted-foreground mt-1">Track your consistency</p>
      </motion.div>

      {/* Month navigator */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-base font-bold font-space">{format(currentMonth, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{d}</div>
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
                className={`h-10 w-full rounded-xl text-xs font-semibold relative transition-all overflow-hidden ${
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
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day details */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {isToday(selectedDate) ? '🗓 Today' : format(selectedDate, 'EEEE, MMM d')}
          </h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
            {selectedDayHabits.filter(h => h.log?.is_completed).length}/{habits.length}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {selectedDayHabits.map((habit, i) => (
            <motion.div key={habit.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 340, damping: 28 }}
              className="relative rounded-2xl overflow-hidden card-shadow flex items-center gap-3 p-3.5"
              style={{
                background: habit.log?.is_completed
                  ? `linear-gradient(135deg, ${habit.color || '#7C5CFC'}18, transparent)`
                  : 'hsl(var(--card)/0.8)',
                backdropFilter: 'blur(20px)',
                borderLeft: `3px solid ${habit.log?.is_completed ? (habit.color || '#7C5CFC') : 'transparent'}`,
              }}>
              <span className="text-xl">{habit.icon || '🎯'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{habit.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {habit.log ? `${habit.log.current_value}/${habit.target_value} ${habit.unit || 'times'}` : 'Not started'}
                </p>
              </div>
              {habit.log?.is_completed
                ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: habit.color || 'hsl(var(--accent))' }} />
                : <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
              }
            </motion.div>
          ))}
        </AnimatePresence>

        {habits.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No habits to show</p>
        )}
      </motion.div>
    </motion.div>
  );
}
