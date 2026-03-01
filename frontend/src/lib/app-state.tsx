export type LevelStatus = "locked" | "unlocked" | "completed";

// This constant needs to be present for localStorage
// TODO: Please add the level that needs to be represented, by adding it to the list.
const INITIAL_LEVELS: Record<number, LevelProgress> = {
  1: {
    status: "unlocked",
    code: "#start here...",
  },
  2: {
    status: "locked",
    code: "#start here...",
  },
  3: {
    status: "locked",
    code: "#start here...",
  },
  4: {
    status: "locked",
    code: "#start here...",
  },
  5: {
    status: "locked",
    code: "#start here...",
  },
  6: {
    status: "locked",
    code: "#start here...",
  },
};

export type LevelProgress = {
  status: LevelStatus;
  code: string;
};

export type AppState = {
  user: { username: string };
  progress: {
    levels: Record<number, LevelProgress>;
  };
};

export const defaultState: AppState = {
  user: { username: "" },
  progress: { levels: {} },
};

const STORAGE_KEY = "appState";

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const firstState: AppState = {
        ...defaultState,
        progress: {
          levels: INITIAL_LEVELS,
        },
      };
      saveState(firstState);
      return firstState;
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;

    const merged: AppState = {
      ...defaultState,
      ...parsed,
      user: { ...defaultState.user, ...(parsed.user ?? {}) },
      progress: {
        ...defaultState.progress,
        ...(parsed.progress ?? {}),
        levels: {
          ...INITIAL_LEVELS,
          ...(parsed.progress?.levels ?? {}),
        },
      },
    };

    saveState(merged);
    return merged;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateState(updater: (prev: AppState) => AppState): AppState {
  const prev = loadState();
  const next = updater(prev);
  saveState(next);
  return next;
}

export function saveLevelProgress(
  levelId: number,
  data: Partial<LevelProgress>
): AppState {
  return updateState((prev) => {
    const current = prev.progress.levels[levelId] ?? {
      status: "unlocked" as LevelStatus,
      code: "",
      updatedAt: Date.now(),
    };

    return {
      ...prev,
      progress: {
        ...prev.progress,
        levels: {
          ...prev.progress.levels,
          [levelId]: {
            ...current,
            ...data,
            updatedAt: Date.now(),
          },
        },
      },
    };
  });
}