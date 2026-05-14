import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export const THEMES = ['light', 'dark', 'amoled'];
export const ACCENT_COLORS = [
  { name: 'Cyan',    primary: '188 90% 40%', dark: '188 90% 48%', hex: '#00E5FF' },
  { name: 'Emerald', primary: '155 75% 40%', dark: '155 75% 46%', hex: '#10B981' },
  { name: 'Purple',  primary: '262 83% 58%', dark: '262 83% 64%', hex: '#7C3AED' },
  { name: 'Pink',    primary: '322 81% 55%', dark: '322 81% 61%', hex: '#EC4899' },
  { name: 'Blue',    primary: '213 90% 54%', dark: '213 90% 60%', hex: '#3B82F6' },
  { name: 'Orange',  primary: '24 90% 50%',  dark: '24 90% 56%',  hex: '#F59E0B' },
  { name: 'Red',     primary: '0 84% 60%',   dark: '0 84% 66%',   hex: '#EF4444' },
  { name: 'Yellow',  primary: '45 93% 47%',  dark: '45 93% 53%',  hex: '#EAB308' },
];

export function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove('dark', 'amoled');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'amoled') root.classList.add('dark', 'amoled');
}

export function applyAccent(colorIdx: number) {
  const color = ACCENT_COLORS[colorIdx] || ACCENT_COLORS[0];
  const root = document.documentElement;
  root.style.setProperty('--primary', color.primary);
  root.style.setProperty('--ring', color.primary);
  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', color.dark);
    root.style.setProperty('--ring', color.dark);
  }
}

export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  let theme = 'dark';
  let accentIdx = 0;

  try {
    const storage = localStorage.getItem('habitra-storage');
    if (storage) {
      const parsed = JSON.parse(storage);
      if (parsed.state?.preferences) {
        theme = parsed.state.preferences.theme || 'dark';
        accentIdx = Number(parsed.state.preferences.accentColorIndex || 0);
      }
    } else {
      // Fallback to legacy keys
      const legacyTheme = localStorage.getItem('hp-theme');
      const legacyAccent = localStorage.getItem('hp-accent');
      if (legacyTheme) theme = legacyTheme;
      if (legacyAccent) accentIdx = Number(legacyAccent);
    }
  } catch (e) {
    console.error('Failed to initialize theme', e);
  }
  
  applyTheme(theme);
  applyAccent(accentIdx);
}

export function useTheme() {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  const { theme, accentColorIndex: accentIdx } = preferences;

  useEffect(() => {
    applyTheme(theme);
    applyAccent(accentIdx);
  }, [theme, accentIdx]);

  const setTheme = (t: string) => updatePreferences({ theme: t as any });
  const toggleTheme = () => {
    const idx = THEMES.indexOf(theme);
    const nextTheme = THEMES[(idx + 1) % THEMES.length];
    setTheme(nextTheme);
  };
  const setAccent = (idx: number) => updatePreferences({ accentColorIndex: idx });

  return { theme, setTheme, toggleTheme, accentIdx, setAccent, ACCENT_COLORS, THEMES };
}
