"use client";

import Tile from "./tile";
export const GRID_SIZE = 8;       // z.B. 5x5 Grid
export const TILE_SIZE = 2;       // Größe eines Tiles
export const TILE_MARGIN = 0;    // Abstand zwischen Tiles

export default function Grid() {
  const tiles = [];
  const offset = Math.floor(GRID_SIZE / 2);

  for (let x = -offset; x <= offset; x++) {
    for (let z = -offset; z <= offset; z++) {
      tiles.push(
        <Tile
          key={`${x},${z}`}
          position={[
            x * (TILE_SIZE + TILE_MARGIN),
            0, // Höhe
            z * (TILE_SIZE + TILE_MARGIN),
          ]}
        />
      );
    }
  }

  return <>{tiles}</>;
}
