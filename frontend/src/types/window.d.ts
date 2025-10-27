export {};

declare global {
  interface Window {
    runPython?: (code: string) => Promise<any>;
    moveDrone?: (direction: string) => void;
    loadPyodide?: any;
    setGridPosition?: React.Dispatch<React.SetStateAction<[number, number]>>;
  }
}
