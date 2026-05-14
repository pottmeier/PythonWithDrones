"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeCard } from "@/components/code-card";
import Scene from "@/components/scene";
import { Spinner } from "@/components/ui/spinner";
import { usePyodideWorker } from "@/hooks/usePyodideWorker";
import type { LevelData } from "@/types/level";

interface TestPlayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: LevelData;
}

export function TestPlayModal({
  open,
  onOpenChange,
  level,
}: TestPlayModalProps) {
  // Only mount the heavy Pyodide + Scene tree while the modal is open.
  // Closing fully unmounts → terminates the worker.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] !w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>Test Play — {level.title || "Untitled"}</DialogTitle>
        </DialogHeader>
        {open && <TestPlayInner level={level} />}
      </DialogContent>
    </Dialog>
  );
}

function TestPlayInner({ level }: { level: LevelData }) {
  const [code, setCode] = useState("# Test your level here...\n");
  const [isSceneBusy, setIsSceneBusy] = useState(false);
  const { isReady, isRunning, runCode, hardReset, loadLevel, hasCrashed, error } =
    usePyodideWorker();
  const isSystemActive = isRunning || isSceneBusy || hasCrashed;

  useEffect(() => {
    if (isReady) {
      loadLevel("editor-test");
    }
  }, [isReady, loadLevel]);

  useEffect(() => {
    (window as any).runPython = runCode;
  }, [runCode]);

  const handleDroneReset = () => {
    hardReset();
    (window as any).resetScene?.();
  };

  useEffect(() => {
    (window as any).triggerDroneReset = handleDroneReset;
    return () => {
      (window as any).triggerDroneReset = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hardReset]);

  return (
    <div className="flex-1 flex flex-col-reverse lg:flex-row p-4 gap-4 overflow-hidden">
      <div className="w-full lg:w-1/3 lg:min-w-[350px] shrink-0 h-[400px] lg:h-full">
        <CodeCard
          code={code}
          setCode={setCode}
          onSubmit={() => {}}
          isReady={isReady}
          isRunning={isSystemActive}
          stopCode={handleDroneReset}
          error={error}
        />
      </div>
      <div className="w-full lg:flex-1 h-[400px] lg:h-full min-w-0">
        <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <Scene levelData={level} onBusyChange={setIsSceneBusy} />
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
  );
}
