import type { CanvasScene } from "./scene";

export type SceneHistory = {
  readonly present: CanvasScene;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  commit(scene: CanvasScene): CanvasScene;
  undo(): CanvasScene;
  redo(): CanvasScene;
};

export function createSceneHistory(initial: CanvasScene, limit = 50): SceneHistory {
  const cap = Math.max(1, Math.floor(limit));
  let present = initial;
  let past: CanvasScene[] = [];
  let future: CanvasScene[] = [];
  return {
    get present() { return present; },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    commit(scene) {
      if (scene === present) return present;
      past = [...past, present].slice(-cap);
      present = scene;
      future = [];
      return present;
    },
    undo() {
      const previous = past.at(-1);
      if (!previous) return present;
      past = past.slice(0, -1);
      future = [present, ...future].slice(0, cap);
      present = previous;
      return present;
    },
    redo() {
      const next = future[0];
      if (!next) return present;
      future = future.slice(1);
      past = [...past, present].slice(-cap);
      present = next;
      return present;
    },
  };
}
