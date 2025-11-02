'use client';

import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from 'lucide-react';
interface ThemeSwitchProps {
  className?: string;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export default function ThemeSwitch({
  className,
  theme,
  setTheme
}: ThemeSwitchProps) {
  return (
    <button
      onClick={() => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      }}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center text-gray-900 dark:text-gray-100',
        className
      )}
      aria-label='Toggle theme'
      type='button'
    >
      {theme === 'light' ? (
        <SunIcon className='h-4 w-4' />
      ) : (
        <MoonIcon className='h-4 w-4' />
      )}
      <span className='sr-only'>Toggle theme</span>
    </button>
  );
}
