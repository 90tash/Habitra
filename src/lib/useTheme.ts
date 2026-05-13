import { useState, useEffect } from 'react';

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
  // In dark we use the dark variant
  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', color.dark);
    root.style.setProperty('--ring', color.dark);
  }
}

export function initializeTheme() {
  if (typeof window === 'undefined') return;
  const theme = localStorage.getItem('hp-theme') || 'dark';
  const accentIdx = Number(localStorage.getItem('hp-accent') || 0);
  applyTheme(theme);
  applyAccent(accentIdx);
}

export function useTheme() {
  const [theme, setThemeState] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('hp-theme') || 'dark') : 'dark'
  );
  const [accentIdx, setAccentIdxState] = useState<number>(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem('hp-accent') || 0) : 0
  );

  useEffect(() => {
    applyTheme(theme);
    applyAccent(accentIdx);
    localStorage.setItem('hp-theme', theme);
  }, [theme, accentIdx]);

  const setTheme = (t: string) => { setThemeState(t); };
  const toggleTheme = () => setThemeState(t => {
    const idx = THEMES.indexOf(t);
    return THEMES[(idx + 1) % THEMES.length];
  });
  const setAccent = (idx: number) => { setAccentIdxState(idx); localStorage.setItem('hp-accent', idx.toString()); };

  return { theme, setTheme, toggleTheme, accentIdx, setAccent, ACCENT_COLORS, THEMES };
}