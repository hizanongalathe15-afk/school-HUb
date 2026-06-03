import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Microscope, Palette, Trophy } from 'lucide-react';
import type { Accent, LandingContent } from '../../types';

export const accentClass: Record<Accent, string> = {
  blue: 'accent-blue',
  violet: 'accent-violet',
  teal: 'accent-teal',
  cyan: 'accent-cyan',
  rose: 'accent-rose',
  amber: 'accent-amber',
  indigo: 'accent-indigo'
};

interface SchoolLandingPageProps {
  content: LandingContent;
}

function splitHeroTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return { first: title, second: '' };
  return {
    first: words.slice(0, Math.ceil(words.length / 2)).join(' '),
    second: words.slice(Math.ceil(words.length / 2)).join(' ')
  };
}

export default function SchoolLandingPage({ content }: SchoolLandingPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [time, setTime] = useState('');
  const hero = content.heroSlides[0];
  const logoSrc = content.school.logo || '/assets/logo/favicon_io/android-chrome-512x512.png';
  const title = splitHeroTitle(hero?.title || content.school.name);
  const stats = content.stats;
  const tickerItems = content.live?.tickerItems?.length ? content.live.tickerItems : [];
  const admissionSteps = content.live?.admissionsSteps?.length ? content.live.admissionsSteps : [];
  const theme = {
    background: content.theme?.background || content.school.primaryColor || '#f8fafc',
    surface: content.theme?.surface || '#ffffff',
    text: content.theme?.text || '#0f172a',
    mutedText: content.theme?.mutedText || '#64748b',
    primary: content.theme?.primary || content.school.secondaryColor || '#2563eb',
    primaryLight: content.theme?.primaryLight || '#38bdf8',
    danger: content.theme?.danger || '#e04545'
  };
  const lifeCards = useMemo(() => {
    const icons = [Trophy, Palette, Microscope];
    return content.values.slice(0, 3).map((value, index) => ({
      title: value.title,
      description: value.description,
      Icon: icons[index] || Building2
    }));
  }, [content.values]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((part) => String(part).padStart(2, '0'))
          .join(':')
      );
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = hero?.playbackRate || 1;
    video.play().catch(() => undefined);

    const onScroll = () => {
      video.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hero?.playbackRate]);

  return (
    <main
      className="school-live-page"
      style={{
        '--school-live-bg': theme.background,
        '--school-live-surface': theme.surface,
        '--school-live-text': theme.text,
        '--school-live-muted': theme.mutedText,
        '--school-live-primary': theme.primary,
        '--school-live-primary-light': theme.primaryLight,
        '--school-live-danger': theme.danger
      } as CSSProperties}
    >
      <div className="school-live-grain" aria-hidden="true" />
      <div className="school-live-scanline" aria-hidden="true" />

      <section className="school-live-hero" id="home">
        <video
          className="school-live-video"
          ref={videoRef}
          src={hero?.video || ''}
          poster={hero?.image || content.school.coverImage}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="school-live-tint" />
        <div className="school-live-vignette" />

        <div className="school-live-time">{time}</div>
        <div className="school-live-badge">
          <span className="school-live-dot" />
          {content.live?.badgeLabel}
        </div>

        <div className="school-live-hero-content">
          <p className="school-live-eyebrow">
            <span />
            {content.school.tagline}
            <span />
          </p>
          <h1 className="school-live-title">
            {title.first}
            {title.second && (
              <>
                <br />
                <em>{title.second}</em>
              </>
            )}
          </h1>
          <p className="school-live-subtitle">{hero?.subtitle || content.school.summary}</p>
          <div className="school-live-actions">
            <Link className="school-live-btn school-live-btn-solid" to="/admissions/apply">
              {content.admissions.primaryAction}
            </Link>
            <Link className="school-live-btn school-live-btn-outline" to="/about">
              {content.admissions.secondaryAction}
            </Link>
          </div>
        </div>

        <div className="school-live-ticker">
          <div className="school-live-ticker-label"><span className="school-live-dot" />{content.live?.tickerLabel}</div>
          <div className="school-live-ticker-track">
            {[0, 1].map((loop) => (
              <div className="school-live-ticker-set" key={loop}>
                {tickerItems.map((item) => (
                  <span className="school-live-ticker-fragment" key={`${loop}-${item}`}>
                    <span className="school-live-ticker-item">{item}</span>
                    <span className="school-live-ticker-sep">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="school-live-stats" aria-label="School statistics">
        {stats.slice(0, 4).map((stat) => (
          <div className="school-live-stat" key={stat.label}>
            <div className="school-live-stat-value">{stat.value}</div>
            <div className="school-live-stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="school-live-about" id="about">
        <div>
          <p className="school-live-label">{content.sections.about.eyebrow}</p>
          <h2 className="school-live-section-title">
            {(content.live?.aboutHeading || content.sections.values.heading).split('\n').map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <div className="school-live-divider" />
          <p className="school-live-body">{content.school.summary}</p>
          {content.live?.aboutText && <p className="school-live-body">{content.live.aboutText}</p>}
          <div className="school-live-features">
            {content.values.slice(0, 4).map((value) => (
              <div className="school-live-feature" key={value.title}>
                <span />
                <p>{value.title}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="school-live-about-card">
          <div className="school-live-about-inner">
            <img src={logoSrc} alt="" aria-hidden="true" />
          </div>
          <div className="school-live-frame" />
          {content.live?.aboutTag && <div className="school-live-tag">{content.live.aboutTag}</div>}
        </div>
      </section>

      <section className="school-live-life" id="life">
        <div className="school-live-inner">
          <div className="school-live-section-header">
            <p className="school-live-label">{content.sections.life.eyebrow}</p>
            <h2 className="school-live-section-title school-live-section-title-small">{content.sections.life.heading}</h2>
          </div>
          <div className="school-live-life-grid">
            {lifeCards.map(({ title: cardTitle, description, Icon }) => (
              <article className="school-live-life-card" key={cardTitle}>
                <Icon size={28} aria-hidden="true" />
                <h3>{cardTitle}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="school-live-admissions" id="admissions">
        <div className="school-live-inner">
          <div className="school-live-section-header">
            <p className="school-live-label">{content.sections.admissions.eyebrow}</p>
            <h2 className="school-live-section-title school-live-section-title-small">{content.admissions.heading}</h2>
          </div>
          <div className="school-live-steps">
            {admissionSteps.map((step, index) => (
              <div className="school-live-step" key={step.title}>
                <div>{String(index + 1).padStart(2, '0')}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
          <div className="school-live-cta">
            <div>
              <h3>{content.admissions.heading}</h3>
              <p>{content.admissions.text}</p>
            </div>
            <Link className="school-live-btn school-live-btn-solid" to="/admissions/apply">
              {content.admissions.primaryAction} →
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .school-live-page {
          --cream: var(--school-live-text);
          --ink: var(--school-live-bg);
          --gold: var(--school-live-primary);
          --gold-light: var(--school-live-primary-light);
          --school-live-panel: color-mix(in srgb, var(--school-live-surface) 76%, transparent);
          --school-live-panel-strong: color-mix(in srgb, var(--school-live-surface) 92%, transparent);
          --school-live-border: color-mix(in srgb, var(--school-live-primary) 18%, transparent);
          --school-live-hero-text: #ffffff;
          --school-live-hero-muted: rgba(255,255,255,.78);
          position: relative;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--school-live-primary-light) 16%, transparent), transparent 30%),
            radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--school-live-primary) 10%, transparent), transparent 28%),
            var(--school-live-bg);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
        }

        .school-live-grain {
          position: fixed;
          inset: 0;
          z-index: 999;
          pointer-events: none;
          opacity: 0.028;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .school-live-scanline {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 998;
          height: 2px;
          pointer-events: none;
          background: color-mix(in srgb, var(--school-live-primary) 20%, transparent);
          animation: schoolLiveScan 6s linear infinite;
        }

        @keyframes schoolLiveScan {
          0% { top: -2px; }
          100% { top: 100vh; }
        }

        .school-live-hero {
          position: relative;
          display: flex;
          min-height: 100vh;
          height: 100svh;
          min-height: 600px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .school-live-video {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.88) contrast(1.06);
          will-change: transform;
        }

        .school-live-tint {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(170deg, rgba(15,23,42,.54) 0%, rgba(15,23,42,.2) 44%, rgba(15,23,42,.62) 100%);
        }

        .school-live-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 50%, transparent 34%, rgba(15,23,42,.58) 100%);
        }

        .school-live-time {
          position: absolute;
          top: 1.9rem;
          right: clamp(1rem, 4vw, 2.5rem);
          z-index: 6;
          min-width: 74px;
          text-align: right;
          font-size: 11px;
          letter-spacing: .1em;
          color: rgba(255,255,255,.7);
        }

        .school-live-badge {
          position: absolute;
          top: 5.2rem;
          right: clamp(1rem, 4vw, 2.5rem);
          z-index: 6;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.82);
        }

        .school-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--school-live-danger);
          box-shadow: 0 0 0 0 rgba(224,69,69,.4);
          animation: schoolLivePulse 1.6s ease-in-out infinite;
        }

        @keyframes schoolLivePulse {
          0% { box-shadow: 0 0 0 0 rgba(224,69,69,.5); }
          60% { box-shadow: 0 0 0 7px rgba(224,69,69,0); }
          100% { box-shadow: 0 0 0 0 rgba(224,69,69,0); }
        }

        .school-live-hero-content {
          position: relative;
          z-index: 5;
          max-width: 820px;
          padding: 0 1.5rem;
          text-align: center;
          animation: schoolLiveFadeUp 1.2s cubic-bezier(.16,1,.3,1) .3s both;
        }

        @keyframes schoolLiveFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .school-live-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 0 0 1.4rem;
          color: var(--school-live-hero-text);
          font-size: 10px;
          letter-spacing: .22em;
          text-transform: uppercase;
        }

        .school-live-eyebrow span {
          display: inline-block;
          width: 36px;
          height: 1px;
          background: var(--school-live-hero-text);
          opacity: .6;
        }

        .school-live-title {
          margin: 0 0 1.4rem;
          color: var(--school-live-hero-text);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 7vw, 80px);
          font-weight: 300;
          line-height: 1.06;
          letter-spacing: -0.01em;
        }

        .school-live-title em {
          color: var(--school-live-primary-light);
          font-style: italic;
        }

        .school-live-subtitle {
          max-width: 460px;
          margin: 0 auto 2.5rem;
          color: var(--school-live-hero-muted);
          font-size: 15px;
          font-weight: 300;
          line-height: 1.8;
          letter-spacing: .02em;
        }

        .school-live-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
        }

        .school-live-btn {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          padding: 13px 30px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: .14em;
          text-decoration: none;
          text-transform: uppercase;
          transition: all .25s;
        }

        .school-live-btn-solid {
          border: 1px solid var(--gold);
          background: var(--gold);
          color: #ffffff;
        }

        .school-live-btn-solid:hover {
          background: var(--gold-light);
          color: #ffffff;
        }

        .school-live-btn-outline {
          border: 1px solid rgba(255,255,255,.7);
          background: rgba(255,255,255,.16);
          color: #ffffff;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .school-live-btn-outline:hover {
          border-color: var(--gold);
          background: rgba(255,255,255,.24);
          color: #ffffff;
        }

        .school-live-ticker {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 10;
          display: flex;
          height: 42px;
          align-items: center;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,.34);
          background: rgba(255,255,255,.76);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .school-live-ticker-label {
          display: flex;
          height: 100%;
          flex-shrink: 0;
          align-items: center;
          gap: 8px;
          border-right: 1px solid var(--school-live-border);
          padding: 0 1.5rem;
          color: var(--gold);
          font-size: 10px;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .school-live-ticker-track {
          display: flex;
          white-space: nowrap;
          animation: schoolLiveTicker 28s linear infinite;
        }

        .school-live-ticker-set {
          display: flex;
          align-items: center;
        }

        .school-live-ticker-item {
          padding: 0 2.5rem;
          color: var(--school-live-muted);
          font-size: 12px;
          letter-spacing: .08em;
        }

        .school-live-ticker-sep {
          color: color-mix(in srgb, var(--school-live-primary) 46%, transparent);
          padding: 0 .5rem;
        }

        @keyframes schoolLiveTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .school-live-stats {
          display: flex;
          justify-content: center;
          border-bottom: 1px solid var(--school-live-border);
          background: var(--school-live-panel);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .school-live-stat {
          border-right: 1px solid var(--school-live-border);
          padding: 1.6rem 3.5rem;
          text-align: center;
        }

        .school-live-stat:last-child {
          border-right: 0;
        }

        .school-live-stat-value {
          color: var(--school-live-text);
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 300;
          line-height: 1;
        }

        .school-live-stat-label {
          margin-top: 6px;
          color: var(--school-live-primary);
          font-size: 10px;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .school-live-about {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          max-width: 1080px;
          margin: 0 auto;
          align-items: center;
          padding: 6rem 2.5rem;
          background: transparent;
        }

        .school-live-label {
          margin: 0 0 .9rem;
          color: var(--gold);
          font-size: 10px;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .school-live-section-title {
          margin: 0 0 1.4rem;
          color: var(--school-live-text);
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 300;
          line-height: 1.18;
        }

        .school-live-section-title-small {
          font-size: 36px;
        }

        .school-live-divider {
          width: 48px;
          height: 1px;
          margin: 1.8rem 0;
          background: var(--gold);
          opacity: .4;
        }

        .school-live-body {
          margin: 0 0 1rem;
          color: var(--school-live-muted);
          font-size: 14px;
          font-weight: 300;
          line-height: 1.9;
        }

        .school-live-features {
          display: flex;
          flex-direction: column;
          gap: .8rem;
          margin-top: 1.2rem;
        }

        .school-live-feature {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .school-live-feature span {
          width: 4px;
          height: 4px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--gold);
        }

        .school-live-feature p {
          margin: 0;
          color: var(--school-live-muted);
          font-size: 13px;
          letter-spacing: .03em;
        }

        .school-live-about-card {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          border: 1px solid var(--school-live-border);
          border-radius: 8px;
          background: var(--school-live-panel);
          box-shadow: 0 24px 70px rgba(15,23,42,.1);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        .school-live-about-inner {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(255,255,255,.82) 0%, color-mix(in srgb, var(--school-live-primary-light) 14%, white) 100%);
        }

        .school-live-about-inner svg {
          color: rgba(201,168,76,.16);
        }

        .school-live-frame {
          position: absolute;
          right: -10px;
          bottom: -10px;
          width: 80%;
          height: 80%;
          border: 1px solid var(--school-live-border);
          border-radius: 8px;
          pointer-events: none;
        }

        .school-live-tag {
          position: absolute;
          top: 1.2rem;
          left: 1.2rem;
          border: 1px solid var(--school-live-border);
          border-radius: 8px;
          background: var(--school-live-panel-strong);
          padding: 6px 12px;
          color: var(--gold);
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .school-live-life {
          padding: 6rem 2.5rem;
          background: color-mix(in srgb, var(--school-live-surface) 82%, transparent);
        }

        .school-live-inner {
          max-width: 1080px;
          margin: 0 auto;
        }

        .school-live-section-header {
          margin-bottom: 3.5rem;
        }

        .school-live-life-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--school-live-border);
        }

        .school-live-life-card {
          min-height: 226px;
          background: var(--school-live-panel-strong);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: 2.5rem 1.8rem;
          transition: background .3s;
        }

        .school-live-life-card:hover {
          background: color-mix(in srgb, var(--school-live-primary-light) 10%, white);
        }

        .school-live-life-card svg {
          display: block;
          margin-bottom: 1.2rem;
          color: var(--school-live-primary);
        }

        .school-live-life-card h3 {
          margin: 0 0 .7rem;
          color: var(--school-live-text);
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
        }

        .school-live-life-card p {
          margin: 0;
          color: var(--school-live-muted);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.8;
        }

        .school-live-admissions {
          padding: 6rem 2.5rem;
          background: transparent;
        }

        .school-live-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          margin: 3rem 0 0;
          background: var(--school-live-border);
        }

        .school-live-step {
          background: var(--school-live-panel-strong);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: 2rem 1.5rem;
        }

        .school-live-step div {
          margin-bottom: 1rem;
          color: color-mix(in srgb, var(--school-live-primary) 24%, transparent);
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 300;
          line-height: 1;
        }

        .school-live-step h3 {
          margin: 0 0 .6rem;
          color: var(--school-live-text);
          font-size: 13px;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .school-live-step p {
          margin: 0;
          color: var(--school-live-muted);
          font-size: 12px;
          font-weight: 300;
          line-height: 1.8;
        }

        .school-live-cta {
          display: flex;
          margin-top: 3.5rem;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          border: 1px solid var(--school-live-border);
          border-radius: 8px;
          background: var(--school-live-panel);
          box-shadow: 0 22px 60px rgba(15,23,42,.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 2.5rem;
        }

        .school-live-cta h3 {
          margin: 0;
          color: var(--school-live-text);
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
        }

        .school-live-cta p {
          margin: 4px 0 0;
          color: var(--school-live-muted);
          font-size: 13px;
          font-weight: 300;
        }

        @media (max-width: 900px) {
          .school-live-hero {
            min-height: 660px;
          }

          .school-live-stats,
          .school-live-about,
          .school-live-life-grid,
          .school-live-steps,
          .school-live-cta {
            display: grid;
            grid-template-columns: 1fr;
          }

          .school-live-stat {
            border-right: 0;
            border-bottom: 1px solid rgba(201,168,76,.1);
          }

          .school-live-about {
            gap: 3rem;
            padding: 5rem 1.4rem;
          }

          .school-live-life,
          .school-live-admissions {
            padding: 5rem 1.4rem;
          }

          .school-live-time {
            display: none;
          }

          .school-live-badge {
            top: 5rem;
          }
        }

        @media (max-width: 620px) {
          .school-live-title {
            font-size: clamp(42px, 15vw, 58px);
          }

          .school-live-eyebrow {
            flex-direction: column;
            gap: 8px;
          }

          .school-live-ticker-label {
            padding: 0 1rem;
          }

          .school-live-ticker-item {
            padding: 0 1.4rem;
          }
        }
      `}</style>
    </main>
  );
}
