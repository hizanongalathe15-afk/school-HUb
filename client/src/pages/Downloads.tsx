import DownloadsCenter from '../components/public/DownloadsCenter';
import type { LandingContent } from '../types';

interface DownloadsProps {
  content: LandingContent;
}

export default function Downloads({ content }: DownloadsProps) {
  return (
    <main>
      <DownloadsCenter content={content} />
    </main>
  );
}
