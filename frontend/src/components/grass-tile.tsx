"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import InstancedGrass from "./instanced-grass"; // <-- Import the new component

export default function GrassTile(props: { windEnabled?: boolean; [key: string]: any }) {
  const { scene } = useGLTF("/models/grass_tile.glb");
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
      
      {/* The scattered grass blades rendered on top */}
      {/* You can adjust the 'count' to control grass density */}
      <InstancedGrass count={100} windEnabled={props.windEnabled}/>
    </group>
  );
}

useGLTF.preload("/models/grass_tile.glb");