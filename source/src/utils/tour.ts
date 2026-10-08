import { getLenis } from '../hooks/useSmoothScroll';

/**
 * Self-running demo tour: scrolls the whole page at a steady pace, pausing briefly at the top of
 * each section so the scroll-driven scenes have time to play. Any wheel, touch or key input
 * (or the Stop button) hands control straight back to the visitor.
 */
export interface TourState {
  running: boolean;
  progress: number;
  label: string;
}

type Listener = (s: TourState) => void;
let state: TourState = { running: false, progress: 0, label: '' };
const listeners = new Set<Listener>();

export function subscribeTour(l: Listener) {
  listeners.add(l);
  l(state);
  return () => {
    listeners.delete(l);
  };
}

function emit(p: Partial<TourState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l(state));
}

let raf = 0;
let timer = 0;
let detach: (() => void) | null = null;

const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;

function labelFor(el: HTMLElement) {
  if (el.id === 'top') return 'Introduction · the flow path';
  const idx = el.querySelector('.section-index span:last-child')?.textContent;
  if (idx) return idx.trim();
  if (el.tagName === 'FOOTER') return 'Footer';
  const h = el.querySelector('h1, h2')?.textContent?.trim();
  return h ? (h.length > 42 ? `${h.slice(0, 40)}…` : h) : 'Overview';
}

function setY(y: number) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}

function attachInterrupts() {
  const isControl = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-tour-control]');
  const stopIf = (e: Event) => {
    if (!isControl(e.target)) stopTour();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
      if (e.key === ' ' && isControl(e.target)) return;
      stopTour();
    }
  };
  window.addEventListener('wheel', stopIf, { passive: true });
  window.addEventListener('touchstart', stopIf, { passive: true });
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('wheel', stopIf);
    window.removeEventListener('touchstart', stopIf);
    window.removeEventListener('keydown', onKey);
  };
}

export function startTour() {
  if (state.running) return;
  const sections = [...document.querySelectorAll<HTMLElement>('main > section, footer')];
  if (!sections.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let y = window.scrollY;
  if (y >= maxScroll() - 8) {
    y = 0;
    setY(0);
  }
  let next = sections.findIndex((s) => topOf(s) > y + 4);
  if (next < 0) next = sections.length;
  const current = sections[Math.max(0, next - 1)];
  emit({ running: true, label: labelFor(current), progress: y / (maxScroll() || 1) });
  window.setTimeout(() => {
    if (state.running) detach = attachInterrupts();
  }, 0);

  if (reduced) {
    // no continuous motion: hop section to section
    const hop = () => {
      if (next >= sections.length) return stopTour();
      const el = sections[next++];
      window.scrollTo(0, Math.min(maxScroll(), topOf(el)));
      emit({ label: labelFor(el), progress: window.scrollY / (maxScroll() || 1) });
      timer = window.setTimeout(hop, 4000);
    };
    timer = window.setTimeout(hop, 1500);
    return;
  }

  let last = performance.now();
  let pauseUntil = last + 900;
  const step = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const m = maxScroll();
    if (now >= pauseUntil) {
      const ramp = Math.min(1, (now - pauseUntil) / 900);
      const speed = Math.max(280, window.innerHeight * 0.45); // px per second
      y = Math.min(m, y + speed * ramp * dt);
      const el = sections[next];
      if (el) {
        const sy = topOf(el);
        if (y >= sy) {
          y = Math.min(m, sy);
          pauseUntil = now + 1600;
          next++;
          emit({ label: labelFor(el) });
        }
      }
      setY(y);
      if (Math.abs(y / (m || 1) - state.progress) > 0.002) emit({ progress: y / (m || 1) });
    }
    if (y >= m - 1) {
      emit({ progress: 1 });
      timer = window.setTimeout(stopTour, 1200);
      return;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

export function stopTour() {
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  detach?.();
  detach = null;
  if (state.running) emit({ running: false });
}

export function toggleTour() {
  if (state.running) stopTour();
  else startTour();
}
