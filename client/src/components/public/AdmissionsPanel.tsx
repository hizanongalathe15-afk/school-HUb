import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, FileUp, Sparkles } from 'lucide-react';
import type { LandingContent } from '../../types';

interface AdmissionsPanelProps {
  content: LandingContent;
}

export default function AdmissionsPanel({ content }: AdmissionsPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  if (content.admissions.enabled === false) {
    return null;
  }

  return (
    <>
      <section
        id="admissions"
        className="adm-root"
        ref={sectionRef}
        style={{
          '--mx': mousePos.x,
          '--my': mousePos.y,
        } as React.CSSProperties}
      >
        {/* Animated background */}
        <div className="adm-bg" aria-hidden="true">
          <div className="adm-bg-mesh" />
          <div className="adm-bg-orb adm-bg-orb--a" />
          <div className="adm-bg-orb adm-bg-orb--b" />
          <div
            className="adm-bg-spotlight"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, color-mix(in srgb, var(--public-gold) 15%, transparent), transparent 60%)`,
            }}
          />
        </div>

        <div className="adm-inner">
          {/* Left: eyebrow + heading + text */}
          <div className="adm-copy">
            <div className="adm-badge">
              <Sparkles size={13} aria-hidden="true" />
              <span>{content.sections.admissions.eyebrow}</span>
            </div>

            <h2 className="adm-heading">
              {content.admissions.heading}
            </h2>

            <p className="adm-text">{content.admissions.text}</p>

            {/* Steps */}
            <div className="adm-steps">
              {(t('public.admissionsSteps', { returnObjects: true }) as Array<{ title: string; description: string }>).map((step, i: number) => (
                <div key={step.title} className="adm-step">
                  <div className="adm-step-num">{i + 1}</div>
                  <span>{step.title}</span>
                  {i < 3 && <div className="adm-step-line" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right: card */}
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-tag">{t('public.admissions.nowOpen', 'Now Open')}</span>
              <div className="adm-card-dot" />
            </div>
            <h3 className="adm-card-title">{t('public.admissions.readyToJoin', 'Ready to join us?')}</h3>
            <p className="adm-card-sub">
              {t('public.admissions.takeFirstStep', 'Take the first step toward an exceptional education. Applications are reviewed on a rolling basis.')}
            </p>

            <div className="adm-card-divider" />

            <div className="adm-actions">
              <button
                type="button"
                onClick={() => navigate('/admissions/apply')}
                className="adm-btn-primary"
              >
                <FileUp size={17} aria-hidden="true" />
                <span>{content.admissions.primaryAction || t('public.admissions.startApplication', 'Start Application')}</span>
                <span className="adm-btn-arrow">→</span>
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/contact?reason=visit'; }}
                className="adm-btn-secondary"
              >
                <CalendarDays size={17} aria-hidden="true" />
                <span>{content.admissions.secondaryAction || t('public.admissions.bookVisit', 'Book a Visit')}</span>
              </button>
            </div>

            <p className="adm-card-footnote">
              {t('public.admissions.noCommitment', 'No commitment required. Tours are free and last ~45 minutes.')}
            </p>

            {/* Corner decorations */}
            <span className="adm-corner adm-corner--tl" aria-hidden="true" />
            <span className="adm-corner adm-corner--br" aria-hidden="true" />
          </div>
        </div>
      </section>

      <style>{`
        .adm-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px, 10vw, 120px) clamp(20px, 6vw, 80px);
          background: var(--public-bg);
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }

        /* ── BG ── */
        .adm-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .adm-bg-mesh {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 0%, transparent 80%);
        }
        .adm-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: admOrbFloat 15s ease-in-out infinite alternate;
        }
        .adm-bg-orb--a {
          width: 500px; height: 500px;
          top: -150px; right: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 20%, transparent), transparent 70%);
        }
        .adm-bg-orb--b {
          width: 350px; height: 350px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 15%, transparent), transparent 70%);
          animation-duration: 20s;
          animation-delay: -7s;
        }
        @keyframes admOrbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, 30px) scale(1.1); }
        }
        .adm-bg-spotlight {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: background 0.1s;
        }

        /* ── Inner ── */
        .adm-inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(40px, 6vw, 80px);
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Copy ── */
        .adm-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border: 1px solid color-mix(in srgb, var(--public-gold) 35%, transparent);
          border-radius: 40px;
          background: color-mix(in srgb, var(--public-gold) 10%, transparent);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--public-gold);
          margin-bottom: 24px;
        }
        .adm-heading {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: clamp(32px, 4.5vw, 54px);
          font-weight: 700;
          color: var(--public-bg);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 20px;
        }
        .adm-text {
          font-size: clamp(14px, 1.7vw, 16px);
          color: var(--public-muted);
          line-height: 1.75;
          margin: 0 0 40px;
          max-width: 440px;
        }

        /* steps */
        .adm-steps {
          display: flex;
          align-items: center;
          gap: 0;
          flex-wrap: nowrap;
          overflow-x: auto;
        }
        .adm-step {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .adm-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--public-gold) 18%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold) 40%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--public-gold);
          flex-shrink: 0;
        }
        .adm-step span {
          font-size: 12px;
          color: var(--public-muted);
          font-weight: 500;
        }
        .adm-step-line {
          width: 24px; height: 1px;
          background: linear-gradient(90deg, color-mix(in srgb, var(--public-gold) 30%, transparent), color-mix(in srgb, var(--public-gold) 10%, transparent));
          margin: 0 4px;
          flex-shrink: 0;
        }

        /* ── Card ── */
        .adm-card {
          position: relative;
          background: rgba(255,255,255,0.036);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 40px 36px;
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .adm-card:hover {
          border-color: color-mix(in srgb, var(--public-gold) 35%, transparent);
          box-shadow: 0 24px 80px color-mix(in srgb, var(--public-gold) 15%, transparent), 0 0 0 1px color-mix(in srgb, var(--public-gold) 10%, transparent);
        }
        .adm-corner {
          position: absolute;
          width: 20px; height: 20px;
          border-color: color-mix(in srgb, var(--public-gold) 40%, transparent);
          border-style: solid;
        }
        .adm-corner--tl { top: 14px; left: 14px; border-width: 1.5px 0 0 1.5px; border-radius: 3px 0 0 0; }
        .adm-corner--br { bottom: 14px; right: 14px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 3px 0; }

        .adm-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .adm-card-tag {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--public-gold);
          background: color-mix(in srgb, var(--public-gold-light) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 25%, transparent);
          padding: 4px 12px;
          border-radius: 40px;
        }
        .adm-card-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--public-gold);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--public-gold-light) 40%, transparent);
          animation: admPulse 2s ease-in-out infinite;
        }
        @keyframes admPulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--public-gold-light) 40%, transparent); }
          50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--public-gold-light) 0%, transparent); }
        }

        .adm-card-title {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: clamp(22px, 2.8vw, 32px);
          font-weight: 700;
          color: var(--public-text);
          margin: 0 0 12px;
          line-height: 1.2;
        }
        .adm-card-sub {
          font-size: 14px;
          color: color-mix(in srgb, var(--public-text) 45%, transparent);
          line-height: 1.7;
          margin: 0 0 24px;
        }
        .adm-card-divider {
          height: 1px;
          background: linear-gradient(90deg, color-mix(in srgb, var(--public-gold) 30%, transparent), rgba(255,255,255,0.06), transparent);
          margin-bottom: 28px;
        }

        /* buttons */
        .adm-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .adm-btn-primary {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 15px 22px;
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
          border: none;
          border-radius: 12px;
          color: var(--public-text);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 6px 24px color-mix(in srgb, var(--public-gold) 45%, transparent);
        }
        .adm-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .adm-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px color-mix(in srgb, var(--public-gold) 60%, transparent); }
        .adm-btn-primary:hover::before { opacity: 1; }
        .adm-btn-arrow { margin-left: auto; transition: transform 0.25s ease; }
        .adm-btn-primary:hover .adm-btn-arrow { transform: translateX(4px); }

        .adm-btn-secondary {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 14px 22px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: color-mix(in srgb, var(--public-text) 75%, transparent);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .adm-btn-secondary:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.22);
          color: var(--public-text);
          transform: translateY(-2px);
        }

        .adm-card-footnote {
          font-size: 11.5px;
          color: color-mix(in srgb, var(--public-text) 30%, transparent);
          margin: 16px 0 0;
          text-align: center;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .adm-inner { grid-template-columns: 1fr; }
          .adm-steps { display: none; }
        }
      `}</style>
    </>
  );
}
