import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Smartphone,
  MessageCircle,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  Trash2,
  Filter,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Star,
  Zap,
  Info,
  Shield
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { Notification, NotificationPreferences, ParentApiResponse } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

type NotificationFilter = 'all' | 'unread' | 'read';
type NotificationCategory = 'all' | 'academic' | 'attendance' | 'fee' | 'event' | 'message' | 'system';

const ParentNotifications: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  const loadNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const [unreadRes, listRes] = await Promise.all([
        parentService.notifications.getUnreadCount(),
        parentService.notifications.getNotifications(false),
      ]);

      if (unreadRes?.success && typeof unreadRes.data === 'number') {
        setUnreadCount(unreadRes.data);
      }

      if (listRes?.success && Array.isArray(listRes.data)) {
        setNotifications(listRes.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const res: ParentApiResponse<NotificationPreferences> = await parentService.profile.getNotificationPreferences();
      if (res?.success && res.data) {
        setPrefs(res.data);
      } else {
        setPrefs(null);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadNotifications(), loadPrefs()]);
    };
    init();
  }, [loadNotifications, loadPrefs]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notifications];
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead && !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead || n.read);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setFilteredNotifications(filtered);
  }, [notifications, filter, categoryFilter]);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await parentService.notifications.markAllAsRead();
      if (res?.success) {
        setSuccess('All notifications marked as read');
        await loadNotifications(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to mark all as read');
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError('Failed to mark all as read');
    }
  }, [loadNotifications]);

  const markOneAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await parentService.notifications.markNotificationAsRead(notificationId);
      if (res?.success) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!confirm('Delete this notification?')) return;
    
    try {
      const res = await parentService.notifications.deleteNotification(notificationId);
      if (res?.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setSuccess('Notification deleted');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification');
    }
  }, []);

  const updatePrefs = useCallback(async () => {
    if (!prefs) return;
    
    try {
      const res = await parentService.profile.updateNotificationPreferences(prefs);
      if (res?.success) {
        setSuccess('Preferences saved successfully');
        await loadPrefs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save preferences');
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError('Failed to save preferences');
    }
  }, [prefs, loadPrefs]);

  const handleRefresh = useCallback(() => {
    loadNotifications(true);
    loadPrefs();
  }, [loadNotifications, loadPrefs]);

  const getNotificationIcon = useCallback((category: string, type: string) => {
    const icons: Record<string, React.ReactNode> = {
      academic: <BookOpen className="w-5 h-5" />,
      attendance: <Calendar className="w-5 h-5" />,
      fee: <DollarSign className="w-5 h-5" />,
      event: <Calendar className="w-5 h-5" />,
      message: <MessageCircle className="w-5 h-5" />,
      system: <Settings className="w-5 h-5" />,
      achievement: <Star className="w-5 h-5" />,
      alert: <AlertCircle className="w-5 h-5" />,
    };
    return icons[category] || icons[type] || <Bell className="w-5 h-5" />;
  }, []);

  const getNotificationColor = useCallback((category: string) => {
    const colors: Record<string, string> = {
      academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      attendance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      fee: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      message: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      achievement: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      alert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[category] || colors.system;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      academic: 'Academic',
      attendance: 'Attendance',
      fee: 'Fees',
      event: 'Event',
      message: 'Message',
      system: 'System',
      achievement: 'Achievement',
      alert: 'Alert',
    };
    return labels[category] || category;
  };

  const notificationStats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead && !n.read).length;
    const read = total - unread;
    const byCategory = notifications.reduce((acc, n) => {
      const cat = n.category || 'system';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, unread, read, byCategory };
  }, [notifications]);

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with important announcements and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPrefs(!showPrefs)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button size="sm" onClick={() => setError(null)} className="ml-auto">Dismiss</Button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{notificationStats.total}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{notificationStats.unread}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{notificationStats.read}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as NotificationFilter)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as NotificationCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="attendance">Attendance</option>
              <option value="fee">Fees</option>
              <option value="event">Events</option>
              <option value="message">Messages</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div className="flex items-end">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {notifications.length === 0 
                ? 'No notifications yet' 
                : 'No notifications match your filters'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isUnread = !notification.isRead && !notification.read;
            
            return (
              <Card
                key={notification.id}
                className={clsx(
                  'transition-all cursor-pointer',
                  isUnread && 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
                  expandedId === notification.id && 'shadow-lg'
                )}
                onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={clsx(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                    getNotificationColor(notification.category || notification.type)
                  )}>
                    {getNotificationIcon(notification.category || notification.type, notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title || 'Notification'}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Bell className="w-3 h-3" />
                              New
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {getCategoryLabel(notification.category || notification.type)}
                          </span>
                        </div>
                        
                        <p className={clsx(
                          'text-gray-600 dark:text-gray-400',
                          expandedId !== notification.id && 'line-clamp-2'
                        )}>
                          {notification.message || notification.body || notification.content}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {isUnread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markOneAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedId === notification.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          {notification.message && notification.message !== (notification.body || notification.content) && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Message:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                            </div>
                          )}
                          
                          {notification.actionUrl && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() => window.open(notification.actionUrl, '_blank')}
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400">
                            ID: {notification.id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {showPrefs && (
        <Card title="Notification Preferences">
          {prefsLoading && !prefs ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !prefs ? (
            <div className="text-center py-8 text-gray-500">
              No preferences available
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Notifications */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={prefs.email}
                    onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                </label>
                
                {/* SMS Notifications */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={prefs.sms}
                    onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">SMS Alerts</p>
                    <p className="text-xs text-gray-500">Get text message alerts</p>
                  </div>
                </label>
                
                {/* Push Notifications */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={prefs.push}
                    onChange={(e) => setPrefs({ ...prefs, push: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Bell className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                    <p className="text-xs text-gray-500">Browser push notifications</p>
                  </div>
                </label>
                
                {/* WhatsApp Notifications */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={prefs.whatsapp}
                    onChange={(e) => setPrefs({ ...prefs, whatsapp: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">WhatsApp</p>
                    <p className="text-xs text-gray-500">Receive WhatsApp messages</p>
                  </div>
                </label>
              </div>
              
              {/* Mute All */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.muted}
                    onChange={(e) => setPrefs({ ...prefs, muted: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  {prefs.muted ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Mute All Notifications</p>
                    <p className="text-xs text-gray-500">Temporarily pause all notifications</p>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={updatePrefs} isLoading={prefsLoading}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Preferences
                </Button>
                <Button variant="outline" onClick={() => setShowPrefs(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Import missing icons
import { BookOpen, DollarSign, Save } from 'lucide-react';

export default ParentNotifications;