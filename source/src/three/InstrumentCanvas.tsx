import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { flowTubeFragment, flowTubeVertex } from '../shaders/flowTube';
import { getQuality } from '../utils/quality';
import { heroState, instrumentState } from '../utils/scrollStore';
import { AdaptiveDpr } from './shared/AdaptiveDpr';
import { StudioEnvironment } from './shared/StudioEnvironment';

/**
 * Stylised, procedural Nexera IC stack (not a copy of product photography):
 * SI-150 autosampler + IC-150 main unit + IC-150D second channel, in proportion to the published
 * footprints (W 26 cm; H 28 cm / 49 cm; D 50 cm). 1 scene unit = 20 cm.
 */
const U = 1 / 20; // per cm
const W = 26 * U;
const D = 50 * U;
const H_IC = 49 * U;
const H_AS = 28 * U;
const GAP = 0.08;
const X_AS = -(W + GAP);
const X_IC = 0;
const X_D = W + GAP;
const ZF = D / 2; // front face

// focus points for each tour step (world)
const FOCUS: [number, number, number][] = [
  [X_AS, 0.85, ZF - 0.5], // autosampler
  [X_IC - 0.3, 0.95, ZF - 0.3], // pump + degasser
  [X_IC + 0.3, 1.1, ZF - 0.3], // oven
  [X_IC - 0.3, 2.05, ZF - 0.3], // suppressor
  [X_IC + 0.36, 0.5, ZF - 0.3], // detector cell
  [X_D, 1.2, ZF - 0.3], // dual channel
];

function glowMat(color: string) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.0, metalness: 0.4, roughness: 0.35 });
}

