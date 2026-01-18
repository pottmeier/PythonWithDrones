import React from "react";
import GrassTile from "@/components/grass-tile";
import DirtTile from "@/components/dirt-tile";
import TrunkBlock from "@/components/trunk-block"; 
import LeavesBlock from "@/components/leaves-block";
import FinishPortalBlock from "@/components/finish-portal-block";

// 1. Define the capabilities of a block
export interface BlockDefinition {
  id: string;
  isCollidable: boolean;      // Can the drone fly through it?
  isDestructible: boolean;    // Can it be destroyed?
  isPickable: boolean;        // Can it be picked up?
  isFinish?: boolean;         // Is the block a finish
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
    isPickable: false,
    placementValidOn: ["dirt"],
    component: DirtTile,
  },
  
  // --- VEGETATION BLOCKS (The Tree Parts) ---
  tree_trunk: {
    id: "tree_trunk",
    isCollidable: true,
    isDestructible: true,
    isPickable: false,
    placementValidOn: ["grass", "dirt", "tree_trunk"],
    component: TrunkBlock,
  },
  tree_leaves: {
    id: "tree_leaves",
    isCollidable: true,
    isDestructible: true,
    isPickable: false,
    placementValidOn: ["tree_trunk", "tree_leaves"],
    component: LeavesBlock,
  },

  //finish block
  finish_portal: {
    id: "finish_portal",
    isCollidable: false, // Must be FALSE so we can fly into it
    isFinish: true,      // <-- THE WIN TRIGGER
    isDestructible: false,
    isPickable: false,
    placementValidOn: ["grass", "dirt", "empty"],
    component: FinishPortalBlock,
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