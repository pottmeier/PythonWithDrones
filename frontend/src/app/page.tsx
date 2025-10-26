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

export default function Home() {
  const [code, setCode] = useState("");
  const [dark, setDark] = useState(true);
  const [levelCount, setLevelCount] = useState(11);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    async function initPython() {
      console.log("🔄 Lade Pyodide...");

      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });

      while (typeof window.moveDrone !== "function") {
        console.log("Warte auf moveDrone...");
        await new Promise((r) => setTimeout(r, 50));
      }

      const response = await fetch("/game.py");
      const pythonCode = await response.text();
      await pyodide.runPythonAsync(pythonCode);

      window.runPython = async (code: string) => {
        try {
          return await pyodide.runPythonAsync(code);
        } catch (err) {
          console.error("Fehler im Python-Code:", err);
        }
      };

      console.log("Python + Bibliothek geladen!");
    }

    initPython();
  }, []);

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
                <div className="w-full max-h-[400px] aspect-square">
                  <Scene />
                </div>
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
