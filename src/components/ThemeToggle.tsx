import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to daylight mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to daylight mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      data-theme-toggle="track"
      style={{
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: isDark ? '#3f3f46' : '#d4d4d8',
      }}
      className={`theme-toggle relative inline-flex items-center justify-between rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer select-none shrink-0 ${
        isDark
          ? 'shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] hover:border-zinc-500'
          : 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] hover:border-zinc-400'
      } ${
        isSmall
          ? 'w-[50px] h-[26px] p-[2px]'
          : 'w-[56px] h-[28px] p-[2px]'
      } ${className}`}
    >
      {/* Track Left Slot: Sun icon (revealed when Dark Mode is active and knob is on the right) */}
      <div
        className={`flex items-center justify-center pointer-events-none ${
          isSmall ? 'w-5 h-5' : 'w-6 h-6'
        }`}
      >
        <Sun
          className={`${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } transition-opacity duration-200 ${
            isDark ? 'opacity-90' : 'opacity-0'
          }`}
          style={{ color: '#a1a1aa' }}
          strokeWidth={2.2}
        />
      </div>

      {/* Track Right Slot: Moon icon (revealed when Light Mode is active and knob is on the left) */}
      <div
        className={`flex items-center justify-center pointer-events-none ${
          isSmall ? 'w-5 h-5' : 'w-6 h-6'
        }`}
      >
        <Moon
          className={`${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } transition-opacity duration-200 ${
            !isDark ? 'opacity-90' : 'opacity-0'
          }`}
          style={{ color: '#9ca3af' }}
          strokeWidth={2.2}
        />
      </div>

      {/* Sliding Knob */}
      <span
        data-theme-toggle="knob"
        style={{
          backgroundColor: isDark ? '#ffffff' : '#18181b',
          color: isDark ? '#18181b' : '#ffffff',
          boxShadow: isDark
            ? '0 2px 5px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.25)'
            : '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)',
        }}
        className={`theme-toggle absolute rounded-full flex items-center justify-center transition-all duration-300 ease-in-out pointer-events-none ${
          isSmall
            ? 'top-[2px] left-[2px] w-5 h-5'
            : 'top-[2px] left-[2px] w-6 h-6'
        } ${
          isDark
            ? `${isSmall ? 'translate-x-[24px]' : 'translate-x-[28px]'}`
            : 'translate-x-0'
        }`}
      >
        {/* Sun inside Knob (visible in Light Mode) */}
        <Sun
          className={`absolute ${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{ color: '#ffffff' }}
          strokeWidth={2.2}
        />

        {/* Moon inside Knob (visible in Dark Mode) */}
        <Moon
          className={`absolute ${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          style={{ color: '#18181b' }}
          strokeWidth={2.2}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
