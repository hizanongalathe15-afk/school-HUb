// client/src/components/roles/admin/AdminSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Save, RefreshCcw, Clock, Shield, Bell, Mail, Smartphone, 
  Database, Settings as SettingsIcon, CreditCard, Globe, 
  Lock, Key, Users, FileText, Cloud, Server, Activity,
  Wifi, WifiOff, Zap, AlertTriangle, CheckCircle, XCircle,
  Eye, EyeOff, Copy, Link, ExternalLink, Download,
  Upload, Trash2, Plus, Minus, ChevronDown, ChevronUp,
  Moon, Sun, Languages, DollarSign, Percent, Calendar,
  MapPin, Phone, Mail as MailIcon, MessageCircle, Camera as Instagram,
  Share2 as Facebook, Send as Twitter, PlayCircle as Youtube, Briefcase as Linkedin, Code as Github, GitBranch as Gitlab,
  MessageSquare as Slack, MessageCircle as Discord, Video as Twitch, Music as Tiktok, Camera as Snapchat, Image as Pinterest,
  Apple, Smartphone as Android, Monitor as Windows, Terminal as Linux, Globe as Chrome, Globe as Firefox, Globe as Safari,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { systemSettingsService } from '../../../services/adminService';
import type { SystemSettings } from '../../../types/admin';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: string[];
  status: 'active' | 'revoked';
}

