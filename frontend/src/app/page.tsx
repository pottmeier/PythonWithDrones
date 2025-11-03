"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskCard } from "@/components/task-card";
import { TestCard } from "@/components/test-card";
import { CodeCard } from "@/components/code-card";
import { LevelProgress } from "@/components/level-progress";
import Scene from "@/components/scene";
import { Spinner } from "@/components/ui/spinner";
import { TILE_SIZE, TILE_MARGIN, GRID_SIZE } from "@/components/grid";

export default function Home() {
  const [code, setCode] = useState("");
  const [dark, setDark] = useState(true);
  const [levelCount, setLevelCount] = useState(11);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);

  const [moveQueue, setMoveQueue] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Darkmode
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // Pyodide laden
  useEffect(() => {
    async function initPython() {
      console.log("🔄 Lade Pyodide...");

      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });

      const response = await fetch("/game.py");
      const pythonCode = await response.text();
      await pyodide.runPythonAsync(pythonCode);

      window.runPython = (code: string) => pyodide.runPythonAsync(code);

      console.log("Python + Bibliothek geladen!");
      setPyodideLoaded(true);
    }

    initPython();
  }, []);

  useEffect(() => {
    async function initPython() { /* ... pyodide loading logic ... */ }
    initPython();
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center justify-between border-b">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          <main className="flex-1 p-4 flex flex-col gap-4">
            <div className="flex flex-1 gap-4">
              <TaskCard title="Aufgabe" />
              <div className="flex-[2] flex justify-center items-center p-4 bg-gray-100 dark:bg-gray-900">
                {/* --- THIS IS THE PERMANENT FIX --- */}
                <div className="w-full max-h-[600px] aspect-square relative">
                  {/* The Scene is now ALWAYS mounted. We just control its visibility. */}
                  <div
                    className={`transition-opacity duration-500 w-full h-full ${
                      pyodideLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Scene />
                  </div>

                  {/* The Spinner is rendered on top and fades out when loading is done. */}
                  {!pyodideLoaded && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center ...">
                      <Spinner className="mb-2" />
                      Lade Pyodide...
                    </div>
                  )}
                </div>
                {/* --- END OF FIX --- */}
              </div>
            </div>

            <div className="flex flex-1 gap-4">
              <TestCard title="Tests" />
              <CodeCard code={code} setCode={setCode} />
            </div>
          </main>

          <LevelProgress
            currentLevel={currentLevel}
            setCurrentLevel={setCurrentLevel}
            levelCount={levelCount}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
