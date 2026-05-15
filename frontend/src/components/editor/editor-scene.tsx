"use client";

import { useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelData, LevelDimensions } from "@/types/level";
import { getLevelDimensions } from "@/types/level";
import type { EditorTool, EditorMode } from "./tool-panel";

interface EditorSceneProps {
  level: LevelData;
  selectedBlockId: string;
  tool: EditorTool;
  mode: EditorMode;
  activeLayer: number;
  pendingResize?: LevelDimensions | null;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
}

export function EditorScene({
  level,
  selectedBlockId,
  tool,
  mode,
  activeLayer,
  pendingResize,
  onPaint,
  onErase,
  onSetSpawn,
}: EditorSceneProps) {
  const dims = useMemo(() => getLevelDimensions(level), [level]);
  const { width, depth } = dims;
  const height = Math.max(dims.height, activeLayer + 1);
  const centerX = width / 2;
  const centerZ = depth / 2;
  const isPlacement = mode === "placement";

  const handleBlockClick = (
    e: ThreeEvent<MouseEvent>,
    x: number,
    y: number,
    z: number,
  ) => {
    if (!isPlacement) return;
    if (e.nativeEvent.button !== 0) return; // left-click only
    e.stopPropagation();
    if (tool === "spawn") {
      onSetSpawn(x, y + 1, z);
      return;
    }
    if (tool === "erase") {
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
    if (!isPlacement) return;
    if (e.nativeEvent.button !== 0) return;
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
            if (!def || def.id === "empty" || def.id === "air") return [];
            const Component = def.component;
            const isActive = layerIndex === activeLayer;
            return (
              <group
                key={`${layerName}-${x}-${z}`}
                position={[x, layerIndex, z]}
                onPointerDown={(e) => handleBlockClick(e, x, layerIndex, z)}
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

      {/* "empty" wall markers on active layer (visible-while-editing only) */}
      {level.layers[`layer_${activeLayer}`]?.flatMap((row, z) =>
        row.flatMap((blockId, x) => {
          if (blockId !== "empty") return [];
          return (
            <mesh
              key={`emptywall-${x}-${z}`}
              position={[x, activeLayer, z]}
              onPointerDown={(e) => handleBlockClick(e, x, activeLayer, z)}
            >
              <boxGeometry args={[0.95, 0.95, 0.95]} />
              <meshBasicMaterial
                color="#71717a"
                transparent
                opacity={0.35}
                wireframe
              />
            </mesh>
          );
        }),
      )}

      {/* Build plane at active Y catches clicks on empty cells */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX - 0.5, activeLayer - 0.5, centerZ - 0.5]}
        onPointerDown={handlePlaneClick}
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

      {pendingResize && (
        <ResizePreview
          current={{ width, height: dims.height, depth }}
          pending={pendingResize}
        />
      )}

      <OrbitControls
        enabled={!isPlacement}
        enablePan
        enableRotate
        enableZoom
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

function ResizePreview({
  current,
  pending,
}: {
  current: LevelDimensions;
  pending: LevelDimensions;
}) {
  const slabs: { center: [number, number, number]; size: [number, number, number] }[] = [];

  // X slab: removed when pending.width < current.width
  if (pending.width < current.width) {
    const dx = current.width - pending.width;
    slabs.push({
      center: [
        (pending.width + current.width) / 2 - 0.5,
        current.height / 2 - 0.5,
        current.depth / 2 - 0.5,
      ],
      size: [dx, current.height, current.depth],
    });
  }
  // Y slab
  if (pending.height < current.height) {
    const dy = current.height - pending.height;
    const w = Math.min(pending.width, current.width);
    const d = Math.min(pending.depth, current.depth);
    slabs.push({
      center: [
        w / 2 - 0.5,
        (pending.height + current.height) / 2 - 0.5,
        d / 2 - 0.5,
      ],
      size: [w, dy, d],
    });
  }
  // Z slab
  if (pending.depth < current.depth) {
    const dz = current.depth - pending.depth;
    const w = Math.min(pending.width, current.width);
    const h = Math.min(pending.height, current.height);
    slabs.push({
      center: [
        w / 2 - 0.5,
        h / 2 - 0.5,
        (pending.depth + current.depth) / 2 - 0.5,
      ],
      size: [w, h, dz],
    });
  }

  // Outline for the new bounds
  const newCx = pending.width / 2 - 0.5;
  const newCy = pending.height / 2 - 0.5;
  const newCz = pending.depth / 2 - 0.5;

  return (
    <group>
      {slabs.map((slab, i) => (
        <mesh key={i} position={slab.center}>
          <boxGeometry args={slab.size} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      ))}
      <lineSegments position={[newCx, newCy, newCz]}>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              pending.width,
              pending.height,
              pending.depth,
            ),
          ]}
        />
        <lineBasicMaterial color="#22c55e" />
      </lineSegments>
    </group>
  );
}
