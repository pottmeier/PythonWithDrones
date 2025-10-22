// src/App.jsx

import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PythonConsole from './components/PythonConsole';

function Box(props) {
  const meshRef = useRef();
  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'red'} />
    </mesh>
  );
}

export default function App() {
  const [position, setPosition] = useState([-2, 0, 0]);

  window.moveBox = (direction) => {
    console.log(`Bewege Box in Richtung: ${direction}`);
    if (direction === 'rechts') {
      setPosition((prevPos) => [prevPos[0] + 1, prevPos[1], prevPos[2]]);
    }
    if (direction === 'links') {
      setPosition((prevPos) => [prevPos[0] - 1, prevPos[1], prevPos[2]]);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <PythonConsole />
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Box position={position} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color={'grey'} />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  );
}