import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function ContactUs({ content }: PublicContentProps) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Phone,
      label: t('public.phone'),
      value: content.school.contact.phone,
      desc: t('public.contactPhoneDescription'),
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold) 18%, transparent)',
      gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--public-gold) 12%, transparent) 0%, color-mix(in srgb, var(--public-gold-light) 5%, transparent) 100%)',
      index: 0,
    },
    {
      icon: Mail,
      label: t('public.email'),
      value: content.school.contact.email,
      desc: t('public.contactEmailDescription'),
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 18%, transparent)',
      gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--public-gold-light) 12%, transparent) 0%, color-mix(in srgb, var(--public-gold) 5%, transparent) 100%)',
      index: 1,
    },
    {
      icon: MapPin,
      label: t('public.location'),
      value: content.school.contact.location,
      desc: t('public.contactLocationDescription'),
      accent: 'var(--public-gold)',
      glow: 'color-mix(in srgb, var(--public-gold-light) 18%, transparent)',
      gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--public-gold-light) 12%, transparent) 0%, color-mix(in srgb, var(--public-gold) 5%, transparent) 100%)',
      index: 2,
    },
  ];

  return (
    <>
      <section className="cu-root">
        {/* ── Layered atmospheric background ── */}
        <div className="cu-bg" aria-hidden="true">
          <div className="cu-noise" />
          <div className="cu-bg-grid" />
          <div className="cu-scan-lines" />
          <div className="cu-orb cu-orb--1" />
          <div className="cu-orb cu-orb--2" />
          <div className="cu-orb cu-orb--3" />
          <div className="cu-orb cu-orb--4" />
          <div className="cu-vignette" />
        </div>

        {/* ── Header ── */}
        <header className="cu-header">
          <div className="cu-pill-badge">
            <span className="cu-pill-dot" />
            {t('public.contact_us')}
          </div>
          <h2 className="cu-title">
            {t('public.reachSchool', { schoolName: content.school.name })}
          </h2>
          <p className="cu-subtitle">{t('public.contactIntro')}</p>
        </header>

        {/* ── Cards ── */}
        <div className="cu-grid">
          {cards.map(({ icon: Icon, label, value, desc, accent, glow, gradient, index }) => (
            <article
              key={label}
              className="cu-card"
              style={{
                '--accent': accent,
                '--glow': glow,
                '--gradient': gradient,
                '--delay': `${index * 0.14}s`,
              } as React.CSSProperties}
            >
              {/* live glow pulse */}
              <div className="cu-card-glow" />

              {/* top border beam */}
              <div className="cu-beam" />

              {/* icon */}
              <div className="cu-icon-shell">
                <div className="cu-icon-halo" />
                <div className="cu-icon-box">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
              </div>

              <div className="cu-card-content">
                <span className="cu-label">{label}</span>
                <p className="cu-value">{value}</p>
                <p className="cu-desc">{desc}</p>
              </div>

              {/* bottom accent line */}
              <div className="cu-bottom-line" />

              {/* hover shimmer sweep */}
              <div className="cu-shimmer" />
            </article>
          ))}
        </div>

        {/* ── Decorative bottom divider ── */}
        <div className="cu-divider" aria-hidden="true">
          <div className="cu-divider-line" />
          <div className="cu-divider-diamond" />
          <div className="cu-divider-line" />
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        /* ── Root ──────────────────────────────────────────────── */
        .cu-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px, 11vw, 130px) clamp(20px, 6vw, 88px) clamp(56px, 8vw, 96px);
          background: var(--public-bg);
          font-family: 'Sora', 'DM Sans', sans-serif;
          isolation: isolate;
        }

        /* ── Background layers ─────────────────────────────────── */
        .cu-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

        .cu-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        .cu-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%);
        }
        .cu-scan-lines {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px
          );
          pointer-events: none;
        }
        .cu-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px);
          will-change: transform;
        }
        .cu-orb--1 {
          width: 600px; height: 600px; top: -200px; left: -150px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 22%, transparent) 0%, transparent 70%);
          animation: orbDrift 18s ease-in-out infinite alternate;
        }
        .cu-orb--2 {
          width: 500px; height: 500px; bottom: -150px; right: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 16%, transparent) 0%, transparent 70%);
          animation: orbDrift 24s ease-in-out infinite alternate-reverse;
        }
        .cu-orb--3 {
          width: 350px; height: 350px; top: 50%; left: 40%;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold-light) 10%, transparent) 0%, transparent 70%);
          animation: orbDrift 30s ease-in-out infinite alternate;
        }
        .cu-orb--4 {
          width: 280px; height: 280px; top: 20%; right: 15%;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold-light) 7%, transparent) 0%, transparent 70%);
          animation: orbDrift 22s ease-in-out infinite alternate-reverse;
        }
        @keyframes orbDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(40px, -30px) scale(1.06); }
          100% { transform: translate(-20px, 45px) scale(0.94); }
        }
        .cu-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 80% at 50% 50%, transparent 30%, rgba(5,7,16,0.7) 100%);
        }

        /* ── Header ─────────────────────────────────────────────── */
        .cu-header {
          position: relative; z-index: 2;
          text-align: center;
          margin-bottom: clamp(48px, 8vw, 80px);
          animation: fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both;
        }
        .cu-pill-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--public-gold-light);
          background: color-mix(in srgb, var(--public-gold) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 25%, transparent);
          border-radius: 100px;
          padding: 6px 18px;
          margin-bottom: 24px;
          backdrop-filter: blur(8px);
        }
        .cu-pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--public-gold);
          box-shadow: 0 0 8px color-mix(in srgb, var(--public-gold-light) 80%, transparent);
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .cu-title {
          font-size: clamp(34px, 5.5vw, 62px);
          font-weight: 700;
          color: var(--public-text);
          margin: 0 0 18px;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--public-text) 0%, rgba(241,245,249,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cu-subtitle {
          font-size: clamp(14px, 1.8vw, 17px);
          color: rgba(148,163,184,0.7);
          margin: 0 auto;
          max-width: 500px;
          line-height: 1.8;
          font-weight: 300;
        }

        /* ── Grid ──────────────────────────────────────────────── */
        .cu-grid {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
          gap: 24px;
          max-width: 1020px;
          margin: 0 auto;
        }

        /* ── Card ──────────────────────────────────────────────── */
        .cu-card {
          position: relative;
          background: rgba(15,18,35,0.75);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 40px 32px 36px;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
          cursor: default;
          isolation: isolate;
          transition:
            transform 0.45s cubic-bezier(0.22,1,0.36,1),
            border-color 0.35s ease,
            box-shadow 0.4s ease;
          animation: cardIn 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay, 0s) both;
        }
        .cu-card:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 24px 64px var(--glow),
            0 0 100px var(--glow),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .cu-card:hover .cu-card-glow { opacity: 1; }
        .cu-card:hover .cu-beam { transform: scaleX(1); opacity: 1; }
        .cu-card:hover .cu-icon-halo { opacity: 1; transform: scale(1.4); }
        .cu-card:hover .cu-shimmer { animation: shimmerSweep 0.8s ease forwards; }
        .cu-card:hover .cu-bottom-line { opacity: 1; transform: scaleX(1); }
        .cu-card:hover .cu-icon-box {
          background: var(--gradient);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* background glow blob inside card */
        .cu-card-glow {
          position: absolute;
          inset: -20px;
          background: var(--gradient);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          filter: blur(30px);
          z-index: -1;
        }

        /* top border beam */
        .cu-beam {
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          border-radius: 0 0 4px 4px;
          transform: scaleX(0);
          opacity: 0;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease;
          transform-origin: center;
        }

        /* icon */
        .cu-icon-shell {
          position: relative;
          width: 54px; height: 54px;
          margin-bottom: 24px;
          flex-shrink: 0;
        }
        .cu-icon-halo {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: var(--glow);
          filter: blur(10px);
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .cu-icon-box {
          position: relative;
          width: 54px; height: 54px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          transition: all 0.35s ease;
        }

        /* content */
        .cu-card-content { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .cu-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--accent);
          opacity: 0.85;
        }
        .cu-value {
          font-family: 'DM Mono', 'Fira Code', monospace;
          font-size: clamp(13px, 1.5vw, 15.5px);
          font-weight: 500;
          color: var(--public-text);
          margin: 0;
          line-height: 1.5;
          word-break: break-word;
        }
        .cu-desc {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          margin: 0;
          line-height: 1.7;
          font-weight: 300;
        }

        /* bottom accent line */
        .cu-bottom-line {
          position: absolute;
          bottom: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transform: scaleX(0.3);
          transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }

        /* shimmer */
        .cu-shimmer {
          position: absolute;
          top: 0; bottom: 0; left: -100%;
          width: 60%;
          background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%);
          pointer-events: none;
          will-change: transform;
        }
        @keyframes shimmerSweep {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(300%); opacity: 0; }
        }

        /* ── Divider ────────────────────────────────────────────── */
        .cu-divider {
          position: relative; z-index: 2;
          display: flex; align-items: center;
          margin-top: clamp(56px, 9vw, 88px);
          max-width: 600px; margin-left: auto; margin-right: auto;
          gap: 0;
        }
        .cu-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        .cu-divider-diamond {
          width: 8px; height: 8px;
          background: color-mix(in srgb, var(--public-gold-light) 60%, transparent);
          transform: rotate(45deg);
          margin: 0 16px;
          box-shadow: 0 0 12px color-mix(in srgb, var(--public-gold-light) 50%, transparent);
        }

        /* ── Animations ─────────────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 640px) {
          .cu-grid { grid-template-columns: 1fr; gap: 16px; }
          .cu-card { padding: 30px 24px; }
        }
      `}</style>
    </>
  );
}
