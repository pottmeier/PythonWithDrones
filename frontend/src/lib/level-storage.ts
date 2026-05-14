import type { LevelData, StoredLevel } from "@/types/level";

export interface LevelStorage {
  list(): Promise<StoredLevel[]>;
  get(id: string): Promise<StoredLevel | null>;
  save(level: StoredLevel): Promise<void>;
  delete(id: string): Promise<void>;
}

const STORAGE_KEY = "pwd:editor:levels:v1";

type PersistedShape = {
  version: 1;
  levels: Record<string, StoredLevel>;
};

function emptyShape(): PersistedShape {
  return { version: 1, levels: {} };
}

function readAll(): PersistedShape {
  if (typeof window === "undefined") return emptyShape();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyShape();
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    if (parsed.version !== 1 || !parsed.levels) return emptyShape();
    return { version: 1, levels: parsed.levels };
  } catch {
    return emptyShape();
  }
}

function writeAll(shape: PersistedShape) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
}

export class LocalStorageLevelStorage implements LevelStorage {
  async list(): Promise<StoredLevel[]> {
    const shape = readAll();
    return Object.values(shape.levels).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  async get(id: string): Promise<StoredLevel | null> {
    const shape = readAll();
    return shape.levels[id] ?? null;
  }

  async save(level: StoredLevel): Promise<void> {
    const shape = readAll();
    shape.levels[level.id] = { ...level, updatedAt: Date.now() };
    writeAll(shape);
  }

  async delete(id: string): Promise<void> {
    const shape = readAll();
    delete shape.levels[id];
    writeAll(shape);
  }
}

let _storage: LevelStorage | null = null;

export function getLevelStorage(): LevelStorage {
  if (!_storage) _storage = new LocalStorageLevelStorage();
  return _storage;
}

export function newLevelId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lvl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createStoredLevel(yaml: LevelData): StoredLevel {
  return {
    id: newLevelId(),
    source: "user",
    status: "draft",
    yaml,
    updatedAt: Date.now(),
  };
}
