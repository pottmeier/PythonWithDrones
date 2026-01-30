import js
import time

class Drone:
    VECTORS = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]]  # North, East, South, West
    DIRECTION_NAMES = ["North", "East", "South", "West"]
    
    def __init__(self, spawn):
        self.x = 0.0
        self.y = 0.0
        self.z = 0.0
        self.dir = 0  # 0: North, 1: East, 2: South, 3: West

    def __send_action__(self, action: str):
        """Bridge to the Worker JS"""
        js.post_action_to_main(action)
        time.sleep(0.01)  # prevent lags in infinite loops
    
    def __reset_internal_state__(self, spawn)->None:
        """Reset drone to spawn position"""
        self.x = float(spawn.x)
        self.y = float(spawn.y)
        self.z = float(spawn.z)
        self.dir = 0
        print(f"Python state reset to spawn: {self.x}, {self.y}, {self.z}")
        
    def move(self):
        """Move forward in current direction"""
        dx, dy, dz = self.VECTORS[self.dir]
        self.x += dx
        self.y += dy
        self.z += dz
        self.__send_action__("move")
    
    def turnLeft(self):
        """Turn 90 degrees left"""
        self.dir = (self.dir + 3) % 4
        self.__send_action__("turnLeft")
    
    def turnRight(self):
        """Turn 90 degrees right"""
        self.dir = (self.dir + 1) % 4
        self.__send_action__("turnRight")
    
    def up(self):
        """Move up one block"""
        self.y += 1
        self.__send_action__("up")
    
    def down(self):
        """Move down one block"""
        self.y -= 1
        self.__send_action__("down")
    
    def getDirection(self)->str:
        """Get current direction as string"""
        return self.DIRECTION_NAMES[self.dir]
    
    def getPosition(self):
        """Get current position as dictionary"""
        return {"x": self.x, "y": self.y, "z": self.z}


# Create global instance for backward compatibility
drone = Drone(js.initial_spawn)

# Expose methods as module-level functions for backward compatibility
# move = drone.move
# turnLeft = drone.turnLeft
# turnRight = drone.turnRight
# up = drone.up
# down = drone.down
# getDirection = drone.getDirection
# getPosition = drone.getPosition
# reset_internal_state = drone.reset_internal_state

print("System loaded. Drone ready.")