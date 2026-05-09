import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Camera, X, Check, Clock, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCENT_COLORS, useTheme } from '@/lib/useTheme';
import { appStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import Midnight from '@/lib/midnightPlugin';
import { Capacitor } from '@capacitor/core';
import type { LocalUser, UserPreferences } from '@/lib/types';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PRESETS = [
  { label: '10:00 PM', h: 10, m: '00', p: 'PM' },
  { label: '11:00 PM', h: 11, m: '00', p: 'PM' },
  { label: '12:00 AM', h: 12, m: '00', p: 'AM' },
  { label: '1:00 AM', h: 1, m: '00', p: 'AM' },
  { label: '2:00 AM', h: 2, m: '00', p: 'AM' },
];

export default function ProfileSetupWizard({ onComplete }: ProfileSetupWizardProps) {
  const [step, setStep] = useState(1);
  const { setAccent, accentIdx } = useTheme();
  
  // Form State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dayEndTime, setDayEndTime] = useState('00:00');
  const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

  // Time Picker Local State
  const [selectedH, setSelectedH] = useState(12);
  const [selectedM, setSelectedM] = useState('00');
  const [selectedP, setSelectedP] = useState<'AM' | 'PM'>('AM');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal picker state to dayEndTime string
  useEffect(() => {
    let h = selectedH;
    if (selectedP === 'PM' && h < 12) h += 12;
    if (selectedP === 'AM' && h === 12) h = 0;
    const timeStr = `${String(h).padStart(2, '0')}:${selectedM}`;
    setDayEndTime(timeStr);
  }, [selectedH, selectedM, selectedP]);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') {
      Midnight.checkOverlayPermission().then(res => setHasOverlayPermission(res.granted));
    }
  }, [step]);

  const requestPermission = async () => {
    if (Capacitor.getPlatform() === 'android') {
      await Midnight.requestOverlayPermission();
      setTimeout(() => {
        Midnight.checkOverlayPermission().then(res => setHasOverlayPermission(res.granted));
      }, 1000);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    const identity: LocalUser = {
      id: 'local-user',
      full_name: name,
      email: 'local@habitra.app',
      avatarUri: avatar,
      accentColor: ACCENT_COLORS[accentIdx].hex,
      created_at: new Date().toISOString(),
    };
    
    const preferences: UserPreferences = {
      dayEndTime,
      onboardingCompleted: true,
    };
    
    appStore.updateIdentity(identity);
    appStore.updatePreferences(preferences);
    onComplete();
  };

  const nextStep = () => {
    if (step === 1 && !name.trim()) return;
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const formatDisplayTime = () => {
    return `${selectedH}:${selectedM} ${selectedP}`;
  };

  return (
    <div className="fixed inset-0 z-[500] bg-background flex flex-col overflow-hidden text-foreground">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${ACCENT_COLORS[accentIdx].hex}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-10"
          style={{ background: `radial-gradient(circle, #4F46E5, transparent 70%)` }} />
      </div>

      <div className="relative flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold font-space gradient-text">Create Your Profile</h1>
                <p className="text-muted-foreground mt-2">Personalize Habitra to match your style.</p>
              </div>

              {/* Minimal Profile Picture Section */}
              <div className="flex flex-col items-center pt-2">
                <div className="relative group">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="h-32 w-32 rounded-full border-2 border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden shadow-2xl relative"
                  >
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-14 w-14 text-muted-foreground/40" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                       <Camera className="h-6 w-6 text-white/70" />
                    </div>
                  </motion.div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background active:scale-90 transition-transform"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full h-9 px-5 bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 active:scale-95 transition-all text-xs font-medium"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Gallery
                  </Button>
                  {avatar && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full h-9 px-5 bg-destructive/5 border border-destructive/20 backdrop-blur-md hover:bg-destructive/10 active:scale-95 transition-all text-xs font-medium text-destructive/80"
                      onClick={() => setAvatar(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name-input" className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60">Name</Label>
                  <Input 
                    id="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-14 rounded-2xl bg-muted/10 border-border/40 px-5 focus:ring-primary/20 text-lg transition-all focus:bg-muted/20"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60">Choose Your Theme Color</Label>
                  <div className="grid grid-cols-5 gap-y-5 gap-x-2 px-1">
                    {ACCENT_COLORS.map((color, i) => (
                      <div key={color.name} className="flex justify-center">
                        <button
                          onClick={() => setAccent(i)}
                          className={cn(
                            "relative h-12 w-12 rounded-full transition-all duration-300",
                            accentIdx === i ? "scale-110" : "hover:scale-105 opacity-80"
                          )}
                          style={{ 
                            backgroundColor: color.hex, 
                            boxShadow: accentIdx === i ? `0 0 25px ${color.hex}88` : `0 0 10px ${color.hex}22` 
                          }}
                        >
                          <AnimatePresence>
                            {accentIdx === i && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <Check className="h-3.5 w-3.5" style={{ color: color.hex }} strokeWidth={4} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold font-space gradient-text">When does your day end?</h1>
                <p className="text-muted-foreground mt-2">Choose the time you usually go to sleep.</p>
              </div>

              {/* Custom Wheel Time Picker Card */}
              <div className="glass rounded-[32px] border border-white/10 overflow-hidden shadow-2xl bg-muted/10 backdrop-blur-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Custom Day Cycle</p>
                    <p className="text-xs text-muted-foreground opacity-60 font-medium">This defines when habits reset and streaks update.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold font-space text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">
                      {formatDisplayTime()}
                    </span>
                  </div>

                  <div className="relative w-full flex justify-center items-center h-[200px] select-none">
                    {/* Highlight Bar */}
                    <div className="absolute top-1/2 -translate-y-1/2 h-[60px] w-full max-w-[240px] rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)] pointer-events-none" />

                    <div className="flex items-center justify-center gap-4 h-full w-full">
                      {/* Hours Wheel */}
                      <InfiniteWheel 
                        items={HOURS} 
                        value={selectedH} 
                        onChange={setSelectedH} 
                        itemHeight={60}
                      />

                      <span className="text-2xl font-bold text-primary mb-1">:</span>

                      {/* Minutes Wheel */}
                      <InfiniteWheel 
                        items={MINUTES} 
                        value={selectedM} 
                        onChange={setSelectedM} 
                        itemHeight={60}
                      />
                    </div>
                  </div>

                  {/* AM/PM Selector */}
                  <div className="flex gap-2 mt-8 p-1.5 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                    {['AM', 'PM'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedP(p as any)}
                        className={cn(
                          "w-20 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                          selectedP === p 
                            ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                            : "text-muted-foreground/60 hover:text-muted-foreground"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] ml-4 text-muted-foreground/60">Quick Presets</p>
                <div className="flex gap-2 flex-wrap px-2 justify-center">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setSelectedH(preset.h);
                        setSelectedM(preset.m);
                        setSelectedP(preset.p as any);
                      }}
                      className="px-5 py-2.5 rounded-full bg-muted/10 border border-border/40 text-xs font-semibold hover:bg-muted/20 active:scale-95 transition-all text-muted-foreground/80 hover:text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold font-space gradient-text">Ready to Start?</h1>
                <p className="text-muted-foreground mt-2">Here is a quick look at your profile.</p>
              </div>

              <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-muted/5 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_40px_rgba(var(--primary),0.15)] mb-6 bg-muted">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-14 w-14 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-3xl font-bold font-space">{name}</h2>
                  <div className="flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT_COLORS[accentIdx].hex, boxShadow: `0 0 10px ${ACCENT_COLORS[accentIdx].hex}` }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{ACCENT_COLORS[accentIdx].name} Theme</span>
                  </div>

                  <div className="mt-10 grid grid-cols-2 w-full gap-4">
                    <div className="bg-background/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 opacity-60">Day Ends At</p>
                      <p className="text-2xl font-bold font-space text-primary">{formatDisplayTime()}</p>
                    </div>
                    <div className="bg-background/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 opacity-60">Status</p>
                      <p className="text-2xl font-bold font-space">Ready 🚀</p>
                    </div>
                  </div>
                </div>
              </div>

              {Capacitor.getPlatform() === 'android' && !hasOverlayPermission && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-[24px] p-5 space-y-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-orange-400">
                    <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <X className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold">Permission Recommended</p>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    To show the habit check-in over your lock screen at your chosen day-end time, please enable "Display over other apps".
                  </p>
                  <Button onClick={requestPermission} variant="outline" className="w-full h-11 rounded-xl border-orange-500/30 text-orange-400 hover:bg-orange-500/10 active:scale-95 transition-all text-xs font-bold">
                    Enable in Settings
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="relative px-6 pb-12 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex gap-4 max-w-md mx-auto w-full">
          {step > 1 && (step < 3) && (
            <Button variant="ghost" className="h-14 w-20 rounded-[20px] border border-border/30 backdrop-blur-md" onClick={prevStep}>
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              disabled={step === 1 && !name.trim()}
              className="flex-1 h-14 rounded-[20px] text-base font-bold shadow-xl shadow-primary/20 gap-2 transition-all active:scale-[0.98]"
              onClick={nextStep}
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))` }}
            >
              Continue <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-full space-y-5">
              <Button 
                className="w-full h-16 rounded-[24px] text-base font-bold shadow-2xl shadow-primary/40 gap-2 transition-all active:scale-[0.98]"
                onClick={handleFinish}
                style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))` }}
              >
                Start Using Habitra
              </Button>
              <button onClick={prevStep} className="w-full text-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                I want to change something
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Infinite Wheel Sub-component
 */
function InfiniteWheel({ items, value, onChange, itemHeight }: { items: any[], value: any, onChange: (val: any) => void, itemHeight: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Multiply items to simulate infinite scrolling
  const repeatedItems = [...items, ...items, ...items, ...items, ...items];
  const offset = items.length * 2; // Start in the middle set of items

  // Initial scroll positioning
  useEffect(() => {
    if (scrollRef.current) {
      const selectedIdx = items.indexOf(value);
      scrollRef.current.scrollTop = (offset + selectedIdx) * itemHeight;
      setIsReady(true);
    }
  }, []);

  // Update scroll when value changes externally (presets)
  useEffect(() => {
    if (scrollRef.current && isReady) {
      const selectedIdx = items.indexOf(value);
      const currentIdx = Math.round(scrollRef.current.scrollTop / itemHeight) % items.length;
      if (currentIdx !== selectedIdx) {
        scrollRef.current.scrollTo({
          top: (offset + selectedIdx) * itemHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [value, isReady, items, itemHeight, offset]);

  const handleScroll = () => {
    if (!scrollRef.current || !isReady) return;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = items[index % items.length];
    
    if (newValue !== value) {
      onChange(newValue);
    }

    // Infinite loop reset logic
    const totalHeight = items.length * itemHeight;
    if (scrollTop < totalHeight) {
      scrollRef.current.scrollTop = scrollTop + totalHeight;
    } else if (scrollTop > totalHeight * 3) {
      scrollRef.current.scrollTop = scrollTop - totalHeight;
    }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
    >
      <div className="h-[70px] shrink-0" /> {/* Top padding for centering */}
      {repeatedItems.map((item, i) => (
        <div 
          key={i} 
          className={cn(
            "h-[60px] flex items-center justify-center snap-center transition-all duration-300",
            value === item && (i >= offset && i < offset + items.length)
              ? "text-3xl font-bold text-primary scale-110" 
              : "text-lg font-medium text-muted-foreground/30 scale-90 opacity-60"
          )}
        >
          {item}
        </div>
      ))}
      <div className="h-[70px] shrink-0" /> {/* Bottom padding for centering */}
    </div>
  );
}