interface SocialLogin {
  provider: 'google' | 'facebook' | 'twitter' | 'github' | 'microsoft';
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

// Mock component for Google Analytics icon (since it might not exist in lucide-react)
const GoogleAnalytics = ({ size }: { size?: number }) => <BarChart size={size || 24} />;
import { BarChart } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [socialLogins, setSocialLogins] = useState<SocialLogin[]>([
    { provider: 'google', enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
    { provider: 'facebook', enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
    { provider: 'twitter', enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
    { provider: 'github', enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
    { provider: 'microsoft', enabled: false, clientId: '', clientSecret: '', redirectUri: '' }
  ]);
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: ['read'] });
  const [newWebhook, setNewWebhook] = useState({ url: '', events: ['user.created'], secret: '' });
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsService.getSettings();
      setSettings(data);
      const [keysResult, hooksResult, backupsResult] = await Promise.allSettled([
        systemSettingsService.getApiKeys(),
        systemSettingsService.getWebhooks(),
        systemSettingsService.getBackupHistory()
      ]);
      setApiKeys(keysResult.status === 'fulfilled' ? keysResult.value : []);
      setWebhooks(hooksResult.status === 'fulfilled' ? hooksResult.value : []);
      setBackupHistory(backupsResult.status === 'fulfilled' ? backupsResult.value : []);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (section: keyof SystemSettings, data: any) => {
    setSaving(true);
    try {
      let response;
      switch (section) {
        case 'general':
          response = await systemSettingsService.updateGeneralSettings(data);
          break;
        case 'security':
          response = await systemSettingsService.updateSecuritySettings(data);
          break;
        case 'email':
          response = await systemSettingsService.updateEmailSettings(data);
          break;
        case 'sms':
          response = await systemSettingsService.updateSMSSettings(data);
          break;
        case 'mpesa':
          response = await systemSettingsService.updateMPESASettings(data);
          break;
        case 'backup':
          response = await systemSettingsService.updateBackupSettings(data);
          break;
        case 'notifications':
          response = await systemSettingsService.updateNotificationSettings(data);
          break;
        case 'integrations':
          response = await systemSettingsService.updateIntegrationSettings(data);
          break;
        case 'authentication':
          response = await systemSettingsService.updateAuthSettings(data);
          break;
      }
      if (response) {
        setSettings(response);
        toast.success(`${section} settings updated`);
      }
    } catch (error) {
      toast.error(`Failed to update ${section} settings`);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (type: 'email' | 'sms' | 'mpesa') => {
    setTestingConnection(true);
    try {
      const result = await systemSettingsService.testConnection(type);
      if (result.success) {
        toast.success(`${type.toUpperCase()} connection successful!`);
      } else {
        toast.error(`${type.toUpperCase()} connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${type} connection`);
    } finally {
      setTestingConnection(false);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKey.name.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    try {
      const key = await systemSettingsService.generateApiKey(newApiKey);
      setApiKeys([...apiKeys, key]);
      setShowApiKeyModal(false);
      setNewApiKey({ name: '', permissions: ['read'] });
      toast.success('API Key generated successfully');
    } catch (error) {
      toast.error('Failed to generate API key');
    }
  };

  const revokeApiKey = async (id: string) => {
    if (confirm('Revoke this API key? This action cannot be undone.')) {
      await systemSettingsService.revokeApiKey(id);
      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
      toast.success('API key revoked');
    }
  };

  const addWebhook = async () => {
    if (!newWebhook.url.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    try {
      const webhook = await systemSettingsService.createWebhook(newWebhook);
      setWebhooks([...webhooks, webhook]);
      setShowWebhookModal(false);
      setNewWebhook({ url: '', events: ['user.created'], secret: '' });
      toast.success('Webhook added successfully');
    } catch (error) {
      toast.error('Failed to add webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (confirm('Delete this webhook?')) {
      await systemSettingsService.deleteWebhook(id);
      setWebhooks(webhooks.filter(w => w.id !== id));
      toast.success('Webhook deleted');
    }
  };

  const testWebhook = async (url: string) => {
    try {
      const result = await systemSettingsService.testWebhook(url);
      toast.success(result.success ? 'Webhook working!' : 'Webhook test failed');
    } catch (error) {
      toast.error('Webhook test failed');
    }
  };

  const createBackup = async () => {
    try {
      await systemSettingsService.createBackup();
      toast.success('Backup created successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to create backup');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (confirm('Restore from this backup? This will overwrite current data.')) {
      try {
        await systemSettingsService.restoreBackup(backupId);
        toast.success('Backup restored successfully');
        fetchSettings();
      } catch (error) {
        toast.error('Failed to restore backup');
      }
    }
  };

  const clearCache = async () => {
    if (confirm('Clear all system cache?')) {
      try {
        await systemSettingsService.clearCache();
        toast.success('Cache cleared successfully');
      } catch (error) {
        toast.error('Failed to clear cache');
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon, group: 'basic' },
    { id: 'localization', label: 'Localization', icon: Globe, group: 'basic' },
    { id: 'security', label: 'Security', icon: Shield, group: 'security' },
    { id: 'authentication', label: 'Authentication', icon: Lock, group: 'security' },
    { id: 'api', label: 'API & Integrations', icon: Key, group: 'integrations' },
    { id: 'email', label: 'Email', icon: Mail, group: 'communications' },
    { id: 'sms', label: 'SMS', icon: Smartphone, group: 'communications' },
    { id: 'mpesa', label: 'MPESA', icon: CreditCard, group: 'payments' },
    { id: 'notifications', label: 'Notifications', icon: Bell, group: 'communications' },
    { id: 'backup', label: 'Backup', icon: Database, group: 'system' },
    { id: 'webhooks', label: 'Webhooks', icon: Link, group: 'integrations' },
    { id: 'social', label: 'Social Login', icon: Users, group: 'security' },
  ];

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
        <style>{`
          .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
          .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><SettingsIcon size={28} /> System Settings</h1>
          <p>Configure system-wide settings, integrations, and security preferences</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchSettings} className="btn-secondary">
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="sidebar-group">
            <div className="group-label">Basic</div>
            {tabs.filter(t => t.group === 'basic').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sidebar-group">
            <div className="group-label">Security</div>
            {tabs.filter(t => t.group === 'security').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sidebar-group">
            <div className="group-label">Communications</div>
            {tabs.filter(t => t.group === 'communications').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sidebar-group">
            <div className="group-label">Payments</div>
            {tabs.filter(t => t.group === 'payments').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sidebar-group">
            <div className="group-label">Integrations</div>
            {tabs.filter(t => t.group === 'integrations').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="sidebar-group">
            <div className="group-label">System</div>
            {tabs.filter(t => t.group === 'system').map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && settings && (
            <div className="settings-card">
              <h3>General Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('general', {
                  systemName: formData.get('systemName'),
                  systemVersion: settings.general.systemVersion,
                  environment: formData.get('environment'),
                  maintenanceMode: formData.get('maintenanceMode') === 'true',
                  maintenanceMessage: formData.get('maintenanceMessage')
                });
              }}>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>System Name</label>
                    <input type="text" name="systemName" defaultValue={settings.general.systemName} required />
                  </div>
                  <div className="form-group">
                    <label>System Version</label>
                    <input type="text" name="systemVersion" defaultValue={settings.general.systemVersion} disabled />
                  </div>
                  <div className="form-group">
                    <label>Environment</label>
                    <select name="environment" defaultValue={settings.general.environment}>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Maintenance Mode</label>
                    <select name="maintenanceMode" defaultValue={settings.general.maintenanceMode ? 'true' : 'false'}>
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Maintenance Message</label>
                    <input type="text" name="maintenanceMessage" defaultValue={settings.general.maintenanceMessage || "System is under maintenance. Please check back later."} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Localization Settings */}
          {activeTab === 'localization' && settings && (
            <div className="settings-card">
              <h3>Localization</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('general', {
                  ...settings.general,
                  timezone: formData.get('timezone'),
                  dateFormat: formData.get('dateFormat'),
                  timeFormat: formData.get('timeFormat'),
                  currency: formData.get('currency'),
                  currencyPosition: formData.get('currencyPosition'),
                  language: formData.get('language'),
                  weekStartDay: formData.get('weekStartDay'),
                  numberFormat: formData.get('numberFormat')
                });
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Timezone</label>
                    <select name="timezone" defaultValue={settings.general.timezone || 'Africa/Nairobi'}>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date Format</label>
                    <select name="dateFormat" defaultValue={settings.general.dateFormat || 'DD/MM/YYYY'}>
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Format</label>
                    <select name="timeFormat" defaultValue={settings.general.timeFormat || '12-hour'}>
                      <option>12-hour</option>
                      <option>24-hour</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" defaultValue={settings.general.currency || 'KES'}>
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Currency Symbol Position</label>
                    <select name="currencyPosition" defaultValue={settings.general.currencyPosition || 'before'}>
                      <option value="before">Before amount (KES 100)</option>
                      <option value="after">After amount (100 KES)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Default Language</label>
                    <select name="language" defaultValue={settings.general.language || 'en'}>
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Week Start Day</label>
                    <select name="weekStartDay" defaultValue={settings.general.weekStartDay || 'Monday'}>
                      <option>Monday</option>
                      <option>Sunday</option>
                      <option>Saturday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number Format</label>
                    <select name="numberFormat" defaultValue={settings.general.numberFormat || '1,000.00'}>
                      <option>1,000.00</option>
                      <option>1.000,00</option>
                      <option>1 000.00</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && settings && (
            <div className="settings-card">
              <h3>Security Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('security', { 
                  minPasswordLength: Number(formData.get('minPasswordLength')), 
                  requireSpecialChars: formData.get('requireSpecialChars') === 'on', 
                  requireNumbers: formData.get('requireNumbers') === 'on',
                  requireUppercase: formData.get('requireUppercase') === 'on',
                  requireLowercase: formData.get('requireLowercase') === 'on',
                  sessionTimeout: Number(formData.get('sessionTimeout')), 
                  maxLoginAttempts: Number(formData.get('maxLoginAttempts')), 
                  lockoutDuration: Number(formData.get('lockoutDuration')), 
                  require2FA: formData.get('require2FA') === 'on', 
                  passwordExpiryDays: Number(formData.get('passwordExpiryDays')),
                  preventPasswordReuse: Number(formData.get('preventPasswordReuse')),
                  maxSessionsPerUser: Number(formData.get('maxSessionsPerUser'))
                }); 
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Minimum Password Length</label>
                    <input type="number" name="minPasswordLength" defaultValue={settings.security.minPasswordLength} min="6" max="32" />
                  </div>
                  <div className="form-group">
                    <label>Password Expiry (days)</label>
                    <input type="number" name="passwordExpiryDays" defaultValue={settings.security.passwordExpiryDays || 90} min="0" max="365" placeholder="0 = never" />
                  </div>
                  <div className="form-group">
                    <label>Prevent Password Reuse (count)</label>
                    <input type="number" name="preventPasswordReuse" defaultValue={settings.security.preventPasswordReuse || 5} min="0" max="20" />
                  </div>
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input type="number" name="sessionTimeout" defaultValue={settings.security.sessionTimeout} min="5" max="480" />
                  </div>
                  <div className="form-group">
                    <label>Max Login Attempts</label>
                    <input type="number" name="maxLoginAttempts" defaultValue={settings.security.maxLoginAttempts} min="3" max="10" />
                  </div>
                  <div className="form-group">
                    <label>Lockout Duration (minutes)</label>
                    <input type="number" name="lockoutDuration" defaultValue={settings.security.lockoutDuration} min="5" max="60" />
                  </div>
                  <div className="form-group">
                    <label>Max Sessions Per User</label>
                    <input type="number" name="maxSessionsPerUser" defaultValue={settings.security.maxSessionsPerUser || 5} min="1" max="20" />
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="requireSpecialChars" defaultChecked={settings.security.requireSpecialChars} /> Require Special Characters (!@#$%)</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="requireNumbers" defaultChecked={settings.security.requireNumbers} /> Require Numbers</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="requireUppercase" defaultChecked={settings.security.requireUppercase} /> Require Uppercase Letters</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="requireLowercase" defaultChecked={settings.security.requireLowercase} /> Require Lowercase Letters</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="require2FA" defaultChecked={settings.security.require2FA} /> Require Two-Factor Authentication</label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Security Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Authentication Settings */}
          {activeTab === 'authentication' && settings && (
            <div className="settings-card">
              <h3>Authentication Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('authentication', {
                  allowRegistration: formData.get('allowRegistration') === 'on',
                  emailVerificationRequired: formData.get('emailVerificationRequired') === 'on',
                  phoneVerificationRequired: formData.get('phoneVerificationRequired') === 'on',
                  adminApprovalRequired: formData.get('adminApprovalRequired') === 'on',
                  jwtExpiryHours: Number(formData.get('jwtExpiryHours')),
                  refreshTokenExpiryDays: Number(formData.get('refreshTokenExpiryDays')),
                  otpExpiryMinutes: Number(formData.get('otpExpiryMinutes'))
                });
              }}>
                <div className="form-grid">
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="allowRegistration" defaultChecked={true} /> Allow New User Registration</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="emailVerificationRequired" defaultChecked={true} /> Require Email Verification</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="phoneVerificationRequired" defaultChecked={false} /> Require Phone Verification</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="adminApprovalRequired" defaultChecked={false} /> Admin Approval Required</label>
                  </div>
                  <div className="form-group">
                    <label>JWT Expiry (hours)</label>
                    <input type="number" name="jwtExpiryHours" defaultValue="24" min="1" max="720" />
                  </div>
                  <div className="form-group">
                    <label>Refresh Token Expiry (days)</label>
                    <input type="number" name="refreshTokenExpiryDays" defaultValue="7" min="1" max="90" />
                  </div>
                  <div className="form-group">
                    <label>OTP Expiry (minutes)</label>
                    <input type="number" name="otpExpiryMinutes" defaultValue="5" min="1" max="30" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Auth Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && settings && (
            <div className="settings-card">
              <h3>Email Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('email', { 
                  provider: formData.get('provider'), 
                  host: formData.get('host'), 
                  port: Number(formData.get('port')), 
                  username: formData.get('username'), 
                  password: formData.get('password'), 
                  fromEmail: formData.get('fromEmail'), 
                  fromName: formData.get('fromName'), 
                  encryption: formData.get('encryption'),
                  apiKey: formData.get('apiKey'),
                  domain: formData.get('domain')
                }); 
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Provider</label>
                    <select name="provider" defaultValue={settings.email.provider || 'smtp'}>
                      <option value="smtp">SMTP</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="ses">AWS SES</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="postmark">Postmark</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <input name="host" defaultValue={settings.email.host || ''} placeholder="smtp.gmail.com" />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input type="number" name="port" defaultValue={settings.email.port || 587} placeholder="587" />
                  </div>
                  <div className="form-group">
                    <label>Encryption</label>
                    <select name="encryption" defaultValue={settings.email.encryption || 'tls'}>
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input name="username" defaultValue={settings.email.username || ''} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" defaultValue={settings.email.password || ''} />
                  </div>
                  <div className="form-group">
                    <label>API Key (for providers)</label>
                    <input type="password" name="apiKey" defaultValue={settings.email.apiKey || ''} />
                  </div>
                  <div className="form-group">
                    <label>Domain (for Mailgun/SES)</label>
                    <input name="domain" defaultValue={settings.email.domain || ''} placeholder="yourdomain.com" />
                  </div>
                  <div className="form-group full">
                    <label>From Email</label>
                    <input type="email" name="fromEmail" defaultValue={settings.email.fromEmail} required />
                  </div>
                  <div className="form-group full">
                    <label>From Name</label>
                    <input name="fromName" defaultValue={settings.email.fromName} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => testConnection('email')} disabled={testingConnection}>
                    <Mail size={16} /> Test Connection
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Email Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SMS Settings */}
          {activeTab === 'sms' && settings && (
            <div className="settings-card">
              <h3>SMS Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('sms', { 
                  provider: formData.get('provider'), 
                  apiKey: formData.get('apiKey'), 
                  senderId: formData.get('senderId'), 
                  username: formData.get('username'),
                  apiSecret: formData.get('apiSecret')
                }); 
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Provider</label>
                    <select name="provider" defaultValue={settings.sms.provider || 'africas-talking'}>
                      <option value="africas-talking">Africa's Talking</option>
                      <option value="twilio">Twilio</option>
                      <option value="infobip">Infobip</option>
                      <option value="vonage">Vonage (Nexmo)</option>
                      <option value="local">Local SMS Gateway</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>API Key / Token</label>
                    <input type="password" name="apiKey" defaultValue={settings.sms.apiKey || ''} />
                  </div>
                  <div className="form-group">
                    <label>API Secret (if applicable)</label>
                    <input type="password" name="apiSecret" defaultValue={settings.sms.apiSecret || ''} />
                  </div>
                  <div className="form-group">
                    <label>Sender ID</label>
                    <input name="senderId" defaultValue={settings.sms.senderId || ''} placeholder="SCHOOL" maxLength={11} />
                  </div>
                  <div className="form-group">
                    <label>Username (if applicable)</label>
                    <input name="username" defaultValue={settings.sms.username || ''} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => testConnection('sms')} disabled={testingConnection}>
                    <Smartphone size={16} /> Test SMS
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save SMS Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MPESA Settings */}
          {activeTab === 'mpesa' && settings && (
            <div className="settings-card">
              <h3>MPESA Integration</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('mpesa', { 
                  consumerKey: formData.get('consumerKey'), 
                  consumerSecret: formData.get('consumerSecret'), 
                  shortcode: formData.get('shortcode'), 
                  passkey: formData.get('passkey'), 
                  environment: formData.get('environment'), 
                  callbackUrl: formData.get('callbackUrl'),
                  timeoutUrl: formData.get('timeoutUrl'),
                  resultUrl: formData.get('resultUrl')
                }); 
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Environment</label>
                    <select name="environment" defaultValue={settings.mpesa.environment || 'sandbox'}>
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production (Live)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Consumer Key</label>
                    <input type="password" name="consumerKey" defaultValue={settings.mpesa.consumerKey} />
                  </div>
                  <div className="form-group">
                    <label>Consumer Secret</label>
                    <input type="password" name="consumerSecret" defaultValue={settings.mpesa.consumerSecret} />
                  </div>
                  <div className="form-group">
                    <label>Shortcode / Till Number</label>
                    <input name="shortcode" defaultValue={settings.mpesa.shortcode} />
                  </div>
                  <div className="form-group">
                    <label>Passkey</label>
                    <input type="password" name="passkey" defaultValue={settings.mpesa.passkey} />
                  </div>
                  <div className="form-group full">
                    <label>Callback URL</label>
                    <input name="callbackUrl" defaultValue={settings.mpesa.callbackUrl || ''} placeholder="https://yourdomain.com/api/mpesa/callback" />
                  </div>
                  <div className="form-group full">
                    <label>Timeout URL</label>
                    <input name="timeoutUrl" defaultValue={settings.mpesa.timeoutUrl || ''} placeholder="https://yourdomain.com/api/mpesa/timeout" />
                  </div>
                  <div className="form-group full">
                    <label>Result URL</label>
                    <input name="resultUrl" defaultValue={settings.mpesa.resultUrl || ''} placeholder="https://yourdomain.com/api/mpesa/result" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => testConnection('mpesa')} disabled={testingConnection}>
                    <CreditCard size={16} /> Test MPESA
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save MPESA Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* API Keys Section */}
          {activeTab === 'api' && (
            <div className="settings-card">
              <div className="card-header">
                <h3>API Keys</h3>
                <button onClick={() => setShowApiKeyModal(true)} className="btn-primary btn-sm">
                  <Plus size={14} /> Generate API Key
                </button>
              </div>
              <div className="api-keys-list">
                {apiKeys.length === 0 ? (
                  <p className="empty-state">No API keys generated yet</p>
                ) : (
                  apiKeys.map(key => (
                    <div key={key.id} className="api-key-item">
                      <div className="key-info">
                        <strong>{key.name}</strong>
                        <div className="key-meta">
                          <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                          <span>Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</span>
                          <span>Permissions: {key.permissions.join(', ')}</span>
                        </div>
                      </div>
                      <div className="key-actions">
                        <span className={`status-${key.status}`}>{key.status}</span>
                        {key.status === 'active' && (
                          <button onClick={() => revokeApiKey(key.id)} className="btn-sm btn-danger">
                            <Trash2 size={12} /> Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="integrations-section">
                <h4>External Integrations</h4>
                <div className="integration-grid">
                  <div className="integration-card">
                    <GoogleAnalytics size={24} /> Google Analytics
                  </div>
                  <div className="integration-card">
                    <Facebook size={24} /> Facebook Pixel
                  </div>
                  <div className="integration-card">
                    <MessageCircle size={24} /> WhatsApp Business API
                  </div>
                  <div className="integration-card">
                    <Twitter size={24} /> Twitter Analytics
                  </div>
                  <div className="integration-card">
                    <Instagram size={24} /> Instagram API
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks Section */}
          {activeTab === 'webhooks' && (
            <div className="settings-card">
              <div className="card-header">
                <h3>Webhooks</h3>
                <button onClick={() => setShowWebhookModal(true)} className="btn-primary btn-sm">
                  <Plus size={14} /> Add Webhook
                </button>
              </div>
              <div className="webhooks-list">
                {webhooks.length === 0 ? (
                  <p className="empty-state">No webhooks configured</p>
                ) : (
                  webhooks.map(webhook => (
                    <div key={webhook.id} className="webhook-item">
                      <div className="webhook-info">
                        <strong>{webhook.url}</strong>
                        <div className="webhook-meta">
                          Events: {webhook.events.join(', ')}
                          <span className={`status-${webhook.active ? 'active' : 'inactive'}`}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="webhook-actions">
                        <button onClick={() => testWebhook(webhook.url)} className="btn-sm btn-secondary">
                          <Link size={12} /> Test
                        </button>
                        <button onClick={() => deleteWebhook(webhook.id)} className="btn-sm btn-danger">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Social Login Settings */}
          {activeTab === 'social' && (
            <div className="settings-card">
              <h3>Social Login Configuration</h3>
              {socialLogins.map(provider => (
                <div key={provider.provider} className="social-provider">
                  <div className="provider-header">
                    <input 
                      type="checkbox" 
                      checked={provider.enabled} 
                      onChange={e => setSocialLogins(prev => 
                        prev.map(p => p.provider === provider.provider ? { ...p, enabled: e.target.checked } : p)
                      )} 
                    />
                    <strong>{provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}</strong>
                  </div>
                  <div className="provider-fields">
                    <input 
                      placeholder="Client ID" 
                      value={provider.clientId} 
                      onChange={e => setSocialLogins(prev => 
                        prev.map(p => p.provider === provider.provider ? { ...p, clientId: e.target.value } : p)
                      )} 
                    />
                    <input 
                      type="password"
                      placeholder="Client Secret" 
                      value={provider.clientSecret} 
                      onChange={e => setSocialLogins(prev => 
                        prev.map(p => p.provider === provider.provider ? { ...p, clientSecret: e.target.value } : p)
                      )} 
                    />
                    <input 
                      placeholder="Redirect URI" 
                      value={provider.redirectUri} 
                      onChange={e => setSocialLogins(prev => 
                        prev.map(p => p.provider === provider.provider ? { ...p, redirectUri: e.target.value } : p)
                      )} 
                    />
                  </div>
                </div>
              ))}
              <div className="form-actions">
                <button className="btn-primary" onClick={() => handleSave('integrations', { socialLogins })} disabled={saving}>
                  <Save size={16} /> Save Social Login Settings
                </button>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && settings && (
            <div className="settings-card">
              <h3>Backup Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('backup', { 
                  autoBackup: formData.get('autoBackup') === 'on', 
                  backupFrequency: formData.get('backupFrequency'), 
                  backupLocation: formData.get('backupLocation'), 
                  retentionDays: Number(formData.get('retentionDays')),
                  backupTime: formData.get('backupTime'),
                  includeMedia: formData.get('includeMedia') === 'on'
                }); 
              }}>
                <div className="form-grid">
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="autoBackup" defaultChecked={settings.backup.autoBackup} /> Enable Automatic Backups</label>
                  </div>
                  <div className="form-group">
                    <label>Backup Frequency</label>
                    <select name="backupFrequency" defaultValue={settings.backup.backupFrequency || 'daily'}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Backup Time (UTC)</label>
                    <input type="time" name="backupTime" defaultValue={settings.backup.backupTime || '02:00'} />
                  </div>
                  <div className="form-group">
                    <label>Backup Location</label>
                    <select name="backupLocation" defaultValue={settings.backup.backupLocation || 'local'}>
                      <option value="local">Local Storage</option>
                      <option value="aws">AWS S3</option>
                      <option value="google">Google Cloud Storage</option>
                      <option value="azure">Azure Blob Storage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Retention (days)</label>
                    <input type="number" name="retentionDays" defaultValue={settings.backup.retentionDays || 30} min="1" max="365" />
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="includeMedia" defaultChecked={true} /> Include Media Files</label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Backup Settings
                  </button>
                </div>
              </form>
              
              <div className="backup-actions">
                <button onClick={createBackup} className="btn-secondary">
                  <Database size={16} /> Create Backup Now
                </button>
                <button onClick={clearCache} className="btn-secondary">
                  <RefreshCcw size={16} /> Clear Cache
                </button>
              </div>

              {backupHistory.length > 0 && (
                <div className="backup-history">
                  <h4>Recent Backups</h4>
                  <div className="backup-list">
                    {backupHistory.map(backup => (
                      <div key={backup.id} className="backup-item">
                        <div>
                          <strong>{new Date(backup.createdAt).toLocaleString()}</strong>
                          <div className="backup-size">Size: {backup.size} • Type: {backup.type}</div>
                        </div>
                        <div className="backup-actions">
                          <button onClick={() => restoreBackup(backup.id)} className="btn-sm btn-secondary">
                            <Download size={12} /> Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && settings && (
            <div className="settings-card">
              <h3>Notification Settings</h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                handleSave('notifications', { 
                  emailNotifications: formData.get('emailNotifications') === 'on', 
                  smsNotifications: formData.get('smsNotifications') === 'on', 
                  pushNotifications: formData.get('pushNotifications') === 'on',
                  inAppNotifications: formData.get('inAppNotifications') === 'on',
                  notifyOnStudentEnrollment: formData.get('notifyOnStudentEnrollment') === 'on', 
                  notifyOnFeePayment: formData.get('notifyOnFeePayment') === 'on', 
                  notifyOnDisciplineIssue: formData.get('notifyOnDisciplineIssue') === 'on', 
                  notifyOnLowInventory: formData.get('notifyOnLowInventory') === 'on', 
                  notifyOnSystemError: formData.get('notifyOnSystemError') === 'on',
                  notifyOnAttendance: formData.get('notifyOnAttendance') === 'on',
                  notifyOnExamResults: formData.get('notifyOnExamResults') === 'on',
                  digestFrequency: formData.get('digestFrequency')
                }); 
              }}>
                <div className="form-grid">
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="emailNotifications" defaultChecked={settings.notifications.emailNotifications} /> Email Notifications</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="smsNotifications" defaultChecked={settings.notifications.smsNotifications} /> SMS Notifications</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="pushNotifications" defaultChecked={settings.notifications.pushNotifications} /> Push Notifications</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="inAppNotifications" defaultChecked={true} /> In-App Notifications</label>
                  </div>
                  <div className="form-group">
                    <label>Digest Frequency</label>
                    <select name="digestFrequency" defaultValue={settings.notifications.digestFrequency || 'daily'}>
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                  </div>
                  <div className="checkbox-group full">
                    <strong>Events to Notify:</strong>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnStudentEnrollment" defaultChecked={settings.notifications.notifyOnStudentEnrollment} /> Student Enrollment</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnFeePayment" defaultChecked={settings.notifications.notifyOnFeePayment} /> Fee Payment</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnDisciplineIssue" defaultChecked={settings.notifications.notifyOnDisciplineIssue} /> Discipline Issues</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnLowInventory" defaultChecked={settings.notifications.notifyOnLowInventory} /> Low Inventory</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnSystemError" defaultChecked={settings.notifications.notifyOnSystemError} /> System Errors</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnAttendance" defaultChecked={true} /> Attendance Alerts</label>
                  </div>
                  <div className="checkbox-group">
                    <label><input type="checkbox" name="notifyOnExamResults" defaultChecked={true} /> Exam Results</label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={16} /> Save Notification Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Generate API Key</h3>
              <button className="close-btn" onClick={() => setShowApiKeyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Key Name</label>
                <input 
                  placeholder="e.g., Mobile App, Third-party Integration" 
                  value={newApiKey.name} 
                  onChange={e => setNewApiKey({...newApiKey, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <select 
                  multiple 
                  value={newApiKey.permissions} 
                  onChange={e => setNewApiKey({...newApiKey, permissions: Array.from(e.target.selectedOptions, o => o.value)})}
                  className="multi-select"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="delete">Delete</option>
                  <option value="admin">Admin</option>
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApiKeyModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={generateApiKey}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Webhook</h3>
              <button className="close-btn" onClick={() => setShowWebhookModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Webhook URL</label>
                <input 
                  placeholder="https://yourdomain.com/webhook" 
                  value={newWebhook.url} 
                  onChange={e => setNewWebhook({...newWebhook, url: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Secret (for verification)</label>
                <input 
                  type="password"
                  placeholder="Your webhook secret" 
                  value={newWebhook.secret} 
                  onChange={e => setNewWebhook({...newWebhook, secret: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Events</label>
                <select 
                  multiple 
                  value={newWebhook.events} 
                  onChange={e => setNewWebhook({...newWebhook, events: Array.from(e.target.selectedOptions, o => o.value)})}
                  className="multi-select"
                >
                  <option value="user.created">User Created</option>
                  <option value="user.updated">User Updated</option>
                  <option value="payment.received">Payment Received</option>
                  <option value="student.enrolled">Student Enrolled</option>
                  <option value="inventory.low">Inventory Low</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowWebhookModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addWebhook}>Add Webhook</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
        .page-header p { color: #64748b; margin: 8px 0 0 0; }
        .header-actions { display: flex; gap: 12px; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s; }
        .btn-primary:hover { background: #166b6b; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s; }
        .btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; }
        .btn-danger { background: #ef4444; color: white; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; transition: all 0.2s; }
        .btn-danger:hover { background: #dc2626; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .settings-layout { display: flex; gap: 24px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .settings-sidebar { width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 20px 0; }
        .sidebar-group { margin-bottom: 20px; }
        .group-label { padding: 8px 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .sidebar-tab { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 20px; border: none; background: none; cursor: pointer; text-align: left; color: #475569; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .sidebar-tab:hover { background: #e2e8f0; color: #1d8a8a; }
        .sidebar-tab.active { background: #e0f2fe; color: #1d8a8a; border-right: 2px solid #1d8a8a; }
        .settings-content { flex: 1; padding: 24px; max-height: calc(100vh - 120px); overflow-y: auto; }
        .settings-card { background: white; border-radius: 12px; margin-bottom: 24px; }
        .settings-card h3 { margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #0f172a; }
        .settings-card h4 { margin: 20px 0 12px 0; font-size: 14px; font-weight: 600; color: #334155; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-header h3 { margin: 0; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 500; color: #334155; }
        .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #1d8a8a; ring: 2px solid rgba(29,138,138,0.1); }
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group label { display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .api-keys-list, .webhooks-list { margin-top: 16px; }
        .api-key-item, .webhook-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; }
        .key-info, .webhook-info { flex: 1; }
        .key-meta, .webhook-meta { display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-top: 4px; }
        .key-actions, .webhook-actions { display: flex; gap: 8px; align-items: center; }
        .status-active { color: #10b981; font-weight: 500; }
        .status-revoked { color: #ef4444; font-weight: 500; }
        .empty-state { text-align: center; padding: 40px; color: #64748b; }
        .integration-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .integration-card { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .integration-card:hover { border-color: #1d8a8a; background: #f0fdf4; }
        .social-provider { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
        .provider-header { padding: 12px; background: #f8fafc; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; }
        .provider-fields { padding: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .provider-fields input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        .backup-actions { display: flex; gap: 12px; margin: 16px 0; }
        .backup-history { margin-top: 24px; }
        .backup-list { display: flex; flex-direction: column; gap: 8px; }
        .backup-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .backup-size { font-size: 12px; color: #64748b; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 12px; width: 500px; max-width: 90%; max-height: 80vh; overflow: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .modal-header h3 { margin: 0; }
        .close-btn { background: none; border: none; cursor: pointer; padding: 4px; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #e2e8f0; }
        .multi-select { min-height: 100px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
        small { font-size: 11px; color: #64748b; margin-top: 4px; }
        @media (max-width: 768px) { .settings-layout { flex-direction: column; } .settings-sidebar { width: 100%; } .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } .provider-fields { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
