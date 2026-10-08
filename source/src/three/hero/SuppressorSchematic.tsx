import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { glyphFragment, glyphStaticVertex, ionVertex, sheetFragment, sheetVertex } from '../../shaders/flow';
import { normal, rng } from '../../utils/math';
import { LAYOUT, PATH, S } from './flowPath';
import { heroFrame } from './heroFrame';
import { bandUniforms, type HardwareMats } from './uniforms';

const P = LAYOUT.supp;
const LEN = P.x1 - P.x0;
const CH = P.ch; // centre-to-centre spacing of the channels
const CH_H = 0.26; // channel height
const MEM_Y = CH / 2;
const ELEC_Y = CH + CH_H / 2 + 0.06;

function regenRange(top: boolean): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const q of PATH) {
    if (q.kind !== 'regen' || q.p.y > 0 !== top) continue;
    lo = Math.min(lo, q.s);
    hi = Math.max(hi, q.s);
  }
  return [lo, hi];
}

function sheet(s0: number, s1: number, base: string, gain: number, flow: number) {
  return new THREE.ShaderMaterial({
    vertexShader: sheetVertex,
    fragmentShader: sheetFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...bandUniforms,
      uS0: { value: s0 },
      uS1: { value: s1 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBase: { value: new THREE.Color(base) },
      uBandGain: { value: gain },
      uFlow: { value: flow },
    },
  });
}

/**
 * Labelled schematic of anion membrane suppression (not the internal construction of the ICDS-Ai):
 * the analytical channel sits between two cation-exchange membranes. Water electrolysis at the
 * anode supplies H⁺, which crosses into the analytical stream; Na⁺ crosses out toward the cathode.
 * Carbonate background becomes weakly conducting carbonic acid; the sample anions pass through.
 */
