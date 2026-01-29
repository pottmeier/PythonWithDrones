//levelContent.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { CodeCard } from "@/components/code-card";
import Scene from "@/components/scene";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "sonner";
import { loadState, saveLevelProgress, updateState } from "@/lib/app-state";
import { usePyodideWorker } from "@/hooks/usePyodideWorker";
import { UserMenu } from "@/components/user-menu";
import { UsernameDialog } from "@/components/user-dialog";

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
  const [username, setUsername] = useState("");
  const [dark] = useState(true);
  const { isReady, isRunning, runCode, stopCode, resetWorkerState } = usePyodideWorker();
  const [isSceneBusy, setIsSceneBusy] = useState(false);
  const isSystemActive = isRunning || isSceneBusy;

  const isInitialized = useRef(false);

  useEffect(() => {
    isInitialized.current = false; 
    
    const id = Number(levelId);
    if (!Number.isFinite(id)) return;

    const state = loadState();
    setUsername(state.user.username || "");
    
    const savedCode = state.progress.levels[id]?.code ?? "# Start coding here...\nmove()";
    setCode(savedCode);

    isInitialized.current = true;
  }, [levelId]);

  useEffect(() => {
    const id = Number(levelId);
    if (isInitialized.current && Number.isFinite(id) && code !== "") {
      saveLevelProgress(id, { code });
    }
  }, [code, levelId]);

  const stopEngineOnly = useCallback(() => {
    stopCode();
  }, [stopCode]);

  const handleFullReset = useCallback(() => {
    stopCode();
    resetWorkerState(); 
    if ((window as any).resetScene) {
      (window as any).resetScene();
    }
  }, [stopCode]);

  useEffect(() => {
    (window as any).stopPythonEngine = stopEngineOnly;
    (window as any).triggerFullReset = handleFullReset;
    return () => {
      (window as any).stopPythonEngine = undefined;
      (window as any).triggerFullReset = undefined;
    };
  }, [stopEngineOnly, handleFullReset]);

  // Darkmode
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    (window as any).runPython = runCode;
  }, [runCode]);

  const submitCode = (submittedCode: string) => {
    const id = Number(levelId);
    if (!Number.isFinite(id)) return;

    saveLevelProgress(id, {
      code: submittedCode,
    });
  };

  return (
    <SidebarProvider>
      {/* 
         1. RESPONSIVE CONTAINER 
         - Mobile: min-h-screen (Scrollable)
         - Desktop (lg): h-screen + overflow-hidden (Locked App-like view)
      */}
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />
        <SidebarBackdrop />

        {/* Flex column wrapper */}
        <div className="flex flex-1 flex-col h-full lg:overflow-hidden">
          {/* Header */}
          <header className="p-4 flex items-center border-b">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4 cursor-default">
              <UserMenu 
                username={username} 
                setUsername={setUsername} 
              />
              <DarkModeToggle />
            </div>
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
                <CodeCard 
                  code={code}
                  setCode={setCode}
                  onSubmit={submitCode}
                  isRunning={isSystemActive}
                  stopCode={handleFullReset}
                />
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
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}>
                    <Scene 
                      levelId={levelId} 
                      onBusyChange={setIsSceneBusy} 
                    />
                  </div>
                  {!isReady && (
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
      <UsernameDialog onSaved={(name) => setUsername(name)} />
      <Toaster position="top-left" richColors closeButton />
    </SidebarProvider>
  );
}
