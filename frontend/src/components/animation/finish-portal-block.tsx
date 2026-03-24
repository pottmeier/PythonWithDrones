"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FinishPortalBlock(props: any) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = 0 + Math.sin(time * 2) * 0.1;
      const scale = 1 + Math.sin(time * 3) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group {...props}>
      <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial 
          color="#ff0000"
          transparent 
          opacity={0.6} 
          emissive="#ff0000"
          emissiveIntensity={0.8}
          roughness={0.1}
        />
      </mesh>

      <pointLight color="#ff0000" intensity={2} distance={3} decay={2} />
    </group>
  );
}