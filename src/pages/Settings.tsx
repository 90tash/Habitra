// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trash2, LogOut, Pencil, Trophy, Moon, Sun, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, ACCENT_COLORS, THEMES } from '@/lib/useTheme';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import BadgesGrid from '@/components/gamification/BadgesGrid';
import XPBar from '@/components/gamification/XPBar';
import { computeTotalXP, evaluateBadges, getLevelForXP } from '@/lib/gamification';
import { useAuth } from '@/lib/AuthContext';
import { HabitRepository, LogRepository } from '@/lib/repository';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

const THEME_ICONS = { light: Sun, dark: Moon, amoled: Zap };
const THEME_LABELS = { light: 'Light', dark: 'Dark', amoled: 'AMOLED' };

export default function Settings() {
  const { theme, setTheme, accentIdx, setAccent } = useTheme();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [editHabit, setEditHabit] = useState(null);

  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: HabitRepository.list });
  const { data: logs = [] } = useQuery({ queryKey: ['allLogs'], queryFn: () => LogRepository.recent(1000) });

  const deleteHabitMutation = useMutation({
    mutationFn: HabitRepository.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
    },
  });
  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }) => HabitRepository.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setEditHabit(null); },
  });

  const xp = computeTotalXP(logs, habits);
  const level = getLevelForXP(xp);
  const unlockedBadges = evaluateBadges(habits, logs);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-4 pt-6 pb-28 space-y-5">

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-space gradient-text">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Your profile & preferences</p>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={itemVariants}
        className="relative rounded-3xl overflow-hidden card-shadow-lg p-5"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.18), hsl(var(--accent)/0.1))', backdropFilter: 'blur(24px)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-16 translate-x-16 opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />
        <div className="flex items-center gap-4 relative">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{ background: 'hsl(var(--primary)/0.2)', border: '1px solid hsl(var(--primary)/0.3)' }}>
            {level.icon}
          </div>
          <div className="flex-1">
            <p className="font-bold text-base font-space">{level.title}</p>
            <p className="text-xs text-muted-foreground">Level {level.level}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-semibold gradient-text">{xp} XP</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Trophy className="h-2.5 w-2.5 text-yellow-400" />
                {unlockedBadges.length} badges
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-space">{habits.filter(h => h.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Habits</p>
          </div>
        </div>
      </motion.div>

      {/* XP Bar */}
      <motion.div variants={itemVariants}><XPBar xp={xp} /></motion.div>

      {/* Theme */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(t => {
            const Icon = THEME_ICONS[t];
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${
                  theme === t
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-primary/20 text-muted-foreground'
                }`}>
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{THEME_LABELS[t]}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Accent Colors */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Accent Color</p>
        <div className="flex gap-2.5 flex-wrap">
          {ACCENT_COLORS.map((color, i) => (
            <motion.button
              key={color.name}
              whileTap={{ scale: 0.88 }}
              onClick={() => setAccent(i)}
              className="relative h-9 w-9 rounded-full transition-all"
              style={{ backgroundColor: `hsl(${color.primary})` }}
              title={color.name}
            >
              {accentIdx === i && (
                <motion.div layoutId="accentSel" className="absolute inset-0 rounded-full border-2 border-white scale-125" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div variants={itemVariants}><BadgesGrid unlockedBadges={unlockedBadges} /></motion.div>

      {/* Manage Habits */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl card-shadow border border-border/40 overflow-hidden">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-4 pt-4 pb-2">Habits</p>
        {habits.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-5">No habits yet</p>
        )}
        {habits.map((habit, i) => (
          <motion.div key={habit.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0">
            <span className="text-xl">{habit.icon || '🎯'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{habit.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground capitalize">{habit.frequency} · {habit.target_value} {habit.unit}</span>
                {habit.current_streak > 0 && (
                  <span className="text-[10px] text-orange-400 flame">🔥{habit.current_streak}</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0"
              onClick={() => setEditHabit(habit)}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{habit.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>This permanently deletes this habit and all history.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground"
                    onClick={() => deleteHabitMutation.mutate(habit.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        ))}
      </motion.div>

      {/* Account */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl card-shadow border border-border/40">
        <button onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl hover:bg-destructive/5 transition-colors">
          <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-destructive">Sign Out</p>
            <p className="text-[10px] text-muted-foreground">Log out of your account</p>
          </div>
        </button>
      </motion.div>

      {editHabit && (
        <CreateHabitSheet open={!!editHabit} onClose={() => setEditHabit(null)} editHabit={editHabit}
          onSave={(data) => updateHabitMutation.mutate({ id: editHabit.id, data })} />
      )}
    </motion.div>
  );
}

