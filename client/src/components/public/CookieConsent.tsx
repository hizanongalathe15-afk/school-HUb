import { useEffect, useState } from 'react';
import { Settings, ShieldCheck, X, Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type CookieChoice = {
  necessary: true;
  analytics: boolean;
  media: boolean;
  ads: boolean;
};

const KEY = 'school-hub-cookie-consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [choice, setChoice] = useState<CookieChoice>({ necessary: true, analytics: true, media: true, ads: false });

  useEffect(() => {
    setOpen(!window.localStorage.getItem(KEY));
  }, []);

  function save(next: CookieChoice) {
    window.localStorage.setItem(KEY, JSON.stringify({ ...next, savedAt: new Date().toISOString() }));
    setChoice(next);
    setOpen(false);
  }

  if (!open) return null;

  const toggleItems = [
    { key: 'analytics', label: t('cookie.analyticsCookies'), value: choice.analytics, onChange: (v: boolean) => setChoice({ ...choice, analytics: v }) },
    { key: 'media', label: t('cookie.mediaCookies'), value: choice.media, onChange: (v: boolean) => setChoice({ ...choice, media: v }) },
    { key: 'ads', label: t('cookie.adsCookies'), value: choice.ads, onChange: (v: boolean) => setChoice({ ...choice, ads: v }) },
  ];

  return (
    <>
      <section className="cc-backdrop" role="dialog" aria-modal="true" aria-label={t('cookie.cookiePreferences')}>
        <div className="cc-panel">
          {/* Top beam */}
          <div className="cc-beam" aria-hidden="true" />

          {/* Header */}
          <div className="cc-header">
            <div className="cc-icon-badge">
              <ShieldCheck size={18} strokeWidth={1.6} />
            </div>
            <div className="cc-header-text">
              <h2 className="cc-title">{t('cookie.privacyPreferences')}</h2>
              <p className="cc-sub">{t('cookie.choosePreferences')}</p>
            </div>
            <button
              type="button"
              className="cc-close"
              aria-label={t('cookie.closePreferences')}
              onClick={() => save({ necessary: true, analytics: false, media: false, ads: false })}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Divider */}
          <div className="cc-divider" />

          {/* Always-on necessary row */}
          <div className="cc-row cc-row--locked">
            <div className="cc-row-info">
              <span className="cc-row-label">{t('cookie.requiredCookies')}</span>
              <span className="cc-row-badge">{t('cookie.alwaysOn') || 'Always on'}</span>
            </div>
            <div className="cc-toggle cc-toggle--on cc-toggle--disabled" aria-disabled="true">
              <div className="cc-toggle-thumb" />
            </div>
          </div>

          {/* Expandable customize section */}
          {customize && (
            <div className="cc-options">
              {toggleItems.map(({ key, label, value, onChange }) => (
                <div className="cc-row" key={key}>
                  <span className="cc-row-label">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    className={`cc-toggle ${value ? 'cc-toggle--on' : ''}`}
                    onClick={() => onChange(!value)}
                  >
                    <div className="cc-toggle-thumb" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="cc-divider" />

          {/* Actions */}
          <div className="cc-actions">
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setCustomize((v) => !v)}>
              <Settings size={14} strokeWidth={1.8} />
              {t('cookie.customize')}
            </button>
            <button type="button" className="cc-btn cc-btn--outline" onClick={() => save({ necessary: true, analytics: false, media: false, ads: false })}>
              {t('cookie.rejectOptional')}
            </button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={() => save({ necessary: true, analytics: true, media: true, ads: true })}>
              {t('cookie.acceptAll')}
            </button>
            {customize && (
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => save(choice)}>
                {t('cookie.saveChoices')}
              </button>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        .cc-backdrop {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: min(560px, calc(100vw - 32px));
          animation: ccSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Sora', sans-serif;
        }
        @keyframes ccSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .cc-panel {
          background: rgba(10, 12, 24, 0.92);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 32px 80px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.04),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* top gradient beam */
        .cc-beam {
          height: 2px;
          background: linear-gradient(90deg,
            color-mix(in srgb, var(--public-gold) 0%, transparent) 0%,
            color-mix(in srgb, var(--public-gold-light) 90%, transparent) 30%,
            color-mix(in srgb, var(--public-gold) 70%, transparent) 70%,
            color-mix(in srgb, var(--public-gold) 0%, transparent) 100%
          );
        }

        /* Header */
        .cc-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 22px 16px;
        }
        .cc-icon-badge {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--public-gold-light) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold-light) 25%, transparent);
          display: flex; align-items: center; justify-content: center;
          color: var(--public-gold-light);
          flex-shrink: 0;
        }
        .cc-header-text { flex: 1; }
        .cc-title {
          font-size: 15px; font-weight: 600;
          color: var(--public-bg);
          margin: 0 0 4px;
          line-height: 1.3;
        }
        .cc-sub {
          font-size: 12.5px;
          color: rgba(148,163,184,0.6);
          margin: 0;
          line-height: 1.5;
          font-weight: 300;
        }
        .cc-close {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.6);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .cc-close:hover {
          background: rgba(255,255,255,0.06);
          color: var(--public-text);
          border-color: rgba(255,255,255,0.15);
        }

        /* Divider */
        .cc-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 0 22px;
        }

        /* Rows */
        .cc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 22px;
          gap: 16px;
          transition: background 0.2s;
        }
        .cc-row:hover { background: rgba(255,255,255,0.02); }
        .cc-row--locked { cursor: default; }
        .cc-row-info { display: flex; align-items: center; gap: 10px; }
        .cc-row-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--public-gold-light);
        }
        .cc-row-badge {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--public-gold);
          background: color-mix(in srgb, var(--public-gold) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--public-gold) 20%, transparent);
          border-radius: 100px;
          padding: 2px 8px;
        }

        /* Options wrapper */
        .cc-options {
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
        }

        /* Toggle switch */
        .cc-toggle {
          width: 40px; height: 22px;
          border-radius: 100px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          padding: 0;
          position: relative;
          transition: background 0.25s, border-color 0.25s;
          flex-shrink: 0;
        }
        .cc-toggle--on {
          background: color-mix(in srgb, var(--public-gold) 80%, transparent);
          border-color: color-mix(in srgb, var(--public-gold-light) 60%, transparent);
        }
        .cc-toggle--disabled { cursor: not-allowed; opacity: 0.6; }
        .cc-toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: rgba(200,210,240,0.7);
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), background 0.25s;
          pointer-events: none;
        }
        .cc-toggle--on .cc-toggle-thumb {
          transform: translateX(18px);
          background: var(--public-text);
        }

        /* Actions */
        .cc-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 16px 22px 20px;
        }
        .cc-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Sora', sans-serif;
          font-size: 12.5px; font-weight: 500;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .cc-btn--ghost {
          background: transparent;
          color: rgba(148,163,184,0.8);
          border-color: rgba(255,255,255,0.07);
        }
        .cc-btn--ghost:hover {
          background: rgba(255,255,255,0.04);
          color: var(--public-text);
          border-color: rgba(255,255,255,0.12);
        }
        .cc-btn--outline {
          background: transparent;
          color: var(--public-gold-light);
          border-color: rgba(255,255,255,0.1);
        }
        .cc-btn--outline:hover {
          background: rgba(255,255,255,0.04);
          color: var(--public-text);
          border-color: rgba(255,255,255,0.18);
        }
        .cc-btn--primary {
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
          color: var(--public-text);
          border-color: color-mix(in srgb, var(--public-gold-light) 40%, transparent);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--public-gold) 35%, transparent);
          margin-left: auto;
        }
        .cc-btn--primary:hover {
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
          box-shadow: 0 6px 24px color-mix(in srgb, var(--public-gold) 50%, transparent);
          transform: translateY(-1px);
        }
        .cc-btn--primary:active { transform: translateY(0); }

        @media (max-width: 480px) {
          .cc-actions { flex-direction: column; align-items: stretch; }
          .cc-btn--primary { margin-left: 0; }
        }
      `}</style>
    </>
  );
}
