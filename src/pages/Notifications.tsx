import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Clock, RefreshCcw, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme, ACCENT_COLORS } from '@/lib/useTheme';
import { appStore } from '@/store/appStore';
import { useQueryClient } from '@tanstack/react-query';

// --- Custom Analog Time Picker Modal ---
interface AnalogTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime: string; // "HH:MM" 24h format
  onSave: (time: string) => void;
  accentColor: string;
}

const AnalogTimePicker: React.FC<AnalogTimePickerProps> = ({ isOpen, onClose, initialTime, onSave, accentColor }) => {
  const [h24, m24] = (initialTime || "22:00").split(':').map(Number);
  const initialPeriod = h24 >= 12 ? 'PM' : 'AM';
  const initialHour12 = h24 % 12 || 12;

  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(m24);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);
  const faceRef = useRef<HTMLDivElement>(null);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const [h, m] = (initialTime || "22:00").split(':').map(Number);
      setPeriod(h >= 12 ? 'PM' : 'AM');
      setHour(h % 12 || 12);
      setMinute(m);
      setMode('hour');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const handleSave = () => {
    let finalH = hour;
    if (period === 'PM' && hour < 12) finalH += 12;
    if (period === 'AM' && hour === 12) finalH = 0;
    onSave(`${String(finalH).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    onClose();
  };

  const radius = 95;
  const center = 120;

  const handleFaceClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!faceRef.current) return;
    const rect = faceRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    // Calculate angle in degrees (0 is right, 90 is down)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Shift so 0 is up
    angle = (angle + 90 + 360) % 360;

    if (mode === 'hour') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      setHour(h);
      // Auto switch after small delay
      setTimeout(() => setMode('minute'), 400);
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      setMinute(m);
    }
  };

  const renderDial = () => {
    const isHour = mode === 'hour';
    const items = isHour ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const activeValue = isHour ? hour : (Math.round(minute / 5) * 5) % 60;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {items.map((val, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isActive = isHour ? activeValue === val : activeValue === val;
            
            return (
              <div
                key={val}
                className="absolute flex items-center justify-center rounded-full text-sm font-bold transition-all z-20 pointer-events-none"
                style={{
                  width: '34px', height: '34px',
                  left: `${x - 17}px`, top: `${y - 17}px`,
                  color: isActive ? '#fff' : 'hsl(var(--foreground))',
                }}
              >
                {isHour ? val : String(val).padStart(2, '0')}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Rotation logic: 0deg is Up
  const angleDegree = mode === 'hour' ? (hour % 12) * 30 : minute * 6;

  const handleInteraction = (clientX: number, clientY: number, isDragging = false) => {
    if (!faceRef.current) return;
    const rect = faceRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    if (mode === 'hour') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      setHour(h);
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      setMinute(m);
    }

    // Always clear existing timeout when interacting
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
  };

  const finalizeInteraction = () => {
    if (mode === 'hour') {
      // Delay after letting go of hour hand before switching to minutes
      switchTimeoutRef.current = setTimeout(() => {
        setMode('minute');
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-card w-full max-w-[320px] rounded-[40px] p-6 shadow-2xl border border-white/10"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">Select Time</p>
        
        <div className="flex items-center justify-center gap-3 mb-8">
          <button onClick={() => setMode('hour')}
            className={`text-5xl font-space font-bold rounded-2xl px-4 py-2 transition-all ${mode === 'hour' ? 'text-primary' : 'text-muted-foreground/40'}`}>
            {String(hour).padStart(2, '0')}
          </button>
          <span className="text-3xl font-bold text-muted-foreground/20">:</span>
          <button onClick={() => setMode('minute')}
            className={`text-5xl font-space font-bold rounded-2xl px-4 py-2 transition-all ${mode === 'minute' ? 'text-primary' : 'text-muted-foreground/40'}`}>
            {String(minute).padStart(2, '0')}
          </button>

          <div className="flex flex-col gap-1 ml-2">
            <button onClick={() => setPeriod('AM')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${period === 'AM' ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-transparent text-muted-foreground border-border/40'}`}>
              AM
            </button>
            <button onClick={() => setPeriod('PM')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${period === 'PM' ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-transparent text-muted-foreground border-border/40'}`}>
              PM
            </button>
          </div>
        </div>

        <div 
          ref={faceRef}
          onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
          onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e.clientX, e.clientY, true); }}
          onMouseUp={finalizeInteraction}
          onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => { handleInteraction(e.touches[0].clientX, e.touches[0].clientY, true); }}
          onTouchEnd={finalizeInteraction}
          className="relative w-[240px] h-[240px] mx-auto bg-muted/10 rounded-full flex items-center justify-center mb-8 border border-white/5 cursor-pointer touch-none"
        >
          {/* Center Dot */}
          <div className="absolute w-2 h-2 rounded-full z-30" style={{ backgroundColor: accentColor }} />
          
          {/* Hand/Arm */}
          <motion.div 
            className="absolute bottom-1/2 left-1/2 w-[2px] origin-bottom z-10"
            style={{ 
              height: '95px',
              backgroundColor: accentColor,
              x: '-50%'
            }}
            animate={{ rotate: angleDegree }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
          >
            {/* The Circle at the end of the hand */}
            <div className="absolute top-[-17px] left-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full" style={{ backgroundColor: accentColor }} />
          </motion.div>
          {renderDial()}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-xs uppercase tracking-widest" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 rounded-2xl h-12 font-bold text-xs uppercase tracking-widest bg-primary text-white hover:opacity-90" onClick={handleSave}>Apply</Button>
        </div>
      </motion.div>
    </div>
  );
};

