import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { liquidFragment, liquidVertex } from '../../shaders/flow';
import { PATH, S, tubeRanges } from './flowPath';
import { heroFrame } from './heroFrame';
import { bandUniforms } from './uniforms';

const R = 0.07; // small-bore tubing (drawn thicker than true scale so the liquid reads)

/** All tubing between components, filled with eluent and carrying the sample bands. */
export function FlowTubes() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: liquidVertex,
        fragmentShader: liquidFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          ...bandUniforms,
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uTintAfter: { value: S.cellOut },
        },
      }),
    [],
  );

  const geos = useMemo(
    () =>
      tubeRanges().map(([a, b]) => {
        const pts = PATH.slice(a, b + 1);
        const curve = new THREE.CatmullRomCurve3(
          pts.map((q) => q.p),
          false,
          'catmullrom',
          0.1,
        );
        const segs = Math.max(8, pts.length);
        const g = new THREE.TubeGeometry(curve, segs, R, 10, false);
        const s0 = pts[0].s;
        const s1 = pts[pts.length - 1].s;
        const n = g.attributes.position.count;
        const aS = new Float32Array(n);
        const uv = g.attributes.uv;
        for (let i = 0; i < n; i++) aS[i] = s0 + uv.getX(i) * (s1 - s0);
        g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
        return g;
      }),
    [],
  );

  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose());
      material.dispose();
    },
    [geos, material],
  );

  useFrame(() => {
    material.uniforms.uTime.value = heroFrame.time;
  });

  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={material} renderOrder={4} />
      ))}
    </group>
  );
}
