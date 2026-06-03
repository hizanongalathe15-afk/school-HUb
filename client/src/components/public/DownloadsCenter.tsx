import { Download, FileText, QrCode, FileCheck, FileClock, FileHeart, CalendarRange } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function DownloadsCenter({ content }: PublicContentProps) {
  const { t } = useTranslation();

  const documents = [
    { name: 'Admission form', docType: 'admission', labelKey: 'public.admissionForm', icon: FileCheck, color: 'var(--public-gold)', glow: 'color-mix(in srgb, var(--public-gold) 15%, transparent)', pages: '4 pages', size: '128 KB' },
    { name: 'Fee structure', docType: 'fee-structure', labelKey: 'public.feeStructure', icon: FileClock, color: 'var(--public-gold)', glow: 'color-mix(in srgb, var(--public-gold-light) 15%, transparent)', pages: '2 pages', size: '64 KB' },
    { name: 'Medical form', docType: 'medical', labelKey: 'public.medicalForm', icon: FileHeart, color: 'var(--public-gold)', glow: 'color-mix(in srgb, var(--public-gold-light) 15%, transparent)', pages: '3 pages', size: '96 KB' },
    { name: 'School calendar', docType: 'calendar', labelKey: 'public.schoolCalendar', icon: CalendarRange, color: 'var(--public-gold)', glow: 'color-mix(in srgb, var(--public-gold-light) 15%, transparent)', pages: '12 pages', size: '512 KB' },
  ];

  const handleDownload = (docType: string, docName: string) => {
    try {
      const link = document.createElement('a');
      link.href = `/public/documents/${docType}.pdf`;
      link.download = `${content.school.name} - ${docName}.pdf`;
      link.click();
      toast.success(`Downloading ${docName}`);
    } catch {
      toast.error(`Failed to download ${docName}`);
    }
  };

  return (
    <>
      <section className="dc-root">
        {/* Atmospheric bg */}
        <div className="dc-bg" aria-hidden="true">
          <div className="dc-grid-tex" />
          <div className="dc-orb dc-orb--a" />
          <div className="dc-orb dc-orb--b" />
        </div>

        {/* Header */}
        <header className="dc-header">
          <div className="dc-eyebrow">
            <span className="dc-dot" />
            {t('public.downloads')}
          </div>
          <h2 className="dc-title">{t('public.downloadsHeading')}</h2>
        </header>

        {/* Document cards */}
        <div className="dc-grid">
          {documents.map(({ docType, labelKey, icon: Icon, color, glow, pages, size, name }) => (
            <article
              key={docType}
              className="dc-card"
              style={{ '--accent': color, '--glow': glow } as React.CSSProperties}
            >
              <div className="dc-card-beam" />

              <div className="dc-card-top">
                <div className="dc-file-icon">
                  <Icon size={22} strokeWidth={1.4} />
                  <div className="dc-file-ext">PDF</div>
                </div>
                <div className="dc-meta">
                  <span className="dc-meta-chip">{pages}</span>
                  <span className="dc-meta-chip">{size}</span>
                </div>
              </div>

              <h3 className="dc-card-name">{t(labelKey)}</h3>
              <p className="dc-card-desc">{t('public.downloadsDescription', { schoolName: content.school.name })}</p>

              <button
                type="button"
                className="dc-btn"
                onClick={() => handleDownload(docType, name)}
              >
                <span className="dc-btn-icon">
                  <Download size={14} strokeWidth={2} />
                </span>
                {t('common.download')}
                <span className="dc-btn-arrow">→</span>
              </button>

              {/* hover glow */}
              <div className="dc-card-glow" />
            </article>
          ))}

          {/* QR verify card */}
          <article className="dc-card dc-card--verify">
            <div className="dc-card-beam" style={{ '--accent': 'var(--public-muted)' } as React.CSSProperties} />
            <div className="dc-qr-icon">
              <QrCode size={28} strokeWidth={1.2} />
            </div>
            <h3 className="dc-card-name">{t('public.verifyDocument')}</h3>
            <p className="dc-card-desc">{t('public.verifyDocumentDescription')}</p>
            <div className="dc-verify-grid" aria-hidden="true">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={`dc-verify-cell ${Math.random() > 0.5 ? 'dc-verify-cell--on' : ''}`} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .dc-root {
          position: relative;
          overflow: hidden;
          padding: clamp(72px,10vw,120px) clamp(20px,6vw,88px);
          background: var(--public-bg);
          font-family: 'Sora', sans-serif;
          isolation: isolate;
        }

        /* bg */
        .dc-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .dc-grid-tex {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }
        .dc-orb {
          position: absolute; border-radius: 50%;
          filter: blur(90px);
          animation: dcOrbFloat 20s ease-in-out infinite alternate;
        }
        .dc-orb--a {
          width: 500px; height: 500px; top: -200px; right: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold-light) 18%, transparent) 0%, transparent 70%);
        }
        .dc-orb--b {
          width: 400px; height: 400px; bottom: -100px; left: -80px;
          background: radial-gradient(circle, color-mix(in srgb, var(--public-gold) 14%, transparent) 0%, transparent 70%);
          animation-duration: 26s; animation-delay: -8s;
        }
        @keyframes dcOrbFloat {
          0%   { transform: translate(0,0); }
          100% { transform: translate(40px, 30px); }
        }

        /* header */
        .dc-header {
          position: relative; z-index: 2;
          margin-bottom: clamp(40px,6vw,64px);
          animation: dcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .dc-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--public-gold-light);
          background: color-mix(in srgb, var(--public-gold) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 20%, transparent);
          border-radius: 100px;
          padding: 5px 16px;
          margin-bottom: 20px;
        }
        .dc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--public-gold);
          box-shadow: 0 0 8px color-mix(in srgb, var(--public-gold-light) 80%, transparent);
          animation: dcDotPulse 2s ease-in-out infinite;
        }
        @keyframes dcDotPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.7);} }
        .dc-title {
          font-size: clamp(30px,4.5vw,54px);
          font-weight: 700;
          color: var(--public-text);
          margin: 0;
          line-height: 1.15;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--public-text) 0%, rgba(148,163,184,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* grid */
        .dc-grid {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* card */
        .dc-card {
          position: relative;
          background: rgba(15,18,35,0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 26px 26px;
          display: flex; flex-direction: column; gap: 12px;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s;
          animation: dcFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
          isolation: isolate;
        }
        .dc-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent, rgba(255,255,255,0.15));
          box-shadow: 0 0 0 1px var(--accent, transparent), 0 20px 60px var(--glow, rgba(0,0,0,0.3));
        }
        .dc-card:hover .dc-card-glow { opacity: 1; }
        .dc-card:hover .dc-card-beam { opacity: 1; transform: scaleX(1); }
        .dc-card:hover .dc-btn { background: var(--accent); color: var(--public-bg); border-color: var(--accent); }
        .dc-card:hover .dc-btn-icon { background: rgba(0,0,0,0.15); }

        .dc-card-beam {
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, var(--public-gold)), transparent);
          transform: scaleX(0);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
        }
        .dc-card-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% -20%, var(--glow, transparent) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
          z-index: -1;
        }

        .dc-card-top {
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .dc-file-icon {
          position: relative;
          width: 48px; height: 56px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px 10px 4px 4px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent, var(--public-gold));
          flex-shrink: 0;
        }
        .dc-file-icon::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 12px; height: 12px;
          background: var(--accent, var(--public-gold));
          opacity: 0.4;
          clip-path: polygon(100% 0, 0 0, 100% 100%);
          border-radius: 0 10px 0 0;
        }
        .dc-file-ext {
          position: absolute;
          bottom: -1px; left: 50%;
          transform: translateX(-50%);
          font-family: 'DM Mono', monospace;
          font-size: 7px; font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--accent, var(--public-gold));
          background: rgba(5,7,16,0.9);
          border: 1px solid var(--accent, rgba(255,255,255,0.1));
          border-radius: 3px;
          padding: 1px 4px;
          white-space: nowrap;
        }
        .dc-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .dc-meta-chip {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: rgba(148,163,184,0.5);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
        }

        .dc-card-name {
          font-size: 15px; font-weight: 600;
          color: var(--public-text);
          margin: 0;
          line-height: 1.3;
        }
        .dc-card-desc {
          font-size: 12.5px;
          color: rgba(148,163,184,0.5);
          margin: 0;
          line-height: 1.6;
          font-weight: 300;
          flex: 1;
        }

        .dc-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Sora', sans-serif;
          font-size: 12.5px; font-weight: 500;
          background: transparent;
          color: var(--accent, var(--public-gold));
          border: 1px solid var(--accent, color-mix(in srgb, var(--public-gold-light) 30%, transparent));
          border-radius: 10px;
          padding: 9px 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          align-self: flex-start;
          margin-top: auto;
        }
        .dc-btn:hover { transform: translateY(-1px); }
        .dc-btn-icon {
          width: 22px; height: 22px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.25s;
        }
        .dc-btn-arrow { margin-left: auto; font-size: 13px; transition: transform 0.2s; }
        .dc-btn:hover .dc-btn-arrow { transform: translateX(3px); }

        /* verify card */
        .dc-card--verify { cursor: default; }
        .dc-card--verify:hover { transform: none; border-color: rgba(100,116,139,0.4); box-shadow: none; }
        .dc-qr-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(148,163,184,0.5);
        }
        .dc-verify-grid {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 3px; margin-top: 4px;
          opacity: 0.3;
        }
        .dc-verify-cell {
          height: 10px; border-radius: 2px;
          background: rgba(255,255,255,0.05);
        }
        .dc-verify-cell--on { background: rgba(100,116,139,0.5); }

        @keyframes dcFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .dc-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
