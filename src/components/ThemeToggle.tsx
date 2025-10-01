'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Toggle } from './ui/Toggle';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-11 h-6 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <Toggle
      checked={theme === 'dark'}
      onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      checkedIcon={<Moon className="w-full h-full" />}
      uncheckedIcon={<Sun className="w-full h-full" />}
      ariaLabel="Toggle theme"
      size="md"
    />
  );
}