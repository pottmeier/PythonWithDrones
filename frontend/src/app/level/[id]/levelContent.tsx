//LevelContent.tsx
"use client";

import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
// import { TaskCard } from "@/components/task-card";
// import { TestCard } from "@/components/test-card";
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
    <div className="relative min-h-screen lg:h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 lg:overflow-hidden transition-colors duration-300">
      <AppSidebar />
      <SidebarBackdrop />

      <div className="flex min-h-screen lg:h-screen flex-col">
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

        <main className="flex-1 flex flex-col-reverse lg:flex-row p-4 gap-4 lg:overflow-hidden">
          <div className="w-full lg:w-1/3 lg:min-w-[350px] shrink-0 h-[500px] lg:h-full flex flex-col">
            <CodeCard code={code} setCode={setCode} onSubmit={submitCode} />
          </div>

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

      <Toaster position="top-left" richColors closeButton />
    </div>
  </SidebarProvider>
);
}