import * as THREE from "three";
import gsap from "gsap";

export function registerPyodideFunctions(
    moveQueueRef: React.RefObject<string[]>,
    isAnimatingRef: React.RefObject<boolean>,
    processNextMove: () => void,
    positionRef?: React.RefObject<[number, number, number]>,
    droneRef?: React.RefObject<THREE.Group>
) {
    (window as any).moveDrone = (direction: string) => {
        moveQueueRef.current.push(direction);
        if (!isAnimatingRef.current) {
            processNextMove();
        }
    };

    // Add a getPosition function IF a ref is supplied
    if (positionRef) {
        (window as any).getPosition = () => {
            return positionRef.current;
        };

        (window as any).move = () => {
            positionRef.current;
        };
    }

    if (droneRef) {
        const turn = Math.PI / 2;
        (window as any).turnRight = async () => {
            if (!isAnimatingRef.current) {
                isAnimatingRef.current = true;
                await gsap.to(droneRef.current.rotation, {
                    y: `-=${turn}`,
                    duration: 0.8,
                    ease: "power2.out"
                });
                isAnimatingRef.current = false;
            }
        }

        (window as any).turnLeft = async () => {
            if (!isAnimatingRef.current) {
                isAnimatingRef.current = true;
                await gsap.to(droneRef.current.rotation, {
                    y: `+=${turn}`,
                    duration: 0.8,
                    ease: "power2.out"
                });
                isAnimatingRef.current = false;
            }
        }
    }
}