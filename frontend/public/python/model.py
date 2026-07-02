from pydantic import BaseModel, Field   # type: ignore
from typing import List, Dict, Union, Optional

#TODO: Move some of pydantic to optional fields so levels stay valid when some requirement is not met

class Spawn(BaseModel):
    x: float
    y: float
    z: float

class SolveConditions(BaseModel):
    finish_block: bool
    collected_coins: int

class ProceduralItem(BaseModel):
    id: str
    count: int
    min_height: int
    max_height: int

class ProceduralRule(BaseModel):
    target_layer: str
    placeholder: str
    items: List[ProceduralItem]

class LevelModel(BaseModel):
    description: str
    spawn: Spawn
    solve_conditions: SolveConditions
    # Using Dict for layers because keys are 'layer_0', 'layer_1', etc.
    layers: Dict[str, List[List[str]]]
    #procedural: List[ProceduralRule]


    def get_block_id(self, x:int,y:int, z:int) -> Optional[str]:
        x, y, z = int(x), int(y), int(z)
        # negative indices are out of bounds too -- Python list indexing would
        # otherwise silently wrap around and return a block from the opposite edge
        if x < 0 or y < 0 or z < 0:
            return "empty"
        layer_name = f"layer_{y}"
        try:
            return self.layers[layer_name][z][x]
        except (KeyError, IndexError):
            return "empty"
    

    def is_block_collidable(self, x: int, y: int, z: int, registry: dict) -> bool:
        # get dimensions from base layer
        base_layer = self.layers.get("layer_0", [])
        if not base_layer:
            return True
        
        height = len(self.layers)      # Y limit
        depth = len(base_layer)        # Z limit
        width = len(base_layer[0])     # X limit

        # check if block is inside the level
        for val, limit, axis in ((x, width, "X"), (y, height, "Y"), (z, depth, "Z")):
            if not (0 <= val < limit):
                print(f"Boundary Error: {axis} {val} is outside level {axis} {limit}")
                return True

        # check registry, if the block is collidable
        block_id = self.get_block_id(x, y, z)
        if block_id in registry:
            return registry[block_id].get("isCollidable", False)
        
        # safety: if id not found -> collidable
        print(f"Registry Error: Block '{block_id}' not found in registry")
        return True
    

    def get_floor(self, x: int, start_y: int, z: int, registry: dict) -> float:
        for y in range(int(start_y) - 1, -1, -1):
            block_id = self.get_block_id(x, y, z)
            if block_id in registry and registry[block_id].get("isCollidable", False):
                return float(y + 0.62)

        # if no collidable blocks found
        return 0.0

    def set_block_id(self, x: int, y: int, z: int, block_id: str) -> None:
        x, y, z = int(x), int(y), int(z)
        if x < 0 or y < 0 or z < 0:
            return
        layer_name = f"layer_{y}"
        try:
            self.layers[layer_name][z][x] = block_id
        except (KeyError, IndexError):
            pass

    def move_block(self, fx: int, fy: int, fz: int, tx: int, ty: int, tz: int) -> None:
        block_id = self.get_block_id(fx, fy, fz)
        self.set_block_id(fx, fy, fz, "air")
        self.set_block_id(tx, ty, tz, block_id)