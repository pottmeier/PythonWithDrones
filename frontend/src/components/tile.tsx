"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export default function Tile(props: any) {
  const { scene } = useGLTF("https://github.com/pottmeier/PythonWithDrones/blob/main/frontend/public/tile.glb"); //TODO: Change this into variable model call
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

useGLTF.preload("https://github.com/pottmeier/PythonWithDrones/blob/main/frontend/public/tile.glb"); //TODO: Change this into variable model call
