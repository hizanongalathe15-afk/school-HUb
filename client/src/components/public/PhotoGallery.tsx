import { useTranslation } from 'react-i18next';
import { Play, Image as ImageIcon } from 'lucide-react';
import type { Accent, LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function PhotoGallery({ content }: PublicContentProps) {
  const { t } = useTranslation();

  type GalleryItem = {
    title: string;
    subtitle: string;
    image: string;
    accent: Accent;
    type: 'image' | 'video';
  };

  const managedImages = (content.managedMedia || [])
    .filter((item) => item.type === 'image' || item.type === 'video')
    .map((item): GalleryItem => ({
      title: item.title,
      subtitle: item.description || item.section,
      image: item.url,
      accent: 'teal',
      type: item.type === 'video' ? 'video' : 'image',
    }));

  const images: GalleryItem[] = managedImages
    .concat(content.heroSlides.map((slide): GalleryItem => ({ ...slide, type: 'image' })))
    .concat(
      content.values.map((value): GalleryItem => ({
        title: value.title,
        subtitle: value.description,
        image: value.image,
        accent: value.accent,
        type: 'image' as const,
      }))
    )
    .slice(0, 6);

  return (
    <>
      <section className="pg-root">
        {/* bg */}
        <div className="pg-bg" aria-hidden="true">
          <div className="pg-grid" />
          <div className="pg-orb pg-orb--1" />
          <div className="pg-orb pg-orb--2" />
        </div>

        {/* Header */}
        <header className="pg-header">
          <span className="pg-eyebrow">{t('public.gallery')}</span>
          <h2 className="pg-title">{t('public.galleryHeading')}</h2>
        </header>

        {/* Gallery grid */}
        <div className="pg-grid-items">
          {images.map((item, i) => (
            <article
              key={`${item.title}-${item.image}`}
              className={`pg-item pg-item--${i === 0 ? 'featured' : 'normal'}`}
              style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
            >
              {/* media */}
              <div className="pg-media">
                {item.type === 'video' ? (
                  <video src={item.image} controls preload="metadata" />
                ) : (
                  <img src={item.image} alt={item.title} loading="lazy" />
                )}

                {/* overlay */}
                <div className="pg-overlay">
                  <div className="pg-overlay-icon">
                    {item.type === 'video'
                      ? <Play size={22} strokeWidth={1.5} />
                      : <ImageIcon size={18} strokeWidth={1.5} />
                    }
                  </div>
                </div>
              </div>

              {/* caption */}
              <div className="pg-caption">
                <h3 className="pg-caption-title">{item.title}</h3>
                <p className="pg-caption-sub">{item.subtitle}</p>
              </div>

              {/* hover border glow */}
              <div className="pg-item-glow" aria-hidden="true" />
            </article>
          ))}
        </div>

        {/* bottom count */}
        <div className="pg-footer">
          <span className="pg-count">
            {images.length} {t('public.galleryItems') || 'media items'}
          </span>
          <div className="pg-footer-line" />
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .pg-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px,10vw,120px) clamp(20px,6vw,88px) clamp(56px,8vw,88px);
          background: var(--public-bg);
          font-family: 'Sora', sans-serif;
          isolation: isolate;
        }

        /* bg */
        .pg-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .pg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black, transparent);
        }
        .pg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(110px);
          animation: pgOrbFloat 26s ease-in-out infinite alternate;
        }
        .pg-orb--1 {
          width: 600px; height: 600px; top: -200px; right: -120px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 18%, transparent) 0%, transparent 70%);
        }
        .pg-orb--2 {
          width: 500px; height: 500px; bottom: -150px; left: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 14%, transparent) 0%, transparent 70%);
          animation-duration: 32s; animation-delay: -12s;
        }
        @keyframes pgOrbFloat {
          0% { transform: translate(0,0); }
          100% { transform: translate(40px, 30px); }
        }

        /* header */
        .pg-header {
          position: relative; z-index: 2;
          margin-bottom: clamp(40px,6vw,64px);
          animation: pgFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .pg-eyebrow {
          display: inline-block;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--public-gold-light);
          background: color-mix(in srgb, var(--public-gold) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold) 20%, transparent);
          border-radius: 100px;
          padding: 5px 16px;
          margin-bottom: 20px;
        }
        .pg-title {
          font-size: clamp(30px,4.5vw,54px);
          font-weight: 700;
          margin: 0;
          line-height: 1.12;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--public-text) 0%, rgba(148,163,184,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          max-width: 600px;
        }

        /* gallery grid */
        .pg-grid-items {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto;
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* gallery item */
        .pg-item {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          isolation: isolate;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
          animation: pgFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay,0s) both;
          background: rgba(12,15,30,0.8);
        }
        .pg-item--featured {
          grid-column: span 2;
        }
        .pg-item:hover {
          transform: scale(1.02) translateY(-4px);
          border-color: color-mix(in srgb, var(--public-gold-light) 40%, transparent);
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--public-gold-light) 30%, transparent),
            0 24px 60px rgba(0,0,0,0.5);
          z-index: 1;
        }
        .pg-item:hover .pg-overlay { opacity: 1; }
        .pg-item:hover .pg-caption { transform: translateY(0); opacity: 1; }
        .pg-item:hover .pg-media img,
        .pg-item:hover .pg-media video { transform: scale(1.04); }
        .pg-item:hover .pg-item-glow { opacity: 1; }

        .pg-item-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--public-gold) 10%, transparent) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.4s;
          pointer-events: none;
        }

        /* media */
        .pg-media {
          position: relative;
          aspect-ratio: 16/10;
          overflow: hidden;
        }
        .pg-item--featured .pg-media { aspect-ratio: 16/9; }
        .pg-media img,
        .pg-media video {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
          display: block;
        }

        /* overlay */
        .pg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5,7,16,0.1) 0%,
            rgba(5,7,16,0.55) 100%
          );
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .pg-overlay-icon {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--public-text);
          transform: scale(0.8);
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .pg-item:hover .pg-overlay-icon { transform: scale(1); }

        /* caption */
        .pg-caption {
          padding: 14px 16px 16px;
          transform: translateY(6px);
          opacity: 0.85;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
        }
        .pg-caption-title {
          font-size: 14px; font-weight: 600;
          color: var(--public-text);
          margin: 0 0 4px;
          line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pg-caption-sub {
          font-size: 12px;
          color: rgba(148,163,184,0.5);
          margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-weight: 300;
        }

        /* footer */
        .pg-footer {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 20px;
          margin-top: clamp(32px,5vw,56px);
          max-width: 1100px; margin-left: auto; margin-right: auto;
        }
        .pg-count {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(148,163,184,0.35);
          white-space: nowrap;
        }
        .pg-footer-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06), transparent);
        }

        @keyframes pgFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 800px) {
          .pg-grid-items { grid-template-columns: repeat(2,1fr); }
          .pg-item--featured { grid-column: span 2; }
        }
        @media (max-width: 540px) {
          .pg-grid-items { grid-template-columns: 1fr; }
          .pg-item--featured { grid-column: span 1; }
          .pg-caption { opacity: 1; transform: none; }
        }
      `}</style>
    </>
  );
}