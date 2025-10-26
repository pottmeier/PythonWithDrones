"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";

interface CodeCardProps {
  code: string;
  setCode: (value: string) => void;
}

export function CodeCard({ code, setCode }: CodeCardProps) {
  const runCode = () => {
    if (typeof window.runPython === "function") {
      try {
        window.runPython(code);
      } catch (e) {
        console.error(
          "Fehler beim Aufruf der Brückenfunktion 'window.runPython':",
          e
        );
      }
    } else {
      console.error("Die Python-Brücke 'window.runPython' ist nicht bereit.");
      alert(
        "Die Python-JavaScript-Brücke ist noch nicht bereit. Bitte warten."
      );
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
