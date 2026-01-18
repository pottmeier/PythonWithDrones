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
      <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center justify-between border-b shrink-0 bg-white dark:bg-gray-900 z-10 sticky top-0">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 items-start h-[calc(100vh-5rem)]">
            
            {/* LEFT COLUMN: Code Editor */}
            <div className="w-full lg:w-1/3 min-w-[350px] shrink-0 h-full flex flex-col">
              <div className="h-full flex flex-col">
                 <CodeCard code={code} setCode={setCode} />
              </div>
            </div>

            {/* RIGHT COLUMN: Scene Only */}
            <div className="flex-1 h-full min-w-0">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                <div className="w-full h-full relative">
                  <div
                    className={`transition-opacity duration-500 w-full h-full ${
                      pyodideLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {/* Pass Level ID so Scene can display it in the info card */}
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