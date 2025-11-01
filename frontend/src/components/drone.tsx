"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export default function Drone({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("https://github.com/pottmeier/PythonWithDrones/blob/main/frontend/public/drone.glb");
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) child.castShadow = true;
    });
  }, [clonedScene]);

  return <primitive object={clonedScene} position={position} scale={0.25} />;
}

useGLTF.preload("https://github.com/pottmeier/PythonWithDrones/blob/main/frontend/public/drone.glb");
