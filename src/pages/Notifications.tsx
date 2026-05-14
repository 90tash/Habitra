import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Clock, RefreshCcw, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme, ACCENT_COLORS } from '@/lib/useTheme';
import { appStore, useAppStore } from '@/store/appStore';
import { useQueryClient } from '@tanstack/react-query';

import { AnalogTimePicker } from '@/components/ui/AnalogTimePicker';

import Midnight, { isMidnightPluginAvailable } from '@/lib/midnightPlugin';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accentIdx } = useTheme();
  
  const prefs = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
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
    updatePreferences(patch);
    queryClient.invalidateQueries();
    syncNative({ ...prefs, ...patch });
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
