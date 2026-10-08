import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '../utils/gsap';
import { setStage, stage } from '../utils/stage';
import type { SceneId } from '../three/scenes';

/** Switch the ion stage to `scene` while this section spans the middle of the viewport. */
export function useStageScene(ref: RefObject<HTMLElement>, scene: SceneId) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) setStage(scene, stage.ion);
      },
    });
    return () => st.kill();
  }, [ref, scene]);
}
