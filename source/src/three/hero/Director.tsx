import { useFrame } from '@react-three/fiber';
import { heroState } from '../../utils/scrollStore';
import { BANDS, SIM_TO_MIN, bandState, chromAt } from './flowPath';
import { heroFrame } from './heroFrame';
import { injectAmount, simClock } from './timeline';

const tmp = { c: 0, sigma: 0, inColumn: false };

/**
 * Reads raw scroll progress, applies critically-damped smoothing so the scene never snaps,
 * and publishes the derived state (band positions, chromatogram value) for this frame.
 */
export function Director() {
  useFrame((state, delta) => {
    const target = heroState.progress;
    const k = 1 - Math.exp(-delta * 6);
    heroFrame.p += (target - heroFrame.p) * k;
    if (Math.abs(target - heroFrame.p) < 1e-5) heroFrame.p = target;
    const p = heroFrame.p;
    heroFrame.sim = simClock(p);
    heroFrame.minutes = heroFrame.sim * SIM_TO_MIN;
    heroFrame.inject = injectAmount(p);
    heroFrame.signal = chromAt(heroFrame.minutes);
    heroFrame.time = state.clock.elapsedTime;
    BANDS.forEach((b, i) => {
      bandState(b, heroFrame.sim, tmp);
      heroFrame.c[i] = tmp.c;
      heroFrame.sigma[i] = tmp.sigma;
      heroFrame.inColumn[i] = tmp.inColumn ? 1 : 0;
      // peak concentration falls as the band spreads (area conserved); clamp for display
      heroFrame.amp[i] = Math.min(1.2, (0.22 / tmp.sigma) * (0.45 + Math.min(1, b.h / 5)));
    });
  }, -10);
  return null;
}
