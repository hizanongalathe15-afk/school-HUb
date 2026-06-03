import NewsAndEvents from '../components/public/NewsAndEvents';
import type { LandingContent } from '../types';

interface EventsProps {
  content: LandingContent;
}

export default function Events({ content }: EventsProps) {
  return (
    <main>
      <NewsAndEvents content={content} />
    </main>
  );
}
