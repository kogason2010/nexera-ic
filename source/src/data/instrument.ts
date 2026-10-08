/** Steps of the 3D system tour. Facts from the Nexera IC customer presentation and spec sheet. */
export const MODULES = [
  {
    id: 'sampler',
    name: 'SI-150 autosampler',
    text: 'Holds up to 162 × 1.5 mL vials across three plates and injects 0.1–200 µL with area reproducibility below 0.5 % RSD. It can also dilute and pretreat samples on board.',
  },
  {
    id: 'pump',
    name: 'Pump & degassing',
    text: 'A metal-free tandem micro-plunger pump (10 µL per stroke) with automatic compression compensation, fed through a built-in on-line degasser for a quiet, stable baseline.',
  },
  {
    id: 'oven',
    name: 'Column oven',
    text: 'Forced-air heating up to 85 °C, ±0.1 °C precision, with an eluent pre-heater upstream of the column. It takes a 5 cm guard and a 25 cm analytical column.',
  },
  {
    id: 'suppressor',
    name: 'Suppressor',
    text: 'Electrodialytic ICDS-Ai (anions) or ICDS-Ci (cations) suppressors regenerate continuously. In Shimadzu’s lifetime tests they ran beyond 5,000 and 6,000 injections.',
  },
  {
    id: 'detector',
    name: 'Conductivity detector',
    text: 'The cell sits inside the oven and is held 3 °C above it, a dual temperature control that keeps the baseline steady. Detection volume is 0.25 µL, with automatic gain switching to 20 mS/cm.',
  },
  {
    id: 'dual',
    name: 'IC-150D · dual channel',
    text: 'A second flow path beside the IC-150. One autosampler injects each vial into both, so anions and cations are measured at the same time and reported in one data file.',
  },
];
