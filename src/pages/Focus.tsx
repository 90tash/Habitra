import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Settings2, Target, History, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressRing from '@/components/habits/ProgressRing';

import { format, getDaysInMonth } from 'date-fns';

function ProgressBar({ label, current, target, unit, color }: { label: string, current: number, target: number, unit: string, color: string }) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-bold font-space">{current}{unit} <span className="text-muted-foreground/50">/ {target}{unit}</span></p>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}40` }}
        />
      </div>
    </div>
  );
}

function FocusAnalytics({ totalFocusMin, sessionsToday }: { totalFocusMin: number, sessionsToday: number }) {
  const [activeTab, setActiveTab] = useState<'focus' | 'break'>('focus');

  const totalHoursInWeek = 24 * 7;
  const totalHoursInMonth = getDaysInMonth(new Date()) * 24;
  const totalHoursInYear = 24 * 365;

  const stats = {
    focus: {
      week: { current: Math.round(totalFocusMin / 60), target: totalHoursInWeek },
      month: { current: Math.round(totalFocusMin / 60), target: totalHoursInMonth },
      year: { current: Math.round(totalFocusMin / 60), target: totalHoursInYear },
      lifetime: { sessions: sessionsToday, hours: Math.round(totalFocusMin / 60) }
    },
    break: {
      week: { current: 0, target: totalHoursInWeek },
      month: { current: 0, target: totalHoursInMonth },
      year: { current: 0, target: totalHoursInYear },
      lifetime: { sessions: 0, hours: 0 }
    }
  };

  const currentStats = stats[activeTab];

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/20">
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'focus' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Target className="h-3.5 w-3.5" />
          Focus
        </button>
        <button
          onClick={() => setActiveTab('break')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'break' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <History className="h-3.5 w-3.5" />
          Break
        </button>
      </div>

      {/* Progress Bars */}
      <div className="glass rounded-2xl p-4 card-shadow border border-border/30 space-y-4">
        <ProgressBar label="This Week" current={currentStats.week.current} target={currentStats.week.target} unit="h" color={activeTab === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
        <ProgressBar label="This Month" current={currentStats.month.current} target={currentStats.month.target} unit="h" color={activeTab === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
        <ProgressBar label="This Year" current={currentStats.year.current} target={currentStats.year.target} unit="h" color={activeTab === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
      </div>

      {/* Lifetime Tab */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="glass rounded-2xl p-4 card-shadow border border-border/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeTab === 'focus' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifetime</p>
            <p className="text-sm font-bold">{currentStats.lifetime.hours} Hours tracked</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-space">{currentStats.lifetime.sessions}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Sessions</p>
        </div>
      </motion.div>
    </div>
  );
}

type Mode = {
  key: 'focus' | 'short' | 'long';
  label: string;
  color: string;
};

const DEFAULT_DURATIONS: Record<Mode['key'], number> = { focus: 25, short: 5, long: 15 };

const MODES: Mode[] = [
  { key: 'focus', label: 'Focus',       color: 'hsl(var(--primary))' },
  { key: 'short', label: 'Short Break', color: 'hsl(var(--accent))'  },
  { key: 'long',  label: 'Long Break',  color: 'hsl(var(--chart-3))' },
];

const SESSION_TIPS = [
  'Turn off notifications. Deep work requires deep silence.',
  'One task at a time. Monotasking beats multitasking.',
  "The next 25 minutes belong to you. Protect them.",
  'Flow state begins after ~10 minutes of resistance. Push through.',
  'Small wins stack. This session counts.',
];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

export default function Focus() {
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalFocusMin, setTotalFocusMin] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tip] = useState(() => SESSION_TIPS[Math.floor(Math.random() * SESSION_TIPS.length)]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDuration = durations[mode.key] * 60;
  const progress = ((currentDuration - timeLeft) / currentDuration) * 100;
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode.key === 'focus') { setSessionsToday(s => s + 1); setTotalFocusMin(m => m + durations.focus); }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, mode, durations]);

  const switchMode = (m: Mode) => { setIsRunning(false); setMode(m); setTimeLeft(durations[m.key] * 60); };
  const reset = () => { setIsRunning(false); setTimeLeft(durations[mode.key] * 60); };
  const skip = () => { const idx = MODES.findIndex(m => m.key === mode.key); switchMode(MODES[(idx + 1) % MODES.length]); };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="px-4 pt-6 pb-28 space-y-4">

      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space gradient-text">Focus</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Stay in the zone</p>
        </div>
        <Button size="icon" variant="ghost"
          className={`rounded-xl h-9 w-9 transition-colors ${showSettings ? 'bg-primary/15 text-primary' : ''}`}
          onClick={() => setShowSettings(s => !s)}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="glass rounded-2xl p-4 card-shadow border border-border/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timer Settings</p>
              {[
                { key: 'focus', label: 'Focus', min: 5, max: 90 },
                { key: 'short', label: 'Short Break', min: 1, max: 30 },
                { key: 'long',  label: 'Long Break',  min: 5, max: 60 },
              ].map(({ key, label, min, max }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24">{label}</span>
                  <input type="range" min={min} max={max} value={durations[key as Mode['key']]}
                    onChange={e => { const v = Number(e.target.value); setDurations(d => ({ ...d, [key]: v })); if (mode.key === key) setTimeLeft(v * 60); }}
                    className="flex-1 accent-primary h-1" />
                  <span className="text-xs font-semibold w-10 text-right">{durations[key as Mode['key']]}m</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode switcher */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-1.5 card-shadow border border-border/30 flex gap-1">
        {MODES.map(m => (
          <button key={m.key} onClick={() => switchMode(m)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all relative overflow-hidden">
            {mode.key === m.key && (
              <motion.div layoutId="modeBg" className="absolute inset-0 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${m.color}25, ${m.color}10)`, border: `1px solid ${m.color}40` }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
            )}
            <span className={`relative z-10 transition-colors ${mode.key === m.key ? 'text-foreground' : 'text-muted-foreground'}`}>
              {m.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Timer */}
      <motion.div variants={itemVariants} className="flex flex-col items-center py-6">
        <div className="relative">
          {isRunning && (
            <>
              <motion.div className="absolute inset-0 rounded-full -m-4"
                animate={{ boxShadow: [`0 0 0 0 ${mode.color}30`, `0 0 60px 20px ${mode.color}10`, `0 0 0 0 ${mode.color}30`] }}
                transition={{ repeat: Infinity, duration: 2.5 }} />
              <motion.div className="absolute inset-0 rounded-full -m-2"
                animate={{ boxShadow: [`0 0 0 0 ${mode.color}20`, `0 0 30px 8px ${mode.color}15`, `0 0 0 0 ${mode.color}20`] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
            </>
          )}
          <ProgressRing progress={progress} size={220} strokeWidth={8} color={mode.color}>
            <div className="text-center">
              <motion.span key={timeLeft}
                initial={{ opacity: 0.7, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-bold font-space tracking-tight">
                {formatTime(timeLeft)}
              </motion.span>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{mode.label}</p>
            </div>
          </ProgressRing>
        </div>

        <div className="flex items-center gap-5 mt-8">
          <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
            className="h-12 w-12 rounded-2xl flex items-center justify-center glass card-shadow border border-border/40 hover:border-primary/30 transition-colors">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => setIsRunning(r => !r)}
            className="h-18 w-18 rounded-3xl flex items-center justify-center shadow-2xl transition-all"
            style={{
              background: `linear-gradient(135deg, ${mode.color}, ${mode.color}bb)`,
              boxShadow: `0 8px 32px ${mode.color}40`,
              width: '4.5rem', height: '4.5rem',
            }}>
            {isRunning
              ? <Pause className="h-6 w-6 text-white" />
              : <Play className="h-6 w-6 text-white ml-0.5" />
            }
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={skip}
            className="h-12 w-12 rounded-2xl flex items-center justify-center glass card-shadow border border-border/40 hover:border-primary/30 transition-colors">
            <SkipForward className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Tip */}
      {mode.key === 'focus' && (
        <motion.div variants={itemVariants}
          className="rounded-2xl px-4 py-3.5 card-shadow flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.06))', backdropFilter: 'blur(20px)' }}>
          <span className="text-lg leading-none mt-0.5">💡</span>
          <p className="text-xs text-muted-foreground leading-relaxed italic">{tip}</p>
        </motion.div>
      )}

      {/* Session stats */}
      <motion.div variants={itemVariants}
        className="glass rounded-2xl p-4 card-shadow border border-border/30">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-2xl font-bold font-space">{sessionsToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions today</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-space">{totalFocusMin}m</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Focus time</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: Math.min(sessionsToday, 8) }, (_, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
              className="h-3.5 w-3.5 rounded-full"
              style={{ background: mode.color, boxShadow: `0 0 8px ${mode.color}60` }} />
          ))}
          {sessionsToday === 0 && <p className="text-[11px] text-muted-foreground">Start your first session 🎯</p>}
        </div>
      </motion.div>

      {/* Analytics Section */}
      <motion.div variants={itemVariants}>
        <FocusAnalytics totalFocusMin={totalFocusMin} sessionsToday={sessionsToday} />
      </motion.div>

      {/* Completion overlay */}
      <AnimatePresence>
        {timeLeft === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(32px)' }}>
            <motion.div initial={{ scale: 0.82, y: 24 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="text-center px-8 max-w-sm">
              <motion.div animate={{ scale: [1, 1.18, 1], rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="text-7xl mb-5">
                {mode.key === 'focus' ? '🎉' : '☕'}
              </motion.div>
              <h2 className="text-2xl font-bold font-space text-white mb-2">
                {mode.key === 'focus' ? `Session ${sessionsToday} complete!` : 'Break over!'}
              </h2>
              <p className="text-sm text-white/55 mb-8 leading-relaxed">
                {mode.key === 'focus' ? 'Time for a well-deserved break.' : 'Ready to focus again?'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline"
                  className="rounded-xl border-white/20 text-white hover:bg-white/10"
                  onClick={() => switchMode(mode.key === 'focus' ? MODES[1] : MODES[0])}>
                  {mode.key === 'focus' ? '☕ Take Break' : '🎯 Start Focus'}
                </Button>
                <Button className="rounded-xl" onClick={reset}
                  style={{ background: mode.color }}>
                  Restart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}