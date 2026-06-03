import { useEffect, useState } from 'react';
import { getLandingContent } from '../services/schoolService';
import i18n from '../i18n/i18n';
import { DEFAULT_LANDING_CONTENT } from '../data/defaultLandingContent';
import type { LandingContent } from '../types';

/**
 * Builds localized landing content from i18n translations
 * Ensures the landing page updates when language changes
 */
function buildLocalizedContent(): LandingContent {
  const t = (key: string, defaultValue?: string) => {
    try {
      return i18n.t(`landing.${key}`, { defaultValue });
    } catch {
      return defaultValue || key;
    }
  };

  return {
    school: {
      name: t('schoolName', 'School Hub Academy'),
      tagline: t('schoolTagline', 'Knowledge, Character, Service'),
      summary: t('schoolSummary', 'A connected school community for learners, staff, and parents.'),
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
      badgeLabel: t('liveCampusLabel', 'Live Campus'),
      tickerLabel: t('todayLabel', 'Today'),
      tickerItems: i18n.t('landing.liveCampusItems', { returnObjects: true }) as string[] | undefined,
      aboutHeading: t('aboutHeading', 'A Legacy of Curious Minds'),
      aboutText: t('aboutText', 'We connect academics, communication, admissions, and daily school life in one polished experience for learners, families, and staff.'),
      aboutTag: t('aboutTag', 'Est. 1972'),
      admissionsSteps: i18n.t('landing.admissionsSteps', { returnObjects: true }) as { title: string; description: string; }[] | undefined
    },
    navigation: [
      {
        label: t('navigation.home', 'Home'),
        href: '/'
      },
      {
        label: t('navigation.about', 'About Us'),
        href: '/about',
        children: [
          { label: t('navigation.aboutSchool', 'About the School'), href: '/about-school' },
          { label: t('navigation.infrastructure', 'Infrastructure'), href: '/infrastructure' },
          { label: t('navigation.achievements', 'Our Achievements'), href: '/achievements' },
          { label: t('navigation.location', 'Location'), href: '/location' },
          { label: t('navigation.alumni', 'Alumni'), href: '/alumni' },
          { label: t('navigation.boardOfManagement', 'Board of Management'), href: '/board-of-management' },
          { label: t('navigation.ptaMembers', 'PTA Members'), href: '/pta-members' },
          { label: t('navigation.seniorManagement', 'Senior Management'), href: '/senior-management' },
          { label: t('navigation.teachingStaff', 'Teaching Staff'), href: '/teaching-staff' }
        ]
      },
      {
        label: t('navigation.academics', 'Departments'),
        href: '/academics',
        children: [
          { label: t('navigation.languagesDept', 'Languages Department'), href: '/departments/languages' },
          { label: t('navigation.sciencesDept', 'Sciences Department'), href: '/departments/sciences' },
          { label: t('navigation.technicalCreativeArtsDept', 'Technical & Creative Arts Department'), href: '/departments/technical-creative-arts' },
          { label: t('navigation.guidanceCounsellingDept', 'Guidance & Counselling Department'), href: '/departments/guidance-counselling' },
          { label: t('navigation.humanitiesDept', 'Humanities Department'), href: '/departments/humanities' },
          { label: t('navigation.boardingDept', 'Boarding Department'), href: '/departments/boarding' },
          { label: t('navigation.mathematicsDept', 'Mathematics Department'), href: '/departments/mathematics' },
          { label: t('navigation.cocurricularDept', 'Co-Curricular Department'), href: '/departments/co-curricular' }
        ]
      },
      {
        label: t('navigation.students', 'Students'),
        href: '/life',
        children: [
          { label: t('navigation.form1', 'Form 1'), href: '/students/form-1' },
          { label: t('navigation.form2', 'Form 2'), href: '/students/form-2' },
          { label: t('navigation.form3', 'Form 3'), href: '/students/form-3' },
          { label: t('navigation.form4', 'Form 4'), href: '/students/form-4' }
        ]
      },
      {
        label: t('navigation.media', 'Media'),
        href: '/gallery',
        children: [
          { label: t('navigation.gallery', 'Gallery'), href: '/gallery' },
          { label: t('navigation.downloads', 'Downloads'), href: '/downloads' },
          { label: t('navigation.events', 'Events'), href: '/events' }
        ]
      },
      {
        label: t('navigation.contacts', 'Contacts'),
        href: '/contact'
      }
    ],
    heroSlides: (i18n.t('landing.heroSlides', { returnObjects: true }) as any[]).map((slide: any) => ({
      ...slide,
      image: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
      video: '/assets/videos/Students_walking_in_hallway_202606010835.mp4',
      accent: slide.accent || 'blue'
    })),
    stats: i18n.t('landing.stats', { returnObjects: true }) as { value: string; label: string; }[],
    sections: {
      about: {
        eyebrow: t('sections.aboutEyebrow', 'About School')
      },
      values: {
        eyebrow: t('sections.valuesEyebrow', 'Our Values'),
        heading: t('sections.valuesHeading', 'Excellence, Integrity, Service')
      },
      programs: {
        eyebrow: t('sections.programsEyebrow', 'Academic Programs'),
        heading: t('sections.programsHeading', 'Comprehensive Curriculum')
      },
      life: {
        eyebrow: t('sections.lifeEyebrow', 'Student Life'),
        heading: t('sections.lifeHeading', 'Holistic Development'),
        image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg'
      },
      admissions: {
        eyebrow: t('sections.admissionsEyebrow', 'Admissions')
      }
    },
    values: (i18n.t('landing.values', { returnObjects: true }) as any[]).map((value: any) => ({
      ...value,
      image: '/assets/default-images/kimberly-farmer-lUaaKCUANVI-unsplash.jpg',
      accent: value.accent || 'blue'
    })),
    programs: i18n.t('landing.programs', { returnObjects: true }) as { name: string; level: string; description: string; }[],
    studentLife: i18n.t('landing.studentLife', { returnObjects: true }) as string[],
    admissions: {
      enabled: true,
      heading: t('admissions.heading', 'Admissions Open'),
      text: t('admissions.text', 'We are currently accepting applications for the upcoming academic year.'),
      primaryAction: t('admissions.primaryAction', 'Apply Now'),
      secondaryAction: t('admissions.secondaryAction', 'Schedule a Tour')
    },
    footer: {
      summary: t('footer.summary', 'School Hub Academy keeps learners, families, and staff connected through one modern school platform.'),
      columns: [
        {
          heading: t('footer.schoolHeading', 'School'),
          links: i18n.t('landing.footer.schoolLinks', { returnObjects: true }) as { label: string; href: string; }[]
        },
        {
          heading: t('footer.materialsHeading', 'Materials and Assignments'),
          links: i18n.t('landing.footer.materialsLinks', { returnObjects: true }) as { label: string; href: string; }[]
        },
        {
          heading: t('footer.departmentsHeading', 'Departments'),
          links: i18n.t('landing.footer.departmentLinks', { returnObjects: true }) as { label: string; href: string; }[]
        }
      ],
      socials: i18n.t('landing.footer.socials', { returnObjects: true }) as { label: string; href: string; }[],
      bottomText: t('footer.bottomText', 'School Hub Academy. All rights reserved.')
    }
  };
}

function getLocalLandingContent(): LandingContent {
  try {
    return buildLocalizedContent();
  } catch (error) {
    console.warn('Using default landing content because localization failed:', error);
    return DEFAULT_LANDING_CONTENT;
  }
}

function applyLocalizedText(apiContent: LandingContent): LandingContent {
  const localContent = getLocalLandingContent();

  return {
    ...apiContent,
    navigation: localContent.navigation,
    sections: localContent.sections,
    live: localContent.live,
    admissions: localContent.admissions,
    footer: localContent.footer
  };
}

export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(() => getLocalLandingContent());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getLandingContent()
      .then((apiContent) => {
        if (!isMounted) return;
        setContent(applyLocalizedText(apiContent));
        setError(null);
      })
      .catch((requestError: Error) => {
        if (!isMounted) return;
        setError(null);
        console.warn('Using localized landing content because the API is unavailable:', requestError.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => {
      setContent((currentContent) => applyLocalizedText(currentContent));

      getLandingContent()
        .then((apiContent) => {
          setContent(applyLocalizedText(apiContent));
          setError(null);
        })
        .catch(() => {
          setError(null);
        });
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return { content, error };
}
