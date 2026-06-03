import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { landingMediaService } from '../services/landingMediaService.js';
import { footerService, type FooterContent } from '../services/footerService.js';
import { publicPageService, type PublicPageContent } from '../services/publicPageService.js';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';

const prisma = new PrismaClient();

// Default landing content structure (used if no setting exists in DB)
const defaultLandingContent = {
  school: {
    name: '',
    motto: '',
    mission: '',
    vision: '',
    founded: 0,
    founder: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    region: '',
    logo: '',
    coverImage: '',
    primaryColor: '',
    secondaryColor: '',
    tagline: '',
    summary: ''
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
      id: '1',
      image: '',
      video: '/assets/videos/Students_walking_in_hallway_202606010835.mp4',
      playbackRate: 1,
      title: 'School Hub Academy',
      subtitle: 'Where quality education begins',
      ctaText: 'Learn More',
      ctaLink: '/about'
    }
  ],
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
  sections: {
    about: { eyebrow: 'About School', heading: 'We provide quality education', description: 'Lorem ipsum dolor sit amet.' },
    values: { eyebrow: 'Our Values', heading: 'Excellence, Integrity, Service', description: 'We uphold the highest standards.' },
    programs: { eyebrow: 'Academic Programs', heading: 'Comprehensive Curriculum', description: 'We offer a wide range of subjects.' },
    life: { eyebrow: 'Student Life', heading: 'Holistic Development', description: 'We nurture talents beyond academics.' },
    admissions: { eyebrow: 'Admissions', heading: 'Join Our Community', description: 'We are currently accepting applications.' }
  },
  admissions: {
    enabled: true,
    heading: 'Admissions Open',
    text: 'We are currently accepting applications for the upcoming academic year.',
    primaryAction: 'Apply Now',
    secondaryAction: 'Schedule a Tour'
  }
};

export const publicPageController = {
  async list(_req: Request, res: Response) {
    try {
      const pages = await publicPageService.list();
      res.json({ data: pages });
    } catch (error) {
      console.error('Error fetching public pages:', error);
      res.status(500).json({ message: 'Unable to load public pages' });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      const slug = String(req.params[0] || req.params.slug || '').replace(/^\/+|\/+$/g, '');
      const page = await publicPageService.getBySlug(slug);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      res.json({ data: page });
    } catch (error) {
      console.error('Error fetching public page:', error);
      res.status(500).json({ message: 'Unable to load public page' });
    }
  },

  async updatePage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const slug = String(req.params[0] || req.params.slug || '').replace(/^\/+|\/+$/g, '');
      const page = await publicPageService.updatePage(slug, req.body as Partial<PublicPageContent>, userId);
      res.json({ data: page, message: 'Public page updated successfully' });
    } catch (error) {
      console.error('Error updating public page:', error);
      res.status(500).json({ message: 'Unable to update public page' });
    }
  },

  async reset(_req: Request, res: Response) {
    try {
      const userId = (_req as any).user?.userId;
      const pages = await publicPageService.resetToDefault(userId);
      res.json({ data: pages, message: 'Public pages reset to default' });
    } catch (error) {
      console.error('Error resetting public pages:', error);
      res.status(500).json({ message: 'Unable to reset public pages' });
    }
  }
};

const aboutLinks = [
  { label: 'About the School', href: '/about-school' },
  { label: 'Infrastructure', href: '/infrastructure' },
  { label: 'Our Achievements', href: '/achievements' },
  { label: 'Location', href: '/location' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'Board of Management', href: '/board-of-management' },
  { label: 'PTA Members', href: '/pta-members' },
  { label: 'Senior Management', href: '/senior-management' },
  { label: 'Teaching Staff', href: '/teaching-staff' }
];

function enrichNavigation(navigation: any[]) {
  return navigation.map((item) => {
    if (item?.label !== 'About Us' && item?.href !== '/about') return item;
    const children = Array.isArray(item.children) ? item.children : [];
    const seen = new Set(children.map((child: any) => child?.href));
    return {
      ...item,
      children: [
        ...children,
        ...aboutLinks.filter((link) => !seen.has(link.href))
      ]
    };
  });
}

