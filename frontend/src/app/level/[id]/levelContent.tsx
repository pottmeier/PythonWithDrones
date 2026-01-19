//LevelContent.tsx
"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
// import { TaskCard } from "@/components/task-card";
// import { TestCard } from "@/components/test-card";
import { CodeCard } from "@/components/code-card";
import { LevelProgress } from "@/components/level-progress";
import Scene from "@/components/scene";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "sonner";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

type Level = { id: string };

interface LevelContentProps {
  level: Level;
}

export default function LevelContent({ level }: LevelContentProps) {
  const levelId = level.id;
  const [code, setCode] = useState("");
  const [dark, setDark] = useState(true);
  const [levelCount, setLevelCount] = useState(11);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);

  // Darkmode
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // Pyodide laden
  useEffect(() => {
    async function initPython() {
      console.log("🔄 Lade Pyodide...");

      // Pyodide vom CDN laden
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });

      // Python-Game aus public laden
      const response = await fetch(`${basePath}/python/game.py`);
      const pythonCode = await response.text();

      await pyodide.runPythonAsync(pythonCode);

      // Funktion global verfügbar machen
      window.runPython = (code: string) => pyodide.runPythonAsync(code);

      setPyodideLoaded(true);
    }

    initPython();
  }, []);

  return (
    <SidebarProvider>
      {/* 
         1. RESPONSIVE CONTAINER 
         - Mobile: min-h-screen (Scrollable)
         - Desktop (lg): h-screen + overflow-hidden (Locked App-like view)
      */}
      <div className="flex min-h-screen lg:h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 lg:overflow-hidden transition-colors duration-300">
        <AppSidebar />

        {/* Flex column wrapper */}
        <div className="flex flex-1 flex-col h-full lg:overflow-hidden">
          
          {/* Header */}
          <header className="p-4 flex items-center justify-between border-b shrink-0 bg-white dark:bg-gray-900 z-10 sticky top-0 lg:static">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          {/* 
             MAIN CONTENT LAYOUT
             - Mobile: flex-col-reverse (Puts Scene on Top, Code on Bottom)
             - Desktop: lg:flex-row (Puts Code on Left, Scene on Right)
             - Desktop: lg:h-full (Fills vertical space)
          */}
          <main className="flex-1 flex flex-col-reverse lg:flex-row p-4 gap-4 lg:h-full lg:overflow-hidden">
            
            {/* 
               CODE EDITOR COLUMN 
               - Mobile: w-full, h-[500px] (Fixed height to allow scrolling inside editor)
               - Desktop: w-1/3, h-full (Fills left side)
            */}
            <div className="w-full lg:w-1/3 lg:min-w-[350px] shrink-0 h-[500px] lg:h-full flex flex-col">
              <div className="h-full flex flex-col">
                 <CodeCard code={code} setCode={setCode} />
              </div>
            </div>

            {/* 
               SCENE COLUMN
               - Mobile: w-full, h-[400px] (Fixed height for game view)
               - Desktop: flex-1, h-full (Fills remaining space)
            */}
            <div className="w-full lg:flex-1 h-[400px] lg:h-full min-w-0">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden shadow-sm">
                <div className="w-full h-full relative">
                  <div
                    className={`transition-opacity duration-500 w-full h-full ${
                      pyodideLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Scene levelId={levelId} />
                  </div>
                  {!pyodideLoaded && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                      <Spinner className="mb-2" />
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
      <Toaster position="top-left" richColors closeButton />
    </SidebarProvider>
  );
}