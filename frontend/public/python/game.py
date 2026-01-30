import js
import time
import yaml
from pyodide.http import pyfetch
from model import LevelModel

async def load_level()->LevelModel:
    url = "https://pottmeier.github.io/PythonWithDrones/levels/prototype_level.yaml" #TODO: Maybe change into basepath
    level_data = {'description':"",'spawn':{'x': 0, 'y': 0, 'z': 0}, 'solve_conditions':{'finish_block': False, 'collected_coins': 0}} # dummy data
    response = await pyfetch(url)
    if response.status == 200:
        yaml_content = await response.string()
        level_data = yaml.safe_load(yaml_content)
        print("Level loaded successfully!")
    return LevelModel(**level_data)

level = await load_level()

class Drone:
    VECTORS = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]]  # North, East, South, West
    DIRECTION_NAMES = ["North", "East", "South", "West"]

    def __init__(self,spawn):
        self.x = spawn.x
        self.y = spawn.y
        self.z = spawn.z
        self.dir = 0  # 0: North, 1: East, 2: South, 3: West
        self.level_data = level

    def __send_action__(self, action: str):
        """Bridge to the Pyodide WebWorker JS"""
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
    
    def pathBlocked(self):
        dx, dy, dz = self.VECTORS[self.dir]
        target_x = self.x + dx
        target_y = self.y + dy
        target_z = self.z + dz
        
        block_type = self.level_data.get_block_at(int(target_x),int(target_y),int(target_z))
        if block_type is None:
            return True
        walkable = ["empty","?"]

        return False if block_type in walkable else True


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