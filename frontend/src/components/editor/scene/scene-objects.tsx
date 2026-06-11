"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelDimensions } from "@/types/level";
import type { EditorTool } from "../tool-panel";
import { HINT_COLORS } from "./scene-utils";

export function HoverPreviewContent({
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

export function GridLines({ width, depth }: { width: number; depth: number }) {
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

// Orientation 0=N(-Z), 1=E(+X), 2=S(+Z), 3=W(-X). The arrow geometry below
// is built pointing toward -Z, so rotate around Y by (orientation * -π/2).
const ARROW_GEOMETRY = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [0, 0, -0.5, -0.3, 0, 0.3, 0.3, 0, 0.3],
      3,
    ),
  );
  g.computeVertexNormals();
  return g;
})();

export function SpawnMarker({
  position,
  orientation,
}: {
  position: [number, number, number];
  orientation: number;
}) {
  const yaw = -(orientation * Math.PI) / 2;
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
      <mesh
        position={[0, 0.05, 0]}
        rotation={[0, yaw, 0]}
        geometry={ARROW_GEOMETRY}
      >
        <meshBasicMaterial color="#22c55e" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function BoundsBox({
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

export function ResizePreview({
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
