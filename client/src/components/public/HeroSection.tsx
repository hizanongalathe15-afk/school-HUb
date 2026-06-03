import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { LandingContent } from '../../types';
import { accentClass } from './SchoolLandingPage';

interface HeroSectionProps {
  content: LandingContent;
  activeHero: LandingContent['heroSlides'][number];
  activeSlide: number;
  onSlideChange: (index: number) => void;
}

export default function HeroSection({
  content,
  activeHero,
  activeSlide,
  onSlideChange
}: HeroSectionProps) {
  const { t } = useTranslation();
  const logoSrc = content.school.logo || '/assets/logo/favicon_io/android-chrome-512x512.png';
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 });
  const [cursorDotPos, setCursorDotPos] = useState({ x: -200, y: -200 });
  const [isHovering, setIsHovering] = useState(false);
  const [titleKey, setTitleKey] = useState(0);
  const rafRef = useRef<number>(0);
  const targetPos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.playbackRate = activeHero.playbackRate || 1;
    }
    setTitleKey(k => k + 1);
  }, [activeHero.playbackRate, activeHero.video, activeHero.title]);

  // Magnetic cursor
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const onMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setCursorDotPos({ x: e.clientX, y: e.clientY });
    };

    const animate = () => {
      setCursorPos(prev => ({
        x: prev.x + (targetPos.current.x - prev.x) * 0.12,
        y: prev.y + (targetPos.current.y - prev.y) * 0.12,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };

    hero.addEventListener('mousemove', onMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      hero.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const media = hero.querySelector<HTMLElement>('.hero-image, .hero-video');
      if (media) {
        media.style.transform = `scale(1.08) translate(${x * -18}px, ${y * -12}px)`;
      }
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <section
        id="home"
        className={`hero ${accentClass[activeHero.accent]}`}
        ref={heroRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Custom cursor */}
        <div
          className={`hero-cursor ${isHovering ? 'hero-cursor--visible' : ''}`}
          ref={cursorRef}
          style={{ transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)` }}
        />
        <div
          className={`hero-cursor-dot ${isHovering ? 'hero-cursor-dot--visible' : ''}`}
          ref={cursorDotRef}
          style={{ transform: `translate(${cursorDotPos.x}px, ${cursorDotPos.y}px)` }}
        />

        {/* Media */}
        {activeHero.video ? (
          <video
            ref={heroVideoRef}
            src={activeHero.video}
            className="hero-image hero-video"
            poster={activeHero.image}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img src={activeHero.image} alt={activeHero.subtitle} className="hero-image" />
        )}

        {/* Layered overlays */}
        <div className="hero-overlay" />
        <div className="hero-overlay-grain" aria-hidden="true" />
        <div className="hero-overlay-vignette" aria-hidden="true" />

        {/* Floating badge */}
        <div className="hero-live-badge" aria-hidden="true">
          <span className="hero-live-dot" />
          <span>Live Campus</span>
        </div>

        {/* Content */}
        <div className="hero-content">
          <div className="hero-logo-lockup" aria-label={content.school.name}>
            <div className="hero-logo-ring">
              <img src={logoSrc} alt="" aria-hidden="true" />
            </div>
            <span>{content.school.name}</span>
          </div>

          <p className="eyebrow hero-typewriter">{content.school.tagline}</p>

          <h1 key={titleKey} className="hero-title animate-fade-up">
            {activeHero.title.split(' ').map((word, i) => (
              <span
                key={`${titleKey}-${i}`}
                className="hero-word"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {word}
                {i < activeHero.title.split(' ').length - 1 ? '\u00a0' : ''}
              </span>
            ))}
          </h1>

          <p className="hero-subtitle">{activeHero.subtitle}</p>

          <div className="hero-actions">
            <Link to="/admissions" className="pulse-cta hero-cta-primary">
              <span className="hero-cta-text">{content.admissions.primaryAction}</span>
              <span className="hero-cta-arrow">→</span>
            </Link>
            <Link to="/about" className="hero-cta-secondary">
              {content.admissions.secondaryAction}
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="hero-scroll-hint" aria-hidden="true">
            <div className="hero-scroll-mouse">
              <div className="hero-scroll-wheel" />
            </div>
            <span>Scroll</span>
          </div>
        </div>

        {/* Slide controls */}
        <div className="slide-controls hero-slide-controls" aria-label={t('public.heroSlides')}>
          {content.heroSlides.map((slide, index) => (
            <button
              key={`${slide.title}-${index}`}
              type="button"
              className={`hero-slide-btn ${index === activeSlide ? 'active' : ''}`}
              aria-label={t('public.showSlide', { title: slide.title })}
              onClick={() => onSlideChange(index)}
            >
              <span className="hero-slide-progress" />
            </button>
          ))}
        </div>

      </section>

      <style>{`
        .hero {
          position: relative;
          overflow: hidden;
          min-height: 100svh;
          display: flex;
          align-items: center;
          cursor: none;
          background: var(--public-bg);
        }

        /* ── Cursor ── */
        .hero-cursor, .hero-cursor-dot {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s;
          top: 0; left: 0;
          will-change: transform;
        }
        .hero-cursor--visible, .hero-cursor-dot--visible { opacity: 1; }
        .hero-cursor {
          width: 48px; height: 48px;
          margin: -24px 0 0 -24px;
          border: 1.5px solid rgba(255,255,255,0.6);
          mix-blend-mode: difference;
          transition: opacity 0.3s, width 0.3s, height 0.3s;
        }
        .hero-cursor-dot {
          width: 6px; height: 6px;
          margin: -3px 0 0 -3px;
          background: white;
          mix-blend-mode: difference;
        }

        /* ── Media ── */
        .hero-image, .hero-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.1s linear;
          transform: scale(1.08);
          filter: saturate(0.88) contrast(1.06);
        }

        /* ── Overlays ── */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            170deg,
            rgba(15,23,42,0.58) 0%,
            rgba(15,23,42,0.22) 45%,
            rgba(15,23,42,0.78) 100%
          );
          z-index: 1;
        }
        .hero-overlay-grain {
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px;
        }
        .hero-overlay-vignette {
          position: absolute;
          inset: 0;
          z-index: 3;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 32%, rgba(15,23,42,0.72) 100%);
        }

        /* ── Live badge ── */
        .hero-live-badge {
          position: absolute;
          top: 28px; right: 28px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }
        .hero-live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--public-danger);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--public-danger) 50%, transparent);
          animation: livePulse 1.6s ease-in-out infinite;
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--public-danger) 50%, transparent); }
          60% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--public-danger) 0%, transparent); }
        }

        /* ── Content ── */
        .hero-content {
          position: relative;
          z-index: 10;
          padding: clamp(80px, 12vw, 140px) clamp(24px, 7vw, 100px);
          max-width: 820px;
          animation: heroFadeUp 1.2s cubic-bezier(0.16,1,0.3,1) 0.18s both;
        }

        .hero-logo-lockup {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          animation: fadeSlideIn 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .hero-logo-ring {
          position: relative;
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
        }
        .hero-logo-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .hero-logo-ring img {
          width: 32px; height: 32px;
          object-fit: contain;
          border-radius: 50%;
        }
        .hero-logo-lockup span {
          font-size: clamp(13px, 1.6vw, 15px);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
        }

        .eyebrow.hero-typewriter {
          animation: fadeSlideIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }

        /* ── Title ── */
        .hero-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(44px, 7vw, 86px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: 0;
          color: #ffffff;
          margin: 12px 0 20px;
          display: flex;
          flex-wrap: wrap;
        }
        .hero-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(40px) rotateX(-20deg);
          animation: wordReveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes wordReveal {
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        .hero-subtitle {
          font-size: clamp(14px, 1.6vw, 16px);
          color: rgba(255,255,255,0.78);
          line-height: 1.8;
          margin: 0 0 40px;
          max-width: 500px;
          font-weight: 300;
          animation: fadeSlideIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s both;
        }

        /* ── CTAs ── */
        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
          animation: fadeSlideIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both;
        }
        .hero-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 32px;
          background: var(--public-gold);
          color: var(--public-bg);
          border: 1px solid var(--public-gold);
          border-radius: 2px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease;
        }
        .hero-cta-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .hero-cta-primary:hover::before { transform: translateX(100%); }
        .hero-cta-primary:hover {
          transform: translateY(-3px);
          background: var(--public-gold-light);
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
        }
        .hero-cta-arrow {
          transition: transform 0.25s ease;
        }
        .hero-cta-primary:hover .hero-cta-arrow { transform: translateX(4px); }

        .hero-cta-secondary {
          padding: 15px 28px;
          border: 1px solid color-mix(in srgb, var(--public-gold) 55%, transparent);
          border-radius: 2px;
          color: var(--public-gold-light);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(8px);
          background: color-mix(in srgb, var(--public-gold) 7%, transparent);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .hero-cta-secondary:hover {
          background: color-mix(in srgb, var(--public-gold) 16%, transparent);
          border-color: var(--public-gold);
          transform: translateY(-3px);
        }

        /* ── Scroll hint ── */
        .hero-scroll-hint {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 60px;
          animation: fadeSlideIn 1s cubic-bezier(0.22,1,0.36,1) 1s both;
        }
        .hero-scroll-mouse {
          width: 24px; height: 38px;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }
        .hero-scroll-wheel {
          width: 3px; height: 8px;
          background: rgba(255,255,255,0.7);
          border-radius: 2px;
          animation: scrollWheel 2s ease-in-out infinite;
        }
        @keyframes scrollWheel {
          0% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(10px); opacity: 0; }
          61% { transform: translateY(0); opacity: 0; }
          100% { opacity: 1; }
        }
        .hero-scroll-hint span {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        /* ── Slide controls ── */
        .hero-slide-controls {
          position: absolute;
          bottom: 40px;
          right: 40px;
          z-index: 10;
          display: flex;
          gap: 10px;
        }
        .hero-slide-btn {
          position: relative;
          width: 36px; height: 3px;
          border: none;
          background: rgba(255,255,255,0.28);
          border-radius: 2px;
          cursor: pointer;
          overflow: hidden;
          padding: 0;
          transition: background 0.3s;
        }
        .hero-slide-btn.active { background: color-mix(in srgb, var(--public-gold) 32%, transparent); }
        .hero-slide-btn.active .hero-slide-progress {
          position: absolute;
          inset-y: 0; left: 0;
          width: 0%;
          background: var(--public-gold);
          animation: slideProgress 5.2s linear forwards;
        }
        @keyframes slideProgress {
          to { width: 100%; }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .hero-live-badge { top: 16px; right: 16px; }
          .hero-content { padding: 100px 24px 80px; }
        }
      `}</style>
    </>
  );
}