function normalizeLandingContent(raw: any) {
  const school = {
    ...defaultLandingContent.school,
    ...(raw?.school || {})
  };
  const contact = {
    email: raw?.school?.contact?.email || school.email || 'info@greenfield.ac.ke',
    phone: raw?.school?.contact?.phone || school.phone || '+254 700 111 222',
    location: raw?.school?.contact?.location || school.address || school.region || 'Nairobi, Kenya'
  };

  return {
    ...defaultLandingContent,
    ...raw,
    school: {
      ...school,
      contact,
      logo: school.logo || '',
      favicon: school.favicon || '',
      coverImage: school.coverImage || '',
      website: school.website || '',
      tagline: school.tagline || school.motto || 'Knowledge, Character, Service',
      summary: school.summary || school.mission || 'A connected school community for learners, staff, and parents.'
    },
    navigation: enrichNavigation(Array.isArray(raw?.navigation) && raw.navigation.some((item: any) => Array.isArray(item?.children) && item.children.length)
      ? raw.navigation
      : defaultLandingContent.navigation),
    heroSlides: (Array.isArray(raw?.heroSlides) && raw.heroSlides.length ? raw.heroSlides : defaultLandingContent.heroSlides).map((slide: any, index: number) => ({
      accent: index % 2 === 0 ? 'blue' : 'teal',
      image: school.coverImage || '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
      video: defaultLandingContent.heroSlides[index]?.video || defaultLandingContent.heroSlides[0]?.video || '',
      playbackRate: 1,
      ...slide
    })),
    theme: {
      ...defaultLandingContent.theme,
      ...(raw?.theme || {})
    },
    live: {
      ...defaultLandingContent.live,
      ...(raw?.live || {}),
      tickerItems: Array.isArray(raw?.live?.tickerItems) ? raw.live.tickerItems : defaultLandingContent.live.tickerItems,
      admissionsSteps: Array.isArray(raw?.live?.admissionsSteps) ? raw.live.admissionsSteps : defaultLandingContent.live.admissionsSteps
    },
    stats: Array.isArray(raw?.stats) && raw.stats.length ? raw.stats : [
      { value: '3', label: 'Active learners seeded' },
      { value: '6', label: 'User roles ready' },
      { value: '24/7', label: 'Portal access' }
    ],
    sections: {
      ...defaultLandingContent.sections,
      ...(raw?.sections || {}),
      life: {
        ...defaultLandingContent.sections.life,
        image: school.coverImage || '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg',
        ...(raw?.sections?.life || {})
      }
    },
    values: Array.isArray(raw?.values) && raw.values.length ? raw.values : [
      { title: 'Academic Focus', description: 'Results, attendance, and progress are tracked in one place.', image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg', accent: 'blue' },
      { title: 'Parent Partnership', description: 'Fees, messages, meetings, and notices are connected to each learner.', image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg', accent: 'teal' },
      { title: 'Operational Clarity', description: 'Inventory, reports, media, and school settings are managed through the dashboard.', image: '/assets/default-images/bill-wegener-hs98_9hzTcU-unsplash.jpg', accent: 'amber' }
    ],
    programs: Array.isArray(raw?.programs) && raw.programs.length ? raw.programs : [
      { name: 'Lower Secondary', level: 'Form 1-2', description: 'Foundation subjects, learner support, clubs, and parent updates.' },
      { name: 'Upper Secondary', level: 'Form 3-4', description: 'KCSE preparation, subject performance tracking, and teacher feedback.' }
    ],
    studentLife: Array.isArray(raw?.studentLife) && raw.studentLife.length ? raw.studentLife : ['Clubs and societies', 'Sports and wellness', 'Library and study support', 'Mentorship and discipline support'],
    admissions: {
      ...defaultLandingContent.admissions,
      ...(raw?.admissions || {}),
      enabled: raw?.admissions?.enabled !== false
    },
    footer: raw?.footer || {
      summary: `${school.name || 'School Hub Academy'} keeps learners, families, and staff connected through one modern school platform.`,
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
      socials: [{ label: 'X', href: 'https://x.com' }, { label: 'Instagram', href: 'https://instagram.com' }],
      bottomText: `${school.name || 'School Hub Academy'}. All rights reserved.`
    }
  };
}

async function readLandingContentSetting() {
  const contentSetting = await prisma.setting.findFirst({
    where: { group: 'landing', key: 'content' }
  });

  if (contentSetting && typeof contentSetting.value === 'object' && contentSetting.value !== null) {
    return contentSetting.value as any;
  }

  return defaultLandingContent;
}

function schoolRecordToLandingSchool(school: any) {
  if (!school) return {};
  return {
    name: school.name,
    motto: school.motto,
    mission: school.mission,
    vision: school.vision,
    founded: school.founded,
    founder: school.founder,
    phone: school.phone,
    email: school.email,
    website: school.website,
    address: school.address,
    region: school.region,
    logo: school.logo,
    favicon: school.favicon,
    coverImage: school.coverImage,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    tagline: school.motto,
    summary: school.mission,
    contact: {
      email: school.email,
      phone: school.phone,
      location: school.address || school.region
    }
  };
}

export const schoolController = {
  get: async (req: Request, res: Response) => {
    try {
      const school = await prisma.school.findFirst();
      res.json(school);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

    update: async (req: Request, res: Response) => {
      try {
        const school = await prisma.school.findFirst();
        const updated = await prisma.school.upsert({
          where: { id: school?.id || 'new' },
          update: req.body,
          create: req.body,
        });

        // Emit event for real-time updates (school info changed)
        eventEmitter.emitEvent('announcement:new', {
          announcementId: `school_update_${Date.now()}`,
          message: `School information has been updated. ${req.body.name ? `School name: ${req.body.name}.` : ''} ${req.body.motto ? `Motto: ${req.body.motto}.` : ''}`,
          audience: 'all',
          timestamp: new Date().toISOString()
        });

        // Audit log
        await auditLogger.logUpdate(
          (req as any).user?.userId,
          'School',
          school?.id || 'unknown',
          school ?? {},
          req.body,
          'School information updated'
        );

        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: 'Server error' });
      }
    },

  updateLocation: async (req: Request, res: Response) => {
    try {
      const { address, lat, lng, region, soilInfo, roadsAccess, surroundings, climateInfo } = req.body;
      const school = await prisma.school.findFirst();
      const updated = await prisma.school.upsert({
        where: { id: school?.id || 'demo-school' },
        update: {
          address,
          lat: lat === undefined ? undefined : Number(lat),
          lng: lng === undefined ? undefined : Number(lng),
          region,
          mission: soilInfo ? `Soil: ${soilInfo}` : undefined,
          vision: [roadsAccess, surroundings, climateInfo].filter(Boolean).join(' | ') || undefined
        },
        create: {
          id: 'demo-school',
          name: req.body.name || 'Greenfield High School',
          phone: req.body.phone || '+254 700 111 222',
          email: req.body.email || 'info@greenfield.ac.ke',
          address: address || 'Nairobi, Kenya',
          lat: lat === undefined ? undefined : Number(lat),
          lng: lng === undefined ? undefined : Number(lng),
          region
        }
      });
      res.json({ message: 'School location updated', data: updated });
    } catch {
      res.status(500).json({ message: 'Unable to update school location' });
    }
  },
};

export const landingContentController = {
  async get(_req: Request, res: Response) {
    try {
      const [rawContent, school, footer] = await Promise.all([
        readLandingContentSetting(),
        prisma.school.findFirst(),
        footerService.getContent()
      ]);
      const normalized = normalizeLandingContent({
        ...rawContent,
        school: {
          ...(rawContent?.school || {}),
          ...schoolRecordToLandingSchool(school)
        },
        footer
      });
      res.json({ data: normalized });
    } catch (error) {
      console.error('Error fetching landing admin content:', error);
      res.status(500).json({ message: 'Unable to load landing admin content' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'system';
      const current = await readLandingContentSetting();
      const incoming = req.body || {};
      const nextContent = normalizeLandingContent({
        ...current,
        ...incoming,
        school: {
          ...(current?.school || {}),
          ...(incoming.school || {})
        }
      });

      await prisma.setting.upsert({
        where: { key: 'content' },
        update: {
          value: nextContent as unknown as any,
          group: 'landing',
          updatedBy: userId
        },
        create: {
          key: 'content',
          value: nextContent as unknown as any,
          group: 'landing',
          updatedBy: userId
        }
      });

      if (incoming.school) {
        const schoolData = incoming.school;
        const schoolPayload = {
          name: String(schoolData.name || nextContent.school.name || 'School Hub Academy'),
          motto: schoolData.tagline || schoolData.motto || nextContent.school.tagline,
          mission: schoolData.summary || schoolData.mission || nextContent.school.summary,
          phone: schoolData.contact?.phone || schoolData.phone || nextContent.school.contact.phone,
          email: schoolData.contact?.email || schoolData.email || nextContent.school.contact.email,
          address: schoolData.contact?.location || schoolData.address || nextContent.school.contact.location,
          website: schoolData.website || nextContent.school.website || null,
          logo: schoolData.logo || null,
          favicon: schoolData.favicon || null,
          coverImage: schoolData.coverImage || null,
          primaryColor: schoolData.primaryColor || undefined,
          secondaryColor: schoolData.secondaryColor || undefined
        };
        const existingSchool = await prisma.school.findFirst();
        if (existingSchool) {
          await prisma.school.update({ where: { id: existingSchool.id }, data: schoolPayload });
        } else {
          await prisma.school.create({ data: schoolPayload });
        }
      }

      res.json({ data: nextContent, message: 'Landing content updated successfully' });
    } catch (error) {
      console.error('Error updating landing admin content:', error);
      res.status(500).json({ message: 'Unable to update landing content' });
    }
  }
};

function swahiliLandingContent(content: any) {
  return {
    ...content,
    school: {
      ...content.school,
      tagline: 'Mahali ambapo maisha bora huanza',
      summary: 'Jumuiya ya kisasa ya kujifunza inayounganisha taaluma, ubunifu, tabia njema, na mawasiliano ya karibu na wazazi.'
    },
    navigation: [
      { label: 'Mwanzo', href: '/' },
      { label: 'Kuhusu', href: '/about', children: content.navigation[1]?.children || [] },
      { label: 'Idara', href: '/academics', children: content.navigation[2]?.children || [] },
      { label: 'Wanafunzi', href: '/life', children: content.navigation[3]?.children || [] },
      { label: 'Media', href: '/gallery', children: content.navigation[4]?.children || [] },
      { label: 'Mawasiliano', href: '/contact' }
    ],
    heroSlides: content.heroSlides.map((slide: any, index: number) => ({
      ...slide,
      title: index === 0 ? 'School Hub Academy' : index === 1 ? 'Akili Dadisi' : 'Shule Iliyounganishwa',
      subtitle: index === 0 ? 'Mahali ambapo maisha bora huanza' : index === 1 ? 'Kujifunza kwa vitendo kwa wanafunzi wenye ujasiri' : 'Wanafunzi, walimu, na familia wakisonga pamoja'
    })),
    sections: {
      ...content.sections,
      about: { eyebrow: 'Kuhusu shule' },
      values: { eyebrow: 'Utamaduni wa kujifunza', heading: 'Masomo yenye rangi, matokeo yenye nguvu.' },
      programs: { eyebrow: 'Njia za masomo', heading: 'Programu kwa kila hatua.' },
      life: { ...content.sections.life, eyebrow: 'Maisha ya mwanafunzi', heading: 'Siku zilizosawazishwa kwa masomo, ubunifu, uongozi, na ustawi.' },
      admissions: { eyebrow: 'Udahili' }
    },
    admissions: {
      ...content.admissions,
      heading: 'Udahili umefunguliwa',
      text: 'Panga ziara, kutana na timu ya masomo, na upate mwongozo wa kujiunga kwa kiwango cha mtoto wako.',
      primaryAction: 'Anza Maombi',
      secondaryAction: 'Panga Ziara'
    }
  };
}

export const getLandingContent = async (req: Request, res: Response) => {
  try {
    const lang = String(req.query.lang || 'en').toLowerCase();
    const [media, rawContent, school, footerContent] = await Promise.all([
      landingMediaService.list(),
      readLandingContentSetting(),
      prisma.school.findFirst(),
      footerService.getContent()
    ]);

    const landingContent: any = {
      ...rawContent,
      school: {
        ...(rawContent?.school || {}),
        ...schoolRecordToLandingSchool(school)
      },
      footer: footerContent
    };
    
    // If Swahili, translate
    const normalizedContent = normalizeLandingContent(landingContent);
    const finalContent = lang === 'sw' ? swahiliLandingContent(normalizedContent) : normalizedContent;
    
    res.json({ data: { ...finalContent, managedMedia: media } });
  } catch (error) {
    console.error('Error fetching landing content:', error);
    res.status(500).json({ message: 'Unable to load landing content' });
  }
};

// Footer Controller
export const footerController = {
  async getContent(_req: Request, res: Response) {
    try {
      const content = await footerService.getContent();
      res.json({ data: content });
    } catch (error) {
      console.error('Error fetching footer content:', error);
      res.status(500).json({ message: 'Unable to load footer content' });
    }
  },

  async updateContent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data: Partial<FooterContent> = req.body;
      
      const content = await footerService.updateContent(data, userId);
      res.json({ data: content, message: 'Footer content updated successfully' });
    } catch (error) {
      console.error('Error updating footer content:', error);
      res.status(500).json({ message: 'Unable to update footer content' });
    }
  },

  async resetContent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const content = await footerService.resetToDefault(userId);
      res.json({ data: content, message: 'Footer content reset to default' });
    } catch (error) {
      console.error('Error resetting footer content:', error);
      res.status(500).json({ message: 'Unable to reset footer content' });
    }
  }
};
