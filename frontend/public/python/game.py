import js

# The bridge to the new "Virtual Brain" in scene.tsx
def _send_action(action):
    try:
        js.window.droneAction(action)
    except Exception as e:
        print(f"Error communicating with drone: {e}")

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