import React, { createContext, useContext, useMemo } from 'react';
import type { LocalUser, AuthError } from './types';
import { appStore } from '@/store/appStore';

type AuthContextValue = {
  user: LocalUser;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError;
  appPublicSettings: any;
  authChecked: boolean;
  logout: () => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<LocalUser>;
  checkAppState: () => Promise<{ user: LocalUser }>;
};


const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const localUser = appStore.getIdentity();
  const value = useMemo<AuthContextValue>(() => ({
    user: localUser,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    logout: () => {},
    navigateToLogin: () => {},
    checkUserAuth: async () => localUser,
    checkAppState: async () => ({ user: localUser }),
  }), [localUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
