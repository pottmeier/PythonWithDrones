"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LevelData, SolveConditions } from "@/types/level";

const ORIENTATIONS = [
  { value: 0, label: "N" },
  { value: 1, label: "E" },
  { value: 2, label: "S" },
  { value: 3, label: "W" },
] as const;

interface MetadataFormProps {
  level: LevelData;
  onChange: (next: LevelData) => void;
}

function parseTags(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function MetadataForm({ level, onChange }: MetadataFormProps) {
  const patch = (update: Partial<LevelData>) =>
    onChange({ ...level, ...update });

  // Local text state for tags so commas (and trailing spaces) survive typing.
  // Sync from `level.tags` only when the external value differs from what
  // the current text would parse to (e.g. undo, import).
  const [tagsText, setTagsText] = useState(() =>
    (level.tags ?? []).join(", "),
  );
  useEffect(() => {
    const parsedFromText = parseTags(tagsText).join("|");
    const externalSerialized = (level.tags ?? []).join("|");
    if (parsedFromText !== externalSerialized) {
      setTagsText((level.tags ?? []).join(", "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.tags]);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        Metadata
      </h3>

      <Field label="Title">
        <Input
          value={level.title ?? ""}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Field>

      <Field label="Homepage intro">
        <Input
          value={level.homepage_intro ?? ""}
          onChange={(e) => patch({ homepage_intro: e.target.value })}
          placeholder="Short tagline shown on level cards"
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <Input
          value={tagsText}
          onChange={(e) => {
            setTagsText(e.target.value);
            patch({ tags: parseTags(e.target.value) });
          }}
          placeholder="Easy, Loops, ..."
        />
      </Field>

      <Field label="Description (Markdown / HTML)">
        <textarea
          value={level.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          rows={5}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
        />
      </Field>

      <Field label="Solve conditions">
        <label className="flex items-center gap-2 text-sm">
          Coins required:
          <Input
            type="number"
            min={0}
            placeholder="Auto"
            value={level.solve_conditions?.collected_coins ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              const { requires_delivery, push_target } =
                level.solve_conditions ?? {};
              // Only carry over fields that were actually set -- an explicit
              // `undefined` here would survive the postMessage to the
              // Pyodide worker as Python `None`, which fails validation
              // since SolveConditions.requires_delivery is a plain bool.
              const restSolveConditions: SolveConditions = {};
              if (requires_delivery !== undefined) {
                restSolveConditions.requires_delivery = requires_delivery;
              }
              if (push_target !== undefined) {
                restSolveConditions.push_target = push_target;
              }
              if (raw === "") {
                patch({
                  solve_conditions:
                    Object.keys(restSolveConditions).length > 0
                      ? restSolveConditions
                      : undefined,
                });
                return;
              }
              patch({
                solve_conditions: {
                  ...restSolveConditions,
                  collected_coins: Number(raw) || 0,
                },
              });
            }}
            className="w-20"
          />
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          Reaching the finish portal is always required. Coins, package
          delivery, and crate pushes are required automatically whenever
          they&apos;re placed in the level -- leave this blank unless you
          want to require fewer coins than are placed.
        </p>
      </Field>

      <Field label="Spawn">
        <div className="grid grid-cols-3 gap-2">
          {(["x", "y", "z"] as const).map((axis) => (
            <label key={axis} className="text-sm flex items-center gap-1">
              <span className="font-mono w-4">{axis}</span>
              <Input
                type="number"
                value={level.spawn[axis]}
                onChange={(e) =>
                  patch({
                    spawn: {
                      ...level.spawn,
                      [axis]: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </Field>

      <Field label="Spawn orientation">
        <div className="grid grid-cols-4 gap-1">
          {ORIENTATIONS.map((o) => {
            const active = (level.orientation ?? 0) === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => patch({ orientation: o.value })}
                className={cn(
                  "py-2 rounded-md border-2 text-xs font-mono transition-all cursor-pointer",
                  active
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-transparent bg-muted hover:bg-muted/70",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
