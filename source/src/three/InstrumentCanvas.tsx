import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type MeshProps } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { flowTubeFragment, flowTubeVertex } from '../shaders/flowTube';
import { getQuality } from '../utils/quality';
import { heroState, instrumentState } from '../utils/scrollStore';
import { AdaptiveDpr } from './shared/AdaptiveDpr';
import { CALLOUTS, calloutEls } from './instrumentCallouts';
import { StudioEnvironment } from './shared/StudioEnvironment';

/**
 * Procedural, illustrative Nexera IC stack (modelled from scratch, not from product photography or CAD):
 * SI-150 autosampler + IC-150 main unit + IC-150D second channel, in proportion to the published
 * footprints (W 26 cm; H 28 cm / 49 cm; D 50 cm). 1 scene unit = 20 cm.
 */
const U = 1 / 20; // per cm
const W = 26 * U;
const D = 50 * U;
const H_IC = 49 * U;
const H_AS = 28 * U;
const GAP = 0.06;
const X_AS = -(W + GAP);
const X_IC = 0;
const X_D = W + GAP;
const ZF = D / 2; // front face
const T = 0.05; // shell panel thickness
const BAY = 0.64; // depth of the open service bay behind each door
const BZ = ZF - BAY; // bay back wall
const FEET = 0.04;

// focus points for each tour step (world)
const FOCUS: [number, number, number][] = [
  [X_AS, 0.85, ZF - 0.4], // autosampler
  [X_IC - 0.28, 1.0, ZF - 0.3], // pump + degasser
  [X_IC + 0.28, 1.25, ZF - 0.3], // oven
  [X_IC - 0.28, 1.95, ZF - 0.3], // suppressor
  [X_IC + 0.36, 0.55, ZF - 0.3], // detector cell
  [(X_IC + X_D) / 2 - 0.3, 1.2, ZF - 0.3], // dual channel
];



/* ---------------------------------------------------------------- textures */

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Fine speckle used as roughness + bump for a powder-coat finish. */
function grainTexture() {
  return canvasTex(256, (g, s) => {
    const img = g.createImageData(s, s);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < s * s; i++) {
      const v = 150 + rnd() * 70;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

/** Horizontal streaks for brushed stainless. */
function brushedTexture() {
  return canvasTex(256, (g, s) => {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, s, s);
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) {
      const v = Math.floor(110 + rnd() * 110);
      g.fillStyle = `rgba(${v},${v},${v},0.35)`;
      g.fillRect(0, rnd() * s, s, 0.6 + rnd());
    }
  });
}

function radialTexture(inner: string, outer: string) {
  const t = canvasTex(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, inner);
    r.addColorStop(1, outer);
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Plain model-number plate (no logos or brand marks). */
function labelTexture(text: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 512, 96);
  g.fillStyle = '#9aa2ab';
  g.font = '500 54px Inter, Helvetica, Arial, sans-serif';
  g.textBaseline = 'middle';
  g.fillText(text, 8, 50);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/* --------------------------------------------------------------- materials */

type Mats = ReturnType<typeof createMats>;

function createMats() {
  const grain = grainTexture();
  grain.repeat.set(4, 4);
  const brush = brushedTexture();
  brush.repeat.set(2, 2);
  const textures = [grain, brush];
  const m = {
    body: new THREE.MeshPhysicalMaterial({
      color: '#d2d7dd',
      roughness: 0.52,
      metalness: 0.04,
      clearcoat: 0.3,
      clearcoatRoughness: 0.45,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.0015,
      envMapIntensity: 0.9,
    }),
    door: new THREE.MeshPhysicalMaterial({
      color: '#dde1e5',
      roughness: 0.42,
      metalness: 0.03,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      roughnessMap: grain,
      envMapIntensity: 1,
    }),
    black: new THREE.MeshPhysicalMaterial({
      color: '#0c0d10',
      roughness: 0.5,
      metalness: 0.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.85,
    }),
    silver: new THREE.MeshPhysicalMaterial({
      color: '#a9afb6',
      roughness: 0.45,
      metalness: 0.6,
      roughnessMap: brush,
      clearcoat: 0.15,
      envMapIntensity: 0.85,
    }),
    chrome: new THREE.MeshStandardMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.16, envMapIntensity: 1.2 }),
    cadLight: new THREE.MeshStandardMaterial({ color: '#c3c8ce', roughness: 0.62, metalness: 0.12 }),
    cadMid: new THREE.MeshStandardMaterial({ color: '#7d848c', roughness: 0.55, metalness: 0.35 }),
    cadDark: new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.6, metalness: 0.2 }),
    tubeWhite: new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.45, metalness: 0 }),
    suppBody: new THREE.MeshStandardMaterial({ color: '#4d5761', roughness: 0.5, metalness: 0.2 }),
    brass: new THREE.MeshStandardMaterial({ color: '#b89a5e', roughness: 0.4, metalness: 0.8 }),
    warn: new THREE.MeshStandardMaterial({ color: '#e7c24b', roughness: 0.6 }),
    edge: new THREE.LineBasicMaterial({ color: '#07090c', transparent: true, opacity: 0.6 }),
    housingGrey: new THREE.MeshStandardMaterial({ color: '#8e959e', roughness: 0.55, metalness: 0.35 }),
    ovenGlass: new THREE.MeshPhysicalMaterial({
      color: '#b8c8d8',
      roughness: 0.1,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      envMapIntensity: 0.9,
    }),
    interior: new THREE.MeshStandardMaterial({ color: '#262b32', roughness: 0.75, metalness: 0.25 }),
    brushed: new THREE.MeshStandardMaterial({ color: '#8b939d', metalness: 0.85, roughness: 0.42, roughnessMap: brush }),
    steel: new THREE.MeshStandardMaterial({ color: '#c9d0d8', metalness: 1, roughness: 0.25, envMapIntensity: 1.2 }),
    peek: new THREE.MeshStandardMaterial({ color: '#cdbf9c', roughness: 0.55, metalness: 0 }),
    peekDark: new THREE.MeshStandardMaterial({ color: '#363b42', roughness: 0.5, metalness: 0.1 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#15181c', roughness: 0.92, metalness: 0 }),
    slot: new THREE.MeshStandardMaterial({ color: '#0c0f12', roughness: 0.9, metalness: 0 }),
    strip: new THREE.MeshPhysicalMaterial({ color: '#0f1317', roughness: 0.2, metalness: 0.1, clearcoat: 1 }),
    paper: new THREE.MeshStandardMaterial({ color: '#f1f1ec', roughness: 0.9, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#0d141b',
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
    vial: new THREE.MeshPhysicalMaterial({ color: '#eaf2f8', roughness: 0.06, transparent: true, opacity: 0.5, envMapIntensity: 1.4 }),
    cap: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0 }),
    bottle: new THREE.MeshPhysicalMaterial({
      color: '#e3edf5',
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      transparent: true,
      opacity: 0.28,
      envMapIntensity: 1.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    liquid: new THREE.MeshPhysicalMaterial({ color: '#9cc6ea', roughness: 0.1, transparent: true, opacity: 0.32, depthWrite: false }),
    bottleCap: new THREE.MeshStandardMaterial({ color: '#2a5ea8', roughness: 0.5, metalness: 0 }),
    ptfe: new THREE.MeshStandardMaterial({ color: '#eef2f5', roughness: 0.4, metalness: 0, transparent: true, opacity: 0.85 }),
    cable: new THREE.MeshStandardMaterial({ color: '#1a1d21', roughness: 0.6, metalness: 0 }),
    anion: new THREE.MeshStandardMaterial({ color: '#2f78d0', roughness: 0.45 }),
    cation: new THREE.MeshStandardMaterial({ color: '#d9822e', roughness: 0.45 }),
  };
  return { ...m, textures };
}

let shared: Mats | null = null;
function mats() {
  if (!shared) shared = createMats();
  return shared;
}
function disposeMats() {
  if (!shared) return;
  for (const [k, v] of Object.entries(shared)) {
    if (k === 'textures') (v as THREE.Texture[]).forEach((t) => t.dispose());
    else (v as THREE.Material).dispose();
  }
  shared = null;
}

function glowMat(color: string, metalness = 0.5, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({ color, emissive: '#000000', emissiveIntensity: 0, metalness, roughness });
}

/* -------------------------------------------------------------- primitives */

type Vec3 = [number, number, number];

function RBox({ s, r = 0.015, m, ...p }: { s: Vec3; r?: number; m: THREE.Material } & Omit<MeshProps, 'args'>) {
  const geo = useMemo(() => new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.min(r, Math.min(...s) / 2 - 1e-4)), [s[0], s[1], s[2], r]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m} {...p} />;
}

function Box({ s, m, ...p }: { s: Vec3; m: THREE.Material } & Omit<MeshProps, 'args'>) {
  return (
    <mesh material={m} {...p}>
      <boxGeometry args={s} />
    </mesh>
  );
}

function Cyl({
  r,
  h,
  m,
  seg = 24,
  open = false,
  ...p
}: { r: number; h: number; m: THREE.Material; seg?: number; open?: boolean } & Omit<MeshProps, 'args'>) {
  return (
    <mesh material={m} {...p}>
      <cylinderGeometry args={[r, r, h, seg, 1, open]} />
    </mesh>
  );
}

function Tube({ pts, r, m, closed = false }: { pts: Vec3[]; r: number; m: THREE.Material; closed?: boolean }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(...p)),
      closed,
      'centripetal',
    );
    return new THREE.TubeGeometry(curve, 64, r, 8, closed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m} />;
}

