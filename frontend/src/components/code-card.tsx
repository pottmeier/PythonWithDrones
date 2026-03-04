"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";
import { toast } from "sonner";
import { Play } from "lucide-react";

interface CodeCardProps {
  code: string;
  setCode: (value: string) => void;
  onSubmit: (code: string) => void;
  isReady: boolean;
  isRunning?: boolean;
  stopCode?: () => void;
}

export function CodeCard({
  code,
  setCode,
  onSubmit,
  isReady,
  isRunning,
  stopCode,
}: CodeCardProps) {
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
    setCode(newCode);
  };

  const handleRun = async () => {
    if (isRunning && stopCode) {
      stopCode();
      return;
    }
    setCode(localCode);
    if (typeof (window as any).runPython !== "function") {
      toast.warning("Engine not ready.");
      return;
    }
    (window as any).runPython(localCode);
  };

  const submitCode = () => {
    onSubmit(localCode);
    console.log("Code submitted:", localCode);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
          Code
        </h2>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={!isReady}
            size="sm"
            className="cursor-pointer font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            <Play size={14} className="mr-1.5" />
            Run
          </Button>
        </div>
      </div>

      {/* --- EDITOR CONTENT --- */}
      <div className="flex-1 min-h-0 relative bg-gray-50 dark:bg-gray-900">
        <CodeEditor code={localCode} setCode={handleCodeChange} />
      </div>
    </div>
  );
}
