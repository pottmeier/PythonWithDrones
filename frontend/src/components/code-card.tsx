"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";
import { toast } from "sonner";

interface CodeCardProps {
  code: string;
  setCode: (value: string) => void;
}

export function CodeCard({ code, setCode }: CodeCardProps) {
  const runCode = async () => {
    if (typeof window.runPython !== "function") {
      toast.warning("⚠️ Python-Engine ist noch nicht bereit. Bitte warten.");
      return;
    }

    try {
      await window.runPython(code);
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
    console.log("Code submitted:", code);
  };

  return (
    <div className="flex-[2] bg-white dark:bg-gray-800 border rounded-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-2">Code</h2>
      <CodeEditor code={code} setCode={setCode} />
      <div className="mt-2 flex space-x-2 self-end">
        <Button className="text-md cursor-pointer" onClick={runCode}>
          Run
        </Button>
        <Button className="text-md cursor-pointer" onClick={submitCode}>
          Submit
        </Button>
      </div>
    </div>
  );
}
