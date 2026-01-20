import * as THREE from "three";

export function registerPyodideFunctions(
    commandQueueRef: React.RefObject<string[]>,
    isAnimatingRef: React.RefObject<boolean>,
    processNextMoveInQueue: () => void,
    positionRef?: React.RefObject<[number, number, number]>,
    droneRef?: React.RefObject<THREE.Group>
) {
    (window as any).command = (direction: string) => {
        commandQueueRef.current.push(direction);
        if (!isAnimatingRef.current) {
            processNextMoveInQueue();
        }
    };

    if (droneRef) {
        (window as any).turnRight = () => {
            (window as any).command("right");
        }

        (window as any).turnLeft = () => {
            (window as any).command("left");
        }

        type Coord = `${number},${number},${number}`

        (window as any).direction = () => {
            //TODO: This needs adjustment between the real object and the python output. At the moment when doing something like
            // for i in range(3):
            //      turnRight()
            //      print(direction())
            // The moves are done persistent but the direction is wrong, as the python compiler is faster than our animation!
            const vector = new THREE.Vector3()
            const directionmap: Record<Coord, string> = {
                "1,0,0": "east",
                "-1,0,0": "west",
                "0,0,-1": "north",
                "0,0,1": "south",
            };
            const direction = droneRef.current.getWorldDirection(vector)
            const x = direction.round().x
            const y = direction.round().y
            const z = direction.round().z
            return String(directionmap[`${x},${y},${z}`])
        }
    }

    // Add a getPosition function IF a ref is supplied
    if (positionRef) {
        (window as any).getPosition = () => {
            return positionRef.current;
        };

        (window as any).move = () => {
            (window as any).command((window as any).direction());
        };
    }
}