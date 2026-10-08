import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { glyphFragment, ionVertex, sheetFragment, sheetVertex } from '../../shaders/flow';
import { normal, rng } from '../../utils/math';
import { LAYOUT, S } from './flowPath';
import { heroFrame, heroScreen } from './heroFrame';
import { bandUniforms, type HardwareMats } from './uniforms';

const CL = LAYOUT.cell;
const IN = LAYOUT.inset;
const HX = (CL.x0 + CL.x1) / 2;
const HW = CL.x1 - CL.x0 + 0.2;
const HH = 0.6;
const S0 = S.cellIn - 0.05;
const S1 = S.cellOut + 0.05;

/**
 * Enclosed flow-through conductivity cell (physical scale, closed housing) plus a clearly separate,
 * magnified cut-away of its interior: two electrodes measure the conductivity of the solution that
 * flows between them. No beams, no vacuum, no impacts — just liquid passing electrodes.
 */
export function CellView({ m }: { m: HardwareMats }) {
  const { gl, camera, size } = useThree();

  const liquid = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sheetVertex,
        fragmentShader: sheetFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          ...bandUniforms,
          uS0: { value: S0 },
          uS1: { value: S1 },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uBase: { value: new THREE.Color('#2f5873') },
          uBandGain: { value: 1.25 },
          uFlow: { value: 1 },
        },
      }),
    [],
  );

  const ions = useMemo(() => {
    const rand = rng(83);
    const per = 26;
    const bg = 60;
    const n = per * 7 + bg;
    const seed = new Float32Array(n * 4);
    const band = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      band[i] = i < per * 7 ? i % 7 : 7;
      seed[i * 4] = Math.max(-2.4, Math.min(2.4, normal(rand)));
      seed[i * 4 + 1] = rand();
      seed[i * 4 + 2] = rand();
      seed[i * 4 + 3] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aBand', new THREE.BufferAttribute(band, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(IN.x, IN.y, 0), 5);
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
        uSize: { value: 52 },
        uMode: { value: 2 },
        uS0: { value: S0 },
        uS1: { value: S1 },
        uOrigin: { value: new THREE.Vector3(IN.x - IN.len / 2, IN.y, 0.06) },
        uScale: { value: IN.len / (S1 - S0) },
        uHalf: { value: new THREE.Vector3(0, IN.h / 2 - 0.2, 0.08) },
        uFb: { value: new Array(8).fill(0) },
        uOpacity: { value: 1 },
      },
    });
    return { g, mat };
  }, []);

  const lines = useMemo(() => {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(IN.len + 0.2, IN.h + 0.2, 0.3)),
      m.line,
    );
    frame.position.set(IN.x, IN.y, -0.05);
    const pts = [
      new THREE.Vector3(HX - HW / 2, HH / 2, 0.3),
      new THREE.Vector3(IN.x - IN.len / 2 - 0.1, IN.y - IN.h / 2 - 0.1, 0.1),
      new THREE.Vector3(HX + HW / 2, HH / 2, 0.3),
      new THREE.Vector3(IN.x + IN.len / 2 + 0.1, IN.y - IN.h / 2 - 0.1, 0.1),
    ];
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    const leaders = new THREE.LineSegments(lg, m.dashed);
    leaders.computeLineDistances();
    return { frame, leaders };
  }, [m.line, m.dashed]);

  useEffect(
    () => () => {
      liquid.dispose();
      ions.g.dispose();
      ions.mat.dispose();
      lines.frame.geometry.dispose();
      lines.leaders.geometry.dispose();
    },
    [liquid, ions, lines],
  );

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    liquid.uniforms.uTime.value = heroFrame.time;
    const u = ions.mat.uniforms;
    u.uSim.value = heroFrame.sim;
    u.uTime.value = heroFrame.time;
    u.uPix.value = gl.getPixelRatio();
    v.set(HX, HH / 2 + 0.05, 0).project(camera);
    heroScreen.cell.x = (v.x * 0.5 + 0.5) * size.width;
    heroScreen.cell.y = (-v.y * 0.5 + 0.5) * size.height;
    heroScreen.cell.on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
  });

  return (
    <group>
      {/* the real cell: a small closed block with inlet/outlet fittings */}
      <mesh material={m.darkSteel} position={[HX, 0, 0]}>
        <boxGeometry args={[HW, HH, 0.6]} />
      </mesh>
      {[CL.x0 - 0.06, CL.x1 + 0.06].map((x) => (
        <mesh key={x} material={m.peek} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.16, 6]} />
        </mesh>
      ))}
      <mesh material={m.housing} position={[HX, HH / 2 + 0.05, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
      </mesh>

      {/* magnified interior (explanatory scale) */}
      <primitive object={lines.frame} />
      <primitive object={lines.leaders} />
      <mesh position={[IN.x, IN.y, -0.2]}>
        <planeGeometry args={[IN.len + 0.2, IN.h + 0.2]} />
        <meshBasicMaterial color="#0b1118" transparent opacity={0.82} depthWrite={false} />
      </mesh>
      <mesh material={liquid} position={[IN.x, IN.y, 0]} renderOrder={4}>
        <planeGeometry args={[IN.len, IN.h - 0.2]} />
      </mesh>
      {[1, -1].map((sy) => (
        <mesh key={sy} material={m.electrode} position={[IN.x, IN.y + sy * (IN.h / 2 - 0.04), 0]}>
          <boxGeometry args={[IN.len * 0.5, 0.06, 0.25]} />
        </mesh>
      ))}
      {[1, -1].map((sy) => (
        <mesh key={`w${sy}`} material={m.electrode} position={[IN.x + 0.6, IN.y + sy * (IN.h / 2 + 0.2), 0]}>
          <boxGeometry args={[0.025, 0.42, 0.025]} />
        </mesh>
      ))}
      <points geometry={ions.g} material={ions.mat} frustumCulled={false} renderOrder={9} />
    </group>
  );
}

export const CELL_ANCHORS = {
  housing: new THREE.Vector3(HX, -HH / 2 - 0.1, 0),
  inset: new THREE.Vector3(IN.x, IN.y + IN.h / 2 + 0.45, 0),
};
