import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PythonConsole from './components/PythonConsole';
import Drone from './components/Drone';
import Grid, { GRID_SIZE, TILE_SIZE, TILE_MARGIN } from './components/Grid'; // Grid und Konfiguration importieren

export default function App() {
  // NEU: Wir speichern die Position des Autos als Gitter-Koordinaten (z.B. [0,0] für die Mitte)
  const [gridPosition, setGridPosition] = useState([0, 0]); // [x, z]

  // Dieser State speichert weiterhin die "echte" 3D-Welt-Position
  const [worldPosition, setWorldPosition] = useState([0, 0, 0]); // [x, y, z]

  // Dieser Effekt synchronisiert die Gitter-Position mit der Welt-Position
  useEffect(() => {
    const offset = Math.floor(GRID_SIZE / 2);
    // Berechne die 3D-Position basierend auf den Gitter-Koordinaten
    const newX = (gridPosition[0]) * (TILE_SIZE + TILE_MARGIN);
    const newZ = (gridPosition[1]) * (TILE_SIZE + TILE_MARGIN);

    // Aktualisiere die 3D-Position des Autos. Die Y-Höhe bleibt konstant.
    setWorldPosition([newX, 0, newZ]); // Y-Wert anpassen, damit das Auto auf der Kachel steht

  }, [gridPosition]); // Dieser Effekt wird jedes Mal ausgeführt, wenn sich gridPosition ändert


  // Die globale Funktion, die von Python aufgerufen wird. Jetzt ändert sie die Gitter-Koordinaten.
  window.moveDrone = (direction) => {
    console.log(`Bewege drone in Richtung: ${direction}`);

    setGridPosition(prevPos => {
      const newGridPos = [...prevPos];
      if (direction === 'rechts') {
        newGridPos[0] += 1;
      }
      if (direction === 'links') {
        newGridPos[0] -= 1;
      }
      if (direction === 'hoch') { // "hoch" auf dem Bildschirm ist negativ Z
        newGridPos[1] -= 1;
      }
      if (direction === 'runter') { // "runter" auf dem Bildschirm ist positiv Z
        newGridPos[1] += 1;
      }

      // TODO: Später hier Grenzen einfügen, damit man nicht vom Gitter fallen kann
      return newGridPos;
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <PythonConsole />
      <Canvas shadows>
        {/* Beleuchtung bleibt gleich */}
        <color attach="background" args={['#282c34']} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow
          position={[5, 10, 7.5]}
          intensity={1.5}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Unser Auto, dessen Position jetzt vom `worldPosition`-State gesteuert wird */}
        <Drone position={worldPosition} />

        {/* Die alte Bodenebene wird durch unser neues Gitter ersetzt */}
        <Grid />

        <OrbitControls />
      </Canvas>
    </div>
  );
}