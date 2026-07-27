export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'exam-prep-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
  }
  window.localStorage.setItem(STORAGE_KEY, theme);
}
