"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FinishPortalBlock(props: any) {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Optional: Add a gentle floating animation to make it look like a portal
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Bob up and down slightly
      meshRef.current.position.y = 0 + Math.sin(time * 2) * 0.1;
      // Scale pulse
      const scale = 1 + Math.sin(time * 3) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group {...props}>
      <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
        {/* Radius 0.35 ensures it fits well inside the 1x1 grid without clipping too much */}
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial 
          color="#ff0000" // Red
          transparent 
          opacity={0.6} 
          emissive="#ff0000"
          emissiveIntensity={0.8}
          roughness={0.1}
        />
      </mesh>
      
      {/* Optional: Add a point light to make it glow on surrounding blocks */}
      <pointLight color="#ff0000" intensity={2} distance={3} decay={2} />
    </group>
  );
}