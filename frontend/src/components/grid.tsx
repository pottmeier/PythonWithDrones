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
