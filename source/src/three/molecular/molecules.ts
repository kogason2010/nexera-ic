/**
 * Procedural ion geometry (Å scale). Bond lengths and angles are textbook values:
 * sulfate S–O 1.49 Å (tetrahedral), nitrate N–O 1.25 Å (trigonal planar), carbonate C–O 1.29 Å,
 * phosphate P–O 1.54 Å, water O–H 0.96 Å at 104.5°. Halides are drawn at their ionic radii.
 */
export type Element = 'C' | 'H' | 'N' | 'O' | 'S' | 'P' | 'Cl' | 'F' | 'Br' | 'Na';
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
  Na: { r: 0.4, color: '#a98cff' },
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
