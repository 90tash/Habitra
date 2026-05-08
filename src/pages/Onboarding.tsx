import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ONBOARDING_STEPS, markOnboardingComplete } from '@/lib/onboarding';

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.96, transition: { duration: 0.2 } }),
};

const BG_GRADIENTS = [
  'from-violet-600/20 via-purple-600/10 to-transparent',
  'from-blue-600/20 via-cyan-600/10 to-transparent',
  'from-amber-500/20 via-orange-500/10 to-transparent',
  'from-emerald-600/20 via-teal-600/10 to-transparent',
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const next = () => {
    if (isLast) {
      markOnboardingComplete();
      onComplete();
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const skip = () => {
    markOnboardingComplete();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-background overflow-hidden">
      {/* Animated background blob */}
      <div className={`absolute inset-0 bg-gradient-to-br ${BG_GRADIENTS[step]} transition-all duration-700`} />
      <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{ background: ['#7C5CFC', '#4D96FF', '#FF9F45', '#4ECDC4'][step] }} />

      {/* Skip */}
      <div className="relative flex justify-end px-6 pt-14">
        {!isLast && (
          <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted/50">
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            className="flex flex-col items-center w-full max-w-sm">

            {/* Emoji */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-8xl mb-8 select-none">
              {current.emoji}
            </motion.div>

            {/* Badge */}
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/60 rounded-full px-3 py-1 mb-4">
              {current.subtitle}
            </div>

            <h1 className="text-3xl font-bold font-space leading-tight mb-4">
              {current.title}
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="relative px-6 pb-12 space-y-5">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === step ? 24 : 6, opacity: i === step ? 1 : 0.35 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="h-1.5 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={next}
            className="w-full h-14 rounded-2xl text-base font-bold shadow-2xl border-0 gap-2"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}>
            {isLast ? (
              <><Sparkles className="h-5 w-5" />Start Building Habits</>
            ) : (
              <>{current.cta}<ChevronRight className="h-5 w-5" /></>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}