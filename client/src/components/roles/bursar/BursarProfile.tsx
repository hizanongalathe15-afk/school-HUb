import React, { useState, ChangeEvent } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { authService } from '../../../services/api';
import toast from 'react-hot-toast';
import {
  User, Shield, Bell, Lock, Smartphone, Globe, HardDrive, HelpCircle, Share2,
  LogOut, Camera, ChevronRight, Moon, Sun, Monitor, Check, Upload, RefreshCw,
  CreditCard, FileText, Mail, X, ArrowLeft, Database
} from 'lucide-react';

// Glassmorphism Card
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const GlassCard = ({ children, className = '', onClick, hover = false }: GlassCardProps) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`} onClick={onClick}>
    {children}
  </div>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  badge?: React.ReactNode;
  danger?: boolean;
}

const MenuItem = ({ icon, label, description, onClick, badge, danger = false }: MenuItemProps) => (
  <div className={`menu-item ${danger ? 'menu-item-danger' : ''} ${onClick ? 'menu-item-clickable' : ''}`} onClick={onClick}>
    <div className="menu-item-icon">{icon}</div>
    <div className="menu-item-content">
      <div className="menu-item-label">{label}</div>
      {description && <div className="menu-item-description">{description}</div>}
    </div>
    {badge && <div className="menu-item-badge">{badge}</div>}
    <ChevronRight size={18} className="menu-item-arrow" />
  </div>
);

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
}

const Toggle = ({ enabled, onChange }: ToggleProps) => (
  <button type="button" className={`toggle-switch ${enabled ? 'toggle-enabled' : ''}`} onClick={() => onChange(!enabled)}>
    <span className="toggle-thumb" />
  </button>
);

export default function BursarProfile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [showBackButton, setShowBackButton] = useState(false);

  // Finance-focused settings
  const [notifications, setNotifications] = useState({
    payments: true,
    arrears: true,
    salaries: true,
    expenses: true,
    email: true,
    sound: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    transactionAlerts: true,
  });
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

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'storage':
        return renderStorageSettings();
      case 'help':
        return renderHelpSection();
      default:
        return renderProfileSection();
    }
  };

  const renderProfileSection = () => (
    <div className="profile-main">
      <div className="profile-image-section">
        <div className="profile-image-wrapper">
          <div className="profile-image">
            {user?.avatar ? <img src={user.avatar} alt="Profile" /> : <div className="profile-placeholder"><User size={48} /></div>}
          </div>
          <button className="camera-btn" onClick={() => toast('Profile photo upload coming soon')}>
            <Camera size={18} />
          </button>
        </div>
        <div className="profile-name-section">
          <h2 className="profile-name">{user?.firstName} {user?.lastName}</h2>
          <p className="profile-role">Bursar</p>
          <p className="profile-status">Online • Finance Control</p>
        </div>
      </div>

      <div className="settings-menu">
        <GlassCard className="settings-card">
          <MenuItem icon={<User size={22} />} label="Profile" description="Edit your profile information" onClick={() => setActiveSection('profile')} />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header"><h3>Account</h3></div>
          <MenuItem icon={<Shield size={22} />} label="Security" description="Password, 2FA, transaction alerts" onClick={() => { setActiveSection('security'); setShowBackButton(true); }} />
          <MenuItem icon={<Smartphone size={22} />} label="Phone Number" description="Update contact for payments" onClick={() => { setActiveSection('account'); setShowBackButton(true); }} />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header"><h3>Notifications</h3></div>
          <MenuItem icon={<Bell size={22} />} label="Notification Settings" description="Payment, arrears, salary alerts" onClick={() => { setActiveSection('notifications'); setShowBackButton(true); }} />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header"><h3>Data & Storage</h3></div>
          <MenuItem icon={<HardDrive size={22} />} label="Storage & Reports" description="Financial data usage" onClick={() => { setActiveSection('storage'); setShowBackButton(true); }} />
        </GlassCard>

        <GlassCard className="settings-card">
          <div className="settings-card-header"><h3>Support</h3></div>
          <MenuItem icon={<HelpCircle size={22} />} label="Help & Feedback" description="Financial system support" onClick={() => { setActiveSection('help'); setShowBackButton(true); }} />
        </GlassCard>

        <GlassCard className="settings-card danger-zone">
          <MenuItem icon={<LogOut size={22} />} label="Log Out" description="Sign out of your account" danger onClick={handleLogout} />
        </GlassCard>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Account Settings</h2>
      <GlassCard className="settings-card">
        <div className="settings-card-header"><h3>Phone & Email</h3></div>
        <div className="setting-item">
          <div className="setting-info">
            <h4>Current Phone</h4>
            <p>{user?.phone || 'Not set'}</p>
          </div>
          <button className="btn btn-secondary">Update</button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h4>Current Email</h4>
            <p>{user?.email}</p>
          </div>
          <button className="btn btn-secondary">Update</button>
        </div>
      </GlassCard>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Security Settings</h2>
      <GlassCard className="settings-card">
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Two-Factor Authentication</h4>
              <p>Extra security for financial actions</p>
            </div>
            <Toggle enabled={security.twoFactor} onChange={(val) => setSecurity({ ...security, twoFactor: val })} />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Transaction Alerts</h4>
              <p>Get notified of large payments</p>
            </div>
            <Toggle enabled={security.transactionAlerts} onChange={(val) => setSecurity({ ...security, transactionAlerts: val })} />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Login Alerts</h4>
              <p>Notify on new logins</p>
            </div>
            <Toggle enabled={security.loginAlerts} onChange={(val) => setSecurity({ ...security, loginAlerts: val })} />
          </div>
        </div>
      </GlassCard>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Notification Settings</h2>
      <GlassCard className="settings-card">
        <div className="settings-group">
          {(Object.keys(notifications) as (keyof typeof notifications)[]).map(key => (
            <div className="setting-item" key={key}>
              <div className="setting-info">
                <h4>{key.charAt(0).toUpperCase() + key.slice(1)} Alerts</h4>
                <p>Receive alerts for {key}</p>
              </div>
              <Toggle enabled={notifications[key]} onChange={(val) => setNotifications({ ...notifications, [key]: val })} />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="settings-detail">
      <h2 className="section-title">Data & Storage</h2>
      <GlassCard className="settings-card">
        <div className="storage-overview">
          <p>Financial reports and transaction data usage</p>
          <div className="storage-bar"><div className="storage-fill" style={{ width: '45%' }} /></div>
          <span>2.1 GB used of 10 GB</span>
        </div>
      </GlassCard>
    </div>
  );

  const renderHelpSection = () => (
    <div className="settings-detail">
      <h2 className="section-title">Help & Feedback</h2>
      <GlassCard className="settings-card">
        <MenuItem icon={<FileText size={22} />} label="Financial Help Center" description="Guides for fee management" onClick={() => window.open('https://help.schoolhub.com/bursar', '_blank')} />
        <MenuItem icon={<Mail size={22} />} label="Contact Finance Support" description="Get help with payments" onClick={() => window.open('mailto:bursar-support@schoolhub.com', '_blank')} />
      </GlassCard>
    </div>
  );

  return (
    <div className="bursar-profile">
      {showBackButton && (
        <button className="back-btn" onClick={handleBack}><ArrowLeft size={20} /> Back</button>
      )}
      {renderSection()}
      <style>{`
        .bursar-profile { padding: 20px; max-width: 900px; margin: 0 auto; }
        .glass-card { background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin-bottom: 12px; backdrop-filter: blur(10px); }
        .menu-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; }
        .menu-item:hover { background: #f8fafc; }
        .menu-item-icon { color: #1d8a8a; }
        .btn { padding: 8px 16px; border-radius: 8px; font-weight: 600; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: white; border: 1px solid #e5e7eb; }
        .toggle-switch { width: 44px; height: 24px; background: #e5e7eb; border-radius: 999px; position: relative; }
        .toggle-enabled { background: #1d8a8a; }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.2s; }
        .toggle-enabled .toggle-thumb { left: 22px; }
        .profile-image-section { text-align: center; margin-bottom: 24px; }
        .profile-image { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px; background: #e0f2fe; display: flex; align-items: center; justify-content: center; }
        .camera-btn { background: #1d8a8a; color: white; border: none; padding: 8px; border-radius: 50%; cursor: pointer; }
        .settings-menu { max-width: 600px; margin: 0 auto; }
        .section-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
        .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .back-btn { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; background: none; border: none; font-weight: 600; color: #1d8a8a; cursor: pointer; }
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
