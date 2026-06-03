import { MapPin, Navigation, Phone, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function LocationMap({ content }: PublicContentProps) {
  const { t } = useTranslation();

  const infos = [
    {
      icon: MapPin,
      label: t('public.address'),
      value: content.school.contact.location,
      desc: t('public.locationAddressDescription'),
      accent: 'var(--public-gold)',
      delay: '0s',
    },
    {
      icon: Phone,
      label: t('public.reception'),
      value: content.school.contact.phone,
      desc: t('public.locationReceptionDescription'),
      accent: 'var(--public-gold)',
      delay: '0.1s',
    },
    {
      icon: Navigation,
      label: t('public.transport'),
      value: t('public.busRouteReady'),
      desc: t('public.locationTransportDescription'),
      accent: 'var(--public-gold)',
      delay: '0.2s',
    },
  ];

  const mapsUrl = `https://maps.google.com?q=${encodeURIComponent(content.school.contact.location)}`;

  return (
    <>
      <section className="lm-root">
        {/* atmospheric bg */}
        <div className="lm-bg" aria-hidden="true">
          <div className="lm-grid-tex" />
          <div className="lm-orb lm-orb--1" />
          <div className="lm-orb lm-orb--2" />
          <div className="lm-vignette" />
        </div>

        {/* Header */}
        <header className="lm-header">
          <span className="lm-eyebrow">{t('public.location')}</span>
          <h2 className="lm-title">{content.school.contact.location}</h2>
          <p className="lm-subtitle">{t('public.locationIntro')}</p>
        </header>

        {/* Body: map frame + info cards */}
        <div className="lm-body">
          {/* Map frame */}
          <div className="lm-map-frame">
            <div className="lm-map-inner">
              <iframe
                title="School location map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(content.school.contact.location)}&output=embed`}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* overlay frame glow */}
              <div className="lm-map-overlay" aria-hidden="true" />
            </div>
            {/* map frame label */}
            <div className="lm-map-badge">
              <MapPin size={12} strokeWidth={2} />
              {content.school.contact.location}
            </div>
            <a
              className="lm-map-open"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open in Google Maps"
            >
              <ExternalLink size={14} strokeWidth={1.8} />
              {t('public.openInMaps') || 'Open in Maps'}
            </a>
          </div>

          {/* Info cards */}
          <div className="lm-cards">
            {infos.map(({ icon: Icon, label, value, desc, accent, delay }) => (
              <article
                key={label}
                className="lm-card"
                style={{ '--accent': accent, '--delay': delay } as React.CSSProperties}
              >
                <div className="lm-card-beam" />
                <div className="lm-card-icon">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="lm-card-content">
                  <span className="lm-card-label">{label}</span>
                  <p className="lm-card-value">{value}</p>
                  <p className="lm-card-desc">{desc}</p>
                </div>
                <div className="lm-card-glow" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .lm-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px,10vw,120px) clamp(20px,6vw,88px);
          background: var(--public-bg);
          font-family: 'Sora', sans-serif;
          isolation: isolate;
        }

        /* bg */
        .lm-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .lm-grid-tex {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black, transparent);
        }
        .lm-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px);
          animation: lmOrbFloat 24s ease-in-out infinite alternate;
        }
        .lm-orb--1 {
          width: 600px; height: 600px; top: -200px; left: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold-light) 15%, transparent) 0%, transparent 70%);
        }
        .lm-orb--2 {
          width: 500px; height: 500px; bottom: -150px; right: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 18%, transparent) 0%, transparent 70%);
          animation-duration: 30s; animation-delay: -12s;
        }
        .lm-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 75% 75% at 50% 50%, transparent, rgba(5,7,16,0.6));
        }
        @keyframes lmOrbFloat {
          0% { transform: translate(0,0); }
          100% { transform: translate(40px, 35px); }
        }

        /* header */
        .lm-header {
          position: relative; z-index: 2;
          margin-bottom: clamp(40px,6vw,64px);
          animation: lmFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both;
          max-width: 640px;
        }
        .lm-eyebrow {
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
        .lm-title {
          font-size: clamp(28px,4vw,50px);
          font-weight: 700;
          color: var(--public-text);
          margin: 0 0 14px;
          line-height: 1.15;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--public-text) 0%, rgba(148,163,184,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lm-subtitle {
          font-size: clamp(13px,1.6vw,16px);
          color: rgba(148,163,184,0.55);
          margin: 0;
          line-height: 1.8;
          font-weight: 300;
        }

        /* body layout */
        .lm-body {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: start;
        }

        /* map frame */
        .lm-map-frame {
          position: relative;
          border-radius: 20px;
          overflow: visible;
          animation: lmFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both;
        }
        .lm-map-inner {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--public-gold-light) 15%, transparent),
            0 24px 64px rgba(0,0,0,0.5);
          aspect-ratio: 4/3;
        }
        .lm-map-inner iframe {
          width: 100%; height: 100%;
          border: none;
          filter: invert(0.9) hue-rotate(180deg) saturate(0.6) brightness(0.75);
          display: block;
        }
        .lm-map-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 70%,
            rgba(5,7,16,0.5) 100%
          );
          pointer-events: none;
        }
        .lm-map-badge {
          position: absolute;
          bottom: 16px; left: 16px;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 500;
          color: var(--public-text);
          background: rgba(10,12,24,0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 7px 12px;
          pointer-events: none;
        }
        .lm-map-open {
          position: absolute;
          bottom: 16px; right: 16px;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 500;
          color: var(--public-gold-light);
          background: rgba(10,12,24,0.88);
          backdrop-filter: blur(12px);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 20%, transparent);
          border-radius: 10px;
          padding: 7px 12px;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .lm-map-open:hover {
          background: color-mix(in srgb, var(--public-gold) 20%, transparent);
          border-color: color-mix(in srgb, var(--public-gold-light) 40%, transparent);
          color: var(--public-gold-light);
        }

        /* info cards */
        .lm-cards {
          display: flex; flex-direction: column; gap: 16px;
          animation: lmFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both;
        }
        .lm-card {
          position: relative;
          background: rgba(12,15,30,0.82);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 22px 22px 20px;
          display: flex; gap: 16px; align-items: flex-start;
          overflow: hidden;
          isolation: isolate;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
          animation: lmFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay,0s) both;
        }
        .lm-card:hover {
          transform: translateX(6px);
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .lm-card:hover .lm-card-glow { opacity: 1; }
        .lm-card:hover .lm-card-beam { opacity: 1; }
        .lm-card-beam {
          position: absolute;
          left: 0; top: 10%; bottom: 10%;
          width: 2px;
          background: linear-gradient(180deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 0 2px 2px 0;
        }
        .lm-card-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.03), transparent 60%);
          opacity: 0; transition: opacity 0.4s;
          pointer-events: none; z-index: -1;
        }
        .lm-card-icon {
          width: 38px; height: 38px;
          border-radius: 11px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
          transition: background 0.3s, border-color 0.3s;
        }
        .lm-card:hover .lm-card-icon {
          background: rgba(255,255,255,0.07);
          border-color: var(--accent);
        }
        .lm-card-content { flex: 1; }
        .lm-card-label {
          display: block;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--accent);
          opacity: 0.85;
          margin-bottom: 5px;
        }
        .lm-card-value {
          font-family: 'DM Mono', monospace;
          font-size: 13.5px; font-weight: 500;
          color: var(--public-text);
          margin: 0 0 6px;
          line-height: 1.4;
          word-break: break-word;
        }
        .lm-card-desc {
          font-size: 12px;
          color: rgba(148,163,184,0.45);
          margin: 0;
          line-height: 1.6;
          font-weight: 300;
        }

        @keyframes lmFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 860px) {
          .lm-body { grid-template-columns: 1fr; }
          .lm-map-inner { aspect-ratio: 16/9; }
        }
        @media (max-width: 540px) {
          .lm-map-inner { aspect-ratio: 4/3; }
        }
      `}</style>
    </>
  );
}