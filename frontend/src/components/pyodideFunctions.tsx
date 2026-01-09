export function registerPyodideFunctions(
    moveQueueRef: React.RefObject<string[]>,
    isAnimatingRef: React.RefObject<boolean>,
    processNextMove: () => void,
    positionRef?: React.RefObject<[number, number, number]>
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
    }
}