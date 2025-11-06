"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { useGLTF, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define a strict type for our initial instance data
interface InstanceData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  animationOffset: number;
}

interface InstancedGrassProps {
  count?: number;
  windEnabled?: boolean;
}

export default function InstancedGrass({ count = 100, windEnabled = false }: InstancedGrassProps) {
  const { nodes } = useGLTF('/models/grass_blade.glb');
  const ref = useRef<THREE.InstancedMesh>(null!);
  const bladeMesh = nodes.grass_blade as THREE.Mesh;
  const bladeData = useMemo<InstanceData[]>(() => {
    const data: InstanceData[] = [];
    const TILE_SIZE = 13.0;
    for (let i = 0; i < count; i++) {
      data.push({
        position: [(Math.random() - 0.5) * TILE_SIZE, 0, (Math.random() - 0.5) * TILE_SIZE],
        rotation: [(Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4],
        scale: 0.1 + Math.random() * 0.3,
        animationOffset: Math.random() * Math.PI * 2, // For random wind
      });
    }
    return data;
  }, [count]);

  // --- 3. THE ANIMATION LOGIC ---
  useFrame((state) => {

    if (!windEnabled) {
      return;
    }
    
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    // Loop through our initial data to apply animation
    bladeData.forEach((data, i) => {
      // Start with the initial random state
      dummy.position.set(...data.position);
      dummy.rotation.set(...data.rotation);
      dummy.scale.setScalar(data.scale);
      
      // Calculate wind sway
      const swayAngle = Math.sin(time * 2 + data.animationOffset) * 0.4;
      
      // Add the sway to the existing rotation (e.g., on the Z axis for a side-to-side sway)
      dummy.rotation.z += swayAngle;

      // Apply the final transformation matrix to the instance
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });

    // Tell Three.js that the instance data has changed and needs to be re-uploaded to the GPU
    ref.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    // This part is now correct. It uses the typed mesh data for setup
    // and the typed bladeData to create the initial instances.
    <Instances
      ref={ref}
      geometry={bladeMesh.geometry}
      material={bladeMesh.material}
    >
      {bladeData.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  );
}

useGLTF.preload('/models/grass_blade.glb');