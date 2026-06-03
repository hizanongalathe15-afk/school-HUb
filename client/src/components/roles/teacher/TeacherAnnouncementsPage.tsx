// client/src/components/roles/teacher/TeacherAnnouncementsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Pin, Clock, Users, AlertCircle, Send,
  Paperclip, Image, File, Link2, Calendar, Bell, Eye, 
  CheckCircle, XCircle, Filter, Search, RefreshCw, Download,
  Megaphone, Target, School, BookOpen, ChevronDown, ChevronUp,
  MoreVertical, Copy, Share2, Printer, Star, Flag, Volume2
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import type { ClassAnnouncement, TeacherClass } from '../../../types/teacher';
import EditableSelect from '../../ui/EditableSelect';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface AnnouncementFormData {
  classId: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'students' | 'parents' | 'staff';
  expiresAt: string;
  attachments: File[];
  sendNotification: boolean;
  notificationMethod: ('sms' | 'email' | 'push')[];
  scheduleForLater: boolean;
  scheduledDate: string;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <Flag className="w-3 h-3" /> },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Bell className="w-3 h-3" /> },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertCircle className="w-3 h-3" /> },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <Volume2 className="w-3 h-3" /> },
};

const targetAudienceConfig = {
  all: { label: 'All (Students & Parents)', icon: <Users className="w-4 h-4" /> },
  students: { label: 'Students Only', icon: <School className="w-4 h-4" /> },
  parents: { label: 'Parents Only', icon: <Users className="w-4 h-4" /> },
  staff: { label: 'Staff Only', icon: <Users className="w-4 h-4" /> },
};

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<ClassAnnouncement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ClassAnnouncement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const confirmation = useConfirmationDialog();
  
  const [formData, setFormData] = useState<AnnouncementFormData>({
    classId: '',
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    expiresAt: '',
    attachments: [],
    sendNotification: true,
    notificationMethod: ['push'],
    scheduleForLater: false,
    scheduledDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annRes, classesRes] = await Promise.all([
        teacherService.announcements.getAnnouncements(),
        teacherService.classes.getMyClasses(),
      ]);
      if (annRes.success && annRes.data) setAnnouncements(annRes.data);
      if (classesRes.success && classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ann.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !classFilter || ann.classId === classFilter;
      const matchesPriority = !priorityFilter || ann.priority === priorityFilter;
      return matchesSearch && matchesClass && matchesPriority;
    });
  }, [announcements, searchTerm, classFilter, priorityFilter]);

  const statistics = useMemo(() => {
    const total = announcements.length;
    const pinned = announcements.filter(a => a.isPinned).length;
    const urgent = announcements.filter(a => a.priority === 'urgent').length;
    const recent = announcements.filter(a => {
      const daysOld = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld <= 7;
    }).length;
    return { total, pinned, urgent, recent };
  }, [announcements]);

  const handleCreate = async () => {
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }

    setSubmitting(true);
    try {
      const response = await teacherService.announcements.createAnnouncement({
        classId: formData.classId,
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: formData.expiresAt || undefined,
      });
      
      if (response.success) {
        toast.success(formData.scheduleForLater ? 'Announcement scheduled!' : 'Announcement published!');
        setShowForm(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to create:', error);
      toast.error('Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement) return;
    
    setSubmitting(true);
    try {
      const response = await teacherService.announcements.updateAnnouncement(editingAnnouncement.id, {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: formData.expiresAt || undefined,
      });
      
      if (response.success) {
        toast.success('Announcement updated!');
        setShowForm(false);
        setEditingAnnouncement(null);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete announcement?',
      message: 'This announcement will be permanently removed.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.announcements.deleteAnnouncement(id);
      toast.success('Announcement deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      await teacherService.announcements.updateAnnouncement(id, {
        isPinned: !isPinned,
      });
      toast.success(isPinned ? 'Unpinned' : 'Pinned to top');
      loadData();
    } catch (error) {
      console.error('Failed to pin:', error);
      toast.error('Failed to update pin status');
    }
  };

  const handleDuplicate = async (announcement: ClassAnnouncement) => {
    try {
      const newAnnouncement = {
        classId: announcement.classId,
        title: announcement.title + ' (Copy)',
        content: announcement.content,
        priority: announcement.priority,
        expiresAt: announcement.expiresAt || undefined,
      };
      await teacherService.announcements.createAnnouncement(newAnnouncement);
      toast.success('Announcement duplicated');
      loadData();
    } catch (error) {
      console.error('Failed to duplicate:', error);
      toast.error('Failed to duplicate announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      title: '',
      content: '',
      priority: 'normal',
      targetAudience: 'all',
      expiresAt: '',
      attachments: [],
      sendNotification: true,
      notificationMethod: ['push'],
      scheduleForLater: false,
      scheduledDate: '',
    });
    setAttachments([]);
  };

  const openEditForm = (announcement: ClassAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      classId: announcement.classId,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: 'all',
      expiresAt: announcement.expiresAt || '',
      attachments: [],
      sendNotification: false,
      notificationMethod: ['push'],
      scheduleForLater: false,
      scheduledDate: '',
    });
    setShowForm(true);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading announcements..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage announcements for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Grid View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => {
            setEditingAnnouncement(null);
            resetForm();
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-1" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">Total Announcements</p>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{statistics.pinned}</p>
          <p className="text-xs text-gray-500">Pinned</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.urgent}</p>
          <p className="text-xs text-gray-500">Urgent</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{statistics.recent}</p>
          <p className="text-xs text-gray-500">Last 7 Days</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.stream}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setClassFilter('');
            setPriorityFilter('');
          }}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Card className="text-center py-12">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No announcements found</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Your First Announcement
          </Button>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
            
            return (
              <Card 
                key={announcement.id} 
                className={clsx(
                  'hover:shadow-md transition',
                  announcement.isPinned && 'border-l-4 border-l-yellow-500',
                  isExpired && 'opacity-60'
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {announcement.isPinned && (
                          <Pin size={14} className="text-yellow-500" />
                        )}
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                          {priority.icon}
                          {priority.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(announcement.createdAt)}
                        </span>
                        {isExpired && (
                          <span className="text-xs text-red-500">Expired</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {announcement.className}
                        </span>
                         {announcement.targetAudience && (
                           <span className="flex items-center gap-1">
                             <Target size={14} />
                             {typeof announcement.targetAudience === 'string' 
                               ? targetAudienceConfig[announcement.targetAudience as keyof typeof targetAudienceConfig]?.label || announcement.targetAudience
                               : Array.isArray(announcement.targetAudience) && announcement.targetAudience.length > 0
                                 ? targetAudienceConfig[announcement.targetAudience[0] as keyof typeof targetAudienceConfig]?.label || announcement.targetAudience[0]
                                 : 'All'}
                           </span>
                         )}
                        {announcement.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Expires: {formatDate(announcement.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handlePin(announcement.id, announcement.isPinned)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title={announcement.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={16} className={announcement.isPinned ? 'text-yellow-500' : 'text-gray-400'} />
                      </button>
                      <button
                        onClick={() => openEditForm(announcement)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(announcement)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Duplicate"
                      >
                        <Copy size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            
            return (
              <Card key={announcement.id} className="hover:shadow-lg transition">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                      {priority.icon}
                      {priority.label}
                    </span>
                    {announcement.isPinned && <Pin size={14} className="text-yellow-500" />}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {announcement.content}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(announcement.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setShowDetailModal(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditForm(announcement)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit size={14} className="text-blue-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Announcement Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAnnouncement(null);
          resetForm();
        }}
        title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Class *</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              disabled={!!editingAnnouncement}
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - {cls.stream}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Announcement title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Write your announcement here..."
            />
          </div>

          {/* Priority and Target Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="all">All (Students & Parents)</option>
                <option value="students">Students Only</option>
                <option value="parents">Parents Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileAttach}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Paperclip className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500">Click to attach files</span>
                <span className="text-xs text-gray-400">PDF, Images, Documents up to 10MB</span>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button onClick={() => removeAttachment(idx)} className="text-red-500">
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
              />
              <span className="text-sm font-medium">Send Push Notification</span>
            </label>
            
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.notificationMethod.includes('sms')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.notificationMethod, 'sms' as const]
                      : formData.notificationMethod.filter(m => m !== 'sms');
                    setFormData({ ...formData, notificationMethod: methods as ('sms' | 'email' | 'push')[] });
                  }}
                />
                <span className="text-sm">SMS</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.notificationMethod.includes('email')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.notificationMethod, 'email' as const]
                      : formData.notificationMethod.filter(m => m !== 'email');
                    setFormData({ ...formData, notificationMethod: methods as ('sms' | 'email' | 'push')[] });
                  }}
                />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.notificationMethod.includes('push')}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...formData.notificationMethod, 'push' as const]
                      : formData.notificationMethod.filter(m => m !== 'push');
                    setFormData({ ...formData, notificationMethod: methods as ('sms' | 'email' | 'push')[] });
                  }}
                />
                <span className="text-sm">Push</span>
              </label>
            </div>
          </div>

          {/* Schedule for Later */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.scheduleForLater}
                onChange={(e) => setFormData({ ...formData, scheduleForLater: e.target.checked })}
              />
              <span className="text-sm font-medium">Schedule for Later</span>
            </label>
            
            {formData.scheduleForLater && (
              <div className="mt-2 ml-6">
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => {
            setShowForm(false);
            setEditingAnnouncement(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={editingAnnouncement ? handleUpdate : handleCreate} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : (editingAnnouncement ? 'Update' : 'Publish')}
          </Button>
        </div>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Announcement Details"
        size="lg"
      >
        {selectedAnnouncement && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', 
                priorityConfig[selectedAnnouncement.priority as keyof typeof priorityConfig]?.color
              )}>
                {priorityConfig[selectedAnnouncement.priority as keyof typeof priorityConfig]?.icon}
                {selectedAnnouncement.priority}
              </span>
              {selectedAnnouncement.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Pin size={12} /> Pinned
                </span>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedAnnouncement.title}
            </h2>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {selectedAnnouncement.className}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Posted: {formatDate(selectedAnnouncement.createdAt)}
              </span>
              {selectedAnnouncement.expiresAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Expires: {formatDate(selectedAnnouncement.expiresAt)}
                </span>
              )}
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
            </div>
            
            {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedAnnouncement.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <File size={16} />
                      <span className="text-sm">{att}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setSelectedAnnouncement(null);
                setShowDetailModal(false);
              }}>
                Close
              </Button>
              <Button onClick={() => {
                openEditForm(selectedAnnouncement);
                setShowDetailModal(false);
              }}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

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