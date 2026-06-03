// client/src/components/roles/admin/SiteContentManager.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Edit3, Plus, Save, Trash2, Upload, Wand2, X, 
  Image, Video, Music, FileText, File, FolderOpen,
  Settings, Palette, Layout, Navigation, Home, Phone,
  Mail, MapPin, Globe, Share2 as Facebook, Send as Twitter, Camera as Instagram,
  PlayCircle as Youtube, Briefcase as Linkedin, ChevronDown, ChevronUp, Copy,
  Eye, RefreshCw, Download, Share2, Link, Bold,
  Italic, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Code, Maximize2, Minimize2
} from 'lucide-react';
import MediaGalleryManager from './MediaGalleryManager';
import { footerService, landingContentService, publicPageService } from '../../../services/api';
import { mediaManagementService } from '../../../services/adminService';
import type { LandingContent, NavigationItem, PublicPageSection } from '../../../types';

type FooterColumn = LandingContent['footer']['columns'][number];
type HeroSlide = LandingContent['heroSlides'][number];

const blankNavItem: NavigationItem = { label: 'New link', href: '/' };
const blankHero: HeroSlide = {
  title: 'New hero slide',
  subtitle: 'Describe the promise of this slide.',
  image: '/assets/default-images/hero-default.jpg',
  video: '',
  audio: '',
  playbackRate: 1,
  accent: 'teal'
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function parseLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function parseSteps(value: string) {
  return parseLines(value).map((line) => {
    const [title, description = ''] = line.split('|').map((part) => part.trim());
    return { title, description };
  });
}

interface AssetDropBoxProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  accept: string;
  preview?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'pdf' | 'document';
  onFile: (file?: File) => void;
  onClear?: () => void;
}

