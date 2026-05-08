import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@/lib/gamification';

interface BadgeUnlockToastProps {
  badge: Badge | null;
  onClose: () => void;
}

export default function BadgeUnlockToast({ badge, onClose }: BadgeUnlockToastProps) {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
        >
          <div className="bg-background/95 backdrop-blur-md border border-border/50 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 max-w-sm w-full pointer-events-auto overflow-hidden relative group">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0 border border-primary/20 relative">
              <span className="relative z-10">{badge.icon}</span>
              <motion.div 
                className="absolute inset-0 rounded-xl bg-primary/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">New Badge Unlocked!</p>
                <Trophy className="h-2.5 w-2.5 text-yellow-500" />
              </div>
              <p className="text-sm font-bold truncate leading-tight mt-0.5">{badge.title}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{badge.desc}</p>
            </div>

            <button 
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-full transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
