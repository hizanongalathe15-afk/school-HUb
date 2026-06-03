import { CalendarDays, Megaphone, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function NewsAndEvents({ content }: PublicContentProps) {
  const { t } = useTranslation();

  const events = [
    {
      titleKey: 'public.events.academicClinic.title',
      textKey: 'public.events.academicClinic.text',
      icon: CalendarDays,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 18%, transparent)',
      tag: 'Academic',
      tagColor: 'var(--public-gold)',
      tagBg: 'color-mix(in srgb, var(--public-gold-light) 10%, transparent)',
      delay: '0s',
    },
    {
      titleKey: 'public.events.sportsFixtures.title',
      textKey: 'public.events.sportsFixtures.text',
      icon: Trophy,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 18%, transparent)',
      tag: 'Sports',
      tagColor: 'var(--public-gold)',
      tagBg: 'color-mix(in srgb, var(--public-gold-light) 10%, transparent)',
      delay: '0.12s',
    },
    {
      titleKey: 'public.events.principalBulletin.title',
      textKey: 'public.events.principalBulletin.text',
      icon: Megaphone,
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold) 18%, transparent)',
      tag: 'Bulletin',
      tagColor: 'var(--public-gold)',
      tagBg: 'color-mix(in srgb, var(--public-gold) 10%, transparent)',
      delay: '0.24s',
    },
  ];

  return (
    <>
      <section className="ne-root">
        {/* bg */}
        <div className="ne-bg" aria-hidden="true">
          <div className="ne-grid" />
          <div className="ne-orb ne-orb--1" />
          <div className="ne-orb ne-orb--2" />
          <div className="ne-scan" />
        </div>

        {/* Header */}
        <header className="ne-header">
          <span className="ne-eyebrow">{t('public.newsAndEvents')}</span>
          <h2 className="ne-title">{t('public.newsAndEventsHeading')}</h2>
        </header>

        {/* Event cards */}
        <div className="ne-grid-cards">
          {events.map(({ titleKey, textKey, icon: Icon, accent, glow, tag, tagColor, tagBg, delay }) => (
            <article
              key={titleKey}
              className="ne-card"
              style={{ '--accent': accent, '--glow': glow, '--delay': delay } as React.CSSProperties}
            >
              {/* top beam */}
              <div className="ne-beam" />

              {/* card inner */}
              <div className="ne-card-top">
                <div className="ne-icon-wrap">
                  <div className="ne-icon-halo" />
                  <div className="ne-icon-box">
                    <Icon size={20} strokeWidth={1.4} />
                  </div>
                </div>
                <span
                  className="ne-tag"
                  style={{ color: tagColor, background: tagBg, borderColor: `${tagColor}33` } as React.CSSProperties}
                >
                  {tag}
                </span>
              </div>

              <h3 className="ne-card-title">{t(titleKey)}</h3>
              <p className="ne-card-text">{t(textKey, { schoolName: content.school.name })}</p>

              {/* decorative timeline dot */}
              <div className="ne-card-footer">
                <div className="ne-dot-row">
                  <div className="ne-dot ne-dot--filled" />
                  <div className="ne-dot-line" />
                  <div className="ne-dot" />
                  <div className="ne-dot-line" />
                  <div className="ne-dot" />
                </div>
              </div>

              {/* hover glow */}
              <div className="ne-glow" />
            </article>
          ))}
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .ne-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px,10vw,120px) clamp(20px,6vw,88px);
          background: var(--public-bg);
          font-family: 'Sora', sans-serif;
          isolation: isolate;
        }

        /* bg */
        .ne-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .ne-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black, transparent);
        }
        .ne-scan {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px
          );
        }
        .ne-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px);
          animation: neOrbFloat 22s ease-in-out infinite alternate;
        }
        .ne-orb--1 {
          width: 580px; height: 580px; top: -180px; left: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 18%, transparent) 0%, transparent 70%);
        }
        .ne-orb--2 {
          width: 450px; height: 450px; bottom: -120px; right: -80px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold-light) 12%, transparent) 0%, transparent 70%);
          animation-duration: 28s; animation-delay: -10s;
        }
        @keyframes neOrbFloat {
          0% { transform: translate(0,0); }
          100% { transform: translate(45px, 35px); }
        }

        /* header */
        .ne-header {
          position: relative; z-index: 2;
          margin-bottom: clamp(40px,6vw,64px);
          animation: neFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .ne-eyebrow {
          display: inline-block;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--public-gold);
          background: color-mix(in srgb, var(--public-gold-light) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 20%, transparent);
          border-radius: 100px;
          padding: 5px 16px;
          margin-bottom: 20px;
        }
        .ne-title {
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
          max-width: 620px;
        }

        /* grid */
        .ne-grid-cards {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* card */
        .ne-card {
          position: relative;
          background: rgba(12,15,30,0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 28px 26px 24px;
          display: flex; flex-direction: column; gap: 14px;
          overflow: hidden;
          isolation: isolate;
          cursor: default;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
          animation: neFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay,0s) both;
        }
        .ne-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 24px 60px var(--glow),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .ne-card:hover .ne-glow { opacity: 1; }
        .ne-card:hover .ne-beam { transform: scaleX(1); opacity: 1; }
        .ne-card:hover .ne-icon-halo { opacity: 1; transform: scale(1.35); }
        .ne-card:hover .ne-dot--filled { box-shadow: 0 0 12px var(--accent); }

        /* beam */
        .ne-beam {
          position: absolute;
          top: 0; left: 12%; right: 12%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: scaleX(0); opacity: 0;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
        }
        .ne-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% -10%, var(--glow) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.4s;
          pointer-events: none; z-index: -1;
        }

        /* top row */
        .ne-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .ne-icon-wrap { position: relative; width: 50px; height: 50px; }
        .ne-icon-halo {
          position: absolute; inset: -6px;
          border-radius: 50%;
          background: var(--glow);
          filter: blur(8px);
          opacity: 0;
          transition: opacity 0.35s, transform 0.45s cubic-bezier(0.22,1,0.36,1);
        }
        .ne-icon-box {
          width: 50px; height: 50px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          transition: background 0.3s, border-color 0.3s;
        }
        .ne-card:hover .ne-icon-box {
          background: rgba(255,255,255,0.07);
          border-color: var(--accent);
        }
        .ne-tag {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid;
          border-radius: 6px;
          padding: 3px 9px;
          align-self: flex-start;
          margin-top: 4px;
        }

        /* text */
        .ne-card-title {
          font-size: 16px; font-weight: 600;
          color: var(--public-text);
          margin: 0;
          line-height: 1.3;
        }
        .ne-card-text {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          margin: 0;
          line-height: 1.7;
          font-weight: 300;
          flex: 1;
        }

        /* footer timeline dots */
        .ne-card-footer { margin-top: 4px; }
        .ne-dot-row { display: flex; align-items: center; gap: 0; }
        .ne-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          flex-shrink: 0;
          transition: box-shadow 0.3s;
        }
        .ne-dot--filled {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 6px var(--glow);
        }
        .ne-dot-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, var(--accent), rgba(255,255,255,0.06));
          opacity: 0.3;
        }

        @keyframes neFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .ne-grid-cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}