import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../utils/quality';
import { rng, smoothstep } from '../utils/math';
import { pointer, stage, stageLabelEls } from '../utils/stage';
import { AdaptiveDpr } from './shared/AdaptiveDpr';
import { StudioEnvironment } from './shared/StudioEnvironment';
import { ELEMENT_STYLE, carbonate, chloride, fluoride, nitrate, sodium, waterMolecule, type Molecule } from './molecular/molecules';
import { atomGeometry, bondGeometry, bondInstanceCount, buildField, writeBond } from './molecular/MoleculeBuilder';
import { buildScene, type Scene } from './scenes';

const POOL = 130;
const BOND_POOL = 110;
const DUR = 1.5;

function radius(m: Molecule) {
  let r = 0.5;
  for (const a of m.atoms) r = Math.max(r, Math.hypot(...a.p) + ELEMENT_STYLE[a.el].r);
  return r;
}

interface Flat {
  scene: Scene;
  atoms: { item: number; local: THREE.Vector3; r: number; color: THREE.Color }[];
  bonds: { a: number; b: number; order: 1 | 2 }[];
  itemR: number[];
  fit: number;
}

function flatten(scene: Scene, target: number): Flat {
  const atoms: Flat['atoms'] = [];
  const bonds: Flat['bonds'] = [];
  const itemR: number[] = [];
  let R = 1;
  scene.items.forEach((it, i) => {
    const base = atoms.length;
    const r = radius(it.mol);
    itemR.push(r);
    R = Math.max(R, Math.hypot(...it.pos) + r * it.scale);
    for (const a of it.mol.atoms) {
      if (atoms.length >= POOL) break;
      atoms.push({ item: i, local: new THREE.Vector3(...a.p).multiplyScalar(it.scale), r: ELEMENT_STYLE[a.el].r * it.scale, color: new THREE.Color(ELEMENT_STYLE[a.el].color) });
    }
    for (const bd of it.mol.bonds) if (base + bd.b < POOL) bonds.push({ a: base + bd.a, b: base + bd.b, order: bd.order });
  });
  return { scene, atoms, bonds, itemR, fit: target / R };
}

