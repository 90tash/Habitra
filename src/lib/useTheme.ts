import { useState, useEffect } from 'react';

export const THEMES = ['light', 'dark', 'amoled'];
export const ACCENT_COLORS = [
  { name: 'Violet',  primary: '252 87% 62%', dark: '252 87% 67%' },
  { name: 'Indigo',  primary: '239 84% 58%', dark: '239 84% 64%' },
  { name: 'Blue',    primary: '213 90% 54%', dark: '213 90% 60%' },
  { name: 'Cyan',    primary: '188 90% 40%', dark: '188 90% 48%' },
  { name: 'Emerald', primary: '155 75% 40%', dark: '155 75% 46%' },
  { name: 'Rose',    primary: '346 84% 56%', dark: '346 84% 62%' },
  { name: 'Orange',  primary: '24 90% 50%',  dark: '24 90% 56%' },
];

function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove('dark', 'amoled');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'amoled') root.classList.add('dark', 'amoled');
}

function applyAccent(colorIdx: number) {
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