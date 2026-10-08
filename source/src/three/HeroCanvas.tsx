import { useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../utils/quality';
import { AdaptiveDpr } from './shared/AdaptiveDpr';
import { StudioEnvironment } from './shared/StudioEnvironment';
import { Director } from './hero/Director';
import { CameraRig } from './hero/CameraRig';
import { FlowTubes } from './hero/FlowTubes';
import { Hardware } from './hero/Hardware';
import { ColumnBed } from './hero/ColumnBed';
import { SuppressorSchematic } from './hero/SuppressorSchematic';
import { CellView } from './hero/CellView';
import { HeroLabels3D } from './hero/HeroLabels3D';
import { makeHardwareMats, syncBandUniforms } from './hero/uniforms';

interface Props {
  active: boolean;
  reducedMotion: boolean;
  onReady?: () => void;
}

function BandSync() {
  useFrame(() => syncBandUniforms(), -9);
  return null;
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const q = getQuality();
  const m = useMemo(() => makeHardwareMats(), []);
  useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
  return (
    <>
      <Director />
      <BandSync />
      <CameraRig reducedMotion={reducedMotion} />
      <Hardware m={m} />
      <FlowTubes />
      <ColumnBed m={m} beads={q.tier === 'low' ? 700 : q.tier === 'medium' ? 1100 : 1600} ions={q.tier === 'low' ? 70 : 120} />
      <SuppressorSchematic m={m} />
      <CellView m={m} />
      <HeroLabels3D reducedMotion={reducedMotion} />
    </>
  );
}

/** The hero's real-time scene: one continuous liquid flow path through a suppressed-conductivity IC. */
export default function HeroCanvas({ active, reducedMotion, onReady }: Props) {
  const q = getQuality();
  return (
    <Canvas
      className="hero-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={q.dpr}
      camera={{ fov: 38, near: 0.1, far: 80, position: [-15.2, 0.6, 9.6] }}
      gl={{ antialias: q.tier !== 'low', alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        requestAnimationFrame(() => onReady?.());
      }}
      aria-hidden="true"
    >
      <StudioEnvironment intensity={0.45} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 6, 7]} intensity={1.1} color="#e6eeff" />
      <directionalLight position={[-8, 2, -5]} intensity={0.7} color="#7fd4ff" />
      <directionalLight position={[6, -3, -4]} intensity={0.5} color="#b48cff" />
      <Scene reducedMotion={reducedMotion} />
      <AdaptiveDpr min={q.dpr[0]} max={q.dpr[1]} />
    </Canvas>
  );
}
