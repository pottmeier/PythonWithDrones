"""
Test harness for frontend/public/python/game.py and model.py.

Those modules run inside a Pyodide WebWorker in production, where a `js`
module is injected by the runtime (see frontend/public/py-worker.js).
Outside the browser there is no such module, so we install a fake one
before anything imports game.py, and make its Drone.__send_action__
calls observable via the `actions` fixture below.
"""

import sys
import types
from pathlib import Path

import pytest

PYTHON_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "python"
if str(PYTHON_DIR) not in sys.path:
    sys.path.insert(0, str(PYTHON_DIR))

_recorded_actions = []

if "js" not in sys.modules:
    fake_js = types.ModuleType("js")
    fake_js.post_action_to_main = lambda action: _recorded_actions.append(dict(action))
    sys.modules["js"] = fake_js

import game  # noqa: E402  (must import after the `js` shim is installed)
import model  # noqa: E402


# Mirrors src/lib/block-registry.tsx -- keep the isCollidable/isPushable/
# isPickable flags in sync with that file when block types change.
BLOCK_REGISTRY = {
    "grass": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "dirt": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "stone": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "stone_pillar": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "tree_trunk": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "tree_leaves": {"isCollidable": True, "isDestructible": True, "isPickable": False},
    "finish_portal": {"isCollidable": False, "isFinish": True, "isDestructible": False, "isPickable": False},
    "coin": {"isCollidable": False, "isDestructible": False, "isPickable": True},
    "movable_block": {"isCollidable": True, "isDestructible": False, "isPickable": False, "isPushable": True},
    "package": {"isCollidable": False, "isDestructible": False, "isPickable": True},
    "push_target": {"isCollidable": False, "isDestructible": False, "isPickable": False},
    "delivery_pad": {"isCollidable": False, "isDestructible": False, "isPickable": False},
    "empty": {"isCollidable": True, "isDestructible": False, "isPickable": False},
    "air": {"isCollidable": False, "isDestructible": False, "isPickable": False},
}


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    """Drone.__send_action__ sleeps 0.1s per action to keep infinite loops
    from locking the UI; that's pointless overhead in a test suite."""
    monkeypatch.setattr(game.time, "sleep", lambda *a, **k: None)


@pytest.fixture
def actions():
    """The list of JS actions (dicts) sent via js.post_action_to_main
    during the current test, in order."""
    _recorded_actions.clear()
    yield _recorded_actions


@pytest.fixture
def registry():
    return dict(BLOCK_REGISTRY)


@pytest.fixture
def make_level(registry):
    """Build a real LevelModel from a plain layers dict, and point
    game.block_registry at the fixture registry for the duration of the
    test (Drone methods read the module-level game.block_registry)."""

    def _make(
        layers,
        spawn=None,
        collected_coins=0,
        requires_delivery=False,
        push_target=None,
    ):
        level = model.LevelModel(
            description="test level",
            spawn=model.Spawn(**(spawn or {"x": 0, "y": 0, "z": 0})),
            solve_conditions=model.SolveConditions(
                collected_coins=collected_coins,
                requires_delivery=requires_delivery,
                push_target=push_target,
            ),
            layers=layers,
        )
        game.block_registry = registry
        return level

    return _make


@pytest.fixture
def make_drone(make_level):
    """Build a Drone wired up to a fresh LevelModel and spawned at the
    given position (defaults to the level's own spawn)."""

    def _make(
        layers,
        spawn=None,
        collected_coins=0,
        requires_delivery=False,
        push_target=None,
        dir_=0,
    ):
        level = make_level(
            layers,
            spawn=spawn,
            collected_coins=collected_coins,
            requires_delivery=requires_delivery,
            push_target=push_target,
        )
        drone = game.Drone(level.spawn)
        drone.level_data = level
        drone.reset_to_spawn()
        drone.dir = dir_
        return drone

    return _make
