//drone.tsx
"use client";

import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Rotor from "./rotor";
import gsap from "gsap";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

interface DroneProps {
  positionRef: React.RefObject<[number, number, number]>;
  droneRef: React.RefObject<THREE.Group>
  onAnimationComplete: () => void;
}

export default function Drone({ positionRef,droneRef, onAnimationComplete }: DroneProps) {
  //const groupRef = useRef<any>(null);
  const { scene, nodes } = useGLTF(`${basePath}/models/drone_body.glb`);
  console.log("GLTF Nodes:", nodes);

  const lastTarget = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    scene.traverse((c: any) => (c.castShadow = true));
  }, [scene]);

  useFrame(() => {
    if (!droneRef.current) return;

    const t = positionRef.current;

    if (
      t[0] !== lastTarget.current[0] ||
      t[1] !== lastTarget.current[1] ||
      t[2] !== lastTarget.current[2]
    ) {
      lastTarget.current = [...t];

      gsap.to(droneRef.current.position, {
        x: t[0],
        y: t[1],
        z: t[2],
        duration: 0.4,
        ease: "power2.out",
        onComplete: onAnimationComplete,
      });
    }
  });

  const rotor_mount_1 = nodes.rotor_mount_1 as THREE.Object3D;
  const rotor_mount_2 = nodes.rotor_mount_2 as THREE.Object3D;
  const rotor_mount_3 = nodes.rotor_mount_3 as THREE.Object3D;
  const rotor_mount_4 = nodes.rotor_mount_4 as THREE.Object3D;

  return (
    <group ref={droneRef}>
      <primitive object={scene} />
      <Rotor position={rotor_mount_1.position} />
      <Rotor position={rotor_mount_2.position} />
      <Rotor position={rotor_mount_3.position} />
      <Rotor position={rotor_mount_4.position} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/drone_body.glb`);
