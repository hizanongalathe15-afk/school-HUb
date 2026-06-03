import FeatureShowcase from '../components/public/FeatureShowcase';
import type { LandingContent } from '../types';

interface AcademicsProps {
  content: LandingContent;
}

export default function Academics({ content }: AcademicsProps) {
  return (
    <main>
      <FeatureShowcase content={content} compact />
    </main>
  );
}
