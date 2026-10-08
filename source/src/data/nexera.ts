/**
 * Facts used across the site. Every number here is taken from Shimadzu customer-facing material:
 * the Nexera IC customer presentation (2026), the Nexera IC specification sheet, the anion/cation
 * suppression-principle presentation, and Application News for EPA Method 300.1 (Parts A and B)
 * and ASTM D6919-17. Chromatograms on this site are redrawn from those application notes.
 */

export const DISCLAIMER =
  'Independent, unofficial showcase. Not affiliated with, sponsored or endorsed by Shimadzu Corporation. Nexera, Shim-pack and Shim-vial are trademarks of Shimadzu Corporation or its affiliated companies.';

/** EPA 300.1 Part A, Shim-pack IC-SA3, 4.5 mmol/L Na2CO3, 0.85 mL/min, 40 °C, 50 µL. */
export const EPA_A = {
  conditions: [
    ['Column', 'Shim-pack IC-SA3 + IC-SA3 (G)'],
    ['Eluent', '4.5 mmol/L sodium carbonate'],
    ['Flow rate', '0.85 mL/min'],
    ['Column temp.', '40 °C'],
    ['Injection', '50 µL'],
    ['Detection', 'Suppressed conductivity'],
  ],
  // retention times / heights read from the STD 3 chromatogram (Fig. 3) of the application note
  peaks: [
    { id: 'F', label: 'Fluoride', formula: 'F⁻', tR: 4.46, h: 2.7, std: 0.5, r2: 0.9999, mdl: 0.001 },
    { id: 'Cl', label: 'Chloride', formula: 'Cl⁻', tR: 7.72, h: 12.0, std: 10, r2: 0.9995, mdl: 0.0005 },
    { id: 'NO2', label: 'Nitrite-N', formula: 'NO₂⁻', tR: 9.84, h: 2.55, std: 0.5, r2: 0.9998, mdl: 0.0006 },
    { id: 'Br', label: 'Bromide', formula: 'Br⁻', tR: 13.1, h: 1.6, std: 2.0, r2: 0.9999, mdl: 0.001 },
    { id: 'NO3', label: 'Nitrate-N', formula: 'NO₃⁻', tR: 15.8, h: 1.85, std: 0.5, r2: 0.9999, mdl: 0.0004 },
    { id: 'PO4', label: 'Phosphate-P', formula: 'PO₄³⁻', tR: 16.7, h: 3.1, std: 2.5, r2: 0.9995, mdl: 0.002 },
    { id: 'SO4', label: 'Sulfate', formula: 'SO₄²⁻', tR: 18.4, h: 5.0, std: 5.0, r2: 0.9995, mdl: 0.003 },
  ],
  voidTime: 2.7, // water dip, min
  recovery: 'within 100 ± 10 %',
  hours: 50,
};

/** EPA 300.1 Part B: inorganic disinfection by-products, 200 µL injection. */
export const EPA_B = {
  analytes: [
    { id: 'ClO2', label: 'Chlorite', mdl: 0.3 },
    { id: 'BrO3', label: 'Bromate', mdl: 0.6 },
    { id: 'Br', label: 'Bromide', mdl: 0.3 },
    { id: 'ClO3', label: 'Chlorate', mdl: 0.5 },
  ],
  mdlRange: '0.3–0.6 µg/L',
  recovery: '92–111 %',
  runTime: 'under 16 min',
};

