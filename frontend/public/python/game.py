import js # type: ignore
import time
from model import LevelModel,Spawn,SolveConditions

level = None
drone = None
block_registry = {}
initial_spawn_data = None


def initialize_level(spawn, registry, generated_level):
    """Called only when a level is first loaded"""
    global level, drone, block_registry, initial_spawn
    initial_spawn = spawn
    block_registry = registry.to_py()
    level = LevelModel(**generated_level.to_py())
    # Create the drone instance once
    drone = Drone(initial_spawn)
    drone.level_data = level
    # Initial sync
    drone.reset_to_spawn()


class Drone:
    VECTORS = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]]  # North, East, South, West
    DIRECTION_NAMES = ["North", "East", "South", "West"]

    def __init__(self,spawn):
        self.spawn_data = spawn 
        self.x = 0.0
        self.y = 0.0
        self.z = 0.0
        self.dir = 0  # 0: North, 1: East, 2: South, 3: West
        self.level_data = LevelModel(description="",spawn=Spawn(x=0,y=0,z=0),solve_conditions=SolveConditions(finish_block=True, collected_coins=0),layers={"layer_0":[["empty"]]})
        self.is_dead = False
        self.coins_collected = 0
        self.carrying_package = False
        self.package_delivered = False
        self.push_target_reached = False

    def reset_to_spawn(self):
        """reset the drone to spawn and uppdate variables without deleting the drone"""
        if hasattr(self.spawn_data, 'x'):
            self.x, self.y, self.z = float(self.spawn_data.x), float(self.spawn_data.y), float(self.spawn_data.z)
            self.dir = int(getattr(self.spawn_data, 'orientation', 0))
        else:
            self.x = float(self.spawn_data.get('x', 0))
            self.y = float(self.spawn_data.get('y', 0))
            self.z = float(self.spawn_data.get('z', 0))
            self.dir = int(self.spawn_data.get('orientation', 0))
        self.is_dead = False
        
        # Tell JS to move the visual model
        js.post_action_to_main({
            "type": "reset", 
            "pos": [self.x, self.y, self.z],
            "dir": self.dir
        })

    def __send_action__(self, action: str):
        """Bridge to the Pyodide WebWorker JS"""
        js.post_action_to_main(action)
        time.sleep(0.1)  # prevent lags in infinite loops
    
    # =====================
    # move logic
    # =====================
    def move(self):
        """Move forward in current direction"""
        dx, dy, dz = self.VECTORS[self.dir]
        self.__attempt_move__(dx, dy, dz)

    def up(self):
        """Move up one block"""
        self.__attempt_move__(0, 1, 0)
    
    def down(self):
        """Move down one block"""
        self.__attempt_move__(0, -1, 0)

    def __attempt_move__(self, dx, dy, dz):
        if self.is_dead: 
            return
        target_x = int(self.x + dx)
        target_y = int(self.y + dy)
        target_z = int(self.z + dz)

        # check if the next move is possible
        if self.level_data and not self.level_data.is_block_collidable(target_x, target_y, target_z, block_registry): 
            # possible move
            self.x = target_x
            self.y = target_y
            self.z = target_z
            self.__send_action__({
                "type": "move", 
                "target": [self.x, self.y, self.z]
            })
        else:
            # crash
            self.is_dead = True
            print("drone crashed")
            landing_y = self.level_data.get_floor(int(self.x), int(self.y), int(self.z), block_registry)
            self.__send_action__({
                "type": "crash",
                "vector": [dx, dy, dz],
                "x": self.x, "y": self.y, "z": self.z, # current position before fall
                "landingY": landing_y
            })
        # coin pickup when flying over a coin
        if self.level_data.get_block_id(int(self.x), int(self.y), int(self.z)) == "coin":
            self.coins_collected += 1
            self.level_data.set_block_id(int(self.x), int(self.y), int(self.z), "air")
            self.__send_action__({
                "type": "collect_coin",
                "pos": [self.x, self.y, self.z],
                "total": self.coins_collected,
            })

        # finish logic when goal is reached, post to main
        if self.level_data.get_block_id(int(self.x),int(self.y),int(self.z)) == "finish_portal":
            reasons = self.level_data.solve_conditions.unmet_reasons(
                coins_collected=self.coins_collected,
                delivered=self.package_delivered,
                push_target_reached=self.push_target_reached,
            )
            if not reasons:
                self.__send_action__({"type": "goal"})
            else:
                message = " ".join(f"{reason}." for reason in reasons)
                print(message)
                self.__send_action__({"type": "hint", "message": message})
            return

    # =====================
    # push logic
    # =====================
    def push(self):
        """Push the movable block directly in front of the drone forward by one cell,
        then advance into the space it vacated."""
        if self.is_dead:
            return
        dx, dy, dz = self.VECTORS[self.dir]
        block_x, block_y, block_z = int(self.x + dx), int(self.y + dy), int(self.z + dz)
        block_id = self.level_data.get_block_id(block_x, block_y, block_z)
        if block_id not in block_registry or not block_registry[block_id].get("isPushable", False):
            print("Nothing pushable ahead")
            return
        target_x, target_y, target_z = block_x + dx, block_y + dy, block_z + dz
        if self.level_data.is_block_collidable(target_x, target_y, target_z, block_registry):
            print("Can't push -- the space beyond is blocked")
            return
        self.level_data.move_block(block_x, block_y, block_z, target_x, target_y, target_z)
        self.__send_action__({
            "type": "push_block",
            "from": [block_x, block_y, block_z],
            "to": [target_x, target_y, target_z],
        })
        if self.level_data.solve_conditions.push_target == [target_x, target_y, target_z]:
            self.push_target_reached = True
            self.__send_action__({
                "type": "push_target_reached",
                "pos": [target_x, target_y, target_z],
            })
        self.__attempt_move__(dx, dy, dz)

    # =====================
    # pickup / delivery logic
    # =====================
    def pickup(self):
        """Pick up a package at the drone's current position."""
        if self.is_dead:
            return
        if self.carrying_package:
            print("Already carrying something")
            return
        if self.level_data.get_block_id(int(self.x), int(self.y), int(self.z)) != "package":
            print("Nothing to pick up here")
            return
        self.carrying_package = True
        self.level_data.set_block_id(int(self.x), int(self.y), int(self.z), "air")
        self.__send_action__({"type": "pickup_package", "pos": [self.x, self.y, self.z]})

    def deliver(self):
        """Deliver the carried package at the drone's current position."""
        if self.is_dead:
            return
        if not self.carrying_package:
            print("Not carrying anything to deliver")
            return
        if self.level_data.get_block_id(int(self.x), int(self.y), int(self.z)) != "delivery_pad":
            print("This isn't the delivery pad")
            return
        self.carrying_package = False
        self.package_delivered = True
        self.__send_action__({"type": "deliver_package", "pos": [self.x, self.y, self.z]})

    # =====================
    # turn logic
    # =====================
    def turn_left(self):
        """Turn 90 degrees left"""
        if self.is_dead: 
            return
        self.dir = (self.dir + 3) % 4
        self.__send_action__({"type": "turn", "direction": "left"})
    
    def turn_right(self):
        """Turn 90 degrees right"""
        if self.is_dead: 
            return
        self.dir = (self.dir + 1) % 4
        self.__send_action__({"type": "turn", "direction": "right"})
    
    # =====================
    # info logic         
    # =====================
    def get_direction(self)->str:
        """Get current direction as string"""
        return self.DIRECTION_NAMES[self.dir]
    
    def get_position(self):
        """Get current position as dictionary"""
        return {"x": self.x, "y": self.y, "z": self.z}
    
    def scan(self, distance: int = 1):
        """Look ahead in the direction the drone is facing.
        Returns a list of block ids, one per cell, stopping at (and including)
        the first cell that blocks the path."""
        results = []
        dx, dy, dz = self.VECTORS[self.dir]
        for step in range(1, distance + 1):
            target_x = int(self.x + dx * step)
            target_y = int(self.y + dy * step)
            target_z = int(self.z + dz * step)
            block_id = self.level_data.get_block_id(target_x, target_y, target_z)
            results.append(block_id)
            if self.level_data.is_block_collidable(target_x, target_y, target_z, block_registry):
                break
        return results

    def at_portal(self):
        return self.level_data.get_block_id(int(self.x), int(self.y), int(self.z)) == "finish_portal"        
