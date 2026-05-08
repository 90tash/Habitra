import React from 'react';
import { motion } from 'framer-motion';

export default function StreakBadge({ streak, label = 'Current Streak', accent = false }) {
  const hasStreak = streak > 0;

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="relative rounded-2xl overflow-hidden card-shadow text-center"
      style={{
        background: hasStreak
          ? accent
            ? 'linear-gradient(135deg, hsl(var(--accent)/0.18), hsl(var(--accent)/0.06))'
            : 'linear-gradient(135deg, hsl(var(--primary)/0.18), hsl(var(--primary)/0.06))'
          : 'hsl(var(--card)/0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {hasStreak && <div className="absolute inset-0 shimmer pointer-events-none" />}
      <div className="p-4 relative">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className={`text-xl ${hasStreak ? 'flame' : ''}`}>
            {hasStreak ? '🔥' : '❄️'}
          </span>
          <span className="text-2xl font-bold font-space">{streak || 0}</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      </div>
    </motion.div>
  );
}