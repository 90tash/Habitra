import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * Reusable EmptyState component for consistent empty UI across the app.
 * Props:
 *   emoji      - large emoji illustration
 *   title      - main heading
 *   description - supporting text
 *   action     - { label, onClick } for CTA button
 *   compact    - smaller variant
 */
interface EmptyStateProps {
  emoji?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  hero?: boolean;
}

export default function EmptyState({ 
  emoji = '🌱', 
  title, 
  description, 
  action, 
  compact = false,
  hero = false
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`flex flex-col items-center text-center rounded-[48px] border border-white/10 ${hero ? 'flex-1 py-16 px-8' : compact ? 'p-6' : 'p-10'}`}
      style={{
        background: hero 
          ? 'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--accent)/0.15))' 
          : 'linear-gradient(135deg, hsl(var(--primary)/0.08), hsl(var(--accent)/0.05))',
        backdropFilter: 'blur(40px)',
        minHeight: hero ? '520px' : 'auto',
        boxShadow: hero ? '0 30px 60px -12px rgba(0,0,0,0.3)' : '0 10px 30px -12px rgba(0,0,0,0.1)',
      }}
    >
      <div className="relative mb-8">
        {hero && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150"
          />
        )}
        <motion.span
          animate={hero 
            ? { y: [0, -15, 0], scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }
            : { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }
          }
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className={`relative z-10 select-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] ${hero ? 'text-[140px]' : compact ? 'text-4xl mb-3' : 'text-6xl mb-5'}`}
        >
          {emoji}
        </motion.span>
      </div>

      {title && (
        <h2 className={`font-bold font-space tracking-tight text-white ${hero ? 'text-3xl sm:text-4xl leading-tight' : compact ? 'text-sm' : 'text-base'}`}>{title}</h2>
      )}
      {description && (
        <p className={`text-muted-foreground mt-4 leading-relaxed ${hero ? 'text-base max-w-[280px] opacity-70' : compact ? 'text-xs' : 'text-xs max-w-[220px]'}`}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size={hero ? 'lg' : compact ? 'sm' : 'default'}
          className={`font-black shadow-2xl glow-primary transition-all hover:scale-105 active:scale-95 ${hero ? 'mt-12 h-24 w-full text-2xl rounded-[32px]' : 'rounded-full mt-6 h-10 text-sm'}`}
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))',
            boxShadow: hero ? '0 15px 30px -10px hsl(var(--primary)/0.3)' : 'none'
          }}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
