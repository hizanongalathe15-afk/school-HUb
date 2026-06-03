import { Link } from 'react-router-dom';
import type { LandingContent } from '../../types';

interface PublicFooterProps {
  content: LandingContent;
}

export default function PublicFooter({ content }: PublicFooterProps) {
  const quickLinks = content.footer.columns.flatMap((column) => column.links).slice(0, 4);

  return (
    <footer className="footer public-live-footer">
      <span className="footer-brand public-live-footer-brand">
        {content.school.name} © {new Date().getFullYear()}
      </span>
      <div className="footer-links public-live-footer-links">
        {quickLinks.map((link) => (
          <Link key={`${link.href}-${link.label}`} to={link.href}>{link.label}</Link>
        ))}
        <Link to="/contact">Contact</Link>
      </div>

      <style>{`
        .public-live-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          border-top: 1px solid color-mix(in srgb, var(--public-gold) 10%, transparent);
          background: var(--public-surface);
          padding: 2rem 2.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .public-live-footer .footer-inner,
        .public-live-footer .footer-grid,
        .public-live-footer .footer-social-row,
        .public-live-footer .footer-bottom {
          display: contents;
        }

        .public-live-footer-brand {
          color: var(--public-muted);
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          font-weight: 300;
        }

        .public-live-footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 2rem;
        }

        .public-live-footer-links a {
          color: color-mix(in srgb, var(--public-text) 58%, transparent);
          font-size: 11px;
          letter-spacing: .1em;
          text-decoration: none;
          text-transform: uppercase;
          transition: color .2s;
        }

        .public-live-footer-links a:hover {
          color: var(--public-gold);
        }

        @media (max-width: 760px) {
          .public-live-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 2rem 1.4rem;
          }

          .public-live-footer-links {
            justify-content: flex-start;
            gap: 1rem 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
}
