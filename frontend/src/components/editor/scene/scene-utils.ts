import type { LevelData } from "@/types/level";

export const HINT_COLORS: Record<string, string> = {
  air: "#7dd3fc",
  empty: "#71717a",
};

export function buildBlockList(
  level: LevelData,
): Array<{ x: number; y: number; z: number }> {
  const out: Array<{ x: number; y: number; z: number }> = [];
  for (const layerName in level.layers) {
    const layerIndex = parseInt(layerName.split("_")[1]) || 0;
    const layer = level.layers[layerName];
    for (let z = 0; z < layer.length; z++) {
      const row = layer[z];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === "air") continue;
        out.push({ x, y: layerIndex, z });
      }
    }
  }
  return out;
}
