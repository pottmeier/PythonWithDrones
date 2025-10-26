from python_with_drones import drone
import pytest


@pytest.mark.parametrize("input,expected", [("left","left"),("right","right"),("up","up"),("down","down")])
def test_move(input, expected):
    assert drone.move(input) == expected