function Tower({
  x,
  h,
  window,
  doorOpacity,
  back = 0.5,
}: {
  x: number;
  h: number;
  window: 'full' | 'upper';
  doorOpacity: { current: number };
  back?: number;
}) {
  const body = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#15191f', metalness: 0.55, roughness: 0.42, envMapIntensity: 0.8 }),
    [],
  );
  const door = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0b0e13',
        metalness: 0.3,
        roughness: 0.08,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 1.6,
      }),
    [],
  );
  const geo = useMemo(() => new RoundedBoxGeometry(W, h, D * back, 4, 0.04), [h]);
  useEffect(
    () => () => {
      body.dispose();
      door.dispose();
      geo.dispose();
    },
    [body, door, geo],
  );
  useFrame(() => {
    door.opacity += (doorOpacity.current - door.opacity) * 0.08;
  });
  const dh = window === 'full' ? h - 0.12 : h * 0.55;
  const dy = window === 'full' ? h / 2 : h - dh / 2 - 0.08;
  const T = 0.03; // panel thickness
  return (
    <group position={[x, 0, 0]}>
      {/* cabinet: solid rear block + thin side, top and base panels, open toward the glass door */}
      <mesh geometry={geo} material={body} position={[0, h / 2, -D / 2 + (D * back) / 2]} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={body} position={[(sd * (W - T)) / 2, h / 2, 0]}>
          <boxGeometry args={[T, h, D]} />
        </mesh>
      ))}
      <mesh material={body} position={[0, h - T / 2, 0]}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      <mesh material={body} position={[0, T / 2, 0]}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {window === 'upper' && (
        <mesh material={body} position={[0, (h - dh - 0.08) / 2, ZF - 0.02]}>
          <boxGeometry args={[W, h - dh - 0.08, 0.03]} />
        </mesh>
      )}
      <mesh material={door} position={[0, dy, ZF - 0.02]} renderOrder={6}>
        <boxGeometry args={[W - 0.06, dh, 0.02]} />
      </mesh>
      {/* thin status light along the top of the door */}
      <mesh position={[0, h - 0.035, ZF + 0.002]}>
        <boxGeometry args={[W * 0.55, 0.008, 0.004]} />
        <meshBasicMaterial color="#6fb8ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Internals({ x, glow, dual = false }: { x: number; glow: THREE.MeshStandardMaterial[]; dual?: boolean }) {
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a7b1be', metalness: 1, roughness: 0.24, envMapIntensity: 1.2 }),
    [],
  );
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#232a34', metalness: 0.6, roughness: 0.4 }), []);
  const wire = useMemo(() => new THREE.LineBasicMaterial({ color: '#5a6a80', transparent: true, opacity: 0.6 }), []);
  const ovenBox = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.52, 1.5, 0.42)), []);
  const ovenLines = useMemo(() => new THREE.LineSegments(ovenBox, wire), [ovenBox, wire]);
  useEffect(
    () => () => {
      [metal, dark, wire].forEach((m) => m.dispose());
      ovenBox.dispose();
    },
    [metal, dark, wire, ovenBox],
  );
  const z = ZF - 0.3;
  const [gPump, gOven, gSupp, gCell] = glow;
  return (
    <group position={[x, 0, 0]}>
      {/* pump block with two plunger heads */}
      <mesh material={gPump} position={[-0.3, 1.2, z]}>
        <boxGeometry args={[0.46, 0.46, 0.3]} />
      </mesh>
      {[-0.4, -0.2].map((px) => (
        <mesh key={px} material={metal} position={[px, 1.2, z + 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 24]} />
        </mesh>
      ))}
      {/* degasser with coil */}
      <mesh material={dark} position={[-0.3, 0.55, z]}>
        <boxGeometry args={[0.46, 0.3, 0.26]} />
      </mesh>
      <mesh material={metal} position={[-0.3, 0.55, z + 0.15]}>
        <torusGeometry args={[0.09, 0.012, 8, 32]} />
      </mesh>
      {/* oven chamber: column, pre-heater, conductivity cell */}
      <group position={[0.3, 1.05, z]}>
        <primitive object={ovenLines} />
        <mesh material={gOven} position={[-0.05, 0.05, 0.05]}>
          <cylinderGeometry args={[0.045, 0.045, 1.0, 24]} />
        </mesh>
        <mesh material={metal} position={[-0.05, 0.6, 0.05]}>
          <torusGeometry args={[0.07, 0.01, 8, 24]} />
        </mesh>
        <mesh material={gCell} position={[0.1, -0.55, 0.06]}>
          <boxGeometry args={[0.16, 0.12, 0.12]} />
        </mesh>
      </group>
      {/* suppressor in the upper-left housing */}
      <mesh material={gSupp} position={[-0.3, 2.05, z]}>
        <boxGeometry args={[0.32, 0.22, 0.18]} />
      </mesh>
      {[-0.38, -0.22].map((px) => (
        <mesh key={px} material={metal} position={[px, 2.2, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 12]} />
        </mesh>
      ))}
      {/* control panel LEDs */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.22 + i * 0.07, 2.22, ZF - 0.01]}>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color={i === 2 ? '#6ee7c8' : '#3a4656'} toneMapped={false} />
        </mesh>
      ))}
      {/* eluent bottles on top */}
      {!dual &&
        [-0.3, 0.12].map((bx, i) => (
          <mesh key={bx} position={[bx, H_IC + 0.26, -0.1]}>
            <cylinderGeometry args={[0.15, 0.15, 0.5, 32]} />
            <meshPhysicalMaterial color={i ? '#cfe6ff' : '#e8f2ff'} transmission={0} transparent opacity={0.35} roughness={0.1} />
          </mesh>
        ))}
    </group>
  );
}

