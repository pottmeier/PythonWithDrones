"use client";

import { useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelData } from "@/types/level";
import { getLevelDimensions } from "@/types/level";
import type { EditorTool } from "./tool-panel";

interface EditorSceneProps {
  level: LevelData;
  selectedBlockId: string;
  tool: EditorTool;
  activeLayer: number;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
}

export function EditorScene({
  level,
  selectedBlockId,
  tool,
  activeLayer,
  onPaint,
  onErase,
  onSetSpawn,
}: EditorSceneProps) {
  const dims = useMemo(() => getLevelDimensions(level), [level]);
  const { width, depth } = dims;
  const height = Math.max(dims.height, activeLayer + 1);
  const centerX = width / 2;
  const centerZ = depth / 2;

  const handleBlockClick = (
    e: ThreeEvent<MouseEvent>,
    x: number,
    y: number,
    z: number,
  ) => {
    e.stopPropagation();
    if (tool === "spawn") {
      onSetSpawn(x, y + 1, z);
      return;
    }
    if (tool === "erase" || e.shiftKey) {
      onErase(x, y, z);
      return;
    }
    if (tool === "paint") {
      const normal = e.face?.normal;
      if (!normal) {
        onPaint(x, y + 1, z, selectedBlockId);
        return;
      }
      const nx = Math.round(normal.x);
      const ny = Math.round(normal.y);
      const nz = Math.round(normal.z);
      onPaint(x + nx, y + ny, z + nz, selectedBlockId);
    }
  };

  const handlePlaneClick = (e: ThreeEvent<MouseEvent>) => {
    if (tool === "erase") return;
    e.stopPropagation();
    const point = e.point;
    const x = Math.floor(point.x + 0.5);
    const z = Math.floor(point.z + 0.5);
    if (x < 0 || x >= width || z < 0 || z >= depth) return;
    if (tool === "spawn") {
      onSetSpawn(x, activeLayer, z);
    } else if (tool === "paint") {
      onPaint(x, activeLayer, z, selectedBlockId);
    }
  };

  return (
    <Canvas
      shadows
      camera={{ position: [centerX - 8, 10, centerZ + 10], fov: 50 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      {Object.entries(level.layers).flatMap(([layerName, layer]) => {
        const layerIndex = parseInt(layerName.split("_")[1]) || 0;
        return layer.flatMap((row, z) =>
          row.flatMap((blockId, x) => {
            const def = BLOCK_REGISTRY[blockId];
            if (!def || def.id === "empty") return [];
            const Component = def.component;
            const isActive = layerIndex === activeLayer;
            return (
              <group
                key={`${layerName}-${x}-${z}`}
                position={[x, layerIndex, z]}
                onClick={(e) => handleBlockClick(e, x, layerIndex, z)}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  onErase(x, layerIndex, z);
                }}
              >
                <Component position={[0, 0, 0]} blockDef={def} />
                {!isActive && (
                  <mesh>
                    <boxGeometry args={[1.001, 1.001, 1.001]} />
                    <meshBasicMaterial
                      color="black"
                      transparent
                      opacity={0.25}
                      depthWrite={false}
                    />
                  </mesh>
                )}
              </group>
            );
          }),
        );
      })}

      {/* Build plane at active Y catches clicks on empty cells */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX - 0.5, activeLayer - 0.5, centerZ - 0.5]}
        onClick={handlePlaneClick}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      <gridHelper
        args={[
          Math.max(width, depth),
          Math.max(width, depth),
          "#60a5fa",
          "#60a5fa",
        ]}
        position={[centerX - 0.5, activeLayer - 0.5, centerZ - 0.5]}
      />

      <SpawnMarker position={[level.spawn.x, level.spawn.y, level.spawn.z]} />

      <BoundsBox width={width} height={height} depth={depth} />

      <OrbitControls
        enablePan
        panSpeed={1}
        screenSpacePanning={false}
        minDistance={2}
        maxDistance={30}
        zoomSpeed={3}
        target={[centerX, 0.5, centerZ]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}

function SpawnMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function BoundsBox({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  const cx = width / 2 - 0.5;
  const cy = height / 2 - 0.5;
  const cz = depth / 2 - 0.5;
  return (
    <lineSegments position={[cx, cy, cz]}>
      <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
      <lineBasicMaterial color="#94a3b8" />
    </lineSegments>
  );
}
