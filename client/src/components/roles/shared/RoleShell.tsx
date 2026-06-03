import React, { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  Bell,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  Settings,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../../ui/UserAvatar';
import { authService, api } from '../../../services/api';
import { notificationService, type AppNotification, type NotificationPayload } from '../../../services/notificationService';
import { useAuthStore } from '../../../store/authStore';
import { fileToDataUrl } from '../../../utils/fileToDataUrl';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

export interface RoleNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
  category?: string;
}

interface RoleShellProps {
  roleName: string;
  title: string;
  subtitle?: string;
  navItems: RoleNavItem[];
  children: ReactNode;
  actions?: ReactNode;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  loading?: boolean;
  loadingText?: string;
}

const RoleShell: React.FC<RoleShellProps> = ({
  roleName,
  title,
  subtitle,
  navItems,
  children,
  actions,
  notificationCount = 0,
  onNotificationsClick,
  loading,
  loadingText = 'Loading dashboard...',
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topbarSearch, setTopbarSearch] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const confirmation = useConfirmationDialog();
  const { t } = useTranslation('common');
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || roleName;
  const initials = `${user?.firstName?.[0] || roleName[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();
  const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '');
  const roleBasePath = normalizedRole === 'storekeeper' ? '/dashboard/store' : `/dashboard/${normalizedRole}`;
  const profilePath = normalizedRole === 'storekeeper' ? `${roleBasePath}/settings` : `${roleBasePath}/profile`;
  const messagesPath = `${roleBasePath}/messages`;
  const notificationsPath = `${roleBasePath}/notifications`;

  const applyNotificationPayload = (payload: NotificationPayload) => {
    const nextNotifications = payload.notifications || [];
    setNotifications(nextNotifications);
    setUnreadCount(payload.unreadCount || 0);
    setSelectedNotifications((ids) => ids.filter((id) => nextNotifications.some((notification) => notification.id === id)));
  };

  const groupedItems = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();
    const filtered = loweredQuery
      ? navItems.filter((item) => item.label.toLowerCase().includes(loweredQuery))
      : navItems;

    return filtered.reduce<Record<string, RoleNavItem[]>>((groups, item) => {
      const category = item.category || 'Navigation';
      groups[category] = groups[category] || [];
      groups[category].push(item);
      return groups;
    }, {});
  }, [navItems, searchQuery]);

  const activeItem = navItems
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));

  useEffect(() => {
    let cancelled = false;
    notificationService.list()
      .then((payload) => {
        if (!cancelled) applyNotificationPayload(payload);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const baseURL = String(api.defaults.baseURL || '').replace(/\/$/, '');
    const stream = new EventSource(`${baseURL}/notifications/stream?token=${encodeURIComponent(token)}`);
    stream.addEventListener('notifications', (event) => {
      try {
        applyNotificationPayload(JSON.parse((event as MessageEvent).data));
      } catch {
        // Keep current state if the stream emits malformed data.
      }
    });
    stream.onerror = () => stream.close();

    return () => stream.close();
  }, [token]);

  useEffect(() => {
    const closeFloatingMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) setAccountOpen(false);
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) setNotificationOpen(false);
    };

    document.addEventListener('mousedown', closeFloatingMenus);
    return () => document.removeEventListener('mousedown', closeFloatingMenus);
  }, []);

  const toggleNotification = (id: string) => {
    setSelectedNotifications((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectedOrAll = selectedNotifications.length ? selectedNotifications : notifications.map((notification) => notification.id);

  const updateNotifications = async (action: 'read' | 'read-all' | 'archive' | 'delete') => {
    if (action === 'read-all') {
      const confirmed = await confirmation.confirm({
        title: 'Mark all notifications as read?',
        message: 'This clears the unread state for every notification in this account.',
        confirmText: 'Mark all read',
        type: 'default',
      });
      if (!confirmed) return;
      applyNotificationPayload(await notificationService.markAllRead());
      return;
    }

    const ids = selectedOrAll;
    if (!ids.length) return;

    if (action === 'archive' || action === 'delete') {
      const confirmed = await confirmation.confirm({
        title: action === 'delete' ? 'Delete notifications?' : 'Archive notifications?',
        message: `${ids.length} notification${ids.length === 1 ? '' : 's'} will be ${action === 'delete' ? 'permanently deleted' : 'archived'}.`,
        confirmText: action === 'delete' ? 'Delete' : 'Archive',
        type: action === 'delete' ? 'danger' : 'warning',
      });
      if (!confirmed) return;
    }

    const payload = action === 'read'
      ? await notificationService.markRead(ids)
      : action === 'archive'
        ? await notificationService.archive(ids)
        : await notificationService.delete(ids);
    applyNotificationPayload(payload);
  };

  const confirmLogout = async () => {
    const confirmed = await confirmation.confirm({
      title: t('confirmDialog.logout.title'),
      message: t('confirmDialog.logout.message'),
      confirmText: t('confirmDialog.logout.confirm'),
      cancelText: t('confirmDialog.logout.cancel'),
      type: 'warning',
    });
    if (!confirmed) return;

    try {
      await authService.logout();
    } catch {
      // If server logout fails, still clear local auth state to avoid stale session.
    }
    logout();
  };

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      applyNotificationPayload(await notificationService.markRead([notification.id]));
    }
    setNotificationOpen(false);

    const lowerCopy = `${notification.type || ''} ${notification.title} ${notification.message}`.toLowerCase();
    const destination = notification.link || (lowerCopy.includes('message') ? messagesPath : notificationsPath);
    navigate(destination);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const avatar = await fileToDataUrl(file);
      const updated = await authService.updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar,
      });
      updateUser(updated);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submitTopbarSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = topbarSearch.trim();
    if (!query) return;
    navigate(`${roleBasePath}/search?q=${encodeURIComponent(query)}`);
  };

  if (loading) {
    return (
      <div className="role-loading-screen">
        <div className="role-loader" />
        <p>{loadingText}</p>
      </div>
    );
  }

  return (
    <div className={`role-shell role-${normalizedRole} ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <button className="role-mobile-trigger" type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <aside className="role-sidebar">
        <div className="role-sidebar-controls" aria-label="Sidebar controls">
          <button className="role-icon-button desktop-only" type="button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
          <button className="role-icon-button mobile-only" type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="role-user-card">
          <UserAvatar
            src={user?.avatar}
            name={userName}
            size="md"
            className="role-avatar"
          />
          {!collapsed && (
            <div className="role-user-copy">
              <span>{userName}</span>
              <small>{roleName}</small>
            </div>
          )}
        </div>

        {!collapsed && (
          <label className="role-search">
            <Search size={16} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search menu"
              type="search"
            />
          </label>
        )}

        <nav className="role-nav" aria-label={`${roleName} navigation`}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div className="role-nav-group" key={category}>
              {!collapsed && <p>{category}</p>}
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={`role-nav-link ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={19} />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge ? <em>{item.badge}</em> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="role-sidebar-footer">
          <button className="role-logout" type="button" onClick={() => void confirmLogout()} title="Logout">
            <LogOut size={18} />
            {!collapsed && <span>{t('confirmDialog.logout.button')}</span>}
          </button>
        </div>
      </aside>

      <main className="role-main">
        <header className="role-topbar">
          <form className="role-topbar-search" onSubmit={submitTopbarSearch}>
            <Search size={19} />
            <input
              type="search"
              value={topbarSearch}
              onChange={(event) => setTopbarSearch(event.target.value)}
              placeholder="Search students, classes, payments..."
            />
          </form>
          <div className="role-topbar-actions">
            {actions}
            <div className="role-menu-wrap" ref={notificationMenuRef}>
              <button
                className="role-icon-button role-notification"
                type="button"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  onNotificationsClick?.();
                }}
                aria-label="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              {notificationOpen && (
                <div className="role-notification-panel">
                  <div className="role-panel-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>{unreadCount} unread</span>
                    </div>
                    <button type="button" className="role-panel-close" onClick={() => setNotificationOpen(false)} aria-label="Close notifications">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="role-panel-actions">
                    <button type="button" onClick={() => setSelectedNotifications(notifications.map((notification) => notification.id))}>Select all</button>
                    <button type="button" onClick={() => updateNotifications('read-all')}><CheckCheck size={15} /> Mark all read</button>
                    <button type="button" disabled={!selectedOrAll.length} onClick={() => updateNotifications('archive')}><Archive size={15} /> Archive</button>
                    <button type="button" className="danger" disabled={!selectedOrAll.length} onClick={() => updateNotifications('delete')}><Trash2 size={15} /> Delete</button>
                  </div>
                  <div className="role-notification-list">
                    {notifications.length === 0 ? (
                      <div className="role-empty-state">No notifications yet.</div>
                    ) : notifications.map((notification) => (
                      <article className={`role-notification-item ${notification.isRead ? '' : 'unread'}`} key={notification.id}>
                        <label className="role-check">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleNotification(notification.id)}
                          />
                          <span />
                        </label>
                        <button type="button" onClick={() => openNotification(notification)}>
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                          <small>{new Date(notification.createdAt).toLocaleString()}</small>
                        </button>
                        {notification.link && <ExternalLink size={15} />}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="role-menu-wrap" ref={accountMenuRef}>
              <button className="role-topbar-user" type="button" onClick={() => setAccountOpen((open) => !open)}>
                <UserAvatar
                  src={user?.avatar}
                  name={userName}
                  size="sm"
                  className="role-avatar small"
                />
                <span>
                  <strong>{user?.firstName || roleName}</strong>
                  <small>{roleName}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {accountOpen && (
                <div className="role-account-menu">
                  <div className="role-account-card">
                    <label className={`role-avatar-upload ${uploadingAvatar ? 'is-loading' : ''}`}>
                      <UserAvatar
                        src={user?.avatar}
                        name={userName}
                        size="lg"
                        className="role-avatar large"
                      />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                    </label>
                    <div>
                      <strong>{userName}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate(profilePath); }}><User size={16} /> Profile settings</button>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate(notificationsPath); }}><Bell size={16} /> Notification settings</button>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate(messagesPath); }}><ExternalLink size={16} /> Messages</button>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate(`${profilePath}?section=account`); }}><Settings size={16} /> Account preferences</button>
                  <button type="button" className="danger" onClick={() => void confirmLogout()}><LogOut size={16} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <section className="role-page-heading">
          <div>
            <span>{roleName} Control Center</span>
            <h1>{activeItem?.label || title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="role-page-status">
            <i />
            Live workspace
          </div>
        </section>
        <div className="role-content">{children}</div>
      </main>
      <button className="role-backdrop" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
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
};

export default RoleShell;
