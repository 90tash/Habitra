import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Timer, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/',           icon: Home,         label: 'Home' },
  { path: '/statistics', icon: BarChart3,    label: 'Analytics' },
  { path: '/focus',      icon: Timer,        label: 'Focus' },
  { path: '/settings',   icon: Settings,     label: 'Settings' },
];

const sharedSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 32,
  mass: 1
};

export default function BottomNav() {
  const location = useLocation();

  const handlePress = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(2);
    }
  };

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
        <motion.div 
          layout
          initial={false}
          transition={sharedSpring}
          className="glass-strong border border-white/10 rounded-[32px] p-2 flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={handlePress}
                className={cn(
                  "relative flex items-center justify-center h-12 transition-colors duration-300",
                  isActive ? "px-5" : "w-12"
                )}
                aria-label={tab.label}
              >
                {/* Active Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-full bg-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.15)] border border-primary/20"
                    transition={sharedSpring}
                  />
                )}

                <motion.div 
                  layout="position"
                  transition={sharedSpring}
                  className="relative z-10 flex items-center gap-2.5"
                >
                  <motion.div
                    layout="position"
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}
                    className={cn(
                      "transition-colors duration-300",
                      !isActive && "opacity-60"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>

                  {isActive && (
                    <motion.span
                      layout="position"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] font-bold text-primary whitespace-nowrap"
                      transition={{ 
                        ...sharedSpring,
                        opacity: { duration: 0.2 }
                      }}
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
}
