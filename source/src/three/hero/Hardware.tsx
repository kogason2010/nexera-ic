import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAYOUT } from './flowPath';
import { heroFrame } from './heroFrame';
import type { HardwareMats } from './uniforms';

const L = LAYOUT;

function useLathe(profile: [number, number][], seg = 40) {
  const g = useMemo(() => new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg), [profile, seg]);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

const BOTTLE: [number, number][] = [
  [0, 0],
  [0.58, 0],
  [0.62, 0.05],
  [0.62, 1.85],
  [0.5, 2.1],
  [0.24, 2.3],
  [0.2, 2.5],
];
const WASTE: [number, number][] = [
  [0, 0],
  [0.36, 0],
  [0.38, 0.04],
  [0.38, 0.72],
  [0.2, 0.86],
  [0.15, 0.95],
];

/** Eluent reservoir: glass bottle, eluent, screw cap; the draw-off line is part of the tubing. */
function Reservoir({ m }: { m: HardwareMats }) {
  const glass = useLathe(BOTTLE);
  return (
    <group position={[L.bottle.x, L.bottle.y, 0]}>
      <mesh geometry={glass} material={m.glass} renderOrder={5} />
      <mesh position={[0, 0.85, 0]} renderOrder={3}>
        <cylinderGeometry args={[0.58, 0.58, 1.65, 40]} />
        <meshStandardMaterial color="#5f8fb8" transparent opacity={0.28} roughness={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.56, 0]} material={m.peekDark}>
        <cylinderGeometry args={[0.24, 0.24, 0.2, 28]} />
      </mesh>
    </group>
  );
}

/** Tandem plunger pump: housing, two pump heads with inlet/outlet check valves. */
function Pump({ m }: { m: HardwareMats }) {
  return (
    <group position={[L.pump.x, L.pump.y, 0]}>
      <mesh material={m.housingLight}>
        <boxGeometry args={[1.35, 1.05, 0.8]} />
      </mesh>
      <mesh material={m.housing} position={[0, -0.05, 0.41]}>
        <boxGeometry args={[1.2, 0.86, 0.02]} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <group key={x} position={[x, 0.3, 0.42]}>
          <mesh material={m.peek} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.2, 0.2, 0.24, 32]} />
          </mesh>
          <mesh material={m.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.27]}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 6]} />
          </mesh>
          {[-1, 1].map((sy) => (
            <mesh key={sy} material={m.steel} position={[0, sy * 0.27, 0.12]}>
              <cylinderGeometry args={[0.05, 0.05, 0.16, 16]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Injection valve (simplified): stator with ports, rotor that switches from LOAD to INJECT. */
function Valve({ m }: { m: HardwareMats }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame(() => {
    if (rotor.current) rotor.current.rotation.z = -heroFrame.inject * (Math.PI / 3);
  });
  return (
    <group position={[L.valve.x, L.valve.y, -0.1]}>
      <mesh material={m.steel} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[L.valve.r + 0.06, L.valve.r + 0.06, 0.24, 48]} />
      </mesh>
      <group ref={rotor} position={[0, 0, 0.13]}>
        <mesh material={m.peekDark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 40]} />
        </mesh>
        <mesh material={m.steel} position={[0, 0.2, 0.03]}>
          <boxGeometry args={[0.05, 0.16, 0.02]} />
        </mesh>
      </group>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} material={m.peek} position={[Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.1, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

function ColumnEnd({ x, dir, r, m }: { x: number; dir: 1 | -1; r: number; m: HardwareMats }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh material={m.steel} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r + 0.06, r + 0.06, 0.32, 6]} />
      </mesh>
      <mesh material={m.peek} rotation={[0, 0, Math.PI / 2]} position={[dir * 0.24, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.2, 6]} />
      </mesh>
    </group>
  );
}

/**
 * Guard + analytical column. The analytical column has a front cut-away window revealing the
 * packed resin bed (the bed itself is drawn by ColumnBed).
 */
function Columns({ m }: { m: HardwareMats }) {
  const c = L.column;
  const ro = c.r + 0.05;
  const geos = useMemo(() => {
    const full = (len: number) => new THREE.CylinderGeometry(ro, ro, len, 56, 1, true).rotateZ(Math.PI / 2);
    const half = (r: number, len: number) =>
      new THREE.CylinderGeometry(r, r, len, 40, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
    const lenA = c.win0 - c.x0;
    const lenB = c.x1 - c.win1;
    const lenW = c.win1 - c.win0;
    const ring = new THREE.RingGeometry(c.r, ro, 32, 1, -Math.PI / 2, Math.PI).rotateY(Math.PI / 2);
    const edge = new THREE.BoxGeometry(lenW, ro - c.r, 0.004);
    return { a: full(lenA), b: full(lenB), outer: half(ro, lenW), inner: half(c.r, lenW), ring, edge, lenA, lenB, lenW };
  }, [c, ro]);
  useEffect(() => () => Object.values(geos).forEach((g) => typeof g !== 'number' && g.dispose()), [geos]);

  const g = L.guard;
  const inner = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#141a22', roughness: 0.9, metalness: 0, side: THREE.BackSide }),
    [],
  );
  useEffect(() => () => inner.dispose(), [inner]);

  return (
    <group>
      {/* guard column */}
      <mesh material={m.housingLight} position={[(g.x0 + g.x1) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[g.r, g.r, g.x1 - g.x0, 32]} />
      </mesh>
      <ColumnEnd x={g.x0} dir={-1} r={g.r - 0.04} m={m} />
      <ColumnEnd x={g.x1} dir={1} r={g.r - 0.04} m={m} />

      {/* analytical column */}
      <mesh geometry={geos.a} material={m.housingLight} position={[c.x0 + geos.lenA / 2, 0, 0]} />
      <mesh geometry={geos.b} material={m.housingLight} position={[c.win1 + geos.lenB / 2, 0, 0]} />
      <mesh geometry={geos.outer} material={m.housingLight} position={[c.win0 + geos.lenW / 2, 0, 0]} />
      <mesh geometry={geos.inner} material={inner} position={[c.win0 + geos.lenW / 2, 0, 0]} />
      <mesh geometry={geos.ring} material={m.steel} position={[c.win0, 0, 0]} />
      <mesh geometry={geos.ring} material={m.steel} position={[c.win1, 0, 0]} />
      {[1, -1].map((sy) => (
        <mesh key={sy} geometry={geos.edge} material={m.steel} position={[c.win0 + geos.lenW / 2, sy * (c.r + (ro - c.r) / 2), 0]} />
      ))}
      <ColumnEnd x={c.x0} dir={-1} r={c.r} m={m} />
      <ColumnEnd x={c.x1} dir={1} r={c.r} m={m} />
    </group>
  );
}

function Waste({ m }: { m: HardwareMats }) {
  const glass = useLathe(WASTE, 32);
  return (
    <group position={[L.waste.x, L.waste.y, 0]}>
      <mesh geometry={glass} material={m.glass} renderOrder={5} />
      <mesh position={[0, 0.2, 0]} renderOrder={3}>
        <cylinderGeometry args={[0.35, 0.35, 0.36, 32]} />
        <meshStandardMaterial color="#6d7f93" transparent opacity={0.3} roughness={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Hardware({ m }: { m: HardwareMats }) {
  return (
    <group>
      <Reservoir m={m} />
      <Pump m={m} />
      <Valve m={m} />
      <Columns m={m} />
      <Waste m={m} />
    </group>
  );
}