function AssetDropBox({ icon, title, hint, accept, preview, mediaType = 'image', onFile, onClear }: AssetDropBoxProps) {
  const [dragging, setDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const renderPreview = () => {
    if (!preview || previewError) return null;
    
    switch(mediaType) {
      case 'image':
        return <img src={preview} alt="" onError={() => setPreviewError(true)} />;
      case 'video':
        return <video src={preview} muted playsInline preload="metadata" />;
      case 'audio':
        return <audio src={preview} controls preload="metadata" />;
      case 'pdf':
        return <embed src={preview} type="application/pdf" />;
      default:
        return <FileText size={32} />;
    }
  };

  return (
    <div
      className={`asset-dropbox ${dragging ? 'is-dragging' : ''} ${preview ? 'has-preview' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFile(event.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
      }}
    >
      {preview && !previewError ? (
        <div className="asset-preview">
          {renderPreview()}
          {onClear && (
            <button 
              className="asset-clear-btn" 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              title="Remove asset"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <>
          <span className="asset-dropbox__icon">{icon}</span>
          <strong>{title}</strong>
          <small>{hint}</small>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(event) => onFile(event.target.files?.[0])} />
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
  defaultExpanded?: boolean;
}

function SectionCard({ title, icon, children, onSave, saving, defaultExpanded = true }: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="section-card-title">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="section-card-actions">
          {onSave && (
            <button 
              className="btn-save-section" 
              onClick={(e) => { e.stopPropagation(); onSave(); }} 
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button className="btn-expand">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      {expanded && <div className="section-card-body">{children}</div>}
    </div>
  );
}

export default function SiteContentManager() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [footer, setFooter] = useState<LandingContent['footer'] | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState('about-school');
  const [pageDraft, setPageDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'navigation' | 'hero' | 'sections' | 'footer' | 'pages' | 'media'>('brand');
  const [fullscreenModal, setFullscreenModal] = useState<string | null>(null);

  const studentLifeText = useMemo(() => (content?.studentLife || []).join('\n'), [content?.studentLife]);
  const tickerText = useMemo(() => (content?.live?.tickerItems || []).join('\n'), [content?.live?.tickerItems]);
  const admissionsStepsText = useMemo(
    () => (content?.live?.admissionsSteps || []).map((step) => `${step.title} | ${step.description}`).join('\n'),
    [content?.live?.admissionsSteps]
  );

  useEffect(() => {
    void loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [landing, footerContent, publicPages] = await Promise.all([
        landingContentService.get(),
        footerService.getContent(),
        publicPageService.list(),
      ]);
      setContent(landing);
      setFooter(footerContent);
      setPages(publicPages || []);
      const firstPage = publicPages?.[0];
      if (firstPage) {
        setSelectedPageSlug(firstPage.slug);
        setPageDraft(firstPage);
      }
    } catch (err) {
      console.error('Failed to load site content', err);
      toast.error('Failed to load site content');
    }
  };

  const updateSchool = (key: string, value: any) => {
    setContent((prev) => prev ? { ...prev, school: { ...prev.school, [key]: value } } : prev);
  };

  const updateSchoolContact = (key: string, value: string) => {
    setContent((prev) => prev ? {
      ...prev,
      school: { ...prev.school, contact: { ...prev.school.contact, [key]: value } }
    } : prev);
  };

  const updateSchoolSocial = (key: string, value: string) => {
    setContent((prev) => prev ? {
      ...prev,
      school: { ...prev.school, social: { ...prev.school.social, [key]: value } }
    } : prev);
  };

  const updateTheme = (key: keyof NonNullable<LandingContent['theme']>, value: string) => {
    setContent((prev) => prev ? { ...prev, theme: { ...(prev.theme || {}), [key]: value } } : prev);
  };

  const updateLive = (key: keyof NonNullable<LandingContent['live']>, value: any) => {
    setContent((prev) => prev ? { ...prev, live: { ...(prev.live || {}), [key]: value } } : prev);
  };

  const handleAssetUpload = async (file: File, tags: string[], onUrl: (url: string) => void) => {
    if (!file) return;
    
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    
    const allValid = [...validTypes.image, ...validTypes.video, ...validTypes.audio, ...validTypes.document];
    
    if (!allValid.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}`);
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }
    
    try {
      const media = await mediaManagementService.uploadMedia(file, {
        title: file.name.replace(/\.[^/.]+$/, ''),
        tags,
      });
      const url = (media as any)?.url || (media as any)?.path || (media as any)?.fileUrl;
      if (url) {
        onUrl(url);
        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Upload failed. Please try again.');
    }
  };

  const updateHero = (index: number, key: keyof HeroSlide, value: string | number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const heroSlides = [...prev.heroSlides];
      heroSlides[index] = { ...heroSlides[index], [key]: value };
      return { ...prev, heroSlides };
    });
  };

  const updateNav = (index: number, key: keyof NavigationItem, value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const navigation = [...prev.navigation];
      navigation[index] = { ...navigation[index], [key]: value };
      return { ...prev, navigation };
    });
  };

  const updateNavChildren = (index: number, childrenText: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const navigation = [...prev.navigation];
      navigation[index] = {
        ...navigation[index],
        children: parseLines(childrenText).map((line) => {
          const [label, href = '/'] = line.split('|').map((part) => part.trim());
          return { label, href };
        })
      };
      return { ...prev, navigation };
    });
  };

  const updateFooterColumn = (index: number, key: keyof FooterColumn, value: any) => {
    setFooter((prev) => {
      if (!prev) return prev;
      const columns = [...prev.columns];
      columns[index] = { ...columns[index], [key]: value };
      return { ...prev, columns };
    });
  };

  const saveAll = async () => {
    if (!content || !footer) return;
    setSaving(true);
    try {
      const [savedLanding, savedFooter] = await Promise.all([
        landingContentService.update({ ...content, footer }),
        footerService.updateContent(footer),
      ]);
      setContent(savedLanding);
      setFooter(savedFooter);
      toast.success('All site content saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save site content');
    } finally {
      setSaving(false);
    }
  };

  const saveSection = async (label: string) => {
    await saveAll();
    toast.success(`${label} saved`);
  };

  const handleSelectPage = async (slug: string) => {
    setSelectedPageSlug(slug);
    try {
      setPageDraft(await publicPageService.getBySlug(slug));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load page');
    }
  };

  const handleSavePage = async () => {
    if (!pageDraft?.slug) return toast.error('No page selected');
    setSaving(true);
    try {
      const saved = await publicPageService.updatePage(pageDraft.slug, pageDraft);
      setPageDraft(saved);
      setPages(await publicPageService.list());
      toast.success('Page saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (!content || !footer) {
    return (
      <div className="site-content-admin">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading website content...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'brand', label: 'Brand & Colors', icon: <Palette size={18} /> },
    { id: 'navigation', label: 'Navigation', icon: <Navigation size={18} /> },
    { id: 'hero', label: 'Hero Slides', icon: <Image size={18} /> },
    { id: 'sections', label: 'Home Sections', icon: <Layout size={18} /> },
    { id: 'footer', label: 'Footer', icon: <FileText size={18} /> },
    { id: 'pages', label: 'Pages', icon: <File size={18} /> },
    { id: 'media', label: 'Media Library', icon: <FolderOpen size={18} /> },
  ];

  return (
    <div className="site-content-admin">
      {/* Header */}
      <header className="site-content-header">
        <div className="header-content">
          <h1>Website Content Manager</h1>
          <p>Complete control over your school's public website - brand, pages, media, and more</p>
        </div>
        <div className="header-actions">
          <button className="btn-preview" onClick={() => window.open('/', '_blank')}>
            <Eye size={16} />
            Preview Site
          </button>
          <button className="btn-primary" onClick={saveAll} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Brand & Colors Tab */}
        {activeTab === 'brand' && (
          <div className="tab-pane">
            <SectionCard title="School Branding" icon={<Home size={20} />} onSave={() => saveSection('Brand')} saving={saving}>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>School Name</label>
                  <input value={content.school.name || ''} onChange={(e) => updateSchool('name', e.target.value)} placeholder="School Name" />
                </div>
                <div className="form-group">
                  <label>Tagline</label>
                  <input value={content.school.tagline || ''} onChange={(e) => updateSchool('tagline', e.target.value)} placeholder="Your motto here" />
                </div>
              </div>
              
              <div className="form-group">
                <label>School Logo</label>
                <div className="asset-drop-grid">
                  <AssetDropBox
                    icon={<Image size={24} />}
                    title="Upload Logo"
                    hint="PNG, JPG, SVG (max 2MB)"
                    accept="image/*"
                    preview={content.school.logo}
                    onFile={(file) => file && handleAssetUpload(file, ['brand', 'logo'], (url) => updateSchool('logo', url))}
                    onClear={() => updateSchool('logo', '')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>School Summary</label>
                <textarea rows={3} value={content.school.summary || ''} onChange={(e) => updateSchool('summary', e.target.value)} placeholder="Brief description of your school" />
              </div>
            </SectionCard>

            <SectionCard title="Contact Information" icon={<Phone size={20} />} onSave={() => saveSection('Contact')} saving={saving}>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label><Phone size={14} /> Phone</label>
                  <input value={content.school.contact.phone || ''} onChange={(e) => updateSchoolContact('phone', e.target.value)} placeholder="+254 700 000 000" />
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> Email</label>
                  <input value={content.school.contact.email || ''} onChange={(e) => updateSchoolContact('email', e.target.value)} placeholder="info@school.com" />
                </div>
                <div className="form-group full-width">
                  <label><MapPin size={14} /> Location</label>
                  <input value={content.school.contact.location || ''} onChange={(e) => updateSchoolContact('location', e.target.value)} placeholder="City, Country" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Social Media Links" icon={<Globe size={20} />} onSave={() => saveSection('Social')} saving={saving}>
              <div className="form-grid two-col">
                <div className="form-group"><label><Facebook size={14} /> Facebook</label><input value={content.school.social?.facebook || ''} onChange={(e) => updateSchoolSocial('facebook', e.target.value)} placeholder="Facebook URL" /></div>
                <div className="form-group"><label><Twitter size={14} /> Twitter</label><input value={content.school.social?.twitter || ''} onChange={(e) => updateSchoolSocial('twitter', e.target.value)} placeholder="Twitter URL" /></div>
                <div className="form-group"><label><Instagram size={14} /> Instagram</label><input value={content.school.social?.instagram || ''} onChange={(e) => updateSchoolSocial('instagram', e.target.value)} placeholder="Instagram URL" /></div>
                <div className="form-group"><label><Youtube size={14} /> YouTube</label><input value={content.school.social?.youtube || ''} onChange={(e) => updateSchoolSocial('youtube', e.target.value)} placeholder="YouTube URL" /></div>
                <div className="form-group"><label><Linkedin size={14} /> LinkedIn</label><input value={content.school.social?.linkedin || ''} onChange={(e) => updateSchoolSocial('linkedin', e.target.value)} placeholder="LinkedIn URL" /></div>
              </div>
            </SectionCard>

            <SectionCard title="Theme Colors" icon={<Palette size={20} />} onSave={() => saveSection('Theme')} saving={saving}>
              <div className="color-grid">
                <div className="color-picker"><label>Background</label><input type="color" value={content.theme?.background || '#f8fafc'} onChange={(e) => updateTheme('background', e.target.value)} /></div>
                <div className="color-picker"><label>Surface</label><input type="color" value={content.theme?.surface || '#ffffff'} onChange={(e) => updateTheme('surface', e.target.value)} /></div>
                <div className="color-picker"><label>Text</label><input type="color" value={content.theme?.text || '#0f172a'} onChange={(e) => updateTheme('text', e.target.value)} /></div>
                <div className="color-picker"><label>Primary Accent</label><input type="color" value={content.theme?.primary || '#2563eb'} onChange={(e) => updateTheme('primary', e.target.value)} /></div>
                <div className="color-picker"><label>Secondary Accent</label><input type="color" value={content.theme?.primaryLight || '#38bdf8'} onChange={(e) => updateTheme('primaryLight', e.target.value)} /></div>
                <div className="color-picker"><label>Alert/Danger</label><input type="color" value={content.theme?.danger || '#e04545'} onChange={(e) => updateTheme('danger', e.target.value)} /></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Navigation Tab */}
        {activeTab === 'navigation' && (
          <div className="tab-pane">
            <SectionCard title="Header Navigation" icon={<Navigation size={20} />} onSave={() => saveSection('Navigation')} saving={saving}>
              <div className="navigation-editor">
                {content.navigation.map((item, index) => (
                  <div key={`${item.href}-${index}`} className="nav-item-editor">
                    <div className="nav-item-header">
                      <div className="form-grid two-col">
                        <input value={item.label} onChange={(e) => updateNav(index, 'label', e.target.value)} placeholder="Link Label" />
                        <input value={item.href} onChange={(e) => updateNav(index, 'href', e.target.value)} placeholder="/path" />
                      </div>
                      <button className="btn-icon danger" onClick={() => setContent({ ...content, navigation: content.navigation.filter((_, i) => i !== index) })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="nav-children">
                      <label>Dropdown Items (one per line: Label | /path)</label>
                      <textarea
                        rows={3}
                        value={(item.children || []).map((child) => `${child.label} | ${child.href}`).join('\n')}
                        onChange={(e) => updateNavChildren(index, e.target.value)}
                        placeholder="About Us | /about&#10;Our Team | /team&#10;Contact | /contact"
                      />
                    </div>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setContent({ ...content, navigation: [...content.navigation, blankNavItem] })}>
                  <Plus size={16} /> Add Navigation Item
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Hero Slides Tab */}
        {activeTab === 'hero' && (
          <div className="tab-pane">
            <SectionCard title="Hero Slides" icon={<Image size={20} />} onSave={() => saveSection('Hero')} saving={saving}>
              <div className="hero-slides-grid">
                {content.heroSlides.map((slide, index) => (
                  <div key={index} className="hero-slide-card">
                    <div className="hero-slide-preview">
                      {slide.video ? (
                        <video src={slide.video} muted playsInline />
                      ) : (
                        <img src={slide.image} alt={slide.title} />
                      )}
                    </div>
                    <div className="hero-slide-info">
                      <h4>{slide.title}</h4>
                      <p>{slide.subtitle}</p>
                      <div className="hero-slide-actions">
                        <button className="btn-edit" onClick={() => setEditingSlideIndex(index)}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button className="btn-danger" onClick={() => setContent({ ...content, heroSlides: content.heroSlides.filter((_, i) => i !== index) })}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-add-full" onClick={() => setContent({ ...content, heroSlides: [...content.heroSlides, blankHero] })}>
                  <Plus size={20} /> Add New Hero Slide
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Live Announcement Bar" icon={<Bell size={20} />} onSave={() => saveSection('Live Bar')} saving={saving}>
              <div className="form-grid two-col">
                <div className="form-group"><label>Live Badge Label</label><input value={content.live?.badgeLabel || ''} onChange={(e) => updateLive('badgeLabel', e.target.value)} /></div>
                <div className="form-group"><label>Ticker Label</label><input value={content.live?.tickerLabel || ''} onChange={(e) => updateLive('tickerLabel', e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label>Ticker Items (one per line)</label>
                <textarea rows={3} value={tickerText} onChange={(e) => updateLive('tickerItems', parseLines(e.target.value))} placeholder="Announcement 1&#10;Announcement 2&#10;Announcement 3" />
              </div>
            </SectionCard>
          </div>
        )}

        {/* Home Sections Tab */}
        {activeTab === 'sections' && (
          <div className="tab-pane">
            <SectionCard title="About Section" icon={<Info size={20} />} onSave={() => saveSection('About')} saving={saving}>
              <div className="form-group"><label>Eyebrow Text</label><input value={content.sections.values.eyebrow} onChange={(e) => setContent({ ...content, sections: { ...content.sections, values: { ...content.sections.values, eyebrow: e.target.value } } })} /></div>
              <div className="form-group"><label>Heading</label><input value={content.sections.values.heading} onChange={(e) => setContent({ ...content, sections: { ...content.sections, values: { ...content.sections.values, heading: e.target.value } } })} /></div>
              <div className="form-group"><label>About Heading</label><textarea rows={2} value={content.live?.aboutHeading || ''} onChange={(e) => updateLive('aboutHeading', e.target.value)} /></div>
              <div className="form-group"><label>About Text</label><textarea rows={4} value={content.live?.aboutText || ''} onChange={(e) => updateLive('aboutText', e.target.value)} /></div>
              <div className="form-group"><label>About Tag</label><input value={content.live?.aboutTag || ''} onChange={(e) => updateLive('aboutTag', e.target.value)} /></div>
            </SectionCard>

            <SectionCard title="Programs Section" icon={<BookOpen size={20} />} onSave={() => saveSection('Programs')} saving={saving}>
              <div className="form-group"><label>Programs Heading</label><input value={content.sections.programs.heading} onChange={(e) => setContent({ ...content, sections: { ...content.sections, programs: { ...content.sections.programs, heading: e.target.value } } })} /></div>
            </SectionCard>

            <SectionCard title="Student Life" icon={<Users size={20} />} onSave={() => saveSection('Student Life')} saving={saving}>
              <div className="form-group">
                <label>Student Life Items (one per line)</label>
                <textarea rows={5} value={studentLifeText} onChange={(e) => setContent({ ...content, studentLife: parseLines(e.target.value) })} placeholder="Sports&#10;Music&#10;Arts&#10;Clubs" />
              </div>
            </SectionCard>

            <SectionCard title="Admissions CTA" icon={<GraduationCap size={20} />} onSave={() => saveSection('Admissions CTA')} saving={saving}>
              <div className="checkbox-group">
                <label><input type="checkbox" checked={content.admissions.enabled !== false} onChange={(e) => setContent({ ...content, admissions: { ...content.admissions, enabled: e.target.checked } })} /> Show admissions block on homepage</label>
              </div>
              <div className="form-group"><label>Heading</label><input value={content.admissions.heading} onChange={(e) => setContent({ ...content, admissions: { ...content.admissions, heading: e.target.value } })} /></div>
              <div className="form-group"><label>Text</label><textarea rows={4} value={content.admissions.text} onChange={(e) => setContent({ ...content, admissions: { ...content.admissions, text: e.target.value } })} /></div>
              <div className="form-grid two-col">
                <div className="form-group"><label>Primary Button Text</label><input value={content.admissions.primaryAction} onChange={(e) => setContent({ ...content, admissions: { ...content.admissions, primaryAction: e.target.value } })} /></div>
                <div className="form-group"><label>Secondary Button Text</label><input value={content.admissions.secondaryAction} onChange={(e) => setContent({ ...content, admissions: { ...content.admissions, secondaryAction: e.target.value } })} /></div>
              </div>
              <div className="form-group"><label>Admissions Steps (Title | Description per line)</label><textarea rows={5} value={admissionsStepsText} onChange={(e) => updateLive('admissionsSteps', parseSteps(e.target.value))} /></div>
            </SectionCard>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && (
          <div className="tab-pane">
            <SectionCard title="Footer Content" icon={<FileText size={20} />} onSave={() => saveSection('Footer')} saving={saving}>
              <div className="form-group"><label>Footer Summary</label><textarea rows={3} value={footer.summary} onChange={(e) => setFooter({ ...footer, summary: e.target.value })} /></div>
              <div className="form-group"><label>Bottom Text / Copyright</label><input value={footer.bottomText} onChange={(e) => setFooter({ ...footer, bottomText: e.target.value })} /></div>
              
              <div className="footer-columns-editor">
                <h4>Footer Columns</h4>
                <div className="footer-columns-grid">
                  {footer.columns.map((column, index) => (
                    <div key={index} className="footer-column-card">
                      <input value={column.heading} onChange={(e) => updateFooterColumn(index, 'heading', e.target.value)} placeholder="Column Heading" />
                      <textarea
                        rows={6}
                        value={column.links.map((link) => `${link.label} | ${link.href}`).join('\n')}
                        onChange={(e) => updateFooterColumn(index, 'links', parseLines(e.target.value).map((line) => {
                          const [label, href = '/'] = line.split('|').map((part) => part.trim());
                          return { label, href };
                        }))}
                        placeholder="About Us | /about&#10;Contact | /contact"
                      />
                      <button className="btn-icon danger" onClick={() => setFooter({ ...footer, columns: footer.columns.filter((_, i) => i !== index) })}>
                        <Trash2 size={14} /> Remove Column
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn-add" onClick={() => setFooter({ ...footer, columns: [...footer.columns, { heading: 'New Column', links: [] }] })}>
                  <Plus size={16} /> Add Footer Column
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="tab-pane">
            <SectionCard title="Editable Pages" icon={<File size={20} />} onSave={handleSavePage} saving={saving}>
              <div className="page-selector">
                <label>Select Page</label>
                <select value={selectedPageSlug} onChange={(e) => void handleSelectPage(e.target.value)}>
                  {pages.map((page) => <option key={page.slug} value={page.slug}>{page.slug.replace(/-/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>

              {pageDraft && (
                <div className="page-editor">
                  <div className="form-group"><label>Page Title</label><input value={pageDraft.title || ''} onChange={(e) => setPageDraft({ ...pageDraft, title: e.target.value })} /></div>
                  <div className="form-group"><label>Eyebrow / Subtitle</label><input value={pageDraft.eyebrow || ''} onChange={(e) => setPageDraft({ ...pageDraft, eyebrow: e.target.value })} /></div>
                  <div className="form-group"><label>Summary / Meta Description</label><textarea rows={2} value={pageDraft.summary || ''} onChange={(e) => setPageDraft({ ...pageDraft, summary: e.target.value })} /></div>
                  
                  <div className="form-group">
                    <label>Hero Image</label>
                    <div className="asset-drop-grid">
                      <AssetDropBox
                        icon={<Image size={24} />}
                        title="Upload Hero Image"
                        hint="JPG, PNG, WebP (max 5MB)"
                        accept="image/*"
                        preview={pageDraft.heroImage}
                        onFile={(file) => file && handleAssetUpload(file, ['page', pageDraft.slug, 'hero'], (url) => setPageDraft({ ...pageDraft, heroImage: url }))}
                        onClear={() => setPageDraft({ ...pageDraft, heroImage: '' })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Page Video (Optional)</label>
                    <div className="asset-drop-grid">
                      <AssetDropBox
                        icon={<Video size={24} />}
                        title="Upload Page Video"
                        hint="MP4, WebM (max 50MB)"
                        accept="video/*"
                        preview={pageDraft.video}
                        mediaType="video"
                        onFile={(file) => file && handleAssetUpload(file, ['page', pageDraft.slug, 'video'], (url) => setPageDraft({ ...pageDraft, video: url }))}
                        onClear={() => setPageDraft({ ...pageDraft, video: '' })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Page Body Content</label>
                    <textarea rows={8} value={pageDraft.body || ''} onChange={(e) => setPageDraft({ ...pageDraft, body: e.target.value })} placeholder="Full page content here..." />
                  </div>

                  <div className="sections-editor">
                    <h4>Page Sections</h4>
                    {(pageDraft.sections || []).map((section: PublicPageSection, index: number) => (
                      <div key={index} className="page-section-card">
                        <div className="section-header">
                          <input value={section.heading} onChange={(e) => {
                            const sections = [...(pageDraft.sections || [])];
                            sections[index] = { ...sections[index], heading: e.target.value };
                            setPageDraft({ ...pageDraft, sections });
                          }} placeholder="Section Heading" />
                          <button className="btn-icon danger" onClick={() => setPageDraft({ ...pageDraft, sections: (pageDraft.sections || []).filter((_: any, i: number) => i !== index) })}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea rows={4} value={section.body} onChange={(e) => {
                          const sections = [...(pageDraft.sections || [])];
                          sections[index] = { ...sections[index], body: e.target.value };
                          setPageDraft({ ...pageDraft, sections });
                        }} placeholder="Section content..." />
                        <div className="asset-drop-grid small">
                          <AssetDropBox
                            icon={<Image size={20} />}
                            title="Section Image"
                            hint="Optional"
                            accept="image/*"
                            preview={section.image}
                            onFile={(file) => file && handleAssetUpload(file, ['page', pageDraft.slug, 'section'], (url) => {
                              const sections = [...(pageDraft.sections || [])];
                              sections[index] = { ...sections[index], image: url };
                              setPageDraft({ ...pageDraft, sections });
                            })}
                          />
                          <AssetDropBox
                            icon={<Video size={20} />}
                            title="Section Video"
                            hint="Optional"
                            accept="video/*"
                            preview={section.video}
                            mediaType="video"
                            onFile={(file) => file && handleAssetUpload(file, ['page', pageDraft.slug, 'section-video'], (url) => {
                              const sections = [...(pageDraft.sections || [])];
                              sections[index] = { ...sections[index], video: url };
                              setPageDraft({ ...pageDraft, sections });
                            })}
                          />
                          <AssetDropBox
                            icon={<Music size={20} />}
                            title="Section Audio"
                            hint="Optional audio"
                            accept="audio/*"
                            preview={section.audio}
                            mediaType="audio"
                            onFile={(file) => file && handleAssetUpload(file, ['page', pageDraft.slug, 'audio'], (url) => {
                              const sections = [...(pageDraft.sections || [])];
                              sections[index] = { ...sections[index], audio: url };
                              setPageDraft({ ...pageDraft, sections });
                            })}
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add" onClick={() => setPageDraft({ ...pageDraft, sections: [...(pageDraft.sections || []), { heading: 'New Section', body: '', image: '', video: '', audio: '' }] })}>
                      <Plus size={16} /> Add Page Section
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Media Library Tab */}
        {activeTab === 'media' && (
          <div className="tab-pane">
            <MediaGalleryManager />
          </div>
        )}
      </div>

      {/* Hero Slide Edit Modal */}
      {editingSlideIndex !== null && content.heroSlides[editingSlideIndex] && (
        <div className="modal-overlay" onClick={() => setEditingSlideIndex(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Hero Slide</h3>
              <button className="close-btn" onClick={() => setEditingSlideIndex(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="slide-preview">
                {content.heroSlides[editingSlideIndex].video ? (
                  <video src={content.heroSlides[editingSlideIndex].video} controls playsInline />
                ) : (
                  <img src={content.heroSlides[editingSlideIndex].image} alt="" />
                )}
              </div>
              <div className="form-group"><label>Title</label><input value={content.heroSlides[editingSlideIndex].title} onChange={(e) => updateHero(editingSlideIndex, 'title', e.target.value)} /></div>
              <div className="form-group"><label>Subtitle</label><textarea rows={3} value={content.heroSlides[editingSlideIndex].subtitle} onChange={(e) => updateHero(editingSlideIndex, 'subtitle', e.target.value)} /></div>
              <div className="asset-drop-grid">
                <AssetDropBox icon={<Image size={20} />} title="Slide Image" hint="JPG, PNG, WebP" accept="image/*" preview={content.heroSlides[editingSlideIndex].image} onFile={(file) => file && handleAssetUpload(file, ['hero', 'slide'], (url) => updateHero(editingSlideIndex, 'image', url))} />
                <AssetDropBox icon={<Video size={20} />} title="Slide Video" hint="MP4, WebM" accept="video/*" preview={content.heroSlides[editingSlideIndex].video} mediaType="video" onFile={(file) => file && handleAssetUpload(file, ['hero', 'video'], (url) => updateHero(editingSlideIndex, 'video', url))} />
                <AssetDropBox icon={<Music size={20} />} title="Background Audio" hint="MP3, WAV" accept="audio/*" preview={content.heroSlides[editingSlideIndex].audio} mediaType="audio" onFile={(file) => file && handleAssetUpload(file, ['hero', 'audio'], (url) => updateHero(editingSlideIndex, 'audio', url))} />
              </div>
              <div className="form-grid two-col">
                <div className="form-group"><label>Video Speed</label><select value={content.heroSlides[editingSlideIndex].playbackRate || 1} onChange={(e) => updateHero(editingSlideIndex, 'playbackRate', Number(e.target.value))}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                </select></div>
                <div className="form-group"><label>Accent Color</label><select value={content.heroSlides[editingSlideIndex].accent} onChange={(e) => updateHero(editingSlideIndex, 'accent', e.target.value)}>
                  {['blue', 'violet', 'teal', 'cyan', 'rose', 'amber', 'indigo'].map((accent) => <option key={accent} value={accent}>{accent}</option>)}
                </select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingSlideIndex(null)}>Close</button>
              <button className="btn-primary" onClick={() => { saveSection('Hero Slide'); setEditingSlideIndex(null); }}>Save Slide</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Site Content Manager CSS */
        .site-content-admin {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f8fafc;
        }

        /* Header */
        .site-content-header {
          background: white;
          border-radius: 20px;
          padding: 24px 32px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
        }

        .header-content h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px 16px;
          border-radius: 60px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow-x: auto;
          flex-wrap: wrap;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 40px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .tab-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .tab-btn.active {
          background: #1d8a8a;
          color: white;
        }

        /* Tab Content */
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tab-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Section Cards */
        .section-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .section-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #fafbfc;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }

        .section-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-card-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .section-card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-card-body {
          padding: 24px;
        }

        /* Form Elements */
        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #1d8a8a;
          box-shadow: 0 0 0 3px rgba(29,138,138,0.1);
        }

        .form-grid {
          display: grid;
          gap: 20px;
        }

        .form-grid.two-col {
          grid-template-columns: repeat(2, 1fr);
        }

        .full-width {
          grid-column: span 2;
        }

        /* Asset Dropbox */
        .asset-drop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .asset-drop-grid.small {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }

        .asset-dropbox {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafbfc;
          position: relative;
        }

        .asset-dropbox:hover, .asset-dropbox.is-dragging {
          border-color: #1d8a8a;
          background: rgba(29,138,138,0.05);
        }

        .asset-dropbox.has-preview {
          padding: 0;
          background: #f3f4f6;
        }

        .asset-preview {
          position: relative;
          height: 150px;
          overflow: hidden;
          border-radius: 14px;
        }

        .asset-preview img, .asset-preview video, .asset-preview audio, .asset-preview embed {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .asset-clear-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }

        .asset-dropbox__icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .asset-dropbox strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .asset-dropbox small {
          font-size: 11px;
          color: #6b7280;
        }

        /* Color Grid */
        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }

        .color-picker label {
          display: block;
          font-size: 12px;
          margin-bottom: 8px;
          color: #6b7280;
        }

        .color-picker input {
          width: 100%;
          height: 48px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
        }

        /* Navigation Editor */
        .navigation-editor {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .nav-item-editor {
          background: #f9fafb;
          border-radius: 16px;
          padding: 16px;
        }

        .nav-item-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .nav-item-header .form-grid {
          flex: 1;
          margin-bottom: 0;
        }

        .nav-children label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
          display: block;
        }

        /* Hero Slides */
        .hero-slides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .hero-slide-card {
          background: #f9fafb;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .hero-slide-preview {
          height: 180px;
          overflow: hidden;
        }

        .hero-slide-preview img, .hero-slide-preview video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-slide-info {
          padding: 16px;
        }

        .hero-slide-info h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .hero-slide-info p {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .hero-slide-actions {
          display: flex;
          gap: 8px;
        }

        /* Footer Columns */
        .footer-columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .footer-column-card {
          background: #f9fafb;
          border-radius: 16px;
          padding: 16px;
        }

        .footer-column-card input {
          margin-bottom: 12px;
        }

        /* Buttons */
        .btn-primary, .btn-secondary, .btn-outline, .btn-preview, .btn-add, .btn-add-full, .btn-edit, .btn-danger, .btn-save-section {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #156f6f; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-secondary:hover { background: #e5e7eb; }
        .btn-outline { background: transparent; border: 1px solid #e5e7eb; color: #374151; }
        .btn-outline:hover { background: #f3f4f6; }
        .btn-preview { background: #fef3c7; color: #d97706; }
        .btn-preview:hover { background: #fde68a; }
        .btn-add { background: transparent; color: #1d8a8a; padding: 8px 12px; }
        .btn-add:hover { background: rgba(29,138,138,0.1); }
        .btn-add-full { background: #f3f4f6; color: #374151; width: 100%; justify-content: center; padding: 16px; }
        .btn-add-full:hover { background: #e5e7eb; }
        .btn-edit { background: #e0e7ff; color: #4338ca; padding: 6px 12px; }
        .btn-danger { background: #fee2e2; color: #dc2626; padding: 6px 12px; }
        .btn-danger:hover { background: #fecaca; }
        .btn-save-section { background: transparent; border: 1px solid #e5e7eb; padding: 6px 12px; font-size: 13px; }
        .btn-save-section:hover { background: #f3f4f6; }

        .btn-icon {
          padding: 8px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: transparent;
        }

        .btn-icon.danger:hover { background: #fee2e2; color: #dc2626; }

        /* Checkbox */
        .checkbox-group {
          margin-bottom: 20px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .slide-preview {
          margin-bottom: 24px;
          border-radius: 16px;
          overflow: hidden;
          background: #1f2937;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slide-preview img, .slide-preview video {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
        }

        /* Page Editor */
        .page-selector {
          margin-bottom: 24px;
        }

        .page-selector select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .page-section-card {
          background: #f9fafb;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header input {
          flex: 1;
          font-size: 16px;
          font-weight: 600;
        }

        /* Loading */
        .loading-container {
          text-align: center;
          padding: 60px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e5e7eb;
          border-top-color: #1d8a8a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .site-content-admin { padding: 16px; }
          .site-content-header { flex-direction: column; gap: 16px; text-align: center; }
          .form-grid.two-col { grid-template-columns: 1fr; }
          .full-width { grid-column: span 1; }
          .tab-navigation { border-radius: 16px; }
          .tab-btn { padding: 8px 14px; font-size: 12px; }
          .hero-slides-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
