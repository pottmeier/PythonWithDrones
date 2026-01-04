"use client";
import React from "react";

export default function LeavesBlock(props: any) {
  return (
    <mesh {...props} castShadow receiveShadow>
      {/* A simple green box */}
      <boxGeometry args={[1, 1, 1]} /> 
      <meshStandardMaterial color="#228B22" transparent opacity={0.9} />
    </mesh>
  );
}