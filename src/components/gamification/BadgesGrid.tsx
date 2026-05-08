// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { BADGES } from '@/lib/gamification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function BadgesGrid({ unlockedBadges = [] }) {
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  return (
    <div className="glass rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Badges</h3>
        <span className="text-[10px] text-muted-foreground">{unlockedBadges.length}/{BADGES.length} unlocked</span>
      </div>
      <TooltipProvider>
        <div className="grid grid-cols-4 gap-2.5">
          {BADGES.map((badge, i) => {
            const isUnlocked = unlockedIds.has(badge.id);
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-default transition-all ${
                      isUnlocked ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <p className="text-[8px] text-center leading-tight text-muted-foreground line-clamp-2">{badge.title}</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[140px] text-center">
                  <p className="font-semibold">{badge.title}</p>
                  <p className="text-muted-foreground mt-0.5">{badge.desc}</p>
                  <p className="text-primary mt-1">+{badge.xp} XP</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}