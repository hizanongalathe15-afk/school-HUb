import type { LandingContent } from '../../types';
import CounterCard from '../ui/CounterCard';
import { accentClass } from './SchoolLandingPage';

interface FeatureShowcaseProps {
  content: LandingContent;
  compact?: boolean;
}

export default function FeatureShowcase({ content, compact = false }: FeatureShowcaseProps) {
  return (
    <>
      {!compact && (
        <section id="about" className="intro-band fs-about-band">
          <div className="section-copy fs-copy">
            <div className="fs-eyebrow-row">
              <span className="fs-rule" />
              <p className="eyebrow">{content.sections.about.eyebrow}</p>
              <span className="fs-rule" />
            </div>
            <h2 className="fs-heading">{content.school.summary}</h2>
          </div>
          <div className="stats-grid fs-stats-grid">
            {content.stats.map((stat) => (
              <CounterCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </section>
      )}

      <section id="academics" className={`values-section fs-values ${compact ? 'section-compact' : ''}`}>
        <div className="section-heading fs-section-heading">
          <div className="fs-eyebrow-row">
            <span className="fs-rule" />
            <p className="eyebrow">{content.sections.values.eyebrow}</p>
            <span className="fs-rule" />
          </div>
          <h2 className="fs-heading">{content.sections.values.heading}</h2>
        </div>
        <div className="value-grid fs-value-grid">
          {content.values.map((value, i) => (
            <article
              key={value.title}
              className={`value-card fs-value-card ${accentClass[value.accent]}`}
              style={{ '--card-i': i } as React.CSSProperties}
            >
              <div className="fs-card-media">
                <img src={value.image} alt={value.title} />
                <div className="fs-card-media-overlay" />
                <div className="fs-card-accent-chip">{value.accent}</div>
              </div>
              <div className="fs-card-body">
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
              <div className="fs-card-hover-line" />
            </article>
          ))}
        </div>
      </section>

      <section className={`program-section fs-programs ${compact ? 'section-compact' : ''}`}>
        <div className="section-heading fs-section-heading">
          <div className="fs-eyebrow-row">
            <span className="fs-rule" />
            <p className="eyebrow">{content.sections.programs.eyebrow}</p>
            <span className="fs-rule" />
          </div>
          <h2 className="fs-heading">{content.sections.programs.heading}</h2>
        </div>
        <div className="program-grid fs-program-grid">
          {content.programs.map((program, i) => (
            <article key={program.name} className="fs-program-card" style={{ '--card-i': i } as React.CSSProperties}>
              <div className="fs-program-level">
                <span>{program.level}</span>
              </div>
              <h3 className="fs-program-name">{program.name}</h3>
              <p className="fs-program-desc">{program.description}</p>
              <div className="fs-program-footer">
                <span className="fs-program-link">Learn more →</span>
              </div>
              <div className="fs-program-glow" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <style>{`
        /* ── About Band ── */
        .fs-about-band {
          position: relative;
          padding: clamp(64px, 9vw, 110px) clamp(20px, 6vw, 80px);
          background: linear-gradient(
            to bottom,
            var(--public-bg) 0%,
            var(--public-bg) 50%,
            var(--public-bg) 100%
          );
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }
        .fs-copy { text-align: center; margin-bottom: 56px; }
        .fs-eyebrow-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .fs-rule {
          display: block;
          height: 1px;
          width: 48px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }
        .fs-heading {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: clamp(28px, 4.5vw, 52px);
          font-weight: 700;
          color: var(--public-text);
          line-height: 1.15;
          letter-spacing: -0.025em;
          margin: 0;
          max-width: 720px;
          margin-inline: auto;
        }
        .fs-section-heading {
          text-align: center;
          margin-bottom: clamp(36px, 5vw, 56px);
        }

        /* stats grid */
        .fs-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          max-width: 900px;
          margin: 0 auto;
        }

        /* ── Values ── */
        .fs-values {
          padding: clamp(56px, 8vw, 100px) clamp(20px, 6vw, 80px);
          background: var(--public-bg);
        }
        .fs-value-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .fs-value-card {
          position: relative;
          background: rgba(255,255,255,0.032);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease, box-shadow 0.4s ease;
          animation: fsCardIn 0.6s cubic-bezier(0.22,1,0.36,1) calc(var(--card-i, 0) * 0.1s) both;
        }
        @keyframes fsCardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fs-value-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
        }
        .fs-card-media {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .fs-card-media img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .fs-value-card:hover .fs-card-media img { transform: scale(1.08); }
        .fs-card-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(3,5,20,0.85) 100%);
        }
        .fs-card-accent-chip {
          position: absolute;
          bottom: 12px; left: 14px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 3px 10px;
          border-radius: 40px;
        }
        .fs-card-body {
          padding: 22px 22px 24px;
          flex: 1;
        }
        .fs-card-body h3 {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--public-text);
          margin: 0 0 10px;
        }
        .fs-card-body p {
          font-size: 13.5px;
          color: color-mix(in srgb, var(--public-text) 45%, transparent);
          line-height: 1.65;
          margin: 0;
        }
        .fs-card-hover-line {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--public-gold), var(--public-gold));
          transform: scaleX(0);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .fs-value-card:hover .fs-card-hover-line { transform: scaleX(1); }

        /* ── Programs ── */
        .fs-programs {
          padding: clamp(56px, 8vw, 100px) clamp(20px, 6vw, 80px);
          background: linear-gradient(to bottom, var(--public-bg), var(--public-bg));
        }
        .fs-program-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .fs-program-card {
          position: relative;
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 30px 26px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          animation: fsCardIn 0.6s cubic-bezier(0.22,1,0.36,1) calc(var(--card-i, 0) * 0.08s) both;
        }
        .fs-program-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--public-gold) 30%, transparent);
          box-shadow: 0 20px 50px color-mix(in srgb, var(--public-gold) 12%, transparent);
        }
        .fs-program-glow {
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, color-mix(in srgb, var(--public-gold) 8%, transparent), transparent 50%);
          opacity: 0;
          transition: opacity 0.35s;
          pointer-events: none;
        }
        .fs-program-card:hover .fs-program-glow { opacity: 1; }

        .fs-program-level {
          display: inline-flex;
        }
        .fs-program-level span {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--public-gold);
          background: color-mix(in srgb, var(--public-gold) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold) 25%, transparent);
          padding: 3px 10px;
          border-radius: 40px;
        }
        .fs-program-name {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--public-text);
          margin: 0;
          line-height: 1.3;
        }
        .fs-program-desc {
          font-size: 13px;
          color: rgba(248,250,252,0.42);
          line-height: 1.65;
          margin: 0;
          flex: 1;
        }
        .fs-program-footer {
          margin-top: 4px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .fs-program-link {
          font-size: 12.5px;
          font-weight: 600;
          color: color-mix(in srgb, var(--public-gold-light) 70%, transparent);
          transition: color 0.2s, letter-spacing 0.3s;
        }
        .fs-program-card:hover .fs-program-link {
          color: var(--public-gold);
          letter-spacing: 0.01em;
        }

        @media (max-width: 600px) {
          .fs-value-grid, .fs-program-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}