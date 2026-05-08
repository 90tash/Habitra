import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus } from 'lucide-react';

export default function MidnightHabitRow({ habit, log, index, onChange }) {
  const target = habit.target_value || 1;
  const initialValue = log?.current_value || 0;
  const [value, setValue] = useState(initialValue);
  const color = habit.color || '#7C5CFC';
  const completed = value >= target;

  useEffect(() => {
    onChange(habit, log, { value, completed, skipped: false });
  }, [completed, habit, log, onChange, value]);

  const updateValue = (nextValue) => {
    setValue(Math.max(0, Math.min(target, nextValue)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
      className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: `${color}24`, border: `1px solid ${color}55` }}
        >
          {habit.icon || '*'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{habit.title}</p>
          <p className="mt-0.5 text-[11px] text-white/45">
            {value}/{target} {habit.unit || 'times'}
          </p>
        </div>
        {completed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}30` }}>
            <Check className="h-4 w-4" style={{ color }} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateValue(value - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 hover:text-white disabled:opacity-30"
          disabled={value <= 0}
          aria-label={`Decrease ${habit.title}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="range"
          min="0"
          max={target}
          step="1"
          value={value}
          onChange={(event) => updateValue(Number(event.target.value))}
          className="h-1 flex-1 accent-primary"
          aria-label={`${habit.title} progress`}
        />
        <button
          type="button"
          onClick={() => updateValue(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 hover:text-white disabled:opacity-30"
          disabled={value >= target}
          aria-label={`Increase ${habit.title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
