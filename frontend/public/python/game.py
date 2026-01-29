import js
import time

_x = float(js.initial_spawn.x)
_y = float(js.initial_spawn.y)
_z = float(js.initial_spawn.z)
_dir = 0  # 0: North, 1: East, 2: South, 3: West

# North (0, 0, -1), East (1, 0, 0), South (0, 0, 1), West (-1, 0, 0)
_VECTORS = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]]

# Bridge to the Worker JS
def _send_action(action):
    js.post_action_to_main(action)
    time.sleep(0.01) # prevent lags in infinite loops

# --- PUBLIC API FOR THE PLAYER ---

def move():
    global _x, _y, _z
    dx, dy, dz = _VECTORS[_dir]
    _x += dx
    _y += dy
    _z += dz
    _send_action("move")

def turnLeft():
    global _dir
    _dir = (_dir + 3) % 4
    _send_action("turnLeft")

def turnRight():
    global _dir
    _dir = (_dir + 1) % 4
    _send_action("turnRight")

def up():
    global _y
    _y += 1
    _send_action("up")
    
def down():
    global _y
    _y -= 1
    _send_action("down")

def getDirection():
    return ["North", "East", "South", "West"][_dir]

def getPosition():
    return {"x": _x, "y": _y, "z": _z}

print("System loaded. Drone ready.")