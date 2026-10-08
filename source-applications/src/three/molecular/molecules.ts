/**
 * Procedural ion geometry (Å scale). Bond lengths and angles are textbook values:
 * sulfate S–O 1.49 Å (tetrahedral), nitrate N–O 1.25 Å (trigonal planar), carbonate C–O 1.29 Å,
 * phosphate P–O 1.54 Å, nitrite N–O 1.24 Å at 115°, chlorite Cl–O 1.56 Å at 111°, chlorate Cl–O
 * 1.49 Å at 107° (pyramidal), bromate Br–O 1.65 Å at 104° (pyramidal), ammonium N–H 1.03 Å,
 * water O–H 0.96 Å at 104.5°. Monatomic ions are drawn at ~0.4 × their ionic radii. Hydration shells
 * are illustrative first shells (typical metal–oxygen distances: Li 1.96, Na 2.43, K 2.8, Mg 2.07,
 * Ca 2.42 Å; Cl···O 3.2 Å).
 */
export type Element = 'C' | 'H' | 'N' | 'O' | 'S' | 'P' | 'Cl' | 'F' | 'Br' | 'Na' | 'Li' | 'K' | 'Mg' | 'Ca';
export interface Atom {
  el: Element;
  p: [number, number, number];
}
export interface Bond {
  a: number;
  b: number;
  order: 1 | 2;
}
export interface Molecule {
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export const ELEMENT_STYLE: Record<Element, { r: number; color: string }> = {
  C: { r: 0.34, color: '#3b4452' },
  H: { r: 0.2, color: '#dbe3ec' },
  N: { r: 0.33, color: '#6e98ff' },
  O: { r: 0.32, color: '#ff9470' },
  S: { r: 0.44, color: '#e8c86a' },
  P: { r: 0.44, color: '#ffa860' },
  Cl: { r: 0.72, color: '#6ee7a8' },
  F: { r: 0.56, color: '#b8f0d8' },
  Br: { r: 0.8, color: '#c8705a' },
  Na: { r: 0.41, color: '#a98cff' },
  Li: { r: 0.3, color: '#d9b8ff' },
  K: { r: 0.55, color: '#8a7dff' },
  Mg: { r: 0.29, color: '#6ee7c8' },
  Ca: { r: 0.4, color: '#7cc8ff' },
};

type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const TET: V3[] = [norm([1, 1, 1]), norm([1, -1, -1]), norm([-1, 1, -1]), norm([-1, -1, 1])];

class Builder {
  atoms: Atom[] = [];
  bonds: Bond[] = [];
  atom(el: Element, p: V3) {
    this.atoms.push({ el, p });
    return this.atoms.length - 1;
  }
  bond(a: number, b: number, order: 1 | 2 = 1) {
    this.bonds.push({ a, b, order });
  }
  /** Water molecule with oxygen at `o`, one O–H pointing along `toward`. */
  water(o: V3, toward: V3) {
    const O = this.atom('O', o);
    const d1 = norm(toward);
    let ref: V3 = Math.abs(d1[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const ax = norm(cross(d1, ref));
    const th = (104.5 * Math.PI) / 180;
    // rotate d1 by th about ax (Rodrigues)
    const c = Math.cos(th);
    const s = Math.sin(th);
    const kxd = cross(ax, d1);
    const d2: V3 = [d1[0] * c + kxd[0] * s, d1[1] * c + kxd[1] * s, d1[2] * c + kxd[2] * s];
    this.bond(O, this.atom('H', add(o, d1, 0.96)));
    this.bond(O, this.atom('H', add(o, d2, 0.96)));
    ref = [0, 0, 0];
    return O;
  }
  /** Water oriented with its oxygen toward a cation: both hydrogens point away along `away`. */
  waterAway(o: V3, away: V3) {
    const O = this.atom('O', o);
    const d = norm(away);
    const ref: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = norm(cross(d, ref));
    const half = (104.5 / 2) * (Math.PI / 180);
    for (const sgn of [1, -1]) {
      const h: V3 = [
        d[0] * Math.cos(half) + u[0] * Math.sin(half) * sgn,
        d[1] * Math.cos(half) + u[1] * Math.sin(half) * sgn,
        d[2] * Math.cos(half) + u[2] * Math.sin(half) * sgn,
      ];
      this.bond(O, this.atom('H', add(o, h, 0.96)));
    }
    return O;
  }
}

const OCT: V3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/** XO2 bent (nitrite, chlorite). */
function bent(center: Element, len: number, angleDeg: number, name: string, formula: string): Molecule {
  const m = new Builder();
  const X = m.atom(center, [0, 0, 0]);
  const h = ((angleDeg / 2) * Math.PI) / 180;
  m.bond(X, m.atom('O', [Math.sin(h) * len, -Math.cos(h) * len, 0]), 2);
  m.bond(X, m.atom('O', [-Math.sin(h) * len, -Math.cos(h) * len, 0]), 1);
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

/** XO3 trigonal pyramidal (chlorate, bromate), O–X–O angle given. */
function pyramidal(center: Element, len: number, angleDeg: number, name: string, formula: string): Molecule {
  const m = new Builder();
  const X = m.atom(center, [0, 0, 0]);
  // angle θ between bonds and the C3 axis from cos(OXO) = (3cos²θ − 1)/2
  const c = Math.cos((angleDeg * Math.PI) / 180);
  const th = Math.acos(Math.sqrt((2 * c + 1) / 3));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    m.bond(X, m.atom('O', [Math.sin(th) * Math.cos(a) * len, -Math.cos(th) * len, Math.sin(th) * Math.sin(a) * len]), i === 0 ? 2 : 1);
  }
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

/** Cation with an illustrative first hydration shell (oxygen toward the ion). */
function hydratedCation(el: Element, n: 4 | 6, dist: number, name: string, formula: string): Molecule {
  const m = new Builder();
  m.atom(el, [0, 0, 0]);
  const dirs = n === 4 ? TET : OCT;
  dirs.forEach((d) => m.waterAway([d[0] * dist, d[1] * dist, d[2] * dist], d));
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

/** Anion with water hydrogens pointing toward it. */
function hydratedAnion(el: Element, dist: number, name: string, formula: string): Molecule {
  const m = new Builder();
  m.atom(el, [0, 0, 0]);
  OCT.forEach((d) => {
    const o: V3 = [d[0] * dist, d[1] * dist, d[2] * dist];
    m.water(o, [-d[0], -d[1], -d[2]]);
  });
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

function ammonium(): Molecule {
  const m = new Builder();
  const N = m.atom('N', [0, 0, 0]);
  TET.forEach((d) => m.bond(N, m.atom('H', [d[0] * 1.03, d[1] * 1.03, d[2] * 1.03])));
  return { name: 'Ammonium', formula: 'NH₄⁺', atoms: m.atoms, bonds: m.bonds };
}

/** Tetrahedral oxyanion XO4 (sulfate, phosphate). */
function tetra(center: Element, len: number, name: string, formula: string, hydrate = false): Molecule {
  const m = new Builder();
  const X = m.atom(center, [0, 0, 0]);
  const Os: V3[] = TET.map((d) => [d[0] * len, d[1] * len, d[2] * len]);
  Os.forEach((p, i) => m.bond(X, m.atom('O', p), i < 2 ? 2 : 1));
  if (hydrate) {
    // first hydration shell: three waters H-bonded to each oxygen (2.8 Å O···O)
    TET.forEach((d, i) => {
      const ref: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = norm(cross(d, ref));
      const v = cross(d, u);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + i;
        const dir = norm(add(d, add([u[0] * Math.cos(a), u[1] * Math.cos(a), u[2] * Math.cos(a)], v, Math.sin(a)), 0.75));
        const ow = add(Os[i], dir, 2.8);
        m.water(ow, [Os[i][0] - ow[0], Os[i][1] - ow[1], Os[i][2] - ow[2]]);
      }
    });
  }
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

/** Trigonal planar XO3 (nitrate, carbonate). */
function trigonal(center: Element, len: number, name: string, formula: string): Molecule {
  const m = new Builder();
  const X = m.atom(center, [0, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    m.bond(X, m.atom('O', [Math.cos(a) * len, Math.sin(a) * len, 0]), i === 0 ? 2 : 1);
  }
  return { name, formula, atoms: m.atoms, bonds: m.bonds };
}

function single(el: Element, name: string, formula: string): Molecule {
  return { name, formula, atoms: [{ el, p: [0, 0, 0] }], bonds: [] };
}

function water(): Molecule {
  const m = new Builder();
  m.water([0, 0, 0], [1, 0, 0]);
  return { name: 'Water', formula: 'H₂O', atoms: m.atoms, bonds: m.bonds };
}

export const hydratedSulfate = () => tetra('S', 1.49, 'Sulfate', 'SO₄²⁻', true);
export const sulfate = () => tetra('S', 1.49, 'Sulfate', 'SO₄²⁻');
export const phosphate = () => tetra('P', 1.54, 'Phosphate', 'PO₄³⁻');
export const nitrate = () => trigonal('N', 1.25, 'Nitrate', 'NO₃⁻');
export const carbonate = () => trigonal('C', 1.29, 'Carbonate', 'CO₃²⁻');
export const chloride = () => single('Cl', 'Chloride', 'Cl⁻');
export const fluoride = () => single('F', 'Fluoride', 'F⁻');
export const bromide = () => single('Br', 'Bromide', 'Br⁻');
export const sodium = () => single('Na', 'Sodium', 'Na⁺');
export const waterMolecule = water;

export const nitrite = () => bent('N', 1.24, 115, 'Nitrite', 'NO₂⁻');
export const chlorite = () => bent('Cl', 1.56, 111, 'Chlorite', 'ClO₂⁻');
export const chlorate = () => pyramidal('Cl', 1.49, 107, 'Chlorate', 'ClO₃⁻');
export const bromate = () => pyramidal('Br', 1.65, 104, 'Bromate', 'BrO₃⁻');
export const ammoniumIon = ammonium;
export const hydratedChloride = () => hydratedAnion('Cl', 3.2, 'Chloride, hydrated', 'Cl⁻');
export const hydratedFluoride = () => hydratedAnion('F', 2.7, 'Fluoride, hydrated', 'F⁻');
export const hydratedLithium = () => hydratedCation('Li', 4, 1.96, 'Lithium, hydrated', 'Li⁺');
export const hydratedSodium = () => hydratedCation('Na', 6, 2.43, 'Sodium, hydrated', 'Na⁺');
export const hydratedPotassium = () => hydratedCation('K', 6, 2.8, 'Potassium, hydrated', 'K⁺');
export const hydratedMagnesium = () => hydratedCation('Mg', 6, 2.07, 'Magnesium, hydrated', 'Mg²⁺');
export const hydratedCalcium = () => hydratedCation('Ca', 6, 2.42, 'Calcium, hydrated', 'Ca²⁺');
export const lithium = () => single('Li', 'Lithium', 'Li⁺');
export const potassium = () => single('K', 'Potassium', 'K⁺');
export const magnesium = () => single('Mg', 'Magnesium', 'Mg²⁺');
export const calcium = () => single('Ca', 'Calcium', 'Ca²⁺');
