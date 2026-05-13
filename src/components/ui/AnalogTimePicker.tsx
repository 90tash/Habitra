import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AnalogTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime: string; // "HH:MM" 24h format
  onSave: (time: string) => void;
  accentColor: string;
}

export const AnalogTimePicker: React.FC<AnalogTimePickerProps> = ({ isOpen, onClose, initialTime, onSave, accentColor }) => {
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

  const handleInteraction = (clientX: number, clientY: number, _isDragging = false) => {
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