function Label({ text, ...p }: { text: string } & Omit<MeshProps, 'args'>) {
  const tex = useMemo(() => labelTexture(text), [text]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh {...p} userData={{ noShadow: true }}>
      <planeGeometry args={[0.32, 0.06]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

/* ----------------------------------------------------------- cabinet parts */

/** Thin bright-metal rounded-rectangle inlay, like the trim on the door. */
function Outline({ w, h, r, ...p }: { w: number; h: number; r: number } & Omit<MeshProps, 'args'>) {
  const M = mats();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const pts = s.getSpacedPoints(160).map((v) => new THREE.Vector3(v.x, v.y, 0));
    pts.pop();
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 320, 0.0055, 6, true);
  }, [w, h, r]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={M.chrome} {...p} userData={{ noShadow: true }} />;
}

/** Hinged, opaque gloss-black front door. Origin is the bottom-left corner. */
function Door({
  w,
  h,
  open,
  label,
  hinge = 'left',
  status = false,
  led = '#39e07c',
  trim = true,
  strip = 0,
}: {
  w: number;
  h: number;
  open: { current: number };
  label: string;
  hinge?: 'left' | 'right' | 'top';
  status?: boolean;
  led?: string;
  trim?: boolean;
  strip?: number;
}) {
  const M = mats();
  const g = useRef<THREE.Group>(null);
  const angle = useRef(0);
  const maxA = hinge === 'top' ? 1.6 : 1.95;
  useFrame((_, dt) => {
    angle.current += (open.current * maxA - angle.current) * (1 - Math.exp(-dt * 3.2));
    if (!g.current) return;
    if (hinge === 'left') g.current.rotation.y = -angle.current;
    else if (hinge === 'right') g.current.rotation.y = angle.current;
    else g.current.rotation.x = -angle.current;
  });
  const pivot: Vec3 = hinge === 'right' ? [w, 0, 0] : hinge === 'top' ? [0, h, 0] : [0, 0, 0];
  const th = 0.05;
  const gx = hinge === 'right' ? 0.07 : w - 0.07;
  return (
    <group ref={g} position={pivot}>
      <group position={[-pivot[0], -pivot[1], th / 2]}>
        <RBox s={[w, h, th]} r={0.02} m={M.black} position={[w / 2, h / 2, 0]} />
        {trim && (
          <Outline w={w - strip - 0.09} h={h - 0.09} r={0.07} position={[strip + (w - strip) / 2, h / 2, th / 2 + 0.003]} />
        )}
        {/* inner gasket, seen when the door is open */}
        <Outline w={w - 0.06} h={h - 0.06} r={0.05} position={[w / 2, h / 2, -th / 2 - 0.004]} material={M.rubber} />
        {strip > 0 && (
          <group>
            <Box s={[0.004, h - 0.04, 0.004]} m={M.slot} position={[strip, h / 2, th / 2 + 0.001]} />
            <mesh position={[strip / 2, h - 0.52, th / 2 + 0.002]} userData={{ noShadow: true }}>
              <planeGeometry args={[0.016, 0.2]} />
              <meshBasicMaterial color={led} toneMapped={false} />
            </mesh>
            <Cyl r={0.03} h={0.012} m={M.chrome} seg={32} position={[strip / 2, h - 0.1, th / 2 + 0.002]} rotation={[Math.PI / 2, 0, 0]} />
            <Cyl r={0.022} h={0.014} m={M.black} seg={32} position={[strip / 2, h - 0.1, th / 2 + 0.004]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )}
        {hinge !== 'top' ? (
          <group position={[gx, h * 0.5, th / 2]}>
            <Box s={[0.026, h * 0.3, 0.014]} m={M.slot} position={[0, 0, -0.004]} />
            <Box s={[0.005, h * 0.3, 0.005]} m={M.chrome} position={[0.016, 0, 0.001]} />
          </group>
        ) : (
          <Box s={[w * 0.46, 0.014, 0.012]} m={M.slot} position={[w * 0.55, 0.03, th / 2 - 0.004]} />
        )}
        {status && (
          <group position={[0.1, h * 0.52, th / 2 + 0.002]}>
            <Box s={[0.075, h * 0.5, 0.004]} m={M.strip} />
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0, h * 0.14 - i * 0.055, 0.003]} userData={{ noShadow: true }}>
                <planeGeometry args={[0.014, 0.034]} />
                <meshBasicMaterial color={i < 2 ? led : '#2c3540'} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0, -h * 0.14, 0.003]} userData={{ noShadow: true }}>
              <ringGeometry args={[0.016, 0.022, 32]} />
              <meshBasicMaterial color="#8d969f" toneMapped={false} />
            </mesh>
          </group>
        )}
        <Label text={label} position={[w - 0.17, 0.035, th / 2 + 0.002]} scale={0.55} />
      </group>
    </group>
  );
}

