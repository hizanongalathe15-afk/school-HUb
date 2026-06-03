import ContactUs from '../components/public/ContactUs';
import LocationMap from '../components/public/LocationMap';
import type { LandingContent } from '../types';

interface ContactProps {
  content: LandingContent;
}

export default function Contact({ content }: ContactProps) {
  return (
    <main>
      <ContactUs content={content} />
      <LocationMap content={content} />
    </main>
  );
}
