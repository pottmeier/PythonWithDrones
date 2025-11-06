"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useSpring, animated, config } from "@react-spring/three";
import Rotor from "./rotor"; 

interface DroneProps {
  position: [number, number, number];
  onAnimationComplete: () => void;
}

export default function Drone({ position, onAnimationComplete }: DroneProps) {
  const { scene } = useGLTF("/models/drone_body.glb");
  const clonedScene = scene.clone();

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, [clonedScene]);

  // --- ANIMATION LOGIC ---
  const [spring, api] = useSpring(() => ({
    from: { position: position }, 
    config: config.gentle,
  }));

  // --- THIS IS THE CORRECTED LOGIC ---
  useEffect(() => {
    api.start({
      to: { position: position },
      reset: false,
      onRest: () => {
        onAnimationComplete();
      },
    });
  }, [position, api, onAnimationComplete]);

  return (
    <animated.group position={spring.position}>
      <primitive object={clonedScene} scale={0.5} />
      <Rotor position={[4, 3.5, 4]} /> 
      <Rotor position={[-4, 3.5, 4]} />  
      <Rotor position={[4, 3.5, -4]} />  
      <Rotor position={[-4, 3.5, -4]} /> 
    </animated.group>
  );
}

useGLTF.preload("/models/drone_body.glb");
useGLTF.preload("/models/rotor.glb");