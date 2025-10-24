import React from 'react';
import Tile from './Tile';

// Konfiguration für unser Gitter.
// Diese Werte müssen wir später auch in App.jsx verwenden!
export const GRID_SIZE = 31;
export const TILE_SIZE = 8; // Die Größe Ihrer Kachel in 3D-Einheiten
export const TILE_MARGIN = 0.5;

export default function Grid() {
  const tiles = [];
  const offset = Math.floor(GRID_SIZE / 2); // Um das Gitter auf den Nullpunkt zu zentrieren

  // Erzeuge das Gitter mit einer doppelten Schleife
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const tileX = (x - offset) * (TILE_SIZE + TILE_MARGIN);
      const tileZ = (z - offset) * (TILE_SIZE + TILE_MARGIN);

      tiles.push(
        <Tile 
          key={`${x}-${z}`} 
          position={[tileX, 0, tileZ]} // Positionieren der Kachel
        />
      );
    }
  }

  return <>{tiles}</>; // Rendere alle Kacheln
}