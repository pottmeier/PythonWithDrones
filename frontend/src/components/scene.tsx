"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { GRID_SIZE, TILE_SIZE, TILE_MARGIN } from "./grid";

export default function Scene() {
  const [gridPosition, setGridPosition] = useState<[number, number]>([0, 0]);
  const [worldPosition, setWorldPosition] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  useEffect(() => {
    const newX = gridPosition[0] * (TILE_SIZE + TILE_MARGIN);
    const newZ = gridPosition[1] * (TILE_SIZE + TILE_MARGIN);
    setWorldPosition([newX, 0, newZ]);
  }, [gridPosition]);

  useEffect(() => {
    const moveQueue: string[] = [];
    let isMoving = false;

    async function processQueue() {
      if (isMoving || moveQueue.length === 0) return;
      isMoving = true;

      const direction = moveQueue.shift();
      setGridPosition((prev) => {
        const newPos = [...prev] as [number, number];
        if (direction === "rechts") newPos[0] += 1;
        if (direction === "links") newPos[0] -= 1;
        if (direction === "hoch") newPos[1] -= 1;
        if (direction === "runter") newPos[1] += 1;
        return newPos;
      });

      await new Promise((r) => setTimeout(r, 500)); // Animationspause
      isMoving = false;
      processQueue();
    }

    window.moveDrone = (direction: string) => {
      moveQueue.push(direction);
      processQueue();
    };
  }, []);

  return (
    <Canvas
      className="w-full h-full"
      shadows
      camera={{ position: [0, 20, 0], fov: GRID_SIZE * 7 }}
      style={{ borderRadius: 8 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
      <Grid />
      <Drone position={worldPosition} />
      <OrbitControls
        enableRotate={true}
        enablePan={false}
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.3}
      />
    </Canvas>
  );
}
