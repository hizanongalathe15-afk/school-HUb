import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { t } = useTranslation();
  const descriptionFallback = t('common.module_ready');

  return (
    <section className="placeholder-page">
      <div className="placeholder-page__icon">
        <Construction size={26} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description || descriptionFallback}</p>

      </div>
    </section>
  );
}
