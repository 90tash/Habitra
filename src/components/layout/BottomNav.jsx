import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, CalendarDays, Timer, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/',           icon: Home,         label: 'Home' },
  { path: '/statistics', icon: BarChart3,    label: 'Stats' },
  { path: '/calendar',   icon: CalendarDays, label: 'Calendar' },
  { path: '/focus',      icon: Timer,        label: 'Focus' },
  { path: '/settings',   icon: Settings,     label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass-strong border-t border-border/40 max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-1">
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link key={tab.path} to={tab.path}
                className="relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-colors min-w-0"
                aria-label={tab.label}>
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="navBubble"
                      className="absolute inset-0 rounded-xl -m-1.5"
                      style={{ background: 'hsl(var(--primary)/0.12)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <motion.div
                    animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  >
                    <Icon className={`h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </motion.div>
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}