/** Fixed panel to the left of a tower door: power button and vertical green status bar. */
function FrontStrip({ h, led = '#39e07c' }: { h: number; led?: string }) {
  const M = mats();
  const sw = 0.2;
  const x = -W / 2 + 0.012 + sw / 2;
  return (
    <group>
      <RBox s={[sw, h - 0.12, 0.05]} r={0.018} m={M.black} position={[x, 0.08 + (h - 0.14) / 2, ZF + 0.025]} />
      <mesh position={[x, h - 0.6, ZF + 0.052]} userData={{ noShadow: true }}>
        <planeGeometry args={[0.016, 0.2]} />
        <meshBasicMaterial color={led} toneMapped={false} />
      </mesh>
      <Cyl r={0.03} h={0.012} m={M.chrome} seg={32} position={[x, h - 0.17, ZF + 0.052]} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.022} h={0.014} m={M.black} seg={32} position={[x, h - 0.17, ZF + 0.054]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/** Instanced ventilation slots on both side panels. */
function Vents({ y0, rows }: { y0: number; rows: number }) {
  const M = mats();
  const inst = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.004, 0.022, 0.16);
    const cols = 3;
    const im = new THREE.InstancedMesh(geo, M.slot, cols * rows * 2);
    const t = new THREE.Matrix4();
    let i = 0;
    for (const sx of [-1, 1])
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
          t.makeTranslation(sx * (W / 2 + 0.0005), y0 + r * 0.045, -D / 2 + 0.2 + c * 0.19);
          im.setMatrixAt(i++, t);
        }
    im.count = i;
    im.userData.noShadow = true;
    return im;
  }, [y0, rows, M.slot]);
  useEffect(() => () => inst.geometry.dispose(), [inst]);
  return <primitive object={inst} />;
}

/** Cabinet: silver side panels, gloss-black top and base, dark open service bay behind the front. */
function Shell({ h }: { h: number }) {
  const M = mats();
  const inner = h - T - 0.12;
  const tall = h > 2;
  return (
    <group>
      {[-1, 1].map((sd) => (
        <RBox key={sd} s={[T, h, D]} r={0.02} m={M.silver} position={[(sd * (W - T)) / 2, h / 2, 0]} />
      ))}
      <RBox s={[W + 0.004, T, D + 0.004]} r={0.02} m={M.black} position={[0, h - T / 2, 0]} />
      <Box s={[W - 2 * T, 0.12, D]} m={M.black} position={[0, 0.06, 0]} />
      <Box s={[W - 2 * T, inner, 0.04]} m={M.silver} position={[0, 0.12 + inner / 2, -D / 2 + 0.02]} />
      {/* dark service bay */}
      <Box s={[W - 2 * T, inner, 0.02]} m={M.interior} position={[0, 0.12 + inner / 2, BZ]} />
      {[-1, 1].map((sd) => (
        <Box key={sd} s={[0.01, inner, BAY]} m={M.interior} position={[sd * (W / 2 - T - 0.005), 0.12 + inner / 2, BZ + BAY / 2]} />
      ))}
      <Box s={[W - 2 * T, 0.01, BAY]} m={M.interior} position={[0, h - T - 0.005, BZ + BAY / 2]} />
      <Box s={[W - 2 * T, 0.01, BAY]} m={M.interior} position={[0, 0.125, BZ + BAY / 2]} />
      <Vents y0={tall ? h - 0.7 : 0.3} rows={tall ? 12 : 9} />
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cyl key={`${sx}${sz}`} r={0.045} h={FEET} m={M.rubber} position={[sx * (W / 2 - 0.1), -FEET / 2, sz * (D / 2 - 0.12)]} />
      ))}
    </group>
  );
}

/* --------------------------------------------------------------- modules */

function Sampler({ glow, open }: { glow: THREE.MeshStandardMaterial; open: { current: number } }) {
  const M = mats();
  const deckY = 0.6;
  const plateY = deckY + 0.04;
  const plateZ = BZ + 0.34;
  const { glassIM, capIM } = useMemo(() => {
    const vGeo = new THREE.CylinderGeometry(0.021, 0.021, 0.13, 14);
    const cGeo = new THREE.CylinderGeometry(0.0235, 0.0235, 0.028, 14);
    const n = 162; // 3 plates × 54 vials
    const glassIM = new THREE.InstancedMesh(vGeo, M.vial, n);
    const capIM = new THREE.InstancedMesh(cGeo, M.cap, n);
    glassIM.userData.noShadow = true;
    const t = new THREE.Matrix4();
    const col = new THREE.Color();
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let i = 0;
    for (let p = 0; p < 3; p++)
      for (let c = 0; c < 6; c++)
        for (let r = 0; r < 9; r++) {
          // leave a few empty positions so the plates read as real, part-loaded racks
          if (p === 2 && r > 4 && rnd() > 0.35) continue;
          const x = (p - 1) * 0.385 - 0.145 + c * 0.058;
          const z = plateZ - 0.24 + r * 0.06;
          t.makeTranslation(x, plateY + 0.025 + 0.065, z);
          glassIM.setMatrixAt(i, t);
          t.makeTranslation(x, plateY + 0.025 + 0.13 + 0.014, z);
          capIM.setMatrixAt(i, t);
          capIM.setColorAt(i, col.set(rnd() > 0.88 ? '#c8423a' : '#2f6fd1'));
          i++;
        }
    glassIM.count = capIM.count = i;
    return { glassIM, capIM };
  }, [M.vial, M.cap, plateY, plateZ]);
  useEffect(
    () => () => {
      glassIM.geometry.dispose();
      capIM.geometry.dispose();
    },
    [glassIM, capIM],
  );

  const carriage = useRef<THREE.Group>(null);
  const needle = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const live = open.current > 0.5;
    if (carriage.current) {
      const tx = live ? Math.sin(t * 0.55) * 0.4 : 0.36;
      carriage.current.position.x += (tx - carriage.current.position.x) * 0.05;
    }
    if (needle.current) {
      const ty = live ? Math.max(0, Math.sin(t * 1.1)) * -0.08 : 0;
      needle.current.position.y += (ty - needle.current.position.y) * 0.1;
    }
  });

  return (
    <group>
      <Box s={[W - 2 * T, 0.03, BAY]} m={M.brushed} position={[0, deckY, BZ + BAY / 2]} />
      {/* stepped lower front: two drawer fronts */}
      <RBox s={[W - 0.03, 0.2, 0.07]} r={0.018} m={M.black} position={[0, 0.48, ZF - 0.005]} />
      <RBox s={[W - 0.03, 0.3, 0.1]} r={0.02} m={M.black} position={[0, 0.215, ZF + 0.01]} />
      <Box s={[W * 0.5, 0.012, 0.01]} m={M.slot} position={[0.08, 0.555, ZF + 0.028]} />
      <Box s={[W * 0.5, 0.012, 0.01]} m={M.slot} position={[0.08, 0.34, ZF + 0.058]} />
      {/* three vial plates, 54 vials each */}
      {[-1, 0, 1].map((p) => (
        <RBox key={p} s={[0.37, 0.05, 0.58]} r={0.01} m={glow} position={[p * 0.385, plateY, plateZ]} />
      ))}
      <primitive object={glassIM} />
      <primitive object={capIM} />
      {/* XYZ needle gantry */}
      <Box s={[W - 2 * T - 0.04, 0.05, 0.05]} m={M.brushed} position={[0, 1.2, BZ + 0.06]} />
      <group ref={carriage} position={[0.36, 0, 0]}>
        <RBox s={[0.12, 0.16, 0.1]} m={M.peekDark} position={[0, 1.2, BZ + 0.1]} />
        <Box s={[0.05, 0.04, 0.4]} m={M.brushed} position={[0, 1.14, BZ + 0.32]} />
        <group ref={needle}>
          <Cyl r={0.017} h={0.14} m={M.peekDark} position={[0, 1.06, BZ + 0.5]} />
          <Cyl r={0.004} h={0.24} m={M.steel} seg={8} position={[0, 0.88, BZ + 0.5]} />
        </group>
      </group>
      {/* six-port injection valve on the back wall */}
      <group position={[0.42, 0.98, BZ + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <Cyl r={0.07} h={0.05} m={M.steel} seg={32} />
        <Cyl r={0.05} h={0.02} m={M.brushed} seg={32} position={[0, 0.035, 0]} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <Cyl key={i} r={0.011} h={0.05} m={M.peek} seg={6} position={[Math.cos(a) * 0.035, 0.065, Math.sin(a) * 0.035]} />;
        })}
      </group>
    </group>
  );
}

