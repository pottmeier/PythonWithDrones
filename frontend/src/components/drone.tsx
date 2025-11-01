"use client";

import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const { basePath } = useRouter();

export default function Drone({
  position,
}: {
  position: [number, number, number];
}) {
  const { scene } = useGLTF(`${basePath}/models/drone.glb`); //TODO: Change this into variable model call
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) child.castShadow = true;
    });
  }, [clonedScene]);

  return <primitive object={clonedScene} position={position} scale={0.25} />;
}

useGLTF.preload(`${basePath}/models/drone.glb`); //TODO: Change this into variable model call
