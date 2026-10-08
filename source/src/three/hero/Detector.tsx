import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beamFragment, beamVertex, glassFragment, glassVertex } from '../../shaders/glass';
import { HERO_COLUMN } from '../../utils/chroma';
import { rng } from '../../utils/math';
import { heroFrame } from './heroFrame';
import { TRACE } from './Chromatogram3D';

const SX = HERO_COLUMN.suppressor;
const DX = HERO_COLUMN.detector;

function glass(tint: string, opacity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: glassVertex,
    fragmentShader: glassFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTint: { value: new THREE.Color(tint) },
      uLightPos: { value: new THREE.Vector3(5, 3, 5) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
  });
}

/**
 * Electrodialytic suppressor (anion, ICDS-Ai style, stylised).
 * Eluent passes a folded ion-exchange membrane; water electrolysis in the side channels supplies H⁺
 * that replaces Na⁺, so the carbonate eluent leaves as weakly conducting carbonic acid.
 * Bubbles rising from the electrode channels show the continuous regeneration.
 */
function Suppressor() {
  const body = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a2029', metalness: 0.8, roughness: 0.34, envMapIntensity: 1 }),
    [],
  );
  const trim = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a8b2bf', metalness: 1, roughness: 0.22, envMapIntensity: 1.2 }),
    [],
  );
  const win = useMemo(() => glass('#9cc6ef', 0.9), []);

  const fold = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = -0.28 + (i / n) * 0.56;
      pts.push(new THREE.Vector3(x, i % 2 ? 0.17 : -0.17, 0.27));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const membraneMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#9fe0ff', transparent: true, opacity: 0.6 }), []);
  const membraneLine = useMemo(() => new THREE.Line(fold, membraneMat), [fold, membraneMat]);

  const bubbles = useMemo(() => {
    const rand = rng(17);
    const n = 70;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 0.5;
      pos[i * 3 + 1] = rand();
      pos[i * 3 + 2] = (rand() - 0.5) * 0.3;
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOn: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPixelRatio; uniform float uOn;
        attribute float aSeed; varying float vA;
        void main() {
          vec3 p = position;
          float t = fract(p.y + uTime * (0.25 + aSeed * 0.3));
          float side = aSeed > 0.5 ? 1.0 : -1.0;
          p.y = side * (0.32 + t * 0.55);
          p.x += sin(uTime * 2.0 + aSeed * 30.0) * 0.02;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (6.0 + aSeed * 8.0) * uPixelRatio / -mv.z;
          vA = (1.0 - t) * uOn;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float ring = smoothstep(0.5, 0.35, d) - smoothstep(0.3, 0.1, d) * 0.6;
          gl_FragColor = vec4(0.75, 0.9, 1.0, ring * vA * 0.8);
        }`,
    });
    return { g, m };
  }, []);

  useEffect(
    () => () => {
      [body, trim, win, bubbles.m, membraneMat].forEach((m) => m.dispose());
      [fold, bubbles.g].forEach((g) => g.dispose());
    },
    [body, trim, win, bubbles, fold, membraneMat],
  );

  useFrame(({ gl }) => {
    const on = THREE.MathUtils.smoothstep(heroFrame.p, 0.14, 0.24);
    bubbles.m.uniforms.uTime.value = heroFrame.time;
    bubbles.m.uniforms.uOn.value = on;
    bubbles.m.uniforms.uPixelRatio.value = gl.getPixelRatio();
    win.uniforms.uTime.value = heroFrame.time;
    const pulse = 0.55 + 0.25 * Math.sin(heroFrame.time * 2.2);
    membraneMat.opacity = (0.25 + pulse * 0.6) * (0.3 + 0.7 * on);
  });

  return (
    <group position={[SX, 0, 0]}>
      <mesh material={body} position={[0, 0.36, 0]}>
        <boxGeometry args={[0.78, 0.22, 0.56]} />
      </mesh>
      <mesh material={body} position={[0, -0.36, 0]}>
        <boxGeometry args={[0.78, 0.22, 0.56]} />
      </mesh>
      <mesh material={trim} position={[-0.4, 0, 0]}>
        <boxGeometry args={[0.04, 0.94, 0.6]} />
      </mesh>
      <mesh material={trim} position={[0.4, 0, 0]}>
        <boxGeometry args={[0.04, 0.94, 0.6]} />
      </mesh>
      <mesh material={win} renderOrder={4}>
        <boxGeometry args={[0.74, 0.5, 0.54]} />
      </mesh>
      <primitive object={membraneLine} />
      {[0.62, -0.62].map((y) => (
        <mesh key={y} material={trim} position={[0.22, y, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.18, 16]} />
        </mesh>
      ))}
      <points geometry={bubbles.g} material={bubbles.m} frustumCulled={false} />
    </group>
  );
}

/**
 * Conductivity cell: two electrodes straddle the flow path; field lines brighten with the live
 * conductivity signal, and a dashed lead carries it up to the strip-chart trace.
 */
function ConductivityCell() {
  const cell = useMemo(() => glass('#a9c8ee', 0.85), []);
  const electrode = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c6ced8', metalness: 1, roughness: 0.18, envMapIntensity: 1.3 }),
    [],
  );
  const housing = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1d232b', metalness: 0.85, roughness: 0.32, envMapIntensity: 1 }),
    [],
  );
  const field = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color('#8fd8ff') }, uIntensity: { value: 0.3 }, uTime: { value: 0 } },
      }),
    [],
  );
  const lead = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, TRACE.base, 0)]);
    const m = new THREE.LineDashedMaterial({ color: '#8fa9c6', dashSize: 0.05, gapSize: 0.05, transparent: true, opacity: 0.4 });
    const l = new THREE.Line(g, m);
    l.computeLineDistances();
    return l;
  }, []);
  const halo = useRef<THREE.PointLight>(null);
  const fieldXs = useMemo(() => [-0.16, -0.08, 0, 0.08, 0.16], []);
  const fieldGeo = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8, 1, true), []);

  useEffect(
    () => () => {
      [cell, electrode, housing, field].forEach((m) => m.dispose());
      fieldGeo.dispose();
      lead.geometry.dispose();
      (lead.material as THREE.Material).dispose();
    },
    [cell, electrode, housing, field, fieldGeo, lead],
  );

  useFrame(() => {
    const on = THREE.MathUtils.smoothstep(heroFrame.p, 0.16, 0.24);
    const s = heroFrame.signal;
    field.uniforms.uIntensity.value = on * (0.25 + 2.2 * s);
    field.uniforms.uTime.value = heroFrame.time;
    cell.uniforms.uTime.value = heroFrame.time;
    if (halo.current) halo.current.intensity = on * (0.6 + 6 * s);
    (lead.material as THREE.LineDashedMaterial).opacity = 0.4 * THREE.MathUtils.smoothstep(heroFrame.p, 0.2, 0.3);
  });

  return (
    <group position={[DX, 0, 0]}>
      <mesh material={cell} renderOrder={4}>
        <boxGeometry args={[0.56, 0.56, 0.56]} />
      </mesh>
      <mesh material={electrode} position={[0, 0.24, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.34]} />
      </mesh>
      <mesh material={electrode} position={[0, -0.24, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.34]} />
      </mesh>
      {fieldXs.map((x) => (
        <mesh key={x} geometry={fieldGeo} material={field} position={[x, 0, 0]} renderOrder={5} />
      ))}
      <mesh material={housing} position={[0, -0.5, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.62]} />
      </mesh>
      <mesh material={housing} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.62]} />
      </mesh>
      <primitive object={lead} />
      <pointLight ref={halo} color="#8fd8ff" distance={3} decay={2} position={[0, 0, 0.5]} />
    </group>
  );
}

export function Detector() {
  return (
    <>
      <Suppressor />
      <ConductivityCell />
    </>
  );
}
