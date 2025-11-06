"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { TILE_SIZE, TILE_MARGIN } from "./grid";

// No more props needed for position or callbacks!
export default function Scene() {
  // All state now lives safely inside the component that uses it.
  const [gridPosition, setGridPosition] = useState<[number, number]>([0, 0]);
  const [worldPosition, setWorldPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const moveQueueRef = useRef<string[]>([]);
  const isAnimatingRef = useRef(false);

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
    <Canvas
      className="w-full h-full"
      shadows
      camera={{ position: [0, 15, 15], fov: 7 * 7 }}
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
      <OrbitControls screenSpacePanning={false} panSpeed={1} />
    </Canvas>
  );
};