/** The persistent stage: one pool of atoms that flies between each chapter's arrangement of ions. */
function Ions({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const { atoms, bonds } = useMemo(() => {
    const am = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.15, envMapIntensity: 1.1 });
    const bm = new THREE.MeshStandardMaterial({ color: '#8a96a8', roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0 });
    const atoms = new THREE.InstancedMesh(atomGeometry(), am, POOL);
    const bonds = new THREE.InstancedMesh(bondGeometry(), bm, BOND_POOL);
    atoms.frustumCulled = false;
    bonds.frustumCulled = false;
    const c = new THREE.Color('#8a96a8');
    for (let i = 0; i < POOL; i++) atoms.setColorAt(i, c);
    return { atoms, bonds };
  }, []);
  useEffect(
    () => () => {
      atoms.geometry.dispose();
      (atoms.material as THREE.Material).dispose();
      bonds.geometry.dispose();
      (bonds.material as THREE.Material).dispose();
    },
    [atoms, bonds],
  );

  const st = useMemo(() => {
    const rand = rng(9);
    const scatter = Array.from({ length: POOL }, () => new THREE.Vector3((rand() - 0.5) * 30, (rand() - 0.5) * 18, -6 - rand() * 14));
    return {
      version: -1,
      t0: 0,
      flat: null as Flat | null,
      bondList: [] as Flat['bonds'],
      cur: scatter.map((v) => v.clone()),
      from: scatter.map((v) => v.clone()),
      curS: new Array(POOL).fill(0) as number[],
      fromS: new Array(POOL).fill(0) as number[],
      curC: Array.from({ length: POOL }, () => new THREE.Color('#8a96a8')),
      fromC: Array.from({ length: POOL }, () => new THREE.Color('#8a96a8')),
      delay: Array.from({ length: POOL }, () => rand() * 0.35),
      swirl: Array.from({ length: POOL }, () => new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(3)),
      fit: 1,
      fitFrom: 1,
    };
  }, []);

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const view = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const gpos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    const portrait = size.width / size.height < 0.9;
    // scene change → snapshot current state as the starting point of the morph
    if (st.version !== stage.version) {
      st.version = stage.version;
      st.t0 = now;
      for (let i = 0; i < POOL; i++) {
        st.from[i].copy(st.cur[i]);
        st.fromS[i] = st.curS[i];
        st.fromC[i].copy(st.curC[i]);
      }
      st.fitFrom = st.fit;
      st.flat = flatten(buildScene(stage.scene, stage.ion), (portrait ? 2.5 : 3.9) * (stage.scene === 'hero' ? 1.15 : 1));
    }
    const flat = st.flat;
    if (!flat) return;
    const el = now - st.t0;
    const dur = reducedMotion ? 0.001 : DUR;
    const gfit = THREE.MathUtils.lerp(st.fitFrom, flat.fit, smoothstep(0, dur, el));
    st.fit = gfit;

    for (let i = 0; i < POOL; i++) {
      const a = flat.atoms[i];
      const k = reducedMotion ? 1 : smoothstep(0, 1, (el - st.delay[i]) / dur);
      const ez = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      if (a) {
        const it = flat.scene.items[a.item];
        e.set(it.tilt, reducedMotion ? 0.6 : now * it.spin + a.item, 0);
        q.setFromEuler(e);
        tgt.copy(a.local).applyQuaternion(q).add(v.set(...it.pos));
        st.cur[i].lerpVectors(st.from[i], tgt, ez).addScaledVector(st.swirl[i], Math.sin(Math.PI * ez) * (reducedMotion ? 0 : 1));
        st.curS[i] = THREE.MathUtils.lerp(st.fromS[i], a.r, ez);
        st.curC[i].copy(st.fromC[i]).lerp(a.color, ez);
      } else {
        st.cur[i].copy(st.from[i]).addScaledVector(st.swirl[i], ez * 1.5);
        st.curS[i] = THREE.MathUtils.lerp(st.fromS[i], 0, ez);
      }
      s.setScalar(Math.max(0.0001, st.curS[i]));
      m4.compose(st.cur[i], q.identity(), s);
      atoms.setMatrixAt(i, m4);
      atoms.setColorAt(i, st.curC[i]);
    }
    atoms.instanceMatrix.needsUpdate = true;
    if (atoms.instanceColor) atoms.instanceColor.needsUpdate = true;

    // bonds fade out, swap to the new topology, then fade back in once atoms have settled
    const bm = bonds.material as THREE.MeshStandardMaterial;
    if (el < 0.25 && st.bondList !== flat.bonds) bm.opacity = Math.max(0, bm.opacity - dt * 6);
    else {
      st.bondList = flat.bonds;
      bm.opacity = reducedMotion ? 1 : smoothstep(dur * 0.85, dur + 0.45, el);
    }
    let bi = 0;
    for (const b of st.bondList) {
      if (bi + b.order > BOND_POOL) break;
      bi = writeBond(bonds, bi, st.cur[b.a], st.cur[b.b], b.order, 0.07, null, view);
    }
    bonds.count = bi;
    bonds.instanceMatrix.needsUpdate = true;

    // placement: right half on wide screens, upper band on phones
    if (group.current) {
      const g = group.current;
      g.scale.setScalar(gfit);
      gpos.set(portrait ? 0 : 4.6, portrait ? 3.1 : 0, 0);
      g.position.lerp(gpos, 1 - Math.exp(-dt * 3));
      g.rotation.y += (pointer.x * 0.25 - g.rotation.y) * (1 - Math.exp(-dt * 2));
      g.rotation.x += (-pointer.y * 0.15 - g.rotation.x) * (1 - Math.exp(-dt * 2));
    }

    // labels (formula + retention) above each labelled ion, and group tags
    const labelled = flat.scene.items.map((it, i) => ({ it, i })).filter((x) => x.it.label);
    const lo = reducedMotion ? 1 : smoothstep(dur * 0.9, dur + 0.5, el);
    let li = 0;
    const g = group.current;
    g?.updateMatrixWorld();
    const place = (local: THREE.Vector3) => {
      const node = stageLabelEls[li++];
      if (!node || !g) return;
      v.copy(local).applyMatrix4(g.matrixWorld).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      node.style.opacity = lo.toFixed(3);
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    };
    for (const { it, i } of labelled) place(tgt.set(it.pos[0], it.pos[1] + flat.itemR[i] * it.scale + 0.35, it.pos[2]));
    for (const t of flat.scene.tags ?? []) place(tgt.set(...t.pos));
    for (; li < stageLabelEls.length; li++) if (stageLabelEls[li]) stageLabelEls[li]!.style.opacity = '0';
  });

  return (
    <group ref={group}>
      <primitive object={atoms} />
      <primitive object={bonds} />
    </group>
  );
}

