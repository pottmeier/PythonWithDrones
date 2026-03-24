"use client";

import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

export default function Rotor(props: any) {
  const rotorRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(`${basePath}/models/rotor.glb`);
  const clonedScene = scene.clone();

  useFrame((state, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.y += delta * 10;
    }
  });

  return (
    <group ref={rotorRef} {...props}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/rotor.glb`);