/**
 * IC-150 / IC-150D service bay, detailed after Shimadzu's open-door product images: control panel
 * and suppressor housing top-left, two pump heads mid-left with a perforated panel between them,
 * drain knob below, valve block / line filter / degasser lower-left, and the full-height column oven
 * on the right with its own glass door. Hidden geometry is not invented; positions are indicative.
 */
function Internals({
  glow,
  dual = false,
}: {
  glow: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  dual?: boolean;
}) {
  const M = mats();
  const [, gOven, , gCell] = glow;
  const helix = useMemo(() => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2 * 4;
      pts.push([Math.cos(a) * 0.04, (i / 48) * 0.18 - 0.09, Math.sin(a) * 0.04]);
    }
    return pts;
  }, []);
  const coil = useMemo(() => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2 * 2.5;
      pts.push([Math.cos(a) * 0.05, Math.sin(a) * 0.05, (i / 60) * 0.04]);
    }
    return pts;
  }, []);
  const holes = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10).rotateX(Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, M.slot, 40);
    const t = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 4; c++) {
        t.makeTranslation(-0.03 + c * 0.02 + (r % 2) * 0.01, -0.13 + r * 0.029, 0);
        im.setMatrixAt(i++, t);
      }
    im.userData.noShadow = true;
    return im;
  }, [M.slot]);
  useEffect(() => () => holes.geometry.dispose(), [holes]);

  const Z = BZ; // bay back wall
  const head = (x: number) => (
    <group key={x} position={[x, 1.28, Z + 0.32]}>
      <Cyl r={0.078} h={0.1} m={M.cadLight} seg={40} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.06} h={0.012} m={M.cadMid} seg={40} position={[0, 0, 0.056]} rotation={[Math.PI / 2, 0, 0]} />
      {[0, 1, 2, 3].map((k) => {
        const a = Math.PI / 4 + (k * Math.PI) / 2;
        return <Cyl key={k} r={0.011} h={0.016} m={M.steel} seg={6} position={[Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0.058]} rotation={[Math.PI / 2, 0, 0]} />;
      })}
      <Cyl r={0.022} h={0.03} m={M.peek} seg={6} position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]} />
      {[-1, 1].map((sy) => (
        <group key={sy} position={[0, sy * 0.115, 0]}>
          <Cyl r={0.022} h={0.06} m={M.steel} seg={20} />
          <Cyl r={0.016} h={0.03} m={M.peek} seg={6} position={[0, sy * 0.045, 0]} />
        </group>
      ))}
    </group>
  );

  return (
    <group>
      {/* --- indicator / control panel: CONNECT · STATUS LEDs, POWER, PURGE A, PURGE B, USB --- */}
      <group position={[-0.29, 2.29, Z + 0.035]}>
        <Box s={[0.56, 0.15, 0.02]} m={M.strip} />
        {[-0.24, -0.205].map((x, i) => (
          <mesh key={x} position={[x, 0.025, 0.012]} userData={{ noShadow: true }}>
            <circleGeometry args={[0.009, 16]} />
            <meshBasicMaterial color={i === 0 ? '#5aa9ff' : '#39e07c'} toneMapped={false} />
          </mesh>
        ))}
        {[-0.11, 0.02, 0.15].map((x) => (
          <mesh key={x} position={[x, 0, 0.012]} userData={{ noShadow: true }}>
            <ringGeometry args={[0.028, 0.034, 32]} />
            <meshBasicMaterial color="#9aa3ad" toneMapped={false} />
          </mesh>
        ))}
        <Box s={[0.03, 0.012, 0.004]} m={M.cadMid} position={[0.24, 0.03, 0.012]} />
      </group>

      {/* --- suppressor housing: light-grey box with a clear front lid --- */}
      <group position={[-0.29, 1.97, 0]}>
        <Box s={[0.5, 0.3, 0.02]} m={M.cadLight} position={[0, 0, Z + 0.03]} />
        <Box s={[0.5, 0.02, 0.3]} m={M.cadLight} position={[0, 0.15, Z + 0.17]} />
        <Box s={[0.5, 0.02, 0.3]} m={M.cadLight} position={[0, -0.15, Z + 0.17]} />
        {[-1, 1].map((sx) => (
          <Box key={sx} s={[0.02, 0.3, 0.3]} m={M.cadLight} position={[sx * 0.24, 0, Z + 0.17]} />
        ))}
        <mesh material={M.ovenGlass} position={[0, 0, Z + 0.325]} renderOrder={6} userData={{ noShadow: true }}>
          <boxGeometry args={[0.48, 0.28, 0.006]} />
        </mesh>
        <RBox s={[0.24, 0.13, 0.12]} m={M.suppBody} position={[-0.05, 0, Z + 0.14]} />
        <Box s={[0.242, 0.02, 0.122]} m={dual ? M.cation : M.anion} position={[-0.05, 0.045, Z + 0.14]} />
        <Box s={[0.12, 0.03, 0.004]} m={M.paper} position={[-0.05, -0.02, Z + 0.202]} />
        {[-1, 1].map((sx) => (
          <Cyl key={sx} r={0.018} h={0.05} m={M.peek} seg={6} position={[-0.05 + sx * 0.145, 0, Z + 0.14]} rotation={[0, 0, Math.PI / 2]} />
        ))}
        <group position={[0.16, 0, Z + 0.12]}>
          <Tube pts={coil} r={0.0055} m={M.tubeWhite} />
        </group>
      </group>

      {/* --- pump: two heads with check valves, perforated panel between, drain knob below --- */}
      <Box s={[0.56, 0.42, 0.03]} m={M.cadMid} position={[-0.29, 1.28, Z + 0.26]} />
      {head(-0.45)}
      {head(-0.13)}
      <group position={[-0.29, 1.28, Z + 0.28]}>
        <Box s={[0.12, 0.32, 0.01]} m={M.cadLight} />
        <primitive object={holes} position={[0, 0, 0.006]} />
      </group>
      <Cyl r={0.05} h={0.04} m={M.rubber} seg={32} position={[-0.29, 1.0, Z + 0.3]} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.018} h={0.03} m={M.cadMid} seg={20} position={[-0.29, 1.0, Z + 0.33]} rotation={[Math.PI / 2, 0, 0]} />
      <RBox s={[0.07, 0.07, 0.06]} m={M.cadLight} position={[-0.13, 1.0, Z + 0.3]} />

      {/* --- lower flow hardware: valve block with two knobs, line filter, degasser behind --- */}
      <RBox s={[0.5, 0.18, 0.2]} m={M.cadDark} position={[-0.29, 0.36, Z + 0.12]} />
      <Box s={[0.18, 0.03, 0.004]} m={M.paper} position={[-0.2, 0.4, Z + 0.222]} />
      <group position={[-0.44, 0.66, Z + 0.3]}>
        <RBox s={[0.12, 0.24, 0.08]} m={M.peek} />
        {[0.05, -0.05].map((y) => (
          <Cyl key={y} r={0.022} h={0.05} m={M.rubber} seg={20} position={[0, y, 0.06]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
        {[-1, 1].map((sy) => (
          <Cyl key={sy} r={0.014} h={0.04} m={M.steel} seg={6} position={[0, sy * 0.14, 0]} />
        ))}
      </group>
      <group position={[-0.17, 0.6, Z + 0.3]}>
        <Cyl r={0.06} h={0.05} m={M.steel} seg={32} rotation={[Math.PI / 2, 0, 0]} />
        <Cyl r={0.045} h={0.02} m={M.brass} seg={32} position={[0, 0, 0.034]} rotation={[Math.PI / 2, 0, 0]} />
        {[-1, 1].map((sx) => (
          <Cyl key={sx} r={0.013} h={0.05} m={M.peek} seg={6} position={[sx * 0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        ))}
      </group>

      {/* --- white PEEK tubing runs between the parts --- */}
      <Tube pts={[[-0.45, 1.41, Z + 0.32], [-0.5, 1.5, Z + 0.34], [-0.56, 1.42, Z + 0.36], [-0.56, 0.9, Z + 0.36], [-0.48, 0.8, Z + 0.32], [-0.44, 0.8, Z + 0.3]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.13, 1.41, Z + 0.32], [-0.1, 1.55, Z + 0.34], [-0.03, 1.62, Z + 0.36], [0.02, 1.72, Z + 0.36], [0.08, 1.74, Z + 0.3]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.45, 1.15, Z + 0.32], [-0.38, 1.08, Z + 0.36], [-0.25, 0.86, Z + 0.36], [-0.25, 0.68, Z + 0.34], [-0.25, 0.6, Z + 0.3]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.13, 1.15, Z + 0.32], [-0.08, 1.05, Z + 0.35], [-0.08, 0.7, Z + 0.35], [-0.09, 0.6, Z + 0.3]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.44, 0.52, Z + 0.3], [-0.44, 0.47, Z + 0.3], [-0.36, 0.44, Z + 0.25], [-0.26, 0.44, Z + 0.24]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.53, 1.97, Z + 0.14], [-0.57, 1.9, Z + 0.2], [-0.57, 1.62, Z + 0.3], [-0.52, 1.52, Z + 0.34]]} r={0.0055} m={M.tubeWhite} />
      <Tube pts={[[-0.13, 1.97, Z + 0.14], [-0.03, 1.92, Z + 0.2], [0.0, 1.6, Z + 0.3], [0.0, 0.5, Z + 0.32], [0.06, 0.44, Z + 0.3]]} r={0.0055} m={M.tubeWhite} />

      {/* --- column oven: full-height compartment, framed glass door, clamps and warning labels --- */}
      <group position={[0.28, 0, 0]}>
        <Box s={[0.5, 2.08, 0.02]} m={M.cadMid} position={[0, 1.27, Z + 0.02]} />
        {[-0.25, 0.25].map((sx) => (
          <Box key={sx} s={[0.02, 2.08, 0.5]} m={M.cadMid} position={[sx, 1.27, Z + 0.26]} />
        ))}
        <Box s={[0.5, 0.02, 0.5]} m={M.cadMid} position={[0, 2.31, Z + 0.26]} />
        <Box s={[0.5, 0.02, 0.5]} m={M.cadMid} position={[0, 0.23, Z + 0.26]} />
        {/* glass door in a dark frame, hinged on the right */}
        <mesh material={M.ovenGlass} position={[0, 1.27, Z + 0.515]} renderOrder={6} userData={{ noShadow: true }}>
          <boxGeometry args={[0.44, 2.0, 0.006]} />
        </mesh>
        {[-0.235, 0.235].map((x) => (
          <Box key={x} s={[0.03, 2.08, 0.02]} m={M.cadDark} position={[x, 1.27, Z + 0.515]} />
        ))}
        {[0.24, 2.3].map((y) => (
          <Box key={y} s={[0.5, 0.03, 0.02]} m={M.cadDark} position={[0, y, Z + 0.515]} />
        ))}
        {[0.6, 1.95].map((y) => (
          <Box key={y} s={[0.03, 0.08, 0.04]} m={M.cadMid} position={[0.255, y, Z + 0.5]} />
        ))}
        {/* fan, column holders */}
        <mesh material={M.steel} position={[0.1, 2.12, Z + 0.035]}>
          <torusGeometry args={[0.07, 0.008, 8, 40]} />
        </mesh>
        <Cyl r={0.03} h={0.01} m={M.slot} position={[0.1, 2.12, Z + 0.035]} rotation={[Math.PI / 2, 0, 0]} />
        {[-0.15, -0.1, -0.05].map((x) => (
          <RBox key={x} s={[0.035, 0.06, 0.05]} m={M.cadLight} position={[x, 2.2, Z + 0.06]} />
        ))}
        {[1.4, 0.76].map((y) => (
          <group key={y}>
            <Box s={[0.08, 0.035, 0.16]} m={M.cadLight} position={[-0.1, y, Z + 0.11]} />
            <Box s={[0.04, 0.04, 0.003]} m={M.warn} position={[0.08, y + 0.04, Z + 0.032]} />
          </group>
        ))}
        {/* guard + analytical column */}
        <Cyl r={0.026} h={0.18} m={M.peekDark} position={[-0.1, 1.73, Z + 0.2]} />
        <Cyl r={0.036} h={1.0} m={gOven} seg={32} position={[-0.1, 1.08, Z + 0.2]} />
        <Cyl r={0.0365} h={0.26} m={M.paper} seg={32} open position={[-0.1, 1.2, Z + 0.2]} />
        {[1.6, 0.56, 1.83, 1.63].map((y, i) => (
          <Cyl key={i} r={i < 2 ? 0.046 : 0.034} h={0.05} m={M.steel} seg={6} position={[-0.1, y, Z + 0.2]} />
        ))}
        {/* eluent pre-heater coil */}
        <group position={[0.12, 1.62, Z + 0.24]}>
          <Tube pts={helix} r={0.006} m={M.steel} />
        </group>
        {/* conductivity cell, inside the oven */}
        <group position={[0.12, 0.44, Z + 0.2]}>
          <RBox s={[0.14, 0.12, 0.12]} m={gCell} />
          <Cyl r={0.02} h={0.08} m={M.cable} position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
          {[-0.035, 0.035].map((px) => (
            <Cyl key={px} r={0.012} h={0.05} m={M.peek} seg={6} position={[px, 0.08, 0]} />
          ))}
        </group>
      </group>
    </group>
  );
}

