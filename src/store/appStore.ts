import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LocalUser, UserPreferences } from '@/lib/types';

export type AppSettings = {
  remindersEnabled: boolean;
  focusSoundsEnabled: boolean;
  analyticsEnabled: boolean;
};

interface AppState {
  settings: AppSettings;
  identity: LocalUser;
  preferences: UserPreferences;
  
  // Actions
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateIdentity: (patch: Partial<LocalUser>) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  
  // Helper for direct checks (legacy/non-reactive use cases)
  getState: () => { settings: AppSettings; identity: LocalUser; preferences: UserPreferences };
}

const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: true,
  focusSoundsEnabled: true,
  analyticsEnabled: true,
};

const DEFAULT_IDENTITY: LocalUser = {
  id: 'local-user',
  full_name: '',
  email: 'local@habitra.app',
  bio: '',
  tags: [],
  accentColor: '#7C5CFC',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  dailyReviewTime: '22:00',
  onboardingCompleted: false,
  remindersEnabled: true,
  reminderMethod: 'nag',
  theme: 'dark',
  accentColorIndex: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      identity: DEFAULT_IDENTITY,
      preferences: DEFAULT_PREFERENCES,

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
      
      updateIdentity: (patch) =>
        set((state) => ({ identity: { ...state.identity, ...patch } })),
      
      updatePreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),

      getState: () => ({
        settings: get().settings,
        identity: get().identity,
        preferences: get().preferences,
      }),
    }),
    {
      name: 'habitra-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Backward compatibility wrapper for non-hook usage
export const appStore = {
  getSettings: () => useAppStore.getState().settings,
  updateSettings: (patch: Partial<AppSettings>) => useAppStore.getState().updateSettings(patch),
  getIdentity: () => useAppStore.getState().identity,
  updateIdentity: (patch: Partial<LocalUser>) => useAppStore.getState().updateIdentity(patch),
  getPreferences: () => useAppStore.getState().preferences,
  updatePreferences: (patch: Partial<UserPreferences>) => useAppStore.getState().updatePreferences(patch),
};
