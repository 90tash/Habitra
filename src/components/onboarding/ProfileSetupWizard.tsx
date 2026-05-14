import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Camera, Clock, User, Tag, FileText, Plus, X, Image as ImageIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTheme, ACCENT_COLORS } from '@/lib/useTheme';
import { appStore, useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import type { LocalUser, UserPreferences } from '@/lib/types';
import ReminderPermissionsPanel from './ReminderPermissionsPanel';
import { AnalogTimePicker } from '@/components/ui/AnalogTimePicker';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

export default function ProfileSetupWizard({ onComplete }: ProfileSetupWizardProps) {
  const [step, setStep] = useState(1);
  const { setAccent, accentIdx } = useTheme();
  
  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dailyReviewTime, setDailyReviewTime] = useState('22:00');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const updateIdentity = useAppStore((state) => state.updateIdentity);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  const handleFinish = () => {
    const identity: LocalUser = {
      id: 'local-user',
      full_name: name || 'User',
      email: 'local@habitra.app',
      bio,
      tags,
      avatarUri: avatar,
      accentColor: ACCENT_COLORS[accentIdx]?.hex || '#4F46E5',
      created_at: new Date().toISOString(),
    };
    
    updateIdentity(identity);
    updatePreferences({
      dailyReviewTime,
      onboardingCompleted: true,
      remindersEnabled: true,
      reminderMethod: 'nag',
      theme: 'dark',
      accentColorIndex: accentIdx,
    });
    onComplete();
  };

  const nextStep = () => {
    if (step === 1 && !name.trim()) return;
    setStep(2);
  };

  const prevStep = () => setStep(1);

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return '10:00 PM';
    const [h, m] = timeStr.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${p}`;
  };

  const accentColor = ACCENT_COLORS[accentIdx]?.hex || '#4F46E5';

  return (
    <div className="fixed inset-0 z-[500] bg-background flex flex-col overflow-hidden text-foreground">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-10"
          style={{ background: `radial-gradient(circle, #4F46E5, transparent 70%)` }} />
      </div>

      <div className="relative flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8 overflow-y-auto no-scrollbar">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold font-space gradient-text">Ultimate Profile</h1>
              <p className="text-muted-foreground mt-2">Everything you need, all in one place.</p>
            </div>

            {/* Avatar Section Unified with Settings Style */}
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="h-32 w-32 rounded-full border-2 border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden shadow-2xl">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-muted-foreground/40" />
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl h-9 gap-2 border-border/40 bg-muted/20 text-foreground"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Gallery
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAvatar(null)}
                  className="rounded-xl h-9 gap-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
            </div>

            <div className="space-y-8">
              {/* Name */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60 flex items-center gap-2">
                  <User className="h-3 w-3" /> Full Name
                </Label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Ashish Patra"
                  className="h-14 rounded-2xl bg-muted/10 border-border/40 px-5 focus:ring-primary/20 text-lg transition-all focus:bg-muted/20"
                />
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60 flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Bio
                </Label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about your goals..."
                  className="min-h-[100px] rounded-2xl bg-muted/10 border-border/40 px-5 py-4 focus:ring-primary/20 transition-all focus:bg-muted/20 resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60 flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Focus Tags
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag (e.g. Fitness)"
                    className="h-12 rounded-xl bg-muted/10 border-border/40 px-4 focus:ring-primary/20 transition-all"
                  />
                  <Button onClick={addTag} className="h-12 w-12 rounded-xl p-0 shrink-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[32px]">
                  {tags.map(tag => (
                    <motion.span 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={tag} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Theme Color - Synced with Settings Animation */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60">Choose Your Style</Label>
                <div className="flex gap-2.5 flex-wrap px-1">
                  {ACCENT_COLORS.map((color, i) => (
                    <button
                      key={color.name}
                      onClick={() => setAccent(i)}
                      className="relative h-9 w-9 rounded-full transition-all active:scale-90"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {accentIdx === i && (
                        <div 
                          className="absolute inset-0 rounded-full border-2 scale-125 transition-all" 
                          style={{ 
                            borderColor: color.hex,
                            boxShadow: `0 0 15px ${color.hex}88`,
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Time */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] ml-1 text-muted-foreground/60 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Reminder Time
                </Label>
                <button 
                  onClick={() => setIsTimePickerOpen(true)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Daily Review</p>
                      <p className="text-xs text-muted-foreground">Notification time</p>
                    </div>
                  </div>
                  <div className="bg-background px-4 py-2 rounded-xl border border-border/40 font-space font-bold text-primary text-sm group-hover:scale-105 transition-transform">
                    {formatDisplayTime(dailyReviewTime)}
                  </div>
                </button>
              </div>
            </div>

            <AnalogTimePicker 
              isOpen={isTimePickerOpen}
              onClose={() => setIsTimePickerOpen(false)}
              initialTime={dailyReviewTime}
              onSave={setDailyReviewTime}
              accentColor={accentColor}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold font-space gradient-text">Ready to Start?</h1>
              <p className="text-muted-foreground mt-2">Your profile looks incredible.</p>
            </div>

            {/* Summary Card with Fixed Rendering */}
            <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-muted/5 p-8 text-center shadow-2xl backdrop-blur-xl">
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-primary/40 mb-6 bg-muted shadow-[0_0_40px_rgba(0,0,0,0.2)]">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-3xl font-bold font-space">{name || 'User'}</h2>
                <p className="text-sm text-muted-foreground mt-2 px-6 line-clamp-2 italic">"{bio || 'Embarking on a new journey...'}"</p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-muted/30 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="px-3 py-1 rounded-full bg-muted/30 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Habitraker
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{(ACCENT_COLORS[accentIdx]?.name || 'Theme')} Style</span>
                </div>

                <div className="mt-8 grid grid-cols-2 w-full gap-4">
                  <div className="bg-background/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 opacity-60">Review</p>
                    <p className="text-xl font-bold font-space text-primary">{formatDisplayTime(dailyReviewTime)}</p>
                  </div>
                  <div className="bg-background/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 opacity-60">Status</p>
                    <p className="text-xl font-bold font-space">Ready 🚀</p>
                  </div>
                </div>
              </div>
            </div>

            {Capacitor.getPlatform() === 'android' && <ReminderPermissionsPanel />}
          </motion.div>
        )}
      </div>

      {/* Bottom Actions - Streamlined */}
      <div className="relative px-6 pb-12 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex gap-4 max-w-md mx-auto w-full">
          {step > 1 && (
            <Button variant="ghost" className="h-14 w-20 rounded-[20px] border border-border/30 backdrop-blur-md" onClick={prevStep}>
              Back
            </Button>
          )}
          
          {step < 2 ? (
            <Button 
              disabled={!name.trim()}
              className="flex-1 h-14 rounded-[20px] text-base font-bold shadow-xl shadow-primary/20 gap-2 transition-all active:scale-[0.98]"
              onClick={nextStep}
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))` }}
            >
              Final Preview <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              className="flex-1 h-16 rounded-[24px] text-base font-bold shadow-2xl shadow-primary/40 gap-2 transition-all active:scale-[0.98]"
              onClick={handleFinish}
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))` }}
            >
              Start Using Habitra
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
