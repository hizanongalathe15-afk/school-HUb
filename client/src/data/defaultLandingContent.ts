import type { LandingContent } from '../types';

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  school: {
    name: 'School Hub Academy',
    tagline: 'Knowledge, Character, Service',
    summary: 'A connected school community for learners, staff, and parents.',
    logo: '/assets/logo/favicon_io/android-chrome-512x512.png',
    favicon: '/assets/logo/favicon_io/favicon.ico',
    coverImage: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
    website: '',
    contact: {
      email: 'info@greenfield.ac.ke',
      phone: '+254 700 111 222',
      location: 'Nairobi, Kenya'
    }
  },
  theme: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    mutedText: '#64748b',
    primary: '#2563eb',
    primaryLight: '#38bdf8',
    danger: '#e04545'
  },
  live: {
    badgeLabel: 'Live Campus',
    tickerLabel: 'Today',
    tickerItems: [
      'Science Fair - Main Hall, 10:00 AM',
      'Parent Portal updates available',
      'Guidance Session - Room 204, 2:00 PM',
      'Football Practice - Pitch A, 4:30 PM'
    ],
    aboutHeading: 'A Legacy of\nCurious Minds',
    aboutText: 'We connect academics, communication, admissions, and daily school life in one polished experience for learners, families, and staff.',
    aboutTag: 'Est. 1972',
    admissionsSteps: [
      { title: 'Apply Online', description: 'Submit your application and learner details.' },
      { title: 'Campus Visit', description: 'Meet the admissions team and tour the campus.' },
      { title: 'Assessment', description: 'Complete a brief readiness review.' },
      { title: 'Welcome', description: 'Receive the offer and join the school community.' }
    ]
  },
  navigation: [
    { label: 'Home', href: '/' },
    {
      label: 'About Us',
      href: '/about',
      children: [
        { label: 'About the School', href: '/about-school' },
        { label: 'Infrastructure', href: '/infrastructure' },
        { label: 'Our Achievements', href: '/achievements' },
        { label: 'Location', href: '/location' },
        { label: 'Alumni', href: '/alumni' },
        { label: 'Board of Management', href: '/board-of-management' },
        { label: 'PTA Members', href: '/pta-members' },
        { label: 'Senior Management', href: '/senior-management' },
        { label: 'Teaching Staff', href: '/teaching-staff' }
      ]
    },
    {
      label: 'Departments',
      href: '/academics',
      children: [
        { label: 'Languages Department', href: '/departments/languages' },
        { label: 'Sciences Department', href: '/departments/sciences' },
        { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
        { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
        { label: 'Humanities Department', href: '/departments/humanities' },
        { label: 'Boarding Department', href: '/departments/boarding' },
        { label: 'Mathematics Department', href: '/departments/mathematics' },
        { label: 'Co-Curricular Department', href: '/departments/co-curricular' }
      ]
    },
    {
      label: 'Students',
      href: '/life',
      children: [
        { label: 'Form 1', href: '/students/form-1' },
        { label: 'Form 2', href: '/students/form-2' },
        { label: 'Form 3', href: '/students/form-3' },
        { label: 'Form 4', href: '/students/form-4' }
      ]
    },
    {
      label: 'Media',
      href: '/gallery',
      children: [
        { label: 'Gallery', href: '/gallery' },
        { label: 'Downloads', href: '/downloads' },
        { label: 'Events', href: '/events' }
      ]
    },
    { label: 'Contacts', href: '/contact' }
  ],
  heroSlides: [
    {
      title: 'School Hub Academy',
      subtitle: 'Where quality education begins',
      image: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
      video: '/assets/videos/Students_walking_in_hallway_202606010835.mp4',
      accent: 'blue'
    },
    {
      title: 'Learning That Connects Everyone',
      subtitle: 'Parents, teachers, and learners stay aligned through one school experience.',
      image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg',
      accent: 'teal'
    }
  ],
  stats: [
    { value: '3', label: 'Active learners seeded' },
    { value: '6', label: 'User roles ready' },
    { value: '24/7', label: 'Portal access' }
  ],
  sections: {
    about: {
      eyebrow: 'About School'
    },
    values: {
      eyebrow: 'Our Values',
      heading: 'Excellence, Integrity, Service'
    },
    programs: {
      eyebrow: 'Academic Programs',
      heading: 'Comprehensive Curriculum'
    },
    life: {
      eyebrow: 'Student Life',
      heading: 'Holistic Development',
      image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg'
    },
    admissions: {
      eyebrow: 'Admissions'
    }
  },
  values: [
    {
      title: 'Academic Focus',
      description: 'Results, attendance, and progress are tracked in one place.',
      image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg',
      accent: 'blue'
    },
    {
      title: 'Parent Partnership',
      description: 'Fees, messages, meetings, and notices are connected to each learner.',
      image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg',
      accent: 'teal'
    },
    {
      title: 'Operational Clarity',
      description: 'Inventory, reports, media, and school settings are managed through the dashboard.',
      image: '/assets/default-images/bill-wegener-hs98_9hzTcU-unsplash.jpg',
      accent: 'amber'
    }
  ],
  programs: [
    {
      name: 'Lower Secondary',
      level: 'Form 1-2',
      description: 'Foundation subjects, learner support, clubs, and parent updates.'
    },
    {
      name: 'Upper Secondary',
      level: 'Form 3-4',
      description: 'KCSE preparation, subject performance tracking, and teacher feedback.'
    }
  ],
  studentLife: [
    'Clubs and societies',
    'Sports and wellness',
    'Library and study support',
    'Mentorship and discipline support'
  ],
  admissions: {
    enabled: true,
    heading: 'Admissions Open',
    text: 'We are currently accepting applications for the upcoming academic year.',
    primaryAction: 'Apply Now',
    secondaryAction: 'Schedule a Tour'
  },
  footer: {
    summary: 'School Hub Academy keeps learners, families, and staff connected through one modern school platform.',
    columns: [
      {
        heading: 'School',
        links: [
          { label: 'About Us', href: '/about-school' },
          { label: 'Download', href: '/downloads' },
          { label: 'Senior Management', href: '/senior-management' },
          { label: 'Teaching Staff', href: '/teaching-staff' },
          { label: 'PTA Members', href: '/pta-members' }
        ]
      },
      {
        heading: 'Materials and Assignments',
        links: [
          { label: 'Form 1', href: '/students/form-1' },
          { label: 'Form 2', href: '/students/form-2' },
          { label: 'Form 3', href: '/students/form-3' },
          { label: 'Form 4', href: '/students/form-4' }
        ]
      },
      {
        heading: 'Departments',
        links: [
          { label: 'Co-Curricular Department', href: '/departments/co-curricular' },
          { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
          { label: 'Humanities Department', href: '/departments/humanities' },
          { label: 'Languages Department', href: '/departments/languages' },
          { label: 'Mathematics Department', href: '/departments/mathematics' },
          { label: 'Sciences Department', href: '/departments/sciences' },
          { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
          { label: 'Boarding Department', href: '/departments/boarding' }
        ]
      }
    ],
    socials: [
      { label: 'X', href: 'https://x.com' },
      { label: 'Instagram', href: 'https://instagram.com' }
    ],
    bottomText: 'School Hub Academy. All rights reserved.'
  }
};
