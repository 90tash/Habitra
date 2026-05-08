import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable loading skeleton & spinner components.
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-3', lg: 'h-12 w-12 border-4' };
  return (
    <div className={`rounded-full border-primary/20 border-t-primary animate-spin ${sizes[size]} ${className}`} />
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 2 }: SkeletonCardProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl p-4 card-shadow overflow-hidden"
      style={{ background: 'hsl(var(--card)/0.8)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded-full animate-pulse w-3/4" />
          <div className="h-2 bg-muted rounded-full animate-pulse w-1/2" />
        </div>
        <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
      </div>
      {lines > 1 && <div className="h-1.5 bg-muted rounded-full animate-pulse w-full" />}
    </motion.div>
  );
}

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="md" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

interface LoadingStateProps {
  count?: number;
}

export default function LoadingState({ count = 3 }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
