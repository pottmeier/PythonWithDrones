"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelData, LevelDimensions } from "@/types/level";
import { getLevelDimensions } from "@/types/level";
import type { EditorTool, EditorMode } from "./tool-panel";

export type HoverCell = { x: number; y: number; z: number };

export type SceneAPI = {
  // Step current layer by `dir` units. Clamps internally to [0, layerCount-1]
  // and returns the actual new layer after clamping.
  applyLayerStep: (dir: number) => number;
  // Set current layer to absolute value. `layerCountOverride` lets callers
  // pass the new layer count when the React state level hasn't propagated
  // yet (e.g. immediately after add-layer or resize).
  applyLayerSet: (target: number, layerCountOverride?: number) => number;
};

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
  hoverRef?: React.RefObject<HoverCell | null>;
  sceneApiRef?: React.RefObject<SceneAPI | null>;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
  onLayerChange?: (newLayer: number) => void;
}

const HINT_COLORS: Record<string, string> = {
  air: "#7dd3fc",
  empty: "#71717a",
};

function buildBlockList(
  level: LevelData,
): Array<{ x: number; y: number; z: number }> {
  const out: Array<{ x: number; y: number; z: number }> = [];
  for (const layerName in level.layers) {
    const layerIndex = parseInt(layerName.split("_")[1]) || 0;
    const layer = level.layers[layerName];
    for (let z = 0; z < layer.length; z++) {
      const row = layer[z];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === "air") continue;
        out.push({ x, y: layerIndex, z });
      }
    }
  }
  return out;
}

export function EditorScene({
  level,
  selectedBlockId,
  tool,
  mode,
  activeLayer,
  showGrid,
  pendingResize,
  controlsRef,
  hoverRef,
  sceneApiRef,
  onPaint,
  onErase,
  onSetSpawn,
  onLayerChange,
}: EditorSceneProps) {
  const dims = useMemo(() => getLevelDimensions(level), [level]);
  const { width, depth } = dims;
  const height = Math.max(dims.height, activeLayer + 1);
  const centerX = (width - 1) / 2;
  const centerZ = (depth - 1) / 2;

  // Mount-only initial values. EditorScene is keyed by storedId so it
  // remounts on level navigation and these capture fresh values.
  const initialTarget = useMemo<[number, number, number]>(
    () => [centerX, activeLayer - 0.5, centerZ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initialCameraPos = useMemo<[number, number, number]>(
    () => [centerX - 8, (activeLayer - 0.5) + 9.5, centerZ + 10],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Imperative-only handles. EditorScene NEVER sets position via JSX on
  // these — SceneController shifts them directly. Initial position is set
  // in the ref callback so it lands during React commit, not after a useEffect.
  const layerGroupRef = useRef<THREE.Group>(null);
  const hoverGroupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Plane>(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -(activeLayer - 0.5)),
  );

  const setLayerGroup = useCallback(
    (g: THREE.Group | null) => {
      layerGroupRef.current = g;
      if (g && !(g.userData as { __init?: boolean }).__init) {
        g.position.set(0, activeLayer - 0.5, 0);
        (g.userData as { __init?: boolean }).__init = true;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setHoverGroup = useCallback((g: THREE.Group | null) => {
    hoverGroupRef.current = g;
    if (g && !(g.userData as { __init?: boolean }).__init) {
      g.visible = false;
      (g.userData as { __init?: boolean }).__init = true;
    }
  }, []);

  const handleHoverChange = useCallback(
    (cell: HoverCell | null) => {
      if (hoverRef) hoverRef.current = cell;
    },
    [hoverRef],
  );

  return (
    <Canvas
      shadows
      camera={{ position: initialCameraPos, fov: 50 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CameraSetup target={initialTarget} />

      <SceneController
        initialActiveLayer={activeLayer}
        sceneApiRef={sceneApiRef}
        controlsRef={controlsRef}
        layerGroupRef={layerGroupRef}
        hoverGroupRef={hoverGroupRef}
        planeRef={planeRef}
        tool={tool}
        selectedBlockId={selectedBlockId}
        mode={mode}
        level={level}
        width={width}
        depth={depth}
        onPaint={onPaint}
        onErase={onErase}
        onSetSpawn={onSetSpawn}
        onHoverChange={handleHoverChange}
        onLayerChange={onLayerChange}
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
              <group
                key={`${layerName}-${x}-${z}`}
                position={[x, layerIndex, z]}
              >
                <Component position={[0, 0, 0]} blockDef={def} />
              </group>
            );
          }),
        );
      })}

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

      {/* Layer group: position is owned by SceneController. The group is
          always rendered so SceneController can shift it; the visible grid
          inside is conditional on showGrid. */}
      <group ref={setLayerGroup}>
        {showGrid && (
          <>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, 0, centerZ]}
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
            <GridLines width={width} depth={depth} />
          </>
        )}
      </group>

      {/* Hover group: position/visibility owned by SceneController. */}
      <group ref={setHoverGroup}>
        <HoverPreviewContent tool={tool} blockId={selectedBlockId} />
      </group>

      <SpawnMarker position={[level.spawn.x, level.spawn.y, level.spawn.z]} />

      <BoundsBox width={width} height={height} depth={depth} />

      {pendingResize && (
        <ResizePreview
          current={{ width, height: dims.height, depth }}
          pending={pendingResize}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableRotate={mode === "camera"}
        enablePan={mode === "camera"}
        enableZoom={false}
        enableDamping={false}
        panSpeed={1}
        screenSpacePanning={false}
        minDistance={2}
        maxDistance={30}
        target={initialTarget}
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
  }, []);
  return null;
}

