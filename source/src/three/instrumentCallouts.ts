/** Geometry constants shared with the 3D instrument (1 scene unit = 20 cm). */
const U = 1 / 20;
const W = 26 * U;
const D = 50 * U;
const GAP = 0.06;
const X_AS = -(W + GAP);
const X_IC = 0;
const X_D = W + GAP;
const ZF = D / 2;
const BZ = ZF - 0.64;

/** Screen callouts per tour step: world anchor (stack coordinates) + key into the label text. */
export const CALLOUTS: { at: [number, number, number]; key: string }[][] = [
  [{ at: [X_AS + 0.1, 0.84, BZ + 0.34], key: 'vials' }, { at: [X_AS, 1.2, BZ + 0.1], key: 'needle' }],
  [{ at: [X_IC - 0.28, 1.28, BZ + 0.42], key: 'pumpheads' }, { at: [X_IC - 0.28, 0.5, BZ + 0.32], key: 'degasser' }],
  [{ at: [X_IC + 0.18, 1.1, BZ + 0.24], key: 'column' }, { at: [X_IC + 0.4, 1.62, BZ + 0.24], key: 'preheater' }],
  [{ at: [X_IC - 0.28, 1.98, BZ + 0.16], key: 'suppressor' }, { at: [X_IC - 0.24, 2.28, BZ + 0.06], key: 'panel' }],
  [{ at: [X_IC + 0.4, 0.44, BZ + 0.2], key: 'cell' }],
  [{ at: [X_IC + 0.18, 1.1, BZ + 0.24], key: 'anionpath' }, { at: [X_D + 0.18, 1.1, BZ + 0.24], key: 'cationpath' }],
];
export const calloutEls: (HTMLElement | null)[] = [];
