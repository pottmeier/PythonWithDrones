export type ScoreEntry = {
  username: string;
  levelId: number;
  firstTimeMs: number;
  steps: number | null;
  linesOfCode: number | null;
  createdAt: string;
};

export type AttemptEntry = {
  timeMs: number;
  steps: number;
  linesOfCode: number;
  createdAt: string;
};

export type AuthResult = {
  token: string;
  username: string;
};

const BASE = process.env.NEXT_PUBLIC_LEADERBOARD_URL ?? "";

// Returns null if the leaderboard feature isn't configured for this
// deployment (no BASE URL). Throws if BASE is configured but the request
// itself fails (backend unreachable) -- callers decide how to distinguish
// "not configured" from "configured but down".
async function apiFetch(path: string, options?: RequestInit): Promise<Response | null> {
  if (!BASE) return null;
  return fetch(`${BASE}${path}`, options);
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResult | string | null> {
  let res: Response | null;
  try {
    res = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }).toString(),
    });
  } catch {
    return null;
  }
  if (!res) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return data.detail ?? "Registration failed";
  }
  const data = await res.json();
  return { token: data.access_token, username: data.username };
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult | string | null> {
  let res: Response | null;
  try {
    res = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }).toString(),
    });
  } catch {
    return null;
  }
  if (!res) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return data.detail ?? "Login failed";
  }
  const data = await res.json();
  return { token: data.access_token, username: data.username };
}

export async function submitScore(
  token: string,
  levelId: number,
  timeMs: number,
  steps: number,
  linesOfCode: number,
): Promise<void> {
  try {
    await apiFetch("/leaderboard/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        level_id: levelId,
        time_ms: timeMs,
        steps,
        lines_of_code: linesOfCode,
      }),
    });
  } catch {
    // best-effort; a submission failing silently matches prior behavior
  }
}

type ScoreEntryResponse = {
  username: string;
  level_id: number;
  first_time_ms: number;
  steps: number | null;
  lines_of_code: number | null;
  created_at: string;
};

type AttemptEntryResponse = {
  time_ms: number;
  steps: number;
  lines_of_code: number;
  created_at: string;
};

// null return means "couldn't load" (unreachable backend or an error
// response) so the UI can show a distinct error state; an empty array means
// the backend was reached successfully and there's genuinely nothing there
// (this also covers the leaderboard feature not being configured at all,
// which should stay silent rather than look like an error).
export async function getLeaderboard(levelId: number): Promise<ScoreEntry[] | null> {
  let res: Response | null;
  try {
    res = await apiFetch(`/leaderboard?level_id=${levelId}`);
  } catch {
    return null;
  }
  if (!res) return [];
  if (!res.ok) return null;
  const rows: ScoreEntryResponse[] = await res.json();
  return rows.map((r) => ({
    username: r.username,
    levelId: r.level_id,
    firstTimeMs: r.first_time_ms,
    steps: r.steps ?? null,
    linesOfCode: r.lines_of_code ?? null,
    createdAt: r.created_at,
  }));
}

export async function getHistory(
  token: string,
  levelId: number,
): Promise<AttemptEntry[] | null> {
  let res: Response | null;
  try {
    res = await apiFetch(`/leaderboard/history?level_id=${levelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
  if (!res) return [];
  if (!res.ok) return null;
  const rows: AttemptEntryResponse[] = await res.json();
  return rows.map((r) => ({
    timeMs: r.time_ms,
    steps: r.steps,
    linesOfCode: r.lines_of_code,
    createdAt: r.created_at,
  }));
}
