export type Spawn = { x: number; y: number; z: number };

export type SolveConditions = {
  finish_block: boolean;
  collected_coins: number;
};

export type LevelLayers = Record<string, string[][]>;

export type LevelData = {
  id?: number | string;
  title?: string;
  homepage_intro?: string;
  tags?: string[];
  description?: string;
  spawn: Spawn;
  orientation?: number;
  solve_conditions: SolveConditions;
  layers: LevelLayers;
  procedural?: unknown[];
};

export type LevelSource = "user" | "official" | "community";
export type StoredLevelStatus = "draft" | "published";

export type StoredLevel = {
  id: string;
  source: LevelSource;
  status: StoredLevelStatus;
  yaml: LevelData;
  updatedAt: number;
};

export type LevelDimensions = {
  width: number;
  height: number;
  depth: number;
};

export function getLevelDimensions(level: LevelData): LevelDimensions {
  const layerNames = Object.keys(level.layers);
  const baseLayer = level.layers["layer_0"] ?? [];
  return {
    width: baseLayer[0]?.length ?? 0,
    height: layerNames.length,
    depth: baseLayer.length,
  };
}

export function createEmptyLevel(
  width: number,
  depth: number,
  height: number,
): LevelData {
  const layers: LevelLayers = {};
  for (let y = 0; y < height; y++) {
    const layer: string[][] = [];
    for (let z = 0; z < depth; z++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        row.push(y === 0 ? "grass" : "empty");
      }
      layer.push(row);
    }
    layers[`layer_${y}`] = layer;
  }
  return {
    title: "Untitled Level",
    tags: [],
    description: "",
    spawn: { x: 0, y: 1, z: 0 },
    solve_conditions: { finish_block: true, collected_coins: 0 },
    layers,
  };
}
