import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { eluentFragment, eluentVertex } from '../../shaders/heroParticles';
import { HERO_COLUMN } from '../../utils/chroma';
import { rng } from '../../utils/math';
import { heroFrame } from './heroFrame';

/** Carbonate eluent ions streaming through the column and disappearing in the suppressor. */
export function Eluent({ count }: { count: number }) {
  const { g, m } = useMemo(() => {
    const rand = rng(3);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) seed[i] = rand();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const m = new THREE.ShaderMaterial({
      vertexShader: eluentVertex,
      fragmentShader: eluentFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uInlet: { value: HERO_COLUMN.inlet },
        uOutlet: { value: HERO_COLUMN.outlet },
        uSuppressor: { value: HERO_COLUMN.suppressor },
        uRadius: { value: HERO_COLUMN.radius },
        uVis: { value: 0 },
      },
    });
    return { g, m };
  }, [count]);

  useEffect(
    () => () => {
      g.dispose();
      m.dispose();
    },
    [g, m],
  );

  useFrame(({ gl }) => {
    const p = heroFrame.p;
    // present once the pump runs; brightest while the suppression step is explained
    const base = THREE.MathUtils.smoothstep(p, 0.12, 0.22) * 0.55;
    const focus = THREE.MathUtils.smoothstep(p, 0.42, 0.47) * (1 - THREE.MathUtils.smoothstep(p, 0.58, 0.64));
    m.uniforms.uVis.value = (base + focus * 0.9) * (1 - THREE.MathUtils.smoothstep(p, 0.9, 1.0) * 0.6);
    m.uniforms.uTime.value = heroFrame.time;
    m.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <points geometry={g} material={m} frustumCulled={false} />;
}
