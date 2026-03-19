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
  error?: string;
}

export function CodeCard({
  code,
  setCode,
  onSubmit,
  isReady,
  isRunning,
  stopCode,
  error,
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

  const formatError = (msg: string) => {
    if (!msg) return "";
    const lines = msg.split("\n").filter(Boolean);
    const errorLine = lines.find((line) => /error|exception/i.test(line));

    if (errorLine) {
      return errorLine;
    }

    return lines[lines.length - 1];
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
            disabled={!isReady || isRunning}
            size="sm"
            className="cursor-pointer font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            <Play size={14} className="mr-1.5" />
            Run
          </Button>
        </div>
      </div>

      {/* --- EDITOR CONTENT --- */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-900">

        <div className="flex-1 min-h-0">
          <CodeEditor code={localCode} setCode={handleCodeChange} />
        </div>

        {error && (
          <div
            className="overflow-auto p-3 border-t font-mono rounded-b-xl bg-red-100 text-red-800 border-red-400 dark:bg-red-900 dark:text-red-400 dark:border-red-500">
            <div className="font-bold mb-1">Error</div>
            <pre className="whitespace-pre-wrap break-words text-sm">
              {formatError(error)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
