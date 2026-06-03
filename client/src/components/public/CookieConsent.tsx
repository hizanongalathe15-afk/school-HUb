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
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      
      <section
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500"
        role="dialog"
        aria-modal="true"
        aria-label={t('cookie.cookiePreferences')}
      >
        {/* Glassmorphic Panel - White Theme */}
        <div className="mx-4 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl overflow-hidden">
          
          {/* Gradient Top Accent */}
          <div className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50">
                  <ShieldCheck className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('cookie.privacyPreferences')}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('cookie.choosePreferences')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Required Cookies Info */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 hover:bg-blue-50/70 transition-colors">
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {t('cookie.requiredCookies')}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                {t('cookie.alwaysOn')}
              </span>
            </div>
          </div>

          {/* Optional Cookies (Expandable) */}
          {customize && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div className="px-6 py-4 space-y-3 bg-gray-50/30">
                {toggleItems.map(({ key, label, value, onChange }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                    <button
                      role="switch"
                      aria-checked={value}
                      onClick={() => onChange(!value)}
                      className={`relative inline-flex w-10 h-6 items-center rounded-full transition-all ${
                        value ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                          value ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Actions */}
          <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:gap-2">
            <button
              type="button"
              onClick={() => setCustomize(!customize)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('cookie.customize')}
            </button>

            <button
              type="button"
              onClick={() => save({ necessary: true, analytics: false, media: false, ads: false })}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('cookie.rejectOptional')}
            </button>

            <button
              type="button"
              onClick={() => save({ necessary: true, analytics: true, media: true, ads: true })}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg flex-1"
            >
              {t('cookie.acceptAll')}
            </button>

            {customize && (
              <button
                type="button"
                onClick={() => save(choice)}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {t('cookie.saveChoices')}
              </button>
            )}
          </div>

          {/* Bottom Accent */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
        </div>
      </section>
    </>
  );
}
