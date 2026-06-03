import PhotoGallery from '../components/public/PhotoGallery';
import type { LandingContent } from '../types';

interface GalleryProps {
  content: LandingContent;
}

export default function Gallery({ content }: GalleryProps) {
  return (
    <main>
      <PhotoGallery content={content} />
    </main>
  );
}
