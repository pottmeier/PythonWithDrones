"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { TILE_SIZE, TILE_MARGIN, GRID_SIZE } from "./grid";
import { FoldVertical } from "lucide-react";

export default function Scene() {
  const [gridPosition, setGridPosition] = useState<[number, number]>([0, 0]);
  const [worldPosition, setWorldPosition] = useState<[number, number, number]>([
    0, 0.5, 0,
  ]);
  const moveQueueRef = useRef<string[]>([]);
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);

  // Camera Settings
  const START_POSITION: [number, number, number] = [0, 75, 150];
  const PAN_FACTOR = 2;
  const limit = ((GRID_SIZE - 1) / 2) * (TILE_SIZE + TILE_MARGIN) * PAN_FACTOR;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  useEffect(() => {
    const newX = gridPosition[0] * (TILE_SIZE + TILE_MARGIN);
    const newZ = gridPosition[1] * (TILE_SIZE + TILE_MARGIN);
    setWorldPosition([newX, 10, newZ]);
  }, [gridPosition]);

  const processNextMoveInQueue = useCallback(() => {
    if (moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      return;
    }
    isAnimatingRef.current = true;
    const nextMove = moveQueueRef.current.shift()!;
    setGridPosition((prev) => {
      const newPos = [...prev] as [number, number];
      if (nextMove === "rechts") newPos[0] += 1;
      if (nextMove === "links") newPos[0] -= 1;
      if (nextMove === "hoch") newPos[1] -= 1;
      if (nextMove === "runter") newPos[1] += 1;
      return newPos;
    });
  }, []);

  const handleAnimationComplete = useCallback(() => {
    processNextMoveInQueue();
  }, [processNextMoveInQueue]);

  useEffect(() => {
    window.moveDrone = (direction: string) => {
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
          cam.position.set(...START_POSITION);
          controlsRef.current.update();
        }}
      >
        <FoldVertical size={20} />
      </button>
    </div>
  );
}
