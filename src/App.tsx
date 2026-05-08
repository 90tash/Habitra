import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Statistics from '@/pages/Statistics';
import Calendar from '@/pages/Calendar';
import Focus from '@/pages/Focus';
import Settings from '@/pages/Settings';
import HabitDetails from '@/pages/HabitDetails';
import SplashScreen from '@/pages/SplashScreen';
import Onboarding from '@/pages/Onboarding';
import { isOnboardingComplete } from '@/lib/onboarding';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const handleSplashDone = () => {
    setShowSplash(false);
    if (!isOnboardingComplete()) {
      setShowOnboarding(true);
    } else {
      setAppReady(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setAppReady(true);
  };

  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onDone={handleSplashDone} />
      </AnimatePresence>
    );
  }

  if (showOnboarding) {
    return (
      <AnimatePresence>
        <Onboarding onComplete={handleOnboardingComplete} />
      </AnimatePresence>
    );
  }

  if (!appReady || isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3 font-space">Habitra</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/habit/:id" element={<HabitDetails />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
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
