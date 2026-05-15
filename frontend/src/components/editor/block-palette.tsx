"use client";

import { BLOCK_REGISTRY } from "@/lib/block-registry";
import { cn } from "@/lib/utils";

interface BlockPaletteProps {
  selectedBlockId: string;
  onSelect: (blockId: string) => void;
}

const ORDER = [
  "grass",
  "dirt",
  "stone",
  "stone_pillar",
  "tree_trunk",
  "tree_leaves",
  "finish_portal",
  "air",
  "empty",
];

const BLOCK_STYLES: Record<
  string,
  { bg: string; label?: string; hint?: string }
> = {
  grass: { bg: "bg-green-500" },
  dirt: { bg: "bg-amber-700" },
  stone: { bg: "bg-gray-400" },
  stone_pillar: { bg: "bg-gray-500" },
  tree_trunk: { bg: "bg-amber-900" },
  tree_leaves: { bg: "bg-green-700" },
  finish_portal: { bg: "bg-red-500" },
  air: {
    bg: "bg-sky-200 dark:bg-sky-900/40 border-dashed",
    label: "air",
    hint: "fly-through",
  },
  empty: {
    bg: "bg-gray-300 dark:bg-gray-700 border-dashed",
    label: "empty",
    hint: "wall",
  },
};

export function BlockPalette({
  selectedBlockId,
  onSelect,
}: BlockPaletteProps) {
  const ids = [
    ...ORDER.filter((id) => BLOCK_REGISTRY[id]),
    ...Object.keys(BLOCK_REGISTRY).filter((id) => !ORDER.includes(id)),
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
        Blocks
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {ids.map((id) => {
          const def = BLOCK_REGISTRY[id];
          if (!def) return null;
          const style = BLOCK_STYLES[id] ?? { bg: "bg-zinc-400" };
          const isActive = selectedBlockId === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={style.hint ? `${id} — ${style.hint}` : id}
              className={cn(
                "aspect-square rounded-md border-2 flex flex-col items-center justify-center text-[10px] font-semibold p-1 text-center leading-tight transition-all",
                style.bg,
                id === "air" || id === "empty"
                  ? "text-foreground"
                  : "text-white",
                isActive
                  ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                  : "border-transparent hover:border-blue-300",
              )}
            >
              <span>{style.label ?? id.replace(/_/g, " ")}</span>
              {style.hint && (
                <span className="text-[9px] opacity-70 font-normal">
                  {style.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
