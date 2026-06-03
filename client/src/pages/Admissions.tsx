import AdmissionsPanel from '../components/public/AdmissionsPanel';
import ContactUs from '../components/public/ContactUs';
import DownloadsCenter from '../components/public/DownloadsCenter';
import type { LandingContent } from '../types';

interface AdmissionsProps {
  content: LandingContent;
}

export default function Admissions({ content }: AdmissionsProps) {
  return (
    <main>
      <AdmissionsPanel content={content} />
      <DownloadsCenter content={content} />
      <ContactUs content={content} />
    </main>
  );
}