/** Eluent bottles in a chrome rail rack on top of the autosampler. */
function Bottles() {
  const M = mats();
  const geo = useMemo(() => {
    const prof = [
      [0.0, 0],
      [0.125, 0],
      [0.138, 0.014],
      [0.14, 0.04],
      [0.14, 0.42],
      [0.128, 0.48],
      [0.085, 0.55],
      [0.056, 0.585],
      [0.053, 0.64],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(prof, 40);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const xs = [-0.36, 0, 0.36];
  const z = -0.05;
  const y0 = H_AS;
  const railH = 0.3;
  const rx = W / 2 - 0.035;
  const rz0 = ZF - 0.05;
  const rz1 = -D / 2 + 0.08;
  return (
    <group position={[X_AS, 0, 0]}>
      {/* chrome rail: four posts, side and front rails */}
      {[-rx, rx].map((x) =>
        [rz0, rz1].map((zz) => <Cyl key={`${x}${zz}`} r={0.013} h={railH} m={M.chrome} position={[x, y0 + railH / 2, zz]} />),
      )}
      {[-rx, rx].map((x) => (
        <Cyl key={x} r={0.013} h={rz0 - rz1} m={M.chrome} position={[x, y0 + railH, (rz0 + rz1) / 2]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      {[rz0, rz1].map((zz) => (
        <Cyl key={zz} r={0.013} h={rx * 2} m={M.chrome} position={[0, y0 + railH, zz]} rotation={[0, 0, Math.PI / 2]} />
      ))}
      <Cyl r={0.01} h={rx * 2} m={M.chrome} position={[0, y0 + railH * 0.5, rz0]} rotation={[0, 0, Math.PI / 2]} />
      {xs.map((x, i) => {
        const ex = -W / 2 + 0.03 - (X_AS + x);
        const ez = -0.3 - i * 0.12 - z;
        return (
          <group key={x} position={[x, y0, z]}>
            <Cyl r={0.131} h={0.3 - i * 0.04} m={M.liquid} seg={32} position={[0, 0.16 - i * 0.02, 0]} userData={{ noShadow: true }} renderOrder={4} />
            <mesh geometry={geo} material={M.bottle} renderOrder={5} userData={{ noShadow: true }} />
            <mesh material={M.paper} position={[0, 0.24, 0]}>
              <cylinderGeometry args={[0.142, 0.142, 0.15, 32, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
            </mesh>
            <Cyl r={0.064} h={0.075} m={M.bottleCap} seg={28} position={[0, 0.672, 0]} />
            {i < 2 && (
              <Tube
                pts={[
                  [0, 0.7, 0],
                  [0, 0.84, 0],
                  [ex * 0.4, 0.95, ez * 0.5],
                  [ex - 0.04, 0.9, ez],
                  [ex, 0.88, ez],
                ]}
                r={0.0075}
                m={M.ptfe}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

function Floor() {
  const tex = useMemo(() => radialTexture('#ffffff', '#000000'), []);
  const blob = useMemo(() => radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), []);
  useEffect(
    () => () => {
      tex.dispose();
      blob.dispose();
    },
    [tex, blob],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.6]} receiveShadow userData={{ floor: true }}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#0d1116" roughness={0.45} metalness={0.35} alphaMap={tex} transparent envMapIntensity={0.5} />
      </mesh>
      {[X_AS, X_IC].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]} userData={{ noShadow: true }}>
          <planeGeometry args={[W * 1.7, D * 1.3]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- stack */

/** Capillary routing: straight runs joined by small bends. */
function routedCurve(pts: THREE.Vector3[]) {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  let cur = pts[0].clone();
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const a = c.clone().sub(pts[i - 1]);
    const b = pts[i + 1].clone().sub(c);
    const rr = Math.min(0.05, a.length() / 2, b.length() / 2);
    const p1 = c.clone().sub(a.normalize().multiplyScalar(rr));
    const p2 = c.clone().add(b.normalize().multiplyScalar(rr));
    if (p1.distanceTo(cur) > 1e-4) curve.add(new THREE.LineCurve3(cur, p1));
    curve.add(new THREE.QuadraticBezierCurve3(p1, c.clone(), p2));
    cur = p2;
  }
  curve.add(new THREE.LineCurve3(cur, pts[pts.length - 1].clone()));
  return curve;
}
function routed(pts: THREE.Vector3[]) {
  return new THREE.TubeGeometry(routedCurve(pts) as unknown as THREE.Curve<THREE.Vector3>, 1400, 0.0065, 8, false);
}

function Stack() {
  const glows = useMemo(
    () => ({
      sampler: glowMat('#3b434e', 0.4, 0.5),
      pump: glowMat('#5b636d', 0.65, 0.4),
      oven: glowMat('#41474f', 0.1, 0.45),
      supp: glowMat('#2a2f36', 0.2, 0.45),
      cell: glowMat('#b7bec6', 0.85, 0.3),
      dPump: glowMat('#5b636d', 0.65, 0.4),
      dOven: glowMat('#41474f', 0.1, 0.45),
      dSupp: glowMat('#2a2f36', 0.2, 0.45),
      dCell: glowMat('#b7bec6', 0.85, 0.3),
    }),
    [],
  );
  const doorIC = useRef(0);
  const doorAS = useRef(0);
  const doorD = useRef(0);
  const dual = useRef(0);
  const dGroup = useRef<THREE.Group>(null);
  const mkTube = (a: string, b: string) =>
    new THREE.ShaderMaterial({
      vertexShader: flowTubeVertex,
      fragmentShader: flowTubeFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uHead: { value: 0 },
        uColA: { value: new THREE.Color(a) },
        uColB: { value: new THREE.Color(b) },
        uOpacity: { value: 1 },
      },
    });
  // anion channel (IC-150) and cation channel (IC-150D) get their own colours
  const tubeMat = useMemo(() => mkTube('#63d3ff', '#7cb8ff'), []);
  const tubeMatD = useMemo(() => mkTube('#c39bff', '#ff9cc8'), []);
  // eluent bottle → degasser → pump → autosampler valve → pre-heater → column → suppressor → cell,
  // routed like real capillary: straight runs joined by small bends
  const { tube, stops } = useMemo(() => {
    const ZP = BZ + 0.43; // front routing plane
    const ZQ = BZ + 0.4;
    const ZC = BZ + 0.27; // just in front of the column
    const pts = [
      [X_AS + 0.36, H_AS + 0.1, -0.05],
      [X_AS + 0.36, H_AS + 0.86, -0.05],
      [-0.6, H_AS + 0.86, -0.05],
      [-0.32, 2.3, -0.05],
      [-0.32, 2.3, ZP],
      [-0.52, 2.3, ZP],
      [-0.52, 0.44, ZP],
      [-0.39, 0.44, ZP], // 5 degasser outlet
      [-0.39, 1.28, ZP], // 6 pump head
      [-0.39, 1.48, ZP],
      [-0.17, 1.48, ZP],
      [-0.17, 1.58, ZP],
      [-0.56, 1.58, ZP],
      [-0.56, 0.98, ZP],
      [X_AS + 0.42, 0.98, ZP],
      [X_AS + 0.42, 0.98, BZ + 0.12], // 13 injection valve
      [X_AS + 0.36, 0.92, BZ + 0.12],
      [X_AS + 0.36, 0.92, ZQ],
      [0.0, 0.92, ZQ],
      [0.0, 1.9, ZQ],
      [0.4, 1.9, ZQ],
      [0.4, 1.62, BZ + 0.24], // pre-heater
      [0.18, 1.88, ZC],
      [0.18, 0.52, ZC], // 21 column outlet
      [0.18, 0.34, ZC],
      [-0.06, 0.34, ZP],
      [-0.06, 2.16, ZP],
      [-0.2, 2.16, BZ + 0.16],
      [-0.28, 2.0, BZ + 0.16], // 26 suppressor
      [-0.36, 1.84, BZ + 0.16],
      [-0.36, 1.76, ZP],
      [0.08, 1.76, ZP],
      [0.08, 0.62, ZP],
      [0.4, 0.62, BZ + 0.3],
      [0.4, 0.46, BZ + 0.3], // 32 cell
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = routedCurve(pts);
    const tube = routed(pts);
    const targets = [pts[15], pts[8], pts[23], pts[28], pts[34]];
    const stops = targets.map((p) => {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i <= 1000; i++) {
        const d = curve.getPointAt(i / 1000).distanceToSquared(p);
        if (d < bd) {
          bd = d;
          best = i / 1000;
        }
      }
      return best;
    });
    return { tube, stops };
  }, []);

  // second, separate analytical path for the IC-150D (drawn in the D unit's local frame). It
  // reaches the autosampler through the back of the stack; the SI-150's internal loop-injection
  // routing for dual systems is not drawn, and the two paths never share a tee.
  const tubeD = useMemo(() => {
    const ZP = BZ + 0.43;
    const ZQ = BZ + 0.4;
    const ZC = BZ + 0.27;
    const ZB = -0.95; // behind the service bays
    const toAS = X_AS - X_D;
    const pts = [
      [toAS - 0.36, H_AS + 0.1, -0.05],
      [toAS - 0.36, 2.58, -0.05],
      [-0.32, 2.58, -0.05],
      [-0.32, 2.3, -0.05],
      [-0.32, 2.3, ZP],
      [-0.52, 2.3, ZP],
      [-0.52, 0.44, ZP],
      [-0.39, 0.44, ZP],
      [-0.39, 1.28, ZP],
      [-0.39, 1.48, ZP],
      [-0.17, 1.48, ZP],
      [-0.17, 1.58, ZP],
      [-0.56, 1.58, ZP],
      [-0.56, 1.1, ZP],
      [-0.56, 1.1, ZB],
      [toAS + 0.3, 1.1, ZB],
      [toAS + 0.3, 1.04, ZB],
      [0.0, 1.04, ZB],
      [0.0, 1.04, ZQ],
      [0.0, 1.9, ZQ],
      [0.4, 1.9, ZQ],
      [0.4, 1.62, BZ + 0.24],
      [0.18, 1.88, ZC],
      [0.18, 0.52, ZC],
      [0.18, 0.34, ZC],
      [-0.06, 0.34, ZP],
      [-0.06, 2.16, ZP],
      [-0.2, 2.16, BZ + 0.16],
      [-0.28, 2.0, BZ + 0.16],
      [-0.36, 1.84, BZ + 0.16],
      [-0.36, 1.76, ZP],
      [0.08, 1.76, ZP],
      [0.08, 0.62, ZP],
      [0.4, 0.62, BZ + 0.3],
      [0.4, 0.46, BZ + 0.3],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return routed(pts);
  }, []);

  const root = useRef<THREE.Group>(null);
  useEffect(() => {
    const M = mats();
    const skip = new Set<THREE.Material>([M.black, M.strip, M.silver, M.chrome, M.body, M.door, M.slot, M.interior]);
    const added: THREE.LineSegments[] = [];
    const meshes: THREE.Mesh[] = [];
    root.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.Material;
      const no = mesh.userData.noShadow || mat?.transparent;
      mesh.castShadow = !no;
      mesh.receiveShadow = !mesh.userData.noShadow;
      meshes.push(mesh);
    });
    // engineering-render look: crisp feature edges on the internal parts (not on tubes, glass or panels)
    for (const mesh of meshes) {
      const mat = mesh.material as THREE.Material;
      if (mesh.userData.noShadow || mat.transparent || skip.has(mat)) continue;
      if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh) continue;
      if (mesh.geometry.type === 'TubeGeometry' || mesh.geometry.type === 'TorusGeometry') continue;
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 40), M.edge);
      lines.userData.noShadow = true;
      lines.raycast = () => {};
      mesh.add(lines);
      added.push(lines);
    }
    return () => added.forEach((l) => l.geometry.dispose());
  }, []);

  useEffect(
    () => () => {
      Object.values(glows).forEach((m) => m.dispose());
      tube.dispose();
      tubeMat.dispose();
      tubeD.dispose();
      tubeMatD.dispose();
      disposeMats();
    },
    [glows, tube, tubeMat, tubeD, tubeMatD],
  );

  const blobTex = useMemo(() => radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), []);
  useEffect(() => () => blobTex.dispose(), [blobTex]);
  const head = useRef(0);
  useFrame((state, dt) => {
    const a = instrumentState.active;
    const k = 1 - Math.exp(-dt * 4);
    // no glowing highlights: doors open to reveal the step, and on-screen callouts name the parts
    doorAS.current = a === 0 ? 1 : 0;
    // in the dual view the IC-150 door stops at 90° so it doesn't swing across the IC-150D
    doorIC.current = a >= 1 && a <= 4 ? 1 : a === 5 ? Math.PI / 2 / 1.95 : 0;
    doorD.current = a === 5 ? 1 : 0;
    dual.current += ((a >= 5 ? 1 : 0) - dual.current) * k;
    if (dGroup.current) {
      dGroup.current.position.x = X_D + (1 - dual.current) * 3.2;
      dGroup.current.visible = dual.current > 0.02;
    }
    const target = a < 0 ? 0 : a >= 4 ? 1 : stops[Math.min(a, stops.length - 1)] + 0.01;
    head.current += (target - head.current) * (1 - Math.exp(-dt * 1.8));
    tubeMat.uniforms.uHead.value = head.current;
    tubeMat.uniforms.uTime.value = state.clock.elapsedTime;
    tubeMatD.uniforms.uHead.value = a === 5 ? Math.min(1, tubeMatD.uniforms.uHead.value + dt * 0.5) : 0;
    tubeMatD.uniforms.uTime.value = state.clock.elapsedTime;
    tubeMatD.uniforms.uOpacity.value = dual.current;
  });

  return (
    <group>
      <FocusLight />
      <Floor />
      <group ref={root} position={[0, FEET, 0]}>
        <group position={[X_AS, 0, 0]}>
          <Shell h={H_AS} />
          <Sampler glow={glows.sampler} open={doorAS} />
          <group position={[-W / 2 + 0.012, 0.6, ZF + 0.004]}>
            <Door w={W - 0.024} h={H_AS - 0.6 - 0.07} open={doorAS} label="SI-150" hinge="top" status trim={false} />
          </group>
        </group>
        <group position={[X_IC, 0, 0]}>
          <Shell h={H_IC} />
          <Internals glow={[glows.pump, glows.oven, glows.supp, glows.cell]} />
          <group position={[-W / 2 + 0.012, 0.08, ZF + 0.004]}>
            <Door w={W - 0.024} h={H_IC - 0.14} open={doorIC} label="IC-150" hinge="right" strip={0.2} />
          </group>
        </group>
        <group ref={dGroup} position={[X_D + 3.2, 0, 0]} visible={false}>
          <Shell h={H_IC} />
          <Internals dual glow={[glows.dPump, glows.dOven, glows.dSupp, glows.dCell]} />
          <group position={[-W / 2 + 0.012, 0.08, ZF + 0.004]}>
            <Door w={W - 0.024} h={H_IC - 0.14} open={doorD} label="IC-150D" hinge="right" strip={0.2} />
          </group>
          <mesh geometry={tubeD} material={tubeMatD} renderOrder={7} userData={{ noShadow: true }} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -FEET + 0.002, 0]} userData={{ noShadow: true }}>
            <planeGeometry args={[W * 1.7, D * 1.3]} />
            <meshBasicMaterial map={blobTex} transparent depthWrite={false} />
          </mesh>
        </group>
        <Bottles />
        <mesh geometry={tube} material={tubeMat} renderOrder={7} userData={{ noShadow: true }} />
      </group>
    </group>
  );
}

function FocusLight() {
  const light = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Vector3(0, 1.2, 2.5), []);
  useFrame(() => {
    const a = instrumentState.active;
    if (a >= 0 && a <= 5) target.set(FOCUS[a][0] + 0.3, FOCUS[a][1] + 0.4, ZF + 0.9);
    else target.set(0, 1.6, ZF + 2.5);
    light.current?.position.lerp(target, 0.06);
    if (light.current) light.current.intensity += ((a >= 0 && a <= 5 ? 1.1 : 0) - light.current.intensity) * 0.15;
  });
  return <pointLight ref={light} intensity={0} distance={4} decay={2} color="#e6efff" position={[0, 1.2, 2.5]} />;
}

/** Projects the current step's callout anchors to the screen (labels always sit above the geometry). */
function Callouts() {
  const { camera, size, gl } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    // callouts live in the section overlay; offset by the canvas position inside it
    const host = calloutEls[0]?.parentElement;
    const cr = gl.domElement.getBoundingClientRect();
    const hr = host?.getBoundingClientRect();
    const ox = hr ? cr.left - hr.left : 0;
    const oy = hr ? cr.top - hr.top : 0;
    const a = instrumentState.active;
    const list = a >= 0 && a <= 5 ? CALLOUTS[a] : [];
    for (let i = 0; i < 2; i++) {
      const el = calloutEls[i];
      if (!el) continue;
      const c = list[i];
      if (!c) {
        el.style.opacity = '0';
        continue;
      }
      v.set(c.at[0], c.at[1] + FEET, c.at[2]).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      const ok = v.z < 1 && x > 20 && x < size.width - 60 && y > 30 && y < size.height - 20;
      el.style.opacity = ok ? '1' : '0';
      el.classList.toggle('is-left', c.side === 'left' || (hr ? x + ox > hr.width - 250 : false));
      el.style.transform = `translate3d(${(x + ox).toFixed(1)}px, ${(y + oy).toFixed(1)}px, 0)`;
    }
  });
  return null;
}

function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(2.5, 2.4, 7.5), []);
  const look = useMemo(() => new THREE.Vector3(0, 1.1, 0), []);
  const tPos = useMemo(() => new THREE.Vector3(), []);
  const tLook = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const portrait = size.width / size.height < 0.8;
    const a = instrumentState.active;
    // the canvas has its own region beside / between the text, so subjects are simply centred
    const wide = size.width / size.height > 1.15 ? 0.85 : 1;
    if (a < 0 || reducedMotion) {
      tPos.set(1.4, 2.4, 7.4 * wide);
      tLook.set(-0.68, 1.15, 0); // closed single system
    } else if (a > 5) {
      tPos.set(2.2, 2.6, 9.4 * wide);
      tLook.set(-0.05, 1.2, 0); // closed dual system
    } else {
      const f = FOCUS[a];
      const dist = (a === 5 ? 7.4 : a === 2 ? 5.4 : a === 0 ? 4.6 : 4.9) * (portrait ? 1.25 : 1) * wide;
      tPos.set(f[0] + 0.75, f[1] + 0.45, f[2] + dist);
      tLook.set(f[0], f[1], f[2]);
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
  const shadows = q.tier !== 'low';
  return (
    <Canvas
      className="instrument-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={q.dpr}
      shadows={shadows ? 'soft' : false}
      camera={{ fov: 34, near: 0.1, far: 60, position: [2.5, 2.4, 7.5] }}
      gl={{ antialias: q.tier !== 'low', alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden="true"
    >
      <StudioEnvironment intensity={1.0} />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#dfe8ff', '#16191e', 0.35]} />
      <directionalLight
        position={[3.5, 7, 5]}
        intensity={2.0}
        color="#fff5ea"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0008}
        shadow-normalBias={0.045}
        shadow-radius={4}
      />
      <directionalLight position={[-6, 3, 4]} intensity={0.55} color="#b9cdf5" />
      <directionalLight position={[-3, 4, -6]} intensity={2.2} color="#9ec0ff" />
      <directionalLight position={[6, 2.5, -3]} intensity={1.2} color="#cfe0ff" />
      <Rig reducedMotion={reducedMotion} />
      <Callouts />
      <Stack />
      <AdaptiveDpr min={q.dpr[0]} max={q.dpr[1]} />
    </Canvas>
  );
}
