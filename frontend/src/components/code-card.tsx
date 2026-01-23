"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";
import { toast } from "sonner";
import { Play, Send } from "lucide-react";

interface CodeCardProps {
  code: string;
  setCode: (value: string) => void;
  onSubmit: (code: string) => void;
}

export function CodeCard({ code, setCode, onSubmit }: CodeCardProps) {
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const runCode = async () => {
    onSubmit(localCode);
    setCode(localCode);
    if (typeof window.runPython !== "function") {
      toast.warning("⚠️ Python-Engine ist noch nicht bereit. Bitte warten.");
      return;
    }

    try {
      await window.runPython(localCode);
    } catch (err: any) {
      console.error("Python runtime error:", err);

      let msg = "Unbekannter Python-Fehler";

      if (err && typeof err.toString === "function") {
        const lines = err
          .toString()
          .split("\n")
          .map((l: any) => l.trim());
        const pythonErrorLine = lines
          .reverse()
          .find((l: any) => l.match(/(Error|Exception):/));
        if (pythonErrorLine) msg = pythonErrorLine;
      }

      toast.error(`${msg}`);
    }
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
            onClick={runCode}
            size="sm"
            className="cursor-pointer font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play size={14} className="mr-1.5" />
            Run
          </Button>

          <Button
            onClick={submitCode}
            size="sm"
            variant="secondary"
            className="cursor-pointer bg-white text-gray-700 border border-gray-200 hover:bg-gray-50
  dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <Send size={14} className="mr-1.5" />
            Submit
          </Button>
        </div>
      </div>

      {/* --- EDITOR CONTENT --- */}
      <div className="flex-1 min-h-0 relative bg-gray-50 dark:bg-gray-900">
        <CodeEditor code={localCode} setCode={setLocalCode} />
      </div>
    </div>
  );
}
