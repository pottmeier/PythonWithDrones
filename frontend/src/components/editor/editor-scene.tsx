"use client";

import { useCallback, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelData, LevelDimensions } from "@/types/level";
import { getLevelDimensions } from "@/types/level";
import type { EditorTool, EditorMode } from "./tool-panel";
import type { HoverCell, SceneAPI } from "./scene/types";
import { CameraSetup, SceneController } from "./scene/scene-controller";
import {
  BoundsBox,
  GridLines,
  HoverPreviewContent,
  ResizePreview,
  SpawnMarker,
} from "./scene/scene-objects";

export type { HoverCell, SceneAPI } from "./scene/types";

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
  // When .current is true, moving the hover to a new cell (mouse move or
  // scroll-wheel layer change) re-fires the current tool action.
  spaceHeldRef?: React.RefObject<boolean>;
  onPaint: (x: number, y: number, z: number, blockId: string) => void;
  onErase: (x: number, y: number, z: number) => void;
  onSetSpawn: (x: number, y: number, z: number) => void;
  onLayerChange?: (newLayer: number) => void;
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
  spaceHeldRef,
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
        spaceHeldRef={spaceHeldRef}
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

      <SpawnMarker
        position={[level.spawn.x, level.spawn.y, level.spawn.z]}
        orientation={level.orientation ?? 0}
      />

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
