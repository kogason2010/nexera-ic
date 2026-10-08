/** Per-frame derived values shared by every hero component (written once per frame by the Director). */
export const heroFrame = {
  p: 0,
  sim: 0,
  minutes: 0,
  inject: 0, // 0 = valve in load position, 1 = switched to inject
  signal: 0, // chromatogram value at the current time (published-height units)
  time: 0,
  // band state per analyte (path coordinate s, spatial σ, amplitude)
  c: new Float32Array(7),
  sigma: new Float32Array(7),
  amp: new Float32Array(7),
  inColumn: new Uint8Array(7),
};

/** Screen-space anchors written by the scene for the HTML overlays (px, relative to the canvas). */
export const heroScreen = {
  cell: { x: 0, y: 0, on: false },
};
