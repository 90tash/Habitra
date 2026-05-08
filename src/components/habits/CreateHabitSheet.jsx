import React, { useEffect, useState } from 'react';
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_ICONS } from '@/lib/habitUtils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_FORM = {
  title: '',
  description: '',
  icon: HABIT_ICONS[0],
  category: 'health',
  color: HABIT_COLORS[0],
  frequency: 'daily',
  target_value: 1,
  unit: 'times',
  reminder_time: '',
  is_active: true,
};

export default function CreateHabitSheet({ open, onClose, onSave, editHabit }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    setForm(editHabit ? { ...DEFAULT_FORM, ...editHabit } : DEFAULT_FORM);
  }, [editHabit, open]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
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
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92vh] max-w-md overflow-y-auto rounded-t-3xl border-border/50">
        <SheetHeader>
          <SheetTitle>{editHabit ? 'Edit Habit' : 'Create Habit'}</SheetTitle>
          <SheetDescription>Set the habit target and how it should appear in your list.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input id="habit-title" value={form.title} onChange={event => update('title', event.target.value)} placeholder="Drink water" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-description">Description</Label>
            <Input id="habit-description" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Optional note" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="habit-target">Target</Label>
              <Input id="habit-target" type="number" min="1" value={form.target_value} onChange={event => update('target_value', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-unit">Unit</Label>
              <Input id="habit-unit" value={form.unit} onChange={event => update('unit', event.target.value)} placeholder="times" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-category">Category</Label>
            <select
              id="habit-category"
              value={form.category}
              onChange={event => update('category', event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {HABIT_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => update('icon', icon)}
                  className={`h-8 rounded-lg text-base ${form.icon === icon ? 'bg-primary/15 ring-1 ring-primary' : 'bg-muted/50'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update('color', color)}
                  className={`h-8 w-8 rounded-full ${form.color === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-background' : ''}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Use color ${color}`}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="h-11 w-full rounded-xl">
            {editHabit ? 'Save Changes' : 'Create Habit'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
