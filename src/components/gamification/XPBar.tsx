import React from 'react';
import { motion } from 'framer-motion';
import { getLevelForXP, getNextLevel, getLevelProgress } from '@/lib/gamification';
import { Mountain, Shield, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <div className={cn(
            "p-2 rounded-xl bg-white/5 border border-white/10",
            level.isRare && "border-purple-500/30",
            level.isApex && "border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
          )}>
            {level.tier === 'Initiate' && <Mountain className="h-5 w-5 text-slate-400" />}
            {level.tier === 'Builder' && <Shield className="h-5 w-5 text-emerald-400" />}
            {level.tier === 'Legend' && !level.isApex && <Sparkles className="h-5 w-5 text-purple-400" />}
            {level.isApex && <Crown className="h-5 w-5 text-yellow-400" />}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: level.color }}>{level.title}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rank {level.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{xp} XP</p>
          {next && <p className="text-[10px] text-muted-foreground">{next.xpRequired - xp} more</p>}
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