/** Dim background population of small molecules: the sample matrix. */
function Field({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useMemo(() => {
    const ag = atomGeometry();
    const bg = bondGeometry();
    const am = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 });
    const bm = new THREE.MeshStandardMaterial({ color: '#566273', roughness: 0.6 });
    const rand = rng(31);
    const kinds = [nitrate(), carbonate(), chloride(), waterMolecule(), sodium(), fluoride()];
    const per: THREE.Matrix4[][] = kinds.map(() => []);
    for (let i = 0; i < count; i++) {
      const p = new THREE.Vector3((rand() - 0.5) * 60, (rand() - 0.5) * 34, -8 - rand() * 30);
      const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28));
      const sc = new THREE.Vector3().setScalar(0.6 + rand() * 0.4);
      per[i % kinds.length].push(new THREE.Matrix4().compose(p, qq, sc));
    }
    const out = kinds.map((k, i) => buildField(k, per[i], ag, bg, am, bm));
    void bondInstanceCount;
    return { out, ag, bg, am, bm };
  }, [count]);
  useEffect(
    () => () => {
      meshes.ag.dispose();
      meshes.bg.dispose();
      meshes.am.dispose();
      meshes.bm.dispose();
      meshes.out.forEach((o) => {
        o.atoms.dispose();
        o.bonds.dispose();
      });
    },
    [meshes],
  );
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.012;
  });
  return (
    <group ref={group}>
      {meshes.out.map((o, i) => (
        <group key={i}>
          <primitive object={o.atoms} />
          <primitive object={o.bonds} />
        </group>
      ))}
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree();
  useFrame(() => {
    const portrait = size.width / size.height < 0.9;
    camera.position.set(pointer.x * 0.5, 0.3 + pointer.y * 0.3, portrait ? 21 : 18);
    camera.lookAt(0, 0, 0);
  });
  return <spotLight position={[6, 7, 10]} angle={0.5} penumbra={0.8} intensity={260} color="#eaf2ff" />;
}

export default function IonStage({ reducedMotion, onReady }: { reducedMotion: boolean; onReady?: () => void }) {
  const q = getQuality();
  return (
    <Canvas
      className="ion-stage"
      dpr={q.dpr}
      camera={{ fov: 35, near: 0.1, far: 90, position: [0, 0.3, 18] }}
      gl={{ antialias: q.tier !== 'low', alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        requestAnimationFrame(() => onReady?.());
      }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#06080c', 16, 46]} />
      <StudioEnvironment intensity={0.35} />
      <ambientLight intensity={0.14} />
      <directionalLight position={[-6, 2, -4]} intensity={1.2} color="#8fb0ff" />
      <directionalLight position={[6, -3, 2]} intensity={0.35} color="#ffc59a" />
      <Rig />
      <Ions reducedMotion={reducedMotion} />
      <Field count={q.moleculeField} />
      <AdaptiveDpr min={q.dpr[0]} max={q.dpr[1]} />
    </Canvas>
  );
}
