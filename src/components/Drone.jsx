import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export default function Drone(props) {
  const { scene } = useGLTF('/drone.glb');
  const clonedScene = scene.clone();

  // useEffect wird ausgeführt, sobald die Komponente geladen ist.
  // Perfekt, um das geladene Modell zu manipulieren.
  useEffect(() => {
    // scene.traverse geht durch jedes einzelne Objekt im 3D-Modell
    clonedScene.traverse((child) => {
      // Wir prüfen, ob das aktuelle Objekt ein Mesh ist (etwas Sichtbares)
      if (child.isMesh) {
        // Jedes sichtbare Teil des Modells soll einen Schatten werfen
        child.castShadow = true;
      }
    });
  }, [clonedScene]); // Führe diesen Effekt aus, wenn die Szene sich ändert

  return (
    <primitive 
      object={clonedScene} 
      scale={1} 
      {...props} 
    />
  );
}

useGLTF.preload('/drone.glb');