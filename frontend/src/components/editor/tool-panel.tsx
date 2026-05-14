"use client";

import { cn } from "@/lib/utils";
import { Paintbrush, Eraser, MapPin } from "lucide-react";

export type EditorTool = "paint" | "erase" | "spawn";

interface ToolPanelProps {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  activeLayer: number;
  layerCount: number;
  onActiveLayerChange: (layer: number) => void;
  onAddLayer: () => void;
}

export function ToolPanel({
  tool,
  onToolChange,
  activeLayer,
  layerCount,
  onActiveLayerChange,
  onAddLayer,
}: ToolPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Tool
        </h3>
        <div className="grid grid-cols-3 gap-1">
          <ToolButton
            label="Paint"
            icon={<Paintbrush className="w-4 h-4" />}
            active={tool === "paint"}
            onClick={() => onToolChange("paint")}
          />
          <ToolButton
            label="Erase"
            icon={<Eraser className="w-4 h-4" />}
            active={tool === "erase"}
            onClick={() => onToolChange("erase")}
          />
          <ToolButton
            label="Spawn"
            icon={<MapPin className="w-4 h-4" />}
            active={tool === "spawn"}
            onClick={() => onToolChange("spawn")}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Layer (Y)
          </h3>
          <button
            onClick={onAddLayer}
            className="text-xs text-blue-500 hover:underline"
            title="Add a layer above"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: layerCount }, (_, i) => (
            <button
              key={i}
              onClick={() => onActiveLayerChange(i)}
              className={cn(
                "w-9 h-9 rounded text-sm font-mono border-2 transition-all",
                i === activeLayer
                  ? "bg-blue-500 text-white border-blue-600"
                  : "bg-muted hover:bg-muted/70 border-transparent",
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 rounded-md border-2 transition-all text-xs",
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          : "border-transparent bg-muted hover:bg-muted/70",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
