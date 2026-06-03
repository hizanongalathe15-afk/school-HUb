import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import storeKeeperService from '../../../services/storeKeeperService';
import { Spinner } from '../../ui/Spinner';

type RoleScope = 'bursar' | 'storekeeper';

interface RoleNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt: string;
}

interface RoleNotificationsPageProps {
  role: RoleScope;
}

async function fetchNotifications(role: RoleScope, unreadOnly = false) {
  if (role === 'bursar') {
    return bursarService.notifications.getNotifications(unreadOnly);
  }
  return storeKeeperService.notifications.getNotifications(unreadOnly);
}

async function markRead(role: RoleScope, id: string) {
  if (role === 'bursar') {
    return bursarService.notifications.markNotificationAsRead(id);
  }
  return storeKeeperService.notifications.markNotificationAsRead(id);
}

async function markAllRead(role: RoleScope) {
  if (role === 'bursar') {
    return bursarService.notifications.markAllAsRead();
  }
  return storeKeeperService.notifications.markAllAsRead();
}

export default function RoleNotificationsPage({ role }: RoleNotificationsPageProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetchNotifications(role, filter === 'unread');
      const rows = Array.isArray(response?.data) ? response.data : [];
      setNotifications(rows);
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(role, id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch {
      toast.error('Unable to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(role);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Unable to mark all notifications as read');
    }
  };

  const visible = notifications.filter((item) => (filter === 'unread' ? !item.isRead : true));

  return (
    <section className="role-page role-notifications-page">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>System alerts and finance or inventory updates.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleMarkAllRead()}>
            <CheckCircle size={16} />
            Mark all read
          </button>
        </div>
      </header>

      <div className="filter-tabs">
        <button
          type="button"
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      {loading ? (
        <div className="state-screen">
          <Spinner showLabel label="Loading notifications..." />
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <BellOff size={28} />
          <h2>No notifications</h2>
          <p>You are all caught up.</p>
        </div>
      ) : (
        <div className="notification-list">
          {visible.map((item) => (
            <article key={item.id} className={`notification-card ${item.isRead ? 'is-read' : ''}`}>
              <div className="notification-card__icon">
                <Bell size={18} />
              </div>
              <div className="notification-card__body">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              {!item.isRead && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => void handleMarkRead(item.id)}>
                  Mark read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
