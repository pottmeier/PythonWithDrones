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
import { Caramel } from "next/font/google";
import { FoldVertical, RotateCcw } from "lucide-react";

interface LevelLoadData {
  size: { width: number; height: number; depth: number };
  spawn: { x: number; y: number; z: number };
}

export default function Scene() {
  const positionRef = useRef<[number, number, number]>([0, 0, 0]);
  const moveQueueRef = useRef<string[]>([]);
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);
  const [levelSize, setLevelSize] = useState<{ width: number; height: number; depth: number } | null>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const spawnRef = useRef<[number, number, number]>([0, 10, 0]);
  const [droneKey, setDroneKey] = useState(0); 

  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // Camera Settings
  const { width = 1, depth = 1 } = levelSize || {};
  const mapCenterX = width / 2;
  const mapCenterZ = depth / 2;
  const START_POSITION: [number, number, number] = [mapCenterX - 10, 10, mapCenterZ + 10]; 
  const START_TARGET: [number, number, number] = [mapCenterX, 0.5, mapCenterZ];
  const PAN_FACTOR = 2;
  const minPanX = mapCenterX - (width / 2) - PAN_FACTOR;
  const maxPanX = mapCenterX + (width / 2) + PAN_FACTOR;
  const minPanZ = mapCenterZ - (depth / 2) - PAN_FACTOR;
  const maxPanZ = mapCenterZ + (depth / 2) + PAN_FACTOR;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  //crash
  const [crashDirection, setCrashDirection] = useState<[number, number, number] | null>(null);
  const [crashHeight, setCrashHeight] = useState<number>(0.2); 

  const isPositionSafe = (x: number, y: number, z: number, width: number, height: number, depth: number) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;
    if (!getLevelData || !getBlockRegistry) return false;

    const data = getLevelData();
    const registry = getBlockRegistry();

    const gridX = Math.round(x);
    const gridY = Math.round(y);
    const gridZ = Math.round(z);

    console.log(`Checking: World[${x},${z}] -> Grid[${gridX},${gridZ}] Layer ${gridY}`);

    if (gridX < 0 || gridX >= width) return false; // Out of bounds X
    if (gridZ < 0 || gridZ >= depth) return false; // Out of bounds Z
    if (gridY < 0) return false; // Below the world

    if (gridY >= height) return false;

    const layerName = `layer_${gridY}`;
    const layer = data.layers[layerName];
    const blockId = layer[gridZ]?.[gridX];

    if (!blockId || blockId === "empty")
      return true;

    const blockDef = registry[blockId];

    if (blockDef && blockDef.isCollidable)
      return false;

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

  const handleLevelLoaded = useCallback((data: LevelLoadData) => {
    console.log("Level loaded:", data);

    // level size for camera limits
    setLevelSize(data.size);

    const worldX = data.spawn.x;
    const worldY = data.spawn.y;
    const worldZ = data.spawn.z;

    spawnRef.current = [worldX, worldY, worldZ];
    positionRef.current = [worldX, worldY, worldZ];
    positionRef.current = [worldX, worldY, worldZ];
  }, []);

  const getCrashLandingHeight = (x: number, y: number, z: number, width: number, depth: number, maxHeight: number) => {
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

  const checkFinishCondition = (x: number, y: number, z: number, width: number, depth: number, height: number) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;
    if (!getLevelData || !getBlockRegistry) return false;

    const data = getLevelData();
    const registry = getBlockRegistry();

    const gridX = Math.round(x);
    const gridY = Math.round(y);
    const gridZ = Math.round(z);

    // Check boundaries first
    if (gridX < 0 || gridX >= width || gridZ < 0 || gridZ >= depth || gridY < 0 || gridY >= height) return false;

    const layerName = `layer_${gridY}`;
    const layer = data.layers[layerName];

    // LOGGING
    if (layer) {
      const blockId = layer[gridZ]?.[gridX];
      console.log(`Checking Win: [${gridX}, ${gridY}, ${gridZ}] -> Block: ${blockId}`);
      
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
    const safe = isPositionSafe(targetX, targetY, targetZ, width, height, depth);

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

    const won = checkFinishCondition(targetX, targetY, targetZ, width, depth, height);
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
    registerPyodideFunctions(moveQueueRef, isAnimatingRef, processNextMoveInQueue, positionRef)
  }, [processNextMoveInQueue]);

  const resetLevel = () => {
    isAnimatingRef.current = false;
    moveQueueRef.current = [];
    setCrashDirection(null);
    setCrashHeight(0.2);
    positionRef.current = [...spawnRef.current];
    setDroneKey(prev => prev + 1);
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
      const angle = THREE.MathUtils.radToDeg(controlsRef.current.getAzimuthalAngle());
      compassRef.current.style.transform = `rotate(${angle}deg)`;
    }
    target.x = clamp(target.x, minPanX, maxPanX);
    target.z = clamp(target.z, minPanZ, maxPanZ);
    cam.position.x = clamp(cam.position.x, minPanX - 20, maxPanX + 20);
    cam.position.z = clamp(cam.position.z, minPanZ - 20, maxPanZ + 20);

    cam.updateProjectionMatrix();
  }

  const buttonStyle = "bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 p-2 rounded-md shadow-md backdrop-blur-sm transition-all text-gray-800 dark:text-gray-200 cursor-pointer";

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
          onChange={calcCompass} />
      </Canvas>

      <div className="absolute top-4 right-4 pointer-events-none">
        <Compass ref={compassRef} />
      </div>

     <div className="absolute top-4 left-4 flex flex-col gap-2">
        
        {/* Camera Reset Button */}
        <button
          onClick={resetCamera}
          className={buttonStyle}
          title="Reset Camera View"
        >
          <FoldVertical size={20} />
        </button>

        {/* Level Reset Button */}
        <button
          onClick={resetLevel}
          className={buttonStyle}
          title="Reset Level (Drone Position)"
        >
          <RotateCcw size={20} />
        </button>
        
      </div>
    </div>
  );
}
