import React, { createContext, useContext, useMemo } from 'react';
import type { LocalUser } from './types';

type AuthContextValue = {
  user: LocalUser;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: null;
  appPublicSettings: null;
  authChecked: boolean;
  logout: () => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<LocalUser>;
  checkAppState: () => Promise<{ user: LocalUser }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_USER: LocalUser = {
  id: 'local-user',
  full_name: 'Local User',
  email: 'local@habitra.app',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo<AuthContextValue>(() => ({
    user: LOCAL_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    logout: () => {},
    navigateToLogin: () => {},
    checkUserAuth: async () => LOCAL_USER,
    checkAppState: async () => ({ user: LOCAL_USER }),
  }), []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
