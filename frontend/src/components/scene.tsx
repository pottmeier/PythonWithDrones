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

  // Camera Settings
  const START_POSITION: [number, number, number] = [0, 75, 150];
  const START_TARGET: [number, number, number] = [0, 0, 0];
  const PAN_FACTOR = 2;
  const { width = 1, height = 1 } = levelSize || {};
  const limitX = ((width - 1) / 2) * (TILE_SIZE + TILE_MARGIN) * PAN_FACTOR;
  const limitZ = ((height - 1) / 2) * (TILE_SIZE + TILE_MARGIN) * PAN_FACTOR;
  const worldLimitX = (width / 2) * (TILE_SIZE + TILE_MARGIN);
  const worldLimitZ = (height / 2) * (TILE_SIZE + TILE_MARGIN);
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

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
    const step = TILE_SIZE + TILE_MARGIN;

    const newPos = [...gridPosRef.current] as [number, number, number];

    const futureX =
      (newPos[0] +
        (nextMove === "rechts" ? 1 : nextMove === "links" ? -1 : 0)) *
      step;

    const futureZ =
      (newPos[2] + (nextMove === "runter" ? 1 : nextMove === "hoch" ? -1 : 0)) *
      step;

    if (futureX < -worldLimitX || futureX > worldLimitX) {
      isAnimatingRef.current = false;
      return;
    }
    if (futureZ < -worldLimitZ || futureZ > worldLimitZ) {
      isAnimatingRef.current = false;
      return;
    }

    if (nextMove === "rechts") newPos[0] += 1;
    if (nextMove === "links") newPos[0] -= 1;
    if (nextMove === "hoch") newPos[2] -= 1;
    if (nextMove === "runter") newPos[2] += 1;

    gridPosRef.current = newPos;

    positionRef.current = [newPos[0] * step, 10, newPos[2] * step];
    console.log(positionRef.current);
  }, [width, height]);

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
