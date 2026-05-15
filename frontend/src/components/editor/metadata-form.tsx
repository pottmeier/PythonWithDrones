"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { LevelData } from "@/types/level";

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
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={level.solve_conditions.finish_block}
              onChange={(e) =>
                patch({
                  solve_conditions: {
                    ...level.solve_conditions,
                    finish_block: e.target.checked,
                  },
                })
              }
            />
            Reach finish portal
          </label>
          <label className="flex items-center gap-2 text-sm">
            Coins:
            <Input
              type="number"
              min={0}
              value={level.solve_conditions.collected_coins ?? 0}
              onChange={(e) =>
                patch({
                  solve_conditions: {
                    ...level.solve_conditions,
                    collected_coins: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-20"
            />
          </label>
        </div>
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
