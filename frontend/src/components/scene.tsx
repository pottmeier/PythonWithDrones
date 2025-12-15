"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { TILE_SIZE, TILE_MARGIN } from "./grid";
import ResetCameraButton from "./resetCamButton";

interface LevelSize {
  width: number;
  height: number;
}

export default function Scene() {
  const gridPosRef = useRef<[number, number, number]>([0, 10, 0]);
  const positionRef = useRef<[number, number, number]>([0, 10, 0]);
  const moveQueueRef = useRef<string[]>([]);
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);
  const [levelSize, setLevelSize] = useState<LevelSize | null>(null);

  // Movement steps (world units)
  const STEP = TILE_SIZE + TILE_MARGIN; // horizontal step on X/Z
  const VERTICAL_STEP = TILE_SIZE; // vertical step on Y

  // Camera Settings
  const START_POSITION: [number, number, number] = [0, 75, 150];
  const START_TARGET: [number, number, number] = [0, 0, 0];
  const PAN_FACTOR = 2;
  const { width = 1, height = 1 } = levelSize || {};
  const limitX = ((width - 1) / 2) * STEP * PAN_FACTOR;
  const limitZ = ((height - 1) / 2) * STEP * PAN_FACTOR;
  const worldLimitX = (width / 2) * STEP;
  const worldLimitZ = (height / 2) * STEP;
  const MIN_Y = 0.5;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // Direction map: use world-space deltas [dx, dy, dz]
  const deltas: Record<string, [number, number, number]> = {
    east: [1, 0, 0],
    west: [-1, 0, 0],
    north: [0, 0, -1],
    south: [0, 0, 1],
    up: [0, 1, 0],
    down: [0, -1, 0],
  };

  const handleLevelLoaded = useCallback((size: LevelSize) => {
    console.log("Level size received from Grid:", size);
    setLevelSize(size);
    console.log("Starting position: ", positionRef.current);
  }, []);

  const processNextMoveInQueue = useCallback(() => {
    if (moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }

    isAnimatingRef.current = true;
    const nextMove = moveQueueRef.current.shift()!;
    const key = nextMove.toLowerCase()
    const moveDelta = deltas[key];

    // If unknown command, skip and proceed to next
    if (!moveDelta) {
      console.error(`Unknown direction: ${nextMove}`);
      isAnimatingRef.current = false;
      // Immediately try next
      processNextMoveInQueue();
      return;
    }

    const [x, y, z] = positionRef.current;
    const dx = moveDelta[0] * STEP;
    const dy = moveDelta[1] * VERTICAL_STEP;
    const dz = moveDelta[2] * STEP;
    const newY = Math.max(MIN_Y, (y + dy));
    const newPos = [x + dx, newY, z + dz] as [number, number, number];

    // World Limit
    if (newPos[0] < -worldLimitX || newPos[0] > worldLimitX) {
      isAnimatingRef.current = false;
      return;
    }
    if (newPos[2] < -worldLimitZ || newPos[2] > worldLimitZ) {
      isAnimatingRef.current = false;
      return;
    }

    positionRef.current = newPos;
    console.log(positionRef.current);
  }, [width, height]);

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
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 200, 100]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
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
          minDistance={20}
          maxDistance={200}
          zoomSpeed={3}
          target={START_TARGET}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          onChange={() => {
            const c = controlsRef.current;
            if (!c) return;
            const cam = c.object;
            const target = c.target;
            target.x = clamp(target.x, -limitX, limitX);
            target.z = clamp(target.z, -limitZ, limitZ);
            cam.position.x = clamp(cam.position.x, -limitX * 1.5, limitX * 1.5);
            cam.position.z = clamp(cam.position.z, -limitZ * 1.5, limitZ * 1.5);
            cam.updateProjectionMatrix();
          }}
        />
      </Canvas>

      <ResetCameraButton
        controlsRef={controlsRef}
        startPosition={START_POSITION}
        startTarget={START_TARGET}
      />
    </div>
  );
}
