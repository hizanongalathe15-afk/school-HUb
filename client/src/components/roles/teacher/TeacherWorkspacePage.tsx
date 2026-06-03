import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Save, Trash2, Edit, Eye, Search, Filter, Download, 
  Printer, Copy, Share2, Star, Archive, RefreshCw,
  Plus, X, CheckCircle, XCircle, AlertCircle, Clock,
  Calendar, User, Tag, FileText, Image, Paperclip,
  MessageSquare, Bell, Send, Upload, Link as LinkIcon,
  ChevronDown, ChevronUp, MoreVertical, Settings
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface WorkspaceRecord {
  id: string;
  section: string;
  item: string;
  title: string;
  content?: string;
  contentHtml?: string;
  status: 'draft' | 'published' | 'archived' | 'pending';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments: WorkspaceAttachment[];
  metadata: Record<string, any>;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  dueDate?: string;
  assignedTo?: string[];
  sharedWith?: string[];
  isStarred: boolean;
  views: number;
  version: number;
}

interface WorkspaceAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

interface WorkspaceTemplate {
  id: string;
  name: string;
  section: string;
  item: string;
  template: string;
}

interface Comment {
  id: string;
  recordId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800',
};

interface TeacherWorkspacePageProps {
  section: string;
  title: string;
  items: string[];
}