function Sampler({ glow }: { glow: THREE.MeshStandardMaterial }) {
  const vials = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 10);
    const mat = new THREE.MeshStandardMaterial({ color: '#cfdcea', metalness: 0.1, roughness: 0.3, transparent: true, opacity: 0.8 });
    const cols = 9;
    const rows = 6;
    const m = new THREE.InstancedMesh(geo, mat, cols * rows);
    const t = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        t.makeTranslation(-0.42 + (c / (cols - 1)) * 0.84, 0, -0.5 + (r / (rows - 1)) * 1.2);
        m.setMatrixAt(i++, t);
      }
    return m;
  }, []);
  useEffect(
    () => () => {
      vials.geometry.dispose();
      (vials.material as THREE.Material).dispose();
    },
    [vials],
  );
  return (
    <group position={[X_AS, 0, 0]}>
      <mesh material={glow} position={[0, 0.72, 0.15]}>
        <boxGeometry args={[1.0, 0.04, 1.5]} />
      </mesh>
      <primitive object={vials} position={[0, 0.78, 0.15]} />
      <mesh position={[0.1, 1.1, 0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
        <meshStandardMaterial color="#c6ced8" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Stack() {
  const glows = useMemo(
    () => ({
      sampler: glowMat('#2a3c52'),
      pump: glowMat('#2b3442'),
      oven: glowMat('#8fa3b8'),
      supp: glowMat('#2c3a4c'),
      cell: glowMat('#9fb3c8'),
      dPump: glowMat('#2b3442'),
      dOven: glowMat('#8fa3b8'),
      dSupp: glowMat('#2c3a4c'),
      dCell: glowMat('#9fb3c8'),
    }),
    [],
  );
  const doorIC = useRef(0.85);
  const doorAS = useRef(0.85);
  const doorD = useRef(0.85);
  const plinth = useMemo(() => new THREE.MeshStandardMaterial({ color: '#10141a', metalness: 0.5, roughness: 0.6 }), []);
  const tubeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: flowTubeVertex,
        fragmentShader: flowTubeFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uHead: { value: 0 } },
      }),
    [],
  );
  // eluent bottle → degasser → pump → autosampler valve → pre-heater → column → suppressor → cell
  const { tube, stops } = useMemo(() => {
    const z = ZF - 0.12;
    const pts = [
      new THREE.Vector3(-0.3, H_IC + 0.05, 0.1),
      new THREE.Vector3(-0.3, H_IC - 0.1, z),
      new THREE.Vector3(-0.42, 0.55, z),
      new THREE.Vector3(-0.3, 1.2, z + 0.05),
      new THREE.Vector3(-0.62, 1.0, z),
      new THREE.Vector3(X_AS + 0.3, 0.95, z),
      new THREE.Vector3(X_AS + 0.1, 0.85, z),
      new THREE.Vector3(-0.62, 1.55, z),
      new THREE.Vector3(0.25, 1.75, z),
      new THREE.Vector3(0.25, 1.6, z),
      new THREE.Vector3(0.25, 0.6, z),
      new THREE.Vector3(0.0, 0.6, z),
      new THREE.Vector3(-0.1, 1.9, z),
      new THREE.Vector3(-0.3, 2.05, z + 0.02),
      new THREE.Vector3(0.05, 1.95, z),
      new THREE.Vector3(0.4, 0.5, z),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const tube = new THREE.TubeGeometry(curve, 500, 0.012, 8, false);
    const targets = [pts[6], pts[3], pts[10], pts[13], pts[15]];
    const stops = targets.map((p) => {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i <= 600; i++) {
        const d = curve.getPointAt(i / 600).distanceToSquared(p);
        if (d < bd) {
          bd = d;
          best = i / 600;
        }
      }
      return best;
    });
    return { tube, stops };
  }, []);

  useEffect(
    () => () => {
      Object.values(glows).forEach((m) => m.dispose());
      tube.dispose();
      tubeMat.dispose();
      plinth.dispose();
    },
    [glows, tube, tubeMat, plinth],
  );

  const head = useRef(0);
  useFrame((state, dt) => {
    const a = instrumentState.active;
    const k = 1 - Math.exp(-dt * 4);
    const set = (m: THREE.MeshStandardMaterial, on: boolean, color: string) => {
      m.emissiveIntensity += ((on ? 1.4 : 0) - m.emissiveIntensity) * k;
      m.emissive.set(color);
    };
    set(glows.sampler, a === 0, '#3f8fd8');
    set(glows.pump, a === 1, '#3f8fd8');
    set(glows.oven, a === 2, '#ff9a5a');
    set(glows.supp, a === 3, '#63d3ff');
    set(glows.cell, a === 4, '#8fe3ff');
    for (const m of [glows.dPump, glows.dOven, glows.dSupp, glows.dCell]) set(m, a === 5, '#c39bff');
    doorAS.current = a === 0 ? 0.06 : 0.8;
    doorIC.current = a >= 1 && a <= 4 ? 0.06 : a === 6 ? 0.45 : 0.8;
    doorD.current = a === 5 ? 0.06 : 0.8;
    const target = a < 0 ? 0 : a >= 4 ? 1 : stops[Math.min(a, stops.length - 1)] + 0.01;
    head.current += (target - head.current) * (1 - Math.exp(-dt * 1.8));
    tubeMat.uniforms.uHead.value = head.current;
    tubeMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      <FocusLight />
      <mesh material={plinth} position={[0, -0.04, 0]}>
        <boxGeometry args={[5.2, 0.08, 3.2]} />
      </mesh>
      <Tower x={X_AS} h={H_AS} window="upper" doorOpacity={doorAS} back={0.18} />
      <Tower x={X_IC} h={H_IC} window="full" doorOpacity={doorIC} />
      <Tower x={X_D} h={H_IC} window="full" doorOpacity={doorD} />
      <Sampler glow={glows.sampler} />
      <Internals x={X_IC} glow={[glows.pump, glows.oven, glows.supp, glows.cell]} />
      <Internals x={X_D} dual glow={[glows.dPump, glows.dOven, glows.dSupp, glows.dCell]} />
      <mesh geometry={tube} material={tubeMat} renderOrder={7} />
    </group>
  );
}

