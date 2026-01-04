import React from "react";
import GrassTile from "@/components/grass-tile";
import DirtTile from "@/components/dirt-tile";
import TrunkBlock from "@/components/trunk-block"; 
import LeavesBlock from "@/components/leaves-block";

// 1. Define the capabilities of a block
export interface BlockDefinition {
  id: string;
  isCollidable: boolean;      // Can the drone fly through it?
  isDestructible: boolean;    // Can it be drilled?
  isPickable: boolean;        // Can it be picked up?
  placementValidOn: string[]; // List of block IDs this can sit on top of
  component: React.ComponentType<any>; // The React component to render
}

// 2. The Master Dictionary
export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  // --- GROUND BLOCKS ---
  grass: {
    id: "grass",
    isCollidable: true,
    isDestructible: true,
    isPickable: false,
    placementValidOn: ["dirt"],
    component: GrassTile,
  },
  dirt: {
    id: "dirt",
    isCollidable: true,
    isDestructible: true,
    isPickable: true, // Maybe you can pick up dirt clumps?
    placementValidOn: ["dirt", "bedrock"],
    component: DirtTile,
  },
  
  // --- VEGETATION BLOCKS (The Tree Parts) ---
  tree_trunk: {
    id: "tree_trunk",
    isCollidable: true,
    isDestructible: true,
    isPickable: false,
    placementValidOn: ["grass", "dirt", "tree_trunk"], // Can stack on itself!
    component: TrunkBlock,
  },
  tree_leaves: {
    id: "tree_leaves",
    isCollidable: true, // Or false if you want to fly through leaves
    isDestructible: true,
    isPickable: false,
    placementValidOn: ["tree_trunk", "tree_leaves"],
    component: LeavesBlock,
  },

  // --- SPECIAL ---
  empty: {
    id: "empty",
    isCollidable: false,
    isDestructible: false,
    isPickable: false,
    placementValidOn: [],
    component: () => null, // Renders nothing
  },
};

// 3. Helper to expose rules to Python later
export function getBlockRules(blockId: string) {
  return BLOCK_REGISTRY[blockId] || BLOCK_REGISTRY["empty"];
}