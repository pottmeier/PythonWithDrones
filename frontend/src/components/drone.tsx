"use client";

import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import Rotor from "./rotor";
import gsap from "gsap";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; 

interface DroneProps {
  positionRef: React.RefObject<[number, number, number]>;
  onAnimationComplete: () => void;
}

export default function Drone({
  positionRef,
  onAnimationComplete,
}: DroneProps) {
  const groupRef = useRef<any>(null);
  const { scene } = useGLTF(`${basePath}/models/drone_body.glb`);

  const lastTarget = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    scene.traverse((c: any) => (c.castShadow = true));
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current) return;

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

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.5} />
      <Rotor position={[4, 3.5, 4]} />
      <Rotor position={[-4, 3.5, 4]} />
      <Rotor position={[4, 3.5, -4]} />
      <Rotor position={[-4, 3.5, -4]} />
    </group>
  );
}

useGLTF.preload(`${basePath}/models/drone_body.glb`);
