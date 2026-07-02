"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Rotor from "./rotor";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface DroneProps {
  groupRef: React.RefObject<THREE.Group>
  initialPosition: [number, number, number];
  isCarryingPackage?: boolean;
}

export default function Drone({ groupRef, initialPosition, isCarryingPackage }: DroneProps) {
  const { scene, nodes } = useGLTF(`${basePath}/models/drone_body.glb`);

  useEffect(() => {
    scene.traverse((c: any) => (c.castShadow = true));
    if (groupRef.current) {
      groupRef.current.rotation.order = "YXZ";
    }
  }, [scene, groupRef]);

  const rotor_mount_1 = nodes.rotor_mount_1 as THREE.Object3D;
  const rotor_mount_2 = nodes.rotor_mount_2 as THREE.Object3D;
  const rotor_mount_3 = nodes.rotor_mount_3 as THREE.Object3D;
  const rotor_mount_4 = nodes.rotor_mount_4 as THREE.Object3D;

  return (
    <group ref={groupRef} position={initialPosition}>
      <primitive object={scene} />
      <Rotor position={rotor_mount_1.position} />
      <Rotor position={rotor_mount_2.position} />
      <Rotor position={rotor_mount_3.position} />
      <Rotor position={rotor_mount_4.position} />
      {isCarryingPackage && (
        <group position={[0, -0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.37, 0.08, 0.37]} />
            <meshStandardMaterial color="#e5d5b8" roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

useGLTF.preload(`${basePath}/models/drone_body.glb`);
