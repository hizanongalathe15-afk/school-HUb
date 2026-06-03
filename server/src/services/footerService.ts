import { prisma } from '../config/database.js';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface FooterSocial {
  label: string;
  href: string;
}

export interface FooterContent {
  summary: string;
  columns: FooterColumn[];
  socials: FooterSocial[];
  bottomText: string;
}

const DEFAULT_FOOTER: FooterContent = {
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
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'TikTok', href: 'https://www.tiktok.com' },
    { label: 'X', href: 'https://x.com' }
  ],
  bottomText: 'School Hub Academy. All rights reserved.'
};

export const footerService = {
  async getContent(): Promise<FooterContent> {
    try {
      const setting = await prisma.setting.findFirst({
        where: { group: 'landing', key: 'footer' }
      });

      if (setting && typeof setting.value === 'object' && setting.value !== null) {
        const footer = setting.value as unknown as FooterContent;
        if (`${footer.summary} ${footer.bottomText}`.includes('Girls High School - Karinga')) {
          return DEFAULT_FOOTER;
        }
        return footer;
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
    }

    return DEFAULT_FOOTER;
  },

  async updateContent(data: Partial<FooterContent>, updatedBy?: string): Promise<FooterContent> {
    const currentContent = await this.getContent();
    const updatedContent = { ...currentContent, ...data };

    // Validate columns structure
    if (updatedContent.columns) {
      updatedContent.columns = updatedContent.columns.map(col => ({
        heading: col.heading || 'Untitled',
        links: Array.isArray(col.links) ? col.links.filter(l => l.label && l.href) : []
      })).filter(col => col.heading);
    }

    // Validate socials structure
    if (updatedContent.socials) {
      updatedContent.socials = updatedContent.socials.filter(s => s.label && s.href);
    }

    await prisma.setting.upsert({
      where: { key: 'footer' },
      update: {
        value: updatedContent as unknown as any,
        group: 'landing',
        updatedBy: updatedBy || 'system'
      },
      create: {
        key: 'footer',
        value: updatedContent as unknown as any,
        group: 'landing',
        updatedBy: updatedBy || 'system'
      }
    });

    return updatedContent;
  },

  async resetToDefault(updatedBy?: string): Promise<FooterContent> {
    await prisma.setting.upsert({
      where: { key: 'footer' },
      update: {
        value: DEFAULT_FOOTER as unknown as any,
        group: 'landing',
        updatedBy: updatedBy || 'system'
      },
      create: {
        key: 'footer',
        value: DEFAULT_FOOTER as unknown as any,
        group: 'landing',
        updatedBy: updatedBy || 'system'
      }
    });

    return DEFAULT_FOOTER;
  }
};
