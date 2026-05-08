import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-background"
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 3, opacity: 0.12 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.1 }}
        className="relative"
      >
        <div className="h-24 w-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))',
            boxShadow: '0 20px 60px hsl(var(--primary)/0.4)',
          }}>
          ⚡
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-6 text-center"
      >
        <h1 className="text-3xl font-bold font-space gradient-text">Habitra</h1>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-widest uppercase">Build Better Every Day</p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-16 w-32"
      >
        <div className="h-0.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.9, duration: 1.2, ease: 'easeInOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
