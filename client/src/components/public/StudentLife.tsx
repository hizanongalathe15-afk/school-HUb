import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { LandingContent } from '../../types';

interface StudentLifeProps {
  content: LandingContent;
}

export default function StudentLife({ content }: StudentLifeProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (rect.top / window.innerHeight);
      setScrollRatio(Math.max(0, Math.min(1, ratio)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <section
        id="life"
        className="sl-root"
        ref={sectionRef}
        style={{ '--life-image': `url("${content.sections.life.image}")` } as CSSProperties}
      >
        {/* Parallax background image */}
        <div
          className="sl-bg"
          style={{ transform: `translateY(${(scrollRatio - 0.5) * 40}px)` }}
          aria-hidden="true"
        />
        <div className="sl-overlay" aria-hidden="true" />

        {/* Animated grid lines */}
        <div className="sl-grid-lines" aria-hidden="true" />

        <div className="sl-inner">
          {/* Left column */}
          <div className="sl-copy">
            <div className="sl-eyebrow-row">
              <span className="sl-rule" />
              <p className="sl-eyebrow">{content.sections.life.eyebrow}</p>
            </div>
            <h2 className="sl-heading">{content.sections.life.heading}</h2>

            <p className="sl-desc">
              Life at {content.school.name} extends far beyond the classroom. Our students thrive in a vibrant community built on passion, creativity, and friendship.
            </p>

            <a href="#admissions" className="sl-cta">
              Discover campus life <span className="sl-cta-arrow">↗</span>
            </a>
          </div>

          {/* Right: activity list */}
          <ul className="sl-list">
            {content.studentLife.map((item, i) => (
              <li
                key={item}
                className="sl-item"
                style={{ '--item-i': i } as CSSProperties}
              >
                <span className="sl-item-num">0{i + 1}</span>
                <span className="sl-item-text">{item}</span>
                <span className="sl-item-arrow" aria-hidden="true">→</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom decoration */}
        <div className="sl-bottom-deco" aria-hidden="true">
          <div className="sl-bottom-line" />
        </div>
      </section>

      <style>{`
        .sl-root {
          position: relative;
          overflow: hidden;
          padding: clamp(80px, 11vw, 130px) clamp(20px, 6vw, 80px);
          background: var(--public-bg);
          min-height: 600px;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }

        /* ── BG ── */
        .sl-bg {
          position: absolute;
          inset: -10%;
          background-image: var(--life-image);
          background-size: cover;
          background-position: center;
          opacity: 0.12;
          filter: saturate(0.4) blur(2px);
          will-change: transform;
        }
        .sl-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(6,8,24,0.95) 0%,
            rgba(6,8,24,0.75) 50%,
            rgba(6,8,24,0.92) 100%
          );
          z-index: 1;
        }
        .sl-grid-lines {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black, transparent);
        }

        /* ── Inner ── */
        .sl-inner {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(40px, 6vw, 80px);
          align-items: start;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Copy ── */
        .sl-eyebrow-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .sl-rule {
          display: block;
          width: 36px; height: 1px;
          background: linear-gradient(90deg, color-mix(in srgb, var(--public-gold) 60%, transparent), transparent);
        }
        .sl-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--public-gold);
          margin: 0;
        }
        .sl-heading {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 700;
          color: var(--public-text);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 24px;
        }
        .sl-desc {
          font-size: clamp(13.5px, 1.6vw, 15.5px);
          color: color-mix(in srgb, var(--public-text) 45%, transparent);
          line-height: 1.75;
          margin: 0 0 36px;
        }
        .sl-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 1px solid color-mix(in srgb, var(--public-gold) 35%, transparent);
          border-radius: 10px;
          color: var(--public-gold);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: color-mix(in srgb, var(--public-gold) 7%, transparent);
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .sl-cta:hover {
          background: color-mix(in srgb, var(--public-gold) 14%, transparent);
          border-color: color-mix(in srgb, var(--public-gold) 60%, transparent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--public-gold) 20%, transparent);
        }
        .sl-cta-arrow { transition: transform 0.25s ease; }
        .sl-cta:hover .sl-cta-arrow { transform: translate(3px, -3px); }

        /* ── List ── */
        .sl-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sl-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          background: rgba(255,255,255,0.022);
          cursor: default;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          animation: slItemIn 0.5s cubic-bezier(0.22,1,0.36,1) calc(var(--item-i, 0) * 0.07s) both;
        }
        @keyframes slItemIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sl-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: color-mix(in srgb, var(--public-gold) 25%, transparent);
          transform: translateX(-4px);
          box-shadow: 4px 0 24px color-mix(in srgb, var(--public-gold) 8%, transparent);
        }
        .sl-item-num {
          font-family: 'DM Mono', 'Fira Code', monospace;
          font-size: 10.5px;
          font-weight: 700;
          color: color-mix(in srgb, var(--public-gold) 50%, transparent);
          flex-shrink: 0;
          width: 24px;
        }
        .sl-item-text {
          font-size: 14px;
          font-weight: 500;
          color: color-mix(in srgb, var(--public-text) 75%, transparent);
          flex: 1;
          line-height: 1.4;
          transition: color 0.2s;
        }
        .sl-item:hover .sl-item-text { color: var(--public-text); }
        .sl-item-arrow {
          font-size: 14px;
          color: color-mix(in srgb, var(--public-gold) 30%, transparent);
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.25s, transform 0.25s;
        }
        .sl-item:hover .sl-item-arrow { opacity: 1; transform: translateX(0); }

        /* ── Bottom deco ── */
        .sl-bottom-deco {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          z-index: 2;
        }
        .sl-bottom-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--public-gold) 20%, transparent), transparent);
          animation: slLinePulse 4s ease-in-out infinite;
        }
        @keyframes slLinePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @media (max-width: 860px) {
          .sl-inner { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}