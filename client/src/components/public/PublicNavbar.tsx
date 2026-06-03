import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe2, Send, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import type { LandingContent, NavigationItem } from '../../types';
import { useAutoClose } from '../../hooks/useAutoClose';

import i18n from '../../i18n/i18n';
import { changeLanguage } from '../../i18n/Language';

interface PublicNavbarProps {
  content: LandingContent;
}

const languages = [
  { code: 'en', key: 'english' },
  { code: 'sw', key: 'kiswahili' },
  { code: 'fr', key: 'french' },
  { code: 'de', key: 'german' },
  { code: 'it', key: 'italian' }
];

export default function PublicNavbar({ content }: PublicNavbarProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem('school-hub-language') || 'en');
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [liveTime, setLiveTime] = useState('');

  const desktopNavRef = useRef<HTMLElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useAutoClose({
    enabled: openDropdown !== null,
    refs: [desktopNavRef],
    onClose: () => setOpenDropdown(null),
    idleMs: 9000
  });

  useAutoClose({
    enabled: languageOpen,
    refs: [languageRef],
    onClose: () => setLanguageOpen(false),
    idleMs: 9000
  });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const el = document.documentElement;
      setScrollProgress((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((part) => String(part).padStart(2, '0'))
          .join(':')
      );
    };
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function selectLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setLanguageOpen(false);
    changeLanguage(nextLanguage);
  }

  useEffect(() => {
    const handleLanguageChange = (nextLanguage: string) => setLanguage(nextLanguage);
    i18n.on('languageChanged', handleLanguageChange);
    return () => { i18n.off('languageChanged', handleLanguageChange); };
  }, []);

  function renderDesktopItem(item: NavigationItem) {
    if (!item.children?.length) {
      return (
        <NavLink key={item.href} to={item.href} end={item.href === '/'} className="nav-link">
          {item.label}
        </NavLink>
      );
    }

    return (
      <div
        className={`nav-dropdown ${openDropdown === item.href ? 'nav-dropdown--open' : ''}`}
        key={item.href}
        onMouseEnter={() => setOpenDropdown(item.href)}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <NavLink
          className="nav-dropdown-trigger nav-link"
          to={item.href}
          end={item.href === '/'}
          onFocus={() => setOpenDropdown(item.href)}
          onClick={() => setOpenDropdown(null)}
          aria-expanded={openDropdown === item.href}
        >
          {item.label}
          <ChevronDown size={13} aria-hidden="true" className="nav-chevron" />
        </NavLink>
        <div className="nav-dropdown-menu">
          <div className="nav-dropdown-inner">
            {item.children.map((child) => (
              <NavLink key={child.href} to={child.href} className="nav-dropdown-item" onClick={() => setOpenDropdown(null)}>
                <span className="nav-dropdown-dot" />
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const logoSrc = content.school.logo || '/assets/logo/favicon_io/android-chrome-512x512.png';

  return (
    <>
      <header className={`topbar navbar-enhanced ${scrolled ? 'navbar-scrolled' : ''}`}>
        {/* Scroll progress bar */}
        <div className="navbar-progress-bar">
          <div className="navbar-progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>

        <div className="topbar-inner navbar-inner">
          <NavLink className="brand navbar-brand" to="/" aria-label={t('common.homeLabel', { schoolName: content.school.name })}>
            <span className="brand-mark navbar-logo-wrap">
              <img src={logoSrc} alt="" aria-hidden="true" />
              <span className="navbar-logo-ring" />
            </span>
            <span className="navbar-name">{content.school.name}</span>
          </NavLink>

          <nav className="desktop-nav navbar-desktop-nav" aria-label={t('common.main_navigation')} ref={desktopNavRef}>
            {content.navigation.map(renderDesktopItem)}
          </nav>

          <span className="navbar-live-time" aria-label="Current time">{liveTime}</span>

          <div className="header-actions navbar-actions">
            <div className="language-menu" ref={languageRef}>
              <button
                className="language-button navbar-lang-btn"
                type="button"
                aria-label={t('common.select_language')}
                onClick={() => setLanguageOpen((open) => !open)}
                aria-expanded={languageOpen}
              >
                <Globe2 size={15} aria-hidden="true" />
                <span>{t(`common.language.${languages.find((item) => item.code === language)?.key || language}`)}</span>
                <ChevronDown size={13} aria-hidden="true" className={`lang-chevron ${languageOpen ? 'rotated' : ''}`} />
              </button>
              {languageOpen && (
                <div className="language-dropdown navbar-lang-dropdown">
                  {languages.map((item) => (
                    <button
                      type="button"
                      key={item.code}
                      className={language === item.code ? 'active' : ''}
                      onClick={() => selectLanguage(item.code)}
                    >
                      {language === item.code && <span className="lang-active-dot" />}
                      {t(`common.language.${item.key}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NavLink className="login-button navbar-icon-btn" to="/login" aria-label={t('common.login')}>
              <UserRound size={18} aria-hidden="true" />
            </NavLink>

            <NavLink className="nav-action navbar-cta" to="/admissions" aria-label={t('common.openAdmissions')}>
              <Send size={15} strokeWidth={2.3} aria-hidden="true" />
              <span>{content.admissions.primaryAction}</span>
            </NavLink>
          </div>

          <button
            className="menu-button navbar-hamburger"
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={t('common.toggle_navigation')}
          >
            <span className={`hamburger-bar ${isMenuOpen ? 'bar-1-open' : ''}`} />
            <span className={`hamburger-bar ${isMenuOpen ? 'bar-2-open' : ''}`} />
            <span className={`hamburger-bar ${isMenuOpen ? 'bar-3-open' : ''}`} />
          </button>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <nav className={`mobile-nav navbar-mobile-nav ${isMenuOpen ? 'mobile-nav-open' : ''}`} aria-label={t('common.mobile_navigation')}>
            {content.navigation.map((item) => (
              <div className="mobile-nav-group" key={item.href}>
                <NavLink to={item.href} onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                  {item.label}
                </NavLink>
                {item.children?.map((child) => (
                  <NavLink
                    className="mobile-subnav-link"
                    key={child.href}
                    to={child.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mobile-subnav-bullet" />
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ))}
            <div className="mobile-nav-divider" />
            <NavLink className="mobile-cta" to="/admissions" onClick={() => setIsMenuOpen(false)}>
              {content.admissions.primaryAction}
            </NavLink>
          </nav>
        )}
      </header>

      <style>{`
        /* ── Base ── */
        .navbar-enhanced {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(18px) saturate(150%);
          -webkit-backdrop-filter: blur(18px) saturate(150%);
          border-bottom: 1px solid rgba(226,232,240,0.78);
          box-shadow: 0 12px 32px rgba(15,23,42,0.08);
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }
        .navbar-enhanced:not(.navbar-scrolled) {
          background: rgba(255,255,255,0.74);
        }
        .navbar-scrolled {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(226,232,240,0.95);
          box-shadow: 0 8px 28px rgba(15,23,42,0.08);
        }

        /* progress */
        .navbar-progress-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: transparent;
        }
        .navbar-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--public-gold), var(--public-gold));
          transition: width 0.1s linear;
          border-radius: 0 2px 2px 0;
        }

        /* inner */
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(10px, 1.2vw, 18px);
          width: 100%;
          max-width: 96rem;
          min-width: 0;
          margin: 0 auto;
          padding: 0 clamp(16px, 4vw, 48px);
          height: 68px;
          flex-wrap: nowrap;
        }

        /* brand */
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex: 0 1 clamp(180px, 24vw, 360px);
          min-width: 0;
          max-width: clamp(180px, 24vw, 360px);
        }
        .navbar-logo-wrap {
          position: relative;
          width: 38px; height: 38px;
          flex-shrink: 0;
        }
        .navbar-logo-wrap img {
          width: 100%; height: 100%;
          object-fit: contain;
          border-radius: 10px;
          position: relative;
          z-index: 1;
        }
        .navbar-logo-ring {
          position: absolute;
          inset: -3px;
          border-radius: 13px;
          border: 1px solid rgba(203,213,225,0.8);
          transition: border-color 0.3s;
        }
        .navbar-brand:hover .navbar-logo-ring {
          border-color: color-mix(in srgb, var(--public-gold) 50%, transparent);
          box-shadow: 0 0 12px color-mix(in srgb, var(--public-gold) 30%, transparent);
        }
        .navbar-name {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: var(--public-text);
          white-space: nowrap;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* desktop nav */
        .navbar-desktop-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(4px, 0.6vw, 10px);
          flex: 1 1 auto;
          min-width: 0;
          margin: 0;
          padding: 0 clamp(6px, 1vw, 16px);
        }
        .nav-link {
          position: relative;
          padding: 8px clamp(8px, 0.8vw, 14px);
          font-size: 13.5px;
          font-weight: 500;
          color: color-mix(in srgb, var(--public-text) 72%, transparent);
          text-decoration: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--public-text);
          background: color-mix(in srgb, var(--public-gold) 9%, transparent);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 50%;
          transform: translateX(-50%);
          width: 16px; height: 2px;
          background: linear-gradient(90deg, var(--public-gold), var(--public-gold));
          border-radius: 2px;
        }
        .nav-chevron {
          transition: transform 0.25s ease;
        }
        .nav-dropdown--open .nav-chevron { transform: rotate(180deg); }

        /* dropdown */
        .nav-dropdown { position: relative; }
        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none;
        }
        .nav-dropdown--open .nav-dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }
        .nav-dropdown-inner {
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 14px;
          padding: 8px;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(15,23,42,0.14);
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: color-mix(in srgb, var(--public-text) 66%, transparent);
          text-decoration: none;
          border-radius: 9px;
          transition: all 0.18s ease;
        }
        .nav-dropdown-item:hover {
          color: var(--public-text);
          background: color-mix(in srgb, var(--public-gold) 9%, transparent);
        }
        .nav-dropdown-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--public-gold) 60%, transparent);
          flex-shrink: 0;
        }

        /* actions */
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
          min-width: 0;
        }
        .navbar-lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: transparent;
          border: 1px solid rgba(203,213,225,0.86);
          border-radius: 8px;
          color: color-mix(in srgb, var(--public-text) 68%, transparent);
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .navbar-lang-btn:hover {
          background: rgba(248,250,252,0.9);
          color: var(--public-text);
          border-color: color-mix(in srgb, var(--public-gold) 32%, transparent);
        }
        .lang-chevron {
          transition: transform 0.25s ease;
        }
        .lang-chevron.rotated { transform: rotate(180deg); }
        .navbar-lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 160px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 14px;
          padding: 8px;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(15,23,42,0.14);
          z-index: 100;
          animation: dropdownIn 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .navbar-lang-dropdown button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: color-mix(in srgb, var(--public-text) 62%, transparent);
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s;
        }
        .navbar-lang-dropdown button:hover { background: color-mix(in srgb, var(--public-gold) 9%, transparent); color: var(--public-text); }
        .navbar-lang-dropdown button.active { color: var(--public-text); background: color-mix(in srgb, var(--public-gold) 15%, transparent); }
        .lang-active-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--public-gold);
        }
        .language-menu { position: relative; }

        .navbar-icon-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(203,213,225,0.86);
          display: flex;
          align-items: center;
          justify-content: center;
          color: color-mix(in srgb, var(--public-text) 72%, transparent);
          text-decoration: none;
          transition: all 0.2s;
        }
        .navbar-icon-btn:hover {
          background: rgba(248,250,252,0.9);
          color: var(--public-text);
          border-color: color-mix(in srgb, var(--public-gold) 32%, transparent);
        }

        .navbar-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
          border-radius: 10px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--public-gold) 40%, transparent);
          white-space: nowrap;
        }
        .navbar-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--public-gold) 55%, transparent);
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
        }

        /* hamburger */
        .navbar-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          margin-left: 8px;
        }
        .hamburger-bar {
          width: 22px; height: 2px;
          background: color-mix(in srgb, var(--public-text) 80%, transparent);
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          transform-origin: center;
        }
        .bar-1-open { transform: translateY(7px) rotate(45deg); }
        .bar-2-open { opacity: 0; transform: scaleX(0); }
        .bar-3-open { transform: translateY(-7px) rotate(-45deg); }

        /* mobile nav */
        .navbar-mobile-nav {
          position: absolute;
          top: 100%; left: 0; right: 0;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(226,232,240,0.9);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: mobileNavIn 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes mobileNavIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mobile-nav-link {
          display: block;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 600;
          color: color-mix(in srgb, var(--public-text) 86%, transparent);
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: color-mix(in srgb, var(--public-gold) 9%, transparent);
          color: var(--public-text);
        }
        .mobile-subnav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px 9px 28px;
          font-size: 13px;
          color: color-mix(in srgb, var(--public-text) 58%, transparent);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .mobile-subnav-bullet {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--public-gold) 60%, transparent);
        }
        .mobile-subnav-link:hover { color: color-mix(in srgb, var(--public-text) 86%, transparent); background: color-mix(in srgb, var(--public-gold) 7%, transparent); }
        .mobile-nav-divider {
          height: 1px;
          background: rgba(226,232,240,0.8);
          margin: 8px 0;
        }
        .mobile-cta {
          display: block;
          text-align: center;
          padding: 14px;
          background: linear-gradient(135deg, var(--public-gold), var(--public-gold));
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          margin-top: 4px;
          transition: all 0.25s;
        }
        .mobile-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px color-mix(in srgb, var(--public-gold) 50%, transparent); }

        .navbar-enhanced {
          font-family: 'DM Sans', sans-serif;
        }
        .navbar-scrolled {
          background: rgba(255,255,255,.86);
          border-bottom: 1px solid color-mix(in srgb, var(--public-gold) 16%, transparent);
          box-shadow: none;
        }
        .navbar-progress-fill {
          background: var(--public-gold);
          box-shadow: 0 0 12px color-mix(in srgb, var(--public-gold) 45%, transparent);
        }
        .navbar-inner {
          height: 72px;
          padding: 0 clamp(18px, 4vw, 40px);
        }
        .navbar-brand {
          margin-right: auto;
        }
        .navbar-logo-wrap {
          display: grid;
          width: 44px;
          height: 44px;
          border: 1px solid color-mix(in srgb, var(--public-gold) 45%, transparent);
          border-radius: 50%;
          background: rgba(255,255,255,.68);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--public-gold) 8%, transparent);
          overflow: hidden;
        }
        .navbar-logo-wrap img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .navbar-logo-ring {
          border-radius: 50%;
          border-color: color-mix(in srgb, var(--public-gold) 35%, transparent);
        }
        .navbar-name {
          font-family: 'Cormorant Garamond', serif;
          color: var(--public-text);
          font-size: 22px;
          font-weight: 400;
          letter-spacing: .06em;
          max-width: 18rem;
        }
        .navbar-desktop-nav {
          gap: clamp(1rem, 2.2vw, 2.2rem);
          margin: 0 1.5rem;
        }
        .navbar-desktop-nav .nav-link {
          color: color-mix(in srgb, var(--public-text) 62%, transparent);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .navbar-desktop-nav .nav-link:hover,
        .navbar-desktop-nav .nav-link.active {
          color: var(--public-text);
        }
        .nav-dropdown-menu,
        .navbar-lang-dropdown {
          border: 1px solid color-mix(in srgb, var(--public-gold) 22%, transparent);
          border-radius: 2px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 22px 55px rgba(15,23,42,.14);
        }
        .nav-dropdown-menu::before {
          background: rgba(255,255,255,.96);
          border-color: color-mix(in srgb, var(--public-gold) 22%, transparent);
        }
        .desktop-nav .nav-dropdown-menu a,
        .navbar-lang-dropdown button {
          color: color-mix(in srgb, var(--public-text) 66%, transparent);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .08em;
        }
        .desktop-nav .nav-dropdown-menu a:hover,
        .desktop-nav .nav-dropdown-menu a.active,
        .navbar-lang-dropdown button:hover,
        .navbar-lang-dropdown button.active {
          color: var(--public-gold-light);
          background: color-mix(in srgb, var(--public-gold) 9%, transparent);
        }
        .navbar-actions {
          gap: .65rem;
        }
        .navbar-lang-btn,
        .navbar-icon-btn {
          border: 1px solid color-mix(in srgb, var(--public-gold) 28%, transparent);
          border-radius: 2px;
          background: rgba(255,255,255,.64);
          color: color-mix(in srgb, var(--public-text) 70%, transparent);
        }
        .navbar-lang-btn:hover,
        .navbar-icon-btn:hover {
          background: color-mix(in srgb, var(--public-gold) 10%, transparent);
          color: var(--public-text);
        }
        .navbar-cta {
          min-height: 40px;
          border: 1px solid var(--public-gold);
          border-radius: 2px;
          background: var(--public-gold);
          color: #ffffff;
          font-size: 11px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .navbar-cta:hover {
          background: var(--public-gold-light);
          color: #ffffff;
        }
        .navbar-live-time {
          min-width: 72px;
          flex: 0 0 auto;
          color: color-mix(in srgb, var(--public-text) 35%, transparent);
          font-size: 11px;
          letter-spacing: .1em;
          line-height: 1;
          text-align: right;
          white-space: nowrap;
        }
        .navbar-hamburger {
          border: 1px solid color-mix(in srgb, var(--public-gold) 25%, transparent);
          border-radius: 2px;
          color: var(--public-gold-light);
          background: rgba(255,255,255,.72);
        }
        .hamburger-bar {
          background: var(--public-gold-light);
        }
        .navbar-mobile-nav {
          background: rgba(255,255,255,.97);
          border-color: color-mix(in srgb, var(--public-gold) 16%, transparent);
        }
        .mobile-subnav-bullet {
          background: var(--public-gold);
        }
        .mobile-cta {
          border-radius: 2px;
          background: var(--public-gold);
          color: #ffffff;
        }

        @media (max-width: 1360px) {
          .navbar-live-time {
            display: none;
          }
        }

        @media (max-width: 1260px) {
          .navbar-desktop-nav { display: none; }
          .navbar-hamburger { display: flex; }
          .navbar-lang-btn span { display: none; }
          .navbar-brand {
            flex-basis: auto;
            max-width: min(46vw, 360px);
          }
        }

        @media (max-width: 900px) {
          .navbar-name { display: none; }
        }

        @media (max-width: 640px) {
          .navbar-inner {
            height: 64px;
            padding: 0 14px;
          }
          .navbar-actions {
            gap: 6px;
          }
          .navbar-cta {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .navbar-logo-wrap {
            width: 38px;
            height: 38px;
          }
          .navbar-icon-btn,
          .navbar-lang-btn,
          .navbar-hamburger {
            width: 36px;
            height: 36px;
            padding: 7px;
          }
        }
      `}</style>
    </>
  );
}
