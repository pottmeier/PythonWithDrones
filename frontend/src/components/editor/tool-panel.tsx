"use client";

import { cn } from "@/lib/utils";
import { Paintbrush, Eraser, MapPin, Camera, MousePointer2 } from "lucide-react";

export type EditorTool = "paint" | "erase" | "spawn";
export type EditorMode = "placement" | "camera";

interface ToolPanelProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  altHeld: boolean;
  xHeld: boolean;
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

export function ToolPanel({
  mode,
  onModeChange,
  altHeld,
  xHeld,
  tool,
  onToolChange,
}: ToolPanelProps) {
  const effectiveMode: EditorMode = altHeld ? "camera" : mode;
  const effectiveTool: EditorTool = xHeld ? "erase" : tool;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Mode
        </h3>
        <div className="grid grid-cols-2 gap-1">
          <ModeButton
            label="Place"
            icon={<MousePointer2 className="w-4 h-4" />}
            active={effectiveMode === "placement"}
            transient={altHeld && mode === "placement"}
            onClick={() => onModeChange("placement")}
          />
          <ModeButton
            label="Camera"
            icon={<Camera className="w-4 h-4" />}
            active={effectiveMode === "camera"}
            transient={altHeld && mode === "placement"}
            onClick={() => onModeChange("camera")}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
          Hold <kbd className="font-mono">Alt</kbd> for temporary camera mode.
        </p>
      </div>

      <div className={effectiveMode === "camera" ? "opacity-50" : ""}>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Tool
        </h3>
        <div className="grid grid-cols-3 gap-1">
          <ToolButton
            label="Paint"
            icon={<Paintbrush className="w-4 h-4" />}
            active={effectiveTool === "paint"}
            onClick={() => onToolChange("paint")}
            disabled={effectiveMode === "camera"}
          />
          <ToolButton
            label="Erase"
            icon={<Eraser className="w-4 h-4" />}
            active={effectiveTool === "erase"}
            transient={xHeld && tool !== "erase"}
            onClick={() => onToolChange("erase")}
            disabled={effectiveMode === "camera"}
          />
          <ToolButton
            label="Spawn"
            icon={<MapPin className="w-4 h-4" />}
            active={effectiveTool === "spawn"}
            onClick={() => onToolChange("spawn")}
            disabled={effectiveMode === "camera"}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
          Hold <kbd className="font-mono">X</kbd> for temporary erase.
        </p>
      </div>

    </div>
  );
}

function ModeButton({
  label,
  icon,
  active,
  transient,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  transient?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1 py-2 rounded-md border-2 transition-all text-xs",
        active
          ? transient
            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            : "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          : "border-transparent bg-muted hover:bg-muted/70",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolButton({
  label,
  icon,
  active,
  transient,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  transient?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 rounded-md border-2 transition-all text-xs",
        active
          ? transient
            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            : "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          : "border-transparent bg-muted hover:bg-muted/70",
        disabled && "cursor-not-allowed",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
