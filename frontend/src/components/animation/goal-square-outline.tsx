"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { blockEvents, positionKey } from "@/lib/block-events";

interface GoalSquareOutlineProps {
  position: [number, number, number];
  unmetColor: string;
  satisfiedColor: string;
}

// Square outline sized a bit larger than a 1x1 ground tile, so the tile's
// own color/texture stays visible through the middle -- only the frame
// changes color to show whether this goal has been satisfied.
const OUTER = 1.12;
const THICKNESS = 0.12;
const INNER = OUTER - THICKNESS * 2;
const BAR_HEIGHT = 0.015;
const EDGE_OFFSET = OUTER / 2 - THICKNESS / 2;

export default function GoalSquareOutline({
  position,
  unmetColor,
  satisfiedColor,
}: GoalSquareOutlineProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const [satisfied, setSatisfied] = useState(false);

  useEffect(() => {
    const [x, y, z] = position;
    const key = positionKey(x, y, z);
    return blockEvents.subscribe(key, () => {
      setSatisfied(true);
      if (groupRef.current) {
        gsap.fromTo(
          groupRef.current.scale,
          { x: 1, y: 1, z: 1 },
          { x: 1.15, y: 1.15, z: 1.15, duration: 0.3, ease: "power2.out", yoyo: true, repeat: 1 },
        );
      }
    });
  }, [position]);

  useFrame((state) => {
    if (satisfied) return;
    const time = state.clock.getElapsedTime();
    const intensity = 0.15 + Math.sin(time * 2) * 0.05;
    materialsRef.current.forEach((mat) => {
      mat.emissiveIntensity = intensity;
    });
  });

  const color = satisfied ? satisfiedColor : unmetColor;
  const registerMaterial = (mat: THREE.MeshStandardMaterial | null, index: number) => {
    if (mat) materialsRef.current[index] = mat;
  };

  return (
    <group position={position}>
      <group ref={groupRef} position={[0, 0.02, 0]}>
        {/* north/south bars */}
        <mesh position={[0, 0, EDGE_OFFSET]} receiveShadow>
          <boxGeometry args={[OUTER, BAR_HEIGHT, THICKNESS]} />
          <meshStandardMaterial
            ref={(mat) => registerMaterial(mat, 0)}
            color={color}
            emissive={color}
            emissiveIntensity={satisfied ? 0.8 : 0.15}
          />
        </mesh>
        <mesh position={[0, 0, -EDGE_OFFSET]} receiveShadow>
          <boxGeometry args={[OUTER, BAR_HEIGHT, THICKNESS]} />
          <meshStandardMaterial
            ref={(mat) => registerMaterial(mat, 1)}
            color={color}
            emissive={color}
            emissiveIntensity={satisfied ? 0.8 : 0.15}
          />
        </mesh>
        {/* east/west bars */}
        <mesh position={[EDGE_OFFSET, 0, 0]} receiveShadow>
          <boxGeometry args={[THICKNESS, BAR_HEIGHT, INNER]} />
          <meshStandardMaterial
            ref={(mat) => registerMaterial(mat, 2)}
            color={color}
            emissive={color}
            emissiveIntensity={satisfied ? 0.8 : 0.15}
          />
        </mesh>
        <mesh position={[-EDGE_OFFSET, 0, 0]} receiveShadow>
          <boxGeometry args={[THICKNESS, BAR_HEIGHT, INNER]} />
          <meshStandardMaterial
            ref={(mat) => registerMaterial(mat, 3)}
            color={color}
            emissive={color}
            emissiveIntensity={satisfied ? 0.8 : 0.15}
          />
        </mesh>
      </group>
    </group>
  );
}
