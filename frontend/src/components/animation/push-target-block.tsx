"use client";

import React from "react";
import GoalSquareOutline from "./goal-square-outline";

interface PushTargetBlockProps {
  position: [number, number, number];
  [key: string]: unknown;
}

export default function PushTargetBlock(props: PushTargetBlockProps) {
  return (
    <GoalSquareOutline
      position={props.position}
      unmetColor="#f5f5f4" // matches the crate's own color (movable-block.tsx)
      satisfiedColor="#4ade80" // universal success green
    />
  );
}
