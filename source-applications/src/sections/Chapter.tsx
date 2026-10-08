import { useRef, type ReactNode } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { useReveal } from '../hooks/useReveal';
import { useStageScene } from '../hooks/useStageScene';
import type { SceneId } from '../three/scenes';

export interface ChapterProps {
  id: string;
  scene: SceneId;
  num: string;
  label: string;
  title: ReactNode;
  lede: ReactNode;
  facts: [string, string][];
  children?: ReactNode;
  source: { label: string; url: string }[];
}

/** One application chapter: text column on the left, the ion stage re-forms on the right. */
export function Chapter({ id, scene, num, label, title, lede, facts, children, source }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  useStageScene(ref, scene);
  return (
    <section id={id} className="chapter" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container chapter__inner">
        <div className="chapter__col">
          <SectionIndex num={num} label={label} />
          <h2 id={`${id}-title`} className="h-lg chapter__title" data-reveal>
            {title}
          </h2>
          <div className="lede chapter__lede" data-reveal>
            {lede}
          </div>
          <dl className="chapter__facts" data-reveal>
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {children}
          <p className="chapter__src mono" data-reveal>
            {source.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ' · '}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  Source: {s.label} ↗
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
