"use client";
import React from "react";

export default function TrunkBlock(props: any) {
  return (
    <mesh {...props} castShadow receiveShadow>
      {/* A simple brown box for now */}
      <boxGeometry args={[0.8, 1, 0.8]} /> 
      <meshStandardMaterial color="#5c3e30" />
    </mesh>
  );
}