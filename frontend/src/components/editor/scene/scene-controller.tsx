"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { LevelData } from "@/types/level";
import type { EditorTool, EditorMode } from "../tool-panel";
import type { HoverCell, SceneAPI } from "./types";
import { buildBlockList } from "./scene-utils";

export function CameraSetup({ target }: { target: [number, number, number] }) {
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
export function SceneController({
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
  spaceHeldRef,
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
  spaceHeldRef?: React.RefObject<boolean>;
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

  // Throttles hold-space-to-paint so repeated pointermove events within
  // the same cell don't spam the undo history.
  const lastActionCellRef = useRef<HoverCell | null>(null);

  // Tracks the single active pointer for touch drag-paint (no Space key
  // on touch devices). Mouse behavior is untouched — it still requires
  // spaceHeldRef for continuous painting.
  const pointerDownRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerIsTouchRef = useRef(false);

  const stateRef = useRef({
    tool,
    selectedBlockId,
    mode,
    width,
    depth,
    blocks,
    level,
    spaceHeldRef,
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
    spaceHeldRef,
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
        // Same active-layer scoping as paint/spawn below -- without this,
        // erase would raycast against blocks on every layer and could
        // delete something on a layer the user isn't even looking at.
        // planeRef's constant is offset by half a unit from the integer
        // layer index (see the "+ 0.5" a few lines down for paint/spawn's
        // own cell.y), so it needs the same correction here.
        const layerY = -planeRef.current.constant + 0.5;
        let best: HoverCell | null = null;
        let bestDistSq = Infinity;
        for (let i = 0; i < s.blocks.length; i++) {
          const b = s.blocks[i];
          if (b.y !== layerY) continue;
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

  const performActionAtCell = useCallback((cell: HoverCell) => {
    const s = stateRef.current;
    if (s.tool === "paint") {
      s.onPaint(cell.x, cell.y, cell.z, s.selectedBlockId);
    } else if (s.tool === "erase") {
      s.onErase(cell.x, cell.y, cell.z);
    } else if (s.tool === "spawn") {
      s.onSetSpawn(cell.x, cell.y, cell.z);
    }
    lastActionCellRef.current = cell;
  }, []);

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

    // Hold-space-to-paint (mouse) or press-and-hold-drag (touch/pen):
    // re-fire the tool action whenever the hover moves to a different
    // cell while the modifier/touch-drag is active.
    if (
      cell &&
      (s.spaceHeldRef?.current ||
        (pointerDownRef.current && activePointerIsTouchRef.current))
    ) {
      const last = lastActionCellRef.current;
      if (
        !last ||
        last.x !== cell.x ||
        last.y !== cell.y ||
        last.z !== cell.z
      ) {
        performActionAtCell(cell);
      }
    }
  }, [computeHover, hoverGroupRef, performActionAtCell]);

  // Block single-finger touch/pen panning (it would otherwise scroll the
  // page mid-paint-stroke) but keep the native two-finger pinch-zoom
  // gesture available for accessibility. OrbitControls sets its own
  // touchAction on this same element and can reset ours after mount, so a
  // MutationObserver keeps re-asserting the value we want.
  useEffect(() => {
    const el = gl.domElement;
    const desired = "pinch-zoom";
    const apply = () => {
      if (el.style.touchAction !== desired) el.style.touchAction = desired;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(el, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [gl]);

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
      if (activePointerIdRef.current !== null) return;
      pointerDownRef.current = true;
      activePointerIdRef.current = e.pointerId;
      activePointerIsTouchRef.current = e.pointerType !== "mouse";
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore - not critical if capture isn't supported
      }
      const cell = computeHover(e.clientX, e.clientY);
      if (!cell) return;
      performActionAtCell(cell);
    };
    const endStroke = (e: PointerEvent) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      pointerDownRef.current = false;
      activePointerIdRef.current = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore - pointer capture may already be released
      }
    };
    const handleLeave = () => {
      lastCursorRef.current = null;
      if (hoverGroupRef.current) hoverGroupRef.current.visible = false;
      stateRef.current.onHoverChange(null);
    };
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);
    canvas.addEventListener("pointerleave", handleLeave);
    return () => {
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointerup", endStroke);
      canvas.removeEventListener("pointercancel", endStroke);
      canvas.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, computeHover, updateHover, performActionAtCell, hoverGroupRef]);

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
      performActionAtHover: () => {
        const s = stateRef.current;
        if (s.mode !== "placement") return;
        const last = lastCursorRef.current;
        if (!last) return;
        const cell = computeHover(last.x, last.y);
        if (!cell) return;
        performActionAtCell(cell);
      },
    };
    sceneApiRef.current = api;
    return () => {
      if (sceneApiRef.current === api) sceneApiRef.current = null;
    };
  }, [sceneApiRef, shiftToLayer, computeHover, performActionAtCell]);

  return null;
}
