import Infrastructure from '../components/public/Infrastructure';
import LocationMap from '../components/public/LocationMap';
import NewsAndEvents from '../components/public/NewsAndEvents';
import PhotoGallery from '../components/public/PhotoGallery';
import StudentLife from '../components/public/StudentLife';
import type { LandingContent } from '../types';

interface LifeProps {
  content: LandingContent;
}

export default function Life({ content }: LifeProps) {
  return (
    <main>
      <StudentLife content={content} />
      <Infrastructure content={content} />
      <PhotoGallery content={content} />
      <NewsAndEvents content={content} />
      <LocationMap content={content} />
    </main>
  );
}
