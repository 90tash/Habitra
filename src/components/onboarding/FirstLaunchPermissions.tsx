import React, { useEffect, useState } from 'react';
import { BellRing, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import Midnight, { isMidnightPluginAvailable } from '@/lib/midnightPlugin';
import ReminderPermissionsPanel from './ReminderPermissionsPanel';

type FirstLaunchPermissionsProps = {
  onContinue: () => void;
};

export default function FirstLaunchPermissions({ onContinue }: FirstLaunchPermissionsProps) {
  const [requestingNotification, setRequestingNotification] = useState(false);

  const requestNativeNotificationPermission = async () => {
    if (Capacitor.getPlatform() !== 'android' || !isMidnightPluginAvailable()) return;

    setRequestingNotification(true);
    try {
      await Midnight.requestNotificationPermission();
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setTimeout(() => setRequestingNotification(false), 800);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      requestNativeNotificationPermission();
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[600] bg-background text-foreground overflow-y-auto">
      <div className="min-h-full max-w-md mx-auto px-6 py-10 flex flex-col justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <BellRing className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-space gradient-text">Enable Reminders</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Habitra uses Android permissions to show your day-end check-in at the right time. The notification popup appears here; Android opens settings for special reminder access.
            </p>
          </div>
        </motion.div>

        <ReminderPermissionsPanel
          hideWhenComplete={false}
          intro="Android will ask for notification access now. Exact alarms, lock-screen check-in, and display-over-apps are special Android settings you can enable below."
        />

        <Button
          type="button"
          variant="outline"
          disabled={requestingNotification}
          onClick={requestNativeNotificationPermission}
          className="h-12 rounded-[18px] border-primary/30 text-primary font-bold"
        >
          {requestingNotification ? 'Opening notification prompt...' : 'Show notification permission popup'}
        </Button>

        <Button
          type="button"
          onClick={onContinue}
          className="h-14 rounded-[20px] text-base font-bold shadow-xl shadow-primary/20 gap-2"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }}
        >
          Continue <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
