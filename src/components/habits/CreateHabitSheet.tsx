import React, { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_ICONS } from '@/lib/habitUtils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Habit, HabitInput, TimeOfDay } from '@/lib/types';

const DEFAULT_FORM: HabitInput = {
  title: '',
  description: '',
  icon: HABIT_ICONS[0],
  category: 'health',
  color: HABIT_COLORS[0],
  frequency: 'daily',
  timeOfDay: 'anytime',
  target_value: 1,
  unit: 'times',
  is_active: true,
  sort_order: 0,
};

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; emoji?: string }[] = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'morning', label: 'Morning', emoji: '☀️' },
  { value: 'afternoon', label: 'Afternoon', emoji: '🌤️' },
  { value: 'evening', label: 'Evening', emoji: '🌙' },
];

interface CreateHabitSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HabitInput) => void;
  editHabit: Habit | null;
}

export default function CreateHabitSheet({ open, onClose, onSave, editHabit }: CreateHabitSheetProps) {
  const [form, setForm] = useState<HabitInput>(DEFAULT_FORM);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    setForm(editHabit ? { 
      title: editHabit.title,
      description: editHabit.description,
      icon: editHabit.icon,
      category: editHabit.category,
      color: editHabit.color,
      frequency: editHabit.frequency,
      timeOfDay: editHabit.timeOfDay || 'anytime',
      target_value: editHabit.target_value,
      unit: editHabit.unit,
      is_active: editHabit.is_active,
      sort_order: editHabit.sort_order,
      reminder_time: editHabit.reminder_time,
    } : DEFAULT_FORM);
  }, [editHabit, open]);

  const update = (field: keyof HabitInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: HabitInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      target_value: Math.max(1, Number(form.target_value) || 1),
    };
    if (!payload.title) return;
    onSave(payload);
    onClose();
  };


  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent side="bottom" className="mx-auto max-h-[96vh] max-w-md overflow-y-auto rounded-t-[32px] border-border/50 bg-background/95 backdrop-blur-md">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-2xl font-bold font-space gradient-text">
              {editHabit ? 'Edit Habit' : 'Create Habit'}
            </SheetTitle>
            <SheetDescription>Set your intention and customize how it looks.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="habit-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Title</Label>
                <Input id="habit-title" value={form.title} onChange={event => update('title', event.target.value)} placeholder="Drink water" className="h-12 rounded-2xl bg-muted/20 border-border/50 focus:ring-primary/20" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="habit-description" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Description</Label>
                <Input id="habit-description" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Keep hydrated throughout the day" className="h-12 rounded-2xl bg-muted/20 border-border/50 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="habit-target" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Target</Label>
                  <Input id="habit-target" type="number" min="1" value={form.target_value} onChange={event => update('target_value', event.target.value)} className="h-12 rounded-2xl bg-muted/20 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="habit-unit" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Unit</Label>
                  <Input id="habit-unit" value={form.unit} onChange={event => update('unit', event.target.value)} placeholder="times" className="h-12 rounded-2xl bg-muted/20 border-border/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="habit-category" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Category</Label>
                <select
                  id="habit-category"
                  value={form.category}
                  onChange={event => update('category', event.target.value)}
                  className="h-12 w-full rounded-2xl border border-border/50 bg-muted/20 px-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {HABIT_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Icon</Label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="flex items-center justify-between w-full h-12 px-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all active:scale-[0.98]"
                  >
                    <span className="text-xl">{form.icon}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Color</Label>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(true)}
                    className="flex items-center justify-between w-full h-12 px-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all active:scale-[0.98]"
                  >
                    <div className="h-5 w-5 rounded-full shadow-lg" style={{ backgroundColor: form.color, boxShadow: `0 0 12px ${form.color}66` }} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Do It At</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OF_DAY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update('timeOfDay', option.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-medium transition-all duration-200 border",
                        form.timeOfDay === option.value
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                          : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/20"
                      )}
                    >
                      {option.label} {option.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 active:scale-[0.99] transition-all mt-4">
              {editHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Icon Picker Dialog */}
      <Dialog open={showIconPicker} onOpenChange={setShowIconPicker}>
        <DialogContent className="max-w-xs rounded-[32px] border-border/50 bg-background/98 backdrop-blur-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-space">Choose Icon</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-3 mt-4 overflow-y-auto max-h-[40vh] p-1">
            {HABIT_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  update('icon', icon);
                  setShowIconPicker(false);
                }}
                className={cn(
                  "h-12 w-12 rounded-2xl text-xl flex items-center justify-center transition-all active:scale-90",
                  form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="max-w-xs rounded-[32px] border-border/50 bg-background/98 backdrop-blur-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-space">Choose Color</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap justify-center gap-4 mt-4 p-1">
            {HABIT_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  update('color', color);
                  setShowColorPicker(false);
                }}
                className={cn(
                  "h-10 w-10 rounded-full transition-all active:scale-90",
                  form.color === color ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-110" : "hover:scale-105"
                )}
                style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}44` }}
                aria-label={`Use color ${color}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
