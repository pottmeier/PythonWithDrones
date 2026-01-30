from pydantic import BaseModel, Field
from typing import List, Dict, Union, Optional

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
    procedural: List[ProceduralRule]

    def get_block_at(self, x:int,y:int, z:int) -> Optional[str]:
        """
        Translates spatial coords to the YAML grid.
        Returns the string ID of the block (e.g., 'dirt', 'empty', '?')
        """
        layer_key = f"layer_{y}"
        
        # Check for the altitude (Y)
        if layer_key not in self.layers:
            return None # Or "out_of_bounds"
            
        layer_data = self.layers[layer_key]
        
        # Check for Z bounds (Rows)
        if not (0 <= z < len(layer_data)):
            return None
            
        row = layer_data[z]
        
        # Check for X bounds (Columns)
        print(row)
        if not (0 <= x < len(row)):
            return None
            
        print(row[x])    
        return row[x]