export type ScoreEntry = {
  username: string;
  levelId: number;
  firstTimeMs: number;
};

export type AuthResult = {
  token: string;
  username: string;
};

const BASE = process.env.NEXT_PUBLIC_LEADERBOARD_URL ?? "";

async function apiFetch(path: string, options?: RequestInit): Promise<Response | null> {
  if (!BASE) return null;
  try {
    return await fetch(`${BASE}${path}`, options);
  } catch {
    return null;
  }
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResult | string | null> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }).toString(),
  });
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
  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }).toString(),
  });
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
): Promise<void> {
  await apiFetch("/leaderboard/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ level_id: levelId, time_ms: timeMs }),
  });
}

export async function getLeaderboard(levelId: number): Promise<ScoreEntry[]> {
  const res = await apiFetch(`/leaderboard?level_id=${levelId}`);
  if (!res || !res.ok) return [];
  const rows = await res.json();
  return rows.map((r: any) => ({
    username: r.username,
    levelId: r.level_id,
    firstTimeMs: r.first_time_ms,
  }));
}
