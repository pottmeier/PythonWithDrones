"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
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
  const [isSceneBusy, setIsSceneBusy] = useState(false);
  const { isReady, isRunning, runCode, hardReset, loadLevel, hasCrashed } = usePyodideWorker();
  const isSystemActive = isRunning || isSceneBusy || hasCrashed;


  // load the level into the worker
  useEffect(() => {
    if (isReady && levelId) {
      // hardcoded testing
      // TODO: something like: loadLevel(`${levelId}.yaml`)
      loadLevel("prototype_level.yaml");
    }
  }, [isReady, levelId, loadLevel]);
 
  
  // load the saved code into the code-editor
  useEffect(() => {
    const state = loadState();
    const idNum = Number(levelId);
    setUsername(state.user.username || "");
    if (Number.isFinite(idNum)) {
      const savedCode = state.progress.levels[idNum]?.code ?? "# Start coding here...\nmove()";
      setCode(savedCode);
    }
  }, [levelId]);


  // save the current code to the local storage
  useEffect(() => {
    const idNum = Number(levelId);
    if (Number.isFinite(idNum) && code !== "") {
      saveLevelProgress(idNum, { code });
    }
  }, [code, levelId]);


  // reset the drone virtually and visually
  const handleDroneReset = useCallback(() => {
    // reset internal coordinates and rotation inside python to the spawn
    hardReset(); 
    // reset the visual drone to the spawn and clear the queue
    (window as any).resetScene?.();
  }, [hardReset]);


  // trigger the drone reset after pressing the button
  useEffect(() => {
    (window as any).triggerDroneReset = handleDroneReset;
    return () => {
      (window as any).triggerDroneReset = undefined;
    };
  }, [handleDroneReset]);


  // darkmode
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);


  // execute user code
  useEffect(() => {
    (window as any).runPython = runCode;
  }, [runCode]);


  // submit user code
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
              <div className="pointer-events-none">
                <UserMenu
                  username={username}
                  setUsername={setUsername}
                  onRequireUsername={() => {}}
                />
              </div>
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
                  isReady={isReady}
                  isRunning={isSystemActive}
                  stopCode={handleDroneReset}
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
      <Toaster position="top-left" richColors closeButton />
    </SidebarProvider>
  );
}
