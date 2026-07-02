"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { blockEvents, positionKey } from "@/lib/block-events";

export default function MovableBlock(props: any) {
  const groupRef = useRef<THREE.Group>(null!);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>(props.position);

  useEffect(() => {
    const key = positionKey(currentPos[0], currentPos[1], currentPos[2]);
    return blockEvents.subscribe(key, (data: any) => {
      if (!groupRef.current || !data?.to) return;
      const [tx, ty, tz] = data.to;
      gsap.to(groupRef.current.position, {
        x: tx,
        y: ty,
        z: tz,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => setCurrentPos([tx, ty, tz]),
      });
    });
  }, [currentPos]);

  return (
    <group ref={groupRef} position={props.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial color="#c98a4b" roughness={0.65} metalness={0.1} />
      </mesh>
    </group>
  );
}