// Owns DOM pointer listeners, the raycast plane, last-cursor state, and
// the imperative API for layer shifts. Lives inside <Canvas> so it can
// use useThree.
function SceneController({
  initialActiveLayer,
  sceneApiRef,
  controlsRef,
  layerGroupRef,
  hoverGroupRef,
  planeRef,
  tool,
  selectedBlockId,
  mode,
  level,
  width,
  depth,
  onPaint,
  onErase,
  onSetSpawn,
  onHoverChange,
  onLayerChange,
}: {
  initialActiveLayer: number;
  sceneApiRef?: React.RefObject<SceneAPI | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef?: React.RefObject<any>;
  layerGroupRef: React.RefObject<THREE.Group | null>;
  hoverGroupRef: React.RefObject<THREE.Group | null>;
  planeRef: React.RefObject<THREE.Plane>;
  tool: EditorTool;
  selectedBlockId: string;
  mode: EditorMode;
  level: LevelData;
  width: number;
  depth: number;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
  onHoverChange: (cell: HoverCell | null) => void;
  onLayerChange?: (newLayer: number) => void;
}) {
  const { camera, gl, raycaster } = useThree();

  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);
  const blocks = useMemo(() => buildBlockList(level), [level]);

  // Source of truth for which layer the scene is on. Editor page must
  // route ALL layer changes through applyLayerStep/applyLayerSet so
  // camera + group + plane + state can't drift apart.
  const currentLayerRef = useRef(initialActiveLayer);

  const stateRef = useRef({
    tool,
    selectedBlockId,
    mode,
    width,
    depth,
    blocks,
    level,
    onPaint,
    onErase,
    onSetSpawn,
    onHoverChange,
    onLayerChange,
  });
  stateRef.current = {
    tool,
    selectedBlockId,
    mode,
    width,
    depth,
    blocks,
    level,
    onPaint,
    onErase,
    onSetSpawn,
    onHoverChange,
    onLayerChange,
  };

  // Reused temp objects — avoid per-frame allocation.
  const tmps = useMemo(
    () => ({
      box: new THREE.Box3(),
      min: new THREE.Vector3(),
      max: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      intersection: new THREE.Vector3(),
      ndc: new THREE.Vector2(),
    }),
    [],
  );

  const computeHover = useCallback(
    (cx: number, cy: number): HoverCell | null => {
      const s = stateRef.current;
      const rect = gl.domElement.getBoundingClientRect();
      tmps.ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
      tmps.ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(tmps.ndc, camera);

      if (s.tool === "erase") {
        let best: HoverCell | null = null;
        let bestDistSq = Infinity;
        for (let i = 0; i < s.blocks.length; i++) {
          const b = s.blocks[i];
          tmps.min.set(b.x - 0.5, b.y - 0.5, b.z - 0.5);
          tmps.max.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
          tmps.box.set(tmps.min, tmps.max);
          if (!raycaster.ray.intersectBox(tmps.box, tmps.hit)) continue;
          const dx = tmps.hit.x - camera.position.x;
          const dy = tmps.hit.y - camera.position.y;
          const dz = tmps.hit.z - camera.position.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < bestDistSq) {
            bestDistSq = distSq;
            best = { x: b.x, y: b.y, z: b.z };
          }
        }
        return best;
      }

      if (!raycaster.ray.intersectPlane(planeRef.current, tmps.intersection)) {
        return null;
      }
      const ix = Math.floor(tmps.intersection.x + 0.5);
      const iz = Math.floor(tmps.intersection.z + 0.5);
      if (ix < 0 || ix >= s.width || iz < 0 || iz >= s.depth) return null;
      const layerY = -planeRef.current.constant;
      return { x: ix, y: layerY + 0.5, z: iz };
    },
    [gl, camera, raycaster, planeRef, tmps],
  );

  const updateHover = useCallback(() => {
    const last = lastCursorRef.current;
    const s = stateRef.current;
    if (!last || s.mode !== "placement") {
      if (hoverGroupRef.current) hoverGroupRef.current.visible = false;
      s.onHoverChange(null);
      return;
    }
    const cell = computeHover(last.x, last.y);
    if (cell && hoverGroupRef.current) {
      hoverGroupRef.current.position.set(cell.x, cell.y, cell.z);
      hoverGroupRef.current.visible = true;
    } else if (hoverGroupRef.current) {
      hoverGroupRef.current.visible = false;
    }
    s.onHoverChange(cell);
  }, [computeHover, hoverGroupRef]);

  // DOM pointer listeners — attached once.
  useEffect(() => {
    const canvas = gl.domElement;
    const handleMove = (e: PointerEvent) => {
      lastCursorRef.current = { x: e.clientX, y: e.clientY };
      updateHover();
    };
    const handleDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const s = stateRef.current;
      if (s.mode !== "placement") return;
      const cell = computeHover(e.clientX, e.clientY);
      if (!cell) return;
      if (s.tool === "paint") {
        s.onPaint(cell.x, cell.y, cell.z, s.selectedBlockId);
      } else if (s.tool === "erase") {
        s.onErase(cell.x, cell.y, cell.z);
      } else if (s.tool === "spawn") {
        s.onSetSpawn(cell.x, cell.y, cell.z);
      }
    };
    const handleLeave = () => {
      lastCursorRef.current = null;
      if (hoverGroupRef.current) hoverGroupRef.current.visible = false;
      stateRef.current.onHoverChange(null);
    };
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointerleave", handleLeave);
    return () => {
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, computeHover, updateHover, hoverGroupRef]);

  // Re-raycast on tool/mode change so the preview reflects the new state
  // without requiring a cursor move.
  useEffect(() => {
    updateHover();
  }, [tool, mode, updateHover]);

  // Single internal mutator. All public APIs route through this so bounds
  // checking lives in exactly one place and the visual state can never
  // disagree with currentLayerRef.
  const shiftToLayer = useCallback(
    (target: number, layerCountOverride?: number): number => {
      const s = stateRef.current;
      const layerCount =
        layerCountOverride ?? Object.keys(s.level.layers).length;
      const maxLayer = Math.max(layerCount - 1, 0);
      const clamped = Math.min(Math.max(target, 0), maxLayer);
      const current = currentLayerRef.current;
      if (clamped === current) return current;
      const delta = clamped - current;
      currentLayerRef.current = clamped;

      if (controlsRef?.current) {
        controlsRef.current.target.y += delta;
        controlsRef.current.object.position.y += delta;
        controlsRef.current.update();
      }
      if (layerGroupRef.current) {
        layerGroupRef.current.position.y += delta;
      }
      // Plane: ax+by+cz+d=0 with normal (0,1,0) → y = -d. Shifting up by
      // delta means y_new = y_old + delta → d_new = d_old - delta.
      planeRef.current.constant -= delta;
      updateHover();
      s.onLayerChange?.(clamped);
      return clamped;
    },
    [controlsRef, layerGroupRef, planeRef, updateHover],
  );

  // Expose imperative scene API.
  useEffect(() => {
    if (!sceneApiRef) return;
    const api: SceneAPI = {
      applyLayerStep: (dir: number) =>
        shiftToLayer(currentLayerRef.current + dir),
      applyLayerSet: (target: number, layerCountOverride?: number) =>
        shiftToLayer(target, layerCountOverride),
    };
    sceneApiRef.current = api;
    return () => {
      if (sceneApiRef.current === api) sceneApiRef.current = null;
    };
  }, [sceneApiRef, shiftToLayer]);

  return null;
}

function HoverPreviewContent({
  tool,
  blockId,
}: {
  tool: EditorTool;
  blockId: string;
}) {
  if (tool === "spawn") {
    return (
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    );
  }
  if (tool === "erase") {
    return (
      <mesh>
        <boxGeometry args={[1.05, 1.05, 1.05]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    );
  }
  const def = BLOCK_REGISTRY[blockId];
  if (blockId === "air" || blockId === "empty" || !def) {
    return (
      <mesh>
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
    <>
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
    </>
  );
}

function GridLines({ width, depth }: { width: number; depth: number }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= width; i++) {
      const xPos = i - 0.5;
      pts.push(xPos, 0, -0.5);
      pts.push(xPos, 0, depth - 0.5);
    }
    for (let i = 0; i <= depth; i++) {
      const zPos = i - 0.5;
      pts.push(-0.5, 0, zPos);
      pts.push(width - 0.5, 0, zPos);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, [width, depth]);

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
