import { useEffect, useRef, useState, useCallback } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function usePyodideWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(`${basePath}/py-worker.js`);
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
    try {
      const response = await fetch(`${basePath}/python/game.py`);
      const gameScript = await response.text();
      const levelData = (window as any).getLevelData?.();
      const spawn = levelData?.spawn || { x: 0, y: 0, z: 0 };
      workerRef.current.postMessage({ 
        type: "RUN",
        code: userCode, 
        gameScript,
        spawn: spawn 
      });
    } catch (err: any) {
      console.error("Failed to start worker run:", err);
      setIsRunning(false);
    }
  };

  const stopCode = () => {
    console.log("Hard Stopping Worker...");
    setIsRunning(false);
    initWorker();
  };

  const resetWorkerState = useCallback(() => {
    if (!workerRef.current) return;
    
    const levelData = (window as any).getLevelData?.();
    const spawn = levelData?.spawn || { x: 0, y: 0, z: 0 };

    workerRef.current.postMessage({ 
      type: "RESET", 
      spawn: spawn 
    });
  }, []);

  return { isReady, isRunning, runCode, stopCode, resetWorkerState };
}