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
  groupRef: React.RefObject<THREE.Group>
  onAnimationComplete: () => void;
  crashDirection: [number, number, number] | null;
  crashHeight: number;
}

export default function Drone({ positionRef, groupRef, onAnimationComplete, crashDirection, crashHeight }: DroneProps) {
  // const groupRef = useRef<any>(null);
  const { scene, nodes } = useGLTF(`${basePath}/models/drone_body.glb`);

  const lastTarget = useRef<[number, number, number]>([0, 0, 0]);
 
  useEffect(() => {
    scene.traverse((c: any) => (c.castShadow = true));
    if (groupRef.current) {
      groupRef.current.rotation.order = "YXZ";
    }
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current || !positionRef.current || crashDirection) return;

    const t = positionRef.current;

    if (
      t[0] !== lastTarget.current[0] ||
      t[1] !== lastTarget.current[1] ||
      t[2] !== lastTarget.current[2]
    ) {
      lastTarget.current = [...t];

      gsap.to(groupRef.current.position, {
        x: t[0],
        y: t[1],
        z: t[2],
        duration: 0.4,
        ease: "power2.out",
        onComplete: onAnimationComplete,
      });
    }
  });

  // crash animation
  useEffect(() => {
    if (crashDirection && groupRef.current) {
      const [dx, dy, dz] = crashDirection;
      const tl = gsap.timeline();

      // try to move forward
      tl.to(groupRef.current.position, {
        x: "+=" + (dx * 0.4),
        y: "+=" + (dy * 0.4),
        z: "+=" + (dz * 0.4),
        duration: 0.1,
        ease: "power1.out"
      })
      
      // move backwards again
      .to(groupRef.current.position, {
        x: "-=" + (dx * 0.4),
        y: "-=" + (dy * 0.4),
        z: "-=" + (dz * 0.4),
        duration: 0.4,
        ease: "power2.in"
      })

      // backflip
      .to(groupRef.current.rotation, {
        x: "+=" + Math.PI,
        duration: 0.4
      }, "<") 
      
      // fall to the ground
      .to(groupRef.current.position, {
        y: crashHeight, 
        duration: 0.5,
        ease: "bounce.out"
      });
    }
  }, [crashDirection, crashHeight]);

  const rotor_mount_1 = nodes.rotor_mount_1 as THREE.Object3D;
  const rotor_mount_2 = nodes.rotor_mount_2 as THREE.Object3D;
  const rotor_mount_3 = nodes.rotor_mount_3 as THREE.Object3D;
  const rotor_mount_4 = nodes.rotor_mount_4 as THREE.Object3D;

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      <Rotor position={rotor_mount_1.position} />
      <Rotor position={rotor_mount_2.position} />
      <Rotor position={rotor_mount_3.position} />
      <Rotor position={rotor_mount_4.position} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/drone_body.glb`);
