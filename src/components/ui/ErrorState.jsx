import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable ErrorState component for network/data errors.
 * Props:
 *   title       - error heading (default: "Something went wrong")
 *   description - error details
 *   onRetry     - retry callback
 *   compact     - smaller variant
 */
export default function ErrorState({ title = 'Something went wrong', description, onRetry, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center text-center rounded-3xl ${compact ? 'p-5' : 'p-8'}`}
      style={{ background: 'hsl(var(--destructive)/0.06)', border: '1px solid hsl(var(--destructive)/0.2)' }}
    >
      <div className={`rounded-2xl flex items-center justify-center mb-3 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
        style={{ background: 'hsl(var(--destructive)/0.12)' }}>
        <AlertCircle className={`text-destructive ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} />
      </div>
      <p className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[240px]">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}
          className={`rounded-xl gap-1.5 ${compact ? 'mt-3 h-8 text-xs' : 'mt-5 h-9'}`}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}