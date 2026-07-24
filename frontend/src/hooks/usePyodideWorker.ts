import { useEffect, useRef, useState, useCallback } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function usePyodideWorker() {
  const workerRef = useRef<Worker | null>(null);
  const stepCountRef = useRef(0);
  const runStatsRef = useRef({ crashes: 0, distance: 0 });
  const lastRunCodeRef = useRef("");

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // collected print() output of the current run, shown in the terminal panel
  const [output, setOutput] = useState<string[]>([]);

  // initialize worker
  const initWorker = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate();

    // create the worker
    const worker = new Worker(`${basePath}/py-worker.js`);
    workerRef.current = worker;
    setIsReady(false);
    setHasCrashed(false);
    setOutput([]);

    // listen to messages from python
    worker.onmessage = (event) => {
      const { type, action, message } = event.data;

      if (type === "READY") {
        setIsReady(true);
        setError(undefined);
        console.log("Pyodide Worker Ready");
      } else if (type === "ACTION") {
        (window as any).droneAction?.(action);
        if (action?.type === "move") {
          stepCountRef.current += 1;
        }
        if (action?.type === "crash") {
          setHasCrashed(true);
        }
      } else if (type === "PRINT") {
        setOutput((prev) => [...prev, message]);
      } else if (type === "FINISHED") {
        setIsRunning(false);
        runStatsRef.current = event.data.stats ?? { crashes: 0, distance: 0 };
        console.log("Script finished");
      } else if (type === "ERROR") {
        setIsRunning(false);
        setError(message);
      }
    };
  }, []);

  // start the worker once on mount
  useEffect(() => {
    initWorker();
    return () => workerRef.current?.terminate();
  }, [initWorker]);

  // load the level/scene once after selecting a level in the app
  const loadLevel = useCallback(
    (levelName: string) => {
      if (!workerRef.current || !isReady) return;

      const levelData = (window as any).getLevelData?.();
      if (!levelData) {
        console.error("No level data found in window.getLevelData");
        return;
      }
      const spawn = {
        ...(levelData.spawn || { x: 0, y: 0, z: 0 }),
        orientation: levelData.orientation ?? 0,
      };
      const blockRegistry = JSON.parse(
        JSON.stringify((window as any).getBlockRegistry?.() || {}, (k, v) =>
          k === "component" ? undefined : v,
        ),
      );

      workerRef.current.postMessage({
        type: "LOAD_LEVEL",
        levelData: levelData,
        spawn: spawn,
        registry: blockRegistry,
      });
    },
    [isReady],
  );

  // running the user code
  const runCode = async (userCode: string) => {
    if (!isReady || !workerRef.current) return;
    setError(undefined);
    setOutput([]);
    setHasCrashed(false);
    setIsRunning(true);
    stepCountRef.current = 0;
    runStatsRef.current = { crashes: 0, distance: 0 };
    lastRunCodeRef.current = userCode;
    workerRef.current.postMessage({
      type: "RUN",
      code: userCode,
    });
  };

  // read the step count, stats, and code of the most recently started run
  const getRunStats = useCallback(
    () => ({
      steps: stepCountRef.current,
      code: lastRunCodeRef.current,
      crashes: runStatsRef.current.crashes,
      distance: runStatsRef.current.distance,
    }),
    [],
  );

  // reset function to reset the virtual drone inside python after the visual drone has been reset
  const hardReset = useCallback(() => {
    console.log("Hard Resetting Worker...");
    setIsRunning(false);
    setHasCrashed(false);
    initWorker();
  }, [initWorker]);

  const clearOutput = useCallback(() => setOutput([]), []);

  return {
    isReady,
    isRunning,
    runCode,
    hardReset,
    loadLevel,
    hasCrashed,
    error,
    output,
    clearOutput,
    getRunStats,
  };
}
