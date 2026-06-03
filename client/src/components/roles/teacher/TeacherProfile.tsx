import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  User, Shield, Bell, Lock, Smartphone, Globe, Palette, Image, MessageSquare,
  HardDrive, HelpCircle, Share2, LogOut, Camera, ChevronRight, Moon, Sun, 
  Monitor, Check, Upload, FileText, Mail, X, ArrowLeft, Database, Video, 
  Music, File, Key, Users, BookOpen, Calendar, RefreshCw, Edit2, Save,
  Clock, Award, Target, Zap, Heart, TrendingUp, Activity, Briefcase,
  School, MapPin, Phone, Mail as MailIcon, Link, Send as Twitter, Share2 as Facebook, Camera as Instagram,
  Briefcase as Linkedin, Code as Github, Flag, AlertCircle, CheckCircle, XCircle, Eye, EyeOff,
  CreditCard, DollarSign, Receipt, Download, Printer, Settings, Trophy
} from 'lucide-react';
import { authService } from '../../../services/api';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface TeacherProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  photo?: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  qualifications: Qualification[];
  experience: Experience[];
  certifications: Certification[];
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  joinDate: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  nationality: string;
  languages: string[];
  status: 'active' | 'inactive' | 'on_leave';
  teachingHours: number;
  classes: AssignedClass[];
  subjects: AssignedSubject[];
  achievements: Achievement[];
  skills: string[];
  bio: string;
  socialLinks: SocialLinks;
  preferences: TeacherPreferences;
  stats: TeacherStats;
}

interface Qualification {
  id: string;
  degree: string;
  institution: string;
  year: number;
  grade: string;
}

interface Experience {
  id: string;
  institution: string;
  position: string;
  fromDate: string;
  toDate: string;
  responsibilities: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  certificateUrl: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
}

interface AssignedClass {
  id: string;
  name: string;
  stream: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface AssignedSubject {
  id: string;
  name: string;
  code: string;
  level: string;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
  awardType: string;
}

interface SocialLinks {
  twitter: string;
  linkedin: string;
  github: string;
  website: string;
}

interface TeacherPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  announcements: boolean;
  homework: boolean;
  meetings: boolean;
  attendance: boolean;
  discipline: boolean;
}

interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showProfileToStudents: boolean;
  showProfileToParents: boolean;
}

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  averageAttendance: number;
  averageGrade: number;
  completedLessons: number;
  pendingAssignments: number;
  meetingsHeld: number;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }> = ({
  children,
  className = '',
  onClick,
  style,
}) => (
  <div
    className={`glass-card ${className}`}
    onClick={onClick}
    style={{
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  badge?: string | number;
  danger?: boolean;
  value?: string;
}> = ({ icon, label, description, onClick, badge, danger = false, value }) => (
  <div
    className={`menu-item ${onClick ? 'menu-item-clickable' : ''} ${danger ? 'menu-item-danger' : ''}`}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.2s',
    }}
  >
    <div className="menu-item-icon" style={{ color: danger ? '#f87171' : '#1d8a8a' }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{label}</div>
      {description && (
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{description}</div>
      )}
    </div>
    {value && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{value}</div>}
    {badge && (
      <div
        style={{
          background: '#1d8a8a',
          color: 'white',
          fontSize: '0.75rem',
          padding: '2px 8px',
          borderRadius: 10,
          fontWeight: 600,
        }}
      >
        {badge}
      </div>
    )}
    {onClick && <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />}
  </div>
);

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({
  enabled,
  onChange,
  disabled = false,
}) => (
  <button
    type="button"
    className={`toggle-switch ${enabled ? 'toggle-enabled' : ''}`}
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    style={{
      width: 44,
      height: 24,
      background: enabled ? '#1d8a8a' : 'rgba(255,255,255,0.3)',
      border: 'none',
      borderRadius: 999,
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: enabled ? 22 : 2,
        width: 20,
        height: 20,
        background: 'white',
        borderRadius: '50%',
        transition: 'left 0.2s',
      }}
    />
  </button>
);

type SettingsSection = 
  | 'profile' 
  | 'personal' 
  | 'professional' 
  | 'account' 
  | 'notifications' 
  | 'security' 
  | 'classes' 
  | 'subjects'
  | 'privacy'
  | 'language' 
  | 'help' 
  | 'social'
  | 'bank'
  | 'statistics'
  | 'achievements'
  | 'documents';

export default function TeacherProfile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [showBackButton, setShowBackButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showEditQualification, setShowEditQualification] = useState(false);
  const [showEditExperience, setShowEditExperience] = useState(false);
  const [showEditCertification, setShowEditCertification] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);

  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await teacherService.profile.getProfile();
      if (res?.success && res.data) {
        // Map Teacher type to TeacherProfileData with defaults for missing fields
        const profileData: TeacherProfileData = {
          ...res.data,
          phone: res.data.phone || '',
          avatar: res.data.avatar || '',
          photo: res.data.avatar || '',
          address: (res.data as any).address || '',
          employeeId: (res.data as any).employeeId || '',
          experience: (res.data as any).experience || [],
          qualifications: (res.data as any).qualifications || [],
          certifications: (res.data as any).certifications || [],
          emergencyContact: (res.data as any).emergencyContact || { name: '', relationship: '', phone: '', email: '' },
          bankDetails: (res.data as any).bankDetails || { bankName: '', accountName: '', accountNumber: '', branchCode: '' },
          joinDate: (res.data as any).joinDate || '',
          dateOfBirth: (res.data as any).dateOfBirth || '',
          gender: (res.data as any).gender || 'other',
          bloodGroup: (res.data as any).bloodGroup || '',
          nationality: (res.data as any).nationality || '',
          languages: (res.data as any).languages || [],
          status: (res.data as any).status || 'active',
          teachingHours: (res.data as any).teachingHours || 0,
          classes: (res.data as any).classes || [],
          subjects: (res.data as any).subjects || [],
          achievements: (res.data as any).achievements || [],
          skills: (res.data as any).skills || [],
          bio: (res.data as any).bio || '',
          socialLinks: (res.data as any).socialLinks || { twitter: '', linkedin: '', github: '', website: '' },
          preferences: (res.data as any).preferences || { theme: 'light', language: 'English', notifications: { email: true, sms: true, push: true, announcements: true, homework: true, meetings: true, attendance: true, discipline: true }, privacy: { showEmail: true, showPhone: true, showProfileToStudents: true, showProfileToParents: true } },
          stats: (res.data as any).stats || { totalStudents: 0, totalClasses: 0, totalSubjects: 0, averageAttendance: 0, averageGrade: 0, completedLessons: 0, pendingAssignments: 0, meetingsHeld: 0 },
        };
        setProfile(profileData);
        const avatarUrl = res.data.avatar || user?.avatar || '';
        if (avatarUrl) setPreview(avatarUrl);
        setEditFormData(profileData);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await teacherService.profile.uploadAvatar(file);
      if (response.success) {
        setPreview(response.data.avatar);
        toast.success('Profile photo updated!');
        loadProfile();
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const response = await teacherService.profile.updateProfile(editFormData);
      if (response.success) {
        // Map response to TeacherProfileData with defaults
        const profileData: TeacherProfileData = {
          ...response.data,
          phone: response.data.phone || '',
          avatar: response.data.avatar || '',
          photo: response.data.avatar || '',
          address: (response.data as any).address || '',
          employeeId: (response.data as any).employeeId || '',
          experience: (response.data as any).experience || [],
          qualifications: (response.data as any).qualifications || [],
          certifications: (response.data as any).certifications || [],
          emergencyContact: (response.data as any).emergencyContact || { name: '', relationship: '', phone: '', email: '' },
          bankDetails: (response.data as any).bankDetails || { bankName: '', accountName: '', accountNumber: '', branchCode: '' },
          joinDate: (response.data as any).joinDate || '',
          dateOfBirth: (response.data as any).dateOfBirth || '',
          gender: (response.data as any).gender || 'other',
          bloodGroup: (response.data as any).bloodGroup || '',
          nationality: (response.data as any).nationality || '',
          languages: (response.data as any).languages || [],
          status: (response.data as any).status || 'active',
          teachingHours: (response.data as any).teachingHours || 0,
          classes: (response.data as any).classes || [],
          subjects: (response.data as any).subjects || [],
          achievements: (response.data as any).achievements || [],
          skills: (response.data as any).skills || [],
          bio: (response.data as any).bio || '',
          socialLinks: (response.data as any).socialLinks || { twitter: '', linkedin: '', github: '', website: '' },
          preferences: (response.data as any).preferences || { theme: 'light', language: 'English', notifications: { email: true, sms: true, push: true, announcements: true, homework: true, meetings: true, attendance: true, discipline: true }, privacy: { showEmail: true, showPhone: true, showProfileToStudents: true, showProfileToParents: true } },
          stats: (response.data as any).stats || { totalStudents: 0, totalClasses: 0, totalSubjects: 0, averageAttendance: 0, averageGrade: 0, completedLessons: 0, pendingAssignments: 0, meetingsHeld: 0 },
        };
        setProfile(profileData);
        setEditMode(false);
        toast.success('Profile updated successfully');
        loadProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await teacherService.profile.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.success) {
        toast.success('Password changed successfully');
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Log out?',
      message: 'Your current session will end and you will be redirected to the login page.',
      confirmText: 'Log out',
      type: 'warning',
    });
    if (!confirmed) return;
    try {
      await authService.logout();
    } catch {
      // Continue to clear local state even if backend logout fails.
    }
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    setActiveSection('profile');
    setShowBackButton(false);
    setEditMode(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = () => {
    if (!profile) return 'TE';
    return `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" showLabel label="Loading profile..." />
      </div>
    );
  }

  return (
    <div
      className="teacher-profile"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {showBackButton ? (
          <button
            onClick={handleBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: 8,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'white',
            margin: 0,
          }}
        >
          {activeSection === 'profile' && 'My Profile'}
          {activeSection === 'personal' && (editMode ? 'Edit Personal Info' : 'Personal Information')}
          {activeSection === 'professional' && 'Professional Details'}
          {activeSection === 'account' && 'Account Settings'}
          {activeSection === 'notifications' && 'Notifications'}
          {activeSection === 'security' && 'Security'}
          {activeSection === 'classes' && 'My Classes'}
          {activeSection === 'subjects' && 'My Subjects'}
          {activeSection === 'privacy' && 'Privacy Settings'}
          {activeSection === 'language' && 'Language'}
          {activeSection === 'help' && 'Help & Support'}
          {activeSection === 'social' && 'Social Links'}
          {activeSection === 'bank' && 'Bank Details'}
          {activeSection === 'statistics' && 'Teaching Statistics'}
          {activeSection === 'achievements' && 'Achievements'}
          {activeSection === 'documents' && 'Documents'}
        </h1>
        {activeSection !== 'profile' && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: 8,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit2 size={18} />
          </button>
        )}
        {editMode && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setEditMode(false);
                setEditFormData(profile);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: 8,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              style={{
                background: '#1d8a8a',
                border: 'none',
                color: 'white',
                padding: 8,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
            </button>
          </div>
        )}
        {activeSection === 'profile' && <div style={{ width: 40 }} />}
      </div>

      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        {/* Main Profile View */}
        {activeSection === 'profile' && profile && (
          <div>
            {/* Profile Header */}
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    background: preview ? '#e0f2fe' : 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 48, color: 'white' }}>{getInitials()}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#667eea',
                  }}
                >
                  {saving ? <RefreshCw size={18} className="spin" /> : <Camera size={18} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ color: 'white' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px' }}>
                  {profile.firstName} {profile.lastName}
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                  {profile.department} • {profile.specialization}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#4ade80', margin: '4px 0 0' }}>
                  Employee ID: {profile.employeeId}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Users size={24} style={{ color: '#4ade80' }} />
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.stats?.totalStudents || 0}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Students</div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BookOpen size={24} style={{ color: '#60a5fa' }} />
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.stats?.totalClasses || 0}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Classes</div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Award size={24} style={{ color: '#fbbf24' }} />
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.stats?.averageGrade || 0}%</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Avg. Grade</div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Calendar size={24} style={{ color: '#f87171' }} />
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.stats?.meetingsHeld || 0}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Meetings</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Menu Sections */}
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Personal Section */}
              <GlassCard>
                <div style={{ padding: '8px 0', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    PERSONAL
                  </h3>
                </div>
                <MenuItem
                  icon={<User size={22} />}
                  label="Personal Information"
                  description="Name, contact, and basic details"
                  value={`${profile.firstName} ${profile.lastName}`}
                  onClick={() => {
                    setActiveSection('personal');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Briefcase size={22} />}
                  label="Professional Details"
                  description="Department, specialization, experience"
                  value={profile.department}
                  onClick={() => {
                    setActiveSection('professional');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Award size={22} />}
                  label="Qualifications & Certifications"
                  description="Degrees, certificates, and training"
                  badge={profile.qualifications?.length || 0}
                  onClick={() => {
                    setActiveSection('professional');
                    setShowBackButton(true);
                  }}
                />
              </GlassCard>

              {/* Teaching Section */}
              <GlassCard>
                <div style={{ padding: '8px 0', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    TEACHING
                  </h3>
                </div>
                <MenuItem
                  icon={<BookOpen size={22} />}
                  label="My Classes"
                  description="View assigned classes"
                  badge={profile.classes?.length || 0}
                  onClick={() => {
                    setActiveSection('classes');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Target size={22} />}
                  label="My Subjects"
                  description="Subjects I teach"
                  badge={profile.subjects?.length || 0}
                  onClick={() => {
                    setActiveSection('subjects');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<TrendingUp size={22} />}
                  label="Teaching Statistics"
                  description="Performance metrics"
                  onClick={() => {
                    setActiveSection('statistics');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Trophy size={22} />}
                  label="Achievements"
                  description="Awards and recognitions"
                  badge={profile.achievements?.length || 0}
                  onClick={() => {
                    setActiveSection('achievements');
                    setShowBackButton(true);
                  }}
                />
              </GlassCard>

              {/* Account Section */}
              <GlassCard>
                <div style={{ padding: '8px 0', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    ACCOUNT
                  </h3>
                </div>
                <MenuItem
                  icon={<MailIcon size={22} />}
                  label="Email Address"
                  description={profile.email}
                  value={profile.email}
                  onClick={() => {
                    setActiveSection('account');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Phone size={22} />}
                  label="Phone Number"
                  description={profile.phone || 'Not set'}
                  value={profile.phone}
                  onClick={() => {
                    setActiveSection('account');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Shield size={22} />}
                  label="Security"
                  description="Password, 2FA settings"
                  onClick={() => {
                    setActiveSection('security');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<CreditCard size={22} />}
                  label="Bank Details"
                  description="Salary account information"
                  onClick={() => {
                    setActiveSection('bank');
                    setShowBackButton(true);
                  }}
                />
              </GlassCard>

              {/* Preferences Section */}
              <GlassCard>
                <div style={{ padding: '8px 0', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    PREFERENCES
                  </h3>
                </div>
                <MenuItem
                  icon={<Bell size={22} />}
                  label="Notifications"
                  description="Manage alerts and sounds"
                  onClick={() => {
                    setActiveSection('notifications');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Lock size={22} />}
                  label="Privacy"
                  description="Control who sees your information"
                  onClick={() => {
                    setActiveSection('privacy');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Globe size={22} />}
                  label="Language"
                  description={profile.preferences?.language || 'English'}
                  value={profile.preferences?.language || 'English'}
                  onClick={() => {
                    setActiveSection('language');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Share2 size={22} />}
                  label="Social Links"
                  description="Connect social profiles"
                  onClick={() => {
                    setActiveSection('social');
                    setShowBackButton(true);
                  }}
                />
              </GlassCard>

              {/* Support Section */}
              <GlassCard>
                <div style={{ padding: '8px 0', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    SUPPORT
                  </h3>
                </div>
                <MenuItem
                  icon={<HelpCircle size={22} />}
                  label="Help & Support"
                  description="FAQs, guides, and contact support"
                  onClick={() => {
                    setActiveSection('help');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<FileText size={22} />}
                  label="Documents"
                  description="Contracts, certificates, and forms"
                  onClick={() => {
                    setActiveSection('documents');
                    setShowBackButton(true);
                  }}
                />
              </GlassCard>

              {/* Danger Zone */}
              <GlassCard style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <MenuItem
                  icon={<LogOut size={22} />}
                  label="Log Out"
                  description="Sign out of your account"
                  danger
                  onClick={handleLogout}
                />
              </GlassCard>
            </div>
          </div>
        )}

        {/* Personal Information Section */}
        {activeSection === 'personal' && profile && (
          <div style={{ color: 'white' }}>
            {!editMode ? (
              <>
                <GlassCard>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Full Name</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.firstName} {profile.lastName}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Email Address</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.email}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Phone Number</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Date of Birth</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{formatDate(profile.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Gender</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.gender?.toUpperCase() || 'Not specified'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Blood Group</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.bloodGroup || 'Not specified'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Nationality</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Address</label>
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Languages</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {profile.languages?.map(lang => (
                          <span key={lang} style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem' }}>
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Emergency Contact</label>
                      {profile.emergencyContact ? (
                        <div style={{ marginTop: 8, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
                          <p><strong>Name:</strong> {profile.emergencyContact.name}</p>
                          <p><strong>Relationship:</strong> {profile.emergencyContact.relationship}</p>
                          <p><strong>Phone:</strong> {profile.emergencyContact.phone}</p>
                          <p><strong>Email:</strong> {profile.emergencyContact.email}</p>
                        </div>
                      ) : (
                        <p>No emergency contact set</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth?.split('T')[0] || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>Address</label>
                    <textarea
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      rows={3}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div style={{ color: 'white' }}>
            <GlassCard>
              <MenuItem
                icon={<Key size={22} />}
                label="Change Password"
                description="Update your password"
                onClick={() => setShowChangePassword(true)}
              />
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Two-Factor Authentication</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>Add an extra layer of security</p>
                  </div>
                  <Toggle enabled={false} onChange={() => {}} />
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Login Alerts</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>Get notified of new logins</p>
                  </div>
                  <Toggle enabled={true} onChange={() => {}} />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Classes Section */}
        {activeSection === 'classes' && profile && (
          <div style={{ color: 'white' }}>
            {profile.classes?.map((cls) => (
              <GlassCard key={cls.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{cls.name} {cls.stream}</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '4px 0 0' }}>
                      {cls.studentCount} students
                    </p>
                  </div>
                  {cls.isClassTeacher && (
                    <span style={{ background: '#4ade80', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem' }}>
                      Class Teacher
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Subjects Section */}
        {activeSection === 'subjects' && profile && (
          <div style={{ color: 'white' }}>
            {profile.subjects?.map((subject) => (
              <GlassCard key={subject.id}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{subject.name}</h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '4px 0 0' }}>
                    {subject.code} • {subject.level}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Password" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Key className="w-4 h-4 mr-1" />}
              Change Password
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmation.isOpen}
        onCancel={confirmation.cancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmLabel={confirmation.config.confirmText}
        cancelLabel={confirmation.config.cancelText}
        type={confirmation.config.type}
        loading={confirmation.isLoading}
      />

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .menu-item-clickable:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .menu-item-danger {
          color: #f87171;
        }
        .menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .toggle-switch {
          transition: background 0.2s;
        }
      `}</style>
    </div>
  );
}
