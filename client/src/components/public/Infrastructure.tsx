import { Building2, FlaskConical, Library, Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function Infrastructure({ content }: PublicContentProps) {
  const { t } = useTranslation();

  const facilities = [
    {
      titleKey: 'public.infrastructure.modernClassrooms.title',
      textKey: 'public.infrastructure.modernClassrooms.text',
      icon: Building2,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 20%, transparent)',
      stat: '48',
      statLabel: 'rooms',
      delay: '0s',
    },
    {
      titleKey: 'public.infrastructure.scienceLaboratories.title',
      textKey: 'public.infrastructure.scienceLaboratories.text',
      icon: FlaskConical,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold) 20%, transparent)',
      stat: '12',
      statLabel: 'labs',
      delay: '0.1s',
    },
    {
      titleKey: 'public.infrastructure.libraryResources.title',
      textKey: 'public.infrastructure.libraryResources.text',
      icon: Library,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 20%, transparent)',
      stat: '15K',
      statLabel: 'books',
      delay: '0.2s',
    },
    {
      titleKey: 'public.infrastructure.diningBoarding.title',
      textKey: 'public.infrastructure.diningBoarding.text',
      icon: Utensils,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 20%, transparent)',
      stat: '500',
      statLabel: 'capacity',
      delay: '0.3s',
    },
  ];

  return (
    <>
      <section className="inf-root">
        {/* bg */}
        <div className="inf-bg" aria-hidden="true">
          <div className="inf-grid" />
          <div className="inf-orb inf-orb--1" />
          <div className="inf-orb inf-orb--2" />
          <div className="inf-vignette" />
        </div>

        {/* Header */}
        <header className="inf-header">
          <span className="inf-eyebrow">{t('public.infrastructureTitle')}</span>
          <h2 className="inf-title">
            {t('public.infrastructureHeading', { schoolName: content.school.name })}
          </h2>
        </header>

        {/* Cards */}
        <div className="inf-grid-cards">
          {facilities.map(({ titleKey, textKey, icon: Icon, accent, glow, stat, statLabel, delay }) => (
            <article
              key={titleKey}
              className="inf-card"
              style={{ '--accent': accent, '--glow': glow, '--delay': delay } as React.CSSProperties}
            >
              <div className="inf-card-inner">
                {/* Top row: icon + stat */}
                <div className="inf-card-top">
                  <div className="inf-icon-shell">
                    <div className="inf-icon-ring" />
                    <div className="inf-icon-box">
                      <Icon size={22} strokeWidth={1.4} />
                    </div>
                  </div>
                  <div className="inf-stat-block">
                    <span className="inf-stat-number">{stat}</span>
                    <span className="inf-stat-label">{statLabel}</span>
                  </div>
                </div>

                {/* Text */}
                <h3 className="inf-card-title">{t(titleKey)}</h3>
                <p className="inf-card-text">{t(textKey)}</p>

                {/* Bottom indicator bar */}
                <div className="inf-bar-track">
                  <div className="inf-bar-fill" />
                </div>
              </div>

              {/* hover glow */}
              <div className="inf-card-glow" aria-hidden="true" />
              {/* top beam */}
              <div className="inf-beam" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@500&display=swap');

        .inf-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px,10vw,120px) clamp(20px,6vw,88px);
          background: var(--public-bg);
          font-family: 'Sora', sans-serif;
          isolation: isolate;
        }

        /* bg */
        .inf-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .inf-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black, transparent);
        }
        .inf-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px);
          animation: infOrbFloat 22s ease-in-out infinite alternate;
        }
        .inf-orb--1 {
          width: 550px; height: 550px; top: -150px; left: -120px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 20%, transparent) 0%, transparent 70%);
        }
        .inf-orb--2 {
          width: 450px; height: 450px; bottom: -120px; right: -80px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 14%, transparent) 0%, transparent 70%);
          animation-duration: 28s; animation-delay: -10s;
        }
        .inf-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 80% at 50% 50%, transparent 30%, rgba(5,7,16,0.65) 100%);
        }
        @keyframes infOrbFloat {
          0% { transform: translate(0,0); }
          100% { transform: translate(50px, 40px); }
        }

        /* header */
        .inf-header {
          position: relative; z-index: 2;
          margin-bottom: clamp(40px,6vw,64px);
          animation: infFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .inf-eyebrow {
          display: inline-block;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--public-gold);
          margin-bottom: 16px;
          padding: 5px 16px;
          background: color-mix(in srgb, var(--public-gold) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold) 20%, transparent);
          border-radius: 100px;
        }
        .inf-title {
          font-size: clamp(30px,4.5vw,54px);
          font-weight: 700;
          color: var(--public-text);
          margin: 0;
          line-height: 1.12;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--public-text) 0%, rgba(148,163,184,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          max-width: 680px;
        }

        /* card grid */
        .inf-grid-cards {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* card */
        .inf-card {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          isolation: isolate;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: default;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
          animation: infFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay,0s) both;
        }
        .inf-card:hover {
          transform: translateY(-7px);
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 24px 60px var(--glow),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .inf-card:hover .inf-card-glow { opacity: 1; }
        .inf-card:hover .inf-beam { transform: scaleX(1); opacity: 1; }
        .inf-card:hover .inf-icon-ring { opacity: 1; transform: scale(1.25); }
        .inf-card:hover .inf-bar-fill { width: 100%; }

        .inf-card-inner {
          position: relative; z-index: 2;
          background: rgba(12,15,30,0.85);
          backdrop-filter: blur(16px);
          padding: 30px 26px 26px;
          display: flex; flex-direction: column; gap: 12px;
          height: 100%;
        }

        .inf-beam {
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: scaleX(0); opacity: 0;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
          z-index: 3;
        }

        .inf-card-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, var(--glow) 0%, transparent 65%);
          opacity: 0; transition: opacity 0.4s;
          pointer-events: none; z-index: 1;
        }

        /* top row */
        .inf-card-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 4px;
        }
        .inf-icon-shell {
          position: relative;
          width: 52px; height: 52px;
        }
        .inf-icon-ring {
          position: absolute; inset: -5px;
          border-radius: 50%;
          border: 1px solid var(--accent);
          opacity: 0;
          transition: opacity 0.35s, transform 0.45s cubic-bezier(0.22,1,0.36,1);
        }
        .inf-icon-box {
          width: 52px; height: 52px;
          border-radius: 15px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          transition: background 0.3s, border-color 0.3s;
        }
        .inf-card:hover .inf-icon-box {
          background: rgba(255,255,255,0.07);
          border-color: var(--accent);
        }

        /* stat */
        .inf-stat-block {
          text-align: right;
        }
        .inf-stat-number {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 26px; font-weight: 500;
          color: var(--accent);
          line-height: 1;
          text-shadow: 0 0 20px var(--glow);
        }
        .inf-stat-label {
          display: block;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(148,163,184,0.4);
          margin-top: 2px;
        }

        .inf-card-title {
          font-size: 15.5px; font-weight: 600;
          color: var(--public-text);
          margin: 0;
          line-height: 1.3;
        }
        .inf-card-text {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          margin: 0;
          line-height: 1.7;
          font-weight: 300;
          flex: 1;
        }

        /* progress bar */
        .inf-bar-track {
          height: 2px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }
        .inf-bar-fill {
          height: 100%;
          width: 35%;
          background: linear-gradient(90deg, var(--accent), transparent);
          transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
          border-radius: 2px;
        }

        @keyframes infFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .inf-grid-cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}