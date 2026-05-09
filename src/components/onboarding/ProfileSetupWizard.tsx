import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Camera, X, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCENT_COLORS, useTheme } from '@/lib/useTheme';
import { appStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type { LocalUser, UserPreferences } from '@/lib/types';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

export default function ProfileSetupWizard({ onComplete }: ProfileSetupWizardProps) {
  const [step, setStep] = useState(1);
  const { setAccent, accentIdx } = useTheme();
  
  // Form State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dayEndTime, setDayEndTime] = useState('00:00');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
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

  return (
    <div className="fixed inset-0 z-[500] bg-background flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${ACCENT_COLORS[accentIdx].hex}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-10"
          style={{ background: `radial-gradient(circle, #4F46E5, transparent 70%)` }} />
      </div>

      <div className="relative flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold font-space gradient-text">Create Your Profile</h1>
                <p className="text-muted-foreground mt-2">Personalize Habitra to match your style.</p>
              </div>

              {/* Banner & Avatar */}
              <div className="relative pt-4">
                <div className="h-32 w-full rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{ 
                    backgroundImage: `radial-gradient(circle at 20% 30%, ${ACCENT_COLORS[accentIdx].hex}44 0%, transparent 50%), radial-gradient(circle at 80% 70%, #4F46E544 0%, transparent 50%)` 
                  }} />
                </div>
                <div className="absolute left-1/2 -bottom-10 -translate-x-1/2">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-10 space-y-6">
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 border-border/50 bg-muted/20" onClick={() => fileInputRef.current?.click()}>
                    Gallery
                  </Button>
                  {avatar && (
                    <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 text-destructive" onClick={() => setAvatar(null)}>
                      Clear
                    </Button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />

                <div className="space-y-2">
                  <Label htmlFor="name-input" className="text-xs font-semibold uppercase tracking-wider ml-1 text-muted-foreground">Name</Label>
                  <Input 
                    id="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12 rounded-2xl bg-muted/20 border-border/50 px-4 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider ml-1 text-muted-foreground">Choose Your Theme Color</Label>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {ACCENT_COLORS.map((color, i) => (
                      <button
                        key={color.name}
                        onClick={() => setAccent(i)}
                        className={cn(
                          "relative shrink-0 h-10 w-10 rounded-full transition-all",
                          accentIdx === i ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color.hex, boxShadow: accentIdx === i ? `0 0 20px ${color.hex}66` : 'none' }}
                      >
                        {accentIdx === i && <Check className="h-5 w-5 text-white absolute inset-0 m-auto" />}
                      </button>
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

              <div className="bg-muted/20 rounded-[32px] p-6 border border-border/50 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Custom Day Cycle</p>
                    <p className="text-xs text-muted-foreground">This defines when your habits reset and streaks are updated.</p>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-center">
                  <input 
                    type="time" 
                    value={dayEndTime}
                    onChange={(e) => setDayEndTime(e.target.value)}
                    className="text-5xl font-bold font-space bg-transparent border-none focus:outline-none text-primary selection:bg-primary/20"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Tap to change time</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/10 p-4 rounded-2xl">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>Unfinished habits will count as missed after this time.</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/10 p-4 rounded-2xl">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>Your midnight summary and reset popups will appear at this time.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold font-space gradient-text">Ready to Start?</h1>
                <p className="text-muted-foreground mt-2">Here is a quick look at your profile.</p>
              </div>

              <div className="relative rounded-[40px] overflow-hidden border border-border/50 bg-muted/10 p-8 text-center shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-28 w-24 rounded-[32px] overflow-hidden border-2 border-primary/50 shadow-2xl mb-4 bg-muted">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl">👤</div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold font-space">{name}</h2>
                  <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT_COLORS[accentIdx].hex }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{ACCENT_COLORS[accentIdx].name} Theme</span>
                  </div>

                  <div className="mt-8 grid grid-cols-2 w-full gap-4">
                    <div className="bg-background/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Day Ends At</p>
                      <p className="text-xl font-bold font-space">{dayEndTime}</p>
                    </div>
                    <div className="bg-background/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                      <p className="text-xl font-bold font-space">Ready 🚀</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="relative px-6 pb-12 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-4 max-w-md mx-auto w-full">
          {step > 1 && (step < 3) && (
            <Button variant="ghost" className="h-14 w-20 rounded-2xl border border-border/50" onClick={prevStep}>
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              disabled={step === 1 && !name.trim()}
              className="flex-1 h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 gap-2"
              onClick={nextStep}
            >
              Continue <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <Button 
                className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/30 gap-2"
                onClick={handleFinish}
              >
                Start Using Habitra
              </Button>
              <button onClick={prevStep} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                I want to change something
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
