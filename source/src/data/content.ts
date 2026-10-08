export const BRAND = {
  name: 'Nexera IC',
  tagline: 'Unofficial showcase',
};

export const NAV = [
  { label: 'Suppression', href: '#science' },
  { label: 'System', href: '#technology' },
  { label: 'Data', href: '#data' },
  { label: 'Specs', href: '#specs' },
];

export const HERO_COLOR_NOTE = 'Seven anions from EPA Method 300.1 Part A';

export const HERO_COPY = {
  eyebrow: 'Ion chromatography · Nexera IC',
  headline: ['Every ion,', 'accounted for.'],
  lede: 'An interactive look at the Nexera IC, a compact ion chromatograph that separates, suppresses and measures anions and cations, then does most of the routine work for you.',
};

/** Captions shown while the hero scene plays; indices align with PHASES in three/hero/timeline. */
export const HERO_PHASES = [
  {
    num: '01',
    title: 'Sample',
    text: 'A drop of drinking water carries fluoride, chloride, nitrite, bromide, nitrate, phosphate and sulfate, all dissolved together.',
  },
  {
    num: '02',
    title: 'Separation',
    text: 'Each anion competes with the carbonate eluent for the fixed charged sites of the anion-exchange column. Stronger competitors are held longer.',
  },
  {
    num: '03',
    title: 'Suppression',
    text: 'The eluent itself conducts electricity. The electrodialytic suppressor swaps its sodium for hydrogen ions, leaving weakly conducting carbonic acid, so the background falls and the analyte signal rises.',
  },
  {
    num: '04',
    title: 'Detection',
    text: 'In a temperature-controlled conductivity cell inside the column oven, every passing band raises the conductance. Peak after peak, the chromatogram is written.',
  },
  {
    num: '05',
    title: 'Result',
    text: 'Seven inorganic anions resolved in under 20 minutes, the EPA Method 300.1 Part A separation, redrawn from Shimadzu’s application data.',
  },
];
