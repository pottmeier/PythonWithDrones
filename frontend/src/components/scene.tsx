//scene.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid from "./grid";
import Compass from "./compass";
import * as THREE from "three";
import { registerPyodideFunctions } from "./pyodideFunctions";
import { ScanEye, RotateCcw, ScrollText } from "lucide-react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

interface LevelLoadData {
  size: { width: number; height: number; depth: number };
  spawn: { x: number; y: number; z: number };
  description?: string;
}

interface SceneProps {
  levelId: string;
}

export default function Scene({ levelId }: SceneProps) {
  const positionRef = useRef<[number, number, number]>([0, 0, 0]);
  const moveQueueRef = useRef<string[]>([]);
  const droneRef = useRef<THREE.Group>(new THREE.Group)
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);
  const [levelSize, setLevelSize] = useState<{
    width: number;
    height: number;
    depth: number;
  } | null>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const spawnRef = useRef<[number, number, number]>([0, 10, 0]);
  const [droneKey, setDroneKey] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [levelDescription, setLevelDescription] = useState<string>("");

  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // Camera Settings
  const { width = 1, depth = 1 } = levelSize || {};
  const mapCenterX = width / 2;
  const mapCenterZ = depth / 2;
  const START_POSITION: [number, number, number] = [
    mapCenterX - 10,
    10,
    mapCenterZ + 10,
  ];
  const START_TARGET: [number, number, number] = [mapCenterX, 0.5, mapCenterZ];
  const PAN_FACTOR = 2;
  const minPanX = mapCenterX - width / 2 - PAN_FACTOR;
  const maxPanX = mapCenterX + width / 2 + PAN_FACTOR;
  const minPanZ = mapCenterZ - depth / 2 - PAN_FACTOR;
  const maxPanZ = mapCenterZ + depth / 2 + PAN_FACTOR;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  //crash
  const [crashDirection, setCrashDirection] = useState<
    [number, number, number] | null
  >(null);
  const [crashHeight, setCrashHeight] = useState<number>(0.2);

  const isPositionSafe = (
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
  ) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;
    if (!getLevelData || !getBlockRegistry) return false;

    const data = getLevelData();
    const registry = getBlockRegistry();

    const gridX = Math.round(x);
    const gridY = Math.round(y);
    const gridZ = Math.round(z);

    console.log(
      `Checking: World[${x},${z}] -> Grid[${gridX},${gridZ}] Layer ${gridY}`,
    );

    if (gridX < 0 || gridX >= width) return false; // Out of bounds X
    if (gridZ < 0 || gridZ >= depth) return false; // Out of bounds Z
    if (gridY < 0) return false; // Below the world

    if (gridY >= height) return false;

    const layerName = `layer_${gridY}`;
    const layer = data.layers[layerName];
    const blockId = layer[gridZ]?.[gridX];

    if (!blockId || blockId === "empty") return true;

    const blockDef = registry[blockId];

    if (blockDef && blockDef.isCollidable) return false;

    return true;
  };

  // Direction map: use world-space deltas [dx, dy, dz]
  const deltas: Record<string, [number, number, number]> = {
    east: [1, 0, 0],
    west: [-1, 0, 0],
    north: [0, 0, -1],
    south: [0, 0, 1],
    up: [0, 1, 0],
    down: [0, -1, 0],
  };

  const turn = Math.PI / 2;

  const handleLevelLoaded = useCallback((data: LevelLoadData) => {
    console.log("Level loaded:", data);
    setLevelSize(data.size);
    setLevelDescription(data.description || "");

    const worldX = data.spawn.x;
    const worldY = data.spawn.y;
    const worldZ = data.spawn.z;

    spawnRef.current = [worldX, worldY, worldZ];
    positionRef.current = [worldX, worldY, worldZ];
    positionRef.current = [worldX, worldY, worldZ];
  }, []);

  const getCrashLandingHeight = (
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    maxHeight: number,
  ) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;

    if (!getLevelData || !getBlockRegistry) return 0.2;

    const data = getLevelData();
    const registry = getBlockRegistry();
    const gridX = Math.round(x);
    const gridZ = Math.round(z);
    const startLayer = Math.floor(y) - 1;

    for (let checkY = startLayer; checkY >= 0; checkY--) {
      const layerName = `layer_${checkY}`;
      const layer = data.layers[layerName];
      if (!layer) continue;
      const blockId = layer[gridZ]?.[gridX];
      if (blockId && blockId !== "empty") {
        const blockDef = registry[blockId];
        if (blockDef && blockDef.isCollidable) {
          return checkY + 0.5 + 0.2;
        }
      }
    }
    return 0.2;
  };

  const checkFinishCondition = (
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    height: number,
  ) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;
    if (!getLevelData || !getBlockRegistry) return false;

    const data = getLevelData();
    const registry = getBlockRegistry();

    const gridX = Math.round(x);
    const gridY = Math.round(y);
    const gridZ = Math.round(z);

    // Check boundaries first
    if (
      gridX < 0 ||
      gridX >= width ||
      gridZ < 0 ||
      gridZ >= depth ||
      gridY < 0 ||
      gridY >= height
    )
      return false;

    const layerName = `layer_${gridY}`;
    const layer = data.layers[layerName];

    // LOGGING
    if (layer) {
      const blockId = layer[gridZ]?.[gridX];
      console.log(
        `Checking Win: [${gridX}, ${gridY}, ${gridZ}] -> Block: ${blockId}`,
      );

      if (blockId) {
        const blockDef = registry[blockId];
        console.log("Block Definition:", blockDef);
        if (blockDef && blockDef.isFinish) {
          return true;
        }
      }
    }

    if (!layer) return false;

    const blockId = layer[gridZ]?.[gridX];
    if (!blockId || blockId === "empty") return false;

    const blockDef = registry[blockId];
    if (blockDef && blockDef.isFinish) {
      return true;
    }
    return false;
  };

  const processNextMoveInQueue = useCallback(() => {
    if (isLevelComplete) {
      isAnimatingRef.current = false;
      return;
    }

    if (moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }
    if (crashDirection) {
      isAnimatingRef.current = false;
      return;
    }

    isAnimatingRef.current = true;
    const nextMove = moveQueueRef.current.shift()!;
    const key = nextMove.toLowerCase();
    const moveDelta = deltas[key];


    if (key === "left" || key === "right") {
      gsap.to(droneRef.current.rotation, {
        y: key === "left" ? `+=${turn}` : `-=${turn}`,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => processNextMoveInQueue()
      });
      return;
    }

    // If unknown command, skip and proceed to next
    if (!moveDelta) {
      console.error(`Unknown direction: ${nextMove}`);
      isAnimatingRef.current = false;
      processNextMoveInQueue();
      return;
    }

    const [x, y, z] = positionRef.current;
    const dx = moveDelta[0];
    const dy = moveDelta[1];
    const dz = moveDelta[2];
    const targetX = x + dx;
    const targetY = y + dy;
    const targetZ = z + dz;

    const { width = 1, depth = 1, height = 99 } = levelSize || {};
    const safe = isPositionSafe(
      targetX,
      targetY,
      targetZ,
      width,
      height,
      depth,
    );

    if (!safe) {
      console.warn("CRASH! Movement blocked by object or border.");
      isAnimatingRef.current = false;
      const landingY = getCrashLandingHeight(x, y, z, width, depth, height);
      setCrashHeight(landingY);
      setCrashDirection([dx, dy, dz]);
      moveQueueRef.current = [];
      return;
    }

    positionRef.current = [targetX, targetY, targetZ];
    console.log("Moving to:", positionRef.current);

    const won = checkFinishCondition(
      targetX,
      targetY,
      targetZ,
      width,
      depth,
      height,
    );
    if (won) {
      console.log("LEVEL COMPLETE!");
      isAnimatingRef.current = false;
      setIsLevelComplete(true);
      moveQueueRef.current = [];
    }
  }, [width, depth, crashDirection, isLevelComplete]);

  const handleAnimationComplete = useCallback(() => {
    processNextMoveInQueue();
  }, [processNextMoveInQueue]);

  useEffect(() => {
    registerPyodideFunctions(
      moveQueueRef,
      isAnimatingRef,
      processNextMoveInQueue,
      positionRef,
      droneRef
    );
  }, [processNextMoveInQueue]);

  const resetLevel = () => {
    isAnimatingRef.current = false;
    moveQueueRef.current = [];
    setCrashDirection(null);
    setCrashHeight(0.2);
    positionRef.current = [...spawnRef.current];
    setDroneKey((prev) => prev + 1);
    setIsLevelComplete(false);
  };

  const resetCamera = () => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    controls.object.position.set(...START_POSITION);
    controls.target.set(...START_TARGET);
    controls.update();
  };

  function calcCompass() {
    if (!controlsRef.current) return;

    const cam = controlsRef.current.object;
    const target = controlsRef.current.target;

    if (compassRef.current) {
      const angle = THREE.MathUtils.radToDeg(
        controlsRef.current.getAzimuthalAngle(),
      );
      compassRef.current.style.transform = `rotate(${angle}deg)`;
    }
    target.x = clamp(target.x, minPanX, maxPanX);
    target.z = clamp(target.z, minPanZ, maxPanZ);
    cam.position.x = clamp(cam.position.x, minPanX - 20, maxPanX + 20);
    cam.position.z = clamp(cam.position.z, minPanZ - 20, maxPanZ + 20);

    cam.updateProjectionMatrix();
  }

  const baseBtn =
    "cursor-pointer rounded-md flex items-center justify-center transition-all focus:outline-none z-30";

  const darkBtn = `
  ${baseBtn}
  h-8 w-8
  bg-white text-gray-700 border border-gray-200 hover:bg-gray-50
  dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700
`;

  const primaryBtn = `
  ${baseBtn}
  bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2
`;

  return (
    <div className="relative w-full h-full">
      <Canvas
        className="w-full h-full"
        shadows
        camera={{ position: START_POSITION, fov: 50 }}
        style={{ borderRadius: 8 }}
      >
        <ambientLight intensity={0.2} />
        <hemisphereLight
          color={"#ffffff"}
          groundColor={"#888888"}
          intensity={0.8}
        />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <Grid onLevelLoaded={handleLevelLoaded} />
        <Drone
          key={droneKey}
          groupRef={droneRef}
          positionRef={positionRef}
          onAnimationComplete={handleAnimationComplete}
          crashDirection={crashDirection}
          crashHeight={crashHeight}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan
          panSpeed={1}
          screenSpacePanning={false}
          minDistance={1}
          maxDistance={20}
          zoomSpeed={3}
          target={START_TARGET}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          onChange={calcCompass}
        />
      </Canvas>

      <div className="absolute top-4 right-4 pointer-events-none">
        <Compass ref={compassRef} />
      </div>

      {/* --- BUTTON LAYOUT --- */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
        {/* Row 1: Reset View + Info */}
        <div className="flex gap-2">
          {/* Reset Camera (Dark Blue Square) */}
          <Button size="sm" onClick={resetCamera} className={darkBtn}>
            <ScanEye size={16} />
          </Button>

          {/* Info Button (Bright Blue Rectangle) */}
          {/* <button 
            onClick={() => setShowInfo(!showInfo)} 
            className={`${primaryBtn} ${showInfo ? 'ring-2 ring-white' : ''}`}
            title="Toggle Level Info"
          >
            <ScrollText size={18} />
            <span>Task</span>
          </button> */}
          <Button
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className={`${primaryBtn} ${showInfo ? "ring-2 ring-white" : ""}`}
          >
            <ScrollText size={18} />
            Task
          </Button>
        </div>

        {/* Row 2: Reset Level (Dark Blue Square) */}
        <Button size="sm" onClick={resetLevel} className={darkBtn}>
          <RotateCcw size={16} />
        </Button>
      </div>

      {/* --- INFO CARD OVERLAY --- */}
      <div
        className={`absolute top-0 left-0 h-full w-full md:w-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl border-r border-gray-200 dark:border-gray-800 p-4 pt-28 z-10 transition-all duration-300 ease-in-out transform ${
          showInfo
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white/50 dark:bg-black/20 shadow-sm">
            <TaskCard
              title={`Level ${levelId}`}
              description={levelDescription}
            />
          </div>
        </div>
      </div>

      {/* Win Screen (Optional, just keeping it if you had it) */}
      {isLevelComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-green-500/90 text-white p-6 rounded-xl shadow-2xl backdrop-blur-md animate-in zoom-in">
            <h1 className="text-4xl font-bold mb-2">Level Complete!</h1>
          </div>
        </div>
      )}
    </div>
  );
}
