import { BrandMark } from '../components/Icons';
import { BRAND, NAV } from '../data/content';
import { DISCLAIMER } from '../data/nexera';
import { scrollToTarget } from '../hooks/useSmoothScroll';
import '../styles/footer.css';

const COLUMNS = [
  { title: 'Hardware', items: ['IC-150 main unit', 'IC-150D dual channel', 'SI-150 autosampler', 'ICDS-Ai / ICDS-Ci suppressors'] },
  { title: 'Methods', items: ['EPA 300.1 Part A', 'EPA 300.1 Part B', 'ASTM D6919-17', 'Shim-pack IC columns'] },
  { title: 'Software', items: ['IC Solution', 'LabSolutions', 'Analytical Intelligence', 'Support app'] },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a
              href="#top"
              className="brand"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('#top');
              }}
            >
              <BrandMark />
              <span>{BRAND.name}</span>
            </a>
            <p className="body-s">An independent, interactive showcase of the Shimadzu Nexera IC ion chromatograph.</p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="footer__col">
              <p className="mono">{c.title}</p>
              <ul>
                {c.items.map((i) => (
                  <li key={i}>
                    <span className="footer__item">{i}</span>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer__word display" aria-hidden="true">
          {BRAND.name}
        </div>
        <div className="footer__bottom mono">
          <span>{DISCLAIMER}</span>
          <span>Data and specifications summarised from Shimadzu customer materials. Confirm current details with Shimadzu.</span>
          <span className="footer__links">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="link-u"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget(n.href);
                }}
              >
                {n.label}
              </a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
