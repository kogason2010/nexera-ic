import { getLenis } from '../hooks/useSmoothScroll';

/**
 * Guided auto-scroll tour of this page (not a product demonstration). It scrolls at a steady pace and
 * pauses briefly at each section so the scroll-driven scenes can play. The visitor stays in control:
 * any wheel, touch or scroll key pauses it; Space or P pauses/resumes; Escape stops it.
 */
export interface TourState {
  running: boolean;
  paused: boolean;
  progress: number;
  label: string;
}

type Listener = (s: TourState) => void;
let state: TourState = { running: false, paused: false, progress: 0, label: '' };
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
let sections: HTMLElement[] = [];
let next = 0;
let y = 0;

const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function labelFor(el: HTMLElement) {
  if (el.id === 'top') return 'Introduction';
  const idx = el.querySelector('.section-index span:last-child')?.textContent;
  if (idx) return idx.trim();
  if (el.tagName === 'FOOTER') return 'Footer';
  const h = el.querySelector('h1, h2')?.textContent?.trim();
  return h ? (h.length > 42 ? `${h.slice(0, 40)}…` : h) : 'Overview';
}

function setY(v: number) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(v, { immediate: true, force: true });
  else window.scrollTo(0, v);
}

function attachInputs() {
  const isControl = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-tour-control]');
  const userScroll = (e: Event) => {
    if (!isControl(e.target) && state.running && !state.paused) pauseTour();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!state.running) return;
    if (e.key === 'Escape') return stopTour();
    if ((e.key === ' ' || e.key === 'p' || e.key === 'P') && !isControl(e.target)) {
      e.preventDefault();
      return state.paused ? resumeTour() : pauseTour();
    }
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key) && !state.paused) pauseTour();
  };
  window.addEventListener('wheel', userScroll, { passive: true });
  window.addEventListener('touchstart', userScroll, { passive: true });
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('wheel', userScroll);
    window.removeEventListener('touchstart', userScroll);
    window.removeEventListener('keydown', onKey);
  };
}

function syncFromScroll() {
  y = window.scrollY;
  next = sections.findIndex((s) => topOf(s) > y + 4);
  if (next < 0) next = sections.length;
  emit({ label: labelFor(sections[Math.max(0, next - 1)]), progress: y / (maxScroll() || 1) });
}

function run() {
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  if (reduced()) {
    // no continuous motion: hop section to section
    const hop = () => {
      if (next >= sections.length) return stopTour();
      const el = sections[next++];
      window.scrollTo(0, Math.min(maxScroll(), topOf(el)));
      emit({ label: labelFor(el), progress: window.scrollY / (maxScroll() || 1) });
      timer = window.setTimeout(hop, 5000);
    };
    timer = window.setTimeout(hop, 1200);
    return;
  }
  let last = performance.now();
  let pauseUntil = last + 700;
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

export function startTour() {
  if (state.running) return state.paused ? resumeTour() : undefined;
  sections = [...document.querySelectorAll<HTMLElement>('main > section, footer')];
  if (!sections.length) return;
  if (window.scrollY >= maxScroll() - 8) setY(0);
  emit({ running: true, paused: false });
  syncFromScroll();
  window.setTimeout(() => {
    if (state.running && !detach) detach = attachInputs();
  }, 0);
  run();
}

export function pauseTour() {
  if (!state.running || state.paused) return;
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  emit({ paused: true });
}

export function resumeTour() {
  if (!state.running || !state.paused) return;
  emit({ paused: false });
  syncFromScroll();
  run();
}

export function stopTour() {
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  detach?.();
  detach = null;
  if (state.running) emit({ running: false, paused: false });
}

export function toggleTour() {
  if (!state.running) startTour();
  else if (state.paused) resumeTour();
  else pauseTour();
}
