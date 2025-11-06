"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export default function Tile(props: any) {
  const { scene } = useGLTF("/models/tile.glb");
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

useGLTF.preload("/models/tile.glb");