export function SuppressorSchematic({ m }: { m: HardwareMats }) {
  const { gl } = useThree();
  const [top0, top1] = useMemo(() => regenRange(true), []);
  const [bot0, bot1] = useMemo(() => regenRange(false), []);

  const sheets = useMemo(
    () => ({
      // top channel flows right → left, so its left edge is the downstream end
      top: sheet(top1, top0, '#2c4a63', 0.25, -1),
      mid: sheet(S.suppIn, S.suppOut, '#3a6e93', 1, 1),
      bot: sheet(bot0, bot1, '#2c4a63', 0.25, 1),
    }),
    [top0, top1, bot0, bot1],
  );

  // analyte ions passing through the analytical channel (GPU, same band model)
  const analytes = useMemo(() => {
    const rand = rng(61);
    const per = 34;
    const n = per * 7;
    const seed = new Float32Array(n * 4);
    const band = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      band[i] = i % 7;
      seed[i * 4] = Math.max(-2.4, Math.min(2.4, normal(rand)));
      seed[i * 4 + 1] = rand();
      seed[i * 4 + 2] = rand();
      seed[i * 4 + 3] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aBand', new THREE.BufferAttribute(band, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);
    const mat = new THREE.ShaderMaterial({
      vertexShader: ionVertex,
      fragmentShader: glyphFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...bandUniforms,
        uSim: { value: 0 },
        uTime: { value: 0 },
        uPix: { value: 1 },
        uSize: { value: 46 },
        uMode: { value: 1 },
        uS0: { value: S.suppIn },
        uS1: { value: S.suppOut },
        uOrigin: { value: new THREE.Vector3(P.x0, P.y, 0.05) },
        uScale: { value: 1 },
        uHalf: { value: new THREE.Vector3(0, CH_H / 2 - 0.04, 0.12) },
        uFb: { value: new Array(8).fill(0) },
        uOpacity: { value: 1 },
      },
    });
    return { g, mat };
  }, []);

  // background ions (CPU-animated): Na⁺ out, H⁺ in, carbonate → carbonic acid, electrolysis gas
  const bg = useMemo(() => {
    const rand = rng(71);
    const spec: { type: number; a: number; b: number; c: number }[] = [];
    for (let i = 0; i < 34; i++) spec.push({ type: 2, a: rand(), b: rand(), c: rand() }); // Na+
    for (let i = 0; i < 34; i++) spec.push({ type: 3, a: rand(), b: rand(), c: rand() }); // H+
    for (let i = 0; i < 36; i++) spec.push({ type: 1, a: rand(), b: rand(), c: rand() }); // carbonate
    for (let i = 0; i < 28; i++) spec.push({ type: 9, a: rand(), b: rand(), c: rand() }); // gas
    const n = spec.length;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aType', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aBand', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(P.x0 + LEN / 2, 0, 0), 4);
    const mat = new THREE.ShaderMaterial({
      vertexShader: glyphStaticVertex,
      fragmentShader: glyphFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { ...bandUniforms, uPix: { value: 1 }, uSize: { value: 40 }, uOpacity: { value: 1 } },
    });
    return { spec, g, mat };
  }, []);

  useEffect(
    () => () => {
      Object.values(sheets).forEach((s) => s.dispose());
      analytes.g.dispose();
      analytes.mat.dispose();
      bg.g.dispose();
      bg.mat.dispose();
    },
    [sheets, analytes, bg],
  );

  useFrame(() => {
    const t = heroFrame.time;
    const pr = gl.getPixelRatio();
    for (const s of Object.values(sheets)) s.uniforms.uTime.value = t;
    analytes.mat.uniforms.uSim.value = heroFrame.sim;
    analytes.mat.uniforms.uTime.value = t;
    analytes.mat.uniforms.uPix.value = pr;
    bg.mat.uniforms.uPix.value = pr;

    const pos = bg.g.attributes.position as THREE.BufferAttribute;
    const typ = bg.g.attributes.aType as THREE.BufferAttribute;
    const scl = bg.g.attributes.aScale as THREE.BufferAttribute;
    const z = 0.06;
    bg.spec.forEach((p, i) => {
      const u = (t * 0.16 + p.a) % 1;
      let x = 0;
      let y = 0;
      let type = p.type;
      let sc = 1;
      if (p.type === 2) {
        // Na⁺: enters with the eluent, migrates through the lower membrane toward the cathode
        const cross = 0.12 + p.b * 0.55;
        x = P.x0 + u * LEN;
        const f = THREE.MathUtils.smoothstep(u, cross, cross + 0.18);
        y = (p.c - 0.5) * 0.12 * (1 - f) - f * (CH + (p.c - 0.5) * 0.1);
        sc = 0.8;
      } else if (p.type === 3) {
        // H⁺: produced at the anode, crosses the upper membrane into the analytical stream
        const x0 = P.x0 + 0.1 + p.b * (LEN - 0.5);
        const f = THREE.MathUtils.smoothstep(u, 0, 0.4);
        y = ELEC_Y - 0.08 - f * (ELEC_Y - 0.08 - (p.c - 0.5) * 0.12);
        x = x0 + Math.max(0, u - 0.4) * LEN * 0.9;
        sc = x > P.x1 - 0.04 ? 0 : 0.62;
      } else if (p.type === 1) {
        // carbonate background: converted to carbonic acid on its way through
        x = P.x0 + u * LEN;
        y = (p.b - 0.5) * 0.16;
        type = u > 0.22 + p.c * 0.4 ? 4 : 1;
        sc = type === 4 ? 0.9 : 0.85;
      } else {
        // electrolysis gas carried along the electrode channels (O₂ at the anode, H₂ at the cathode)
        const topSide = p.b < 0.5;
        const uu = (t * 0.1 + p.a) % 1;
        x = topSide ? P.x1 - uu * LEN : P.x0 + uu * LEN;
        y = (topSide ? 1 : -1) * (CH + 0.05 + p.c * 0.05);
        type = 4;
        sc = 0.4 + p.c * 0.3;
      }
      pos.setXYZ(i, x, y, z + (i % 5) * 0.012);
      typ.setX(i, type);
      scl.setX(i, sc);
    });
    pos.needsUpdate = true;
    typ.needsUpdate = true;
    scl.needsUpdate = true;
  });

  const cx = P.x0 + LEN / 2;
  return (
    <group>
      {/* housing (front cut away) */}
      <mesh material={m.housing} position={[cx, 0, -0.32]}>
        <boxGeometry args={[LEN + 0.4, 2 * ELEC_Y + 0.4, 0.06]} />
      </mesh>
      {[-1, 1].map((sy) => (
        <mesh key={sy} material={m.housingLight} position={[cx, sy * (ELEC_Y + 0.16), -0.06]}>
          <boxGeometry args={[LEN + 0.4, 0.08, 0.5]} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} material={m.housingLight} position={[cx + sx * (LEN / 2 + 0.16), 0, -0.06]}>
          <boxGeometry args={[0.08, 2 * ELEC_Y + 0.4, 0.5]} />
        </mesh>
      ))}
      {/* electrodes */}
      {[1, -1].map((sy) => (
        <mesh key={sy} material={m.electrode} position={[cx, sy * ELEC_Y, -0.05]}>
          <boxGeometry args={[LEN - 0.1, 0.035, 0.42]} />
        </mesh>
      ))}
      {/* cation-exchange membranes */}
      {[1, -1].map((sy) => (
        <mesh key={sy} material={m.membrane} position={[cx, sy * MEM_Y, -0.05]} renderOrder={5}>
          <boxGeometry args={[LEN, 0.03, 0.44]} />
        </mesh>
      ))}
      {/* liquid in the three channels */}
      <mesh material={sheets.top} position={[cx, CH, 0]} renderOrder={4}>
        <planeGeometry args={[LEN, CH_H]} />
      </mesh>
      <mesh material={sheets.mid} position={[cx, 0, 0]} renderOrder={4}>
        <planeGeometry args={[LEN, CH_H]} />
      </mesh>
      <mesh material={sheets.bot} position={[cx, -CH, 0]} renderOrder={4}>
        <planeGeometry args={[LEN, CH_H]} />
      </mesh>
      <points geometry={bg.g} material={bg.mat} frustumCulled={false} renderOrder={8} />
      <points geometry={analytes.g} material={analytes.mat} frustumCulled={false} renderOrder={9} />
    </group>
  );
}

export const SUPP_ANCHORS = {
  anode: new THREE.Vector3(P.x0 + LEN / 2, ELEC_Y + 0.25, 0),
  cathode: new THREE.Vector3(P.x0 + LEN / 2, -ELEC_Y - 0.25, 0),
  mid: new THREE.Vector3(P.x0 + LEN / 2, 0, 0),
};
