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
3. Update `NUM_LEVELS` constant in both `src/components/scene.tsx` and `src/app/leaderboard/leaderboardContent.tsx`
4. Add `{ id: "N" }` to the hardcoded `levels` array in `src/app/level/[id]/page.tsx` (feeds `generateStaticParams` for the static export *and* gates the page itself — `LevelPage` renders "Level nicht gefunden" for any id not in this array, in both dev and prod)

### Python Game Logic

`public/python/game.py` — `Drone` class with `move()`, `up()`, `down()`, `turn_left()`, `turn_right()`, `push()`, `pickup()`, `deliver()`, `scan()`, `get_direction()`, `get_position()`, `at_goal()`, `reset_to_spawn()`. User code runs with `exec(user_code, game.__dict__)` so the `drone` instance is directly accessible in user scripts.

`public/python/model.py` — Pydantic `LevelModel` with collision detection and floor-finding logic.

### Leaderboard (optional)

Scores are submitted to a MongoDB Atlas HTTP endpoint. Config lives in `.env.local` (see `.env.local.example`). If `NEXT_PUBLIC_ATLAS_ENDPOINT` / `NEXT_PUBLIC_ATLAS_API_KEY` are not set, all leaderboard calls are silently skipped — the game works without it.

### Deployment

`next.config.ts` detects `GITHUB_ACTIONS=true` to set `basePath=/PythonWithDrones`. All internal links and asset fetches use `process.env.NEXT_PUBLIC_BASE_PATH` as a prefix to support both local dev and the GitHub Pages subdirectory.
