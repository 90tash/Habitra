import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressRing from './ProgressRing';
import { getProgressPercent } from '@/lib/habitUtils';

export default function HabitCard({ habit, log, onIncrement, onDecrement, onComplete }) {
  const currentValue = log?.current_value || 0;
  const target = habit.target_value || 1;
  const progress = getProgressPercent(currentValue, target);
  const isCompleted = log?.is_completed || false;
  const color = habit.color || '#7C5CFC';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 card-shadow ${
        isCompleted ? 'opacity-90' : ''
      }`}
      style={{
        background: isCompleted
          ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`
          : 'hsl(var(--card) / 0.85)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Completion shimmer overlay */}
      {isCompleted && <div className="absolute inset-0 shimmer pointer-events-none rounded-2xl" />}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: isCompleted ? color : `${color}60` }}
      />

      <div className="flex items-center gap-3.5 px-4 py-3.5 pl-5">
        {/* Progress Ring */}
        <ProgressRing progress={progress} size={54} strokeWidth={4} color={color}>
          <span className="text-lg leading-none">{habit.icon || '🎯'}</span>
        </ProgressRing>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm leading-tight ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {habit.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Inline progress bar */}
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {currentValue}/{target}
            </span>
          </div>
          {habit.current_streak > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="flame text-[11px]">🔥</span>
              <span className="text-[10px] font-medium" style={{ color }}>{habit.current_streak}d streak</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isCompleted && target > 1 && (
            <>
              <Button size="icon" variant="ghost"
                className="h-8 w-8 rounded-xl hover:bg-muted"
                onClick={() => onDecrement(habit, log)} disabled={currentValue <= 0}>
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button size="icon" variant="ghost"
                className="h-8 w-8 rounded-xl hover:bg-muted"
                onClick={() => onIncrement(habit, log)}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </>
          )}
          {!isCompleted && target === 1 && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onComplete(habit, log)}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors hover:bg-accent/15"
              style={{ border: `1.5px dashed ${color}60` }}
            >
              <Check className="h-4 w-4" style={{ color: `${color}80` }} />
            </motion.button>
          )}
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="h-9 w-9 rounded-xl flex items-center justify-center glow-accent"
              style={{ backgroundColor: `${color}22`, border: `1.5px solid ${color}60` }}
            >
              <Check className="h-4 w-4" style={{ color }} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
