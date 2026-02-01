import { useEffect, useRef, useState, useCallback } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";



export function usePyodideWorker() {
  const workerRef = useRef<Worker | null>(null);
  const hasCrashedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);



  // initialize worker
  const initWorker = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate();

    // create the worker
    const worker = new Worker(`${basePath}/py-worker.js`);
    workerRef.current = worker;
    setIsReady(false);
    setHasCrashed(false);
    hasCrashedRef.current = false;

    // listen to messages from python
    worker.onmessage = (event) => {
      const { type, action, message } = event.data;

      if (type === "READY") {
        setIsReady(true);
        console.log("Pyodide Worker Ready");
      } 
      else if (type === "ACTION") {
        if ((window as any).droneAction) (window as any).droneAction(action);
        if (action?.type === "crash") {
          hasCrashedRef.current = true;
          setHasCrashed(true);
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



  // start the worker on mount
  useEffect(() => {
    initWorker();
    return () => workerRef.current?.terminate();
  }, [initWorker]);


  // 
  const loadLevel = useCallback((levelName: string) => {
    if (!workerRef.current || !isReady) return;
    
    // We get data from window (assuming your app sets this up globally or you pass it in)
    // Ideally this should be passed as arguments, but keeping your style:
    const generatedLevel = (window as any).getLevelData?.();
    const spawn = generatedLevel?.spawn || { x: 0, y: 0, z: 0 };
    const blockRegistry = JSON.parse(JSON.stringify((window as any).getBlockRegistry?.() || {}, (k, v) => k === 'component' ? undefined : v));

    workerRef.current.postMessage({
      type: "LOAD_LEVEL",
      levelName,
      generatedLevel,
      spawn,
      registry: blockRegistry
    });
  }, [isReady]);



  const runCode = async (userCode: string) => {
    if (!isReady || !workerRef.current) return;
    setHasCrashed(false);
    hasCrashedRef.current = false;
    setIsRunning(true);

    workerRef.current.postMessage({ 
      type: "RUN",
      code: userCode
    });
  };



  // 4. Hard Terminate (Infinite Loops)
  const terminateWorker = useCallback(() => {
    // This will now only trigger if Python is TRULY stuck in a loop
    // and cannot send the "FINISHED" message.
    if (isRunning) {
        console.log("Hard stopping worker (Infinite Loop)...");
        softReset();
        setTimeout(() => {
          if (isRunning) {
            console.log("Soft stop failed (Thread locked). Hard Resetting...");
            initWorker();
            setIsRunning(false);
          }
        }, 500);
    }
  }, [isRunning, initWorker]);

  // 5. Soft Reset (Reset Button / Crash Recovery)
  const softReset = useCallback(() => {
    console.log("Soft Resetting Drone Position...");
    const spawn = (window as any).getLevelData?.()?.spawn;
    workerRef.current?.postMessage({ 
        type: "RESET",
        spawn: spawn 
    });
    setHasCrashed(false);
    hasCrashedRef.current = false;
  }, []);


  
  return { isReady, isRunning, runCode, softReset, terminateWorker, loadLevel, hasCrashed };
}