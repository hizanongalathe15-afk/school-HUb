import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicAdRailProps {
  content: LandingContent;
}

export default function PublicAdRail({ content }: PublicAdRailProps) {
  const { t } = useTranslation();
  const ads = (content.managedMedia || []).filter((item) => item.section === 'ads' || item.type === 'ad').slice(0, 3);
  if (!ads.length) return null;

  return (
    <>
      <aside className="par-root" aria-label={t('public.adRail')}>
        {/* Rail header */}
        <div className="par-header">
          <div className="par-header-line" />
          <span className="par-header-label">{t('public.sponsored') || 'Sponsored'}</span>
          <div className="par-header-line" />
        </div>

        {/* Ad cards */}
        <div className="par-list">
          {ads.map((ad) => (
            <a
              key={ad.id}
              className="par-card"
              href={ad.url}
              target="_blank"
              rel="noreferrer"
              aria-label={ad.title}
            >
              {/* top beam */}
              <div className="par-beam" />

              {/* Media */}
              <div className="par-media">
                {ad.type === 'video' ? (
                  <video src={ad.url} muted playsInline controls preload="metadata" />
                ) : ['image', 'gif', 'meme', 'ad'].includes(ad.type) ? (
                  <img src={ad.url} alt={ad.title} loading="lazy" />
                ) : (
                  <div className="par-media-placeholder">
                    <span>{ad.type.toUpperCase()}</span>
                  </div>
                )}
                <div className="par-media-overlay" />
              </div>

              {/* Info */}
              <div className="par-info">
                <strong className="par-title">{ad.title}</strong>
                {ad.description && <small className="par-desc">{ad.description}</small>}
                <div className="par-cta">
                  {t('public.learnMore') || 'Learn more'}
                  <span className="par-arrow">→</span>
                </div>
              </div>

              {/* hover glow */}
              <div className="par-glow" />
            </a>
          ))}
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        .par-root {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: 'Sora', sans-serif;
          background: rgba(8,10,22,0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 20px 16px;
          overflow: hidden;
          isolation: isolate;
        }
        .par-root::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent,
            color-mix(in srgb, var(--public-gold-light) 70%, transparent) 30%,
            color-mix(in srgb, var(--public-gold) 50%, transparent) 70%,
            transparent
          );
        }

        /* header */
        .par-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }
        .par-header-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08));
        }
        .par-header-line:last-child {
          background: linear-gradient(270deg, transparent, rgba(255,255,255,0.08));
        }
        .par-header-label {
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(148,163,184,0.35);
          white-space: nowrap;
        }

        /* list */
        .par-list {
          display: flex; flex-direction: column; gap: 12px;
        }

        /* card */
        .par-card {
          position: relative;
          display: flex; flex-direction: column;
          background: rgba(12,15,30,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          isolation: isolate;
          text-decoration: none;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
        }
        .par-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: color-mix(in srgb, var(--public-gold-light) 35%, transparent);
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--public-gold-light) 25%, transparent),
            0 16px 40px rgba(0,0,0,0.4);
        }
        .par-card:hover .par-glow { opacity: 1; }
        .par-card:hover .par-beam { opacity: 1; }
        .par-card:hover .par-arrow { transform: translateX(4px); }
        .par-card:hover .par-media img,
        .par-card:hover .par-media video { transform: scale(1.04); }

        .par-beam {
          position: absolute; top: 0; left: 10%; right: 10%; height: 1.5px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--public-gold-light) 70%, transparent), transparent);
          opacity: 0; transition: opacity 0.3s;
          z-index: 2;
        }
        .par-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--public-gold) 8%, transparent), transparent 60%);
          opacity: 0; transition: opacity 0.4s;
          pointer-events: none;
        }

        /* media */
        .par-media {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
        }
        .par-media img,
        .par-media video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .par-media-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(8,10,22,0.6) 100%);
          pointer-events: none;
        }
        .par-media-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: rgba(148,163,184,0.3);
          letter-spacing: 0.12em;
        }

        /* info */
        .par-info {
          padding: 12px 14px 14px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .par-title {
          font-size: 13px; font-weight: 600;
          color: var(--public-text);
          line-height: 1.3;
          display: block;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .par-desc {
          font-size: 11.5px;
          color: rgba(148,163,184,0.45);
          display: block;
          line-height: 1.5;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-weight: 300;
        }
        .par-cta {
          margin-top: 6px;
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--public-gold);
        }
        .par-arrow {
          display: inline-block;
          transition: transform 0.25s ease;
          font-size: 12px;
        }
      `}</style>
    </>
  );
}