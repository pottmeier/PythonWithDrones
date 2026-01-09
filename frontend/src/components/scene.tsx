//scene.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid from "./grid";
import ResetCameraButton from "./resetCamButton";
import Compass from "./compass";
import * as THREE from "three";

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

  // Camera Settings
  const START_POSITION: [number, number, number] = [0, -20, 40];
  const START_TARGET: [number, number, number] = [0, 0, 0];
  const PAN_FACTOR = 2;
  const { width = 1, height = 10, depth = 1 } = levelSize || {};
  const limitX = ((width - 1) / 2) * PAN_FACTOR;
  const limitZ = ((depth - 1) / 2) * PAN_FACTOR;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const isPositionSafe = (x: number, y: number, z: number, width: number, height: number, depth: number) => {
    const getLevelData = (window as any).getLevelData;
    const getBlockRegistry = (window as any).getBlockRegistry;
    if (!getLevelData || !getBlockRegistry) return false;

    const data = getLevelData();
    const registry = getBlockRegistry();

    const offsetX = (width - 1) / 2;
    const offsetZ = (depth - 1) / 2;

    const gridX = Math.round(x + offsetX);
    const gridY = Math.round(y);
    const gridZ = Math.round(z + offsetZ);

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

    const offsetX = (data.size.width - 1) / 2;
    const offsetZ = (data.size.depth - 1) / 2;

    const worldX = (data.spawn.x - offsetX);
    const worldY = data.spawn.y;
    const worldZ = (data.spawn.z - offsetZ);

    positionRef.current = [worldX, worldY, worldZ];
  }, []);

  const processNextMoveInQueue = useCallback(() => {
    if (moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }

    isAnimatingRef.current = true;
    const nextMove = moveQueueRef.current.shift()!;
    const key = nextMove.toLowerCase();
    const moveDelta = deltas[key];

    // If unknown command, skip and proceed to next
    if (!moveDelta) {
      console.error(`Unknown direction: ${nextMove}`);
      isAnimatingRef.current = false;
      processNextMoveInQueue();
      return;
    }

    const [x, y, z] = positionRef.current;
    const targetX = x + moveDelta[0];
    const targetY = y + moveDelta[1];
    const targetZ = z + moveDelta[2];

    const safe = isPositionSafe(targetX, targetY, targetZ, width, height, depth);

    if (!safe) {
      console.warn("CRASH! Movement blocked by object or border.");
      isAnimatingRef.current = false;
      // Optionally: Trigger a "crash" animation here
      return;
    }

    positionRef.current = [targetX, targetY, targetZ];
    console.log("Moving to:", positionRef.current);
  }, [width, depth]);

  const handleAnimationComplete = useCallback(() => {
    processNextMoveInQueue();
  }, [processNextMoveInQueue]);

  useEffect(() => {
    (window as any).moveDrone = (direction: string) => {
      moveQueueRef.current.push(direction);
      if (!isAnimatingRef.current) {
        processNextMoveInQueue();
      }
    };
  }, [processNextMoveInQueue]);

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
          positionRef={positionRef}
          onAnimationComplete={handleAnimationComplete}
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
          onChange={() => {
            const c = controlsRef.current;
            if (!c) return;
            if (compassRef.current) {
              const angle = THREE.MathUtils.radToDeg(c.getAzimuthalAngle());
              compassRef.current.style.transform = `rotate(${angle}deg)`;
            }
            const cam = c.object;
            const target = c.target;
            target.x = clamp(target.x, -limitX, limitX);
            target.z = clamp(target.z, -limitZ, limitZ);
            if (cam.position.y < 0.5) cam.position.y = 0.5;
            cam.updateProjectionMatrix();
          }}
        />
      </Canvas>

      <div className="absolute top-4 right-4 pointer-events-none">
        <Compass ref={compassRef} />
      </div>

      <ResetCameraButton
        controlsRef={controlsRef}
        startPosition={START_POSITION}
        startTarget={START_TARGET}
      />
    </div>
  );
}
