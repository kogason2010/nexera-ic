import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { smoothstep } from '../../utils/math';
import { heroFrame } from './heroFrame';
import { HERO_LABELS } from './labels';

/** DOM nodes for the scene annotations (registered by the Hero section). */
export const heroLabelEls: Record<string, HTMLElement | null> = {};

/** Projects every annotation anchor to the screen and fades labels in/out by scroll window. */
export function HeroLabels3D({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = reducedMotion ? 1 : heroFrame.p;
    for (const l of HERO_LABELS) {
      const el = heroLabelEls[l.id];
      if (!el) continue;
      let o = 0;
      for (const [a, b] of l.show) o = Math.max(o, smoothstep(a, a + 0.02, p) * (1 - smoothstep(b - 0.02, b, p)));
      v.copy(l.at).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      const phone = size.width < 700;
      const onScreen = v.z < 1 && x > 8 && x < size.width - 8 && y > 70 && y < size.height - 8;
      // keep the caption zone (bottom-left on desktop, bottom on phones) and the intro headline clear
      const inCaption = phone ? y > size.height * 0.6 : x < size.width * 0.4 && y > size.height * 0.64;
      if (!onScreen || inCaption) o = 0;
      if (phone && (p < 0.075 || p > 0.86)) o = 0;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}
