import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Statistics from '@/pages/Statistics';
import Focus from '@/pages/Focus';
import Settings from '@/pages/Settings';
import Notifications from '@/pages/Notifications';
import EditProfile from '@/pages/EditProfile';
import HabitDetails from '@/pages/HabitDetails';
import SplashScreen from '@/pages/SplashScreen';
import Onboarding from '@/pages/Onboarding';
import FirstLaunchPermissions from '@/components/onboarding/FirstLaunchPermissions';
import ProfileSetupWizard from '@/components/onboarding/ProfileSetupWizard';
import { hasSeenFirstLaunchPermissions, isOnboardingComplete, markFirstLaunchPermissionsSeen } from '@/lib/onboarding';
import { appStore } from '@/store/appStore';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Midnight from '@/lib/midnightPlugin';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const navigate = useNavigate();
  const shouldShowFirstLaunchPermissions = Capacitor.getPlatform() === 'android' && !hasSeenFirstLaunchPermissions();
  const [currentStep, setCurrentStep] = useState<'splash' | 'permissions' | 'onboarding' | 'profile' | 'ready'>('splash');

  useEffect(() => {
    if (currentStep !== 'ready') return;

    const checkNativeTrigger = () => {
      if (Capacitor.getPlatform() === 'android') {
        Midnight.checkTrigger().then(res => {
          if (res.isMidnightAlarm) {
            navigate('/');
          }
        });
      }
    };

    // Initial check
    checkNativeTrigger();

    // Foreground check
    const setupListener = async () => {
      const listener = await CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          setTimeout(checkNativeTrigger, 500);
        }
      });
      return listener;
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, [currentStep, navigate]);

  const checkNextStep = (completedStep: 'splash' | 'onboarding' | 'profile') => {
    const identity = appStore.getIdentity();
    const hasProfile = !!identity.full_name;
    const tourDone = isOnboardingComplete();

    if (completedStep === 'splash') {
      if (!tourDone) return 'onboarding';
      if (!hasProfile) return 'profile';
      return 'ready';
    }

    if (completedStep === 'onboarding') {
      if (!hasProfile) return 'profile';
      return 'ready';
    }

    return 'ready';
  };

  const handleSplashDone = () => {
    if (shouldShowFirstLaunchPermissions) {
      setCurrentStep('permissions');
      return;
    }
    setCurrentStep(checkNextStep('splash'));
  };
  const handleOnboardingComplete = () => setCurrentStep(checkNextStep('onboarding'));
  const handleProfileSetupComplete = () => setCurrentStep('ready');
  const handlePermissionsContinue = () => {
    markFirstLaunchPermissionsSeen();
    setCurrentStep(checkNextStep('splash'));
  };

  if (currentStep === 'permissions') {
    return <FirstLaunchPermissions onContinue={handlePermissionsContinue} />;
  }

  if (currentStep === 'splash') {
    return (
      <AnimatePresence>
        <SplashScreen onDone={handleSplashDone} />
      </AnimatePresence>
    );
  }

  if (currentStep === 'onboarding') {
    return (
      <AnimatePresence>
        <Onboarding onComplete={handleOnboardingComplete} />
      </AnimatePresence>
    );
  }

  if (currentStep === 'profile') {
    return (
      <AnimatePresence>
        <ProfileSetupWizard onComplete={handleProfileSetupComplete} />
      </AnimatePresence>
    );
  }

  if (currentStep !== 'ready') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3 font-space">Habitra</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/habit/:id" element={<HabitDetails />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route path="/settings/profile" element={<EditProfile />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
