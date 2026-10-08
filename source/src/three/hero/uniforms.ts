import * as THREE from 'three';
import { BANDS } from './flowPath';
import { heroFrame } from './heroFrame';

/** Band uniforms shared (by reference) by every liquid / ion material in the hero. */
export const bandUniforms = {
  uC: { value: new Array(7).fill(-100) as number[] },
  uSg: { value: new Array(7).fill(1) as number[] },
  uAmp: { value: new Array(7).fill(0) as number[] },
  uCol: { value: BANDS.map((b) => new THREE.Color(b.color)) },
};

export function syncBandUniforms() {
  for (let i = 0; i < 7; i++) {
    bandUniforms.uC.value[i] = heroFrame.c[i];
    bandUniforms.uSg.value[i] = heroFrame.sigma[i];
    bandUniforms.uAmp.value[i] = heroFrame.amp[i];
  }
}

/** Matte, restrained hardware materials shared by the hero objects. */
export function makeHardwareMats() {
  return {
    steel: new THREE.MeshStandardMaterial({ color: '#aab3be', metalness: 0.85, roughness: 0.38, envMapIntensity: 0.8 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#4a525d', metalness: 0.7, roughness: 0.45, envMapIntensity: 0.7 }),
    peek: new THREE.MeshStandardMaterial({ color: '#cbbd98', metalness: 0, roughness: 0.6 }),
    peekDark: new THREE.MeshStandardMaterial({ color: '#30353d', metalness: 0.1, roughness: 0.62 }),
    housing: new THREE.MeshStandardMaterial({ color: '#1d222a', metalness: 0.3, roughness: 0.6 }),
    housingLight: new THREE.MeshStandardMaterial({ color: '#59616c', metalness: 0.35, roughness: 0.55 }),
    resin: new THREE.MeshStandardMaterial({ color: '#6e7c8f', metalness: 0, roughness: 0.55, envMapIntensity: 0.6 }),
    electrode: new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 1, roughness: 0.3, envMapIntensity: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#cfe2f3',
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
    }),
    membrane: new THREE.MeshStandardMaterial({
      color: '#c9a6ff',
      metalness: 0,
      roughness: 0.7,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    line: new THREE.LineBasicMaterial({ color: '#8fa6c2', transparent: true, opacity: 0.55 }),
    dashed: new THREE.LineDashedMaterial({ color: '#9fb5d1', transparent: true, opacity: 0.6, dashSize: 0.08, gapSize: 0.06 }),
  };
}
export type HardwareMats = ReturnType<typeof makeHardwareMats>;
