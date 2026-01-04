"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import InstancedGrass from "./instanced-grass";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

export default function GrassTile(props: { windEnabled?: boolean; [key: string]: any }) {
  const { scene } = useGLTF(`${basePath}/models/grass_tile.glb`);
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
      {/* The base tile model */}
      <primitive object={clonedScene} scale={1} />
    
      <InstancedGrass count={100} windEnabled={props.windEnabled}/>
    </group>
  );
}

useGLTF.preload(`${basePath}/models/grass_tile.glb`);