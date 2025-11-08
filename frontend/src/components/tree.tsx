"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export default function Tree(props: any) {
  const { scene } = useGLTF("/models/tree_1.glb");
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

useGLTF.preload('/models/tree_1.glb');