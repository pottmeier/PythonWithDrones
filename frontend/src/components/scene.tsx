"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid, { TILE_SIZE, TILE_MARGIN } from "./grid";

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

  return (
      <Canvas
        className="w-full h-full"
        shadows
        camera={{ position: [0, 20, 0], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <Grid />
        <Drone position={worldPosition} />
      </Canvas>
  );
}
