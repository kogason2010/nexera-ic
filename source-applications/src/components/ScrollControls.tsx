import { useEffect, useState } from 'react';
import { scrollToY } from '../hooks/useSmoothScroll';
import { stopTour, subscribeTour, toggleTour, type TourState } from '../utils/tour';

const C = 2 * Math.PI * 17;

/**
 * Compact page controls: guided auto-scroll tour (play / pause / stop), jump to top, jump to end.
 * Sits in the right-hand gutter so it never covers captions, module selectors or hardware.
 */
export function ScrollControls() {
  const [tour, setTour] = useState<TourState>({ running: false, paused: false, progress: 0, label: '' });
  const [edge, setEdge] = useState<'top' | 'bottom' | null>('top');

  useEffect(() => subscribeTour(setTour), []);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setEdge(y < 40 ? 'top' : y > max - 40 ? 'bottom' : null);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (where: 'top' | 'bottom') => {
    stopTour();
    scrollToY(where === 'top' ? 0 : document.documentElement.scrollHeight);
  };
  const playing = tour.running && !tour.paused;
  const tourLabel = !tour.running ? 'Start guided tour (auto-scrolls this page)' : tour.paused ? 'Resume guided tour' : 'Pause guided tour';

  return (
    <div className={`scroll-ctl ${tour.running ? 'is-touring' : ''}`} data-tour-control role="group" aria-label="Page navigation">
      {tour.running && (
        <p className="scroll-ctl__now mono" aria-live="polite">
          <span className={`scroll-ctl__dot ${tour.paused ? 'is-paused' : ''}`} aria-hidden="true" />
          {tour.paused ? 'Paused · ' : 'Tour · '}
          {tour.label}
        </p>
      )}
      <div className="scroll-ctl__stack">
        <button type="button" className="scroll-ctl__btn scroll-ctl__tour" onClick={toggleTour} aria-label={tourLabel} aria-pressed={playing} title={tourLabel}>
          <span className="scroll-ctl__icon">
            <svg viewBox="0 0 40 40" className="scroll-ctl__ring" aria-hidden="true">
              <circle cx="20" cy="20" r="17" className="track" />
              <circle cx="20" cy="20" r="17" className="fill" strokeDasharray={C} strokeDashoffset={C * (1 - (tour.running ? tour.progress : 0))} />
            </svg>
            <svg viewBox="0 0 16 16" className="glyph" aria-hidden="true">
              {playing ? (
                <>
                  <rect x="4" y="3.5" width="2.8" height="9" rx="0.8" />
                  <rect x="9.2" y="3.5" width="2.8" height="9" rx="0.8" />
                </>
              ) : (
                <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.4-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" />
              )}
            </svg>
          </span>
          <span className="scroll-ctl__txt">{!tour.running ? 'Tour' : tour.paused ? 'Resume' : 'Pause'}</span>
        </button>
        {tour.running && (
          <button type="button" className="scroll-ctl__btn" onClick={stopTour} aria-label="Stop guided tour" title="Stop guided tour (Esc)">
            <span className="scroll-ctl__icon">
              <svg viewBox="0 0 16 16" className="glyph" aria-hidden="true">
                <rect x="4" y="4" width="8" height="8" rx="1.5" />
              </svg>
            </span>
            <span className="scroll-ctl__txt">Stop</span>
          </button>
        )}
        <button type="button" className={`scroll-ctl__btn ${edge === 'top' ? 'is-dim' : ''}`} onClick={() => jump('top')} aria-label="Jump to top" title="Jump to top">
          <span className="scroll-ctl__icon">
            <svg viewBox="0 0 16 16" className="glyph" aria-hidden="true">
              <path d="M8 3 3 8.5h3.2V13h3.6V8.5H13Z" />
            </svg>
          </span>
          <span className="scroll-ctl__txt">Top</span>
        </button>
        <button type="button" className={`scroll-ctl__btn ${edge === 'bottom' ? 'is-dim' : ''}`} onClick={() => jump('bottom')} aria-label="Jump to end of page" title="Jump to end of page">
          <span className="scroll-ctl__icon">
            <svg viewBox="0 0 16 16" className="glyph" aria-hidden="true">
              <path d="M8 13 3 7.5h3.2V3h3.6v4.5H13Z" />
            </svg>
          </span>
          <span className="scroll-ctl__txt">End</span>
        </button>
      </div>
    </div>
  );
}
