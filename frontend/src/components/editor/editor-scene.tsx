"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
  showGrid: boolean;
  pendingResize?: LevelDimensions | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef?: React.RefObject<any>;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
}

const HINT_COLORS: Record<string, string> = {
  air: "#7dd3fc",
  empty: "#71717a",
};

export function EditorScene({
  level,
  selectedBlockId,
  tool,
  mode,
  activeLayer,
  showGrid,
  pendingResize,
  controlsRef,
  onPaint,
  onErase,
  onSetSpawn,
}: EditorSceneProps) {
  const dims = useMemo(() => getLevelDimensions(level), [level]);
  const { width, depth } = dims;
  const height = Math.max(dims.height, activeLayer + 1);
  const centerX = (width - 1) / 2;
  const centerZ = (depth - 1) / 2;
  const isPlacement = mode === "placement";

  // Stable target reference — avoids drei's effect re-running on every render
  // and calling controls.update(), which causes the camera to jiggle on each
  // mode toggle.
  const target = useMemo<[number, number, number]>(
    () => [centerX, 0.5, centerZ],
    [centerX, centerZ],
  );
  const initialCameraPos = useMemo<[number, number, number]>(
    () => [centerX - 8, 10, centerZ + 10],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // mount-only initial position
  );

  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);

  useEffect(() => {
    if (!isPlacement) setHover(null);
  }, [isPlacement]);

  return (
    <Canvas
      shadows
      camera={{ position: initialCameraPos, fov: 50 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CameraSetup target={target} />

      <PlaneInteraction
        width={width}
        depth={depth}
        activeLayer={activeLayer}
        isPlacement={isPlacement}
        tool={tool}
        selectedBlockId={selectedBlockId}
        onHoverChange={setHover}
        onPaint={onPaint}
        onErase={onErase}
        onSetSpawn={onSetSpawn}
      />

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
            return (
              <group key={`${layerName}-${x}-${z}`} position={[x, layerIndex, z]}>
                <Component position={[0, 0, 0]} blockDef={def} />
              </group>
            );
          }),
        );
      })}

      {/* "empty" wireframe markers on every layer */}
      {Object.entries(level.layers).flatMap(([layerName, layer]) => {
        const layerIndex = parseInt(layerName.split("_")[1]) || 0;
        return layer.flatMap((row, z) =>
          row.flatMap((blockId, x) => {
            if (blockId !== "empty") return [];
            return (
              <mesh
                key={`emptywall-${layerName}-${x}-${z}`}
                position={[x, layerIndex, z]}
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
        );
      })}

      {showGrid && (
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[centerX, activeLayer - 0.5, centerZ]}
          >
            <planeGeometry args={[width, depth]} />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <GridLines width={width} depth={depth} y={activeLayer - 0.5} />
        </>
      )}

      <SpawnMarker position={[level.spawn.x, level.spawn.y, level.spawn.z]} />

      <BoundsBox width={width} height={height} depth={depth} />

      {hover && isPlacement && (
        <HoverPreview
          x={hover.x}
          y={activeLayer}
          z={hover.z}
          tool={tool}
          blockId={selectedBlockId}
        />
      )}

      {pendingResize && (
        <ResizePreview
          current={{ width, height: dims.height, depth }}
          pending={pendingResize}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableRotate={!isPlacement}
        enablePan={!isPlacement}
        enableZoom={!isPlacement}
        panSpeed={1}
        screenSpacePanning={false}
        minDistance={2}
        maxDistance={30}
        zoomSpeed={3}
        target={target}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}

function CameraSetup({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — don't reorient when target updates via resize
  return null;
}

// Manual raycaster targeting an imaginary plane at y = activeLayer - 0.5.
// This gives a smooth, monotonic mapping from cursor position to grid cell,
// regardless of what 3D geometry is between the camera and the active layer.
function PlaneInteraction({
  width,
  depth,
  activeLayer,
  isPlacement,
  tool,
  selectedBlockId,
  onHoverChange,
  onPaint,
  onErase,
  onSetSpawn,
}: {
  width: number;
  depth: number;
  activeLayer: number;
  isPlacement: boolean;
  tool: EditorTool;
  selectedBlockId: string;
  onHoverChange: (cell: { x: number; z: number } | null) => void;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
}) {
  const { camera, gl, raycaster } = useThree();

  // Keep frequently-changing state in a ref so the DOM listeners stay attached
  // and don't tear down on every render.
  const stateRef = useRef({
    isPlacement,
    tool,
    selectedBlockId,
    onHoverChange,
    onPaint,
    onErase,
    onSetSpawn,
  });
  stateRef.current = {
    isPlacement,
    tool,
    selectedBlockId,
    onHoverChange,
    onPaint,
    onErase,
    onSetSpawn,
  };

  useEffect(() => {
    const canvas = gl.domElement;
    const plane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -(activeLayer - 0.5),
    );
    const intersection = new THREE.Vector3();
    const ndc = new THREE.Vector2();

    const cellFromEvent = (
      e: PointerEvent,
    ): { x: number; z: number } | null => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, intersection)) return null;
      const x = Math.floor(intersection.x + 0.5);
      const z = Math.floor(intersection.z + 0.5);
      if (x < 0 || x >= width || z < 0 || z >= depth) return null;
      return { x, z };
    };

    const handleMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s.isPlacement) {
        s.onHoverChange(null);
        return;
      }
      s.onHoverChange(cellFromEvent(e));
    };

    const handleDown = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s.isPlacement) return;
      if (e.button !== 0) return;
      const cell = cellFromEvent(e);
      if (!cell) return;
      if (s.tool === "paint") {
        s.onPaint(cell.x, activeLayer, cell.z, s.selectedBlockId);
      } else if (s.tool === "erase") {
        s.onErase(cell.x, activeLayer, cell.z);
      } else if (s.tool === "spawn") {
        s.onSetSpawn(cell.x, activeLayer, cell.z);
      }
    };

    const handleLeave = () => stateRef.current.onHoverChange(null);

    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointerleave", handleLeave);
    return () => {
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointerleave", handleLeave);
    };
  }, [activeLayer, width, depth, gl, camera, raycaster]);

  return null;
}

