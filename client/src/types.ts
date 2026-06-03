export type Accent = 'blue' | 'violet' | 'teal' | 'cyan' | 'rose' | 'amber' | 'indigo';

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface PublicPageSection {
  heading: string;
  body: string;
  image?: string;
  video?: string;
  audio?: string;
}

export interface PublicPageContent {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  body: string;
  category: string;
  heroImage?: string;
  video?: string;
  sections: PublicPageSection[];
  updatedAt?: string;
}

export interface LandingContent {
  school: {
    name: string;
    tagline: string;
    summary: string;
    logo?: string;
    favicon?: string;
    coverImage?: string;
    website?: string;
    primaryColor?: string;
    secondaryColor?: string;
    social?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
    contact: {
      email: string;
      phone: string;
      location: string;
    };
  };
  theme?: {
    background?: string;
    surface?: string;
    text?: string;
    mutedText?: string;
    primary?: string;
    primaryLight?: string;
    danger?: string;
  };
  live?: {
    badgeLabel?: string;
    tickerLabel?: string;
    tickerItems?: string[];
    aboutHeading?: string;
    aboutText?: string;
    aboutTag?: string;
    admissionsSteps?: Array<{
      title: string;
      description: string;
    }>;
  };
  navigation: NavigationItem[];
  heroSlides: Array<{
    title: string;
    subtitle: string;
    image: string;
    video?: string;
    audio?: string;
    playbackRate?: number;
    accent: Accent;
  }>;
  managedMedia?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'gif' | 'meme' | 'link' | 'document' | 'embed' | 'ad' | 'anthem' | 'archive' | 'other';
    title: string;
    url: string;
    section: string;
    description?: string;
  }>;
  stats: Array<{ value: string; label: string }>;
  sections: {
    about: {
      eyebrow: string;
    };
    values: {
      eyebrow: string;
      heading: string;
    };
    programs: {
      eyebrow: string;
      heading: string;
    };
    life: {
      eyebrow: string;
      heading: string;
      image: string;
    };
    admissions: {
      eyebrow: string;
    };
  };
  values: Array<{
    title: string;
    description: string;
    image: string;
    accent: Accent;
  }>;
  programs: Array<{
    name: string;
    level: string;
    description: string;
  }>;
  studentLife: string[];
  admissions: {
    enabled?: boolean;
    heading: string;
    text: string;
    primaryAction: string;
    secondaryAction: string;
  };
  footer: {
    summary: string;
    columns: Array<{
      heading: string;
      links: Array<{ label: string; href: string }>;
    }>;
    socials: Array<{ label: string; href: string }>;
    bottomText: string;
  };
}
