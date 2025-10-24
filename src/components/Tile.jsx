import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export default function Tile(props) {
  const { scene } = useGLTF('/tile.glb');
  const clonedScene = scene.clone();

  // Wichtig: Genau wie beim Auto muss auch die Kachel
  // konfiguriert werden, um Schatten zu empfangen.
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        // Die Kachel soll Schatten EMPFANGEN
        child.receiveShadow = true; 
      }
    });
  }, [clonedScene]);

  return (
    // Wir verwenden eine Gruppe, um die Position zu steuern
    <group {...props}>
      <primitive 
        object={clonedScene}
        // Passen Sie scale/rotation hier an, falls Ihr Modell
        // eine andere Größe oder Ausrichtung hat.
        scale={1} 
      />
    </group>
  );
}

useGLTF.preload('/tile.glb');