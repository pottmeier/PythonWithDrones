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
  grid_size: { width: number; height: number };
  layers: { [key: string]: string[][] };
}

export const TILE_SIZE = 16;
export const TILE_MARGIN = 0.1;

interface GridProps {
  onLevelLoaded: (size: { width: number; height: number }) => void;
}

export default function Grid({ onLevelLoaded }: GridProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);

  useEffect(() => {
    async function loadLevel() {
      try {
        const response = await fetch(`${basePath}/levels/prototype_level.yaml`);
        const yamlText = await response.text();
        const data = yaml.load(yamlText) as LevelData;

        if (data && data.grid_size) {
          setLevelData(data);
          onLevelLoaded(data.grid_size);
        } else {
          console.error("Failed to parse YAML or file is missing 'grid_size'. Parsed data:", data);
        }

      } catch (error) {
        console.error("Failed to load or parse level file:", error);
      }
    }
    loadLevel();
  }, []);

  if (!levelData) {
    return null;
  }

  const { width, height } = levelData.grid_size;
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
          const worldX = (x - offsetX) * (TILE_SIZE + TILE_MARGIN);
          const worldZ = (z - offsetZ) * (TILE_SIZE + TILE_MARGIN);
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



/*
"use client";

// import Tile from "./tile";
import GrassTile from "./grass-tile";
export const GRID_SIZE = 8;       // z.B. 5x5 Grid
export const TILE_SIZE = 16;       // Größe eines Tiles
export const TILE_MARGIN = 0.1;    // Abstand zwischen Tiles

export default function Grid() {
  const windEnabled = true;
  const tiles = [];
  const offset = Math.floor(GRID_SIZE / 2);

  for (let x = -offset; x <= offset; x++) {
    for (let z = -offset; z <= offset; z++) {
      tiles.push(
        <GrassTile

          key={`${x},${z}`}
          position={[
            x * (TILE_SIZE + TILE_MARGIN),
            0, // Höhe
            z * (TILE_SIZE + TILE_MARGIN),
          ]}
          windEnabled={windEnabled}
        />
      );
    }
  }

  return <>{tiles}</>;
}
*/