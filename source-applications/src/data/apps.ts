/**
 * Application data for the Nexera IC Applications site. Every number comes from Shimadzu
 * customer-facing material: Application News 01-01104A-EN (EPA 300.1 Part A), 01-01153-EN
 * (EPA 300.1 Part B), 01-01134-EN (ASTM D6919-17 cations), the Nexera IC customer presentation and
 * the suppression-principle presentation. Part B retention times are read from its Fig. 3 and are
 * marked approximate.
 */
import { CATIONS, EPA_A, EPA_B, SUPPRESSION } from './nexera';

export const SOURCES = {
  partA: {
    label: 'Application News 01-01104A-EN · EPA 300.1 Part A',
    url: 'https://www.shimadzu.com/an/sites/shimadzu.com.an/files/pim/pim_document_file/applications/application_note/26181/an_01-01104-en.pdf',
  },
  partB: { label: 'Application News 01-01153-EN · EPA 300.1 Part B', url: 'https://www.shimadzu.com/an/apl/26349/index.html' },
  cations: { label: 'Application News 01-01134-EN · ASTM D6919-17 cations', url: 'https://www.shimadzu.com/an/apl/26500/index.html' },
  apps: {
    label: 'Nexera IC applications (Shimadzu)',
    url: 'https://www.shimadzu.com/an/products/liquid-chromatography/ion-chromatograph/nexera-ic/applications.html',
  },
  spec: {
    label: 'Nexera IC specifications (Shimadzu)',
    url: 'https://www.shimadzu.com/an/products/liquid-chromatography/ion-chromatograph/nexera-ic/spec.html',
  },
  showcase: { label: 'Nexera IC unofficial showcase', url: 'https://kogason2010.github.io/nexera-ic/' },
};

export const ANION_A_COLORS = ['#63d3ff', '#7cb8ff', '#999dff', '#b78dff', '#dc8fe0', '#ff9c8c', '#ffbf6a'];
export const DBP_COLORS = ['#7ef0d0', '#ffd27a', '#b78dff', '#ff9cc0'];
export const CATION_COLORS = ['#d9b8ff', '#a98cff', '#7cb8ff', '#8a7dff', '#6ee7c8', '#7cc8ff'];

/** Part B, read from Fig. 3 of 01-01153-EN (STD 3, 200 µL): approximate apex positions and heights. */
export const PART_B_PEAKS = [
  { id: 'ClO2', formula: 'ClO₂⁻', label: 'Chlorite', tR: 6.2, h: 0.06, mdl: 0.3 },
  { id: 'BrO3', formula: 'BrO₃⁻', label: 'Bromate', tR: 6.7, h: 0.05, mdl: 0.6 },
  { id: 'Br', formula: 'Br⁻', label: 'Bromide', tR: 13.1, h: 0.06, mdl: 0.3 },
  { id: 'ClO3', formula: 'ClO₃⁻', label: 'Chlorate', tR: 13.8, h: 0.11, mdl: 0.5 },
];
export const PART_B_SURROGATE = { id: 'DCA', formula: 'DCA', label: 'Dichloroacetate (surrogate)', tR: 14.4, h: 0.98 };

export type IonKind = 'anion' | 'cation';

export interface IonRecord {
  id: string;
  formula: string;
  name: string;
  kind: IonKind;
  charge: string;
  shape: string;
  color: string;
  methods: { method: string; tR: string; mdl?: string }[];
  note: string;
}

const a = (id: string) => EPA_A.peaks.find((p) => p.id === id)!;
const c = (id: string) => CATIONS.peaks.find((p) => p.id === id)!;
const b = (id: string) => PART_B_PEAKS.find((p) => p.id === id)!;

