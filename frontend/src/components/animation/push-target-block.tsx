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
      unmetColor="#6b7280"
      satisfiedColor="#c98a4b" // matches the crate's own color (movable-block.tsx)
    />
  );
}
