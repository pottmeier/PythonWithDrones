"use client";

import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

export default function Rotor(props: any) {
  // A ref to gain direct access to the group wrapping the rotor model.
  const rotorRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(`${basePath}/models/rotor.glb`);
  const clonedScene = scene.clone();

  // The useFrame hook runs on every rendered frame.
  useFrame((state, delta) => {
    // We increment the rotation on the Y-axis.
    // 'delta' ensures the animation speed is consistent across different screen refresh rates.
    // Increase the multiplier (e.g., * 20) to make it spin faster.
    if (rotorRef.current) {
      rotorRef.current.rotation.y += delta * 40;
    }
  });

  return (
    // Pass the ref to this group. All props (like position) are applied here.
    <group ref={rotorRef} {...props}>
      <primitive object={clonedScene} scale={0.5} />
    </group>
  );
}

// Preload the model for faster initial rendering.
useGLTF.preload(`${basePath}/models/rotor.glb`);