function HoverPreview({
  x,
  y,
  z,
  tool,
  blockId,
}: {
  x: number;
  y: number;
  z: number;
  tool: EditorTool;
  blockId: string;
}) {
  const position: [number, number, number] = [x, y, z];

  if (tool === "spawn") {
    return (
      <group position={position}>
        <mesh position={[0, 0.5, 0]}>
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshBasicMaterial
            color="#22c55e"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  if (tool === "erase") {
    return (
      <mesh position={position}>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    );
  }

  // paint
  const def = BLOCK_REGISTRY[blockId];
  if (blockId === "air" || blockId === "empty" || !def) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshBasicMaterial
          color={HINT_COLORS[blockId] ?? "#9ca3af"}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    );
  }

  const Component = def.component;
  return (
    <group position={position}>
      <Component position={[0, 0, 0]} blockDef={def} />
      <mesh>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function GridLines({
  width,
  depth,
  y,
}: {
  width: number;
  depth: number;
  y: number;
}) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= width; i++) {
      const xPos = i - 0.5;
      pts.push(xPos, y, -0.5);
      pts.push(xPos, y, depth - 0.5);
    }
    for (let i = 0; i <= depth; i++) {
      const zPos = i - 0.5;
      pts.push(-0.5, y, zPos);
      pts.push(width - 0.5, y, zPos);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, [width, depth, y]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#60a5fa" />
    </lineSegments>
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
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const cz = (depth - 1) / 2;
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
  const slabs: {
    center: [number, number, number];
    size: [number, number, number];
  }[] = [];

  if (pending.width < current.width) {
    const dx = current.width - pending.width;
    slabs.push({
      center: [
        (pending.width + current.width) / 2 - 0.5,
        (current.height - 1) / 2,
        (current.depth - 1) / 2,
      ],
      size: [dx, current.height, current.depth],
    });
  }
  if (pending.height < current.height) {
    const dy = current.height - pending.height;
    const w = Math.min(pending.width, current.width);
    const d = Math.min(pending.depth, current.depth);
    slabs.push({
      center: [
        (w - 1) / 2,
        (pending.height + current.height) / 2 - 0.5,
        (d - 1) / 2,
      ],
      size: [w, dy, d],
    });
  }
  if (pending.depth < current.depth) {
    const dz = current.depth - pending.depth;
    const w = Math.min(pending.width, current.width);
    const h = Math.min(pending.height, current.height);
    slabs.push({
      center: [
        (w - 1) / 2,
        (h - 1) / 2,
        (pending.depth + current.depth) / 2 - 0.5,
      ],
      size: [w, h, dz],
    });
  }

  const newCx = (pending.width - 1) / 2;
  const newCy = (pending.height - 1) / 2;
  const newCz = (pending.depth - 1) / 2;

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
