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
    title: 'Inject',
    text: 'The pump drives sodium carbonate eluent through the flow path. The injection valve switches and the sample plug, seven anions dissolved together in drinking water, joins the liquid stream.',
  },
  {
    num: '02',
    title: 'Ion exchange',
    text: 'Inside the column, sample anions are briefly held by fixed positive sites on the resin, competing with carbonate for those sites. Ions held more strongly spend longer at sites, so overlapping bands pull apart while the resin stays still and the liquid keeps moving.',
  },
  {
    num: '03',
    title: 'Suppression',
    text: 'The eluent itself conducts. In the membrane suppressor, Na⁺ leaves the analytical stream and H⁺ from water electrolysis enters it. Carbonate becomes weakly conducting carbonic acid, so the background falls while the sample anions flow on.',
  },
  {
    num: '04',
    title: 'Detection',
    text: 'Each band then flows through a small conductivity cell kept in the column oven. Electrodes sense the conductivity of the passing solution, and the chromatogram is written peak by peak.',
  },
  {
    num: '05',
    title: 'Result',
    text: 'Seven inorganic anions in under 20 minutes (EPA 300.1 Part A), redrawn from Shimadzu’s application data. The cell effluent returns through the suppressor’s regenerant channels to waste, as in the application note flow chart.',
  },
];
