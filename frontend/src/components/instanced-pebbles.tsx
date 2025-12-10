"use client";

import React, { useMemo } from 'react';
import { useGLTF, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

interface InstanceData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

interface InstancedPebblesProps {
  count?: number;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function InstancedPebbles({ count = 25 }: InstancedPebblesProps) {
  const { nodes } = useGLTF(`${basePath}/models/pebble_1.glb`);

  const pebbleMesh = nodes.pebble_1 as THREE.Mesh;

  const pebbleData = useMemo<InstanceData[]>(() => {
    const data: InstanceData[] = [];
    const TILE_SIZE = 10.0;
    for (let i = 0; i < count; i++) {
      data.push({
        position: [(Math.random() - 0.5) * TILE_SIZE, 0.1, (Math.random() - 0.5) * TILE_SIZE],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        scale: 1 + Math.random() * 0.1,
      });
    }
    return data;
  }, [count]);

  return (
    <Instances
      geometry={pebbleMesh.geometry}
      material={pebbleMesh.material}
    >
      {pebbleData.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  );
}

useGLTF.preload(`${basePath}/models/pebble_1.glb`);