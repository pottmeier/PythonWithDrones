"use client";

import { BLOCK_REGISTRY } from "@/lib/block-registry";
import { cn } from "@/lib/utils";

const PAINTABLE_BLOCK_IDS = [
  "grass",
  "dirt",
  "stone",
  "stone_pillar",
  "tree_trunk",
  "tree_leaves",
  "finish_portal",
];

interface BlockPaletteProps {
  selectedBlockId: string;
  onSelect: (blockId: string) => void;
}

const BLOCK_COLORS: Record<string, string> = {
  grass: "bg-green-500",
  dirt: "bg-amber-700",
  stone: "bg-gray-400",
  stone_pillar: "bg-gray-500",
  tree_trunk: "bg-amber-900",
  tree_leaves: "bg-green-700",
  finish_portal: "bg-red-500",
};

export function BlockPalette({
  selectedBlockId,
  onSelect,
}: BlockPaletteProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
        Blocks
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {PAINTABLE_BLOCK_IDS.map((id) => {
          const def = BLOCK_REGISTRY[id];
          if (!def) return null;
          const isActive = selectedBlockId === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={id}
              className={cn(
                "aspect-square rounded-md border-2 flex items-center justify-center text-[10px] text-white font-semibold p-1 text-center leading-tight transition-all",
                BLOCK_COLORS[id] ?? "bg-gray-300",
                isActive
                  ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                  : "border-transparent hover:border-blue-300",
              )}
            >
              {id.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { PAINTABLE_BLOCK_IDS };
