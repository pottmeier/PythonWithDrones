"""Tests for public/python/model.py -- LevelModel."""

import model


def make_level(layers, registry=None, collected_coins=0):
    return model.LevelModel(
        description="test",
        spawn=model.Spawn(x=0, y=0, z=0),
        solve_conditions=model.SolveConditions(collected_coins=collected_coins),
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


# ---------------------------------------------------------------------------
# SolveConditions.unmet_reasons
# ---------------------------------------------------------------------------

class TestSolveConditionsUnmetReasons:
    def _satisfied_kwargs(self):
        return dict(coins_collected=0, delivered=True, push_target_reached=True)

    def test_no_conditions_configured_is_solved(self):
        conditions = model.SolveConditions()
        assert conditions.unmet_reasons(**self._satisfied_kwargs()) == []

    def test_missing_coins_reported(self):
        conditions = model.SolveConditions(collected_coins=2)
        kwargs = self._satisfied_kwargs()
        reasons = conditions.unmet_reasons(**{**kwargs, "coins_collected": 0})
        assert "Need 2 more coin(s)" in reasons

    def test_missing_delivery_reported(self):
        conditions = model.SolveConditions(requires_delivery=True)
        kwargs = self._satisfied_kwargs()
        reasons = conditions.unmet_reasons(**{**kwargs, "delivered": False})
        assert any("delivered" in r for r in reasons)

    def test_missing_push_target_reported(self):
        conditions = model.SolveConditions(push_target=[1, 1, 1])
        kwargs = self._satisfied_kwargs()
        reasons = conditions.unmet_reasons(**{**kwargs, "push_target_reached": False})
        assert any("target" in r for r in reasons)

    def test_push_target_not_configured_is_never_unmet(self):
        conditions = model.SolveConditions(push_target=None)
        kwargs = self._satisfied_kwargs()
        reasons = conditions.unmet_reasons(**{**kwargs, "push_target_reached": False})
        assert reasons == []

    def test_multiple_unmet_conditions_all_reported(self):
        conditions = model.SolveConditions(
            collected_coins=1,
            requires_delivery=True,
            push_target=[1, 1, 1],
        )
        reasons = conditions.unmet_reasons(
            coins_collected=0, delivered=False, push_target_reached=False
        )
        assert len(reasons) == 3

    def test_all_conditions_satisfied_is_solved(self):
        conditions = model.SolveConditions(
            collected_coins=1,
            requires_delivery=True,
            push_target=[1, 1, 1],
        )
        reasons = conditions.unmet_reasons(
            coins_collected=1, delivered=True, push_target_reached=True
        )
        assert reasons == []


# ---------------------------------------------------------------------------
# SolveConditions.infer_from_layers
# ---------------------------------------------------------------------------

class TestSolveConditionsInferFromLayers:
    def test_no_relevant_blocks_infers_nothing_required(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["grass", "dirt"]]}
        )
        assert conditions.collected_coins == 0
        assert conditions.requires_delivery is False
        assert conditions.push_target is None

    def test_coins_are_counted(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["coin", "coin", "grass"]]}
        )
        assert conditions.collected_coins == 2

    def test_package_and_delivery_pad_together_require_delivery(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["package", "delivery_pad"]]}
        )
        assert conditions.requires_delivery is True

    def test_package_alone_does_not_require_delivery(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["package", "grass"]]}
        )
        assert conditions.requires_delivery is False

    def test_delivery_pad_alone_does_not_require_delivery(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["delivery_pad", "grass"]]}
        )
        assert conditions.requires_delivery is False

    def test_movable_block_and_push_target_together_infer_target_position(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["movable_block", "push_target"]]}
        )
        assert conditions.push_target == [1, 0, 0]

    def test_movable_block_alone_does_not_require_push(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["movable_block", "grass"]]}
        )
        assert conditions.push_target is None

    def test_push_target_alone_does_not_require_push(self):
        conditions = model.SolveConditions.infer_from_layers(
            {"layer_0": [["push_target", "grass"]]}
        )
        assert conditions.push_target is None


# ---------------------------------------------------------------------------
# LevelModel solve_conditions resolution (inferred vs explicit merge)
# ---------------------------------------------------------------------------

class TestLevelModelSolveConditionsResolution:
    def _level(self, layers, solve_conditions=None):
        kwargs = dict(
            description="test",
            spawn=model.Spawn(x=0, y=0, z=0),
            layers=layers,
        )
        if solve_conditions is not None:
            kwargs["solve_conditions"] = solve_conditions
        return model.LevelModel(**kwargs)

    def test_omitted_solve_conditions_is_fully_inferred(self):
        level = self._level({"layer_0": [["coin", "package", "delivery_pad"]]})
        assert level.solve_conditions.collected_coins == 1
        assert level.solve_conditions.requires_delivery is True

    def test_explicit_field_overrides_inferred_value(self):
        # 3 coins placed, but the level only requires 1 -- the explicit
        # value wins for that field.
        level = self._level(
            {"layer_0": [["coin", "coin", "coin"]]},
            solve_conditions=model.SolveConditions(collected_coins=1),
        )
        assert level.solve_conditions.collected_coins == 1

    def test_unset_fields_in_partial_solve_conditions_are_still_inferred(self):
        # Only collected_coins is explicitly set; requires_delivery should
        # still be inferred from the layout.
        level = self._level(
            {"layer_0": [["coin", "package", "delivery_pad"]]},
            solve_conditions=model.SolveConditions(collected_coins=1),
        )
        assert level.solve_conditions.collected_coins == 1
        assert level.solve_conditions.requires_delivery is True

    def test_empty_layout_with_no_solve_conditions_requires_nothing(self):
        level = self._level({"layer_0": [["grass", "grass"]]})
        assert level.solve_conditions.collected_coins == 0
        assert level.solve_conditions.requires_delivery is False
        assert level.solve_conditions.push_target is None
