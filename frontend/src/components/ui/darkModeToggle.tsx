"use client";
import { useTheme } from "@/contexts/ThemeContext";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1 cursor-pointer transition-colors"
    >
      <span className="absolute left-1 text-yellow-400 text-lg">🌞</span>
      <span className="absolute right-1 text-blue-500 text-lg">🌙</span>
      <span
        className={`absolute w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform ${
          isDarkMode ? "translate-x-8" : "translate-x-0"
        }`}
      ></span>
    </button>
  );
}
