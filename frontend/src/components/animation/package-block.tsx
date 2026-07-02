"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { blockEvents, positionKey } from "@/lib/block-events";

interface PackageBlockProps {
  position: [number, number, number];
  [key: string]: unknown;
}

export default function PackageBlock(props: PackageBlockProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const bobRef = useRef<THREE.Group>(null!);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    const [x, y, z] = props.position;
    const key = positionKey(x, y, z);
    return blockEvents.subscribe(key, () => {
      if (!groupRef.current) return;
      gsap
        .timeline({ onComplete: () => setCollected(true) })
        .to(groupRef.current.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.15, ease: "power1.out" })
        .to(groupRef.current.position, { y: "+=0.6", duration: 0.3, ease: "power1.in" }, "<")
        .to(groupRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: "power1.in" }, "<0.1");
    });
  }, [props.position]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (bobRef.current && !collected) {
      bobRef.current.position.y = 0.28 + Math.sin(time * 2) * 0.06;
      bobRef.current.rotation.y = time * 0.8;
    }
  });

  if (collected) return null;

  return (
    <group ref={groupRef} {...props}>
      <group ref={bobRef}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* tape/strap */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.08, 0.42]} />
          <meshStandardMaterial color="#e5d5b8" roughness={0.6} />
        </mesh>
      </group>
      <pointLight color="#f5f5f4" intensity={0.3} distance={1.5} decay={2} />
    </group>
  );
}
