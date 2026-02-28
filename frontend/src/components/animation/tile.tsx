"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Tile(props: any) {
  const { scene } = useGLTF(`${basePath}/models/tile.glb`);
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) child.receiveShadow = true;
    });
  }, [clonedScene]);

  return (
    <group {...props}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/tile.glb`);
