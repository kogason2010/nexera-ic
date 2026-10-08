import { useRef, useState, type KeyboardEvent } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useReveal } from '../hooks/useReveal';
import '../styles/software.css';

const APPS = [
  {
    id: 'settings',
    name: 'System Setting',
    role: 'Administrators',
    text: 'Methods, start-up and shutdown conditions, auto-dilution rules and report templates are defined once and locked, so only the right people can change critical parameters.',
  },
  {
    id: 'analysis',
    name: 'Analysis',
    role: 'Daily operators',
    text: 'Start-up, batch creation, analysis and shutdown on one screen. Batches are handed to LabSolutions in the background, so operators never have to touch it.',
  },
  {
    id: 'postrun',
    name: 'Post-Run',
    role: 'Reviewers',
    text: 'Quantitation results across many data files, even many batches, in a single view. Flags mark anything outside concentration, recovery or suitability limits.',
  },
  {
    id: 'support',
    name: 'Support',
    role: 'Everyone',
    text: 'Instrument and consumable status at a glance, with maintenance, troubleshooting and performance checks gathered in one place.',
  },
];

function Bar({ v, warn = false }: { v: number; warn?: boolean }) {
  return (
    <span className="ui-bar">
      <span style={{ width: `${v}%` }} className={warn ? 'is-warn' : ''} />
    </span>
  );
}

function Mock({ id }: { id: string }) {
  if (id === 'settings')
    return (
      <div className="ui-body ui-body--split">
        <div className="ui-list">
          <p className="ui-h">Method sets</p>
          {['Anions · EPA 300.1 A', 'DBPs · EPA 300.1 B', 'Cations · ASTM D6919', 'Dual · anion + cation'].map((m, i) => (
            <div key={m} className={`ui-row ${i === 0 ? 'is-sel' : ''}`}>
              <span>{m}</span>
              <span className="ui-lock mono">locked</span>
            </div>
          ))}
        </div>
        <div className="ui-panel">
          <p className="ui-h">Auto-dilution</p>
          {[
            ['Above calibration range', 'Re-inject ×5'],
            ['Eluent concentrate', '×10'],
            ['Start-up', 'Purge → equilibrate'],
            ['Shutdown', 'Flow off · oven off'],
          ].map(([k, v]) => (
            <div key={k} className="ui-kv">
              <span>{k}</span>
              <span className="ui-chip">{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  if (id === 'analysis')
    return (
      <div className="ui-body">
        <div className="ui-status">
          <span className="ui-chip is-ok">● Ready</span>
          <span className="ui-chip">Oven 40.0 °C</span>
          <span className="ui-chip">Flow 0.85 mL/min</span>
          <span className="ui-chip">Suppressor on</span>
          <span className="ui-btn">▶ Start batch</span>
        </div>
        <div className="ui-table">
          {[
            ['1', 'Blank', 'Done'],
            ['2', 'STD 1–5', 'Done'],
            ['3', 'Tap water', 'Running'],
            ['4', 'Mineral water S', 'Queued'],
            ['5', 'Mineral water C', 'Queued'],
          ].map(([n, s, st]) => (
            <div key={n} className={`ui-row ${st === 'Running' ? 'is-sel' : ''}`}>
              <span className="ui-n">{n}</span>
              <span>{s}</span>
              <span className={`ui-st ui-st--${st.toLowerCase()}`}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    );
  if (id === 'postrun')
    return (
      <div className="ui-body">
        <div className="ui-grid">
          <span className="ui-gh">Sample</span>
          {['F⁻', 'Cl⁻', 'NO₃⁻', 'SO₄²⁻'].map((a) => (
            <span key={a} className="ui-gh">
              {a}
            </span>
          ))}
          {[
            ['Tap water', '0.074', '15.3', '0.038', '7.87', ''],
            ['Mineral S', '0.071', '3.42', '0.689', '4.16', ''],
            ['Mineral C', '0.253', '0.92', '0.126', '2.06', ''],
            ['Spike QC', '0.512', '10.1', '0.493', '13.1', 'flag'],
          ].map(([s, ...vals]) => (
            <div key={s} className="ui-grow">
              <span className="ui-gs">{s}</span>
              {vals.slice(0, 4).map((v, i) => (
                <span key={i} className={vals[4] === 'flag' && i === 3 ? 'ui-flag' : ''}>
                  {v}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="ui-foot">mg/L · flagged values exceed a user-defined limit</p>
      </div>
    );
  return (
    <div className="ui-body ui-body--cards">
      {[
        ['Suppressor', 72, false],
        ['Guard column', 41, false],
        ['Pump seals', 86, false],
        ['Eluent level', 18, true],
      ].map(([k, v, w]) => (
        <div key={k as string} className="ui-card">
          <p className="ui-h">{k as string}</p>
          <p className="ui-big">{v as number}%</p>
          <Bar v={v as number} warn={w as boolean} />
        </div>
      ))}
      <div className="ui-card ui-card--wide">
        <p className="ui-h">Next maintenance</p>
        <p>Replace guard column after ~600 more injections · Check eluent before next batch</p>
      </div>
    </div>
  );
}

export function Software() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useReveal(section);

  const onKey = (e: KeyboardEvent) => {
    let n = active;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (active + 1) % APPS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (active - 1 + APPS.length) % APPS.length;
    else return;
    e.preventDefault();
    setActive(n);
    tabs.current[n]?.focus();
  };
  const a = APPS[active];

  return (
    <section id="software" className="software section" ref={section} aria-labelledby="sw-title">
      <div className="container">
        <div className="software__head">
          <SectionIndex num="09" label="IC Solution software" />
          <SplitText as="h2" id="sw-title" className="h-lg" text="Four apps. One clear job each." />
          <p className="lede" data-reveal>
            IC Solution is the optional, Nexera IC-dedicated layer on top of LabSolutions. It splits the work by role, so each
            person sees only what they need.
          </p>
        </div>

        <div className="software__body">
          <div className="software__tabs" role="tablist" aria-label="IC Solution apps" onKeyDown={onKey}>
            {APPS.map((app, i) => (
              <button
                key={app.id}
                ref={(el) => (tabs.current[i] = el)}
                role="tab"
                id={`sw-tab-${app.id}`}
                aria-selected={i === active}
                aria-controls="sw-panel"
                tabIndex={i === active ? 0 : -1}
                className={`sw-tab ${i === active ? 'is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="mono">{app.role}</span>
                <span className="sw-tab__name">{app.name}</span>
              </button>
            ))}
          </div>

          <div className="software__panel" id="sw-panel" role="tabpanel" aria-labelledby={`sw-tab-${a.id}`}>
            <div className="ui-window" key={a.id}>
              <div className="ui-titlebar">
                <span className="ui-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mono">IC Solution · {a.name}</span>
              </div>
              <Mock id={a.id} />
            </div>
            <p className="software__text">{a.text}</p>
            <p className="software__note mono">Illustrative mock-up. Not actual software screens.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
