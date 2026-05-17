"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LevelDimensions } from "@/types/level";

interface ResizePanelProps {
  current: LevelDimensions;
  onPreviewChange: (preview: LevelDimensions | null) => void;
  onApply: (dims: LevelDimensions) => void;
}

type AxisKey = "width" | "height" | "depth";

function isValidText(t: string): boolean {
  return /^\d+$/.test(t) && parseInt(t) >= 1;
}

export function ResizePanel({
  current,
  onPreviewChange,
  onApply,
}: ResizePanelProps) {
  const [texts, setTexts] = useState<Record<AxisKey, string>>({
    width: String(current.width),
    height: String(current.height),
    depth: String(current.depth),
  });

  // Sync from external dimension changes (e.g. after Apply, or undo/redo).
  useEffect(() => {
    setTexts((t) => {
      const next = { ...t };
      if (parseInt(t.width) !== current.width || !isValidText(t.width)) {
        next.width = String(current.width);
      }
      if (parseInt(t.height) !== current.height || !isValidText(t.height)) {
        next.height = String(current.height);
      }
      if (parseInt(t.depth) !== current.depth || !isValidText(t.depth)) {
        next.depth = String(current.depth);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.width, current.height, current.depth]);

  const validity = {
    width: isValidText(texts.width),
    height: isValidText(texts.height),
    depth: isValidText(texts.depth),
  };
  const allValid = validity.width && validity.height && validity.depth;

  const parsedDims: LevelDimensions | null = allValid
    ? {
        width: parseInt(texts.width),
        height: parseInt(texts.height),
        depth: parseInt(texts.depth),
      }
    : null;

  const dirty =
    parsedDims !== null &&
    (parsedDims.width !== current.width ||
      parsedDims.height !== current.height ||
      parsedDims.depth !== current.depth);

  // Emit preview to the scene: null when invalid or when no change.
  useEffect(() => {
    onPreviewChange(dirty ? parsedDims : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts.width, texts.height, texts.depth, current.width, current.height, current.depth]);

  const setAxis = (axis: AxisKey, text: string) => {
    setTexts((t) => ({ ...t, [axis]: text }));
  };

  const handleApply = () => {
    if (!parsedDims || !dirty) return;
    onApply(parsedDims);
  };

  const handleReset = () => {
    setTexts({
      width: String(current.width),
      height: String(current.height),
      depth: String(current.depth),
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        Level Size
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <DimInput
          axis="X"
          text={texts.width}
          current={current.width}
          valid={validity.width}
          onChange={(t) => setAxis("width", t)}
        />
        <DimInput
          axis="Y"
          text={texts.height}
          current={current.height}
          valid={validity.height}
          onChange={(t) => setAxis("height", t)}
        />
        <DimInput
          axis="Z"
          text={texts.depth}
          current={current.depth}
          valid={validity.depth}
          onChange={(t) => setAxis("depth", t)}
        />
      </div>
      {!allValid && (
        <p className="text-[10px] text-red-500 leading-tight">
          All dimensions must be at least 1.
        </p>
      )}
      {(dirty || !allValid) && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!dirty}
            className="flex-1"
          >
            <Maximize2 className="w-3 h-3 mr-1.5" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
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
  text,
  current,
  valid,
  onChange,
}: {
  axis: string;
  text: string;
  current: number;
  valid: boolean;
  onChange: (t: string) => void;
}) {
  const parsed = parseInt(text);
  const shrinking = valid && parsed < current;
  const growing = valid && parsed > current;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-muted-foreground">
        {axis}
      </span>
      <Input
        type="number"
        min={1}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          !valid && "border-red-500 focus-visible:ring-red-500",
          valid &&
            shrinking &&
            "border-red-400 focus-visible:ring-red-400",
          valid &&
            growing &&
            "border-green-400 focus-visible:ring-green-400",
        )}
      />
    </label>
  );
}
