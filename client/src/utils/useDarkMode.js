import { useState, useEffect } from 'react';

// Persists and applies a light/dark theme by toggling `data-theme` on the
// document root and storing the preference in localStorage.
const useDarkMode = () => {
  const stored = localStorage.getItem('theme');
  const [dark, setDark] = useState(stored === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
};

export default useDarkMode;