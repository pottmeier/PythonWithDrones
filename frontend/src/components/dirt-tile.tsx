"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import InstancedPebbles from "./instanced-pebbles";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

export default function DirtTile(props: any ) {
  const { scene } = useGLTF(`${basePath}/models/dirt_tile.glb`);
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return (
    <group {...props}>
      <primitive object={clonedScene} scale={1} />
      <InstancedPebbles count={6} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/dirt_tile.glb`);