const TeacherWorkspacePage: React.FC<TeacherWorkspacePageProps> = ({ section, title, items }) => {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
  const [selectedItem, setSelectedItem] = useState(items[0] || section);
  const [selectedRecord, setSelectedRecord] = useState<WorkspaceRecord | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [status, setStatus] = useState<WorkspaceRecord['status']>('draft');
  const [priority, setPriority] = useState<WorkspaceRecord['priority']>('medium');
  const [tags, setTags] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [shareWith, setShareWith] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmationDialog();

  const visibleRecords = useMemo(() => {
    let filtered = records.filter(record => record.item === selectedItem);
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(record => record.priority === filterPriority);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [records, selectedItem, searchTerm, filterStatus, filterPriority]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const [recordsRes, templatesRes] = await Promise.all([
        teacherService.workspace.list(section),
        teacherService.workspace.getTemplates(section)
      ]);
      setRecords(recordsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Failed to load records:', error);
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (recordId: string) => {
    try {
      const response = await teacherService.workspace.getComments(recordId);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, [section, selectedItem]);

  const saveRecord = async () => {
    if (!formTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('section', section);
      formData.append('item', selectedItem);
      formData.append('title', formTitle.trim());
      formData.append('content', content);
      formData.append('contentHtml', contentHtml);
      formData.append('status', status);
      formData.append('priority', priority);
      formData.append('tags', tags);
      if (dueDate) formData.append('dueDate', dueDate);
      
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.workspace.create(formData);
      setRecords((current) => [response.data, ...current]);
      resetForm();
      toast.success('Record saved successfully');
    } catch (error) {
      console.error('Failed to save record:', error);
      toast.error('Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const updateRecord = async () => {
    if (!selectedRecord) return;
    
    setSaving(true);
    try {
      const response = await teacherService.workspace.update(selectedRecord.id, {
        title: formTitle,
        content: content,
        contentHtml: contentHtml,
        status,
        priority,
        tags,
        dueDate,
      });
      setRecords(current => current.map(r => 
        r.id === selectedRecord.id ? response.data : r
      ));
      setShowEditModal(false);
      resetForm();
      toast.success('Record updated');
    } catch (error) {
      console.error('Failed to update record:', error);
      toast.error('Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete this record?',
      message: 'This workspace record will be permanently removed.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.workspace.delete(recordId);
      setRecords((current) => current.filter((record) => record.id !== recordId));
      toast.success('Record deleted');
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
    }
  };

  const toggleStar = async (recordId: string, isStarred: boolean) => {
    try {
      await teacherService.workspace.toggleStar(recordId, !isStarred);
      setRecords(current => current.map(r => 
        r.id === recordId ? { ...r, isStarred: !isStarred } : r
      ));
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const publishRecord = async (recordId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Publish Record?',
      message: 'This will make the record visible to others.',
      confirmText: 'Publish',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.workspace.publish(recordId);
      setRecords(current => current.map(r => 
        r.id === recordId ? { ...r, status: 'published', publishedAt: new Date().toISOString() } : r
      ));
      toast.success('Record published');
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish record');
    }
  };

  const archiveRecord = async (recordId: string) => {
    try {
      await teacherService.workspace.archive(recordId);
      setRecords(current => current.map(r => 
        r.id === recordId ? { ...r, status: 'archived' } : r
      ));
      toast.success('Record archived');
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error('Failed to archive record');
    }
  };

  const addComment = async () => {
    if (!selectedRecord || !newComment.trim()) return;
    
    try {
      const response = await teacherService.workspace.addComment(selectedRecord.id, newComment);
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const shareRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      await teacherService.workspace.share(selectedRecord.id, {
        userIds: shareWith,
        message: shareMessage,
      });
      toast.success('Record shared successfully');
      setShowShareModal(false);
      setShareWith([]);
      setShareMessage('');
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share record');
    }
  };

  const exportRecords = async (format: 'excel' | 'pdf') => {
    try {
      const response = await teacherService.workspace.export({
        section,
        item: selectedItem,
        format,
      });
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${section}_${selectedItem}_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export records');
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setContent('');
    setContentHtml('');
    setStatus('draft');
    setPriority('medium');
    setTags('');
    setDueDate('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (record: WorkspaceRecord) => {
    setSelectedRecord(record);
    setFormTitle(record.title);
    setContent(record.content || '');
    setContentHtml(record.contentHtml || '');
    setStatus(record.status);
    setPriority(record.priority);
    setTags(record.tags.join(', '));
    setDueDate(record.dueDate?.split('T')[0] || '');
    setShowEditModal(true);
  };

  const handleView = async (record: WorkspaceRecord) => {
    setSelectedRecord(record);
    await loadComments(record.id);
    setShowViewModal(true);
    
    // Increment view count
    await teacherService.workspace.incrementViews(record.id);
    setRecords(current => current.map(r => 
      r.id === record.id ? { ...r, views: (r.views || 0) + 1 } : r
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const applyTemplate = (template: WorkspaceTemplate) => {
    setFormTitle(template.name);
    setContent(template.template);
    setContentHtml(template.template);
    toast.success(`Template "${template.name}" applied`);
  };

  if (loading && !records.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your {section.toLowerCase()} workspace items
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
          <Button variant="outline" size="sm" onClick={() => exportRecords('excel')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadRecords}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Menu */}
        <aside className="lg:w-64 flex-shrink-0 space-y-1">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedItem(item)}
              className={clsx(
                'w-full text-left px-4 py-2 rounded-lg transition font-medium',
                selectedItem === item
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {item}
              {records.filter(r => r.item === item).length > 0 && (
                <span className={clsx(
                  'ml-2 text-xs px-2 py-0.5 rounded-full',
                  selectedItem === item ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                )}>
                  {records.filter(r => r.item === item).length}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Create Form */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Create New {selectedItem}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder={`Enter ${selectedItem.toLowerCase()} title...`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <ReactQuill
                    theme="snow"
                    value={contentHtml}
                    onChange={setContentHtml}
                    className="bg-white dark:bg-gray-800 rounded-lg"
                    placeholder="Write your content here..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'blockquote', 'code-block'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="e.g., important, review, meeting notes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Attachments</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4 mr-1" />
                    Add Files
                  </Button>
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{file.name}</span>
                          <button onClick={() => removeAttachment(idx)} className="text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Templates */}
                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Use Template</label>
                    <div className="flex flex-wrap gap-2">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveRecord} disabled={saving || !formTitle.trim()}>
                    {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
                    Save {selectedItem}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Records List */}
          {visibleRecords.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No records found for {selectedItem}</p>
              <p className="text-sm text-gray-400 mt-1">Create your first record using the form above</p>
            </Card>
          ) : viewMode === 'list' ? (
            <Card>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {visibleRecords.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleView(record)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{record.title}</h3>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', statusColors[record.status])}>
                            {record.status}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', priorityColors[record.priority])}>
                            {record.priority}
                          </span>
                          {record.isStarred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {record.content?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Updated {formatDate(record.updatedAt)}</span>
                          <span>{record.views || 0} views</span>
                          {record.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {formatDate(record.dueDate)}
                            </span>
                          )}
                        </div>
                        {record.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {record.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => toggleStar(record.id, record.isStarred)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={record.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star className={clsx('w-4 h-4', record.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400')} />
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition cursor-pointer" onClick={() => handleView(record)}>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">{record.title}</h3>
                        <div className="flex gap-1 mt-1">
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', statusColors[record.status])}>
                            {record.status}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', priorityColors[record.priority])}>
                            {record.priority}
                          </span>
                        </div>
                      </div>
                      {record.isStarred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                      {record.content?.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{formatDate(record.updatedAt)}</span>
                      <span>{record.views || 0} views</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* View Record Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedRecord?.title || ''} size="lg">
        {selectedRecord && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', statusColors[selectedRecord.status])}>
                {selectedRecord.status}
              </span>
              <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', priorityColors[selectedRecord.priority])}>
                {selectedRecord.priority}
              </span>
              <span className="text-xs text-gray-500">Created by {selectedRecord.createdByName}</span>
              <span className="text-xs text-gray-500">{formatDate(selectedRecord.createdAt)}</span>
            </div>
            
            {selectedRecord.contentHtml ? (
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedRecord.contentHtml }} />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedRecord.content}</p>
            )}
            
            {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="space-y-1">
                  {selectedRecord.attachments.map(att => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Paperclip className="w-3 h-3" />
                      {att.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {selectedRecord.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex gap-1">
                  {selectedRecord.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Comments Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </h4>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{comment.userName}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 text-sm"
                  rows={2}
                />
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setSelectedRecord(selectedRecord);
                setShareWith([]);
                setShareMessage('');
                setShowShareModal(true);
              }}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              {selectedRecord.status === 'draft' && (
                <Button variant="outline" onClick={() => publishRecord(selectedRecord.id)}>
                  <Send className="w-4 h-4 mr-1" />
                  Publish
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                handleEdit(selectedRecord);
                setShowViewModal(false);
              }}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Record Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Record" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <ReactQuill
              theme="snow"
              value={contentHtml}
              onChange={setContentHtml}
              className="bg-white dark:bg-gray-800 rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={updateRecord} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Record" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Share with (User IDs or emails)</label>
            <input
              type="text"
              placeholder="Enter user IDs or emails, comma separated"
              value={shareWith.join(', ')}
              onChange={(e) => setShareWith(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message (optional)</label>
            <textarea
              rows={3}
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Add a personal note..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowShareModal(false)}>Cancel</Button>
            <Button onClick={shareRecord}>Share</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.confirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherWorkspacePage;