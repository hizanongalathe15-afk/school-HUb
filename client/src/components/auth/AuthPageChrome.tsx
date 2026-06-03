import type { CSSProperties, ReactNode } from 'react';
import PublicFooter from '../public/PublicFooter';
import PublicNavbar from '../public/PublicNavbar';
import { useLandingContent } from '../../hooks/useLandingContent';
import type { LandingContent } from '../../types';

interface AuthPageChromeProps {
  children: ReactNode | ((content: LandingContent) => ReactNode);
}

export default function AuthPageChrome({ children }: AuthPageChromeProps) {
  const { content } = useLandingContent();

  if (!content) {
    return (
      <main className="auth-shell auth-shell--loading">
        <div className="loader" />
      </main>
    );
  }

  const publicThemeStyle = {
    '--public-bg': content.theme?.background || content.school.primaryColor || '#f8fafc',
    '--public-surface': content.theme?.surface || '#ffffff',
    '--public-panel': content.theme?.background || '#ffffff',
    '--public-text': content.theme?.text || '#0f172a',
    '--public-muted': content.theme?.mutedText || '#64748b',
    '--public-gold': content.theme?.primary || content.school.secondaryColor || '#2563eb',
    '--public-gold-light': content.theme?.primaryLight || '#38bdf8',
    '--public-danger': content.theme?.danger || '#e04545'
  } as CSSProperties;

  return (
    <div className="auth-public-page" style={publicThemeStyle}>
      <PublicNavbar content={content} />
      <main className="auth-shell">{typeof children === 'function' ? children(content) : children}</main>
      <PublicFooter content={content} />
    </div>
  );
}