/** ASTM D6919-17 suppressed cations, Shim-pack IC-C4, 2.5 mmol/L MSA, 1.0 mL/min, 40 °C, 10 µL. */
export const CATIONS = {
  conditions: [
    ['Column', 'Shim-pack IC-C4 + IC-GC4'],
    ['Eluent', '2.5 mmol/L methanesulfonic acid'],
    ['Flow rate', '1.0 mL/min'],
    ['Column temp.', '40 °C'],
    ['Injection', '10 µL'],
    ['Detection', 'Suppressed conductivity'],
  ],
  peaks: [
    { id: 'Li', label: 'Lithium', formula: 'Li⁺', tR: 3.43, h: 9.9, sigma: 0.07, conc: 4, mdl: 0.2, rsd: 0.18 },
    { id: 'Na', label: 'Sodium', formula: 'Na⁺', tR: 3.74, h: 6.6, sigma: 0.075, conc: 8, mdl: 0.5, rsd: 0.12 },
    { id: 'NH4', label: 'Ammonium', formula: 'NH₄⁺', tR: 4.2, h: 2.7, sigma: 0.085, conc: 4, mdl: 0.5, rsd: 0.1 },
    { id: 'K', label: 'Potassium', formula: 'K⁺', tR: 4.7, h: 1.6, sigma: 0.095, conc: 4, mdl: 0.6, rsd: 0.13 },
    { id: 'Mg', label: 'Magnesium', formula: 'Mg²⁺', tR: 12.0, h: 2.8, sigma: 0.24, conc: 8, mdl: 0.9, rsd: 0.18 },
    { id: 'Ca', label: 'Calcium', formula: 'Ca²⁺', tR: 16.0, h: 3.6, sigma: 0.3, conc: 20, mdl: 1.6, rsd: 0.18 },
  ],
  runTime: 'within 20 min',
  recovery: '94.4–102.1 %',
};

export const SUPPRESSION = {
  cationSN: { before: 125, after: 3215, analyte: '50 ppb Na⁺' },
  anionLifetime: '> 5,000 injections',
  cationLifetime: '> 6,000 injections',
  anionMax: 'up to 15 mmol/L Na⁺',
  cationMax: 'up to 10 mmol/L MSA',
  current: '180 mA constant current',
  flow: '0.8–2.0 mL/min',
  mdlSuppressed: '5 ppb',
  mdlNonSuppressed: '100 ppb',
};

export const SPECS: { group: string; rows: [string, string][] }[] = [
  {
    group: 'IC-150 · Pump',
    rows: [
      ['Type', 'Tandem double plunger, micro plunger (10 µL per stroke), metal-free flow path'],
      ['Flow rate', '0.0000–4.0000 mL/min at 35 MPa · 4.0000–5.0000 mL/min at 15 MPa'],
      ['Accuracy', 'Within ±2 % or ±2 µL/min, whichever is greater'],
      ['Precision', '0.06 % RSD or 0.02 min SD, whichever is greater'],
      ['Degassing', 'On-line degassing unit, standard'],
    ],
  },
  {
    group: 'IC-150 · Column oven',
    rows: [
      ['Method', 'Forced air circulation with eluent pre-heater (standard)'],
      ['Temperature', 'Up to 85 °C'],
      ['Accuracy / precision', '±0.8 °C / ±0.1 °C (25–55 °C)'],
      ['Columns', 'One 5 cm guard column plus one 25 cm column'],
    ],
  },
  {
    group: 'IC-150 · Conductivity detector',
    rows: [
      ['Range', '20 mS/cm, automatic gain switching'],
      ['Cell temperature', 'Oven temperature + 3 °C (max. 60 °C), cell inside the oven'],
      ['Cell volume', 'Detection 0.25 µL · total ~45 µL'],
      ['Max. pressure', '10 MPa'],
    ],
  },
  {
    group: 'SI-150 · Autosampler',
    rows: [
      ['Injection', 'Full-volume (direct) or loop; dual systems use loop'],
      ['Volume', '0.1–200 µL standard, up to 7.5 mL with extension loop'],
      ['Area reproducibility', '< 0.5 % RSD (10–1000 µL)'],
      ['Capacity', '162 × 1.5 mL · 84 × 4 mL · 36 × 10 mL vials'],
      ['Functions', 'Automatic dilution and sample pretreatment'],
    ],
  },
  {
    group: 'Suppressors & options',
    rows: [
      ['Anion suppressor', 'ICDS-Ai, electrodialytic, continuous regeneration, no acid regenerant'],
      ['Cation suppressor', 'ICDS-Ci, compatible with up to 10 mmol/L MSA'],
      ['Eluent generation', 'Valve-switching dilution at 2×, 5× or 10×, up to 1.5 mL/min'],
      ['Dual channel', 'IC-150D adds a second flow path for simultaneous anions + cations'],
      ['UV detector', 'SPD-40/40V mounts on top for UV-absorbing ions such as nitrite'],
    ],
  },
  {
    group: 'Footprint',
    rows: [
      ['IC-150 / IC-150D', 'W 26 × H 49 × D 50 cm · 31 kg'],
      ['SI-150', 'W 26 × H 28 × D 50 cm · 13 kg'],
    ],
  },
];
