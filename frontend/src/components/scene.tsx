"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Drone from "./drone";
import Grid from "./grid";
import Compass from "./compass";
import * as THREE from "three";
import { ScanEye, RotateCcw, ScrollText } from "lucide-react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import {
  cn,
  BTN_BASE,
  BTN_DARK,
  BTN_PRIMARY,
  SPEED_CONTAINER,
  SPEED_BTN_BASE,
  SPEED_BTN_ACTIVE,
  SPEED_BTN_INACTIVE,
} from "@/lib/utils";
import { saveLevelProgress } from "@/lib/app-state";

interface LevelLoadData {
  size: { width: number; height: number; depth: number };
  spawn: { x: number; y: number; z: number };
  description?: string;
}

function SceneComponent({
  levelId,
  onBusyChange,
}: {
  levelId: string;
  onBusyChange: (busy: boolean) => void;
}) {
  // refs
  const droneRef = useRef<THREE.Group>(new THREE.Group());
  const moveQueueRef = useRef<any[]>([]);
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);
  const spawnRef = useRef<[number, number, number]>([0, 0, 0]);
  const compassRef = useRef<HTMLDivElement>(null);

  // ui states and config
  const [levelSize, setLevelSize] = useState<LevelLoadData["size"] | null>(
    null,
  );
  const [levelDescription, setLevelDescription] = useState("");
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>([
    0, 10, 0,
  ]);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [droneKey, setDroneKey] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isCrashed, setIsCrashed] = useState(false);

  // camera settings
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

  // check if the drone is currently animated or if there are commands in the queue
  const updateBusyStatus = useCallback(() => {
    const busy = isAnimatingRef.current || moveQueueRef.current.length > 0;
    onBusyChange(busy);
  }, [onBusyChange]);

  // takee the next command from the queue and play the corresponding animation
  const processNextMoveInQueue = useCallback(() => {
    if (isLevelComplete || moveQueueRef.current.length === 0) {
      isAnimatingRef.current = false;
      updateBusyStatus();
      return;
    }

    isAnimatingRef.current = true;
    updateBusyStatus();
    const command = moveQueueRef.current.shift();
    const duration = 0.4;

    if (command.type === "reset") {
      droneRef.current.position.set(
        command.pos[0],
        command.pos[1],
        command.pos[2],
      );
      droneRef.current.rotation.set(0, 0, 0);
      setIsCrashed(false);
      moveQueueRef.current = [];
      isAnimatingRef.current = false;
      updateBusyStatus();
    }

    // move animation
    if (command.type === "move") {
      const [tx, ty, tz] = command.target;
      gsap.to(droneRef.current.position, {
        x: tx,
        y: ty,
        z: tz,
        duration: duration,
        ease: "power2.out",
        onComplete: () => processNextMoveInQueue(),
      });
    }

    // turn animation
    if (command.type === "turn") {
      const turnAmount = Math.PI / 2;
      gsap.to(droneRef.current.rotation, {
        y: command.direction === "left" ? `+=${turnAmount}` : `-=${turnAmount}`,
        duration: duration,
        ease: "power2.out",
        onComplete: () => processNextMoveInQueue(),
      });
    }

    // Goal update based on command queue
    if (command.type === "goal") {
      setIsLevelComplete(true);
    }

    // crash animation
    if (command.type === "crash") {
      const tl = gsap.timeline();
      const [dx, dy, dz] = command.vector;
      const landingY = command.landingY || 0.2;

      // try to move forward
      tl.to(droneRef.current.position, {
        x: "+=" + dx * 0.4,
        y: "+=" + dy * 0.4,
        z: "+=" + dz * 0.4,
        duration: 0.1,
        ease: "power1.out",
      })
        // move back again
        .to(droneRef.current.position, {
          x: "-=" + dx * 0.4,
          y: "-=" + dy * 0.4,
          z: "-=" + dz * 0.4,
          duration: 0.4,
          ease: "power2.in",
        })
        // backflip
        .to(
          droneRef.current.rotation,
          {
            x: "+=" + Math.PI,
            duration: 0.4,
          },
          "<",
        )
        // falling to the ground
        .to(droneRef.current.position, {
          y: landingY,
          duration: 0.5,
          ease: "bounce.out",
        });

      // prevent any further animations after crash
      isAnimatingRef.current = false;
      moveQueueRef.current = [];
      updateBusyStatus();
    }
  }, [isLevelComplete, updateBusyStatus]);

  // get the level data from the .yaml
  const handleLevelLoaded = useCallback((data: LevelLoadData) => {
    setLevelSize(data.size);
    setLevelDescription(data.description || "");
    const startPos: [number, number, number] = [
      data.spawn.x,
      data.spawn.y,
      data.spawn.z,
    ];
    spawnRef.current = startPos;
    setSpawnPosition(startPos);
  }, []);

  // reset the level status
  const resetLevel = useCallback(() => {
    isAnimatingRef.current = false;
    moveQueueRef.current = [];
    setIsLevelComplete(false);
    setIsCrashed(false);

    const [sx, sy, sz] = spawnRef.current;
    if (droneRef.current) {
      gsap.killTweensOf(droneRef.current.position);
      gsap.killTweensOf(droneRef.current.rotation);
      droneRef.current.position.set(sx, sy, sz);
      droneRef.current.rotation.set(0, 0, 0);
    }

    onBusyChange(false);
  }, [onBusyChange]);

  // trigger the drone reset logic
  const handleResetClick = () => (window as any).triggerDroneReset?.();

  // reset the camera view
  const resetCamera = () => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    controls.object.position.set(...START_POSITION);
    controls.target.set(...START_TARGET);
    controls.update();
  };

  // rotate the compass
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

  // communication with python
  useEffect(() => {
    (window as any).droneAction = (data: any) => {
      moveQueueRef.current.push(data);
      if (!isAnimatingRef.current) processNextMoveInQueue();
    };
    (window as any).signalWin = () => setIsLevelComplete(true);
  }, [processNextMoveInQueue]);

  // communication with ui buttons
  useEffect(() => {
    (window as any).resetScene = resetLevel;
    return () => {
      (window as any).resetScene = undefined;
    };
  }, [resetLevel]);

  // change animation speed in real time
  useEffect(() => {
    gsap.globalTimeline.timeScale(playbackSpeed);
  }, [playbackSpeed]);

  // update status when finished
  useEffect(() => {
    if (!isLevelComplete) return;

    saveLevelProgress(Number(levelId), {
      status: "completed",
    });

    saveLevelProgress(Number(levelId) + 1, {
      status: "unlocked",
    });
  }, [isLevelComplete, levelId]);

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
        <Grid onLevelLoaded={handleLevelLoaded} levelId={levelId} />
        <Drone
          key={droneKey}
          groupRef={droneRef}
          initialPosition={spawnPosition}
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
          <Button
            size="sm"
            onClick={resetCamera}
            className={cn(BTN_BASE, BTN_DARK)}
          >
            <ScanEye size={16} />
          </Button>

          <div className={SPEED_CONTAINER}>
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  SPEED_BTN_BASE,
                  playbackSpeed === speed
                    ? SPEED_BTN_ACTIVE
                    : SPEED_BTN_INACTIVE,
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Info Button (Bright Blue Rectangle) */}
          <Button
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              BTN_BASE,
              BTN_PRIMARY,
              showInfo && "ring-2 ring-white",
            )}
          >
            <ScrollText size={18} />
            Task
          </Button>
        </div>

        {/* Row 2: Reset Level (Dark Blue Square) */}
        <Button
          size="sm"
          onClick={handleResetClick}
          className={cn(BTN_BASE, BTN_DARK)}
        >
          <RotateCcw size={16} />
        </Button>
      </div>

      {/* --- INFO CARD OVERLAY --- */}
      <div
        className={`absolute top-0 left-0 h-full w-full md:w-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl border-r border-gray-200 dark:border-gray-800 px-3 pt-24 z-10 transition-all duration-300 ease-in-out transform ${
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

      {/* Win Screen */}
      {isLevelComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-green-500/90 text-white p-6 rounded-xl shadow-2xl backdrop-blur-md animate-in zoom-in">
            <h1 className="text-4xl font-bold mb-2">Level Complete!</h1>
          </div>
        </div>
      )}
    </div>
  );
}

const Scene = memo(SceneComponent);
export default Scene;
