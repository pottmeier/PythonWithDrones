"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

export default function Tree(props: any) {
  const { scene } = useGLTF(`${basePath}/models/tree_1.glb`);
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, [clonedScene]);

  return <primitive object={clonedScene} scale={1} {...props} />;
}

useGLTF.preload(`${basePath}/models/tree_1.glb`);