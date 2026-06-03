import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { authService } from '../../../services/api';
import {
  User,
  Shield,
  Bell,
  Lock,
  Smartphone,
  Globe,
  Palette,
  Image,
  MessageSquare,
  Radio,
  HardDrive,
  HelpCircle,
  Share2,
  LogOut,
  Camera,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Mail,
  X,
  ArrowLeft,
  MessageCircle,
  Database,
  Video,
  Music,
  File,
  
  Camera as Instagram,   
  Send as Twitter,       
  Heart as Facebook,     
  Link as Linkedin,     
  Code as Github,        
} from 'lucide-react';

// Glassmorphism Card Component
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      className={`
        glass-card
        ${hover ? 'glass-card-hover' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Menu Item Component
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  badge?: string | number;
  active?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  description,
  onClick,
  badge,
  active = false,
  danger = false,
}) => {
  return (
    <div
      className={`
        menu-item
        ${active ? 'menu-item-active' : ''}
        ${danger ? 'menu-item-danger' : ''}
        ${onClick ? 'menu-item-clickable' : ''}
      `}
      onClick={onClick}
    >
      <div className="menu-item-icon">{icon}</div>
      <div className="menu-item-content">
        <div className="menu-item-label">{label}</div>
        {description && <div className="menu-item-description">{description}</div>}
      </div>
      {badge && (
        <div className={`menu-item-badge ${typeof badge === 'number' ? 'badge-number' : ''}`}>
          {badge}
        </div>
      )}
      <ChevronRight size={18} className="menu-item-arrow" />
    </div>
  );
};

// Toggle Switch Component
interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      className={`toggle-switch ${enabled ? 'toggle-enabled' : ''}`}
      onClick={() => onChange(!enabled)}
      role="switch"
      aria-checked={enabled}
    >
      <span className="toggle-thumb" />
    </button>
  );
};

// Profile Image Upload Component
const ProfileImageUpload: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [preview, setPreview] = useState<string>(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(user?.avatar || '');
  }, [user?.avatar]);

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

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const avatar = reader.result as string;
        if (!user) throw new Error('User data missing');

        const updatedUser = await authService.updateProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar,
        });

        setPreview(updatedUser.avatar || avatar || '');
        updateUser(updatedUser);
        toast.success('Profile photo updated!');
      } catch (error) {
        toast.error('Failed to upload profile photo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-image-section">
      <div className="profile-image-wrapper">
        <div className="profile-image">
          {preview ? (
            <img src={preview} alt="Profile" />
          ) : (
            <div className="profile-placeholder">
              <User size={48} />
            </div>
          )}
        </div>
        <button
          className="camera-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <RefreshCw size={18} className="spin" /> : <Camera size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
      </div>
      <div className="profile-name-section">
        <h2 className="profile-name">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="profile-role">{user?.role}</p>
        <p className="profile-status">Online</p>
      </div>
    </div>
  );
};

// Settings Sections
type SettingsSection = 'profile' | 'account' | 'privacy' | 'notifications' | 'theme' | 'storage' | 'language' | 'help' | 'social';

// Main Admin Profile Component
export default function AdminProfile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [showBackButton, setShowBackButton] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [wallpaper, setWallpaper] = useState<string | null>(null);

  // Notification settings
  const [notifications, setNotifications] = useState({
    messages: true,
    calls: true,
    groups: true,
    announcements: true,
    email: false,
    sound: true,
    vibration: true,
    popup: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    status: 'everyone',
    readReceipts: true,
    groups: 'everyone',
    profileInfo: 'everyone',
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    activeSessions: 1,
  });

  // Storage info
  const [storage, setStorage] = useState({
    used: 2.4,
    total: 10,
    photos: 1.2,
    videos: 0.8,
    audio: 0.2,
    documents: 0.2,
  });

  // Social links
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    linkedin: '',
    github: '',
  });

  // Language setting
  const [language, setLanguage] = useState('en');
  const confirmation = useConfirmationDialog();

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
  };

  const handleSaveProfile = async () => {
    if (!profileDraft.firstName.trim() || !profileDraft.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSavingAccount(true);
    try {
      const saved = await authService.updateProfile(profileDraft);
      updateUser(saved);
      toast.success('Admin profile updated');
    } catch (error) {
      console.error(error);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordDraft.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingAccount(true);
    try {
      await authService.changePassword(passwordDraft.currentPassword, passwordDraft.newPassword);
      setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingAccount(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'theme':
        return renderThemeSettings();
      case 'storage':
        return renderStorageSettings();
      case 'language':
        return renderLanguageSettings();
      case 'help':
        return renderHelpSection();
      case 'social':
        return renderSocialLinks();
      default:
        return renderProfileSection();
    }
  };

  // Profile Section (Main)
  const renderProfileSection = () => (
    <div className="profile-main">
      <ProfileImageUpload />

      <div className="settings-menu">
        <GlassCard className="settings-card">
          <MenuItem
            icon={<User size={22} />}
            label="Profile"
            description="Edit your profile information"
            onClick={() => {
              setActiveSection('profile');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Account</h3>
          </div>
          <MenuItem
            icon={<Shield size={22} />}
            label="Security"
            description="Password, 2FA, and login alerts"
            onClick={() => {
              setActiveSection('account');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Smartphone size={22} />}
            label="Phone Number"
            description="Change your phone number"
            onClick={() => {
              setActiveSection('account');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Mail size={22} />}
            label="Email Address"
            description="Update your email"
            onClick={() => {
              setActiveSection('account');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Privacy</h3>
          </div>
          <MenuItem
            icon={<Lock size={22} />}
            label="Privacy Settings"
            description="Control who sees your information"
            onClick={() => {
              setActiveSection('privacy');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Notifications</h3>
          </div>
          <MenuItem
            icon={<Bell size={22} />}
            label="Notification Settings"
            description="Manage alerts and sounds"
            onClick={() => {
              setActiveSection('notifications');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Radio size={22} />}
            label="Broadcast Lists"
            description="Manage broadcast recipients"
            onClick={() => {
              setActiveSection('notifications');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Appearance</h3>
          </div>
          <MenuItem
            icon={<Palette size={22} />}
            label="Theme"
            description="Light, dark, or system default"
            onClick={() => {
              setActiveSection('theme');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Image size={22} />}
            label="Wallpaper"
            description="Set chat background"
            onClick={() => {
              setActiveSection('theme');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Storage & Data</h3>
          </div>
          <MenuItem
            icon={<HardDrive size={22} />}
            label="Storage Usage"
            description={`${storage.used} GB of ${storage.total} GB used`}
            onClick={() => {
              setActiveSection('storage');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Database size={22} />}
            label="Data Usage"
            description="Network and data settings"
            onClick={() => {
              setActiveSection('storage');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>App</h3>
          </div>
          <MenuItem
            icon={<Globe size={22} />}
            label="Language"
            description="English"
            onClick={() => {
              setActiveSection('language');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<HelpCircle size={22} />}
            label="Help & Feedback"
            description="Get help or send feedback"
            onClick={() => {
              setActiveSection('help');
              setShowBackButton(true);
            }}
          />
          <MenuItem
            icon={<Share2 size={22} />}
            label="Invite a Friend"
            description="Share this app with others"
            onClick={() => {
              setActiveSection('social');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header">
            <h3>Social Links</h3>
          </div>
          <MenuItem
            icon={<Instagram size={22} />}
            label="Social Media"
            description="Connect your social accounts"
            onClick={() => {
              setActiveSection('social');
              setShowBackButton(true);
            }}
          />
        </GlassCard>

        <GlassCard className="settings-card danger-zone">
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
  );

  // Account Settings
  const renderAccountSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Account Settings</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Admin Identity</h3>
        </div>
        <div className="admin-profile-form">
          <label>
            First name
            <input value={profileDraft.firstName} onChange={(e) => setProfileDraft({ ...profileDraft, firstName: e.target.value })} />
          </label>
          <label>
            Last name
            <input value={profileDraft.lastName} onChange={(e) => setProfileDraft({ ...profileDraft, lastName: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={profileDraft.phone} onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
          </label>
          <label>
            Profile photo URL
            <input value={profileDraft.avatar} onChange={(e) => setProfileDraft({ ...profileDraft, avatar: e.target.value })} />
          </label>
          <button className="btn btn-primary" type="button" onClick={handleSaveProfile} disabled={savingAccount}>Save Profile</button>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Security</h3>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Change Password</h4>
              <p>Update your password regularly for security</p>
            </div>
            <div className="password-inline-form">
              <input type="password" placeholder="Current" value={passwordDraft.currentPassword} onChange={(e) => setPasswordDraft({ ...passwordDraft, currentPassword: e.target.value })} />
              <input type="password" placeholder="New" value={passwordDraft.newPassword} onChange={(e) => setPasswordDraft({ ...passwordDraft, newPassword: e.target.value })} />
              <input type="password" placeholder="Confirm" value={passwordDraft.confirmPassword} onChange={(e) => setPasswordDraft({ ...passwordDraft, confirmPassword: e.target.value })} />
              <button className="btn btn-secondary" type="button" onClick={handleChangePassword} disabled={savingAccount}>Change</button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
            <Toggle
              enabled={security.twoFactor}
              onChange={(val) => setSecurity({ ...security, twoFactor: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Login Alerts</h4>
              <p>Get notified of new login activity</p>
            </div>
            <Toggle
              enabled={security.loginAlerts}
              onChange={(val) => setSecurity({ ...security, loginAlerts: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Active Sessions</h4>
              <p>{security.activeSessions} active session(s)</p>
            </div>
            <button className="btn btn-secondary">View All</button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Phone Number</h3>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h4>Current Number</h4>
            <p className="text-muted">{user?.phone || 'Not set'}</p>
          </div>
          <button className="btn btn-secondary">Change</button>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Email Address</h3>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h4>Current Email</h4>
            <p className="text-muted">{user?.email}</p>
          </div>
          <button className="btn btn-secondary">Change</button>
        </div>
      </GlassCard>
    </div>
  );

  // Privacy Settings
  const renderPrivacySettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Privacy Settings</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Who can see my information</h3>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Last Seen & Online</h4>
              <p>Who can see when you were last online</p>
            </div>
            <select
              value={privacy.lastSeen}
              onChange={(e) => setPrivacy({ ...privacy, lastSeen: e.target.value })}
              className="setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Profile Photo</h4>
              <p>Who can see your profile photo</p>
            </div>
            <select
              value={privacy.profilePhoto}
              onChange={(e) => setPrivacy({ ...privacy, profilePhoto: e.target.value })}
              className="setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Status</h4>
              <p>Who can see your status updates</p>
            </div>
            <select
              value={privacy.status}
              onChange={(e) => setPrivacy({ ...privacy, status: e.target.value })}
              className="setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Read Receipts</h4>
              <p>Show when you've read messages</p>
            </div>
            <Toggle
              enabled={privacy.readReceipts}
              onChange={(val) => setPrivacy({ ...privacy, readReceipts: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Groups</h4>
              <p>Who can add you to groups</p>
            </div>
            <select
              value={privacy.groups}
              onChange={(e) => setPrivacy({ ...privacy, groups: e.target.value })}
              className="setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // Notification Settings
  const renderNotificationSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Notification Settings</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Message Notifications</h3>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Messages</h4>
              <p>Get notified of new messages</p>
            </div>
            <Toggle
              enabled={notifications.messages}
              onChange={(val) => setNotifications({ ...notifications, messages: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Groups</h4>
              <p>Get notified of group messages</p>
            </div>
            <Toggle
              enabled={notifications.groups}
              onChange={(val) => setNotifications({ ...notifications, groups: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Announcements</h4>
              <p>Get notified of announcements</p>
            </div>
            <Toggle
              enabled={notifications.announcements}
              onChange={(val) => setNotifications({ ...notifications, announcements: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Sound</h4>
              <p>Play sound for notifications</p>
            </div>
            <Toggle
              enabled={notifications.sound}
              onChange={(val) => setNotifications({ ...notifications, sound: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Vibration</h4>
              <p>Vibrate for notifications</p>
            </div>
            <Toggle
              enabled={notifications.vibration}
              onChange={(val) => setNotifications({ ...notifications, vibration: val })}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Popup Notifications</h4>
              <p>Show popup on screen</p>
            </div>
            <Toggle
              enabled={notifications.popup}
              onChange={(val) => setNotifications({ ...notifications, popup: val })}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Broadcast Lists</h3>
        </div>
        <div className="broadcast-info">
          <p className="text-muted">Send messages to multiple contacts at once</p>
          <button className="btn btn-primary">Create Broadcast List</button>
        </div>
      </GlassCard>
    </div>
  );

  // Theme Settings
  const renderThemeSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Theme & Appearance</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Theme</h3>
        </div>

        <div className="theme-options">
          <button
            className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={24} />
            <span>Light</span>
            {theme === 'light' && <Check size={18} className="theme-check" />}
          </button>
          <button
            className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={24} />
            <span>Dark</span>
            {theme === 'dark' && <Check size={18} className="theme-check" />}
          </button>
          <button
            className={`theme-option ${theme === 'system' ? 'selected' : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={24} />
            <span>System</span>
            {theme === 'system' && <Check size={18} className="theme-check" />}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Wallpaper</h3>
        </div>

        <div className="wallpaper-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`wallpaper-option ${wallpaper === `wp-${i}` ? 'selected' : ''}`}
              onClick={() => setWallpaper(`wp-${i}`)}
            >
              <div className={`wallpaper-preview wp-${i}`} />
              {wallpaper === `wp-${i}` && (
                <div className="wallpaper-check">
                  <Check size={16} />
                </div>
              )}
            </div>
          ))}
          <div
            className={`wallpaper-option ${wallpaper === null ? 'selected' : ''}`}
            onClick={() => setWallpaper(null)}
          >
            <div className="wallpaper-preview no-wallpaper">
              <X size={24} />
            </div>
            {wallpaper === null && (
              <div className="wallpaper-check">
                <Check size={16} />
              </div>
            )}
          </div>
        </div>

        <div className="wallpaper-upload">
          <button className="btn btn-secondary">
            <Upload size={16} />
            Upload Custom Wallpaper
          </button>
        </div>
      </GlassCard>
    </div>
  );

  // Storage Settings
  const renderStorageSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Storage & Data</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Storage Usage</h3>
        </div>

        <div className="storage-overview">
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{ width: `${(storage.used / storage.total) * 100}%` }}
            />
          </div>
          <div className="storage-stats">
            <span>{storage.used} GB used of {storage.total} GB</span>
          </div>
        </div>

        <div className="storage-breakdown">
          <div className="storage-item">
            <Image size={20} className="storage-icon photos" />
            <div className="storage-item-info">
              <span>Photos</span>
              <span className="storage-size">{storage.photos} GB</span>
            </div>
          </div>
          <div className="storage-item">
            <Video size={20} className="storage-icon videos" />
            <div className="storage-item-info">
              <span>Videos</span>
              <span className="storage-size">{storage.videos} GB</span>
            </div>
          </div>
          <div className="storage-item">
            <Music size={20} className="storage-icon audio" />
            <div className="storage-item-info">
              <span>Audio</span>
              <span className="storage-size">{storage.audio} GB</span>
            </div>
          </div>
          <div className="storage-item">
            <File size={20} className="storage-icon docs" />
            <div className="storage-item-info">
              <span>Documents</span>
              <span className="storage-size">{storage.documents} GB</span>
            </div>
          </div>
        </div>

        <button className="btn btn-danger">
          <Trash2 size={16} />
          Clear Cache
        </button>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Data Usage</h3>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Low Data Usage</h4>
              <p>Reduce data consumption</p>
            </div>
            <Toggle enabled={false} onChange={() => {}} />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto-Download Media</h4>
              <p>Automatically download media</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // Language Settings
  const renderLanguageSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Language</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>App Language</h3>
        </div>

        <div className="language-list">
          {[
            { code: 'en', name: 'English', native: 'English' },
            { code: 'es', name: 'Spanish', native: 'Español' },
            { code: 'fr', name: 'French', native: 'Français' },
            { code: 'de', name: 'German', native: 'Deutsch' },
            { code: 'zh', name: 'Chinese', native: '中文' },
            { code: 'ja', name: 'Japanese', native: '日本語' },
            { code: 'ko', name: 'Korean', native: '한국어' },
            { code: 'ar', name: 'Arabic', native: 'العربية' },
            { code: 'pt', name: 'Portuguese', native: 'Português' },
            { code: 'ru', name: 'Russian', native: 'Русский' },
            { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
          ].map((lang) => (
            <div
              key={lang.code}
              className={`language-option ${language === lang.code ? 'selected' : ''}`}
              onClick={() => setLanguage(lang.code)}
            >
              <div className="language-name">
                <span className="language-native">{lang.native}</span>
                <span className="language-english">{lang.name}</span>
              </div>
              {language === lang.code && <Check size={18} className="language-check" />}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  // Help Section
  const renderHelpSection = () => (
    <div className="settings-detail">
      <h2 className="section-title">Help & Feedback</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Help</h3>
        </div>

        <div className="help-menu">
          <MenuItem
            icon={<FileText size={22} />}
            label="Help Center"
            description="FAQs and guides"
            onClick={() => window.open('https://help.schoolhub.com', '_blank')}
          />
          <MenuItem
            icon={<MessageCircle size={22} />}
            label="Contact Support"
            description="Get help from our team"
            onClick={() => window.open('mailto:support@schoolhub.com', '_blank')}
          />
          <MenuItem
            icon={<FileText size={22} />}
            label="Terms of Service"
            description="Read our terms"
            onClick={() => window.open('/terms', '_blank')}
          />
          <MenuItem
            icon={<Shield size={22} />}
            label="Privacy Policy"
            description="Read our privacy policy"
            onClick={() => window.open('/privacy', '_blank')}
          />
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Feedback</h3>
        </div>

        <div className="feedback-form">
          <div className="form-group">
            <label>How can we improve?</label>
            <textarea
              rows={4}
              placeholder="Tell us what you think..."
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <label>Your email (optional)</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="form-input"
              defaultValue={user?.email}
            />
          </div>
          <button className="btn btn-primary">Send Feedback</button>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>About</h3>
        </div>

        <div className="about-info">
          <div className="about-item">
            <span className="about-label">Version</span>
            <span className="about-value">2.1.0</span>
          </div>
          <div className="about-item">
            <span className="about-label">Build</span>
            <span className="about-value">2024.05.25</span>
          </div>
          <div className="about-item">
            <span className="about-label">Platform</span>
            <span className="about-value">Web</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // Social Links Section
  const renderSocialLinks = () => (
    <div className="settings-detail">
      <h2 className="section-title">Social Links</h2>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Connect Your Accounts</h3>
        </div>

        <div className="social-links-form">
          <div className="social-input">
            <Instagram size={20} className="social-icon" />
            <input
              type="url"
              placeholder="Instagram URL"
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="social-input">
            <Twitter size={20} className="social-icon" />
            <input
              type="url"
              placeholder="Twitter/X URL"
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="social-input">
            <Facebook size={20} className="social-icon" />
            <input
              type="url"
              placeholder="Facebook URL"
              value={socialLinks.facebook}
              onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="social-input">
            <Linkedin size={20} className="social-icon" />
            <input
              type="url"
              placeholder="LinkedIn URL"
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="social-input">
            <Github size={20} className="social-icon" />
            <input
              type="url"
              placeholder="GitHub URL"
              value={socialLinks.github}
              onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
              className="form-input"
            />
          </div>

          <button className="btn btn-primary">Save Social Links</button>
        </div>
      </GlassCard>

      <GlassCard className="settings-card">
        <div className="settings-card-header">
          <h3>Invite Friends</h3>
        </div>

        <div className="invite-section">
          <p className="text-muted">Share this app with your friends and colleagues</p>

          <div className="invite-link">
            <input
              type="text"
              readOnly
              value="https://schoolhub.com/invite/abc123"
              className="form-input"
            />
            <button className="btn btn-secondary">Copy</button>
          </div>

          <div className="share-buttons">
            <button className="share-btn whatsapp">
              <MessageCircle size={20} />
              WhatsApp
            </button>
            <button className="share-btn twitter">
              <Twitter size={20} />
              Twitter
            </button>
            <button className="share-btn facebook">
              <Facebook size={20} />
              Facebook
            </button>
            <button className="share-btn email">
              <Mail size={20} />
              Email
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="admin-profile-page">
      <div className="profile-header">
        {showBackButton ? (
          <button className="back-btn" onClick={handleBack}>
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="header-spacer" />
        )}
        <h1 className="profile-header-title">
          {activeSection === 'profile' ? 'Profile' :
           activeSection === 'account' ? 'Account' :
           activeSection === 'privacy' ? 'Privacy' :
           activeSection === 'notifications' ? 'Notifications' :
           activeSection === 'theme' ? 'Theme' :
           activeSection === 'storage' ? 'Storage' :
           activeSection === 'language' ? 'Language' :
           activeSection === 'help' ? 'Help' :
           activeSection === 'social' ? 'Social' : 'Settings'}
        </h1>
        <div className="header-spacer" />
      </div>

      <div className="profile-content">
        {renderSection()}
      </div>

      <style>{`
        .admin-profile-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0;
        }

        .profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .profile-header-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .header-spacer {
          width: 40px;
        }

        .profile-content {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Glassmorphism Card */
        .glass-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .glass-card-hover:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }

        /* Profile Image Section */
        .profile-image-section {
          text-align: center;
          padding: 32px 16px;
        }

        .profile-image-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 16px;
        }

        .profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .profile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .camera-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .camera-btn:hover {
          transform: scale(1.1);
          background: white;
        }

        .camera-btn:disabled .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .profile-name-section {
          color: white;
        }

        .profile-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 4px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .profile-role {
          font-size: 0.9rem;
          opacity: 0.9;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-status {
          font-size: 0.85rem;
          color: #4ade80;
          margin: 4px 0 0;
        }

        /* Settings Menu */
        .settings-menu {
          margin-top: 16px;
        }

        .settings-card {
          overflow: hidden;
        }

        .settings-card-header {
          padding: 8px 0;
          margin-bottom: 8px;
        }

        .settings-card-header h3 {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
          padding: 0 12px;
        }

        .danger-zone {
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Menu Item */
        .menu-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
          gap: 12px;
        }

        .menu-item-clickable:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .menu-item-active {
          background: rgba(255, 255, 255, 0.15);
        }

        .menu-item-danger {
          color: #f87171;
        }

        .menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .menu-item-icon {
          color: white;
          opacity: 0.9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-item-danger .menu-item-icon {
          color: #f87171;
        }

        .menu-item-content {
          flex: 1;
          min-width: 0;
        }

        .menu-item-label {
          font-size: 0.95rem;
          font-weight: 500;
          color: white;
        }

        .menu-item-description {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 2px;
        }

        .menu-item-badge {
          background: #667eea;
          color: white;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .menu-item-badge.badge-number {
          min-width: 20px;
          text-align: center;
        }

        .menu-item-arrow {
          color: rgba(255, 255, 255, 0.5);
        }

        /* Settings Detail Pages */
        .settings-detail {
          color: white;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 16px;
          color: white;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info h4 {
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0 0 2px;
          color: white;
        }

        .setting-info p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .text-muted {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Toggle Switch */
        .toggle-switch {
          width: 52px;
          height: 28px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
        }

        .toggle-switch.toggle-enabled {
          background: #4ade80;
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.toggle-enabled .toggle-thumb {
          transform: translateX(24px);
        }

        /* Select */
        .setting-select {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          outline: none;
        }

        .setting-select option {
          background: #667eea;
          color: white;
        }

        .admin-profile-form,
        .password-inline-form {
          display: grid;
          gap: 12px;
        }

        .admin-profile-form {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          align-items: end;
        }

        .admin-profile-form label {
          display: grid;
          gap: 6px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .admin-profile-form input,
        .password-inline-form input {
          min-height: 40px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 10px;
          padding: 0 12px;
          background: rgba(255, 255, 255, 0.16);
          color: white;
          outline: 0;
        }

        .admin-profile-form input::placeholder,
        .password-inline-form input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }

        .password-inline-form {
          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
          max-width: 620px;
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        /* Theme Options */
        .theme-options {
          display: flex;
          gap: 12px;
          padding: 8px 0;
        }

        .theme-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid transparent;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-option:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .theme-option.selected {
          border-color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
        }

        .theme-option span {
          font-size: 0.85rem;
        }

        .theme-check {
          color: #4ade80;
        }

        /* Wallpaper Grid */
        .wallpaper-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 8px 0;
        }

        .wallpaper-option {
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 3px solid transparent;
          position: relative;
          transition: all 0.2s;
        }

        .wallpaper-option:hover {
          transform: scale(1.05);
        }

        .wallpaper-option.selected {
          border-color: #4ade80;
        }

        .wallpaper-preview {
          width: 100%;
          height: 100%;
        }

        .wallpaper-preview.wp-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .wallpaper-preview.wp-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .wallpaper-preview.wp-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .wallpaper-preview.wp-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .wallpaper-preview.wp-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .wallpaper-preview.wp-6 { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
        .wallpaper-preview.no-wallpaper {
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.5);
        }

        .wallpaper-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #4ade80;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .wallpaper-upload {
          margin-top: 16px;
          text-align: center;
        }

        /* Storage */
        .storage-overview {
          padding: 12px 0;
        }

        .storage-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .storage-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.3s;
        }

        .storage-stats {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .storage-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 0;
        }

        .storage-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .storage-icon {
          padding: 8px;
          border-radius: 8px;
        }

        .storage-icon.photos { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .storage-icon.videos { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .storage-icon.audio { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
        .storage-icon.docs { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

        .storage-item-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
        }

        .storage-item-info span {
          font-size: 0.9rem;
        }

        .storage-size {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Language */
        .language-list {
          display: flex;
          flex-direction: column;
        }

        .language-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .language-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .language-option.selected {
          background: rgba(74, 222, 128, 0.1);
        }

        .language-name {
          display: flex;
          flex-direction: column;
        }

        .language-native {
          font-weight: 500;
          color: white;
        }

        .language-english {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .language-check {
          color: #4ade80;
        }

        /* Help */
        .help-menu {
          display: flex;
          flex-direction: column;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: white;
        }

        .form-input,
        .form-textarea {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 12px;
          color: white;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus {
          border-color: #667eea;
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .about-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .about-item {
          display: flex;
          justify-content: space-between;
        }

        .about-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .about-value {
          font-weight: 500;
        }

        /* Social Links */
        .social-links-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-input {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0 12px;
        }

        .social-input .social-icon {
          color: rgba(255, 255, 255, 0.6);
        }

        .social-input .form-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 0;
        }

        .social-input .form-input:focus {
          outline: none;
        }

        .invite-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .invite-link {
          display: flex;
          gap: 8px;
        }

        .invite-link .form-input {
          flex: 1;
        }

        .share-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .share-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .share-btn:hover {
          transform: translateY(-2px);
        }

        .share-btn.whatsapp { background: #25D366; }
        .share-btn.twitter { background: #1DA1F2; }
        .share-btn.facebook { background: #4267B2; }
        .share-btn.email { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); }

        .broadcast-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          text-align: center;
          padding: 16px 0;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .profile-content {
            padding: 12px;
          }

          .wallpaper-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .theme-options {
            flex-direction: column;
          }

          .share-buttons {
            flex-direction: column;
          }

          .share-btn {
            justify-content: center;
          }
        }
      `}</style>
      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}
