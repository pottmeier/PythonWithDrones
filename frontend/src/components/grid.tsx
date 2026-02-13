"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
//import { generateLevel } from "@/lib/level-generator";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface LevelData {
  description?: string;
  spawn: { x: number; y: number; z: number};
  layers: { [key: string]: string[][] };
}

interface GridProps {
  onLevelLoaded: (data: { 
    size: { width: number; height: number; depth: number }; 
    spawn: { x: number; y: number; z: number};
    description?: string;
  }) => void;
}

export default function Grid({ onLevelLoaded }: GridProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  useEffect(() => {
    async function loadLevel() {
      try {
        const response = await fetch(`${basePath}/levels/prototype_level.yaml`);
        const yamlText = await response.text();
        const blueprint = yaml.load(yamlText) as LevelData;

        (window as any).getLevelData = () => blueprint; 
        (window as any).getBlockRegistry = () => BLOCK_REGISTRY;

        const baseLayer = blueprint.layers['layer_0'];

        if (baseLayer && blueprint.spawn) {
          const width = baseLayer[0]?.length || 0;              // Columns (X)
          const height = Object.keys(blueprint.layers).length;  // Layers (Y)
          const depth = baseLayer.length;                       // Rows (Z)
          
          setLevelData(blueprint);

          onLevelLoaded({
            size: { width, height, depth },
            spawn: blueprint.spawn,
            description: blueprint.description || "No description available.", // 3. Pass it up
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
          const worldX = col;
          const worldZ = row;

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