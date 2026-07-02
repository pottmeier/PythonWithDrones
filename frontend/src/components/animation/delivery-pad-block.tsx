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
      unmetColor="#6b7280"
      satisfiedColor="#f5f5f4" // matches the package's own color (package-block.tsx)
    />
  );
}
