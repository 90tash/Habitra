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
export default function EmptyState({ emoji = '🌱', title, description, action, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex flex-col items-center text-center rounded-3xl card-shadow ${compact ? 'p-6' : 'p-10'}`}
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)/0.08), hsl(var(--accent)/0.05))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className={`select-none ${compact ? 'text-4xl mb-3' : 'text-6xl mb-5'}`}
      >
        {emoji}
      </motion.span>

      {title && (
        <p className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      )}
      {description && (
        <p className={`text-muted-foreground mt-1.5 leading-relaxed ${compact ? 'text-xs' : 'text-xs max-w-[220px]'}`}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size={compact ? 'sm' : 'default'}
          className={`rounded-xl font-semibold shadow-lg glow-primary ${compact ? 'mt-4 h-9 text-xs px-4' : 'mt-6 h-10 text-sm'}`}
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}