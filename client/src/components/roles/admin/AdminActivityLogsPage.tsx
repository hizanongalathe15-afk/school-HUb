// client/src/components/roles/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  GraduationCap,
  LogOut,
  Home,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Users,
  Clock,
  FileText,
  HelpCircle,
  Globe,
  Zap,
  Award,
  Target,
  PieChart,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import UserAvatar from '../../ui/UserAvatar';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/api';
import { adminDashboardService } from '../../../services/adminService';
import type { AdminDashboardMetrics, SystemAlert } from '../../../types/admin';
import { hasFullAccess } from '../../../types/admin';
import { adminNavigationSections, findAdminRoute, type AdminNavGroup } from './adminMenu';

function isAdminNavGroup(item: AdminNavGroup | null): item is AdminNavGroup {
  return item !== null;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmation = useConfirmationDialog();
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Administrator';
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user has admin access
  useEffect(() => {
    if (user && !hasFullAccess(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch dashboard metrics
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [metricsData, alertsData] = await Promise.all([
        adminDashboardService.getMetrics(),
        adminDashboardService.getAlerts(),
      ]);
      setMetrics(metricsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Log out?',
      message: 'This will end your admin session and return you to the login page.',
      confirmText: 'Log out',
      type: 'warning',
    });
    if (!confirmed) return;

    try {
      await authService.logout();
    } catch {
      // If the backend logout fails, still clear local auth state.
    }
    logout();
    navigate('/login');
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      await adminDashboardService.acknowledgeAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredNavItems = adminNavigationSections
    .map(category => ({
      ...category,
      items: category.items
        .map(item => {
          const matchingChildren = (item.children ?? []).filter(child =>
            child.name.toLowerCase().includes(normalizedSearch)
          );
          const itemMatches = item.name.toLowerCase().includes(normalizedSearch);
          return itemMatches || matchingChildren.length || !normalizedSearch
            ? { ...item, children: normalizedSearch && !itemMatches ? matchingChildren : item.children }
            : null;
        })
        .filter(isAdminNavGroup),
    }))
    .filter(category => category.items.length > 0);

  const activeNavItem = findAdminRoute(location.pathname);
  const pageTitle = activeNavItem?.title || 'Admin Dashboard';

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          {sidebarOpen && (
            <div className="brand-info">
              <div className="brand-icon">
                <GraduationCap size={28} className="text-teal-600" />
              </div>
              <div>
                <h1>SchoolHub</h1>
                <p>Administrator Portal</p>
              </div>
            </div>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <div className="admin-user-info">
          <UserAvatar
            src={user?.avatar}
            name={userName}
            size="md"
            className="user-avatar"
          />
          {sidebarOpen && (
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role-badge">{user?.role}</span>
            </div>
          )}
        </div>

        <div className="admin-search">
          <Search size={17} />
          <input
            type="text"
            placeholder={sidebarOpen ? "Search menu..." : "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="admin-nav">
          {filteredNavItems.map((category) => (
            <div key={category.category} className="nav-category">
              {sidebarOpen && (
                <div className="nav-category-title">{category.category}</div>
              )}
              <ul className="nav-items">
                {category.items.map((item) => {
                  if (!item) return null;
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children?.length);
                  const childIsActive = item.children?.some(child =>
                    location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
                  );
                  const isParentActive = location.pathname === item.path || Boolean(childIsActive);
                  const isOpen = normalizedSearch || isParentActive;
                  return (
                    <li key={item.path} className={hasChildren && isOpen ? 'nav-group is-open' : 'nav-group'}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin/dashboard'}
                        className={() => `nav-item nav-item-parent ${isParentActive ? 'active' : ''}`}
                        title={!sidebarOpen ? item.name : undefined}
                      >
                        <span className="nav-icon"><Icon size={19} /></span>
                        {sidebarOpen && <span className="nav-text">{item.name}</span>}
                      </NavLink>
                      {sidebarOpen && hasChildren && isOpen && (
                        <ul className="nav-subitems">
                          {item.children?.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                              >
                                {child.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <NavLink className="back-to-site-btn" to="/">
            <span className="logout-icon"><Home size={18} /></span>
            {sidebarOpen && <span>Back to Website</span>}
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon"><LogOut size={18} /></span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <div className="admin-topbar-search">
              <Search size={19} />
              <input type="search" placeholder="Quick search students, teachers, classes..." />
            </div>
            <div className="time-display">
              <Clock size={14} />
              <span>{formatTime()}</span>
              <span className="date-display">{formatDate()}</span>
            </div>
          </div>
          <div className="topbar-right">
            {/* Refresh Button */}
            <button 
              className="action-btn" 
              onClick={fetchDashboardData}
              disabled={refreshing}
            >
              <RefreshCw size={19} className={refreshing ? 'animate-spin' : ''} />
            </button>

            {/* Alerts Dropdown */}
            {alerts.length > 0 && (
              <div className="alerts-dropdown">
                <button 
                  className="alerts-btn"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <span className="alert-icon"><Bell size={19} /></span>
                  <span className="alert-count">{alerts.length}</span>
                </button>
                {notificationsOpen && (
                  <div className="alerts-menu">
                    <div className="alerts-header">
                      <h3>System Alerts</h3>
                      <button onClick={() => setNotificationsOpen(false)}>×</button>
                    </div>
                    <ul className="alerts-list">
                      {alerts.slice(0, 5).map(alert => (
                        <li key={alert.id} className={`alert-item alert-${alert.type}`}>
                          <div className="alert-content">
                            <span className="alert-title">{alert.title}</span>
                            <span className="alert-message">{alert.message}</span>
                          </div>
                          <button
                            className="alert-dismiss"
                            onClick={() => handleAlertAcknowledge(alert.id)}
                          >
                            <Check size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {alerts.length > 5 && (
                      <div className="alerts-footer">
                        <button>View all {alerts.length} alerts</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="quick-actions">
              <button className="action-btn" title="Messages">
                <MessageSquare size={19} />
              </button>
              <button className="action-btn" title="Help">
                <HelpCircle size={19} />
              </button>
            </div>
            
            <div className={`admin-profile-menu-wrap ${profileMenuOpen ? 'is-open' : ''}`}>
              <button className="admin-profile-chip" type="button" onClick={() => setProfileMenuOpen(open => !open)}>
                <UserAvatar
                  src={user?.avatar}
                  name={userName}
                  size="sm"
                  className="admin-profile-avatar"
                />
                <span className="admin-profile-copy">
                  <span>{user?.firstName || 'Admin'} {user?.lastName || 'User'}</span>
                  <small>{user?.role || 'Administrator'}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {profileMenuOpen && (
                <div className="admin-profile-menu">
                  <div className="admin-profile-menu-head">
                    <UserAvatar
                      src={user?.avatar}
                      name={userName}
                      size="md"
                      className="admin-profile-avatar"
                    />
                    <div>
                      <strong>{user?.firstName || 'Admin'} {user?.lastName || 'User'}</strong>
                      <small>{user?.email || 'admin@schoolhub.local'}</small>
                    </div>
                  </div>
                  <NavLink to="/admin/profile" onClick={() => setProfileMenuOpen(false)}>
                    <UserCircle size={17} /> Admin Profile
                  </NavLink>
                  <NavLink to="/admin/settings" onClick={() => setProfileMenuOpen(false)}>
                    <Settings size={17} /> Settings
                  </NavLink>
                  <NavLink to="/admin/settings/security" onClick={() => setProfileMenuOpen(false)}>
                    <ShieldCheck size={17} /> Security
                  </NavLink>
                  <NavLink to="/admin/communication/push" onClick={() => setProfileMenuOpen(false)}>
                    <Bell size={17} /> Notifications
                  </NavLink>
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={17} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="admin-page-heading">
          <div>
            <span className="admin-page-kicker">
              <Sparkles size={14} />
              School Hub Control Center
            </span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="admin-page-actions">
            <button className="btn-outline">
              <FileText size={16} />
              Generate Report
            </button>
            <button className="btn-primary">
              <Bell size={16} />
              Send Announcement
            </button>
          </div>
        </section>

        {/* Quick Stats Bar */}
        {metrics && location.pathname === '/admin/dashboard' && (
          <>
            <div className="quick-stats-bar">
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <GraduationCap size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{(metrics.totalStudents ?? 0).toLocaleString()}</span>
                  <span className="stat-label">Total Students</span>
                  <span className="stat-trend positive">
                    <TrendingUp size={12} /> +8%
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <Users size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{(metrics.totalTeachers ?? 0)}</span>
                  <span className="stat-label">Teachers</span>
                  <span className="stat-trend positive">
                    <TrendingUp size={12} /> +3
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <CalendarDays size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{(metrics.attendanceRate ?? 0)}%</span>
                  <span className="stat-label">Attendance</span>
                  <span className="stat-trend positive">
                    <TrendingUp size={12} /> +2%
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <DollarSign size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{(metrics.feeCollectionRate ?? 0)}%</span>
                  <span className="stat-label">Fee Collection</span>
                  <span className="stat-trend positive">
                    <TrendingUp size={12} /> +5%
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <AlertTriangle size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">KES {(metrics.pendingFees ?? 0).toLocaleString()}</span>
                  <span className="stat-label">Pending Fees</span>
                  <span className="stat-trend negative">
                    <TrendingDown size={12} /> -2%
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <Package size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{(metrics.inventoryItems ?? 0)}</span>
                  <span className="stat-label">Inventory Items</span>
                  <span className="stat-trend neutral">Stable</span>
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="metrics-row">
              <div className="metric-item">
                <BookOpen size={18} />
                <span>Active Subjects: 24</span>
              </div>
              <div className="metric-item">
                <Target size={18} />
                <span>Pass Rate: 78.5%</span>
              </div>
              <div className="metric-item">
                <Award size={18} />
                <span>Merits Given: 128</span>
              </div>
              <div className="metric-item">
                <PieChart size={18} />
                <span>Completion: 92%</span>
              </div>
            </div>

            {/* System Health Indicator */}
            {metrics.systemHealth && (
              <div className="system-health-bar">
                <Zap size={16} />
                <span className="health-label">System Health:</span>
                <span className={`health-status health-${metrics.systemHealth.status}`}>
                  ● {metrics.systemHealth.status.toUpperCase()}
                </span>
                <div className="health-details">
                  <span className={`health-dot ${metrics.systemHealth.database.status}`}></span>
                  <span>Database</span>
                  <span className={`health-dot ${metrics.systemHealth.email.status}`}></span>
                  <span>Email</span>
                  <span className={`health-dot ${metrics.systemHealth.sms.status}`}></span>
                  <span>SMS</span>
                  <span className={`health-dot ${metrics.systemHealth.mpesa.status}`}></span>
                  <span>MPESA</span>
                </div>
              </div>
            )}

            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <h3>Welcome back, {user?.firstName || 'Principal'}!</h3>
                <p>Here's what's happening at your school today. You have {alerts.length} pending alerts to review.</p>
              </div>
              <div className="welcome-actions">
                <button className="btn-primary-sm">
                  <FileText size={16} />
                  View Full Report
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
      
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