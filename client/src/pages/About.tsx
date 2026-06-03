import FeatureShowcase from '../components/public/FeatureShowcase';
import SchoolHistory from '../components/public/SchoolHistory';
import type { LandingContent } from '../types';

interface AboutProps {
  content: LandingContent;
}

export default function About({ content }: AboutProps) {
  return (
    <main>
      <SchoolHistory content={content} />
      <FeatureShowcase content={content} compact />
    </main>
  );
}
