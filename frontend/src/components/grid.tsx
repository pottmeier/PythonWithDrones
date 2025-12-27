"use client";

import React, { useState, useEffect } from "react";
import yaml from "js-yaml";

import GrassTile from "./grass-tile";
import DirtTile from "./dirt-tile";
import Tree from "./tree";

const TILE_COMPONENTS: { [key: string]: React.ComponentType<any> } = {
  grass: GrassTile,
  dirt: DirtTile,
  tree: Tree,
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface LevelData {
  spawn: { x: number; y: number };
  layers: { [key: string]: string[][] };
}

interface GridProps {
  onLevelLoaded: (data: { 
    size: { width: number; height: number }; 
    spawn: { x: number; y: number };
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

        if (baseLayer && data.spawn) {
          const height = baseLayer.length;    
          const width = baseLayer[0]?.length || 0; 

          setLevelData(data);

          onLevelLoaded({
            size: { width, height },
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

  const baseLayer = levelData.layers['layer_0'];
  const height = baseLayer.length;
  const width = baseLayer[0].length;
  const offsetX = (width - 1) / 2;
  const offsetZ = (height - 1) / 2;

  const allElements = [];

  for (const layerName in levelData.layers) {
    const layer = levelData.layers[layerName];
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const tileName = layer[z]?.[x];
        const Component = TILE_COMPONENTS[tileName];

        if (Component) {
          const worldX = (x - offsetX);
          const worldZ = (z - offsetZ);
          const worldY = layerName === 'layer_0' ? 0 : 0;  // Object Hover distance to Tile

          allElements.push(
            <Component
              key={`${layerName}-${x}-${z}`}
              position={[worldX, worldY, worldZ]}
            />
          );
        }
      }
    }
  }

  return <>{allElements}</>;
}