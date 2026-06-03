import { BookOpen, CalendarDays, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LandingContent } from '../../types';

interface PublicContentProps {
  content: LandingContent;
}

export default function SchoolHistory({ content }: PublicContentProps) {
  const { t } = useTranslation();

  return (
    <section className="intro-band">
      <div className="section-copy">
        <p className="eyebrow">{t('public.ourStory')}</p>
        <h2>{t('public.schoolHistoryHeading', { schoolName: content.school.name })}</h2>
        <p>{content.school.summary}</p>
      </div>
      <div className="program-grid">
        <article>
          <CalendarDays aria-hidden="true" />
          <span>{t('public.history.foundedLegacy')}</span>
          <h3>{t('public.history.strongSchoolIdentity')}</h3>
          <p>{t('public.history.milestonesDescription')}</p>
        </article>
        <article>
          <Trophy aria-hidden="true" />
          <span>{t('public.history.achievementArchive')}</span>
          <h3>{t('public.history.academicWins')}</h3>
          <p>{t('public.history.achievementDescription')}</p>
        </article>
        <article>
          <BookOpen aria-hidden="true" />
          <span>{t('public.history.publicTrust')}</span>
          <h3>{t('public.history.transparentInformation')}</h3>
          <p>{t('public.history.transparentDescription')}</p>
        </article>
      </div>
    </section>
  );
}
