import type { LocalUser } from '@/lib/types';

const SETTINGS_KEY = 'habitra:settings';
const IDENTITY_KEY = 'habitra:identity';

export type AppSettings = {
  remindersEnabled: boolean;
  focusSoundsEnabled: boolean;
  analyticsEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: true,
  focusSoundsEnabled: true,
  analyticsEnabled: true,
};

const DEFAULT_IDENTITY: LocalUser = {
  id: 'local-user',
  full_name: 'Local User',
  email: 'local@habitra.app',
};

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const appStore = {
  getSettings: () => readJson(SETTINGS_KEY, DEFAULT_SETTINGS),
  updateSettings: (patch: Partial<AppSettings>) => {
    const next = { ...appStore.getSettings(), ...patch };
    writeJson(SETTINGS_KEY, next);
    return next;
  },
  getIdentity: () => readJson(IDENTITY_KEY, DEFAULT_IDENTITY),
  updateIdentity: (patch: Partial<LocalUser>) => {
    const next = { ...appStore.getIdentity(), ...patch };
    writeJson(IDENTITY_KEY, next);
    return next;
  },
};
