import SchoolLandingPage from '../components/public/SchoolLandingPage';
import type { LandingContent } from '../types';

interface HomeProps {
  content: LandingContent;
}

export function Home({ content }: HomeProps) {
  return <SchoolLandingPage content={content} />;
}