export const IONS: IonRecord[] = [
  {
    id: 'F', formula: 'F⁻', name: 'Fluoride', kind: 'anion', charge: '−1', shape: 'Monatomic; small and strongly hydrated', color: ANION_A_COLORS[0],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('F').tR} min`, mdl: `${a('F').mdl} mg/L` }],
    note: 'Small, hard and heavily hydrated, fluoride is held least by the anion-exchange resin and elutes first.',
  },
  {
    id: 'Cl', formula: 'Cl⁻', name: 'Chloride', kind: 'anion', charge: '−1', shape: 'Monatomic; Cl···O to water ≈ 3.2 Å', color: ANION_A_COLORS[1],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('Cl').tR} min`, mdl: `${a('Cl').mdl} mg/L` }],
    note: 'Usually the largest peak in drinking water; in the application note it runs off-scale at 10 mg/L.',
  },
  {
    id: 'NO2', formula: 'NO₂⁻', name: 'Nitrite', kind: 'anion', charge: '−1', shape: 'Bent; N–O 1.24 Å, 115°', color: ANION_A_COLORS[2],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('NO2').tR} min`, mdl: `${a('NO2').mdl} mg/L (as N)` }],
    note: 'Reported as nitrite-N. It also absorbs UV, which is why an optional UV detector can be added.',
  },
  {
    id: 'Br', formula: 'Br⁻', name: 'Bromide', kind: 'anion', charge: '−1', shape: 'Monatomic; large and polarisable', color: ANION_A_COLORS[3],
    methods: [
      { method: 'EPA 300.1 Part A', tR: `${a('Br').tR} min`, mdl: `${a('Br').mdl} mg/L` },
      { method: 'EPA 300.1 Part B', tR: `≈ ${b('Br').tR} min`, mdl: `${b('Br').mdl} µg/L` },
    ],
    note: 'Measured in both parts of EPA 300.1: as a common anion, and as the precursor of bromate during disinfection.',
  },
  {
    id: 'NO3', formula: 'NO₃⁻', name: 'Nitrate', kind: 'anion', charge: '−1', shape: 'Trigonal planar; N–O 1.25 Å', color: ANION_A_COLORS[4],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('NO3').tR} min`, mdl: `${a('NO3').mdl} mg/L (as N)` }],
    note: 'Flat and polarisable, nitrate is held longer than chloride despite carrying the same single charge.',
  },
  {
    id: 'PO4', formula: 'PO₄³⁻', name: 'Phosphate', kind: 'anion', charge: '−3 (fully deprotonated)', shape: 'Tetrahedral; P–O 1.54 Å', color: ANION_A_COLORS[5],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('PO4').tR} min`, mdl: `${a('PO4').mdl} mg/L (as P)` }],
    note: 'Reported as phosphate-P. Its retention is especially sensitive to eluent strength.',
  },
  {
    id: 'SO4', formula: 'SO₄²⁻', name: 'Sulfate', kind: 'anion', charge: '−2', shape: 'Tetrahedral; S–O 1.49 Å', color: ANION_A_COLORS[6],
    methods: [{ method: 'EPA 300.1 Part A', tR: `${a('SO4').tR} min`, mdl: `${a('SO4').mdl} mg/L` }],
    note: 'Divalent, so it is held more strongly than the monovalent anions and elutes last in Part A.',
  },
  {
    id: 'ClO2', formula: 'ClO₂⁻', name: 'Chlorite', kind: 'anion', charge: '−1', shape: 'Bent; Cl–O 1.56 Å, 111°', color: DBP_COLORS[0],
    methods: [{ method: 'EPA 300.1 Part B', tR: `≈ ${b('ClO2').tR} min`, mdl: `${b('ClO2').mdl} µg/L` }],
    note: 'A disinfection by-product. The application note compares its MDL with the 1.0 mg/L maximum contaminant level.',
  },
  {
    id: 'BrO3', formula: 'BrO₃⁻', name: 'Bromate', kind: 'anion', charge: '−1', shape: 'Trigonal pyramidal; Br–O 1.65 Å, 104°', color: DBP_COLORS[1],
    methods: [{ method: 'EPA 300.1 Part B', tR: `≈ ${b('BrO3').tR} min`, mdl: `${b('BrO3').mdl} µg/L` }],
    note: 'Formed from bromide during disinfection. Its MCL is 0.010 mg/L, so the 0.6 µg/L MDL leaves wide margin.',
  },
  {
    id: 'ClO3', formula: 'ClO₃⁻', name: 'Chlorate', kind: 'anion', charge: '−1', shape: 'Trigonal pyramidal; Cl–O 1.49 Å, 107°', color: DBP_COLORS[3],
    methods: [{ method: 'EPA 300.1 Part B', tR: `≈ ${b('ClO3').tR} min`, mdl: `${b('ClO3').mdl} µg/L` }],
    note: 'The fourth Part B by-product, eluting just after bromide and before the DCA surrogate.',
  },
  {
    id: 'Li', formula: 'Li⁺', name: 'Lithium', kind: 'cation', charge: '+1', shape: 'Monatomic; ~4 waters at 1.96 Å', color: CATION_COLORS[0],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('Li').tR} min`, mdl: `${c('Li').mdl} µg/L` }],
    note: 'The first cation to elute on the Shim-pack IC-C4 with methanesulfonic acid eluent.',
  },
  {
    id: 'Na', formula: 'Na⁺', name: 'Sodium', kind: 'cation', charge: '+1', shape: 'Monatomic; ~6 waters at 2.43 Å', color: CATION_COLORS[1],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('Na').tR} min`, mdl: `${c('Na').mdl} µg/L` }],
    note: `In Shimadzu's suppression example, 50 ppb sodium rises from S/N ${SUPPRESSION.cationSN.before} to ${SUPPRESSION.cationSN.after.toLocaleString('en-US')}.`,
  },
  {
    id: 'NH4', formula: 'NH₄⁺', name: 'Ammonium', kind: 'cation', charge: '+1', shape: 'Tetrahedral; N–H 1.03 Å', color: CATION_COLORS[2],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('NH4').tR} min`, mdl: `${c('NH4').mdl} µg/L` }],
    note: 'A key wastewater indicator, eluting between sodium and potassium.',
  },
  {
    id: 'K', formula: 'K⁺', name: 'Potassium', kind: 'cation', charge: '+1', shape: 'Monatomic; looser shell, K–O ≈ 2.8 Å', color: CATION_COLORS[3],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('K').tR} min`, mdl: `${c('K').mdl} µg/L` }],
    note: 'The last of the monovalent cations, still under five minutes.',
  },
  {
    id: 'Mg', formula: 'Mg²⁺', name: 'Magnesium', kind: 'cation', charge: '+2', shape: 'Octahedral [Mg(H₂O)₆]²⁺; Mg–O 2.07 Å', color: CATION_COLORS[4],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('Mg').tR} min`, mdl: `${c('Mg').mdl} µg/L` }],
    note: 'Divalent cations are held far more strongly; magnesium arrives at 12 minutes.',
  },
  {
    id: 'Ca', formula: 'Ca²⁺', name: 'Calcium', kind: 'cation', charge: '+2', shape: 'Monatomic; 6–8 waters at ≈ 2.4 Å', color: CATION_COLORS[5],
    methods: [{ method: 'ASTM D6919-17', tR: `${c('Ca').tR} min`, mdl: `${c('Ca').mdl} µg/L` }],
    note: 'The last cation in the method, at 16 minutes; the run finishes within 20 minutes.',
  },
];

export const METHODS = [
  {
    id: 'partA',
    name: 'EPA 300.1 Part A',
    matrix: 'Drinking water · common anions',
    column: 'Shim-pack IC-SA3 + IC-SA3 (G)',
    eluent: '4.5 mmol/L Na₂CO₃',
    flow: '0.85 mL/min',
    temp: '40 °C',
    injection: '50 µL',
    analytes: 'F⁻, Cl⁻, NO₂⁻, Br⁻, NO₃⁻, PO₄³⁻, SO₄²⁻',
    run: 'under 20 min',
    mdl: '0.0004–0.003 mg/L',
    qc: `r² ≥ 0.9995 · CCV ${EPA_A.recovery} over ~${EPA_A.hours} h`,
    source: SOURCES.partA,
  },
  {
    id: 'partB',
    name: 'EPA 300.1 Part B',
    matrix: 'Drinking water · disinfection by-products',
    column: 'Shim-pack IC-SA3 + IC-SA3 (G)',
    eluent: '4.5 mmol/L Na₂CO₃',
    flow: '0.85 mL/min',
    temp: '40 °C',
    injection: '200 µL',
    analytes: 'ClO₂⁻, BrO₃⁻, Br⁻, ClO₃⁻',
    run: EPA_B.runTime,
    mdl: EPA_B.mdlRange,
    qc: `r² ≥ 0.9996 · spike recovery ${EPA_B.recovery}`,
    source: SOURCES.partB,
  },
  {
    id: 'cations',
    name: 'ASTM D6919-17',
    matrix: 'Wastewater · cations',
    column: 'Shim-pack IC-C4 + IC-GC4',
    eluent: '2.5 mmol/L methanesulfonic acid',
    flow: '1.0 mL/min',
    temp: '40 °C',
    injection: '10 µL',
    analytes: 'Li⁺, Na⁺, NH₄⁺, K⁺, Mg²⁺, Ca²⁺',
    run: CATIONS.runTime,
    mdl: '0.2–1.6 µg/L',
    qc: `area RSD ≤ 0.18 % (n = 7) · recovery ${CATIONS.recovery}`,
    source: SOURCES.cations,
  },
];
