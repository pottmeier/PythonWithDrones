"use client";

import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskCard } from "@/components/task-card";
import { TestCard } from "@/components/test-card";
import { CodeCard } from "@/components/code-card";
import Scene from "@/components/scene";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "sonner";
import { loadState, saveLevelProgress } from "@/lib/appState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

type Level = { id: string };

interface LevelContentProps {
  level: Level;
}

function SidebarBackdrop() {
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();

  const isOpen = isMobile ? openMobile : open;

  const close = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  return (
    <div
      aria-hidden="true"
      onClick={close}
      className={[
        "fixed inset-0 z-40 bg-black/40 transition-opacity",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    />
  );
}

export default function LevelContent({ level }: LevelContentProps) {
  const levelId = level.id;
  const [code, setCode] = useState("");
  const [dark, setDark] = useState(true);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [username, setUsername] = useState("");

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

      const response = await fetch(`${basePath}/python/game.py`);
      const pythonCode = await response.text();

      await pyodide.runPythonAsync(pythonCode);

      window.runPython = (code: string) => pyodide.runPythonAsync(code);

      setPyodideLoaded(true);
    }

    initPython();
  }, []);

  useEffect(() => {
    const id = Number(levelId);
    if (!Number.isFinite(id)) return;

    const state = loadState();
    setUsername(state.user.username);
    const savedCode = state.progress.levels[id]?.code ?? "";
    setCode(savedCode);
  }, [levelId]);

  const submitCode = (submittedCode: string) => {
    const id = Number(levelId);
    if (!Number.isFinite(id)) return;

    saveLevelProgress(id, { code: submittedCode });
  };

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />
        <SidebarBackdrop />

        <div className="flex min-h-screen flex-col">
          <header className="p-4 flex items-center border-b">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row flex-1 gap-4">
              <TaskCard title={`Level ${levelId}`} />
              <div className="flex-[2] flex justify-center items-center p-4 bg-gray-100 dark:bg-gray-900">
                <div className="w-full max-h-[500px] aspect-square relative">
                  <div
                    className={`transition-opacity duration-500 w-full h-full ${
                      pyodideLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Scene />
                  </div>
                  {!pyodideLoaded && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center">
                      <Spinner className="mb-2" />
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-4">
              <TestCard title="Tests" />
              <CodeCard code={code} setCode={setCode} onSubmit={submitCode} />
            </div>
          </main>
        </div>
      </div>

      <Toaster position="top-left" richColors closeButton />
    </SidebarProvider>
  );
}
