"""Tests for public/python/game.py -- Drone and initialize_level."""

import game
from conftest import ToPy


class TestDroneInit:
    def test_defaults(self, make_drone):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        assert drone.dir == 0
        assert drone.is_dead is False
        assert drone.coins_collected == 0


class TestResetToSpawn:
    def test_dict_spawn(self, make_drone, actions):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 2, "y": 1, "z": 3})
        assert (drone.x, drone.y, drone.z) == (2.0, 1.0, 3.0)
        assert drone.dir == 0
        assert drone.is_dead is False
        assert actions[-1] == {"type": "reset", "pos": [2.0, 1.0, 3.0], "dir": 0}

    def test_object_style_spawn(self, make_level):
        level = make_level({"layer_0": [["grass"]]}, spawn={"x": 1, "y": 0, "z": 1})
        drone = game.Drone(level.spawn)  # model.Spawn exposes .x/.y/.z as attributes
        drone.level_data = level
        drone.reset_to_spawn()
        assert (drone.x, drone.y, drone.z) == (1.0, 0.0, 1.0)

    def test_resets_death_and_direction(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["empty"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.turn_right()
        drone.move()  # crashes into "empty" ahead
        assert drone.is_dead is True
        drone.reset_to_spawn()
        assert drone.is_dead is False
        assert drone.dir == 0


class TestSendAction:
    def test_forwards_to_js_bridge(self, make_drone, actions):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        drone.__send_action__({"type": "custom", "value": 1})
        assert actions[-1] == {"type": "custom", "value": 1}


class TestMove:
    def test_successful_move_updates_position_and_sends_action(self, make_drone, actions):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["air"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()
        assert (drone.x, drone.y, drone.z) == (0, 1, 0)
        assert actions[-1] == {"type": "move", "target": [0, 1, 0]}

    def test_move_into_collidable_block_crashes(self, make_drone, actions):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["empty"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()
        assert drone.is_dead is True
        assert (drone.x, drone.z) == (0, 1)  # stayed put
        crash = [a for a in actions if a["type"] == "crash"][0]
        assert crash["vector"] == [0, 0, -1]
        assert crash["landingY"] == 0 + 0.62  # grass directly below the drone

    def test_no_op_once_dead(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["empty"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()  # crashes
        pos_before = drone.get_position()
        drone.move()
        assert drone.get_position() == pos_before


class TestAttemptMove:
    def test_direct_call_matches_move_semantics(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["air"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.__attempt_move__(0, 0, -1)
        assert (drone.x, drone.y, drone.z) == (0, 1, 0)


class TestUpDown:
    def test_up_moves_vertically(self, make_drone):
        drone = make_drone({"layer_0": [["air"]], "layer_1": [["air"]]}, spawn={"x": 0, "y": 0, "z": 0})
        drone.up()
        assert (drone.x, drone.y, drone.z) == (0, 1, 0)

    def test_down_moves_vertically(self, make_drone):
        drone = make_drone({"layer_0": [["air"]], "layer_1": [["air"]]}, spawn={"x": 0, "y": 1, "z": 0})
        drone.down()
        assert (drone.x, drone.y, drone.z) == (0, 0, 0)


class TestCoinPickup:
    def test_flying_over_coin_increments_counter_and_clears_cell(self, make_drone, actions):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["coin"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()
        assert drone.coins_collected == 1
        assert drone.level_data.get_block_id(0, 1, 0) == "air"
        collect = [a for a in actions if a["type"] == "collect_coin"][0]
        assert collect == {"type": "collect_coin", "pos": [0, 1, 0], "total": 1}

    def test_second_coin_increments_again(self, make_drone):
        drone = make_drone(
            {
                "layer_0": [["grass"], ["grass"], ["grass"]],
                "layer_1": [["coin"], ["coin"], ["air"]],
            },
            spawn={"x": 0, "y": 1, "z": 2},
        )
        drone.move()
        drone.move()
        assert drone.coins_collected == 2


class TestGoal:
    def test_goal_fires_when_coins_satisfied(self, make_drone, actions):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["finish_portal"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
            collected_coins=0,
        )
        drone.move()
        assert any(a["type"] == "goal" for a in actions)
        assert drone.at_portal() is True

    def test_goal_withheld_and_hint_sent_when_coins_missing(self, make_drone, actions):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["finish_portal"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
            collected_coins=1,
        )
        drone.move()
        assert not any(a["type"] == "goal" for a in actions)
        hint = [a for a in actions if a["type"] == "hint"][0]
        assert "1 more coin" in hint["message"]
        assert drone.at_portal() is True  # standing on it, just not allowed to finish


class TestPush:
    def test_push_moves_block_and_advances_drone(self, make_drone, actions):
        drone = make_drone(
            {
                "layer_0": [["grass"], ["grass"], ["grass"]],
                "layer_1": [["air"], ["movable_block"], ["air"]],
            },
            spawn={"x": 0, "y": 1, "z": 2},
        )
        drone.push()
        assert (drone.x, drone.y, drone.z) == (0, 1, 1)
        assert drone.level_data.get_block_id(0, 1, 0) == "movable_block"
        assert drone.level_data.get_block_id(0, 1, 1) == "air"
        push_action = [a for a in actions if a["type"] == "push_block"][0]
        assert push_action == {"type": "push_block", "from": [0, 1, 1], "to": [0, 1, 0]}
        assert any(a["type"] == "move" and a["target"] == [0, 1, 1] for a in actions)

    def test_push_fails_when_nothing_pushable_ahead(self, make_drone, actions, capsys):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["air"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        actions.clear()  # drop the "reset" action from make_drone's own setup
        drone.push()
        assert drone.get_position() == {"x": 0.0, "y": 1.0, "z": 1.0}
        assert actions == []
        assert "Nothing pushable" in capsys.readouterr().out

    def test_push_fails_when_destination_blocked(self, make_drone, actions):
        drone = make_drone(
            {
                "layer_0": [["grass"], ["grass"], ["grass"]],
                "layer_1": [["grass"], ["movable_block"], ["air"]],
            },
            spawn={"x": 0, "y": 1, "z": 2},
        )
        actions.clear()  # drop the "reset" action from make_drone's own setup
        drone.push()
        assert drone.get_position() == {"x": 0.0, "y": 1.0, "z": 2.0}
        assert drone.level_data.get_block_id(0, 1, 1) == "movable_block"  # unmoved
        assert actions == []

    def test_push_is_noop_once_dead(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["empty"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()  # crash
        assert drone.is_dead is True
        drone.push()
        assert drone.get_position() == {"x": 0.0, "y": 1.0, "z": 1.0}


class TestTurns:
    def test_turn_left_cycles_backwards(self, make_drone):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        seq = []
        for _ in range(5):
            seq.append(drone.dir)
            drone.turn_left()
        assert seq == [0, 3, 2, 1, 0]

    def test_turn_right_cycles_forwards(self, make_drone):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        seq = []
        for _ in range(5):
            seq.append(drone.dir)
            drone.turn_right()
        assert seq == [0, 1, 2, 3, 0]

    def test_turns_are_noop_once_dead(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["empty"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        drone.move()
        assert drone.is_dead is True
        drone.turn_left()
        drone.turn_right()
        assert drone.dir == 0

    def test_turns_send_actions(self, make_drone, actions):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        drone.turn_right()
        assert actions[-1] == {"type": "turn", "direction": "right"}
        drone.turn_left()
        assert actions[-1] == {"type": "turn", "direction": "left"}


class TestGetters:
    def test_get_direction_strings(self, make_drone):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 0, "y": 0, "z": 0})
        names = []
        for _ in range(4):
            names.append(drone.get_direction())
            drone.turn_right()
        assert names == ["North", "East", "South", "West"]

    def test_get_position(self, make_drone):
        drone = make_drone({"layer_0": [["grass"]]}, spawn={"x": 3, "y": 1, "z": 2})
        assert drone.get_position() == {"x": 3.0, "y": 1.0, "z": 2.0}


class TestScan:
    def test_scan_default_distance_one(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"], ["grass"]], "layer_1": [["coin"], ["air"]]},
            spawn={"x": 0, "y": 1, "z": 1},
        )
        assert drone.scan() == ["coin"]

    def test_scan_stops_at_first_collidable(self, make_drone):
        drone = make_drone(
            {
                "layer_0": [["grass"], ["grass"], ["grass"]],
                "layer_1": [["grass"], ["air"], ["air"]],
            },
            spawn={"x": 0, "y": 1, "z": 2},
        )
        assert drone.scan(distance=5) == ["air", "grass"]

    def test_scan_respects_distance(self, make_drone):
        drone = make_drone(
            {
                "layer_0": [["grass"], ["grass"], ["grass"]],
                "layer_1": [["air"], ["air"], ["air"]],
            },
            spawn={"x": 0, "y": 1, "z": 2},
        )
        assert drone.scan(distance=1) == ["air"]
        assert drone.scan(distance=2) == ["air", "air"]

    def test_scan_off_the_negative_edge_is_empty(self, make_drone):
        # regression test for the get_block_id negative-index wraparound bug
        drone = make_drone(
            {"layer_0": [["grass", "grass"]], "layer_1": [["air", "air"]]},
            spawn={"x": 0, "y": 1, "z": 0},
            dir_=3,  # facing West, straight off the west edge
        )
        assert drone.scan(distance=2) == ["empty"]


class TestAtPortal:
    def test_true_on_finish_portal(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"]], "layer_1": [["finish_portal"]]},
            spawn={"x": 0, "y": 1, "z": 0},
        )
        assert drone.at_portal() is True

    def test_false_elsewhere(self, make_drone):
        drone = make_drone(
            {"layer_0": [["grass"]], "layer_1": [["air"]]},
            spawn={"x": 0, "y": 1, "z": 0},
        )
        assert drone.at_portal() is False


class TestInitializeLevel:
    def test_sets_up_module_globals(self, registry):
        layers = {"layer_0": [["grass", "grass"]], "layer_1": [["air", "finish_portal"]]}
        level_dict = {
            "description": "d",
            "spawn": {"x": 0, "y": 1, "z": 0},
            "solve_conditions": {"finish_block": True, "collected_coins": 0},
            "layers": layers,
        }
        game.initialize_level(
            spawn=level_dict["spawn"],
            registry=ToPy(registry),
            generated_level=ToPy(level_dict),
        )
        assert game.block_registry == registry
        assert game.drone is not None
        assert game.drone.get_position() == {"x": 0.0, "y": 1.0, "z": 0.0}
        assert game.drone.at_portal() is False
