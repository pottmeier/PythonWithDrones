# Python with Drones

## Project Purpose

This documentation is designed to help users understand Python by controling a virtual drone througout different levels. Users write Python code to programmatically move the drone, avoiding obstacles and reaching the goal portal. The drone's state is synchronized in real-time with a 3D visual representation in the browser, creating an interactive learning experience for understanding basic programming concepts like loops, conditionals, and spatial reasoning.

We build this project to demonstrate that programming is accessible to everyone willing to learn, and like any language whether spoken or programming comes through consistent practice and repetition.

## Contributing

We welcome contributions to this project! Feel free to fork the repository, submit pull requests, or [open issues](https://github.com/pottmeier/PythonWithDrones/issues/new/choose) to report bugs or suggest new level templates. All contributions are greatly appreciated!

## How to Use This Documentation

### Getting Started
This documentation describes all public methods available in the `Drone` class. Each method section includes:
- **Description**: What the method does
- **Parameters**: Input values required (if any)
- **Returns**: The type and value returned by the method
- **Example**: Python code showing how to use the method

### Method Categories
Methods are organized into four categories:
1. **Movement Methods**: Control the drone's position in 3D space
2. **Rotation Methods**: Change the drone's facing direction
3. **Interaction Methods**: Push, pick up, and deliver objects in the level
4. **Information Methods**: Query the drone's current state

### Data Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `float` | Decimal number representing coordinates | `5.0`, `2.5`, `-3.7` |
| `int` | Integer number used for array indices and directions | `0`, `1`, `2`, `3` |
| `str` | Text string representing direction names | `"North"`, `"East"`, `"South"`, `"West"` |
| `bool` | Boolean value (True or False) | `True`, `False` |
| `dict` | Dictionary containing key-value pairs | `{"x": 5.0, "y": 2.0, "z": 3.0}` |
| `None` | No return value | Methods that perform actions but return nothing |

### Direction System
The drone uses a direction system based on cardinal directions:
- `0` or `"North"`: Facing north (negative Z direction)
- `1` or `"East"`: Facing east (positive X direction)
- `2` or `"South"`: Facing south (positive Z direction)
- `3` or `"West"`: Facing west (negative X direction)

### Coordinate System
The game uses a 3D coordinate system:
- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Down (-) to Up (+)
- **Z-axis**: South (-) to North (+)

## Class Drone

### Movement Methods

#### `move()`
Moves the drone one block forward in the current viewing direction.

**Returns:** None

**Example:**
```python
drone.move()  # Move forward
drone.move()  # Move forward again
```

#### `up()`
Moves the drone one block upward.

**Returns:** None

**Example:**
```python
drone.up()  # Move up one block
drone.up()  # Move up another block
```

#### `down()`
Moves the drone one block downward.

**Returns:** None

**Example:**
```python
drone.down()  # Move down one block
drone.down()  # Move down another block
```

#### `reset_to_spawn()`
Resets the drone to the spawn point.

**Behavior:**
- Sets position to spawn coordinates
- Sets viewing direction to North (0)
- Clears the crashed status
- Synchronizes the visual representation with the frontend

**Returns:** None

**Example:**
```python
drone.reset_to_spawn()  # Reset to starting position
```

### Rotation Methods

#### `turn_left()`
Rotates the drone 90 degrees to the left.

**Returns:** None

**Note:** Does not work if the drone is dead

**Example:**
```python
drone.turn_left()   # Turn left once
drone.turn_left()   # Turn left twice 
```

#### `turn_right()`
Rotates the drone 90 degrees to the right.

**Returns:** None

**Note:** Does not work if the drone is dead

**Example:**
```python
drone.turn_right()  # Turn right once
drone.turn_right()  # Turn right twice
```

### Interaction Methods

#### `push()`
Pushes the movable block directly in front of the drone forward by one cell,
then flies the drone into the space it left behind.

**Returns:** None

**Note:** Prints `"Nothing pushable ahead"` if there's no pushable block in
front of the drone, or `"Can't push -- the space beyond is blocked"` if the
cell beyond it isn't free.

**Example:**
```python
if drone.scan() == "movable_block":
    drone.push()
```

#### `pickup()`
Picks up a package, but only while the drone is sitting right on top of it.
Flying over a package does nothing on its own - you have to call `pickup()`.

**Returns:** None

**Note:** Prints `"Nothing to pick up here"` if the drone isn't standing on a
package, or `"Already carrying something"` if it's already carrying one.

**Example:**
```python
drone.move()     # fly to the package's position
drone.pickup()   # pick it up now that you're standing on it
```

#### `deliver()`
Drops off the package the drone is carrying, but only while the drone is
sitting right on top of the delivery pad. Flying over the pad does nothing on
its own - you have to call `deliver()`.

**Returns:** None

**Note:** Prints `"Not carrying anything to deliver"` if the drone isn't
carrying a package, or `"This isn't the delivery pad"` if it isn't standing
on the delivery pad.

**Example:**
```python
drone.pickup()
# ... fly to the delivery pad ...
drone.deliver()
```

### Information Methods

#### `get_direction()` → `str`
Returns the current viewing direction as a text string.

**Returns:** `"North"`, `"East"`, `"South"`, or `"West"`

**Example:**
```python
current_direction = drone.get_direction()
print(current_direction)  # Output: "North"

if drone.get_direction() == "East":
    print("Drone is facing East")
```

#### `get_position()` → `dict`
Returns the current position of the drone.

**Returns:** Dictionary with keys `x`, `y`, `z` (float values)

**Example:**
```python
position = drone.get_position()
print(position)  # Output: {'x': 5.0, 'y': 2.0, 'z': 3.0}

x = position['x']
y = position['y']
z = position['z']
print(f"Drone is at ({x}, {y}, {z})")
```

#### `scan(distance=1)` → `str` or `list[str]`
Looks ahead in the direction the drone is facing, without moving.

**Parameters:**
- `distance` (`int`, optional): How many cells ahead to look. Defaults to `1`.

**Returns:**
- With the default `distance` of `1`: a single block id (`str`) for the cell
  directly ahead, e.g. `"air"` or `"movable_block"`.
- With a larger `distance`: a `list` of block ids, one per cell, stopping at
  (and including) the first cell that blocks the path.

**Example:**
```python
if drone.scan() == "air":
    drone.move()
else:
    drone.turn_right()

# Loop until the path ahead is clear
while drone.scan() != "air":
    drone.turn_right()

# Look further ahead, e.g. to plan around obstacles
ahead = drone.scan(3)
print(ahead)  # Output: ["air", "air", "movable_block"]
```

#### `at_goal()` → `bool`
Checks whether the drone is standing on the goal portal.

**Returns:**
- `True`: Drone is on the finish portal
- `False`: Drone is not on the portal

**Example:**
```python
if drone.at_goal():
    print("You reached the goal!")
else:
    print("Keep moving to reach the portal")

# Navigate until reaching the portal
while not drone.at_goal():
    if drone.scan() == "air":
        drone.move()
    else:
        drone.turn_right()
```