// client/src/components/roles/admin/AdminPermissionsPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Save, RefreshCcw, Shield, Check, X, Search, 
  Users, Lock, Unlock, Globe, Bell, AlertTriangle,
  UserPlus, UserMinus, BookOpen, CreditCard, 
  Settings, Database, Cloud, Mail, Phone, 
  MessageCircle, Calendar, FileText, BarChart3,
  Activity, Server, Zap, Power, PlayCircle, 
  PauseCircle, Eye, EyeOff, Key, Fingerprint,
  ShieldCheck, ShieldAlert, LockKeyhole, UserCheck,
  Building2, GraduationCap, DollarSign, Package,
  Library, Heart, Users2, TrendingUp, Download,
  Upload, Edit, Trash2, Plus, MinusCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { permissionsService } from '../../../services/adminService';
import type { Permission } from '../../../types/admin';

interface SystemToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: 'admissions' | 'registrations' | 'payments' | 'communications' | 'security' | 'integrations';
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: string[];
  isSystemRole: boolean;
}

export default function AdminPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'roles' | 'system' | 'access' | 'audit'>('roles');

  // System-wide toggles (Critical controls)
  const [systemToggles, setSystemToggles] = useState<SystemToggle[]>([
    { id: 'admissions_enabled', name: 'Student Admissions', description: 'Allow new student applications to be submitted', enabled: true, icon: <UserPlus size={18} />, category: 'admissions' },
    { id: 'online_registration', name: 'Online Registration', description: 'Allow parents to register new students online', enabled: true, icon: <Globe size={18} />, category: 'admissions' },
    { id: 'parent_portal', name: 'Parent Portal Access', description: 'Allow parents to access their portal', enabled: true, icon: <Users size={18} />, category: 'admissions' },
    { id: 'teacher_portal', name: 'Teacher Portal Access', description: 'Allow teachers to access their portal', enabled: true, icon: <Users size={18} />, category: 'admissions' },
    { id: 'student_portal', name: 'Student Portal Access', description: 'Allow students to access their portal', enabled: true, icon: <Users size={18} />, category: 'admissions' },
    
    { id: 'fee_payments', name: 'Online Fee Payments', description: 'Process fee payments via MPESA/Bank', enabled: true, icon: <CreditCard size={18} />, category: 'payments' },
    { id: 'auto_invoicing', name: 'Auto Invoicing', description: 'Automatically generate fee invoices', enabled: true, icon: <FileText size={18} />, category: 'payments' },
    { id: 'payment_reminders', name: 'Payment Reminders', description: 'Send automatic payment reminders', enabled: true, icon: <Bell size={18} />, category: 'payments' },
    
    { id: 'bulk_sms', name: 'Bulk SMS', description: 'Allow sending bulk SMS messages', enabled: true, icon: <MessageCircle size={18} />, category: 'communications' },
    { id: 'bulk_email', name: 'Bulk Email', description: 'Allow sending bulk email campaigns', enabled: true, icon: <Mail size={18} />, category: 'communications' },
    { id: 'whatsapp_integration', name: 'WhatsApp Integration', description: 'Send messages via WhatsApp', enabled: false, icon: <Phone size={18} />, category: 'communications' },
    { id: 'push_notifications', name: 'Push Notifications', description: 'Send push notifications to mobile apps', enabled: true, icon: <Bell size={18} />, category: 'communications' },
    
    { id: '2fa_required', name: 'Two-Factor Authentication', description: 'Require 2FA for all admin accounts', enabled: false, icon: <Fingerprint size={18} />, category: 'security' },
    { id: 'session_timeout', name: 'Auto Session Timeout', description: 'Auto logout after 30 minutes inactivity', enabled: true, icon: <Clock size={18} />, category: 'security' },
    { id: 'login_alerts', name: 'Login Alerts', description: 'Send email on new device login', enabled: true, icon: <AlertTriangle size={18} />, category: 'security' },
    { id: 'ip_whitelist', name: 'IP Whitelist', description: 'Restrict access to specific IP addresses', enabled: false, icon: <ShieldCheck size={18} />, category: 'security' },
    
    { id: 'mpesa_integration', name: 'MPESA Integration', description: 'Process payments via MPESA', enabled: true, icon: <CreditCard size={18} />, category: 'integrations' },
    { id: 'email_service', name: 'Email Service', description: 'Send emails via SMTP', enabled: true, icon: <Mail size={18} />, category: 'integrations' },
    { id: 'cloud_backup', name: 'Cloud Backup', description: 'Auto backup to cloud storage', enabled: true, icon: <Cloud size={18} />, category: 'integrations' },
  ]);

  // Role-based permissions
  const [roles, setRoles] = useState<RolePermission[]>([
    { roleId: 'admin', roleName: 'Administrator', permissions: ['all'], isSystemRole: true },
    { roleId: 'principal', roleName: 'Principal', permissions: ['all'], isSystemRole: true },
    { roleId: 'developer', roleName: 'Developer', permissions: ['all'], isSystemRole: true },
    { roleId: 'teacher', roleName: 'Teacher', permissions: ['attendance.view', 'results.enter', 'students.view'], isSystemRole: false },
    { roleId: 'bursar', roleName: 'Bursar/Accountant', permissions: ['finance.view', 'finance.manage', 'reports.finance'], isSystemRole: false },
    { roleId: 'store_keeper', roleName: 'Store Keeper', permissions: ['inventory.view', 'inventory.manage', 'stock.manage'], isSystemRole: false },
    { roleId: 'librarian', roleName: 'Librarian', permissions: ['library.view', 'library.manage', 'books.manage'], isSystemRole: false },
    { roleId: 'parent', roleName: 'Parent', permissions: ['students.view', 'fees.view', 'communication.receive'], isSystemRole: false },
    { roleId: 'student', roleName: 'Student', permissions: ['results.view', 'attendance.view', 'library.borrow'], isSystemRole: false },
  ]);

  const allPermissions = [
    { id: 'students.all', name: 'Full Student Management', category: 'Students' },
    { id: 'students.view', name: 'View Students', category: 'Students' },
    { id: 'students.create', name: 'Add Students', category: 'Students' },
    { id: 'students.edit', name: 'Edit Students', category: 'Students' },
    { id: 'students.delete', name: 'Delete Students', category: 'Students' },
    { id: 'students.import', name: 'Bulk Import Students', category: 'Students' },
    { id: 'students.export', name: 'Export Students', category: 'Students' },
    { id: 'teachers.all', name: 'Full Teacher Management', category: 'Teachers' },
    { id: 'teachers.view', name: 'View Teachers', category: 'Teachers' },
    { id: 'teachers.create', name: 'Add Teachers', category: 'Teachers' },
    { id: 'teachers.edit', name: 'Edit Teachers', category: 'Teachers' },
    { id: 'teachers.delete', name: 'Delete Teachers', category: 'Teachers' },
    { id: 'teachers.assign', name: 'Assign Subjects/Classes', category: 'Teachers' },
    { id: 'finance.view', name: 'View Finance', category: 'Finance' },
    { id: 'finance.manage', name: 'Manage Finance', category: 'Finance' },
    { id: 'finance.collect', name: 'Collect Payments', category: 'Finance' },
    { id: 'finance.export', name: 'Export Financial Reports', category: 'Finance' },
    { id: 'attendance.view', name: 'View Attendance', category: 'Attendance' },
    { id: 'attendance.mark', name: 'Mark Attendance', category: 'Attendance' },
    { id: 'attendance.report', name: 'Generate Attendance Reports', category: 'Attendance' },
    { id: 'results.view', name: 'View Results', category: 'Academics' },
    { id: 'results.enter', name: 'Enter Results', category: 'Academics' },
    { id: 'results.edit', name: 'Edit Results', category: 'Academics' },
    { id: 'results.export', name: 'Export Results', category: 'Academics' },
    { id: 'timetable.view', name: 'View Timetable', category: 'Academics' },
    { id: 'timetable.manage', name: 'Manage Timetable', category: 'Academics' },
    { id: 'inventory.view', name: 'View Inventory', category: 'Inventory' },
    { id: 'inventory.manage', name: 'Manage Inventory', category: 'Inventory' },
    { id: 'stock.manage', name: 'Manage Stock', category: 'Inventory' },
    { id: 'library.view', name: 'View Library', category: 'Library' },
    { id: 'library.manage', name: 'Manage Library', category: 'Library' },
    { id: 'books.manage', name: 'Manage Books', category: 'Library' },
    { id: 'communication.send', name: 'Send Communications', category: 'Communication' },
    { id: 'communication.receive', name: 'Receive Communications', category: 'Communication' },
    { id: 'communication.bulk', name: 'Bulk Communications', category: 'Communication' },
    { id: 'reports.view', name: 'View Reports', category: 'Reports' },
    { id: 'reports.generate', name: 'Generate Reports', category: 'Reports' },
    { id: 'reports.export', name: 'Export Reports', category: 'Reports' },
    { id: 'settings.view', name: 'View Settings', category: 'Settings' },
    { id: 'settings.manage', name: 'Manage Settings', category: 'Settings' },
    { id: 'system.backup', name: 'Backup System', category: 'System' },
    { id: 'system.restore', name: 'Restore System', category: 'System' },
    { id: 'users.manage', name: 'Manage Users', category: 'System' },
    { id: 'roles.manage', name: 'Manage Roles', category: 'System' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      const [systemSettings, rolePerms] = await Promise.all([
        permissionsService.getSystemToggles(),
        permissionsService.getAllRolePermissions()
      ]);
      if (systemSettings) setSystemToggles(systemSettings);
      if (rolePerms) setRoles(rolePerms);
    } catch (error) {
      console.error('Failed to fetch permissions data:', error);
      toast.error('Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSystem = async (toggleId: string, currentState: boolean) => {
    try {
      await permissionsService.updateSystemToggle(toggleId, !currentState);
      setSystemToggles(prev => prev.map(t => 
        t.id === toggleId ? { ...t, enabled: !currentState } : t
      ));
      toast.success(`${!currentState ? 'Enabled' : 'Disabled'} ${systemToggles.find(t => t.id === toggleId)?.name}`);
    } catch (error) {
      toast.error('Failed to update system setting');
    }
  };

  const handleRolePermissionChange = async (roleId: string, permissionId: string, checked: boolean) => {
    setRoles(prev => prev.map(role => {
      if (role.roleId !== roleId) return role;
      const newPermissions = checked 
        ? [...role.permissions, permissionId]
        : role.permissions.filter(p => p !== permissionId);
      return { ...role, permissions: newPermissions };
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        permissionsService.updateSystemToggles(systemToggles),
        permissionsService.updateAllRolePermissions(roles)
      ]);
      toast.success('All permissions saved successfully');
    } catch (error) {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasPermission = (role: RolePermission, permissionId: string) => {
    if (role.permissions.includes('all')) return true;
    return role.permissions.includes(permissionId);
  };

  if (loading) {
    return (
      <div className="permissions-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permissions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Security & Permissions</h1>
          <p>Control system access, manage roles, and configure security settings</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchData}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={handleSaveAll} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="permissions-tabs">
        <button className={`tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
          <Shield size={18} /> Role Permissions
        </button>
        <button className={`tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <Settings size={18} /> System Controls
        </button>
        <button className={`tab ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
          <Lock size={18} /> Access Control
        </button>
        <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <Activity size={18} /> Audit Logs
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder={activeTab === 'roles' ? "Search roles or permissions..." : "Search system settings..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Role Permissions Tab */}
      {activeTab === 'roles' && (
        <div className="roles-container">
          {/* Role Selector */}
          <div className="role-selector">
            <label>Select Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
              ))}
            </select>
          </div>

          {/* Permissions Matrix */}
          <div className="permissions-matrix">
            <div className="matrix-header">
              <div className="permission-col">Permission</div>
              {roles.filter(r => selectedRole === 'all' || r.roleId === selectedRole).map(role => (
                <div key={role.roleId} className="role-col">
                  {role.roleName}
                  {role.isSystemRole && <span className="system-badge">System</span>}
                </div>
              ))}
            </div>

            <div className="matrix-body">
              {allPermissions
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(permission => (
                  <div key={permission.id} className="matrix-row">
                    <div className="permission-info">
                      <span className="permission-name">{permission.name}</span>
                      <span className="permission-category">{permission.category}</span>
                    </div>
                    {roles.filter(r => selectedRole === 'all' || r.roleId === selectedRole).map(role => (
                      <div key={role.roleId} className="role-permission-cell">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={hasPermission(role, permission.id)}
                            onChange={(e) => handleRolePermissionChange(role.roleId, permission.id, e.target.checked)}
                            disabled={role.isSystemRole}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* System Controls Tab */}
      {activeTab === 'system' && (
        <div className="system-controls">
          {/* Critical Alerts Section */}
          <div className="control-section critical">
            <div className="section-header">
              <AlertTriangle size={20} className="critical-icon" />
              <h3>Critical System Controls</h3>
              <p>These controls affect entire system operations - use with caution</p>
            </div>
            <div className="controls-grid">
              {systemToggles.filter(t => t.category === 'admissions').map(toggle => (
                <div key={toggle.id} className="control-card">
                  <div className="control-icon">{toggle.icon}</div>
                  <div className="control-info">
                    <h4>{toggle.name}</h4>
                    <p>{toggle.description}</p>
                  </div>
                  <button 
                    className={`control-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleSystem(toggle.id, toggle.enabled)}
                  >
                    {toggle.enabled ? <Check size={16} /> : <X size={16} />}
                    <span>{toggle.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Controls */}
          <div className="control-section">
            <div className="section-header">
              <CreditCard size={20} />
              <h3>Payment & Finance Controls</h3>
            </div>
            <div className="controls-grid">
              {systemToggles.filter(t => t.category === 'payments').map(toggle => (
                <div key={toggle.id} className="control-card">
                  <div className="control-icon">{toggle.icon}</div>
                  <div className="control-info">
                    <h4>{toggle.name}</h4>
                    <p>{toggle.description}</p>
                  </div>
                  <button 
                    className={`control-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleSystem(toggle.id, toggle.enabled)}
                  >
                    {toggle.enabled ? <Check size={16} /> : <X size={16} />}
                    <span>{toggle.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Controls */}
          <div className="control-section">
            <div className="section-header">
              <MessageCircle size={20} />
              <h3>Communication Controls</h3>
            </div>
            <div className="controls-grid">
              {systemToggles.filter(t => t.category === 'communications').map(toggle => (
                <div key={toggle.id} className="control-card">
                  <div className="control-icon">{toggle.icon}</div>
                  <div className="control-info">
                    <h4>{toggle.name}</h4>
                    <p>{toggle.description}</p>
                  </div>
                  <button 
                    className={`control-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleSystem(toggle.id, toggle.enabled)}
                  >
                    {toggle.enabled ? <Check size={16} /> : <X size={16} />}
                    <span>{toggle.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Controls */}
          <div className="control-section">
            <div className="section-header">
              <ShieldCheck size={20} />
              <h3>Security & Authentication</h3>
            </div>
            <div className="controls-grid">
              {systemToggles.filter(t => t.category === 'security').map(toggle => (
                <div key={toggle.id} className="control-card">
                  <div className="control-icon">{toggle.icon}</div>
                  <div className="control-info">
                    <h4>{toggle.name}</h4>
                    <p>{toggle.description}</p>
                  </div>
                  <button 
                    className={`control-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleSystem(toggle.id, toggle.enabled)}
                  >
                    {toggle.enabled ? <Check size={16} /> : <X size={16} />}
                    <span>{toggle.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Controls */}
          <div className="control-section">
            <div className="section-header">
              <Database size={20} />
              <h3>Integrations & Services</h3>
            </div>
            <div className="controls-grid">
              {systemToggles.filter(t => t.category === 'integrations').map(toggle => (
                <div key={toggle.id} className="control-card">
                  <div className="control-icon">{toggle.icon}</div>
                  <div className="control-info">
                    <h4>{toggle.name}</h4>
                    <p>{toggle.description}</p>
                  </div>
                  <button 
                    className={`control-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleSystem(toggle.id, toggle.enabled)}
                  >
                    {toggle.enabled ? <Check size={16} /> : <X size={16} />}
                    <span>{toggle.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Access Control Tab */}
      {activeTab === 'access' && (
        <div className="access-control">
          <div className="control-section">
            <div className="section-header">
              <LockKeyhole size={20} />
              <h3>IP Whitelisting</h3>
              <p>Restrict admin access to specific IP addresses</p>
            </div>
            <div className="ip-whitelist">
              <div className="ip-list">
                <div className="ip-item">
                  <input type="text" placeholder="192.168.1.1" />
                  <button className="btn-icon"><Plus size={16} /></button>
                </div>
                <div className="ip-item">
                  <span>192.168.1.100</span>
                  <button className="btn-icon danger"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="control-section">
            <div className="section-header">
              <Clock size={20} />
              <h3>Session Settings</h3>
            </div>
            <div className="session-settings">
              <div className="setting-item">
                <label>Session Timeout (minutes)</label>
                <input type="number" defaultValue={30} min={5} max={480} />
              </div>
              <div className="setting-item">
                <label>Max Login Attempts</label>
                <input type="number" defaultValue={5} min={3} max={10} />
              </div>
              <div className="setting-item">
                <label>Password Expiry (days)</label>
                <input type="number" defaultValue={90} min={30} max={365} />
              </div>
            </div>
          </div>

          <div className="control-section">
            <div className="section-header">
              <ShieldAlert size={20} />
              <h3>Emergency Actions</h3>
            </div>
            <div className="emergency-actions">
              <button className="emergency-btn danger" onClick={() => {
                if (confirm('WARNING: This will lock all user accounts. Are you sure?')) {
                  toast.error('Emergency lockdown activated');
                }
              }}>
                <Lock size={16} /> Lock All Accounts
              </button>
              <button className="emergency-btn warning" onClick={() => {
                if (confirm('Force logout all active sessions?')) {
                  toast('All sessions terminated', { icon: '⚠️' });
                }
              }}>
                <Power size={16} /> Terminate All Sessions
              </button>
              <button className="emergency-btn info" onClick={() => {
                toast.success('System maintenance mode activated');
              }}>
                <Zap size={16} /> Maintenance Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="audit-logs">
          <div className="audit-filters">
            <select>
              <option value="">All Actions</option>
              <option value="login">Login Attempts</option>
              <option value="permission">Permission Changes</option>
              <option value="user">User Management</option>
              <option value="system">System Changes</option>
            </select>
            <input type="date" placeholder="From Date" />
            <input type="date" placeholder="To Date" />
            <button className="btn-secondary"><Download size={16} /> Export Logs</button>
          </div>
          <div className="audit-table">
            <table>
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td>2024-01-15 10:30:00</td><td>admin@school.com</td><td>Permission Change</td><td>Role: Teacher</td><td>192.168.1.1</td><td className="success">Success</td></tr>
                <tr><td>2024-01-15 09:15:00</td><td>principal@school.com</td><td>System Toggle</td><td>Admissions Enabled</td><td>192.168.1.2</td><td className="success">Success</td></tr>
                <tr><td>2024-01-14 16:45:00</td><td>developer@school.com</td><td>User Created</td><td>New Teacher Account</td><td>10.0.0.1</td><td className="success">Success</td></tr>
                <tr><td>2024-01-14 14:20:00</td><td>unknown</td><td>Failed Login</td><td>Admin Account</td><td>203.0.113.5</td><td className="failed">Failed</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .permissions-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f8fafc;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
        }

        .page-header p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .permissions-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px 16px;
          border-radius: 60px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tab {
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
          color: #6b7280;
        }

        .tab.active {
          background: #1d8a8a;
          color: white;
        }

        .search-bar {
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
        }

        /* Role Permissions */
        .roles-container {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .role-selector {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .role-selector select {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          margin-left: 12px;
        }

        .permissions-matrix {
          overflow-x: auto;
        }

        .matrix-header, .matrix-row {
          display: flex;
          border-bottom: 1px solid #f3f4f6;
        }

        .permission-col {
          width: 300px;
          padding: 12px 16px;
          font-weight: 600;
          background: #fafbfc;
          flex-shrink: 0;
        }

        .role-col {
          width: 100px;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          background: #fafbfc;
          font-size: 13px;
          position: relative;
        }

        .system-badge {
          display: block;
          font-size: 9px;
          font-weight: normal;
          color: #8b5cf6;
          margin-top: 4px;
        }

        .permission-info {
          width: 300px;
          padding: 12px 16px;
          flex-shrink: 0;
        }

        .permission-name {
          display: block;
          font-size: 13px;
          font-weight: 500;
        }

        .permission-category {
          font-size: 11px;
          color: #9ca3af;
        }

        .role-permission-cell {
          width: 100px;
          padding: 12px 8px;
          text-align: center;
          flex-shrink: 0;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #1d8a8a;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .toggle-switch input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* System Controls */
        .control-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .control-section.critical {
          border-left: 4px solid #ef4444;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .section-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .critical-icon {
          color: #ef4444;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }

        .control-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 16px;
          border: 1px solid #f3f4f6;
        }

        .control-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1d8a8a;
        }

        .control-info {
          flex: 1;
        }

        .control-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .control-info p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        .control-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .control-toggle.enabled {
          background: #d1fae5;
          color: #059669;
        }

        .control-toggle.disabled {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Access Control */
        .ip-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ip-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .ip-item input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .session-settings {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-item label {
          font-size: 13px;
          font-weight: 500;
        }

        .setting-item input {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .emergency-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .emergency-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        .emergency-btn.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .emergency-btn.warning {
          background: #fed7aa;
          color: #c2410c;
        }

        .emergency-btn.info {
          background: #dbeafe;
          color: #2563eb;
        }

        /* Audit Logs */
        .audit-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .audit-filters select, .audit-filters input {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .audit-table {
          overflow-x: auto;
        }

        .audit-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .audit-table th, .audit-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
        }

        .audit-table th {
          background: #f9fafb;
          font-weight: 600;
          font-size: 13px;
        }

        .audit-table td.success {
          color: #059669;
        }

        .audit-table td.failed {
          color: #dc2626;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .btn-primary {
          background: #1d8a8a;
          color: white;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-icon {
          padding: 6px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: #f3f4f6;
        }

        .btn-icon.danger {
          color: #dc2626;
        }

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

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .controls-grid {
            grid-template-columns: 1fr;
          }
          .permissions-tabs {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}