import { useState } from 'react';

const DARK_MODE_KEY = 'grocery-dark-mode';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      const isDark = stored === 'true';
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
      return isDark;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(DARK_MODE_KEY, String(newValue));
      } catch (error) {
        console.error('Failed to save dark mode preference:', error);
      }
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  return { darkMode, toggleDarkMode };
};
