"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { BLOCK_REGISTRY } from "@/lib/block-registry";
import type { LevelData } from "@/types/level";
import { countBlockOccurrences } from "@/types/level";
//import { generateLevel } from "@/lib/level-generator";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface GridProps {
  onLevelLoaded: (data: {
    size: { width: number; height: number; depth: number };
    spawn: { x: number; y: number; z: number };
    description?: string;
    coinsRequired: number;
    orientation?: number;
  }) => void;
  levelId?: string;
  levelData?: LevelData;
}

function publishLevel(
  blueprint: LevelData,
  onLevelLoaded: GridProps["onLevelLoaded"],
) {
  (window as any).getLevelData = () => blueprint;
  (window as any).getBlockRegistry = () => BLOCK_REGISTRY;

  const baseLayer = blueprint.layers["layer_0"];
  if (!baseLayer || !blueprint.spawn) {
    console.error("Invalid level data: Missing layer_0 or spawn point");
    return;
  }

  const width = baseLayer[0]?.length || 0;
  const height = Object.keys(blueprint.layers).length;
  const depth = baseLayer.length;

  // Mirrors model.py's SolveConditions inference: an explicit override wins,
  // otherwise every coin placed in the level is required.
  const coinsRequired =
    blueprint.solve_conditions?.collected_coins ??
    countBlockOccurrences(blueprint.layers, "coin");

  onLevelLoaded({
    size: { width, height, depth },
    spawn: blueprint.spawn,
    description: blueprint.description || "No description available.",
    coinsRequired,
    orientation: blueprint.orientation ?? 0,
  });
}

export default function Grid({ onLevelLoaded, levelId, levelData }: GridProps) {
  const [resolvedLevel, setResolvedLevel] = useState<LevelData | null>(
    levelData ?? null,
  );

  useEffect(() => {
    if (levelData) {
      setResolvedLevel(levelData);
      publishLevel(levelData, onLevelLoaded);
      return;
    }

    if (!levelId) return;

    async function loadLevel() {
      try {
        const response = await fetch(
          `${basePath}/levels/Level_${levelId}.yaml`,
        );
        const yamlText = await response.text();
        const blueprint = yaml.load(yamlText) as LevelData;

        setResolvedLevel(blueprint);
        publishLevel(blueprint, onLevelLoaded);
      } catch (error) {
        console.error("Error loading level:", error);
      }
    }
    loadLevel();
  }, [onLevelLoaded, levelId, levelData]);

  if (!resolvedLevel) {
    return null;
  }

  const allBlocks = [];

  for (const layerName in resolvedLevel.layers) {
    const layerMatrix = resolvedLevel.layers[layerName];
    const layerIndex = parseInt(layerName.split("_")[1]) || 0;
    const worldY = layerIndex;

    for (let row = 0; row < layerMatrix.length; row++) {
      for (let col = 0; col < layerMatrix[row].length; col++) {
        const blockId = layerMatrix[row][col];
        const blockDef = BLOCK_REGISTRY[blockId];

        if (blockDef && blockDef.id !== "empty") {
          const Component = blockDef.component;
          const worldX = col;
          const worldZ = row;

          allBlocks.push(
            <Component
              key={`${layerName}-${col}-${row}`}
              position={[worldX, worldY, worldZ]}
              blockDef={blockDef}
            />,
          );
        }
      }
    }
  }

  return <group>{allBlocks}</group>;
}
