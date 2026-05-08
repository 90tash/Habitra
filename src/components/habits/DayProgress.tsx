// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import ProgressRing from './ProgressRing';

export default function DayProgress({ completed = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/30 p-4 card-shadow"
      style={{ background: 'linear-gradient(135deg, hsl(var(--card)/0.95), hsl(var(--primary)/0.06))', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-4">
        <ProgressRing progress={percent} size={74} strokeWidth={6} color="hsl(var(--primary))">
          <div className="text-center">
            <p className="text-lg font-bold leading-none font-space">{percent}%</p>
            <p className="text-[9px] text-muted-foreground">done</p>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Today&apos;s progress</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {total === 0 ? 'No habits yet' : `${completed} of ${total} habits completed`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
