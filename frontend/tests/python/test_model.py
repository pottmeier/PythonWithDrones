"""Tests for public/python/model.py -- LevelModel."""

import model


def make_level(layers, registry=None, collected_coins=0):
    return model.LevelModel(
        description="test",
        spawn=model.Spawn(x=0, y=0, z=0),
        solve_conditions=model.SolveConditions(finish_block=True, collected_coins=collected_coins),
        layers=layers,
    )


# ---------------------------------------------------------------------------
# get_block_id
# ---------------------------------------------------------------------------

class TestGetBlockId:
    def test_returns_block_at_coordinate(self):
        level = make_level({"layer_0": [["grass", "dirt"], ["stone", "air"]]})
        assert level.get_block_id(0, 0, 0) == "grass"
        assert level.get_block_id(1, 0, 0) == "dirt"
        assert level.get_block_id(0, 0, 1) == "stone"
        assert level.get_block_id(1, 0, 1) == "air"

    def test_truncates_float_coordinates(self):
        level = make_level({"layer_0": [["grass", "dirt"]]})
        assert level.get_block_id(1.9, 0.9, 0.1) == "dirt"

    def test_unknown_layer_is_empty(self):
        level = make_level({"layer_0": [["grass"]]})
        assert level.get_block_id(0, 5, 0) == "empty"

    def test_positive_overflow_is_empty(self):
        level = make_level({"layer_0": [["grass", "dirt"]]})
        assert level.get_block_id(5, 0, 0) == "empty"
        assert level.get_block_id(0, 0, 5) == "empty"

    def test_negative_coordinates_are_empty_not_wrapped(self):
        # regression test: python list indexing silently wraps negative
        # indices to the opposite edge (list[-1] == last element) unless
        # explicitly guarded against, which would leak whatever block sits
        # on the far edge instead of correctly reporting "out of bounds"
        level = make_level({"layer_0": [["grass", "dirt"], ["stone", "air"]]})
        assert level.get_block_id(-1, 0, 0) == "empty"
        assert level.get_block_id(0, 0, -1) == "empty"
        assert level.get_block_id(0, -1, 0) == "empty"
        assert level.get_block_id(-1, -1, -1) == "empty"


# ---------------------------------------------------------------------------
# is_block_collidable
# ---------------------------------------------------------------------------

class TestIsBlockCollidable:
    def test_non_collidable_block(self, registry):
        level = make_level({"layer_0": [["air", "air"]]})
        assert level.is_block_collidable(0, 0, 0, registry) is False

    def test_collidable_block(self, registry):
        level = make_level({"layer_0": [["grass", "grass"]]})
        assert level.is_block_collidable(0, 0, 0, registry) is True

    def test_out_of_bounds_is_collidable(self, registry):
        level = make_level({"layer_0": [["air", "air"]]})
        assert level.is_block_collidable(5, 0, 0, registry) is True
        assert level.is_block_collidable(-1, 0, 0, registry) is True
        assert level.is_block_collidable(0, 5, 0, registry) is True

    def test_unknown_block_id_defaults_collidable(self, registry):
        level = make_level({"layer_0": [["mystery_block"]]})
        assert level.is_block_collidable(0, 0, 0, registry) is True

    def test_missing_layer_0_defaults_collidable(self, registry):
        level = make_level({"layer_1": [["air"]]})
        assert level.is_block_collidable(0, 1, 0, registry) is True


# ---------------------------------------------------------------------------
# get_floor
# ---------------------------------------------------------------------------

class TestGetFloor:
    def test_finds_first_collidable_block_below(self, registry):
        level = make_level({
            "layer_0": [["grass"]],
            "layer_1": [["air"]],
            "layer_2": [["air"]],
        })
        assert level.get_floor(0, 2, 0, registry) == 0 + 0.62

    def test_stops_at_nearest_collidable_layer(self, registry):
        level = make_level({
            "layer_0": [["grass"]],
            "layer_1": [["stone"]],
            "layer_2": [["air"]],
        })
        assert level.get_floor(0, 2, 0, registry) == 1 + 0.62

    def test_no_collidable_block_returns_zero(self, registry):
        level = make_level({"layer_0": [["air"]], "layer_1": [["air"]]})
        assert level.get_floor(0, 1, 0, registry) == 0.0


# ---------------------------------------------------------------------------
# set_block_id / move_block
# ---------------------------------------------------------------------------

class TestSetBlockId:
    def test_overwrites_the_target_cell(self):
        level = make_level({"layer_0": [["grass", "grass"]]})
        level.set_block_id(1, 0, 0, "air")
        assert level.get_block_id(1, 0, 0) == "air"
        assert level.get_block_id(0, 0, 0) == "grass"

    def test_out_of_bounds_is_a_silent_noop(self):
        level = make_level({"layer_0": [["grass"]]})
        level.set_block_id(5, 0, 0, "air")
        level.set_block_id(-1, 0, 0, "air")
        level.set_block_id(0, 5, 0, "air")
        assert level.get_block_id(0, 0, 0) == "grass"


class TestMoveBlock:
    def test_moves_block_and_clears_source(self):
        level = make_level({"layer_0": [["movable_block", "air"]]})
        level.move_block(0, 0, 0, 1, 0, 0)
        assert level.get_block_id(0, 0, 0) == "air"
        assert level.get_block_id(1, 0, 0) == "movable_block"

    def test_moving_from_empty_cell_propagates_empty(self):
        level = make_level({"layer_0": [["air", "grass"]]})
        level.move_block(0, 0, 0, 1, 0, 0)
        assert level.get_block_id(1, 0, 0) == "air"
