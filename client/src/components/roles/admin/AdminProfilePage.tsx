import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Bell,
  Lock,
  Globe,
  Palette,
  HardDrive,
  Accessibility,
  MessageSquare,
  Share2,
  Camera,
  Edit3,
  Check,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  socialLinks: SocialLinks;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    announcements: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts';
    showEmail: boolean;
    showPhone: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

const AdminProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    bio: '',
    socialLinks: {},
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
      announcements: true,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
    },
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.put('/admin/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setProfileData({ ...profileData, avatar: response.data.avatarUrl });
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/admin/profile', profileData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'storage', label: 'Storage & Data', icon: HardDrive },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'help', label: 'Help & Feedback', icon: MessageSquare },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="glass-input w-full"
                  />
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Bio</h3>
              <textarea
                value={profileData.bio || ''}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                className="glass-input w-full h-32 resize-none"
              />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <input type="password" autoComplete="current-password" placeholder="Current Password" className="glass-input w-full" />
                <input type="password" autoComplete="new-password" placeholder="New Password" className="glass-input w-full" />
                <input type="password" autoComplete="new-password" placeholder="Confirm New Password" className="glass-input w-full" />
                <button className="glass-button-primary">Update Password</button>
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <span>Enable 2FA</span>
                <button className="glass-toggle">OFF</button>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            {Object.entries(profileData.notifications).map(([key, value]) => (
              <div key={key} className="glass-card p-4 flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <button
                  onClick={() => setProfileData({
                    ...profileData,
                    notifications: { ...profileData.notifications, [key]: !value }
                  })}
                  className={`glass-toggle ${value ? 'active' : ''}`}
                >
                  {value ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        );
      case 'social':
        return (
          <div className="space-y-4">
            {[
              { key: 'instagram', label: 'Instagram' },
              { key: 'twitter', label: 'Twitter' },
              { key: 'facebook', label: 'Facebook' },
              { key: 'linkedin', label: 'LinkedIn' },
              { key: 'github', label: 'GitHub' },
            ].map(({ key, label }) => (
              <div key={key} className="glass-card p-4 flex items-center gap-3">
                <input
                  type="url"
                  placeholder={`${label} Profile URL`}
                  value={profileData.socialLinks[key as keyof SocialLinks] || ''}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    socialLinks: { ...profileData.socialLinks, [key]: e.target.value }
                  })}
                  className="glass-input flex-1"
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-card p-6 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={profileData.avatar || `https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=random`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 glass-button p-2 rounded-full"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
              <p className="text-white/70">Administrator</p>
            </div>
            <nav className="glass-card mt-6 p-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full glass-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{section.label}</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </button>
                );
              })}
              <button onClick={logout} className="w-full glass-nav-item text-red-400">
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            </nav>
          </div>
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold capitalize">{activeSection}</h2>
                {activeSection !== 'help' && (
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="glass-button-primary"
                  >
                    {isEditing ? (
                      <>
                        <Check size={16} />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit3 size={16} />
                        Edit
                      </>
                    )}
                  </button>
                )}
              </div>
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          color: white;
          outline: none;
          transition: all 0.3s;
        }
        .glass-input:focus {
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }
        .glass-input:disabled {
          opacity: 0.6;
        }
        .glass-button-primary {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: white;
          font-weight: 500;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .glass-button-primary:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .glass-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          color: white;
          transition: all 0.3s;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .glass-nav-item:hover, .glass-nav-item.active {
          background: rgba(255, 255, 255, 0.2);
        }
        .glass-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        .glass-toggle.active {
          background: #4F46E5;
          color: white;
        }
        .glass-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default AdminProfilePage;
