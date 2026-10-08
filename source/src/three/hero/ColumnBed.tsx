import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { glyphFragment, glyphStaticVertex, ionVertex } from '../../shaders/flow';
import { normal, rng } from '../../utils/math';
import { BANDS, LAYOUT, S } from './flowPath';
import { heroFrame } from './heroFrame';
import { bandUniforms, type HardwareMats } from './uniforms';

const C = LAYOUT.column;

/**
 * Magnified cut-away of the packed anion-exchange bed:
 *  - resin beads (stationary phase), drawn in the back half of the column
 *  - fixed positive exchange sites (+) on the bead surfaces
 *  - sample anions (coloured, −) that are alternately held at a site and carried by the eluent
 *  - carbonate eluent anions (grey) competing for the same sites
 */
export function ColumnBed({ m, beads: beadBudget, ions: ionsPerBand }: { m: HardwareMats; beads: number; ions: number }) {
  const { gl } = useThree();

  const { beadMesh, siteGeo } = useMemo(() => {
    const rand = rng(31);
    const spacing = 0.118;
    const centres: THREE.Vector3[] = [];
    const radii: number[] = [];
    for (let x = C.win0 + 0.06; x < C.win1 - 0.06; x += spacing) {
      for (let y = -C.r; y <= C.r; y += spacing) {
        for (let z = -C.r; z <= 0.03; z += spacing) {
          const p = new THREE.Vector3(x + (rand() - 0.5) * 0.04, y + (rand() - 0.5) * 0.04, z + (rand() - 0.5) * 0.04);
          const r = 0.046 + rand() * 0.012;
          if (p.y * p.y + p.z * p.z > (C.r - r) ** 2) continue;
          if (p.z > 0.02) continue;
          centres.push(p);
          radii.push(r);
        }
      }
    }
    // thin out evenly if the device budget is smaller
    const keep = Math.min(1, beadBudget / centres.length);
    const sel: number[] = [];
    centres.forEach((_, i) => {
      if (rand() < keep) sel.push(i);
    });

    const sphere = new THREE.SphereGeometry(1, 14, 10);
    const beadMesh = new THREE.InstancedMesh(sphere, m.resin, sel.length);
    const t = new THREE.Matrix4();
    sel.forEach((idx, i) => {
      const r = radii[idx];
      t.makeScale(r, r, r).setPosition(centres[idx]);
      beadMesh.setMatrixAt(i, t);
    });

    // exchange sites on the camera-facing surfaces of the beads nearest the cut plane
    const sitePos: number[] = [];
    sel.forEach((idx) => {
      const c = centres[idx];
      if (c.z < -0.24) return;
      const r = radii[idx];
      for (let k = 0; k < 2; k++) {
        const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, 0.6 + rand() * 0.8).normalize();
        sitePos.push(c.x + d.x * r * 1.02, c.y + d.y * r * 1.02, c.z + d.z * r * 1.02);
      }
    });
    const n = sitePos.length / 3;
    const siteGeo = new THREE.BufferGeometry();
    siteGeo.setAttribute('position', new THREE.Float32BufferAttribute(sitePos, 3));
    siteGeo.setAttribute('aType', new THREE.Float32BufferAttribute(new Float32Array(n).fill(5), 1));
    siteGeo.setAttribute('aScale', new THREE.Float32BufferAttribute(new Float32Array(n).fill(1), 1));
    siteGeo.setAttribute('aBand', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
    return { beadMesh, siteGeo };
  }, [m.resin, beadBudget]);

  const siteMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glyphStaticVertex,
        fragmentShader: glyphFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { ...bandUniforms, uPix: { value: 1 }, uSize: { value: 46 }, uOpacity: { value: 1 } },
      }),
    [],
  );

  const ions = useMemo(() => {
    const rand = rng(53);
    const eluent = Math.round(ionsPerBand * 3.2);
    const n = ionsPerBand * 7 + eluent;
    const seed = new Float32Array(n * 4);
    const band = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const isE = i >= ionsPerBand * 7;
      band[i] = isE ? 7 : i % 7;
      seed[i * 4] = Math.max(-2.6, Math.min(2.6, normal(rand)));
      seed[i * 4 + 1] = rand();
      seed[i * 4 + 2] = rand();
      seed[i * 4 + 3] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aBand', new THREE.BufferAttribute(band, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);
    const fb = BANDS.map((b) => b.kc / (1 + b.kc));
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
        uSize: { value: 66 },
        uMode: { value: 0 },
        // ions are only shown inside the cut-away window
        uS0: { value: S.colIn + (C.win0 - C.x0) },
        uS1: { value: S.colIn + (C.win1 - C.x0) },
        uOrigin: { value: new THREE.Vector3(C.win0, 0, 0) },
        uScale: { value: 1 },
        uHalf: { value: new THREE.Vector3(0, C.r - 0.05, C.r - 0.05) },
        uFb: { value: [...fb, 0.5] },
        uOpacity: { value: 1 },
      },
    });
    return { g, mat };
  }, [ionsPerBand]);

  useEffect(
    () => () => {
      beadMesh.geometry.dispose();
      siteGeo.dispose();
      siteMat.dispose();
      ions.g.dispose();
      ions.mat.dispose();
    },
    [beadMesh, siteGeo, siteMat, ions],
  );

  useFrame(() => {
    const pr = gl.getPixelRatio();
    const u = ions.mat.uniforms;
    u.uSim.value = heroFrame.sim;
    u.uTime.value = heroFrame.time;
    u.uPix.value = pr;
    siteMat.uniforms.uPix.value = pr;
  });

  return (
    <group>
      <primitive object={beadMesh} />
      <points geometry={siteGeo} material={siteMat} frustumCulled={false} renderOrder={6} />
      <points geometry={ions.g} material={ions.mat} frustumCulled={false} renderOrder={7} />
    </group>
  );
}
