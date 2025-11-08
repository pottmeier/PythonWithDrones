"use client";

import React, { useMemo, useRef } from 'react';
import { useGLTF, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function InstancedGrass({ count = 100, windEnabled = true }: InstancedGrassProps) {
  const { nodes } = useGLTF(`${basePath}/models/grass_blade.glb`);
  const ref = useRef<THREE.InstancedMesh>(null!);
  
  const bladeMesh = nodes.grass_blade as THREE.Mesh;

  if (!bladeMesh) {
    console.error("Mesh 'grass_blade_mesh' not found in grass_blade.glb.", nodes);
    return null;
  }

  const bladeData = useMemo<InstanceData[]>(() => {
    const data: InstanceData[] = [];
    const TILE_SIZE = 12.0;
    for (let i = 0; i < count; i++) {
      data.push({
        position: [(Math.random() - 0.5) * TILE_SIZE, 0, (Math.random() - 0.5) * TILE_SIZE],
        rotation: [(Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4],
        scale: 0.02 + Math.random() * 0.5,
        animationOffset: Math.random() * Math.PI * 0.5,
      });
    }
    return data;
  }, [count]);

  useFrame((state) => {
    if (!windEnabled || !ref.current) return;
    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    bladeData.forEach((data, i) => {
      dummy.position.set(...data.position);
      dummy.rotation.set(...data.rotation);
      dummy.scale.setScalar(data.scale);
      
      const swayAngle = Math.sin(time * 2 + data.animationOffset) * 0.1;
      dummy.rotation.z += swayAngle;

      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  });

  return (
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

useGLTF.preload(`${basePath}/models/grass_blade.glb`);