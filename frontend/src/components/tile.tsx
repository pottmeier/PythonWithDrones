"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export default function Tile(props: any) {
  const { scene } = useGLTF("/tile.glb");
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) child.receiveShadow = true;
    });
  }, [clonedScene]);

  return (
    <group {...props}>
      <primitive object={clonedScene} scale={0.25} />
    </group>
  );
}

useGLTF.preload("/tile.glb");
