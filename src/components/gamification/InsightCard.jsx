import React from 'react';
import { motion } from 'framer-motion';
import { generateInsights } from '@/lib/gamification';

export default function InsightCard({ habits, logs }) {
  const insights = generateInsights(habits, logs);

  return (
    <div className="glass rounded-2xl p-4 border border-border/50 space-y-2.5">
      <h3 className="text-sm font-semibold">Smart Insights</h3>
      {insights.map((ins, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-start gap-2.5 bg-muted/30 rounded-xl p-2.5"
        >
          <span className="text-base flex-shrink-0 mt-0.5">{ins.icon}</span>
          <p className="text-xs text-foreground/80 leading-relaxed">{ins.text}</p>
        </motion.div>
      ))}
    </div>
  );
}