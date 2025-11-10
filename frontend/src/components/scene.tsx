"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { TILE_SIZE, TILE_MARGIN, GRID_SIZE } from "./grid";
import { FoldVertical } from "lucide-react";
import { toast } from "sonner";

export default function Scene() {
  const [worldPosition, setWorldPosition] = useState<[number, number, number]>([
    0, 10, 0,
  ]);

  const moveQueueRef = useRef<string[]>([]);
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);

  // Camera Settings
  const START_POSITION: [number, number, number] = [0, 75, 150];
  const START_TARGET: [number, number, number] = [0, 0, 0];
  const PAN_FACTOR = 2;
  const limit = ((GRID_SIZE - 1) / 2) * (TILE_SIZE + TILE_MARGIN) * PAN_FACTOR;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // Movement steps (world units)
  const STEP = TILE_SIZE + TILE_MARGIN; // horizontal step on X/Z
  const VERTICAL_STEP = TILE_SIZE; // vertical step on Y
  const MIN_Y = 0.5; // prevent going below ground

  // Direction map: use world-space deltas [dx, dy, dz]
  const deltas: Record<string, [number, number, number]> = {
    east: [1, 0, 0],
    west: [-1, 0, 0],
    north: [0, 0, -1],
    south: [0, 0, 1],
    up: [0, 1, 0],
    down: [0, -1, 0],
  };

  const processNextMoveInQueue = useCallback(() => {
    if (moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }
    isAnimatingRef.current = true;

    const nextMove = moveQueueRef.current.shift()!;
    const key = nextMove.toLowerCase();
    const d = deltas[key];

    // If unknown command, skip and proceed to next
    if (!d) {
      toast.error(`Unknown direction: ${nextMove}`);
      isAnimatingRef.current = false;
      // Immediately try next
      processNextMoveInQueue();
      return;
    }

    setWorldPosition((prev) => {
      const [x, y, z] = prev;
      const dx = d[0] * STEP;
      const dy = d[1] * VERTICAL_STEP;
      const dz = d[2] * STEP;
      const newY = Math.max(MIN_Y, y + dy);
      return [x + dx, newY, z + dz] as [number, number, number];
    });
  }, [STEP, VERTICAL_STEP]);

  const handleAnimationComplete = useCallback(() => {
    processNextMoveInQueue();
  }, [processNextMoveInQueue]);

  useEffect(() => {
    // Expose a simple command API
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
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />
        <Grid />
        <Drone
          position={worldPosition}
          onAnimationComplete={handleAnimationComplete}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan
          panSpeed={1}
          target={START_TARGET}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.3}
          onChange={() => {
            const c = controlsRef.current;
            if (!c) return;
            const cam = c.object;
            const target = c.target;
            target.x = clamp(target.x, -limit, limit);
            target.z = clamp(target.z, -limit, limit);
            cam.position.x = clamp(cam.position.x, -limit * 1.5, limit * 1.5);
            cam.position.z = clamp(cam.position.z, -limit * 1.5, limit * 1.5);
            cam.updateProjectionMatrix();
          }}
        />
      </Canvas>

      <button
        className="absolute top-4 left-4 text-md cursor-pointer"
        onClick={() => {
          if (!controlsRef.current) return;
          const cam = controlsRef.current.object;
          const target = controlsRef.current.target;
          cam.position.set(...START_POSITION);
          target.set(...START_TARGET);
          controlsRef.current.update();
        }}
      >
        <FoldVertical size={20} />
      </button>
    </div>
  );
}
