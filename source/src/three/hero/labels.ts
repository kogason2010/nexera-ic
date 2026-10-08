import * as THREE from 'three';
import { LAYOUT } from './flowPath';

const L = LAYOUT;

export interface HeroLabel {
  id: string;
  text: string;
  sub?: string;
  at: THREE.Vector3;
  /** scroll windows [from, to] in which the label is shown */
  show: [number, number][];
  tone?: 'hw' | 'chem' | 'note';
  /** hidden on phones in the final overview to avoid clutter */
  minor?: boolean;
}

/** Annotations anchored to the 3D scene; the scene projects them every frame. */
export const HERO_LABELS: HeroLabel[] = [
  { id: 'eluent', text: 'Eluent', sub: '4.5 mmol/L Na₂CO₃', at: new THREE.Vector3(L.bottle.x, L.bottle.y + L.bottle.h + 0.75, 0), show: [[0.0, 0.1], [0.88, 1.01]] , minor: true },
  { id: 'pump', text: 'Pump', sub: 'tandem plunger', at: new THREE.Vector3(L.pump.x, L.pump.y + 0.95, 0), show: [[0.0, 0.12], [0.88, 1.01]] , minor: true },
  { id: 'valve', text: 'Injection valve', sub: 'LOAD → INJECT (simplified)', at: new THREE.Vector3(L.valve.x, L.valve.y + 0.85, 0), show: [[0.04, 0.2], [0.88, 1.01]] , minor: true },
  { id: 'loop', text: 'Sample plug', sub: 'mixed anions in the loop', at: new THREE.Vector3(L.loop.x + 0.95, L.loop.y - 0.2, 0), show: [[0.04, 0.17]] },
  { id: 'guard', text: 'Guard column', at: new THREE.Vector3((L.guard.x0 + L.guard.x1) / 2, 0.55, 0), show: [[0.17, 0.27], [0.88, 1.01]] , minor: true },
  { id: 'column', text: 'Anion-exchange column', sub: 'cut away · packed resin bed', at: new THREE.Vector3(-1.9, 0.82, 0), show: [[0.18, 0.43], [0.88, 1.01]] },
  { id: 'site', text: '+ fixed exchange site', sub: 'quaternary ammonium on the resin', at: new THREE.Vector3(-4.4, -0.72, 0), show: [[0.26, 0.4]], tone: 'chem' },
  { id: 'held', text: '◯ held at a site', sub: 'coloured ring = temporarily retained', at: new THREE.Vector3(-2.6, -0.72, 0), show: [[0.26, 0.4]], tone: 'chem' },
  { id: 'carb', text: '● grey = carbonate eluent', sub: 'competes for the same sites', at: new THREE.Vector3(-0.8, -0.72, 0), show: [[0.26, 0.4]], tone: 'chem' },
  { id: 'supp', text: 'Suppressor', sub: 'labelled schematic, not the ICDS-Ai internals', at: new THREE.Vector3(5.6, 1.3, 0), show: [[0.42, 0.6], [0.88, 1.01]] },
  { id: 'anode', text: 'Anode (+) · H₂O → H⁺ + O₂', at: new THREE.Vector3(7.25, 0.62, 0), show: [[0.44, 0.58]], tone: 'chem' },
  { id: 'hin', text: 'H⁺ enters through membrane', at: new THREE.Vector3(3.55, 0.25, 0), show: [[0.44, 0.58]], tone: 'chem' },
  { id: 'naout', text: 'Na⁺ leaves through membrane', at: new THREE.Vector3(3.55, -0.25, 0), show: [[0.44, 0.58]], tone: 'chem' },
  { id: 'carbacid', text: 'CO₃²⁻ + 2 H⁺ → H₂CO₃', sub: 'weakly conducting', at: new THREE.Vector3(7.55, 0.05, 0), show: [[0.44, 0.58]], tone: 'chem' },
  { id: 'cathode', text: 'Cathode (−) · Na⁺ to waste as NaOH', at: new THREE.Vector3(7.25, -0.62, 0), show: [[0.44, 0.58]], tone: 'chem' },
  { id: 'cell', text: 'Conductivity cell', sub: 'enclosed flow cell, in the column oven', at: new THREE.Vector3(L.cell.x1 + 1.35, -0.25, 0), show: [[0.56, 0.86], [0.88, 1.01]] },
  { id: 'inset', text: 'Magnified interior (not to scale)', sub: 'electrodes sense the solution’s conductivity', at: new THREE.Vector3(L.inset.x, L.inset.y + L.inset.h / 2 + 0.38, 0), show: [[0.58, 0.86]], tone: 'note' },
  { id: 'regen', text: 'Cell effluent → suppressor regenerant channels', at: new THREE.Vector3(10.55, 0.55, 0), show: [[0.6, 0.86]], tone: 'note' , minor: true },
  { id: 'waste', text: 'Waste', at: new THREE.Vector3(L.waste.x + 0.9, L.waste.y + 0.45, 0), show: [[0.6, 0.86], [0.88, 1.01]] , minor: true },
];
