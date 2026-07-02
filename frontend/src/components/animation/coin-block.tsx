"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { blockEvents, positionKey } from "@/lib/block-events";

export default function CoinBlock(props: any) {
  const groupRef = useRef<THREE.Group>(null!);
  const bobRef = useRef<THREE.Group>(null!);
  const spinRef = useRef<THREE.Group>(null!);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    const [x, y, z] = props.position;
    const key = positionKey(x, y, z);
    return blockEvents.subscribe(key, () => {
      if (!groupRef.current) return;
      gsap
        .timeline({ onComplete: () => setCollected(true) })
        .to(groupRef.current.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.15, ease: "power1.out" })
        .to(groupRef.current.position, { y: "+=0.6", duration: 0.3, ease: "power1.in" }, "<")
        .to(groupRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: "power1.in" }, "<0.1");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.position]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (bobRef.current && !collected) {
      bobRef.current.position.y = 0.25 + Math.sin(time * 2.5) * 0.08;
    }
    if (spinRef.current && !collected) {
      // spin around the (untilted) vertical axis so the standing coin flips in place
      spinRef.current.rotation.y = time * 1.5;
    }
  });

  if (collected) return null;

  return (
    <group ref={groupRef} {...props}>
      <group ref={bobRef}>
        <group ref={spinRef}>
          {/* tilt the disc 90deg so it stands upright instead of lying flat */}
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.06, 24]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffae00"
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        </group>
      </group>
      <pointLight color="#ffd700" intensity={0.6} distance={2} decay={2} />
    </group>
  );
}
