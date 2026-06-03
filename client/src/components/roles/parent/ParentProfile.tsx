import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  User, Shield, Bell, Lock, Smartphone, Globe, HardDrive, HelpCircle, Share2,
  LogOut, Camera, ChevronRight, Moon, Sun, Monitor, Check, Upload, FileText, Mail,
  X, ArrowLeft, Database, Video, Music, File, Key, Users, BookOpen, Calendar,
  RefreshCw, MessageCircle, Edit2, Save, CreditCard, MapPin, Clock, Award,
  TrendingUp, Activity, Heart, Phone, Download, Printer, Eye, AlertCircle
} from 'lucide-react';
import { authService } from '../../../services/api';
import parentService from '../../../services/parentService';
import type {
  CommunicationPreferences,
  NotificationPreferences,
  ParentApiResponse,
  ParentChild,
  ParentProfile as ParentProfileData,
} from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

type SettingsSection = 'profile' | 'account' | 'notifications' | 'language' | 'help' | 'social' | 'children' | 'security' | 'data';

const ParentProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [showBackButton, setShowBackButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ParentProfileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(user?.avatar || '');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  
  // Preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [communicationPrefs, setCommunicationPrefs] = useState<CommunicationPreferences | null>(null);
  const [language, setLanguage] = useState('en');
  
  // Security
  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    deviceManagement: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const children = useMemo<ParentChild[]>(() => profile?.children ?? [], [profile]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ParentApiResponse<ParentProfileData> = await parentService.profile.getProfile();
      if (res?.success && res.data) {
        setProfile(res.data);
        setFirstName(res.data.firstName || '');
        setLastName(res.data.lastName || '');
        setPhone(res.data.phone ?? '');
        setEmail(res.data.email ?? '');
        setAddress(res.data.address ?? '');
        setNotificationPrefs(res.data.notificationPreferences ?? null);
        setCommunicationPrefs(res.data.communicationPreferences ?? null);
        setLanguage(res.data.language || 'en');
        
        const avatarUrl = res.data.photo || res.data.avatar || user?.avatar || '';
        if (avatarUrl) setPreview(avatarUrl);
        
        if (res.data.security) {
          setSecurity({
            twoFactor: res.data.security.twoFactorEnabled || false,
            loginAlerts: res.data.security.loginAlerts !== false,
            deviceManagement: res.data.security.deviceManagement !== false,
          });
        }
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile({
        firstName,
        lastName,
        phone,
        address,
      });
      
      updateUser(updatedUser);
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res?.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed successfully!');
      } else {
        toast.error(res?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const avatar = reader.result as string;
        const updatedUser = await authService.updateProfile({
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          phone: profile?.phone,
          avatar,
        });
        
        updateUser(updatedUser);
        await loadProfile();
        setPreview(updatedUser.avatar || avatar);
        toast.success('Profile photo updated!');
      } catch (err) {
        console.error('Failed to upload photo:', err);
        toast.error('Failed to upload photo');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePreferences = async () => {
    setSaving(true);
    try {
      const res = await parentService.profile.updateNotificationPreferences(notificationPrefs!);
      if (res?.success) {
        toast.success('Preferences saved successfully!');
        await loadProfile();
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;
    
    try {
      await authService.logout();
    } catch {
      // Continue to clear local state even if backend logout fails
    }
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    setActiveSection('profile');
    setShowBackButton(false);
    setIsEditing(false);
  };

  const getInitials = () => {
    const first = firstName || profile?.firstName || 'P';
    const last = lastName || profile?.lastName || 'R';
    return `${first[0]}${last[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <Spinner size="lg" showLabel label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {showBackButton ? (
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h1 className="text-xl font-semibold text-white">
            {activeSection === 'profile' && 'Profile'}
            {activeSection === 'children' && 'My Children'}
            {activeSection === 'account' && 'Account Settings'}
            {activeSection === 'security' && 'Security'}
            {activeSection === 'notifications' && 'Notifications'}
            {activeSection === 'language' && 'Language'}
            {activeSection === 'help' && 'Help & Support'}
            {activeSection === 'social' && 'Invite Friends'}
            {activeSection === 'data' && 'Data Management'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeSection === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="text-center">
              <div className="relative inline-block mx-auto mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-lg mx-auto">
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{getInitials()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-bold text-white">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-white/70 mb-4">Parent Account</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit Profile
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      icon={<Phone className="w-4 h-4" />}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      disabled
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Home address"
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile} isLoading={saving}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Settings Menu */}
            <div className="grid gap-3">
              <div className="text-white/60 text-sm font-medium px-2">ACCOUNT</div>
              <Card className="space-y-1">
                <MenuItem
                  icon={<Users className="w-5 h-5" />}
                  label="My Children"
                  description={`${children.length} linked children`}
                  onClick={() => {
                    setActiveSection('children');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Shield className="w-5 h-5" />}
                  label="Security"
                  description="Password, 2FA, and device management"
                  onClick={() => {
                    setActiveSection('security');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  description="Manage your alert preferences"
                  onClick={() => {
                    setActiveSection('notifications');
                    setShowBackButton(true);
                  }}
                />
              </Card>

              <div className="text-white/60 text-sm font-medium px-2 mt-2">PREFERENCES</div>
              <Card className="space-y-1">
                <MenuItem
                  icon={<Globe className="w-5 h-5" />}
                  label="Language"
                  description={language === 'en' ? 'English' : language === 'sw' ? 'Kiswahili' : 'Français'}
                  onClick={() => {
                    setActiveSection('language');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Database className="w-5 h-5" />}
                  label="Data Management"
                  description="Export or delete your data"
                  onClick={() => {
                    setActiveSection('data');
                    setShowBackButton(true);
                  }}
                />
              </Card>

              <div className="text-white/60 text-sm font-medium px-2 mt-2">SUPPORT</div>
              <Card className="space-y-1">
                <MenuItem
                  icon={<HelpCircle className="w-5 h-5" />}
                  label="Help & Support"
                  description="FAQs, guides, and contact support"
                  onClick={() => {
                    setActiveSection('help');
                    setShowBackButton(true);
                  }}
                />
                <MenuItem
                  icon={<Share2 className="w-5 h-5" />}
                  label="Invite Friends"
                  description="Share SchoolHub with other parents"
                  onClick={() => {
                    setActiveSection('social');
                    setShowBackButton(true);
                  }}
                />
              </Card>

              <Card className="border-red-500/30">
                <MenuItem
                  icon={<LogOut className="w-5 h-5" />}
                  label="Log Out"
                  description="Sign out of your account"
                  onClick={handleLogout}
                  danger
                />
              </Card>
            </div>
          </div>
        )}

        {activeSection === 'children' && (
          <Card title="My Children">
            {children.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No children linked to your account yet.</p>
                <Button className="mt-4" variant="outline">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Link a Child
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {child.firstName?.[0]}{child.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {child.className} {child.streamName ? `- ${child.streamName}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">Adm: {child.admissionNumber}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/parent/children/${child.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeSection === 'security' && (
          <div className="space-y-6">
            <Card title="Change Password">
              <div className="space-y-4">
                <Input
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  icon={<Lock className="w-4 h-4" />}
                />
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  icon={<Key className="w-4 h-4" />}
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  icon={<Check className="w-4 h-4" />}
                />
                <Button onClick={handleChangePassword} isLoading={saving}>
                  Update Password
                </Button>
              </div>
            </Card>

            <Card title="Two-Factor Authentication">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Toggle
                  enabled={security.twoFactor}
                  onChange={(val) => setSecurity({ ...security, twoFactor: val })}
                />
              </div>
            </Card>

            <Card title="Active Sessions">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                    <p className="text-xs text-gray-500">Chrome on Windows • Last active now</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  Log Out All Devices
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'notifications' && (
          <Card title="Notification Preferences">
            <div className="space-y-3">
              {notificationPrefs && (
                <>
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive browser notifications</p>
                    </div>
                    <Toggle
                      enabled={notificationPrefs.push}
                      onChange={(val) => setNotificationPrefs({ ...notificationPrefs, push: val })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Alerts</p>
                      <p className="text-sm text-gray-500">Receive email notifications</p>
                    </div>
                    <Toggle
                      enabled={notificationPrefs.email}
                      onChange={(val) => setNotificationPrefs({ ...notificationPrefs, email: val })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">SMS Alerts</p>
                      <p className="text-sm text-gray-500">Receive text message alerts</p>
                    </div>
                    <Toggle
                      enabled={notificationPrefs.sms}
                      onChange={(val) => setNotificationPrefs({ ...notificationPrefs, sms: val })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">WhatsApp Messages</p>
                      <p className="text-sm text-gray-500">Receive WhatsApp notifications</p>
                    </div>
                    <Toggle
                      enabled={notificationPrefs.whatsapp}
                      onChange={(val) => setNotificationPrefs({ ...notificationPrefs, whatsapp: val })}
                    />
                  </div>
                </>
              )}
              <div className="pt-4">
                <Button onClick={handleUpdatePreferences} isLoading={saving}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'language' && (
          <Card title="Select Language">
            <div className="space-y-2">
              {[
                { code: 'en', name: 'English', native: 'English' },
                { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
                { code: 'fr', name: 'French', native: 'Français' },
              ].map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                    language === lang.code
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{lang.native}</span>
                    <span className="text-sm text-gray-500 ml-2">{lang.name}</span>
                  </div>
                  {language === lang.code && <Check className="w-5 h-5 text-blue-500" />}
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === 'help' && (
          <Card title="Help & Support">
            <div className="space-y-3">
              <MenuItem
                icon={<FileText className="w-5 h-5" />}
                label="FAQs"
                description="Frequently asked questions"
                onClick={() => window.open('/help/faqs', '_blank')}
              />
              <MenuItem
                icon={<MessageCircle className="w-5 h-5" />}
                label="Contact Support"
                description="Get help from our support team"
                onClick={() => window.open('mailto:support@schoolhub.com')}
              />
              <MenuItem
                icon={<BookOpen className="w-5 h-5" />}
                label="User Guide"
                description="Comprehensive guide to using SchoolHub"
                onClick={() => window.open('/help/guide', '_blank')}
              />
            </div>
          </Card>
        )}

        {activeSection === 'social' && (
          <Card title="Invite Friends">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share SchoolHub with other parents and help them stay connected with their children's education.
            </p>
            <div className="flex gap-2 mb-4">
              <Input
                value="https://schoolhub.com/invite/parent"
                readOnly
                className="flex-1"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText('https://schoolhub.com/invite/parent');
                  toast.success('Link copied to clipboard!');
                }}
              >
                Copy Link
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth>
                Share via WhatsApp
              </Button>
              <Button variant="outline" fullWidth>
                Share via Email
              </Button>
            </div>
          </Card>
        )}

        {activeSection === 'data' && (
          <div className="space-y-6">
            <Card title="Data Export">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Download all your personal data from SchoolHub in JSON format.
              </p>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export My Data
              </Button>
            </Card>
            <Card title="Delete Account" className="border-red-500/50">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="danger">
                Delete My Account
              </Button>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={false}
        title=""
        message=""
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
};

// MenuItem Component
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  badge?: string | number;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, description, onClick, badge, danger }) => (
  <div
    onClick={onClick}
    className={clsx(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      onClick && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
      danger && 'text-red-600 dark:text-red-400'
    )}
  >
    <div className={clsx('flex-shrink-0', danger ? 'text-red-500' : 'text-teal-500')}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
      {description && <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</div>}
    </div>
    {badge && (
      <div className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
        {badge}
      </div>
    )}
    {onClick && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
  </div>
);

// Toggle Component
interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={clsx(
      'relative w-11 h-6 rounded-full transition-colors duration-200',
      enabled ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
    )}
  >
    <span
      className={clsx(
        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </button>
);

import { UserPlus } from 'lucide-react';

export default ParentProfile;