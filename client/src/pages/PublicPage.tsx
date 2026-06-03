import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { publicPageService } from '../services/api';
import type { LandingContent, PublicPageContent } from '../types';

interface PublicPageProps {
  content: LandingContent;
}

export default function PublicPage({ content }: PublicPageProps) {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const slug = useMemo(() => {
    const wildcard = params['*'];
    return (wildcard || location.pathname.replace(/^\/+/, '')).replace(/^\/+|\/+$/g, '');
  }, [location.pathname, params]);
  const [page, setPage] = useState<PublicPageContent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    setPage(null);

    publicPageService
      .getBySlug(slug)
      .then((data) => {
        if (active) setPage(data);
      })
      .catch(() => {
        if (active) setError(t('public.pageNotAvailable'));
      });

    return () => {
      active = false;
    };
  }, [slug, t]);

  if (error) {
    return (
      <main className="public-page">
        <section className="public-page-hero">
          <p className="eyebrow">{content.school.name}</p>
          <h1>{t('public.pageNotFound')}</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="state-screen">
        <div className="loader" />
        <p>{t('public.loading')}</p>
      </main>
    );
  }

  return (
    <main className="public-page">
      <section className={`public-page-hero ${page.heroImage ? 'public-page-hero--media' : ''}`}>
        {page.heroImage && <img src={page.heroImage} alt="" aria-hidden="true" />}
        <div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
        </div>
      </section>

      <section className="public-page-body">
        <article>
          <p>{page.body}</p>
          {page.video && (
            <div className="public-page-media">
              <video src={page.video} controls playsInline preload="metadata" />
            </div>
          )}
          {page.sections.map((section, index) => (
            <div className="public-page-section" key={`${section.heading}-${index}`}>
              {(section.image || section.video) && (
                <div className="public-page-section__media">
                  {section.video ? (
                    <video src={section.video} controls playsInline preload="metadata" />
                  ) : (
                    <img src={section.image} alt="" loading="lazy" />
                  )}
                </div>
              )}
              <div>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
