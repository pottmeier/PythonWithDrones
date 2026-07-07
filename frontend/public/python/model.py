from pydantic import BaseModel, model_validator   # type: ignore
from typing import List, Dict, Union, Optional

class Spawn(BaseModel):
    x: float
    y: float
    z: float

class SolveConditions(BaseModel):
    collected_coins: int = 0
    requires_delivery: bool = False
    push_target: Optional[List[int]] = None  # [x, y, z]

    def unmet_reasons(
        self,
        *,
        coins_collected: int,
        delivered: bool,
        push_target_reached: bool,
    ) -> List[str]:
        """Human-readable reasons the level isn't solved yet (empty = solved)."""
        reasons: List[str] = []
        missing_coins = self.collected_coins - coins_collected
        if missing_coins > 0:
            reasons.append(f"Need {missing_coins} more coin(s)")
        if self.requires_delivery and not delivered:
            reasons.append("The package hasn't been delivered yet")
        if self.push_target is not None and not push_target_reached:
            reasons.append("The crate hasn't been pushed onto the target yet")
        return reasons

    @classmethod
    def infer_from_layers(cls, layers: Dict[str, List[List[str]]]) -> "SolveConditions":
        """Derive default solve conditions from what's actually placed in the
        level, so a level author doesn't have to restate the layout in
        solve_conditions: every coin present must be collected, a package +
        delivery_pad pair requires delivery, and a movable_block + push_target
        pair requires pushing the block onto that target."""
        coin_count = 0
        has_package = False
        has_delivery_pad = False
        has_movable_block = False
        push_target_pos: Optional[List[int]] = None
        for layer_name, rows in layers.items():
            try:
                y = int(layer_name.split("_")[1])
            except (IndexError, ValueError):
                continue
            for z, row in enumerate(rows):
                for x, cell in enumerate(row):
                    if cell == "coin":
                        coin_count += 1
                    elif cell == "package":
                        has_package = True
                    elif cell == "delivery_pad":
                        has_delivery_pad = True
                    elif cell == "movable_block":
                        has_movable_block = True
                    elif cell == "push_target" and push_target_pos is None:
                        push_target_pos = [x, y, z]
        return cls(
            collected_coins=coin_count,
            requires_delivery=has_package and has_delivery_pad,
            push_target=push_target_pos if has_movable_block else None,
        )

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
    solve_conditions: Optional[SolveConditions] = None
    # Using Dict for layers because keys are 'layer_0', 'layer_1', etc.
    layers: Dict[str, List[List[str]]]
    #procedural: List[ProceduralRule]

    @model_validator(mode="after")
    def _resolve_solve_conditions(self) -> "LevelModel":
        """Fill in solve_conditions from the layout, field by field. A field
        the YAML set explicitly (even to its default value) always wins over
        the inferred one -- only genuinely unset fields get the inferred
        value, so a level only needs to mention a condition when overriding
        what's already implied by the blocks it placed."""
        inferred = SolveConditions.infer_from_layers(self.layers)
        explicit = self.solve_conditions
        explicit_fields = explicit.model_fields_set if explicit is not None else set()
        self.solve_conditions = SolveConditions(
            collected_coins=(
                explicit.collected_coins
                if explicit is not None and "collected_coins" in explicit_fields
                else inferred.collected_coins
            ),
            requires_delivery=(
                explicit.requires_delivery
                if explicit is not None and "requires_delivery" in explicit_fields
                else inferred.requires_delivery
            ),
            push_target=(
                explicit.push_target
                if explicit is not None and "push_target" in explicit_fields
                else inferred.push_target
            ),
        )
        return self

    def get_block_id(self, x:int,y:int, z:int) -> Optional[str]:
        """Return the block id at the given grid coordinate, or "empty" if out of bounds."""
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
        """Check whether the block at this coordinate blocks movement, per the
        block registry's "isCollidable" flag. Out-of-bounds coordinates and
        unknown block ids are treated as collidable (fail safe)."""
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
                # print(f"Boundary Error: {axis} {val} is outside level {axis} {limit}")
                return True

        # check registry, if the block is collidable
        block_id = self.get_block_id(x, y, z)
        if block_id in registry:
            return registry[block_id].get("isCollidable", False)
        
        # safety: if id not found -> collidable
        print(f"Registry Error: Block '{block_id}' not found in registry")
        return True
    

    def get_floor(self, x: int, start_y: int, z: int, registry: dict) -> float:
        """Scan downward from start_y for the first collidable block and
        return the world-space Y height to land on top of it (0.0 if none found)."""
        for y in range(int(start_y) - 1, -1, -1):
            block_id = self.get_block_id(x, y, z)
            if block_id in registry and registry[block_id].get("isCollidable", False):
                return float(y + 0.62)

        # if no collidable blocks found
        return 0.0

    def set_block_id(self, x: int, y: int, z: int, block_id: str) -> None:
        """Set the block id at the given grid coordinate (silent no-op if out of bounds)."""
        x, y, z = int(x), int(y), int(z)
        if x < 0 or y < 0 or z < 0:
            return
        layer_name = f"layer_{y}"
        try:
            self.layers[layer_name][z][x] = block_id
        except (KeyError, IndexError):
            pass

    def move_block(self, fx: int, fy: int, fz: int, tx: int, ty: int, tz: int) -> None:
        """Move the block at (fx, fy, fz) to (tx, ty, tz), clearing the source cell to "air"."""
        block_id = self.get_block_id(fx, fy, fz)
        self.set_block_id(fx, fy, fz, "air")
        self.set_block_id(tx, ty, tz, block_id)