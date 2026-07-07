export type Spawn = { x: number; y: number; z: number };

// All fields are overrides -- when omitted, the game infers them from what's
// actually placed in the level (every coin must be collected, a package +
// delivery_pad pair requires delivery, a movable_block + push_target pair
// requires pushing). Only set a field here to deviate from that default,
// e.g. requiring fewer coins than are placed. See model.py's
// SolveConditions.infer_from_layers for the authoritative inference logic.
export type SolveConditions = {
  collected_coins?: number;
  requires_delivery?: boolean;
  push_target?: [number, number, number];
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
  solve_conditions?: SolveConditions;
  layers: LevelLayers;
  procedural?: unknown[];
};

/** Count how many cells across all layers hold the given block id. */
export function countBlockOccurrences(
  layers: LevelLayers,
  blockId: string,
): number {
  let count = 0;
  for (const rows of Object.values(layers)) {
    for (const row of rows) {
      for (const cell of row) {
        if (cell === blockId) count++;
      }
    }
  }
  return count;
}

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

export function defaultFillForLayer(y: number): string {
  return y === 0 ? "grass" : "air";
}

export function makeLayer(
  width: number,
  depth: number,
  y: number,
): string[][] {
  const fill = defaultFillForLayer(y);
  const layer: string[][] = [];
  for (let z = 0; z < depth; z++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) row.push(fill);
    layer.push(row);
  }
  return layer;
}

export function createEmptyLevel(
  width: number,
  depth: number,
  height: number,
): LevelData {
  const layers: LevelLayers = {};
  for (let y = 0; y < height; y++) {
    layers[`layer_${y}`] = makeLayer(width, depth, y);
  }
  return {
    title: "Untitled Level",
    tags: [],
    description: "",
    spawn: { x: 0, y: 1, z: 0 },
    orientation: 0,
    layers,
  };
}

export function resizeLevel(
  level: LevelData,
  newWidth: number,
  newDepth: number,
  newHeight: number,
): LevelData {
  const layers: LevelLayers = {};
  for (let y = 0; y < newHeight; y++) {
    const layerName = `layer_${y}`;
    const oldLayer = level.layers[layerName];
    const fill = defaultFillForLayer(y);
    const layer: string[][] = [];
    for (let z = 0; z < newDepth; z++) {
      const oldRow = oldLayer?.[z];
      const row: string[] = [];
      for (let x = 0; x < newWidth; x++) {
        row.push(oldRow?.[x] ?? fill);
      }
      layer.push(row);
    }
    layers[layerName] = layer;
  }
  return {
    ...level,
    layers,
    spawn: {
      x: Math.min(Math.max(level.spawn.x, 0), newWidth - 1),
      y: Math.min(Math.max(level.spawn.y, 0), newHeight - 1),
      z: Math.min(Math.max(level.spawn.z, 0), newDepth - 1),
    },
  };
}
