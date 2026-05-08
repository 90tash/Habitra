// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomQuote } from '@/lib/habitUtils';

export default function QuoteCard() {
  const [quote, setQuote] = useState(getRandomQuote);

  useEffect(() => {
    const interval = setInterval(() => setQuote(getRandomQuote()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden card-shadow"
      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.12) 0%, hsl(var(--accent)/0.08) 100%)', backdropFilter: 'blur(20px)' }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      <div className="p-5 relative">
        <span className="text-2xl opacity-30 absolute top-3 left-4">"</span>
        <AnimatePresence mode="wait">
          <motion.div key={quote.text}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}>
            <p className="text-sm font-medium leading-relaxed pl-4 pr-2 italic text-foreground/90">
              {quote.text}
            </p>
            <p className="text-xs text-muted-foreground mt-2.5 pl-4 font-medium">— {quote.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}