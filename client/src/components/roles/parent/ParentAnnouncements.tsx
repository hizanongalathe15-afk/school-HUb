import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Bell, 
  Megaphone, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Paperclip, 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Calendar,
  Flag,
  Star
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { Announcement, ParentChild } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

const ParentAnnouncements: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    try {
      const res = await parentService.children.getMyChildren();
      if (res?.success && res.data) {
        setChildren(res.data);
        if (res.data[0]) setSelectedChildId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentService.communication.getAnnouncements(1, 100);
      if (res?.success && res.data) {
        setAnnouncements(res.data);
      } else {
        setAnnouncements([]);
        setError('No announcements found');
      }
    } catch (err) {
      setError('Failed to load announcements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...announcements];
    
    if (unreadOnly) {
      filtered = filtered.filter(a => !a.isRead);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }
    
    // Sort by date (newest first) and priority
    filtered.sort((a, b) => {
      // Unread first
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then by priority
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (a.priority !== b.priority) {
        return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      }
      // Then by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setFilteredAnnouncements(filtered);
  }, [announcements, unreadOnly, priorityFilter]);

  const markAsRead = useCallback(async (id: string) => {
    setMarkingAsRead(id);
    try {
      await parentService.communication.markAnnouncementAsRead(id);
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, isRead: true } : a)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
      alert('Failed to mark announcement as read. Please try again.');
    } finally {
      setMarkingAsRead(null);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadAnnouncements = announcements.filter(a => !a.isRead);
    for (const announcement of unreadAnnouncements) {
      try {
        await parentService.communication.markAnnouncementAsRead(announcement.id);
        setAnnouncements(prev => 
          prev.map(a => a.id === announcement.id ? { ...a, isRead: true } : a)
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  }, [announcements]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flag className="w-3 h-3" />;
      case 'medium': return <AlertCircle className="w-3 h-3" />;
      case 'low': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  const unreadCount = useMemo(() => 
    announcements.filter(a => !a.isRead).length,
    [announcements]
  );

  useEffect(() => {
    loadChildren();
    loadAnnouncements();
  }, [loadChildren, loadAnnouncements]);

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading announcements..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with school news and important notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} size="sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Child Selector & Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child (Context)
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Unread only</span>
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnnouncements}
              disabled={loading}
              className="ml-2"
            >
              <RefreshCw className={clsx("w-4 h-4 mr-1", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{announcements.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Announcements</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{announcements.length - unreadCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
        </Card>
      </div>

      {/* Announcements List */}
      {error && announcements.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button className="mt-4" onClick={loadAnnouncements}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {unreadOnly || priorityFilter !== 'all' 
                ? 'No announcements match your filters' 
                : 'No announcements available'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className={clsx(
                'transition-all duration-200',
                !announcement.isRead && 'border-l-4 border-l-blue-500',
                expandedId === announcement.id && 'shadow-lg'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(announcement.id)}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {!announcement.isRead && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <Bell className="w-3 h-3" />
                        New
                      </span>
                    )}
                    <span className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      getPriorityColor(announcement.priority)
                    )}>
                      {getPriorityIcon(announcement.priority)}
                      {announcement.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(announcement.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {announcement.title}
                  </h3>
                  
                  <p className={clsx(
                    'text-gray-600 dark:text-gray-400',
                    expandedId !== announcement.id && 'line-clamp-2'
                  )}>
                    {announcement.content}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => toggleExpand(announcement.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={expandedId === announcement.id ? 'Show less' : 'Show more'}
                  >
                    {expandedId === announcement.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === announcement.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                    {announcement.content}
                  </div>

                  {/* Attachments */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Paperclip className="w-4 h-4" />
                        Attachments ({announcement.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Paperclip className="w-3 h-3" />
                            {attachment.name || `Attachment ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!announcement.isRead ? (
                      <Button
                        size="sm"
                        onClick={() => markAsRead(announcement.id)}
                        isLoading={markingAsRead === announcement.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as read
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <Eye className="w-4 h-4 mr-1" />
                        Read
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Footer Stats */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncements;