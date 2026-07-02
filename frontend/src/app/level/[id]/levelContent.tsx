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
import { loadState, saveLevelProgress } from "@/lib/app-state";
import { usePyodideWorker } from "@/hooks/usePyodideWorker";
import { UserMenu } from "@/components/user-menu";
import { submitScore } from "@/lib/leaderboard-api";

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
  const [token, setToken] = useState("");
  const [isSceneBusy, setIsSceneBusy] = useState(false);
  const [completionTimeMs, setCompletionTimeMs] = useState<number | null>(null);
  const [coins, setCoins] = useState({ collected: 0, required: 0 });
  const levelOpenedAtRef = useRef<number>(Date.now());
  const { isReady, isRunning, runCode, hardReset, loadLevel, hasCrashed, error, getRunStats } =
    usePyodideWorker();
  const isSystemActive = isRunning || isSceneBusy || hasCrashed;

  // load the level into the worker
  useEffect(() => {
    if (isReady && levelId) {
      const file = `Level_${levelId}.yaml`;
      loadLevel(file);
    }
  }, [isReady, levelId, loadLevel]);

  // load the saved code into the code-editor
  useEffect(() => {
    const state = loadState();
    const idNum = Number(levelId);
    setUsername(state.user.username || "");
    setToken(state.user.token || "");
    if (Number.isFinite(idNum)) {
      const savedCode =
        state.progress.levels[idNum]?.code ?? "# Start coding here...";
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



  // expose runPython to the CodeCard run button
  useEffect(() => {
    (window as any).runPython = (...args: Parameters<typeof runCode>) => {
      setCompletionTimeMs(null);
      return runCode(...args);
    };
  }, [runCode]);

  // called by Scene when the drone reaches the finish block.
  // elapsed = time from opening the level to first successful completion,
  // capturing how long the user took to read, think, and write their solution.
  const handleLevelComplete = useCallback(() => {
    const elapsed = Date.now() - levelOpenedAtRef.current;
    setCompletionTimeMs(elapsed);
    const currentToken = loadState().user.token;
    if (currentToken && elapsed > 0) {
      const { steps, code: ranCode } = getRunStats();
      const linesOfCode = ranCode
        .split("\n")
        .filter((line) => line.trim().length > 0).length;
      submitScore(currentToken, Number(levelId), elapsed, steps, linesOfCode);
    }
  }, [levelId, getRunStats]);

  // track coin progress reported by the Scene
  const handleCoinsChange = useCallback((collected: number, required: number) => {
    setCoins({ collected, required });
  }, []);

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
              {coins.required > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-sm font-medium px-3 py-1">
                  🪙 {coins.collected}/{coins.required}
                </span>
              )}
              <UserMenu
                username={username}
                token={token}
                onAuthChange={(u, t) => { setUsername(u); setToken(t); }}
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
                  isReady={isReady}
                  isRunning={isSystemActive}
                  stopCode={handleDroneReset}
                  error={error}
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
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
                  >
                    <Scene
                      levelId={levelId}
                      onBusyChange={setIsSceneBusy}
                      onLevelComplete={handleLevelComplete}
                      completionTimeMs={completionTimeMs}
                      onCoinsChange={handleCoinsChange}
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
