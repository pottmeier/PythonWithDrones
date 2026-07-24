# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend commands run from `frontend/`:

```bash
cd frontend
npm run dev      # Start dev server on a fixed port (localhost:3005), bound to 0.0.0.0 so phones on the LAN can reach it at http://<this machine's LAN IP>:3005
npm run build    # Static export → frontend/out/
npm run lint     # ESLint
```

There are no frontend (TS/React) automated tests. The project is a static Next.js export deployed to GitHub Pages at `https://pottmeier.github.io/PythonWithDrones/`.

**Never run `npm audit fix --force` in `frontend/`.** Next pins `postcss` and `sharp` inside its own tree, so npm cannot patch them in-range and `--force` "resolves" the advisories by downgrading `next` to 9.3.3 — a 2020 release that drags in ~90 vulnerable transitive deps, whose only offered fix is upgrading back to next@16, which loops forever. Those two transitive pins are handled by an `overrides` block in `package.json` instead; plain `npm audit fix` is safe.

The full stack (frontend + API + Postgres) runs from the repo root:

```bash
docker compose up          # frontend :3005, api :8000, postgres :5432
```

Python tests run from the repo root:

```bash
pip install -r tests/requirements.txt -r leaderboard-api/requirements.txt
python3 -m pytest
```

- `tests/drone/` covers `frontend/public/python/game.py` and `model.py` (the drone/level logic that runs in the browser's Pyodide worker) by faking the `js` bridge module in `conftest.py`, so the game code imports and runs unmodified under plain CPython.
- `tests/leaderboard_api/` covers `leaderboard-api/app/` (the FastAPI auth + leaderboard backend) through an in-process ASGI client, against a throwaway sqlite database per test (production uses Postgres) via a `get_db` dependency override in `conftest.py`.

## Architecture

### Overview

An interactive Python learning app where users write Python code to pilot a 3D drone through puzzle levels. The key constraint: **all Python execution happens in the browser** via a Pyodide WebWorker, with no backend server. The app is a fully static export.

### Data Flow: Python → 3D Scene

1. The user writes Python in the `CodeCard` editor
2. On Run, `usePyodideWorker` posts the code to `public/py-worker.js` (a Web Worker)
3. The worker runs the code with Pyodide, which executes against `public/python/game.py`
4. Each drone action (move, turn, crash, goal) calls `js.post_action_to_main(action)`, posting a message back to the main thread
5. `usePyodideWorker` receives `ACTION` messages and calls `window.droneAction(action)`
6. The `Scene` component (`src/components/scene.tsx`) has registered `window.droneAction`, which pushes actions onto a GSAP animation queue
7. GSAP animates the Three.js drone model in `@react-three/fiber`

**Cross-boundary globals used as the bridge:**
- `window.droneAction(action)` — Scene registers this; worker calls it via the hook
- `window.resetScene()` — Scene registers this; reset button calls it
- `window.triggerDroneReset()` — `levelContent.tsx` registers this; Scene's reset button calls it
- `window.runPython(code)` — `levelContent.tsx` registers this; `CodeCard` calls it
- `window.getLevelData()` / `window.getBlockRegistry()` — `Grid` registers these; `usePyodideWorker.loadLevel()` reads them to pass level data into the worker

### Level Format

Levels are YAML files in `public/levels/Level_N.yaml`. Structure:
```yaml
spawn: { x: 0, y: 1, z: 8 }
solve_conditions:
  finish_block: true
  collected_coins: 0
layers:
  layer_0:          # Y=0 (ground)
    - [grass, grass, ...]   # rows = Z, cols = X
  layer_1:          # Y=1
    - [finish_portal, air, ...]
```

Block types are defined in `src/lib/block-registry.tsx`. Adding a new block type requires adding it to `BLOCK_REGISTRY` and creating a matching component in `src/components/animation/`.

### Adding a New Level

Four places must be updated in sync:
1. Create `public/levels/Level_N.yaml`
2. Add entry to `INITIAL_LEVELS` in `src/lib/app-state.tsx`
3. Update `NUM_LEVELS` constant in both `src/components/scene.tsx` and `src/app/leaderboard/leaderboardContent.tsx` — it gates how many level columns the leaderboard renders *and* which level triggers the "you finished the game" celebration in `scene.tsx`. Nothing enforces that it matches the number of YAML files, so it silently drifts.
4. Add `{ id: "N" }` to the hardcoded `levels` array in `src/app/level/[id]/page.tsx` — this feeds `generateStaticParams`, which under `output: export` is the *only* thing that decides which level pages exist at all.

That file also sets `export const dynamicParams = false`. Under `output: export` a dynamic route can only ever render params returned by `generateStaticParams()`, and without this flag the dev server throws a 500 (`Page "/level/[id]/page" is missing param …`) instead of showing the 404 page for e.g. `/level/99`. The `notFound()` call in `LevelPage` is unreachable as a runtime guard — Next rejects the unknown param before the component runs — but keep it, since `notFound()` returns `never` and is what narrows `level` from `{ id: string } | undefined` for TypeScript.

### Python Game Logic

`public/python/game.py` — `Drone` class with `move()`, `up()`, `down()`, `turn_left()`, `turn_right()`, `push()`, `pickup()`, `deliver()`, `scan()`, `get_direction()`, `get_position()`, `at_goal()`, `reset_to_spawn()`. User code runs with `exec(user_code, game.__dict__)` so the `drone` instance is directly accessible in user scripts.

`public/python/model.py` — Pydantic `LevelModel` with collision detection and floor-finding logic.

### Leaderboard (optional)

A self-hosted FastAPI + Postgres backend in `leaderboard-api/`, brought up with the other services via `docker-compose.yml` (frontend :3005, api :8000, postgres:16 with a `pgdata` volume and `init.sql` seeded on first boot).

- `leaderboard-api/app/database.py` — async SQLAlchemy against `DATABASE_URL` (`postgresql+asyncpg://…`). The variable is read at import time with `os.environ[...]`, so the API will not start without it.
- `leaderboard-api/app/main.py` — routes: `POST /auth/register`, `POST /auth/login`, `POST /leaderboard/submit`, `GET /leaderboard`, `GET /leaderboard/history`, `POST /admin/reset-password`.
- Auth is JWT (`JWT_SECRET`); the admin reset route is gated by `ADMIN_SECRET`. `CORS_ORIGINS` is a comma-separated allowlist.

The frontend talks to it through `src/lib/leaderboard-api.ts`, which reads a single variable: `NEXT_PUBLIC_LEADERBOARD_URL`. If it is unset, `apiFetch` returns `null` and every leaderboard call is silently skipped — the game works without a backend. Config lives in root `.env.example`; the frontend variable belongs in `frontend/.env.local` for local dev.

> There is no MongoDB anywhere in this project. If you find Atlas/Mongo references, they are leftovers from the pre-Postgres backend and should be removed.

### Deployment

`next.config.ts` detects `GITHUB_ACTIONS=true` to set `basePath=/PythonWithDrones`. All internal links and asset fetches use `process.env.NEXT_PUBLIC_BASE_PATH` as a prefix to support both local dev and the GitHub Pages subdirectory.
