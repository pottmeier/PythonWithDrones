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
  onAnimationComplete: () => void;
  crashDirection: [number, number, number] | null;
}

export default function Drone({ positionRef, onAnimationComplete, crashDirection }: DroneProps) {
  const groupRef = useRef<any>(null);
  const { scene, nodes } = useGLTF(`${basePath}/models/drone_body.glb`);
  console.log("GLTF Nodes:", nodes);

  const lastTarget = useRef<[number, number, number]>([0, 0, 0]);
 
  useEffect(() => {
    scene.traverse((c: any) => (c.castShadow = true));
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

  // 3. CRASH ANIMATION SEQUENCE (The Backflip)
  useEffect(() => {
    // We assume 'crashDirection' is the vector [dx, dy, dz] passed from scene.tsx
    if (crashDirection && groupRef.current) {
      const [dx, dy, dz] = crashDirection;
      
      const tl = gsap.timeline();

      // STEP A: "The Bonk" (Move into the wall)
      tl.to(groupRef.current.position, {
        x: "+=" + (dx * 0.4),
        y: "+=" + (dy * 0.4),
        z: "+=" + (dz * 0.4),
        duration: 0.1,
        ease: "power1.out"
      })
      
      // STEP B: "Backflip & Recoil"
      // 1. Move back to original tile
      .to(groupRef.current.position, {
        x: "-=" + (dx * 0.4),
        y: "-=" + (dy * 0.4),
        z: "-=" + (dz * 0.4),
        duration: 0.4,
        ease: "power2.in"
      })
      // 2. The Backflip (Rotate +180 degrees on local X axis)
      // Note: We use relative rotation ("+=") so it adds to current rotation
      .to(groupRef.current.rotation, {
        x: "+=" + Math.PI, 
        duration: 0.4
      }, "<") // Run at start of recoil
      
      // STEP C: "The Fall" (Upside down landing)
      .to(groupRef.current.position, {
        y: 0.7, // Land on ground
        duration: 0.5,
        ease: "bounce.out"
      });
    }
  }, [crashDirection]);

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
