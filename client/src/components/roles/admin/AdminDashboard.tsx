import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import UserAvatar from '../../ui/UserAvatar';
import LanguageSwitcher from '../../../i18n/LanguageSwitcher';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/api';
import { adminDashboardService } from '../../../services/adminService';
import type { AdminDashboardMetrics, SystemAlert } from '../../../types/admin';
import { hasFullAccess } from '../../../types/admin';
import { adminNavigationSections, findAdminRoute, type AdminNavGroup } from './adminMenu';

function isAdminNavGroup(item: AdminNavGroup | null): item is AdminNavGroup {
  return item !== null;
}

// ============================================
// MAIN ADMIN DASHBOARD LAYOUT
// ============================================
export default function AdminDashboard() {
   const { t } = useTranslation('common');
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

  // Check if user has admin access
  useEffect(() => {
    if (user && !hasFullAccess(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchDashboardData = async () => {
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
      }
    };

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

if (loading) {
     return (
       <div className="admin-loading">
         <div className="loader" />
         <p>{t('labels.loadingAdminDashboard')}</p>
       </div>
     );
   }

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside id="admin-sidebar" className="admin-sidebar">
<div className="admin-sidebar-brand">
           {sidebarOpen && (
             <div>
               <h1>{t('labels.schoolHubAdmin')}</h1>
               <p>{t('labels.operationsControl')}</p>
             </div>
           )}
           <button
             className="sidebar-toggle"
             onClick={() => setSidebarOpen(!sidebarOpen)}
             aria-label={t('common.toggle_navigation')}
           >
             {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
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
             placeholder={sidebarOpen ? t('labels.searchMenu') : "..."}
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
              <input type="search" placeholder="Search students, teachers, classes..." />
            </div>
          </div>
          <div className="topbar-right">
            {alerts.length > 0 && (
              <div className="alerts-dropdown">
                <button className="alerts-btn">
                  <span className="alert-icon"><Bell size={19} /></span>
                  <span className="alert-count">{alerts.length}</span>
                </button>
                <div className="alerts-menu">
<div className="alerts-header">
                     <h3>{t('labels.systemAlerts')}</h3>
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
                </div>
              </div>
            )}
<div className="quick-actions">               <LanguageSwitcher variant="button" />               <button className="action-btn" title={t('labels.notificationsLabel')}>
                 <Bell size={19} />
               </button>
               <button className="action-btn" title={t('labels.settingsLabel')}>
                 <Settings size={19} />
               </button>
               <button className="action-btn" title={t('labels.helpLabel')}>
                 <MessageSquare size={19} />
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
                   <span>{user?.firstName || t('labels.adminProfile')} {user?.lastName || t('labels.loadingAdminDashboard')}</span>
                   <small>{user?.role || t('labels.adminProfile')}</small>
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
                       <strong>{user?.firstName || t('labels.adminProfile')} {user?.lastName || t('labels.loadingAdminDashboard')}</strong>
                       <small>{user?.email || 'admin@schoolhub.local'}</small>
                     </div>
                  </div>
<NavLink to="/admin/profile" onClick={() => setProfileMenuOpen(false)}><UserCircle size={17} /> {t('labels.adminProfile')}</NavLink>
                   <NavLink to="/admin/settings" onClick={() => setProfileMenuOpen(false)}><Settings size={17} /> {t('labels.settingsLabel')}</NavLink>
                   <NavLink to="/admin/settings/security" onClick={() => setProfileMenuOpen(false)}><ShieldCheck size={17} /> {t('labels.security')}</NavLink>
                   <NavLink to="/admin/communication/push" onClick={() => setProfileMenuOpen(false)}><Bell size={17} /> {t('labels.notificationsLabel')}</NavLink>
                   <button type="button" onClick={handleLogout}><LogOut size={17} /> {t('labels.logOut')}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="admin-page-heading">
          <div>
            <span className="admin-page-kicker">{t('labels.schoolHubControlCenter')}</span>
            <h1>{pageTitle}</h1>
          </div>
        </section>

        {/* Quick Stats Bar */}
        {metrics && location.pathname === '/admin/dashboard' && (
          <div className="quick-stats-bar">
            <div className="stat-card">
              <span className="stat-icon"><GraduationCap size={24} /></span>
              <div className="stat-info">
                <span className="stat-value">{(metrics.totalStudents ?? 0)}</span>
<span className="stat-label">{t('labels.loadingStudents')}</span>
               </div>
             </div>
             <div className="stat-card">
               <span className="stat-icon"><BookOpen size={24} /></span>
               <div className="stat-info">
                 <span className="stat-value">{(metrics.totalTeachers ?? 0)}</span>
                 <span className="stat-label">{t('labels.loadingTeachers')}</span>
               </div>
             </div>
             <div className="stat-card">
               <span className="stat-icon"><CalendarDays size={24} /></span>
               <div className="stat-info">
                 <span className="stat-value">{(metrics.attendanceRate ?? 0)}%</span>
                 <span className="stat-label">{t('labels.loadingAttendance')}</span>
               </div>
             </div>
             <div className="stat-card">
               <span className="stat-icon"><CreditCard size={24} /></span>
               <div className="stat-info">
                 <span className="stat-value">KES {(metrics.feeCollectionRate ?? 0)}%</span>
                 <span className="stat-label">{t('labels.loadingFeeCollection')}</span>
               </div>
             </div>
             <div className="stat-card">
               <span className="stat-icon"><AlertTriangle size={24} /></span>
               <div className="stat-info">
                 <span className="stat-value">KES {(metrics.pendingFees ?? 0).toLocaleString()}</span>
                 <span className="stat-label">{t('labels.loadingPendingFees')}</span>
               </div>
             </div>
             <div className="stat-card">
               <span className="stat-icon"><Package size={24} /></span>
               <div className="stat-info">
                 <span className="stat-value">{(metrics.inventoryItems ?? 0)}</span>
                 <span className="stat-label">{t('labels.loadingInventoryItems')}</span>
               </div>
             </div>
          </div>
        )}

        {/* System Health Indicator */}
{metrics?.systemHealth && (
           <div className="system-health-bar">
             <span className="health-label">{t('labels.systemHealth')}</span>
             <span className={`health-status health-${metrics.systemHealth.status}`}>
               ● {metrics.systemHealth.status.toUpperCase()}
             </span>
             <span className="health-details">
               DB: <span className={metrics.systemHealth.database.status}>{metrics.systemHealth.database.status}</span> •
               Email: <span className={metrics.systemHealth.email.status}>{metrics.systemHealth.email.status}</span> •
               SMS: <span className={metrics.systemHealth.sms.status}>{metrics.systemHealth.sms.status}</span> •
               MPESA: <span className={metrics.systemHealth.mpesa.status}>{metrics.systemHealth.mpesa.status}</span>
             </span>
           </div>
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
