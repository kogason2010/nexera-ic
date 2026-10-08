import type { Molecule } from './molecular/molecules';
import {
  ammoniumIon,
  bromate,
  bromide,
  chlorate,
  chloride,
  chlorite,
  fluoride,
  hydratedCalcium,
  hydratedChloride,
  hydratedFluoride,
  hydratedLithium,
  hydratedMagnesium,
  hydratedPotassium,
  hydratedSodium,
  hydratedSulfate,
  calcium,
  lithium,
  magnesium,
  nitrate,
  nitrite,
  phosphate,
  potassium,
  sodium,
  sulfate,
} from './molecular/molecules';

export type SceneId = 'hero' | 'partA' | 'partB' | 'cations' | 'dual' | 'atlas' | 'outro';

export interface SceneItem {
  mol: Molecule;
  pos: [number, number, number];
  scale: number;
  spin: number; // rad/s about the item's own axis
  tilt: number;
  label?: string;
  sub?: string;
  color?: string;
}

export interface Scene {
  id: SceneId;
  items: SceneItem[];
  /** group labels not tied to one molecule */
  tags?: { text: string; sub?: string; pos: [number, number, number] }[];
}

/** Molecule used when an ion is shown on its own (hydrated where a shell is modelled). */
export const FOCUS_MOLECULE: Record<string, () => Molecule> = {
  F: hydratedFluoride,
  Cl: hydratedChloride,
  NO2: nitrite,
  Br: bromide,
  NO3: nitrate,
  PO4: phosphate,
  SO4: hydratedSulfate,
  ClO2: chlorite,
  BrO3: bromate,
  ClO3: chlorate,
  Li: hydratedLithium,
  Na: hydratedSodium,
  NH4: ammoniumIon,
  K: hydratedPotassium,
  Mg: hydratedMagnesium,
  Ca: hydratedCalcium,
};

const ring = (n: number, r: number, i: number, start = Math.PI / 2): [number, number, number] => {
  const a = start - (i / n) * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r * 0.86, Math.sin(a * 2) * 0.6];
};

export function buildScene(id: SceneId, ion = 'SO4'): Scene {
  switch (id) {
    case 'hero':
      return {
        id,
        items: [
          { mol: hydratedSulfate(), pos: [0, 0, 0], scale: 1, spin: 0.12, tilt: -0.25 },
          { mol: hydratedSodium(), pos: [4.2, -2.6, -3], scale: 0.5, spin: -0.18, tilt: 0.4 },
          { mol: hydratedChloride(), pos: [-3.8, 2.8, -4], scale: 0.45, spin: 0.2, tilt: 0.2 },
        ],
      };
    case 'partA': {
      const list: [Molecule, string, string][] = [
        [fluoride(), 'F⁻', '4.46 min'],
        [chloride(), 'Cl⁻', '7.72 min'],
        [nitrite(), 'NO₂⁻', '9.84 min'],
        [bromide(), 'Br⁻', '13.1 min'],
        [nitrate(), 'NO₃⁻', '15.8 min'],
        [phosphate(), 'PO₄³⁻', '16.7 min'],
        [sulfate(), 'SO₄²⁻', '18.4 min'],
      ];
      return {
        id,
        items: list.map(([mol, label, sub], i) => ({ mol, pos: ring(7, 5.8, i), scale: 1.0, spin: 0.25 + i * 0.03, tilt: 0.3, label, sub })),
      };
    }
    case 'partB': {
      const list: [Molecule, string, string][] = [
        [chlorite(), 'ClO₂⁻', '≈ 6.2 min'],
        [bromate(), 'BrO₃⁻', '≈ 6.7 min'],
        [bromide(), 'Br⁻', '≈ 13.1 min'],
        [chlorate(), 'ClO₃⁻', '≈ 13.8 min'],
      ];
      return {
        id,
        items: list.map(([mol, label, sub], i) => ({ mol, pos: ring(4, 4.8, i, Math.PI * 0.75), scale: 1.15, spin: 0.3, tilt: 0.35, label, sub })),
      };
    }
    case 'cations': {
      const around: [Molecule, string, string][] = [
        [hydratedLithium(), 'Li⁺', '3.43 min'],
        [hydratedSodium(), 'Na⁺', '3.74 min'],
        [ammoniumIon(), 'NH₄⁺', '4.2 min'],
        [hydratedPotassium(), 'K⁺', '4.7 min'],
        [hydratedCalcium(), 'Ca²⁺', '16.0 min'],
      ];
      return {
        id,
        items: [
          { mol: hydratedMagnesium(), pos: [0, 0, 0.5], scale: 0.85, spin: 0.15, tilt: 0.3, label: 'Mg²⁺', sub: '12.0 min · [Mg(H₂O)₆]²⁺' },
          ...around.map(([mol, label, sub], i) => ({
            mol,
            pos: ring(5, 5.2, i),
            scale: mol.atoms.length > 6 ? 0.55 : 1.0,
            spin: 0.22,
            tilt: 0.3,
            label,
            sub,
          })),
        ],
      };
    }
    case 'dual':
      return {
        id,
        items: [
          { mol: sulfate(), pos: [-4.4, 1.6, 0], scale: 1.2, spin: 0.25, tilt: 0.3 },
          { mol: chloride(), pos: [-2.6, -1.2, 0.6], scale: 1.2, spin: 0.25, tilt: 0.3 },
          { mol: nitrate(), pos: [-5.4, -1.6, -0.6], scale: 1.2, spin: 0.3, tilt: 0.3 },
          { mol: hydratedSodium(), pos: [4.0, 1.4, 0], scale: 0.55, spin: -0.2, tilt: 0.3 },
          { mol: ammoniumIon(), pos: [2.8, -1.8, 0.5], scale: 1.1, spin: 0.3, tilt: 0.3 },
          { mol: hydratedMagnesium(), pos: [5.6, -1.4, -0.4], scale: 0.55, spin: 0.2, tilt: 0.3 },
        ],
        tags: [
          { text: 'Anions', sub: 'IC-150 · anion channel', pos: [-4.0, 3.6, 0] },
          { text: 'Cations', sub: 'IC-150D · cation channel', pos: [4.2, 3.6, 0] },
        ],
      };
    case 'atlas':
      return { id, items: [{ mol: (FOCUS_MOLECULE[ion] ?? hydratedSulfate)(), pos: [0, 0, 0], scale: 1.35, spin: 0.2, tilt: -0.2 }] };
    case 'outro': {
      const all = [fluoride, chloride, nitrite, bromide, nitrate, phosphate, sulfate, chlorite, bromate, chlorate, lithium, sodium, ammoniumIon, potassium, magnesium, calcium];
      return {
        id,
        items: all.map((f, i) => {
          // golden-angle sphere
          const t = (i + 0.5) / all.length;
          const inc = Math.acos(1 - 2 * t);
          const az = i * 2.39996;
          const r = 4.4;
          return { mol: f(), pos: [Math.sin(inc) * Math.cos(az) * r, Math.cos(inc) * r * 0.8, Math.sin(inc) * Math.sin(az) * r], scale: 1.1, spin: 0.3, tilt: 0.2 };
        }),
      };
    }
  }
}
