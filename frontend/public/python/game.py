import js
import time

# Bridge to the Worker JS
def _send_action(action):
    js.post_action_to_main(action)
    time.sleep(0.1) # prevent lags in infinite loops

# --- PUBLIC API FOR THE PLAYER ---

def move():
    _send_action("move")

def turnLeft():
    _send_action("turnLeft")

def turnRight():
    _send_action("turnRight")

def up():
    _send_action("up")
    
def down():
    _send_action("down")

def getDirection():
    return js.window.getDroneDirection()

def getPosition():
    pos = js.window.getDronePosition()
    return {"x": pos.x, "y": pos.y, "z": pos.z}

print("System loaded. Drone ready.")