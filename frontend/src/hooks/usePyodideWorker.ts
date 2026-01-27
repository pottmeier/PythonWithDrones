import { useEffect, useRef, useState, useCallback } from "react";

export function usePyodideWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker("/py-worker.js");
    workerRef.current = worker;
    setIsReady(false);

    worker.onmessage = (event) => {
      const { type, action, message } = event.data;

      if (type === "READY") {
        setIsReady(true);
        console.log("Pyodide Worker Ready");
      } 
      else if (type === "ACTION") {
        if ((window as any).droneAction) {
          (window as any).droneAction(action);
        }
      }
      else if (type === "FINISHED") {
        setIsRunning(false);
        console.log("Script finished");
      }
      else if (type === "ERROR") {
        setIsRunning(false);
        console.error("Python Error:", message);
      }
    };
  }, []);

  useEffect(() => {
    initWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, [initWorker]);

  const runCode = async (userCode: string) => {
    if (!isReady || !workerRef.current) return;
    setIsRunning(true);
    const response = await fetch("/python/game.py");
    const gameScript = await response.text();
    workerRef.current.postMessage({ code: userCode, gameScript });
  };

  const stopCode = () => {
    console.log("Hard Stopping Worker...");
    setIsRunning(false);
    initWorker();
  };

  return { isReady, isRunning, runCode, stopCode };
}