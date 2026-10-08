import type { SceneId } from '../three/scenes';

/** Which arrangement the ion stage shows. Sections write it; the WebGL stage and labels read it. */
export const stage = { scene: 'hero' as SceneId, ion: 'SO4', version: 0 };
type L = () => void;
const listeners = new Set<L>();

export function setStage(scene: SceneId, ion = stage.ion) {
  if (scene === stage.scene && ion === stage.ion) return;
  stage.scene = scene;
  stage.ion = ion;
  stage.version++;
  listeners.forEach((l) => l());
}

export function subscribeStage(l: L) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const pointer = { x: 0, y: 0 };
/** DOM nodes for the stage labels, positioned every frame by the WebGL stage. */
export const stageLabelEls: (HTMLElement | null)[] = [];
