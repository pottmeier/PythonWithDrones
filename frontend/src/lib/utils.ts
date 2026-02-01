import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BTN_BASE = "cursor-pointer rounded-md flex items-center justify-center transition-all focus:outline-none z-30";
export const BTN_DARK = "h-8 w-8 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700";
export const BTN_PRIMARY = "bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 px-3 h-8";

export const SPEED_CONTAINER = "flex bg-white/90 dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden h-8";
export const SPEED_BTN_BASE = "px-2 text-[10px] font-bold transition-colors border-r last:border-r-0 border-gray-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30";
export const SPEED_BTN_ACTIVE = "bg-blue-600 text-white hover:bg-blue-600";
export const SPEED_BTN_INACTIVE = "text-gray-600 dark:text-gray-400";