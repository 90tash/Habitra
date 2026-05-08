import React from 'react';
import { motion } from 'framer-motion';
import { getLevelForXP, getNextLevel, getLevelProgress } from '@/lib/gamification';

export default function XPBar({ xp = 0 }) {
  const level = getLevelForXP(xp);
  const next = getNextLevel(xp);
  const progress = getLevelProgress(xp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-border/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{level.icon}</span>
          <div>
            <p className="text-sm font-bold">{level.title}</p>
            <p className="text-[10px] text-muted-foreground">Level {level.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{xp} XP</p>
          {next && <p className="text-[10px] text-muted-foreground">{next.xpRequired - xp} to next</p>}
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {next && (
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">{level.title}</span>
          <span className="text-[9px] text-muted-foreground">{next.title}</span>
        </div>
      )}
    </motion.div>
  );
}