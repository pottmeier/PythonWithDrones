"use client";

import React from "react";
import GoalSquareOutline from "./goal-square-outline";

interface DeliveryPadBlockProps {
  position: [number, number, number];
  [key: string]: unknown;
}

export default function DeliveryPadBlock(props: DeliveryPadBlockProps) {
  return (
    <GoalSquareOutline
      position={props.position}
      unmetColor="#c98a4b" // matches the package's own color (package-block.tsx)
      satisfiedColor="#4ade80" // universal success green
    />
  );
}
