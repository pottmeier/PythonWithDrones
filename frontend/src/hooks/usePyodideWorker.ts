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
        (window as any).droneAction?.(action);
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



  // start the worker once on mount
  useEffect(() => {
    initWorker();
    return () => workerRef.current?.terminate();
  }, [initWorker]);



  // load the level/scene once after selecting a level in the app
  const loadLevel = useCallback((levelName: string) => {
    if (!workerRef.current || !isReady) return;
    
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


  // running the user code
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


  // reset function to reset the virtual drone inside python after the visual drone has been reset
  const softReset = useCallback(() => {
    console.log("Resetting Drone");
    const spawn = (window as any).getLevelData?.()?.spawn;
    workerRef.current?.postMessage({ 
        type: "RESET",
        spawn: spawn 
    });
    setHasCrashed(false);
    hasCrashedRef.current = false;
  }, []);


  
  return { isReady, isRunning, runCode, softReset, loadLevel, hasCrashed };
}