# 3D Level Editor — Implementation Plan

## Goal

Add a new feature to PythonWithDrones: an interactive 3D level editor that lets users (and the maintainer) create levels visually instead of hand-writing YAML. The editor outputs the exact same level format as today's `Level_N.yaml` files, so the existing game/runtime is unchanged.

## Design choices (locked in)

| Decision | Choice |
|---|---|
| Primary editing interaction | 3D voxel painter only |
| Persistence | localStorage + downloadable YAML; future-proofed for a server backend so "community levels" become possible |
| Test play | In-editor "Test Play" modal that reuses the existing Scene + CodeCard + Pyodide flow |
| Procedural rules (`procedural:` YAML key) | Skip for v1 — preserved on import/export, not authored in the editor |

## Architecture

### Routes

Static export forces all routes to be known at build time. User-level IDs are runtime-only, so we use query strings instead of dynamic segments.

- `/editor` — library page (static): list of saved levels, "New Level" button, "Import YAML" drop zone.
- `/editor/edit` — editor (static): reads optional `?id=<uuid>` from the URL. No `id` means a fresh level.

### Storage abstraction (future-proofing)

```ts
// src/lib/level-storage.ts
interface LevelStorage {
  list(): Promise<StoredLevel[]>;
  get(id: string): Promise<StoredLevel | null>;
  save(level: StoredLevel): Promise<void>;
  delete(id: string): Promise<void>;
}

type StoredLevel = {
  id: string;                // uuid
  source: 'user' | 'official' | 'community';
  status: 'draft' | 'published';
  yaml: LevelData;           // exact shape of today's YAML files
  updatedAt: number;
};
```

Ship `LocalStorageLevelStorage` now. When you move to a server, add `ApiLevelStorage` behind the same interface. The home page can then aggregate: Official (from /public/levels) + Community (API) + My Levels (localStorage).

localStorage key: `pwd:editor:levels:v1` (versioned so future schema changes can migrate cleanly).

### Type model

`LevelData` is the YAML schema, mirroring [grid.tsx](src/components/grid.tsx) and [model.py](public/python/model.py):

```ts
type LevelData = {
  id?: number | string;
  title?: string;
  homepage_intro?: string;
  tags?: string[];
  description?: string;
  spawn: { x: number; y: number; z: number };
  orientation?: number;
  solve_conditions: { finish_block: boolean; collected_coins: number };
  layers: Record<string, string[][]>;   // layer_N → [z][x]
  procedural?: unknown[];                // preserved on import, not authored
};
```

### Editor UI layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Save] [Test Play] [Export YAML] [Import YAML]    [← back]  │
├────────────────┬─────────────────────────────────────────────┤
│  Blocks        │                                             │
│  [grass][dirt] │                                             │
│  [stone][tree] │                                             │
│  [portal][air] │             3D Canvas                       │
│                │       (reuses BLOCK_REGISTRY components)    │
│  Tool: ●Paint  │                                             │
│        ○Erase  │                                             │
│        ○Spawn  │                                             │
│                │                                             │
│  Layer (Y):    │                                             │
│  [0 1 2●3 4]   │                                             │
│                │                                             │
│  ▾ Metadata    │                                             │
│    title       │                                             │
│    tags        │                                             │
│    description │                                             │
│    solve_cond. │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

**Painting model:** layer-locked. The active Y level is set by the slider. A transparent build plane at that Y catches clicks on empty cells. Clicking an existing block's face places adjacent (face normal → neighbor coord). Right-click or Shift+click deletes. The drone preview is hidden in edit mode.

**Validation:** soft warnings via `placementValidOn` from BLOCK_REGISTRY (red ghost, but click is still allowed — author override). Hard constraints: exactly one spawn, exactly one finish_portal (placing a second replaces the first).

### Test Play bridge

The minimal refactor: [grid.tsx](src/components/grid.tsx) currently fetches its YAML by `levelId`. Make it accept an optional `levelData` prop and prefer that over fetching:

```tsx
<Grid levelData={editorLevel} onLevelLoaded={...} />   // editor path
<Grid levelId={levelId} onLevelLoaded={...} />         // existing game path
```

The Pyodide worker already reads from `window.getLevelData()` ([usePyodideWorker.ts:58](src/hooks/usePyodideWorker.ts#L58)), which Grid sets regardless of source. Test Play then becomes a modal containing `<Scene levelData={...} />` and the existing `<CodeCard>` — full code + run loop without leaving the editor.

## File map

### New files

| Path | Purpose |
|---|---|
| `src/types/level.ts` | Shared `LevelData` and `StoredLevel` types |
| `src/lib/level-storage.ts` | Storage interface + localStorage implementation + UUID helper |
| `src/app/editor/page.tsx` | Library page: list, new, import |
| `src/app/editor/edit/page.tsx` | Editor entry, reads `?id` from URL |
| `src/components/editor/editor-scene.tsx` | 3D canvas with voxel painting interaction |
| `src/components/editor/block-palette.tsx` | Block picker grid |
| `src/components/editor/tool-panel.tsx` | Paint/Erase/Spawn tool toggle + Y layer slider |
| `src/components/editor/metadata-form.tsx` | Title/tags/description/spawn/solve_conditions inputs |
| `src/components/editor/test-play-modal.tsx` | Modal hosting Scene + CodeCard with editor's in-memory level |
| `src/components/editor/yaml-io.ts` | js-yaml.dump/load helpers + YAML file download |

### Modified files

| Path | Change |
|---|---|
| `src/components/app-sidebar.tsx` | Add "Level Editor" entry |
| `src/components/grid.tsx` | Accept optional `levelData` prop, prefer over fetch |
| `src/components/scene.tsx` | Accept optional `levelData` prop, forward to Grid (no behavior change for existing game route) |

## Build order

1. **Foundation** — types, storage, sidebar entry. Low risk, no UI yet.
2. **Grid/Scene refactor** — make level data injectable. Verify existing game route still works.
3. **Library page** — list/new/import/delete. Storage round-trip without an actual editor yet.
4. **Editor scaffolding** — page route, metadata form, save/load round-trip via storage.
5. **Voxel painter** — the 3D interaction. Probably the largest piece.
6. **Test Play modal** — wire editor state into Scene + Pyodide.
7. **YAML import/export polish** — drag-and-drop import, validation messages.

## Out of scope (v2+)

- Procedural rules authoring (UI for `procedural:` blocks — preserved on import/export but not editable)
- Server backend / community submissions (storage interface is ready; just needs `ApiLevelStorage`)
- Undo/redo
- "Copy from existing official level" template
- Drag-to-paint extrusion (paint multiple blocks in one drag)
- Custom map dimensions in-editor (v1: ask for width/depth/height at "New Level" time)
- Inline 2D mini-map per layer

## Validation rules (v1)

| Rule | Severity |
|---|---|
| Exactly one spawn position must be set | Block save |
| Exactly one finish_portal block | Warn on save |
| Block must satisfy `placementValidOn` of its support block below | Warn during painting (red ghost), allow override |
| Spawn block at spawn coordinates must be non-collidable | Warn on save |
| Level must have at least `layer_0` populated | Block save |

## Storage versioning

The localStorage payload includes a `version: 1` field at the top level. Future migrations live in `level-storage.ts` and run on `list()`/`get()`.
