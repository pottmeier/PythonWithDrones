"use client";
import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
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
