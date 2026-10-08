/**
 * Liquid-phase visuals for the hero flow path.
 *
 * Tubing: clear small-bore tubing filled with eluent. The liquid is tinted by the concentration of
 * each sample anion at that point of the path (Gaussian bands, same model as the chromatogram) and
 * carries faint flow streaks that move downstream.
 */
const BANDS_GLSL = /* glsl */ `
  uniform float uC[7];
  uniform float uSg[7];
  uniform float uAmp[7];
  uniform vec3 uCol[7];
  vec4 bandColor(float s) {
    vec3 col = vec3(0.0);
    float a = 0.0;
    for (int i = 0; i < 7; i++) {
      float d = (s - uC[i]) / uSg[i];
      float c = uAmp[i] * exp(-0.5 * d * d);
      col += uCol[i] * c;
      a += c;
    }
    return vec4(col, a);
  }
`;

export const liquidVertex = /* glsl */ `
  attribute float aS;
  varying float vS;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vS = aS;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const liquidFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uTintAfter;   // analytes fade after leaving the cell (they go on to waste)
  ${BANDS_GLSL}
  varying float vS;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    vec4 b = bandColor(vS);
    float after = 1.0 - 0.7 * smoothstep(uTintAfter, uTintAfter + 1.5, vS);
    b *= after;
    // eluent: faint cyan liquid with streaks drifting downstream
    float streak = smoothstep(0.82, 1.0, sin(vS * 9.0 - uTime * 4.0) * 0.5 + 0.5);
    vec3 eluent = vec3(0.32, 0.55, 0.75) * (0.28 + 0.18 * streak);
    vec3 wall = vec3(0.75, 0.84, 0.95) * fres * 0.55;
    float conc = clamp(b.a, 0.0, 1.0);
    vec3 col = mix(eluent, b.rgb / max(b.a, 1e-3), conc) * (1.0 + conc * 0.9) + wall;
    float alpha = (0.42 + fres * 0.4 + conc * 0.45) * uOpacity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/** Flat liquid sheet (suppressor channels, magnified cell): same band colouring, s given by uv.x. */
export const sheetVertex = /* glsl */ `
  uniform float uS0;
  uniform float uS1;
  varying float vS;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vS = mix(uS0, uS1, uv.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sheetFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uBase;
  uniform float uBandGain;
  uniform float uFlow;
  ${BANDS_GLSL}
  varying float vS;
  varying vec2 vUv;
  void main() {
    vec4 b = bandColor(vS) * uBandGain;
    float conc = clamp(b.a, 0.0, 1.0);
    float streak = smoothstep(0.86, 1.0, sin(vUv.x * 40.0 - uTime * 3.0 * uFlow + vUv.y * 3.0) * 0.5 + 0.5) * uFlow;
    vec3 col = mix(uBase * (0.85 + 0.25 * streak), b.rgb / max(b.a, 1e-3), conc * 0.85);
    float edge = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    gl_FragColor = vec4(col, (0.26 + conc * 0.42 + streak * 0.05) * uOpacity * (0.6 + 0.4 * edge));
  }
`;

/**
 * Ions inside the magnified views. Positions are analytic functions of the simulation clock so the
 * scene scrubs exactly with scroll. In the column, each ion alternates between being held at an
 * exchange site (stationary) and moving with the eluent; the fraction of time held is k/(1+k), which
 * makes the band as a whole travel at u/(1+k), the zone velocity used for the chromatogram.
 */
export const ionVertex = /* glsl */ `
  uniform float uSim;
  uniform float uTime;
  uniform float uPix;
  uniform float uSize;
  uniform float uMode;      // 0 column, 1 suppressor channel, 2 magnified cell
  uniform float uS0;
  uniform float uS1;
  uniform vec3 uOrigin;     // world position of s = uS0 on the channel axis
  uniform float uScale;     // world units per unit of s
  uniform vec3 uHalf;       // channel half-extent in y and z (x unused)
  uniform float uFb[8];     // fraction of time held on the stationary phase (7 analytes + eluent)
  uniform float uOpacity;
  uniform float uC[7];
  uniform float uSg[7];

  attribute vec4 aSeed;     // x: N(0,1), y: U(0,1), z: U(0,1), w: U(0,1)
  attribute float aBand;    // 0..6 analyte, 7 carbonate eluent

  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    int b = int(aBand + 0.5);
    float L = uS1 - uS0;
    float s;
    float bound = 0.0;
    float cycleId = 0.0;
    if (b < 7) {
      float c = 0.0; float sg = 1.0;
      for (int i = 0; i < 7; i++) { if (i == b) { c = uC[i]; sg = uSg[i]; } }
      s = c + aSeed.x * sg;
      if (uMode < 0.5) {
        float fb = 0.0;
        for (int i = 0; i < 7; i++) { if (i == b) fb = uFb[i]; }
        float P = 0.9;
        float ph = uSim / P + aSeed.y;
        float phi = fract(ph);
        cycleId = floor(ph);
        float vb = 1.0 - fb;
        float A = vb * fb * P;
        s += phi < fb ? (A * 0.5 - vb * phi * P) : (-A * 0.5 + fb * (phi - fb) * P);
        bound = phi < fb ? 1.0 : 0.0;
      } else {
        // free solution: gentle drift with the flow (idle motion even when scroll pauses)
        s += sin(uTime * 0.9 + aSeed.y * 30.0) * 0.015;
        cycleId = floor(uTime * 0.25 + aSeed.y);
      }
    } else {
      float fb = uFb[7];
      float P = 1.4;
      float ph = uTime / P + aSeed.y * 7.0;
      float phi = fract(ph);
      cycleId = floor(ph);
      float base = fract(aSeed.z + uTime * 0.035);
      s = uS0 + base * L;
      float vb = 1.0 - fb;
      float A = vb * fb * P * 0.35;
      s += phi < fb ? (A * 0.5 - vb * phi * P * 0.35) : (-A * 0.5 + fb * (phi - fb) * P * 0.35);
      bound = phi < fb ? 1.0 : 0.0;
    }

    float inside = step(uS0, s) * step(s, uS1);
    float h1 = hash(aSeed.w * 91.7 + cycleId * 13.1);
    float h2 = hash(aSeed.z * 47.3 + cycleId * 7.7);
    vec3 p = uOrigin + vec3((s - uS0) * uScale, 0.0, 0.0);
    if (uMode < 0.5) {
      // back half of the bed (the front half is cut away): y² + z² < R², z ≤ 0
      float r = sqrt(h1) * uHalf.y;
      float a = 3.14159265 * h2;
      p.y += cos(a) * r;
      p.z += -sin(a) * r * uHalf.z / uHalf.y + 0.02;
    } else {
      p.y += (h1 * 2.0 - 1.0) * uHalf.y;
      p.z += (h2 * 2.0 - 1.0) * uHalf.z;
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = b < 7 ? 1.0 : 0.72;
    gl_PointSize = inside * uSize * size * uPix / max(0.5, -mv.z);
    vType = b < 7 ? 0.0 : (uMode > 1.5 ? 4.0 : 1.0);
    vBand = float(b);
    vBound = bound;
    vAlpha = inside * uOpacity;
  }
`;

/** Point glyphs: analyte anion, carbonate, Na⁺, H⁺, carbonic acid (neutral), fixed exchange site (+). */
export const glyphFragment = /* glsl */ `
  uniform vec3 uCol[7];
  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;

  float bar(vec2 q, vec2 h) { vec2 d = abs(q) - h; return 1.0 - smoothstep(0.0, 0.04, max(d.x, d.y)); }

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    q.y = -q.y;
    float d = length(q);
    int t = int(vType + 0.5);
    vec3 col = vec3(0.0);
    float disc = 1.0 - smoothstep(0.36, 0.42, d);
    float minus = bar(q, vec2(0.17, 0.04));
    float plus = max(minus, bar(q, vec2(0.04, 0.17)));
    vec4 o = vec4(0.0);
    if (t == 0) {
      int b = int(vBand + 0.5);
      for (int i = 0; i < 7; i++) { if (i == b) col = uCol[i]; }
      o = vec4(mix(col, vec3(0.03, 0.05, 0.08), minus * 0.9), disc);
      float ring = smoothstep(0.42, 0.45, d) * (1.0 - smoothstep(0.47, 0.5, d)) * vBound;
      o = max(o, vec4(col * 1.3, ring * 0.9));
    } else if (t == 1) {
      col = vec3(0.56, 0.62, 0.78);
      o = vec4(mix(col, vec3(0.04, 0.05, 0.08), minus * 0.9), disc * (0.55 + 0.25 * vBound));
    } else if (t == 2) {
      col = vec3(1.0, 0.72, 0.47);
      o = vec4(mix(col, vec3(0.08, 0.05, 0.03), plus * 0.9), disc);
    } else if (t == 3) {
      col = vec3(0.92, 0.97, 1.0);
      o = vec4(mix(col, vec3(0.05, 0.07, 0.1), plus * 0.9), disc * 0.95);
    } else if (t == 4) {
      float ring = smoothstep(0.26, 0.3, d) * (1.0 - smoothstep(0.38, 0.42, d));
      o = vec4(vec3(0.62, 0.66, 0.72), ring * 0.75);
    } else {
      o = vec4(vec3(1.0, 0.82, 0.5), plus * 0.95);
    }
    if (o.a * vAlpha < 0.02) discard;
    gl_FragColor = vec4(o.rgb, o.a * vAlpha);
  }
`;

/** Static-position glyph points (exchange sites, suppressor ions): type comes from an attribute. */
export const glyphStaticVertex = /* glsl */ `
  uniform float uPix;
  uniform float uSize;
  uniform float uOpacity;
  attribute float aType;
  attribute float aScale;
  attribute float aBand;
  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPix / max(0.5, -mv.z);
    vType = aType;
    vBand = aBand;
    vBound = 0.0;
    vAlpha = uOpacity * step(0.001, aScale);
  }
`;