import Midnight, { isMidnightPluginAvailable } from '@/lib/midnightPlugin';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accentIdx } = useTheme();
  
  const [prefs, setPrefs] = useState(() => appStore.getPreferences());
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

  useEffect(() => {
    if (isMidnightPluginAvailable()) {
      Midnight.checkOverlayPermission().then(res => setHasOverlayPermission(res.granted));
    }
  }, []);

  const syncNative = (updatedPrefs: any) => {
    if (isMidnightPluginAvailable()) {
      if (!updatedPrefs.remindersEnabled) {
        Midnight.cancel().catch(console.error);
        return;
      }

      const [h, m] = (updatedPrefs.dailyReviewTime || '22:00').split(':').map(Number);
      Midnight.schedule({
        hour: h,
        minute: m,
        reminderMethod: updatedPrefs.reminderMethod
      }).catch(console.error);
    }
  };

  const updatePrefs = (patch: any) => {
    const next = appStore.updatePreferences(patch);
    setPrefs(next);
    queryClient.invalidateQueries();
    syncNative(next);
  };

  const requestOverlay = async () => {
    if (isMidnightPluginAvailable()) {
      await Midnight.requestOverlayPermission();
      // Check again after a delay (user coming back from settings)
      setTimeout(() => {
        Midnight.checkOverlayPermission().then(res => setHasOverlayPermission(res.granted));
      }, 1000);
    }
  };

  const formatTimeDisplay = (time24: string) => {
    const [h, m] = (time24 || "22:00").split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const accentColor = ACCENT_COLORS[accentIdx].hex;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-6 pb-28 space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-12 w-12 rounded-2xl bg-muted/20 border border-border/40">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold font-space gradient-text">Notifications</h1>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Review Reminders</p>
        
        <div className="glass rounded-[32px] overflow-hidden card-shadow border border-border/40">
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Daily Check-in</p>
                <p className="text-xs text-muted-foreground">Get reminded to log habits</p>
              </div>
            </div>
            <Switch 
              checked={prefs.remindersEnabled} 
              onCheckedChange={(val) => updatePrefs({ remindersEnabled: val })} 
            />
          </div>

          <button 
            className={`w-full flex items-center justify-between p-6 transition-all text-left ${prefs.remindersEnabled ? 'hover:bg-primary/5 active:scale-[0.98]' : 'opacity-40 grayscale pointer-events-none'}`}
            onClick={() => setIsTimePickerOpen(true)}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-base font-bold text-foreground">Reminder Time</p>
            </div>
            <div className="bg-muted/30 px-4 py-2 rounded-2xl border border-border/40 shadow-sm">
              <span className="text-sm font-bold font-space tracking-tight text-primary">{formatTimeDisplay(prefs.dailyReviewTime)}</span>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Reminder Method</p>
        
        <div className="grid gap-3">
          {/* Method A: Smart Nag (Dummy UI) */}
          <button 
            onClick={() => updatePrefs({ reminderMethod: 'nag' })}
            className={`relative p-5 rounded-[32px] border transition-all text-left group ${prefs.reminderMethod === 'nag' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-muted/20 border-border/40 hover:bg-muted/30'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${prefs.reminderMethod === 'nag' ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground'}`}>
                <RefreshCcw className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-foreground">Smart Persistence</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  If you swipe the notification away without logging, we'll nudge you again in 10 minutes.
                </p>
              </div>
            </div>
          </button>

          {/* Method B: Floating Bubble (Dummy UI) */}
          <button 
            onClick={() => updatePrefs({ reminderMethod: 'bubble' })}
            className={`relative p-5 rounded-[32px] border transition-all text-left group ${prefs.reminderMethod === 'bubble' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-muted/20 border-border/40 hover:bg-muted/30'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${prefs.reminderMethod === 'bubble' ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground'}`}>
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-foreground">Floating Overlay</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Show a floating reminder over other apps. Perfect for when you really need the nudge.
                </p>
                {!hasOverlayPermission && prefs.reminderMethod === 'bubble' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-2">Permission Required</p>
                    <Button 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); requestOverlay(); }}
                      className="h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-[10px] font-black"
                    >
                      Grant "Display Over Apps"
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isTimePickerOpen && (
          <AnalogTimePicker 
            isOpen={isTimePickerOpen} 
            onClose={() => setIsTimePickerOpen(false)}
            initialTime={prefs.dailyReviewTime}
            onSave={(time) => updatePrefs({ dailyReviewTime: time })}
            accentColor={accentColor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
