"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, RotateCcw } from "lucide-react";
import type { LevelDimensions } from "@/types/level";

interface ResizePanelProps {
  current: LevelDimensions;
  pending: LevelDimensions;
  onPendingChange: (next: LevelDimensions) => void;
  onApply: () => void;
  onReset: () => void;
}

export function ResizePanel({
  current,
  pending,
  onPendingChange,
  onApply,
  onReset,
}: ResizePanelProps) {
  const dirty =
    pending.width !== current.width ||
    pending.depth !== current.depth ||
    pending.height !== current.height;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        Level Size
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <DimInput
          axis="X"
          value={pending.width}
          current={current.width}
          onChange={(v) => onPendingChange({ ...pending, width: v })}
        />
        <DimInput
          axis="Y"
          value={pending.height}
          current={current.height}
          onChange={(v) => onPendingChange({ ...pending, height: v })}
        />
        <DimInput
          axis="Z"
          value={pending.depth}
          current={current.depth}
          onChange={(v) => onPendingChange({ ...pending, depth: v })}
        />
      </div>
      {dirty && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onApply} className="flex-1">
            <Maximize2 className="w-3 h-3 mr-1.5" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
          Red area in the scene will be removed.
        </p>
      )}
    </div>
  );
}

function DimInput({
  axis,
  value,
  current,
  onChange,
}: {
  axis: string;
  value: number;
  current: number;
  onChange: (v: number) => void;
}) {
  const shrinking = value < current;
  const growing = value > current;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-muted-foreground">
        {axis}
      </span>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!Number.isFinite(v) || v < 1) return;
          onChange(v);
        }}
        className={
          shrinking
            ? "border-red-400 focus-visible:ring-red-400"
            : growing
              ? "border-green-400 focus-visible:ring-green-400"
              : ""
        }
      />
    </label>
  );
}