function FocusLight() {
  const light = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Vector3(0, 1.2, 2.5), []);
  useFrame(() => {
    const a = instrumentState.active;
    if (a >= 0 && a <= 5) target.set(FOCUS[a][0] + 0.4, FOCUS[a][1] + 0.3, ZF + 1.2);
    else target.set(0, 1.6, ZF + 2.5);
    light.current?.position.lerp(target, 0.06);
  });
  return <pointLight ref={light} intensity={6} distance={6} decay={2} color="#cfe2ff" position={[0, 1.2, 2.5]} />;
}

function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(2.5, 2.4, 7.5), []);
  const look = useMemo(() => new THREE.Vector3(0, 1.1, 0), []);
  const tPos = useMemo(() => new THREE.Vector3(), []);
  const tLook = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const portrait = size.width / size.height < 1;
    const a = instrumentState.active;
    if (a < 0 || a > 5 || reducedMotion) {
      tPos.set(2.6, 2.6, portrait ? 13 : 8.4);
      tLook.set(portrait ? 0 : -0.9, 1.15, 0);
    } else {
      const f = FOCUS[a];
      const dist = portrait ? 7.5 : a === 5 ? 6.2 : 4.6;
      tPos.set(f[0] + (portrait ? 0.2 : 1.1), f[1] + 0.55, f[2] + dist);
      tLook.set(f[0] - (portrait ? 0 : 1.2), f[1] - 0.05, f[2]);
    }
    tPos.x += heroState.pointerX * 0.3;
    tPos.y += heroState.pointerY * 0.2;
    const k = 1 - Math.exp(-dt * 2.4);
    pos.lerp(tPos, k);
    look.lerp(tLook, k);
    camera.position.copy(pos);
    camera.lookAt(look);
  });
  return null;
}

export default function InstrumentCanvas({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const q = getQuality();
  return (
    <Canvas
      className="instrument-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={q.dpr}
      camera={{ fov: 34, near: 0.1, far: 60, position: [2.5, 2.4, 7.5] }}
      gl={{ antialias: q.tier !== 'low', alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden="true"
    >
      <StudioEnvironment intensity={0.7} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 7, 6]} intensity={1.3} color="#e6eeff" />
      <directionalLight position={[-7, 3, -5]} intensity={0.9} color="#8fb0ff" />
      <directionalLight position={[2, -2, 6]} intensity={0.25} color="#ffcf9e" />
      <Rig reducedMotion={reducedMotion} />
      <Stack />
      <AdaptiveDpr min={q.dpr[0]} max={q.dpr[1]} />
    </Canvas>
  );
}
