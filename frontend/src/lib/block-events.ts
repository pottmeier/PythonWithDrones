// Lightweight pub/sub so scene.tsx (which owns the drone action queue) can
// notify a specific grid-position block component without threading refs
// through grid.tsx. Keyed by "x,y,z" grid coordinates.

type Listener = (data: any) => void;

const listeners = new Map<string, Set<Listener>>();

export const blockEvents = {
  subscribe(key: string, cb: Listener) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(cb);
    return () => {
      listeners.get(key)?.delete(cb);
    };
  },
  emit(key: string, data: any) {
    listeners.get(key)?.forEach((cb) => cb(data));
  },
};

export function positionKey(x: number, y: number, z: number) {
  return `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
}
