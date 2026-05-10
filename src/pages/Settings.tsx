import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, Pencil, Moon, Sun, Zap, GripVertical, 
  ChevronRight, Camera, X, Clock, User, Heart, 
  AlertCircle, Image as ImageIcon, Trash, Plus, Tag 
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from '@hello-pangea/dnd';

import { Button } from '@/components/ui/button';
import { useTheme, ACCENT_COLORS, THEMES } from '@/lib/useTheme';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import CreateHabitSheet from '@/components/habits/CreateHabitSheet';
import { 
  computeTotalXP, evaluateBadges, getLevelForXP, 
  getLevelProgress, getNextLevel 
} from '@/lib/gamification';
import { HabitRepository, LogRepository } from '@/lib/repository';
import { appStore } from '@/store/appStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Habit, DailyLog } from '@/lib/types';

const THEME_ICONS: Record<string, any> = { light: Sun, dark: Moon, amoled: Zap };
const THEME_LABELS: Record<string, string> = { light: 'Light', dark: 'Dark', amoled: 'AMOLED' };

function TimePicker3({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [h24, m24] = (value || "00:00").split(':').map(Number);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const displayHour = h24 % 12 || 12;
  const displayMin = m24;

  const [hourStr, setHourStr] = useState(String(displayHour).padStart(2, '0'));
  const [minStr, setMinStr] = useState(String(displayMin).padStart(2, '0'));

  useEffect(() => {
    setHourStr(String(displayHour).padStart(2, '0'));
    setMinStr(String(displayMin).padStart(2, '0'));
  }, [value, displayHour, displayMin]);

  const commitTime = (h: number, m: number, p: string) => {
    let finalH = h;
    if (p === 'PM' && h < 12) finalH += 12;
    if (p === 'AM' && h === 12) finalH = 0;
    onChange(`${String(finalH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const onHourBlur = () => {
    const v = parseInt(hourStr);
    const validH = isNaN(v) ? displayHour : Math.max(1, Math.min(12, v));
    setHourStr(String(validH).padStart(2, '0'));
    commitTime(validH, displayMin, period);
  };

  const onMinBlur = () => {
    const v = parseInt(minStr);
    const validM = isNaN(v) ? displayMin : Math.max(0, Math.min(59, v));
    setMinStr(String(validM).padStart(2, '0'));
    commitTime(displayHour, validM, period);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={hourStr}
          onChange={(e) => setHourStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={onHourBlur}
          className="w-14 h-12 rounded-2xl bg-muted/20 border border-primary/40 text-base font-bold font-space text-center text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-[0_0_15px_rgba(124,92,252,0.1)]"
        />
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Hour</span>
      </div>
      <span className="text-primary/40 font-black text-xl mb-4">:</span>
      <div className="flex flex-col items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={minStr}
          onChange={(e) => setMinStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={onMinBlur}
          className="w-14 h-12 rounded-2xl bg-muted/20 border border-primary/40 text-base font-bold font-space text-center text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-[0_0_15px_rgba(124,92,252,0.1)]"
        />
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Min</span>
      </div>
      <div className="flex flex-col items-center gap-1 ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            commitTime(displayHour, displayMin, period === 'AM' ? 'PM' : 'AM');
          }}
          className="w-14 h-12 rounded-2xl bg-primary/10 border-2 border-primary/50 text-xs font-black text-primary hover:bg-primary/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(124,92,252,0.2)]"
        >
          {period}
        </button>
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">AM/PM</span>
      </div>
    </div>
  );
}

function TagCarousel({ tags = [] }: { tags: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (tags.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % tags.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [tags]);

  if (tags.length === 0) {
    return <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Growth Journey</span>;
  }

  return (
    <div className="h-4 overflow-hidden relative flex-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={tags[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-[10px] font-bold text-primary uppercase tracking-widest absolute"
        >
          {tags[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function HabitReorderList({ habits, onEdit, onDelete, onReorder, onDragStart, onDragEnd, accentColor }: any) {
  const [itemHeight, setItemHeight] = useState(65);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-frequency pointer tracking (Always Synchronous)
  const lastPointerY = useRef(0);
  useEffect(() => {
    const track = (e: MouseEvent | TouchEvent) => {
      lastPointerY.current = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
    };
    // Use capture phase to beat the library to the touch point
    window.addEventListener('mousemove', track, { capture: true, passive: true });
    window.addEventListener('touchmove', track, { capture: true, passive: true });
    window.addEventListener('mousedown', track, { capture: true, passive: true });
    window.addEventListener('touchstart', track, { capture: true, passive: true });
    
    return () => {
      window.removeEventListener('mousemove', track, { capture: true });
      window.removeEventListener('touchmove', track, { capture: true });
      window.removeEventListener('mousedown', track, { capture: true });
      window.removeEventListener('touchstart', track, { capture: true });
    };
  }, []);

  const [dragStartInfo, setDragStartInfo] = useState<{
    startItemTop: number;
    startPointerY: number;
  } | null>(null);

  const [ticker, setTicker] = useState(0); // Trigger re-renders during drag

  useEffect(() => {
    if (!dragStartInfo) return;
    let frame: number;
    const update = () => {
      setTicker(t => t + 1);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [dragStartInfo]);

  useEffect(() => {
    if (containerRef.current) {
      const item = containerRef.current.querySelector('[data-rbd-draggable-id]');
      if (item) setItemHeight((item as HTMLElement).offsetHeight);
    }
  }, [habits]);

  const handleDragStart = (start: DragStart) => {
    const element = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Lock start info exactly at drag initiation
      setDragStartInfo({
        startItemTop: rect.top,
        startPointerY: lastPointerY.current || rect.top + (rect.height / 2),
      });
      onDragStart?.();
    }
  };

  const handleDragEnd = (result: DropResult) => {
    setDragStartInfo(null);
    onDragEnd?.();
    if (!result.destination || result.destination.index === result.source.index) return;
    const items = Array.from(habits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorder(items.map((h: any) => h.id));
  };

  const renderHabitItem = (habit: any, index: number, provided: any, snapshot: any) => {
    let style = { ...provided.draggableProps.style };
    
    // Robust Delta-Based Movement & Clamping
    if (snapshot.isDragging && containerRef.current && dragStartInfo) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Strict signed delta calculation: DOWN (larger currentY) = Positive Delta
      const deltaY = lastPointerY.current - dragStartInfo.startPointerY;
      const rawTop = dragStartInfo.startItemTop + deltaY;
      
      // Physical stop at container edges
      const clampedTop = Math.max(
        containerRect.top,
        Math.min(rawTop, containerRect.bottom - itemHeight)
      );

      style = {
        ...style,
        position: 'fixed',
        top: `${clampedTop}px`,
        left: `${containerRect.left}px`,
        width: `${containerRect.width}px`,
        zIndex: 9999,
        // Reset library translation, use absolute positioning + scale
        transform: 'scale(1.03)', 
        transition: snapshot.isDropAnimating ? 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' : 'none',
        backgroundColor: `${accentColor}24`, 
        borderColor: `${accentColor}66`,
        boxShadow: `0 12px 30px ${accentColor}33`,
        backdropFilter: 'blur(16px)',
      };
    }

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={style}
        className={`flex items-center gap-3 px-4 py-3 border-t border-border/30 first:border-t-0 ${
          snapshot.isDragging 
            ? 'rounded-xl border border-solid shadow-2xl' 
            : 'hover:bg-muted/30 transition-colors'
        }`}
      >
        <div className="shrink-0 p-1 -ml-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="text-xl shrink-0">{habit.icon || '🎯'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{habit.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground capitalize">{habit.frequency} · {habit.target_value} {habit.unit}</span>
            {habit.current_streak > 0 && (
              <span className="text-[10px] text-orange-400">🔥{habit.current_streak}</span>
            )}
          </div>
        </div>
        {!snapshot.isDragging && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0"
              onClick={() => onEdit(habit)}>
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
                    onClick={() => onDelete(habit.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass rounded-2xl card-shadow border border-border/40 overflow-visible relative">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Manage Habits</p>
      </div>
      
      <div ref={containerRef} className="relative">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable 
            droppableId="habits"
            renderClone={(provided, snapshot, rubric) => (
              createPortal(
                renderHabitItem(habits[rubric.source.index], rubric.source.index, provided, snapshot),
                document.body
              )
            )}
          >
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                className="flex flex-col min-h-[50px] relative"
              >
                {habits.map((habit: any, i: number) => (
                  <Draggable key={habit.id} draggableId={habit.id} index={i}>
                    {(provided, snapshot) => (
                      <div className={snapshot.isDragging ? 'opacity-0' : ''}>
                        {renderHabitItem(habit, i, provided, snapshot)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme, accentIdx, setAccent } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const { data: habits = [] } = useQuery<Habit[]>({ 
    queryKey: ['habits'], 
    queryFn: HabitRepository.list,
    placeholderData: (prev) => prev,
  });

  const identity = appStore.getIdentity();
  const [preferences, setPreferences] = useState(() => appStore.getPreferences());

  const { data: logs = [] } = useQuery<DailyLog[]>({ 
    queryKey: ['allLogs'], 
    queryFn: () => LogRepository.recent(1000) 
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => HabitRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Habit> }) => HabitRepository.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['habits'] }); 
      setEditHabit(null); 
    },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const updatePreferences = (patch: any) => {
    const next = appStore.updatePreferences(patch);
    setPreferences(next);
    queryClient.invalidateQueries();
  };

  const xp = computeTotalXP(logs, habits);
  const level = getLevelForXP(xp);
  const levelProgress = getLevelProgress(xp);
  const nextLevel = getNextLevel(xp);

  const habitStats = useMemo(() => {
    if (!habits || habits.length === 0) return null;
    const stats = habits.map(h => {
      const completions = logs.filter(l => l && l.habit_id === h.id && l.is_completed).length;
      return { ...h, completions };
    }).sort((a, b) => b.completions - a.completions);
    
    if (stats.length === 0) return null;

    return {
      favourite: stats[0],
      leastFavourite: stats[stats.length - 1],
    };
  }, [habits, logs]);

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
  };

  return (
    <motion.div 
      variants={pageVariants} 
      initial="initial" 
      animate={isReordering ? { y: 0, opacity: 1 } : "animate"}
      className="px-4 pt-6 pb-28 space-y-5"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-space gradient-text">Settings</h1>
      </motion.div>

      {/* Profile card */}
      <motion.div 
        variants={itemVariants}
        className="relative rounded-[32px] overflow-hidden card-shadow-lg p-6 transition-all border border-white/5 group"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--accent)/0.08))', backdropFilter: 'blur(24px)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-20 translate-x-20 opacity-20"
          style={{ background: `radial-gradient(circle, ${ACCENT_COLORS[accentIdx].hex}, transparent 70%)` }} />
        
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-[24px] flex items-center justify-center shadow-2xl border-2 border-white/10 overflow-hidden bg-background/40 backdrop-blur-md shrink-0">
              {identity.avatarUri ? (
                <img src={identity.avatarUri} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xl font-space text-foreground truncate">{identity.full_name || 'Habitra User'}</p>
              <div className="mt-1 h-4">
                <TagCarousel tags={identity.tags || []} />
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/settings/profile')}
              className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40 shrink-0 hover:bg-primary/20 hover:border-primary/40 group/btn transition-all"
            >
              <Pencil className="h-5 w-5 text-muted-foreground group-hover/btn:text-primary" />
            </Button>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{level.title}</span>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0 uppercase">Level {level.level}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">{xp} XP earned</p>
              </div>
              {nextLevel && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{nextLevel.xpRequired - xp} XP to level {nextLevel.level}</span>
              )}
            </div>
            <div className="h-2.5 bg-background/50 rounded-full overflow-hidden border border-border/40 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                style={{ width: `${levelProgress}%`, boxShadow: '0 0 12px hsl(var(--primary)/0.4)' }}
              />
            </div>
          </div>

          {habitStats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-2xl p-3.5 border border-border/40 space-y-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Favourite</span>
                </div>
                <p className="text-xs font-bold truncate text-foreground">{habitStats.favourite.title}</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-3.5 border border-border/40 space-y-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Needs Focus</span>
                </div>
                <p className="text-xs font-bold truncate text-foreground">{habitStats.leastFavourite.title}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-4 card-shadow border border-border/40">
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
      <motion.div variants={itemVariants} className="glass rounded-2xl p-4 card-shadow border border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Accent Color</p>
        <div className="flex gap-2.5 flex-wrap">
          {ACCENT_COLORS.map((color, i) => (
            <button
              key={color.name}
              onClick={() => setAccent(i)}
              className="relative h-9 w-9 rounded-full transition-all active:scale-90"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {accentIdx === i && (
                <div 
                  className="absolute inset-0 rounded-full border-2 scale-125 transition-all" 
                  style={{ 
                    borderColor: color.hex,
                    boxShadow: `0 0 15px ${color.hex}88`,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-4 card-shadow border border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Preferences</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Day Ends At</p>
              <p className="text-[10px] text-muted-foreground">When daily cycles reset</p>
            </div>
          </div>
          
          <TimePicker3 
            value={preferences.dayEndTime} 
            onChange={(val) => updatePreferences({ dayEndTime: val })} 
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <HabitReorderList 
          habits={habits} 
          onEdit={setEditHabit}
          onDelete={(id: string) => deleteHabitMutation.mutate(id)}
          onReorder={(ids: string[]) => reorderHabitsMutation.mutate(ids)}
          onDragStart={() => setIsReordering(true)}
          onDragEnd={() => setIsReordering(false)}
          accentColor={ACCENT_COLORS[accentIdx].hex}
        />
      </motion.div>

      {editHabit && (
        <CreateHabitSheet open={!!editHabit} onClose={() => setEditHabit(null)} editHabit={editHabit}
          onSave={(data) => updateHabitMutation.mutate({ id: editHabit.id, data })} />
      )}

    </motion.div>
  );
}
