import { useEffect, useState } from 'react';
import { scrollToY } from '../hooks/useSmoothScroll';
import { stopTour, subscribeTour, toggleTour, type TourState } from '../utils/tour';

/** Always-visible floating controls: demo tour, jump to top, jump to bottom. */
export function ScrollControls() {
  const [tour, setTour] = useState<TourState>({ running: false, progress: 0, label: '' });
  const [edge, setEdge] = useState<'top' | 'bottom' | null>('top');
  const [hint, setHint] = useState(false);

  useEffect(() => subscribeTour(setTour), []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setEdge(y < 40 ? 'top' : y > max - 40 ? 'bottom' : null);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    // a short-lived nudge so first-time visitors notice the tour
    const show = window.setTimeout(() => setHint(true), 3500);
    const hide = window.setTimeout(() => setHint(false), 11500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  const jump = (where: 'top' | 'bottom') => {
    stopTour();
    setHint(false);
    scrollToY(where === 'top' ? 0 : document.documentElement.scrollHeight);
  };

  const C = 2 * Math.PI * 19;
  return (
    <div className={`scroll-ctl ${tour.running ? 'is-touring' : ''}`} data-tour-control role="group" aria-label="Page controls">
      {tour.running ? (
        <p className="scroll-ctl__now mono" aria-live="polite">
          <span className="scroll-ctl__dot" aria-hidden="true" />
          {tour.label}
        </p>
      ) : (
        hint && (
          <p className="scroll-ctl__hint mono" role="status">
            New here? Let the site play itself.
          </p>
        )
      )}
      <button
        type="button"
        className="scroll-ctl__demo"
        aria-pressed={tour.running}
        onClick={() => {
          setHint(false);
          toggleTour();
        }}
      >
        <span className="scroll-ctl__ring" aria-hidden="true">
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" className="track" />
            <circle
              cx="22"
              cy="22"
              r="19"
              className="fill"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - (tour.running ? tour.progress : 0))}
            />
          </svg>
          {tour.running ? (
            <svg viewBox="0 0 16 16" className="icon">
              <rect x="4" y="4" width="8" height="8" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="icon">
              <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.4-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" />
            </svg>
          )}
        </span>
        <span className="scroll-ctl__text">
          <span className="scroll-ctl__title">{tour.running ? 'Stop tour' : 'Demo tour'}</span>
          <span className="scroll-ctl__sub mono">{tour.running ? 'scroll or Esc to stop' : 'auto-scrolls the site'}</span>
        </span>
      </button>
      <div className="scroll-ctl__pair">
        <button type="button" className={`scroll-ctl__jump ${edge === 'top' ? 'is-dim' : ''}`} onClick={() => jump('top')} aria-label="Jump to top">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 3 3 8.5h3.2V13h3.6V8.5H13Z" />
          </svg>
          <span>Top</span>
        </button>
        <button
          type="button"
          className={`scroll-ctl__jump ${edge === 'bottom' ? 'is-dim' : ''}`}
          onClick={() => jump('bottom')}
          aria-label="Jump to bottom"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 13 3 7.5h3.2V3h3.6v4.5H13Z" />
          </svg>
          <span>Bottom</span>
        </button>
      </div>
    </div>
  );
}
