export type HoverCell = { x: number; y: number; z: number };

export type SceneAPI = {
  // Step current layer by `dir` units. Clamps internally to [0, layerCount-1]
  // and returns the actual new layer after clamping.
  applyLayerStep: (dir: number) => number;
  // Set current layer to absolute value. `layerCountOverride` lets callers
  // pass the new layer count when the React state level hasn't propagated
  // yet (e.g. immediately after add-layer or resize).
  applyLayerSet: (target: number, layerCountOverride?: number) => number;
  // Perform the current tool's action at the current hover cell. Used by
  // the editor's space-key handler to paint the initial cell on press;
  // hold-to-paint on subsequent hover changes is handled internally.
  performActionAtHover: () => void;
};
