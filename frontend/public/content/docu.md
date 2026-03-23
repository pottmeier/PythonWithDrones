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
Methods are organized into three categories:
1. **Movement Methods**: Control the drone's position in 3D space
2. **Rotation Methods**: Change the drone's facing direction
3. **Information Methods**: Query the drone's current state

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

#### `is_path_blocked()` → `bool`
Checks whether the path in the current viewing direction is blocked.

**Returns:**
- `True`: Path is blocked or leads to a collidable block
- `False`: Path is clear

**Example:**
```python
if drone.is_path_blocked():
    print("Cannot move forward")
    drone.turn_right()
else:
    print("Path is clear")
    drone.move()

# Loop until path is clear
while drone.is_path_blocked():
    drone.turn_right()
```

#### `at_portal()` → `bool`
Checks whether the drone is standing on the goal portal.

**Returns:**
- `True`: Drone is on the finish portal
- `False`: Drone is not on the portal

**Example:**
```python
if drone.at_portal():
    print("You reached the goal!")
else:
    print("Keep moving to reach the portal")

# Navigate until reaching the portal
while not drone.at_portal():
    if not drone.is_path_blocked():
        drone.move()
    else:
        drone.turn_right()
```