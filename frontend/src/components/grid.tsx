//grid.tsx
"use client";

import React, { useState, useEffect } from "react";
import yaml from "js-yaml";
import { BLOCK_REGISTRY } from "@/lib/block-registry";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface LevelData {
  spawn: { x: number; y: number; z: number};
  layers: { [key: string]: string[][] };
}

interface GridProps {
  onLevelLoaded: (data: { 
    size: { width: number; height: number; depth: number }; 
    spawn: { x: number; y: number; z: number};
  }) => void;
}

export default function Grid({ onLevelLoaded }: GridProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  useEffect(() => {
    async function loadLevel() {
      try {
        const response = await fetch(`${basePath}/levels/prototype_level.yaml`);
        const yamlText = await response.text();
        const data = yaml.load(yamlText) as LevelData;
        const baseLayer = data.layers['layer_0'];

        (window as any).getLevelData = () => data;
        (window as any).getBlockRegistry = () => BLOCK_REGISTRY;

        if (baseLayer && data.spawn) {
          const width = baseLayer[0]?.length || 0;          // Columns (X)
          const height = Object.keys(data.layers).length;   // Layers (Y)
          const depth = baseLayer.length;                   // Rows (Z)
          
          setLevelData(data);

          onLevelLoaded({
            size: { width, height, depth },
            spawn: data.spawn
          });
        } else {
          console.error("Invalid level data: Missing layer_0 or spawn point");
        }

      } catch (error) {
        console.error("Error loading level:", error);
      }
    }
    loadLevel();
  }, [onLevelLoaded]);

  if (!levelData) {
    return null;
  }


  const allBlocks = [];
  const baseLayer = levelData.layers['layer_0'];
  const mapX = baseLayer[0].length;
  const mapZ = baseLayer.length;       
  const offsetX = (mapX - 1) / 2;
  const offsetZ = (mapZ - 1) / 2;

  for (const layerName in levelData.layers) {
    const layerMatrix = levelData.layers[layerName];
    const layerIndex = parseInt(layerName.split('_')[1]) || 0;
    const worldY = layerIndex;

    for (let row = 0; row < layerMatrix.length; row++) {
      for (let col = 0; col < layerMatrix[row].length; col++) {
        const blockId = layerMatrix[row][col];
        const blockDef = BLOCK_REGISTRY[blockId];

        if (blockDef && blockDef.id !== 'empty') {
          const Component = blockDef.component;
          const worldX = (col - offsetX);
          const worldZ = (row - offsetZ);

          allBlocks.push(
            <Component
              key={`${layerName}-${col}-${row}`}
              position={[worldX, worldY, worldZ]}
              blockDef={blockDef} 
            />
          );
        }
      }
    }
  }

  return <group>{allBlocks}</group>;
}