/**
 * Steps of the 3D system tour. Facts from the Nexera IC customer presentation, the specification
 * page and the suppression-principle presentation. Interior layout follows Shimadzu product images
 * but is simplified; component positions are indicative, not a mechanical drawing.
 */
export const MODULES = [
  {
    id: 'sampler',
    name: 'SI-150 autosampler',
    text: 'Holds up to 162 × 1.5 mL vials on three plates and injects 0.1–200 µL. Single-channel systems use total-volume (direct) or loop injection; dual systems use loop injection. It can also dilute and pretreat samples on board.',
  },
  {
    id: 'pump',
    name: 'Pump & degassing',
    text: 'A metal-free tandem micro-plunger pump (10 µL per stroke) with automatic compression compensation, fed through a built-in on-line degasser. The control panel and suppressor housing sit above it.',
  },
  {
    id: 'oven',
    name: 'Column oven',
    text: 'A full-height, forced-air compartment with its own door: up to 85 °C, ±0.1 °C precision, with an eluent pre-heater upstream of the column. It takes a 5 cm guard and a 25 cm analytical column.',
  },
  {
    id: 'suppressor',
    name: 'Suppressor',
    text: 'The electrodialytic ICDS-Ai (anions, up to 15 mmol/L Na⁺) or ICDS-Ci (cations, up to 10 mmol/L MSA) sits in its own housing and regenerates continuously by water electrolysis.',
  },
  {
    id: 'detector',
    name: 'Conductivity detector',
    text: 'The flow cell sits inside the oven and is held 3 °C above it. Detection volume is 0.25 µL, with automatic gain switching up to 20 mS/cm.',
  },
  {
    id: 'dual',
    name: 'IC-150D · dual channel',
    text: 'A second complete channel with its own pump, column, suppressor and conductivity cell, for simultaneous anions and cations. Dual systems use SI-150 loop injection to supply both channels (internal routing not drawn); results share one LabSolutions data file.',
  },
];

/** Short names for the on-screen callouts. */
export const CALLOUT_TEXT: Record<string, string> = {
  vials: '1.5 mL vials · 3 plates',
  needle: 'Sampling needle',
  pumpheads: 'Pump heads + check valves',
  degasser: 'Valve block, filter, degasser (simplified)',
  column: 'Guard + analytical column',
  preheater: 'Eluent pre-heater',
  suppressor: 'Suppressor in its housing',
  panel: 'Indicator & control panel',
  cell: 'Conductivity cell (in the oven)',
  anionpath: 'Anion channel · IC-150',
  cationpath: 'Cation channel · IC-150D',
};
