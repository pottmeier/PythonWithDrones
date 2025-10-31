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

export default function Home() {
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

  // MoveDrone Queue vorbereiten
  useEffect(() => {
    const moveQueue: string[] = [];
    let isMoving = false;

    async function processQueue() {
      if (isMoving || moveQueue.length === 0) return;
      isMoving = true;

      const direction = moveQueue.shift();
      // Hier prüfen, ob Scene GridPosition-Setter verfügbar ist
      // Da Scene später gerendert wird, nutzen wir window.setGridPosition aus Scene
      if (window.setGridPosition) {
        window.setGridPosition((prev: [number, number]) => {
          const newPos = [...prev] as [number, number];
          if (direction === "rechts") newPos[0] += 1;
          if (direction === "links") newPos[0] -= 1;
          if (direction === "hoch") newPos[1] -= 1;
          if (direction === "runter") newPos[1] += 1;
          return newPos;
        });
      }

      await new Promise((r) => setTimeout(r, 300));
      isMoving = false;
      processQueue();
    }

    window.moveDrone = (direction: string) => {
      moveQueue.push(direction);
      processQueue();
    };
  }, []);

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
                <div className="w-full max-h-[400px] aspect-square flex justify-center items-center">
                  {pyodideLoaded ? (
                    <Scene />
                  ) : (
                    <div className="flex flex-col justify-center items-center text-gray-700 dark:text-gray-200 text-md h-full font-mono">
                      <Spinner className="mb-2" />{" "}
                      Lade Pyodide...
                    </div>
                  )}
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
