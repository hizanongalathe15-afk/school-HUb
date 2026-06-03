// client/src/components/roles/admin/SchoolProfile.tsx
import { useState, useEffect } from 'react';
import {
  Building2,
  CalendarDays,
  Clock,
  Contact,
  Edit3,
  Eye,
  Globe2,
  Palette,
  Plus,
  Save,
  School,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail,
  Share2 as Facebook,
  Send as Twitter,
  Camera as Instagram,
  Briefcase as Linkedin,
  PlayCircle as Youtube,
  Award,
  Users,
  BookOpen,
  Clock as ClockIcon,
  Calendar,
  CreditCard,
  Shield,
  Heart,
  Globe,
  Upload,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { schoolManagementService, mediaManagementService } from '../../../services/adminService';
import toast from 'react-hot-toast';
import type { SchoolProfile as SchoolProfileData, AcademicCalendar } from '../../../types/admin';
import SiteContentManager from './SiteContentManager';

export default function SchoolProfile() {
  const [profile, setProfile] = useState<SchoolProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Partial<SchoolProfileData>>({});
  const [selectedBranch, setSelectedBranch] = useState<SchoolProfileData['branches'][0] | null>(null);
  const [branchForm, setBranchForm] = useState<Partial<SchoolProfileData['branches'][0]>>({ isActive: true });

  const emptyAcademicCalendar = (): AcademicCalendar => ({
    term1Start: '',
    term1End: '',
    term2Start: '',
    term2End: '',
    term3Start: '',
    term3End: '',
    holidays: [],
  });
  const [isBranchEditorOpen, setIsBranchEditorOpen] = useState(false);
  const [branchSaving, setBranchSaving] = useState(false);
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await schoolManagementService.getProfile();
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Failed to fetch school profile:', error);
      toast.error('Failed to load school profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.name.trim() === '') {
      toast.error('School name is required');
      return;
    }

    try {
      setSaving(true);
      await schoolManagementService.updateProfile(formData);
      toast.success('School profile saved successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to save school profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBrandingUpdate = async (data: { logo?: string; favicon?: string; coverImage?: string; primaryColor?: string; secondaryColor?: string }) => {
    try {
      setSaving(true);
      await schoolManagementService.updateBranding(data);
      toast.success('Branding updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update branding:', error);
      toast.error('Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  const uploadFileAndSet = async (file: File, type: 'logo' | 'favicon' | 'coverImage') => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const media = await mediaManagementService.uploadMedia(file, { 
        title: file.name.replace(/\.[^/.]+$/, ''),
        tags: ['school', type]
      });
      const url = (media && (media.url || media.path || (media as any).fileUrl)) || '';
      if (!url) {
        toast.error('Upload failed: no URL returned');
        return;
      }
      const payload: any = {};
      payload[type] = url;
      await handleBrandingUpdate(payload);
    } catch (e) {
      console.error('Upload error', e);
      toast.error('Failed to upload file');
    } finally {
      setSaving(false);
    }
  };

  const resetBranchForm = () => {
    setBranchForm({ isActive: true });
    setIsEditingBranch(false);
    setSelectedBranch(null);
  };

  const openAddBranch = () => {
    resetBranchForm();
    setIsBranchEditorOpen(true);
  };

  const openEditBranch = (branch: SchoolProfile['branches'][0]) => {
    setBranchForm(branch);
    setIsEditingBranch(true);
    setSelectedBranch(null);
    setIsBranchEditorOpen(true);
  };

  const openViewBranch = (branch: SchoolProfile['branches'][0]) => {
    setSelectedBranch(branch);
    setIsBranchEditorOpen(false);
  };

  const closeBranchEditor = () => {
    setIsBranchEditorOpen(false);
    resetBranchForm();
  };

  const handleBranchSubmit = async () => {
    if (!branchForm.name?.trim() || !branchForm.address?.trim()) {
      toast.error('Branch name and address are required');
      return;
    }

    try {
      setBranchSaving(true);
      if (isEditingBranch && branchForm.id) {
        const updatedBranch = await schoolManagementService.updateBranch(branchForm.id, {
          name: branchForm.name,
          address: branchForm.address,
          phone: branchForm.phone,
          email: branchForm.email,
          principalName: branchForm.principalName,
          isActive: branchForm.isActive,
        });
        setProfile((current) => current ? {
          ...current,
          branches: current.branches.map((branch) => branch.id === updatedBranch.id ? updatedBranch : branch),
        } : current);
        toast.success('Branch updated successfully');
      } else {
        const addedBranch = await schoolManagementService.addBranch({
          name: branchForm.name || '',
          address: branchForm.address || '',
          phone: branchForm.phone || '',
          email: branchForm.email || '',
          principalName: branchForm.principalName || '',
          isActive: branchForm.isActive ?? true,
        });
        setProfile((current) => current ? {
          ...current,
          branches: [...current.branches, addedBranch],
        } : current);
        toast.success('Branch added successfully');
      }
      closeBranchEditor();
    } catch (error) {
      console.error('Branch save failed', error);
      toast.error('Failed to save branch');
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    const confirmed = window.confirm('Delete this branch? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setBranchSaving(true);
      await schoolManagementService.deleteBranch(branchId);
      setProfile((current) => current ? {
        ...current,
        branches: current.branches.filter((branch) => branch.id !== branchId),
      } : current);
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
      }
      toast.success('Branch deleted successfully');
    } catch (error) {
      console.error('Failed to delete branch', error);
      toast.error('Failed to delete branch');
    } finally {
      setBranchSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading school profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: School, description: 'School overview and statistics' },
    { id: 'general', label: 'General', icon: BookOpen, description: 'Basic school information' },
    { id: 'contact', label: 'Contact', icon: Contact, description: 'Contact details & social media' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Logo, colors & theme' },
    { id: 'academic', label: 'Academic', icon: CalendarDays, description: 'Terms, calendar & hours' },
    { id: 'branches', label: 'Branches', icon: Building2, description: 'Manage school branches' },
    { id: 'website', label: 'Website', icon: Globe2, description: 'Public website content' },
  ];

  // Quick stats for overview
  const stats = [
    { label: 'Total Students', value: profile?.totalStudents || 0, icon: Users, color: 'blue' },
    { label: 'Total Teachers', value: profile?.totalTeachers || 0, icon: Users, color: 'green' },
    { label: 'Total Staff', value: profile?.totalStaff || 0, icon: Shield, color: 'purple' },
    { label: 'Active Branches', value: profile?.branches?.filter(b => b.isActive).length || 0, icon: Building2, color: 'orange' },
    { label: 'Founded', value: profile?.foundingYear || 'N/A', icon: Calendar, color: 'teal' },
    { label: 'Accreditation', value: profile?.accreditation || 'Registered', icon: Award, color: 'indigo' },
  ];

  return (
    <div className="school-profile-container">
      {/* Hero Section - Enhanced */}
      <div className="profile-hero">
        <div className="profile-hero-background">
          {profile?.coverImage ? (
            <img src={profile.coverImage} alt="School Cover" className="hero-bg-image" />
          ) : (
            <div className="hero-bg-gradient"></div>
          )}
          <div className="hero-overlay"></div>
        </div>
        <div className="profile-hero-content">
          <div className="hero-logo-wrapper">
            {profile?.logo ? (
              <img src={profile.logo} alt="School Logo" className="hero-logo" />
            ) : (
              <div className="hero-logo-placeholder">
                <School size={48} />
              </div>
            )}
          </div>
          <div className="hero-info">
            <h1>{formData.name || 'School Name'}</h1>
            {formData.motto && <p className="hero-motto">"{formData.motto}"</p>}
            <div className="hero-stats">
              <div className="hero-stat">
                <Users size={16} />
                <span>{profile?.totalStudents || 0} Students</span>
              </div>
              <div className="hero-stat">
                <BookOpen size={16} />
                <span>{profile?.totalTeachers || 0} Teachers</span>
              </div>
              <div className="hero-stat">
                <Building2 size={16} />
                <span>{profile?.branches?.length || 0} Branches</span>
              </div>
            </div>
            <div className="hero-contact">
              {formData.contactPhone && <span><Phone size={14} /> {formData.contactPhone}</span>}
              {formData.contactEmail && <span><Mail size={14} /> {formData.contactEmail}</span>}
              {(formData.city || formData.country) && <span><MapPin size={14} /> {[formData.city, formData.country].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="quick-stats">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.description}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Overview Tab - NEW */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>School Overview</h3>
              <p>At-a-glance view of your school's key information</p>
            </div>
            
            <div className="overview-grid">
              {/* Vision & Mission */}
              <div className="info-card">
                <h4><Heart size={18} /> Vision</h4>
                <p>{formData.vision || 'Not set yet'}</p>
              </div>
              <div className="info-card">
                <h4><Award size={18} /> Mission</h4>
                <p>{formData.mission || 'Not set yet'}</p>
              </div>
              
              {/* History */}
              <div className="info-card full-width">
                <h4><BookOpen size={18} /> School History</h4>
                <p>{formData.history || 'No history added yet'}</p>
              </div>
              
              {/* Contact Summary */}
              <div className="info-card">
                <h4><Contact size={18} /> Contact Information</h4>
                <div className="contact-summary">
                  <p><Phone size={14} /> {formData.contactPhone || 'Not set'}</p>
                  <p><Mail size={14} /> {formData.contactEmail || 'Not set'}</p>
                  <p><MapPin size={14} /> {formData.address || 'Not set'}</p>
                  <p><Globe size={14} /> {formData.website || 'Not set'}</p>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="info-card">
                <h4><Globe2 size={18} /> Social Media</h4>
                <div className="social-summary">
                  {formData.socialMedia?.facebook && <p><Facebook size={14} /> Facebook</p>}
                  {formData.socialMedia?.twitter && <p><Twitter size={14} /> Twitter</p>}
                  {formData.socialMedia?.instagram && <p><Instagram size={14} /> Instagram</p>}
                  {formData.socialMedia?.linkedin && <p><Linkedin size={14} /> LinkedIn</p>}
                  {!formData.socialMedia?.facebook && !formData.socialMedia?.twitter && !formData.socialMedia?.instagram && <p>No social media links added</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Information Tab - Enhanced */}
        {activeTab === 'general' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>General Information</h3>
              <p>Basic details about your school</p>
            </div>
            <div className="form-grid two-col">
              <div className="form-group">
                <label>School Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter school name"
                />
              </div>

              <div className="form-group">
                <label>Motto / Tagline</label>
                <input
                  type="text"
                  value={formData.motto || ''}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  placeholder="Excellence in Education"
                />
              </div>

              <div className="form-group full-width">
                <label>Vision Statement</label>
                <textarea
                  value={formData.vision || ''}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  rows={3}
                  placeholder="To be a center of academic excellence..."
                />
              </div>

              <div className="form-group full-width">
                <label>Mission Statement</label>
                <textarea
                  value={formData.mission || ''}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  rows={3}
                  placeholder="To provide quality education..."
                />
              </div>

              <div className="form-group">
                <label>Founding Year</label>
                <input
                  type="number"
                  value={formData.foundingYear ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, foundingYear: v ? parseInt(v, 10) : undefined });
                  }}
                  placeholder="e.g., 1995"
                />
              </div>

              <div className="form-group">
                <label>Accreditation Status</label>
                <select
                  value={formData.accreditation || ''}
                  onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                >
                  <option value="">Select status</option>
                  <option value="Registered">Registered</option>
                  <option value="Accredited">Accredited</option>
                  <option value="Pending">Pending</option>
                  <option value="Provisional">Provisional</option>
                </select>
              </div>

              <div className="form-group">
                <label>School Type</label>
                <select
                  value={formData.schoolType || ''}
                  onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="International">International</option>
                  <option value="Religious">Religious</option>
                </select>
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.school.com"
                />
              </div>

              <div className="form-group full-width">
                <label>School History / About Us</label>
                <textarea
                  value={formData.history || ''}
                  onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                  rows={6}
                  placeholder="Write about your school's history, achievements, and legacy..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab - Enhanced with social media */}
        {activeTab === 'contact' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Contact Information</h3>
              <p>How people can reach your school</p>
            </div>
            
            <h4>Primary Contact</h4>
            <div className="form-grid two-col">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="form-group">
                <label>Alternative Phone</label>
                <input
                  type="tel"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="+254 700 000 001"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="info@school.com"
                />
              </div>

              <div className="form-group">
                <label>Admissions Email</label>
                <input
                  type="email"
                  value={formData.admissionsEmail || ''}
                  onChange={(e) => setFormData({ ...formData, admissionsEmail: e.target.value })}
                  placeholder="admissions@school.com"
                />
              </div>
            </div>

            <h4>Physical Address</h4>
            <div className="form-grid two-col">
              <div className="form-group full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 School Road"
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Nairobi"
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Kenya"
                />
              </div>

              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="00100"
                />
              </div>

              <div className="form-group">
                <label>P.O. Box</label>
                <input
                  type="text"
                  value={formData.poBox || ''}
                  onChange={(e) => setFormData({ ...formData, poBox: e.target.value })}
                  placeholder="P.O. Box 12345"
                />
              </div>
            </div>

            <h4>Social Media Links</h4>
            <div className="form-grid two-col">
              <div className="form-group">
                <label><Facebook size={16} /> Facebook</label>
                <input
                  type="url"
                  value={formData.socialMedia?.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                  })}
                  placeholder="https://facebook.com/school"
                />
              </div>

              <div className="form-group">
                <label><Twitter size={16} /> Twitter/X</label>
                <input
                  type="url"
                  value={formData.socialMedia?.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                  })}
                  placeholder="https://twitter.com/school"
                />
              </div>

              <div className="form-group">
                <label><Instagram size={16} /> Instagram</label>
                <input
                  type="url"
                  value={formData.socialMedia?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/school"
                />
              </div>

              <div className="form-group">
                <label><Linkedin size={16} /> LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialMedia?.linkedin || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, linkedin: e.target.value }
                  })}
                  placeholder="https://linkedin.com/school/school"
                />
              </div>

              <div className="form-group">
                <label><Youtube size={16} /> YouTube</label>
                <input
                  type="url"
                  value={formData.socialMedia?.youtube || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, youtube: e.target.value }
                  })}
                  placeholder="https://youtube.com/c/school"
                />
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab - Enhanced */}
        {activeTab === 'branding' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Branding & Visual Identity</h3>
              <p>Customize your school's look and feel</p>
            </div>
            
            <div className="branding-section">
              <div className="logo-upload-grid">
                <div className="logo-upload-card">
                  <h4>School Logo</h4>
                  <div className="logo-preview">
                    {profile?.logo ? (
                      <img src={profile.logo} alt="School Logo" />
                    ) : (
                      <div className="preview-placeholder">
                        <School size={48} />
                        <span>No logo uploaded</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFileAndSet(f, 'logo');
                      e.target.value = '';
                    }}
                  />
                  <button className="btn-upload" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload size={16} /> Upload Logo
                  </button>
                  <small>PNG, JPG, SVG. Max 2MB</small>
                </div>

                <div className="logo-upload-card">
                  <h4>Favicon</h4>
                  <div className="logo-preview favicon-preview">
                    {profile?.favicon ? (
                      <img src={profile.favicon} alt="Favicon" />
                    ) : (
                      <div className="preview-placeholder">
                        <Globe2 size={32} />
                        <span>No favicon</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFileAndSet(f, 'favicon');
                      e.target.value = '';
                    }}
                  />
                  <button className="btn-upload" onClick={() => document.getElementById('favicon-upload')?.click()}>
                    <Upload size={16} /> Upload Favicon
                  </button>
                  <small>ICO, PNG. 16x16 or 32x32</small>
                </div>

                <div className="logo-upload-card">
                  <h4>Cover Image</h4>
                  <div className="logo-preview cover-preview">
                    {profile?.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" />
                    ) : (
                      <div className="preview-placeholder">
                        <ImageIcon size={32} />
                        <span>No cover image</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFileAndSet(f, 'coverImage');
                      e.target.value = '';
                    }}
                  />
                  <button className="btn-upload" onClick={() => document.getElementById('cover-upload')?.click()}>
                    <Upload size={16} /> Upload Cover
                  </button>
                  <small>JPG, PNG. Recommended: 1200x400</small>
                </div>
              </div>

              <div className="color-section">
                <h4>Theme Colors</h4>
                <div className="color-grid">
                  <div className="color-picker">
                    <label>Primary Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={formData.primaryColor || '#1d8a8a'}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={formData.primaryColor || '#1d8a8a'}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-picker">
                    <label>Secondary Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={formData.secondaryColor || '#f59e0b'}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor || '#f59e0b'}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-picker">
                    <label>Accent Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={formData.accentColor || '#10b981'}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={formData.accentColor || '#10b981'}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab - Combined Calendar & Hours */}
        {activeTab === 'academic' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Academic Settings</h3>
              <p>Manage terms, calendar, and school hours</p>
            </div>
            
            {/* Calendar Section */}
            <div className="academic-section">
              <h4>Academic Calendar</h4>
              <div className="form-grid two-col">
                <div className="form-group">
                  <label>Term 1 Start</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term1Start || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term1Start: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Term 1 End</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term1End || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term1End: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Term 2 Start</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term2Start || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term2Start: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Term 2 End</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term2End || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term2End: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Term 3 Start</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term3Start || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term3Start: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Term 3 End</label>
                  <input
                    type="date"
                    value={formData.academicCalendar?.term3End || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), term3End: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="holidays-section">
                <h4>School Holidays</h4>
                <div className="holidays-list">
                  {formData.academicCalendar?.holidays?.map((holiday, index) => (
                    <div key={index} className="holiday-item">
                      <input
                        type="text"
                        value={holiday.name}
                        placeholder="Holiday Name"
                        onChange={(e) => {
                          const holidays = [...(formData.academicCalendar?.holidays || [])];
                          holidays[index].name = e.target.value;
                          setFormData({ ...formData, academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), holidays } });
                        }}
                      />
                      <input
                        type="date"
                        value={holiday.startDate}
                        onChange={(e) => {
                          const holidays = [...(formData.academicCalendar?.holidays || [])];
                          holidays[index].startDate = e.target.value;
                          setFormData({ ...formData, academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), holidays } });
                        }}
                      />
                      <input
                        type="date"
                        value={holiday.endDate}
                        onChange={(e) => {
                          const holidays = [...(formData.academicCalendar?.holidays || [])];
                          holidays[index].endDate = e.target.value;
                          setFormData({ ...formData, academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), holidays } });
                        }}
                      />
                      <button
                        className="btn-icon danger"
                        onClick={() => {
                          const holidays = [...(formData.academicCalendar?.holidays || [])];
                          holidays.splice(index, 1);
                          setFormData({ ...formData, academicCalendar: { ...(formData.academicCalendar ?? emptyAcademicCalendar()), holidays } });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-add"
                  onClick={() => {
                    const existing = formData.academicCalendar ?? emptyAcademicCalendar();
                    const holidays = [...(existing.holidays || []), { name: '', startDate: '', endDate: '' }];
                    setFormData({ ...formData, academicCalendar: { ...existing, holidays } });
                  }}
                >
                  <Plus size={16} /> Add Holiday
                </button>
              </div>
            </div>

            {/* School Hours Section */}
            <div className="academic-section">
              <h4>School Hours</h4>
              <div className="form-grid two-col">
                <h5>Monday - Friday</h5>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.mondayToFriday?.start || '08:00'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          mondayToFriday: { ...formData.schoolHours?.mondayToFriday, start: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.mondayToFriday?.end || '16:00'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          mondayToFriday: { ...formData.schoolHours?.mondayToFriday, end: e.target.value }
                        }
                      });
                    }}
                  />
                </div>

                <h5>Saturday</h5>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.saturday?.start || '08:00'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          saturday: { ...formData.schoolHours?.saturday, start: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.saturday?.end || '12:00'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          saturday: { ...formData.schoolHours?.saturday, end: e.target.value }
                        }
                      });
                    }}
                  />
                </div>

                <h5>Sunday</h5>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.sunday?.start || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          sunday: { ...formData.schoolHours?.sunday, start: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.schoolHours?.sunday?.end || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        schoolHours: {
                          ...formData.schoolHours,
                          sunday: { ...formData.schoolHours?.sunday, end: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branches Tab - Existing */}
        {activeTab === 'branches' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>School Branches / Campuses</h3>
              <p>Manage multiple school locations</p>
              <button className="btn-primary" onClick={openAddBranch}>
                <Plus size={16} /> Add Branch
              </button>
            </div>

            {/* Branch Editor Modal */}
            {isBranchEditorOpen && (
              <div className="branch-editor">
                <div className="branch-editor-header">
                  <h4>{isEditingBranch ? 'Edit Branch' : 'New Branch'}</h4>
                  <button className="close-btn" onClick={closeBranchEditor}>
                    <X size={18} />
                  </button>
                </div>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>Branch Name *</label>
                    <input
                      value={branchForm.name || ''}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="e.g., Main Campus"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <input
                      value={branchForm.address || ''}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={branchForm.phone || ''}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      placeholder="+254 700 000000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={branchForm.email || ''}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      placeholder="branch@school.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Principal/Head</label>
                    <input
                      value={branchForm.principalName || ''}
                      onChange={(e) => setBranchForm({ ...branchForm, principalName: e.target.value })}
                      placeholder="Principal name"
                    />
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={branchForm.isActive ?? true}
                        onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>
                <div className="branch-editor-footer">
                  <button className="btn-secondary" onClick={closeBranchEditor}>Cancel</button>
                  <button className="btn-primary" onClick={handleBranchSubmit} disabled={branchSaving}>
                    {branchSaving ? 'Saving...' : 'Save Branch'}
                  </button>
                </div>
              </div>
            )}

            {/* Branch View Modal */}
            {selectedBranch && (
              <div className="branch-viewer">
                <div className="branch-viewer-header">
                  <h4>{selectedBranch.name}</h4>
                  <button className="close-btn" onClick={() => setSelectedBranch(null)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="branch-details">
                  <p><strong>Address:</strong> {selectedBranch.address}</p>
                  <p><strong>Phone:</strong> {selectedBranch.phone || 'Not set'}</p>
                  <p><strong>Email:</strong> {selectedBranch.email || 'Not set'}</p>
                  <p><strong>Principal:</strong> {selectedBranch.principalName || 'Not set'}</p>
                  <p><strong>Status:</strong> <span className={`status ${selectedBranch.isActive ? 'active' : 'inactive'}`}>
                    {selectedBranch.isActive ? 'Active' : 'Inactive'}
                  </span></p>
                </div>
              </div>
            )}

            {/* Branches List */}
            <div className="branches-grid">
              {profile?.branches?.map((branch) => (
                <div key={branch.id} className="branch-card">
                  <div className="branch-card-header">
                    <h4>{branch.name}</h4>
                    <span className={`status-badge ${branch.isActive ? 'active' : 'inactive'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="branch-card-body">
                    <p><MapPin size={14} /> {branch.address}</p>
                    {branch.phone && <p><Phone size={14} /> {branch.phone}</p>}
                    {branch.email && <p><Mail size={14} /> {branch.email}</p>}
                    {branch.principalName && <p><Users size={14} /> {branch.principalName}</p>}
                  </div>
                  <div className="branch-card-actions">
                    <button className="icon-btn" onClick={() => openViewBranch(branch)} title="View">
                      <Eye size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => openEditBranch(branch)} title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDeleteBranch(branch.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {(!profile?.branches || profile.branches.length === 0) && (
                <div className="empty-state">
                  <Building2 size={48} />
                  <p>No branches added yet</p>
                  <button className="btn-primary" onClick={openAddBranch}>Add Your First Branch</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Website Tab */}
        {activeTab === 'website' && (
          <div className="tab-panel website-panel">
            <SiteContentManager />
          </div>
        )}
      </div>

      <style>{`
        .school-profile-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        /* Hero Section */
        .profile-hero {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .profile-hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .hero-bg-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-bg-gradient {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
        }

        .profile-hero-content {
          position: relative;
          padding: 40px;
          display: flex;
          gap: 32px;
          align-items: center;
          color: white;
          z-index: 1;
        }

        .hero-logo-wrapper {
          flex-shrink: 0;
        }

        .hero-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
          background: white;
          border-radius: 20px;
          padding: 12px;
        }

        .hero-logo-placeholder {
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-info {
          flex: 1;
        }

        .hero-info h1 {
          font-size: 32px;
          margin: 0 0 8px 0;
        }

        .hero-motto {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 16px;
          font-style: italic;
        }

        .hero-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
        }

        .hero-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .hero-contact {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          font-size: 13px;
          opacity: 0.8;
        }

        .hero-contact span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hero-actions {
          flex-shrink: 0;
        }

        .btn-save {
          background: #1d8a8a;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Quick Stats */
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-card.stat-blue .stat-icon { background: #e0e7ff; color: #4338ca; }
        .stat-card.stat-green .stat-icon { background: #d1fae5; color: #059669; }
        .stat-card.stat-purple .stat-icon { background: #e9d5ff; color: #7e22ce; }
        .stat-card.stat-orange .stat-icon { background: #fed7aa; color: #c2410c; }
        .stat-card.stat-teal .stat-icon { background: #ccfbf1; color: #0f766e; }
        .stat-card.stat-indigo .stat-icon { background: #c7d2fe; color: #4338ca; }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          display: block;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }

        /* Tabs */
        .profile-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px 16px;
          border-radius: 60px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
        .profile-content {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tab-panel {
          animation: fadeIn 0.3s ease;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .panel-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        /* Forms */
        .form-grid {
          display: grid;
          gap: 20px;
        }

        .form-grid.two-col {
          grid-template-columns: repeat(2, 1fr);
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }

        .form-group input, .form-group select, .form-group textarea {
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

        /* Overview Grid */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: #f9fafb;
          border-radius: 16px;
          padding: 20px;
        }

        .info-card.full-width {
          grid-column: span 2;
        }

        .info-card h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .info-card p {
          margin: 0;
          line-height: 1.5;
          color: #4b5563;
        }

        .contact-summary p, .social-summary p {
          margin: 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Branding */
        .branding-section {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .logo-upload-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .logo-upload-card {
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .logo-preview {
          width: 150px;
          height: 150px;
          margin: 0 auto 16px;
          background: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .logo-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
        }

        .favicon-preview {
          width: 64px;
          height: 64px;
        }

        .cover-preview {
          width: 200px;
          height: 100px;
        }

        .btn-upload {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .color-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .color-input-wrapper input[type="color"] {
          width: 50px;
          height: 42px;
          padding: 4px;
        }

        .color-input-wrapper input[type="text"] {
          flex: 1;
        }

        /* Academic Section */
        .academic-section {
          margin-bottom: 32px;
        }

        .academic-section h4 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .academic-section h5 {
          margin: 16px 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .holidays-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .holiday-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          align-items: center;
        }

        /* Branches */
        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .branch-card {
          background: #f9fafb;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
        }

        .branch-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .branch-card-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .branch-card-body p {
          margin: 8px 0;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .branch-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .branch-editor, .branch-viewer {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .branch-editor-header, .branch-viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #dc2626;
        }

        .icon-btn {
          padding: 6px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: transparent;
        }

        .icon-btn:hover {
          background: #f3f4f6;
        }

        .icon-btn.danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-primary, .btn-secondary, .btn-add {
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-add { background: transparent; color: #1d8a8a; }

        .empty-state {
          text-align: center;
          padding: 60px;
          color: #9ca3af;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .profile-hero-content { flex-direction: column; text-align: center; }
          .hero-stats, .hero-contact { justify-content: center; }
          .form-grid.two-col { grid-template-columns: 1fr; }
          .form-group.full-width { grid-column: span 1; }
          .holiday-item { grid-template-columns: 1fr; }
          .profile-tabs { border-radius: 16px; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
