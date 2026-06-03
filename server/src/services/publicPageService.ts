import { prisma } from '../config/database.js';

export interface PublicPageSection {
  heading: string;
  body: string;
  image?: string;
  video?: string;
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

const DEFAULT_PUBLIC_PAGES: PublicPageContent[] = [
  {
    slug: 'about-school',
    title: 'About the School',
    eyebrow: 'About Us',
    summary: 'Learn about our identity, culture, and commitment to learners.',
    heroImage: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
    body: 'Our school is a focused learning community where students are supported academically, socially, and morally. We use digital systems to keep school information accessible to parents, staff, and learners.',
    category: 'About Us',
    sections: [
      { heading: 'Our Promise', body: 'We provide a disciplined, caring, and results-oriented environment where every learner can grow.', image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg' },
      { heading: 'Learning Culture', body: 'Teachers, parents, and administrators work together to track progress and support each student.', image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg' }
    ]
  },
  {
    slug: 'infrastructure',
    title: 'Infrastructure',
    eyebrow: 'About Us',
    summary: 'Explore the learning spaces that support science, reading, sports, meals, boarding, and daily school operations.',
    heroImage: '/assets/default-images/agence-olloweb-Z2ImfOCafFk-unsplash.jpg',
    body: 'Infrastructure is part of the school experience. Classrooms, laboratories, libraries, dining spaces, dormitories, offices, sports grounds, and safety routes work together to support learning and care.',
    category: 'About Us',
    sections: [
      { heading: 'Science Laboratories', body: 'Practical science rooms support demonstrations, experiments, safety routines, stock control, and hands-on STEM learning.', image: '/assets/default-images/cdc-GDokEYnOfnE-unsplash.jpg' },
      { heading: 'Library and Reading Spaces', body: 'The library supports research, quiet study, borrowing, returns, digital reading resources, and guided revision.', image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg' },
      { heading: 'Classrooms and Digital Learning', body: 'Classrooms are organized for structured lessons, assessment feedback, learner records, teacher ownership, and parent-connected progress tracking.', image: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg' },
      { heading: 'Sports, Dining, Boarding, and Welfare', body: 'Sports fields, dining areas, dormitories, health records, and welfare notes help the school balance academics with wellbeing.', image: '/assets/default-images/mche-lee-PC91Jm1DlWA-unsplash.jpg' }
    ]
  },
  {
    slug: 'achievements',
    title: 'Our Achievements',
    eyebrow: 'About Us',
    summary: 'Academic progress, co-curricular wins, leadership growth, and community service are part of the school record.',
    heroImage: '/assets/default-images/bill-wegener-hs98_9hzTcU-unsplash.jpg',
    body: 'Achievements are more than trophies. The school celebrates academic improvement, discipline, creative work, sports participation, innovation, service, and student leadership.',
    category: 'About Us',
    sections: [
      { heading: 'Academic Growth', body: 'Departments track assessment outcomes, revision support, grade improvement, and learner milestones across the year.', image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg' },
      { heading: 'Sports and Co-Curricular Excellence', body: 'Fixtures, clubs, societies, drama, music, debate, and athletics give learners visible opportunities to grow beyond classwork.', image: '/assets/default-images/fatima-yusuf-0sljWIZH4IQ-unsplash.jpg' },
      { heading: 'Leadership and Service', body: 'Student councils, peer mentorship, community projects, and responsibility roles build confidence and character.', image: '/assets/default-images/bill-wegener-hs98_9hzTcU-unsplash.jpg' }
    ]
  },
  {
    slug: 'location',
    title: 'Location',
    eyebrow: 'About Us',
    summary: 'Find school location details, visitor access notes, transport readiness, and contact channels.',
    heroImage: '/assets/default-images/fatima-yusuf-0sljWIZH4IQ-unsplash.jpg',
    body: 'The school location page supports visitors, parents, transport teams, and emergency planning. Exact pins and landmarks can be maintained from the administration dashboard.',
    category: 'About Us',
    sections: [
      { heading: 'Visitor Access', body: 'Reception, gate access, parking instructions, and visitor registration help families and guests arrive smoothly.', image: '/assets/default-images/agence-olloweb-Z2ImfOCafFk-unsplash.jpg' },
      { heading: 'Transport and Routes', body: 'Bus route planning, pickup points, road access notes, and parent arrival communication can connect to live school operations.', image: '/assets/default-images/mche-lee-PC91Jm1DlWA-unsplash.jpg' },
      { heading: 'Environment and Safety', body: 'Surroundings, emergency gates, nearby landmarks, and safety notes are documented for administration and public guidance.', image: '/assets/default-images/fatima-yusuf-0sljWIZH4IQ-unsplash.jpg' }
    ]
  },
  {
    slug: 'alumni',
    title: 'Alumni',
    eyebrow: 'About Us',
    summary: 'A growing alumni community connected through stories, mentorship, careers, and school service.',
    heroImage: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg',
    body: 'Alumni help preserve the school story. The alumni page can highlight former students, mentorship opportunities, career pathways, reunions, and contributions back to the school.',
    category: 'About Us',
    sections: [
      { heading: 'Alumni Stories', body: 'Feature graduates, career journeys, university transitions, entrepreneurship, service, and leadership stories.', image: '/assets/default-images/bill-wegener-hs98_9hzTcU-unsplash.jpg' },
      { heading: 'Mentorship and Careers', body: 'Former students can support career talks, internships, scholarships, subject mentorship, and exam motivation.', image: '/assets/default-images/element5-digital-OyCl7Y4y0Bk-unsplash.jpg' },
      { heading: 'Reunions and Giving Back', body: 'The school can publish reunion notices, alumni projects, facility support, and community service opportunities.', image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg' }
    ]
  },
  {
    slug: 'board-of-management',
    title: 'Board of Management',
    eyebrow: 'Leadership',
    summary: 'Meet the governance team that supports school strategy and accountability.',
    body: 'The Board of Management gives strategic guidance, supports resource planning, and helps the school maintain strong standards of governance.',
    category: 'About Us',
    sections: [
      { heading: 'Governance Focus', body: 'The board reviews school priorities, infrastructure needs, financial stewardship, and learner welfare.' }
    ]
  },
  {
    slug: 'pta-members',
    title: 'PTA Members',
    eyebrow: 'Parents Association',
    summary: 'Parent representatives who strengthen school-family partnership.',
    body: 'The PTA supports communication between families and the school, helping parents participate meaningfully in school improvement and student welfare.',
    category: 'About Us',
    sections: [
      { heading: 'Parent Partnership', body: 'PTA members help coordinate feedback, projects, and family engagement initiatives.' }
    ]
  },
  {
    slug: 'senior-management',
    title: 'Senior Management',
    eyebrow: 'Leadership',
    summary: 'The administrative team responsible for daily school leadership.',
    body: 'Senior management coordinates academics, student welfare, operations, and communication so that the school runs smoothly every day.',
    category: 'About Us',
    sections: [
      { heading: 'Operational Leadership', body: 'The team works with departments, teachers, parents, and learners to keep priorities aligned.' }
    ]
  },
  {
    slug: 'teaching-staff',
    title: 'Teaching Staff',
    eyebrow: 'Our Teachers',
    summary: 'Dedicated teachers guiding learning, assessment, and mentorship.',
    body: 'Our teaching staff plan lessons, monitor progress, guide learners, and partner with parents to improve outcomes across all classes.',
    category: 'About Us',
    sections: [
      { heading: 'Teaching Approach', body: 'Teachers combine classroom instruction, assignments, feedback, and mentorship to support learners.' }
    ]
  },
  {
    slug: 'students/form-1',
    title: 'Form 1',
    eyebrow: 'Materials and Assignments',
    summary: 'Form 1 learning materials, assignments, and class notices.',
    body: 'This page is available for Form 1 materials, assignments, revision notices, and class-level updates.',
    category: 'Students',
    sections: [
      { heading: 'Assignments', body: 'Administrators can update this page with current assignments and instructions.' },
      { heading: 'Materials', body: 'Add links, notes, or downloadable references for Form 1 learners.' }
    ]
  },
  {
    slug: 'students/form-2',
    title: 'Form 2',
    eyebrow: 'Materials and Assignments',
    summary: 'Form 2 learning materials, assignments, and class notices.',
    body: 'This page is available for Form 2 materials, assignments, revision notices, and class-level updates.',
    category: 'Students',
    sections: [
      { heading: 'Assignments', body: 'Administrators can update this page with current assignments and instructions.' },
      { heading: 'Materials', body: 'Add links, notes, or downloadable references for Form 2 learners.' }
    ]
  },
  {
    slug: 'students/form-3',
    title: 'Form 3',
    eyebrow: 'Materials and Assignments',
    summary: 'Form 3 learning materials, assignments, and class notices.',
    body: 'This page is available for Form 3 materials, assignments, revision notices, and class-level updates.',
    category: 'Students',
    sections: [
      { heading: 'Assignments', body: 'Administrators can update this page with current assignments and instructions.' },
      { heading: 'Materials', body: 'Add links, notes, or downloadable references for Form 3 learners.' }
    ]
  },
  {
    slug: 'students/form-4',
    title: 'Form 4',
    eyebrow: 'Materials and Assignments',
    summary: 'Form 4 learning materials, assignments, and class notices.',
    body: 'This page is available for Form 4 materials, assignments, revision notices, and class-level updates.',
    category: 'Students',
    sections: [
      { heading: 'Assignments', body: 'Administrators can update this page with current assignments and instructions.' },
      { heading: 'Materials', body: 'Add links, notes, or downloadable references for Form 4 learners.' }
    ]
  },
  {
    slug: 'departments/languages',
    title: 'Languages Department',
    eyebrow: 'Departments',
    summary: 'Language, communication, literature, and expression.',
    body: 'The Languages Department develops reading, writing, speaking, listening, and literary appreciation across language subjects.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'Learners build communication confidence through classwork, assignments, reading, and presentations.' }]
  },
  {
    slug: 'departments/sciences',
    title: 'Sciences Department',
    eyebrow: 'Departments',
    summary: 'Scientific inquiry, practical learning, and exam preparation.',
    body: 'The Sciences Department supports learners in biology, chemistry, physics, and related scientific skills.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'The department emphasizes practical work, structured revision, and disciplined inquiry.' }]
  },
  {
    slug: 'departments/technical-creative-arts',
    title: 'Technical & Creative Arts Department',
    eyebrow: 'Departments',
    summary: 'Applied skills, creativity, design, and practical talent development.',
    body: 'The Technical & Creative Arts Department supports practical subjects, creative expression, and innovation.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'Learners develop useful skills through projects, demonstrations, and creative practice.' }]
  },
  {
    slug: 'departments/guidance-counselling',
    title: 'Guidance & Counselling Department',
    eyebrow: 'Departments',
    summary: 'Learner support, mentorship, wellbeing, and character formation.',
    body: 'The Guidance & Counselling Department supports students through mentorship, pastoral care, discipline support, and personal development.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'The department helps learners make responsible decisions and build resilience.' }]
  },
  {
    slug: 'departments/humanities',
    title: 'Humanities Department',
    eyebrow: 'Departments',
    summary: 'Society, history, geography, faith, and civic understanding.',
    body: 'The Humanities Department helps learners understand people, places, culture, responsibility, and society.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'Learners connect classroom knowledge with citizenship, ethics, and the wider world.' }]
  },
  {
    slug: 'departments/boarding',
    title: 'Boarding Department',
    eyebrow: 'Departments',
    summary: 'Boarding welfare, routines, discipline, and student care.',
    body: 'The Boarding Department manages student residence life, safety, routines, hygiene, and welfare.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'The team supports a safe, structured, and caring boarding environment.' }]
  },
  {
    slug: 'departments/mathematics',
    title: 'Mathematics Department',
    eyebrow: 'Departments',
    summary: 'Numeracy, problem-solving, logic, and exam readiness.',
    body: 'The Mathematics Department develops analytical thinking, accuracy, confidence, and strong problem-solving habits.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'Learners receive structured practice, assessment feedback, and revision support.' }]
  },
  {
    slug: 'departments/co-curricular',
    title: 'Co-Curricular Department',
    eyebrow: 'Departments',
    summary: 'Clubs, sports, competitions, leadership, and talent development.',
    body: 'The Co-Curricular Department coordinates activities that build teamwork, leadership, wellness, and student talent.',
    category: 'Departments',
    sections: [{ heading: 'Department Focus', body: 'The department balances academic life with clubs, sports, service, and competitions.' }]
  }
];

function normalizePage(page: Partial<PublicPageContent>): PublicPageContent | null {
  if (!page.slug || !page.title) return null;
  return {
    slug: page.slug.replace(/^\/+|\/+$/g, ''),
    title: page.title,
    eyebrow: page.eyebrow || page.category || 'School Page',
    summary: page.summary || '',
    body: page.body || '',
    category: page.category || 'General',
    heroImage: page.heroImage,
    video: page.video,
    sections: Array.isArray(page.sections)
      ? page.sections.filter((section) => section.heading || section.body).map((section) => ({
          heading: section.heading || 'Section',
          body: section.body || '',
          image: section.image,
          video: section.video
        }))
      : [],
    updatedAt: page.updatedAt
  };
}

export const publicPageService = {
  defaultPages: DEFAULT_PUBLIC_PAGES,

  async list(): Promise<PublicPageContent[]> {
    const setting = await prisma.setting.findFirst({
      where: { group: 'landing', key: 'publicPages' }
    });

    if (setting && Array.isArray(setting.value)) {
      const pages = setting.value
        .map((page) => normalizePage(page as Partial<PublicPageContent>))
        .filter(Boolean) as PublicPageContent[];
      if (pages.length) {
        const existingSlugs = new Set(pages.map((page) => page.slug));
        return [
          ...pages,
          ...DEFAULT_PUBLIC_PAGES.filter((page) => !existingSlugs.has(page.slug))
        ];
      }
    }

    return DEFAULT_PUBLIC_PAGES;
  },

  async getBySlug(slug: string): Promise<PublicPageContent | null> {
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    const pages = await this.list();
    return pages.find((page) => page.slug === cleanSlug) || null;
  },

  async updatePage(slug: string, data: Partial<PublicPageContent>, updatedBy?: string): Promise<PublicPageContent> {
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    const pages = await this.list();
    const existing = pages.find((page) => page.slug === cleanSlug);
    const nextPage = normalizePage({
      ...(existing || { slug: cleanSlug, title: data.title || cleanSlug }),
      ...data,
      slug: cleanSlug,
      updatedAt: new Date().toISOString()
    });

    if (!nextPage) {
      throw new Error('Page title and slug are required.');
    }

    const nextPages = existing
      ? pages.map((page) => (page.slug === cleanSlug ? nextPage : page))
      : [...pages, nextPage];

    await prisma.setting.upsert({
      where: { key: 'publicPages' },
      update: { value: nextPages as unknown as any, group: 'landing', updatedBy: updatedBy || 'system' },
      create: { key: 'publicPages', value: nextPages as unknown as any, group: 'landing', updatedBy: updatedBy || 'system' }
    });

    return nextPage;
  },

  async replaceAll(pages: PublicPageContent[], updatedBy?: string): Promise<PublicPageContent[]> {
    const normalized = pages
      .map((page) => normalizePage(page))
      .filter(Boolean) as PublicPageContent[];

    await prisma.setting.upsert({
      where: { key: 'publicPages' },
      update: { value: normalized as unknown as any, group: 'landing', updatedBy: updatedBy || 'system' },
      create: { key: 'publicPages', value: normalized as unknown as any, group: 'landing', updatedBy: updatedBy || 'system' }
    });

    return normalized;
  },

  async resetToDefault(updatedBy?: string): Promise<PublicPageContent[]> {
    return this.replaceAll(DEFAULT_PUBLIC_PAGES, updatedBy);
  }
};
