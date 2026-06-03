import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, Check, CheckCheck, Trash, Settings, AlertCircle, Calendar, 
  MessageSquare, FileText, Users, Award, Clock, X, RefreshCw,
  Filter, Search, Eye, EyeOff, BellRing, BellOff, Volume2,
  VolumeX, Mail, Phone, Smartphone, Globe, Shield, Zap,
  Download, Printer, Star, Archive, MoreVertical, Play, Pause
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import type { TeacherNotification as BaseTeacherNotification } from '../../../types/teacher';
import { downloadFromServiceData } from '../../../utils/fileDownload';

type TeacherNotification = Omit<BaseTeacherNotification, 'type' | 'priority'> & {
  type: 'announcement' | 'message' | 'meeting' | 'exam' | 'attendance' | 'discipline' | 'academic' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isArchived: boolean;
  isStarred: boolean;
  actionLabel?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
};

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  attendance: boolean;
  discipline: boolean;
  academic: boolean;
  meetings: boolean;
  announcements: boolean;
  messages: boolean;
  exam: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string;
  };
}

const notificationIcons: Record<string, any> = {
  announcement: Bell,
  message: MessageSquare,
  meeting: Calendar,
  exam: AlertCircle,
  attendance: Users,
  discipline: Shield,
  academic: Award,
  system: Settings,
  default: Bell,
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
};

const TeacherNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<TeacherNotification | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true,
    inApp: true,
    attendance: true,
    discipline: true,
    academic: true,
    meetings: true,
    announcements: true,
    messages: true,
    exam: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    digest: {
      enabled: false,
      frequency: 'daily',
      time: '08:00',
    },
  });

  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  const confirmation = useConfirmationDialog();

  // Initialize audio
  useEffect(() => {
    notificationSound.current = new Audio('/notification.mp3');
    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, [filter, dateFilter]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        loadNotifications(true);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const token = localStorage.getItem('accessToken');
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/notifications?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        handleNewNotification(data.notification);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5s...');
      setTimeout(connectWebSocket, 5000);
    };
    
    wsRef.current = ws;
  };

  const handleNewNotification = (notification: TeacherNotification) => {
    // Play sound if enabled
    if (soundEnabled && notification.priority === 'urgent') {
      notificationSound.current?.play().catch(console.error);
    }
    
    // Show browser notification if enabled
    if (preferences.push && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
    
    // Add to list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {React.createElement(notificationIcons[notification.type] || notificationIcons.default, {
              className: 'w-5 h-5 text-blue-500',
            })}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await teacherService.notifications.getNotifications({
        unreadOnly: filter === 'unread',
        starredOnly: filter === 'starred',
        archivedOnly: filter === 'archived',
        search: searchTerm || undefined,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
      });
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      if (!silent) toast.error('Failed to load notifications');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await teacherService.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Mark All as Read?',
      message: 'This will mark all unread notifications as read.',
      confirmText: 'Mark All',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const toggleStar = async (id: string, isStarred: boolean) => {
    try {
      await teacherService.notifications.toggleStar(id, !isStarred);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isStarred: !isStarred } : n
      ));
      toast.success(isStarred ? 'Removed from starred' : 'Added to starred');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to update notification');
    }
  };

  const archiveNotification = async (id: string, isArchived: boolean) => {
    try {
      await teacherService.notifications.archiveNotification(id, !isArchived);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(isArchived ? 'Unarchived' : 'Archived');
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error('Failed to archive notification');
    }
  };

  const deleteNotification = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Notification?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.notifications.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Clear All Notifications?',
      message: 'This will permanently delete all notifications. This action cannot be undone.',
      confirmText: 'Clear All',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.notifications.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const savePreferences = async () => {
    try {
      await teacherService.notifications.updatePreferences(preferences);
      toast.success('Preferences saved');
      setShowPreferences(false);
      
      // Request notification permission if push enabled
      if (preferences.push && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const exportNotifications = async (format: 'excel' | 'pdf') => {
    try {
      const response = await teacherService.notifications.exportNotifications({
        format,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
      });
      downloadFromServiceData(
        response.data,
        `notifications_${new Date().toISOString().split('T')[0]}.${format}`
      );
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export notifications');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toLocaleDateString('en-KE');
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, TeacherNotification[]>);

  if (loading && !notifications.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay updated with school announcements and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          >
            <RefreshCw className={clsx('w-4 h-4', autoRefresh && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportNotifications('excel')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
          <Button size="sm" onClick={() => setShowPreferences(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-between">
            <Bell className="w-8 h-8 text-blue-500" />
            <p className="text-2xl font-bold">{notifications.length}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-between">
            <Eye className="w-8 h-8 text-green-500" />
            <p className="text-2xl font-bold">{notifications.filter(n => n.isRead).length}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Read</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-between">
            <Bell className="w-8 h-8 text-yellow-500" />
            <p className="text-2xl font-bold">{unreadCount}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Unread</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-between">
            <Star className="w-8 h-8 text-purple-500" />
            <p className="text-2xl font-bold">{notifications.filter(n => n.isStarred).length}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Starred</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  loadNotifications();
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'unread', 'starred'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg transition',
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)}>
            <Filter className="w-4 h-4 mr-1" />
            Date Filter
          </Button>
          {Object.keys(groupedNotifications).length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              <Trash className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications found</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date}>
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 py-2 px-4 rounded-lg mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{date}</p>
              </div>
              <div className="space-y-2">
                {dateNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      'card transition-all hover:shadow-md cursor-pointer',
                      !notification.isRead && 'border-l-4 border-l-blue-500',
                      notification.isStarred && 'border-r-4 border-r-yellow-500'
                    )}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                      setSelectedNotification(notification);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {React.createElement(notificationIcons[notification.type] || notificationIcons.default, {
                            className: clsx(
                              'w-6 h-6',
                              notification.type === 'announcement' && 'text-purple-500',
                              notification.type === 'message' && 'text-blue-500',
                              notification.type === 'meeting' && 'text-green-500',
                              notification.type === 'exam' && 'text-red-500',
                              notification.type === 'attendance' && 'text-yellow-500',
                              notification.type === 'discipline' && 'text-orange-500',
                              notification.type === 'academic' && 'text-teal-500',
                            ),
                          })}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className={clsx(
                                'font-semibold',
                                !notification.isRead && 'text-gray-900 dark:text-white'
                              )}>
                                {notification.title}
                              </h3>
                              <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[notification.priority])}>
                                {notification.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          
                          {notification.senderName && (
                            <p className="text-xs text-gray-500 mt-1">
                              From: {notification.senderName} ({notification.senderRole})
                            </p>
                          )}
                          
                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                              >
                                Mark as Read
                              </button>
                            )}
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                              >
                                {notification.actionLabel || 'View Details'} →
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleStar(notification.id, notification.isStarred)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title={notification.isStarred ? 'Unstar' : 'Star'}
                          >
                            <Star className={clsx('w-4 h-4', notification.isStarred && 'fill-yellow-500 text-yellow-500')} />
                          </button>
                          <button
                            onClick={() => archiveNotification(notification.id, notification.isArchived)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title={notification.isArchived ? 'Unarchive' : 'Archive'}
                          >
                            <Archive className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Detail Modal */}
      <Modal isOpen={!!selectedNotification} onClose={() => setSelectedNotification(null)} title="Notification Details" size="md">
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {React.createElement(notificationIcons[selectedNotification.type] || notificationIcons.default, {
                  className: 'w-8 h-8 text-blue-500',
                })}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedNotification.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[selectedNotification.priority])}>
                    {selectedNotification.priority}
                  </span>
                  <span className="text-xs text-gray-500">{getRelativeDate(selectedNotification.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>
            
            {selectedNotification.senderName && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium">Sender Information</p>
                <p className="text-sm">Name: {selectedNotification.senderName}</p>
                <p className="text-sm">Role: {selectedNotification.senderRole}</p>
              </div>
            )}
            
            {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Additional Information</p>
                {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                  <p key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 pt-4 border-t">
              {selectedNotification.actionUrl && (
                <a href={selectedNotification.actionUrl} className="flex-1">
                  <Button className="w-full">
                    {selectedNotification.actionLabel || 'View Details'}
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preferences Modal */}
      <Modal isOpen={showPreferences} onClose={() => setShowPreferences(false)} title="Notification Preferences" size="lg">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Channel Preferences */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Channels
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  SMS
                </span>
                <input
                  type="checkbox"
                  checked={preferences.sms}
                  onChange={(e) => setPreferences({ ...preferences, sms: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Push
                </span>
                <input
                  type="checkbox"
                  checked={preferences.push}
                  onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  In-App
                </span>
                <input
                  type="checkbox"
                  checked={preferences.inApp}
                  onChange={(e) => setPreferences({ ...preferences, inApp: e.target.checked })}
                  className="toggle"
                />
              </label>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h4 className="font-semibold mb-3">Notify Me About</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Attendance</span>
                <input
                  type="checkbox"
                  checked={preferences.attendance}
                  onChange={(e) => setPreferences({ ...preferences, attendance: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Discipline</span>
                <input
                  type="checkbox"
                  checked={preferences.discipline}
                  onChange={(e) => setPreferences({ ...preferences, discipline: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Academic</span>
                <input
                  type="checkbox"
                  checked={preferences.academic}
                  onChange={(e) => setPreferences({ ...preferences, academic: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Meetings</span>
                <input
                  type="checkbox"
                  checked={preferences.meetings}
                  onChange={(e) => setPreferences({ ...preferences, meetings: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Announcements</span>
                <input
                  type="checkbox"
                  checked={preferences.announcements}
                  onChange={(e) => setPreferences({ ...preferences, announcements: e.target.checked })}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span>Messages</span>
                <input
                  type="checkbox"
                  checked={preferences.messages}
                  onChange={(e) => setPreferences({ ...preferences, messages: e.target.checked })}
                  className="toggle"
                />
              </label>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Quiet Hours
            </h4>
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center justify-between">
                <span>Enable Quiet Hours</span>
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                  })}
                  className="toggle"
                />
              </label>
              {preferences.quietHours.enabled && (
                <div className="flex gap-4">
                  <div>
                    <label className="text-sm">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, start: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, end: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Digest Settings */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Digest Settings
            </h4>
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center justify-between">
                <span>Send Daily/Weekly Digest</span>
                <input
                  type="checkbox"
                  checked={preferences.digest.enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    digest: { ...preferences.digest, enabled: e.target.checked }
                  })}
                  className="toggle"
                />
              </label>
              {preferences.digest.enabled && (
                <>
                  <div>
                    <label className="text-sm">Frequency</label>
                    <select
                      value={preferences.digest.frequency}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        digest: { ...preferences.digest, frequency: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Time</label>
                    <input
                      type="time"
                      value={preferences.digest.time}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        digest: { ...preferences.digest, time: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowPreferences(false)}>Cancel</Button>
          <Button onClick={savePreferences}>Save Preferences</Button>
        </div>
      </Modal>

      {/* Date Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter by Date" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setDateFilter({ startDate: '', endDate: '' });
              setShowFilterModal(false);
            }}>
              Clear
            </Button>
            <Button onClick={() => setShowFilterModal(false)}>Apply</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherNotificationsPage;