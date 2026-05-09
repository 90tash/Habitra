import React, { createContext, useContext, useMemo } from 'react';
import type { LocalUser } from './types';
import { appStore } from '@/store/appStore';

type AuthContextValue = {
  user: LocalUser;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const localUser = appStore.getIdentity();
  
  const value = useMemo<AuthContextValue>(() => ({
    user: localUser,
    isAuthenticated: true,
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
