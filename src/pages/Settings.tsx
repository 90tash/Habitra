import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Trophy, Moon, Sun, Zap, GripVertical, ChevronRight, Camera, X, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { Button } from '@/components/ui/button';
import { useTheme, ACCENT_COLORS, THEMES } from '@/lib/useTheme';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import BadgesGrid from '@/components/gamification/BadgesGrid';
import XPBar from '@/components/gamification/XPBar';
import { computeTotalXP, evaluateBadges, getLevelForXP } from '@/lib/gamification';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { appStore } from '@/store/appStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Habit, DailyLog } from '@/lib/types';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

const THEME_ICONS: Record<string, any> = { light: Sun, dark: Moon, amoled: Zap };
const THEME_LABELS: Record<string, string> = { light: 'Light', dark: 'Dark', amoled: 'AMOLED' };

export default function Settings() {
  const { theme, setTheme, accentIdx, setAccent } = useTheme();
  const queryClient = useQueryClient();
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const identity = appStore.getIdentity();
  const preferences = appStore.getPreferences();

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['habits'], queryFn: HabitRepository.list });
  const { data: logs = [] } = useQuery<DailyLog[]>({ queryKey: ['allLogs'], queryFn: () => LogRepository.recent(1000) });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => HabitRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
    },
  });
  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Habit> }) => HabitRepository.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setEditHabit(null); },
  });

  const reorderHabitsMutation = useMutation({
    mutationFn: (ids: string[]) => HabitRepository.reorder(ids),
    onMutate: async (newIds) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData<Habit[]>(['habits']);
      if (previousHabits) {
        const reordered = [...previousHabits].sort((a, b) => newIds.indexOf(a.id) - newIds.indexOf(b.id));
        queryClient.setQueryData(['habits'], reordered);
      }
      return { previousHabits };
    },
    onError: (_err, _newIds, context) => {
      if (context?.previousHabits) queryClient.setQueryData(['habits'], context.previousHabits);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(habits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderHabitsMutation.mutate(items.map(h => h.id));
  };

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
        onClick={() => setShowEditProfile(true)}
        className="relative rounded-3xl overflow-hidden card-shadow-lg p-5 cursor-pointer active:scale-[0.98] transition-all"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.18), hsl(var(--accent)/0.1))', backdropFilter: 'blur(24px)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-16 translate-x-16 opacity-20"
          style={{ background: `radial-gradient(circle, ${ACCENT_COLORS[accentIdx].hex}, transparent 70%)` }} />
        <div className="flex items-center gap-4 relative">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/5 overflow-hidden bg-muted">
            {identity.avatarUri ? (
              <img src={identity.avatarUri} className="h-full w-full object-cover" />
            ) : (
              level.icon
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-base font-space">{identity.full_name || 'Habitra User'}</p>
            <p className="text-xs text-muted-foreground">Level {level.level} · {level.title}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-semibold gradient-text">{xp} XP</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {accentIdx === i && (
                <motion.div layoutId="accentSel" className="absolute inset-0 rounded-full border-2 border-white scale-125 shadow-[0_0_15px_white]" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Preferences</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Day Ends At</p>
              <p className="text-[10px] text-muted-foreground">When daily cycles reset</p>
            </div>
          </div>
          <p className="text-sm font-bold font-space">{preferences.dayEndTime}</p>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div variants={itemVariants}><BadgesGrid unlockedBadges={unlockedBadges} /></motion.div>

      {/* Manage Habits */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl card-shadow border border-border/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Manage Habits</p>
          <p className="text-[9px] text-muted-foreground/60 italic">Drag handles to reorder</p>
        </div>
        
        {habits.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-5">No habits yet</p>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {habits.map((habit, i) => (
                  <Draggable key={habit.id} draggableId={habit.id} index={i}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors border-t border-border/30 first:border-t-0 ${
                          snapshot.isDragging ? 'bg-accent/10 border-accent/20 z-50' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="shrink-0 p-1 -ml-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-xl shrink-0">{habit.icon || '🎯'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{habit.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground capitalize">{habit.frequency} · {habit.target_value} {habit.unit}</span>
                            {habit.current_streak > 0 && (
                              <span className="text-[10px] text-orange-400">🔥{habit.current_streak}</span>
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
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </motion.div>

      {editHabit && (
        <CreateHabitSheet open={!!editHabit} onClose={() => setEditHabit(null)} editHabit={editHabit}
          onSave={(data) => updateHabitMutation.mutate({ id: editHabit.id, data })} />
      )}

      {/* Edit Profile Overlay */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileOverlay 
            identity={identity} 
            preferences={preferences}
            onClose={() => setShowEditProfile(false)} 
            onSave={() => {
              queryClient.invalidateQueries();
              setShowEditProfile(false);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditProfileOverlay({ identity, preferences, onClose, onSave }: any) {
  const [name, setName] = useState(identity.full_name);
  const [avatar, setAvatar] = useState(identity.avatarUri);
  const [dayEndTime, setDayEndTime] = useState(preferences.dayEndTime);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    appStore.updateIdentity({ full_name: name, avatarUri: avatar });
    appStore.updatePreferences({ dayEndTime });
    onSave();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[600] bg-background flex flex-col"
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-bold font-space">Edit Profile</h2>
        <button onClick={handleSave} className="text-primary font-bold px-4 py-2">Save</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-muted bg-muted flex items-center justify-center overflow-hidden shadow-2xl">
              {avatar ? <img src={avatar} className="h-full w-full object-cover" /> : <span className="text-5xl">👤</span>}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background">
              <Camera className="h-5 w-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setAvatar(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-2xl bg-muted/20 border-border/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Day Ends At</Label>
            <Input type="time" value={dayEndTime} onChange={e => setDayEndTime(e.target.value)} className="h-12 rounded-2xl bg-muted/20 border-border/50" style={{ colorScheme: 'dark' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
