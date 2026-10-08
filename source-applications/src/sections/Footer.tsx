import { BrandMark } from '../components/Icons';
import { BRAND } from '../data/content';
import { DISCLAIMER } from '../data/nexera';
import { SOURCES } from '../data/apps';
import '../styles/footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="brand">
              <BrandMark />
              <span>{BRAND.name}</span>
            </span>
            <p className="body-s">An independent, interactive look at published Nexera IC applications.</p>
          </div>
          <nav aria-label="Sources" className="footer__col">
            <p className="mono">Sources</p>
            <ul>
              {[SOURCES.partA, SOURCES.partB, SOURCES.cations, SOURCES.spec].map((s) => (
                <li key={s.url}>
                  <a className="footer__item link-u" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="footer__bottom mono">
          <span>{DISCLAIMER}</span>
          <span>Molecular models are illustrative, built from textbook bond lengths; chromatograms are redrawn from the cited figures.</span>
        </div>
      </div>
    </footer>
  );
}
