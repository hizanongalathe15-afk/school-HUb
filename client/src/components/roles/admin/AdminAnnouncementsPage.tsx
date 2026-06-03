// client/src/components/roles/admin/AdminAnnouncementsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  Plus, Search, Trash2, RefreshCcw, X, Upload, 
  Image, Video, FileText, Calendar, Clock, Users,
  Eye, Edit2, Send, Bell, Pin, Globe, Lock,
  CheckCircle, AlertCircle, Play, Download,
  Grid3x3, List, Heart, MessageCircle, Share2,
  Copy, Link, ExternalLink, ImagePlus, VideoIcon,
  File, Music, Archive, Flag, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { communicationService } from '../../../services/adminService';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  targetAudience: 'all' | 'parents' | 'teachers' | 'students' | 'staff';
  mediaUrls: string[];
  mediaTypes: ('image' | 'video' | 'pdf' | 'audio')[];
  scheduledFor?: string;
  publishedAt?: string;
  expiresAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isPublic: boolean;
  tags: string[];
  createdBy: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPreview, setShowPreview] = useState<Announcement | null>(null);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploadedMedia, setUploadedMedia] = useState<{ file: File; preview: string; type: string }[]>([]);
  const dropInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => { 
    setLoading(true); 
    try { 
      const d = await communicationService.getAnnouncements(); 
      setAnnouncements(d || []); 
    } catch { 
      toast.error('Failed to load announcements'); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  useEffect(() => { fetchData(); }, []);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    isPublic: true,
    isPinned: false,
    scheduledFor: '',
    expiresAt: '',
    tags: ''
  });

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.split('/')[0]
    }));
    setUploadedMedia([...uploadedMedia, ...newMedia]);
    if (newMedia.length) setShowModal(true);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(uploadedMedia[index].preview);
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('priority', form.priority);
      formData.append('targetAudience', form.targetAudience);
      formData.append('isPublic', String(form.isPublic));
      formData.append('isPinned', String(form.isPinned));
      formData.append('scheduledFor', form.scheduledFor || '');
      formData.append('expiresAt', form.expiresAt || '');
      formData.append('tags', form.tags);
      
      uploadedMedia.forEach(media => {
        formData.append('media', media.file);
      });
      
      await communicationService.createAnnouncement(formData);
      toast.success('Announcement published successfully!');
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to publish announcement');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      priority: 'normal',
      targetAudience: 'all',
      isPublic: true,
      isPinned: false,
      scheduledFor: '',
      expiresAt: '',
      tags: ''
    });
    setUploadedMedia([]);
  };

  const del = async (id: string) => { 
    if (!confirm('Delete this announcement? This action cannot be undone.')) return; 
    await communicationService.deleteAnnouncement(id); 
    toast.success('Announcement deleted'); 
    fetchData(); 
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    await communicationService.updateAnnouncement(id, { isPinned: !isPinned });
    toast.success(!isPinned ? 'Pinned to top' : 'Unpinned');
    fetchData();
  };

  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const newMedia = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.split('/')[0]
    }));
    setUploadedMedia([...uploadedMedia, ...newMedia]);
    if (newMedia.length) setShowModal(true);
    toast.success(`${imageFiles.length} media file(s) added`);
  };

  const handleBulkImport = async () => {
    for (const f of importFiles) {
      await communicationService.importAnnouncements(f);
    }
    toast.success('Bulk import completed');
    setShowImport(false);
    fetchData();
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch(audience) {
      case 'parents': return <Users size={14} />;
      case 'teachers': return <Users size={14} />;
      case 'students': return <Users size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || a.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);

  return (
    <div className="admin-announcements-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 mt-1">Create rich media announcements with images, videos, and files</p>
        </div>
        <div className="page-actions">
          <button onClick={fetchData} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} />
            Bulk Import
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} />
            New Announcement
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-row">
        <div className="stat-item">
          <Bell size={20} />
          <div>
            <span className="stat-number">{announcements.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-item">
          <Eye size={20} />
          <div>
            <span className="stat-number">{announcements.reduce((sum, a) => sum + (a.viewCount || 0), 0).toLocaleString()}</span>
            <span className="stat-label">Total Views</span>
          </div>
        </div>
        <div className="stat-item">
          <Heart size={20} />
          <div>
            <span className="stat-number">{announcements.reduce((sum, a) => sum + (a.likeCount || 0), 0)}</span>
            <span className="stat-label">Reactions</span>
          </div>
        </div>
        <div className="stat-item">
          <MessageCircle size={20} />
          <div>
            <span className="stat-number">{announcements.reduce((sum, a) => sum + (a.commentCount || 0), 0)}</span>
            <span className="stat-label">Comments</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          <button className={`filter-tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
            All
          </button>
          <button className={`filter-tab ${filterType === 'published' ? 'active' : ''}`} onClick={() => setFilterType('published')}>
            Published
          </button>
          <button className={`filter-tab ${filterType === 'draft' ? 'active' : ''}`} onClick={() => setFilterType('draft')}>
            Drafts
          </button>
          <button className={`filter-tab ${filterType === 'archived' ? 'active' : ''}`} onClick={() => setFilterType('archived')}>
            Archived
          </button>
        </div>

        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <Grid3x3 size={16} />
          </button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={handleDrop} 
        className="drag-drop-area"
        onClick={() => dropInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropInputRef.current?.click();
          }
        }}
      >
        <Upload size={32} />
        <p>Drag & drop images or videos here</p>
        <small>Supports JPG, PNG, GIF, MP4, MOV</small>
        <input
          ref={dropInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Announcements Display */}
      {loading ? (
        <div className="loading-state">
          <div className="loader" />
          <p>Loading announcements...</p>
        </div>
      ) : (
        <>
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div className="pinned-section">
              <div className="section-header">
                <Pin size={18} />
                <h3>Pinned Announcements</h3>
              </div>
              <div className={viewMode === 'grid' ? 'announcements-grid' : 'announcements-list'}>
                {pinnedAnnouncements.map(announcement => renderAnnouncementCard(announcement, viewMode, del, togglePin, setShowPreview))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          {regularAnnouncements.length > 0 && (
            <div className="regular-section">
              <div className="section-header">
                <Bell size={18} />
                <h3>All Announcements</h3>
                <span className="count">{regularAnnouncements.length} items</span>
              </div>
              <div className={viewMode === 'grid' ? 'announcements-grid' : 'announcements-list'}>
                {regularAnnouncements.map(announcement => renderAnnouncementCard(announcement, viewMode, del, togglePin, setShowPreview))}
              </div>
            </div>
          )}

          {filteredAnnouncements.length === 0 && (
            <div className="empty-state">
              <Bell size={48} className="empty-icon" />
              <p>No announcements found</p>
              <button onClick={() => setShowModal(true)} className="btn-primary-sm">
                Create your first announcement
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Announcement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Title */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Enter announcement title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label>Content</label>
                <textarea
                  rows={5}
                  placeholder="Write your announcement content here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Media Upload */}
              <div className="form-group">
                <label>Media (Images & Videos)</label>
                <div className="media-upload-area">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="media-input"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="media-upload-label">
                    <ImagePlus size={24} />
                    <span>Click to upload or drag & drop</span>
                  </label>
                  
                  {uploadedMedia.length > 0 && (
                    <div className="media-preview-grid">
                      {uploadedMedia.map((media, idx) => (
                        <div key={idx} className="media-preview-item">
                          {media.type === 'image' ? (
                            <img src={media.preview} alt={`Preview ${idx}`} />
                          ) : (
                            <video src={media.preview} />
                          )}
                          <button className="remove-media" onClick={() => removeMedia(idx)}>
                            <X size={14} />
                          </button>
                          <span className="media-type-badge">{media.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Row */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-select">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="form-group flex-1">
                  <label>Target Audience</label>
                  <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="form-select">
                    <option value="all">Everyone</option>
                    <option value="parents">Parents Only</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="students">Students Only</option>
                    <option value="staff">Staff Only</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Schedule (Optional)</label>
                  <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} className="form-input" />
                </div>
                
                <div className="form-group flex-1">
                  <label>Expires (Optional)</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="events, exams, holidays"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                  <span>Make this announcement public (visible on website)</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
                  <span>Pin to top</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Publish Announcement</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(null)}>
          <div className="modal-content modal-preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showPreview.title}</h3>
              <button className="modal-close" onClick={() => setShowPreview(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body preview-body">
              {showPreview.mediaUrls && showPreview.mediaUrls.length > 0 && (
                <div className="preview-media">
                  {showPreview.mediaTypes[0] === 'image' ? (
                    <img src={showPreview.mediaUrls[0]} alt={showPreview.title} />
                  ) : (
                    <video src={showPreview.mediaUrls[0]} controls />
                  )}
                </div>
              )}
              <div className="preview-meta">
                <span className={`priority-badge ${getPriorityColor(showPreview.priority)}`}>
                  {showPreview.priority.toUpperCase()}
                </span>
                <span className="date-badge">
                  <Calendar size={12} /> {formatDate(showPreview.publishedAt)}
                </span>
              </div>
              <div className="preview-content">
                {showPreview.content}
              </div>
              <div className="preview-stats">
                <span><Eye size={14} /> {showPreview.viewCount || 0} views</span>
                <span><Heart size={14} /> {showPreview.likeCount || 0} reactions</span>
                <span><MessageCircle size={14} /> {showPreview.commentCount || 0} comments</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => window.open(`/announcements/${showPreview.id}`, '_blank')}>
                <ExternalLink size={16} /> View Public Page
              </button>
              <button className="btn-secondary" onClick={() => setShowPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Import Announcements</h3>
              <button className="modal-close" onClick={() => setShowImport(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-area">
                <FileText size={48} />
                <p>Upload CSV or Excel file with announcements</p>
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files && setImportFiles(Array.from(e.target.files))}
                  className="import-input"
                />
                {importFiles.length > 0 && (
                  <div className="import-list">
                    {importFiles.map((f, i) => (
                      <div key={i} className="import-item">
                        <FileText size={16} />
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBulkImport}>Import</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-announcements-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-actions {
          display: flex;
          gap: 12px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #e5e7eb;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          display: block;
          color: #1f2937;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          flex: 1;
          max-width: 300px;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 40px;
        }

        .filter-tab {
          padding: 6px 16px;
          border-radius: 32px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .filter-tab.active {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 8px;
        }

        .view-btn {
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .view-btn.active {
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .drag-drop-area {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
          background: #f8fafc;
          cursor: pointer;
        }

        .announcements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .announcement-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .announcement-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card-media {
          height: 200px;
          background: #f3f4f6;
          position: relative;
        }

        .card-media img, .card-media video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          background: rgba(0,0,0,0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .card-content {
          padding: 16px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .pin-badge {
          color: #f59e0b;
        }

        .card-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .card-description {
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .action-icon {
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-icon:hover {
          background: #f3f4f6;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .modal-large {
          max-width: 700px;
        }

        .modal-preview {
          max-width: 600px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-textarea {
          resize: vertical;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 {
          flex: 1;
        }

        .media-upload-area {
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 16px;
        }

        .media-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          cursor: pointer;
        }

        .media-input {
          display: none;
        }

        .media-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .media-preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .media-preview-item img, .media-preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-media {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.6);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }

        .media-type-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(0,0,0,0.6);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          color: white;
        }

        .form-checkboxes {
          display: flex;
          gap: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .preview-media {
          margin-bottom: 16px;
          border-radius: 12px;
          overflow: hidden;
        }

        .preview-media img, .preview-media video {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
        }

        .preview-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .preview-content {
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 16px;
        }

        .preview-stats {
          display: flex;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 13px;
          color: #6b7280;
        }

        .preview-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-primary-sm { background: #1d8a8a; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; border: none; cursor: pointer; }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 16px;
        }

        .empty-icon {
          color: #d1d5db;
          margin-bottom: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 60px;
        }

        .loader {
          width: 40px;
          height: 40px;
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

        .pinned-section, .regular-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .count {
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Helper function to render announcement card
function renderAnnouncementCard(
  announcement: Announcement, 
  viewMode: string, 
  del: (id: string) => void, 
  togglePin: (id: string, isPinned: boolean) => void,
  setShowPreview: (announcement: Announcement) => void
) {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (viewMode === 'grid') {
    return (
      <div key={announcement.id} className="announcement-card">
        {announcement.mediaUrls && announcement.mediaUrls[0] && (
          <div className="card-media">
            {announcement.mediaTypes[0] === 'image' ? (
              <img src={announcement.mediaUrls[0]} alt={announcement.title} />
            ) : (
              <>
                <video src={announcement.mediaUrls[0]} />
                <div className="media-play"><Play size={20} /></div>
              </>
            )}
          </div>
        )}
        <div className="card-content">
          <div className="card-header">
            <h4 className="card-title">{announcement.title}</h4>
            {announcement.isPinned && <Pin size={16} className="pin-badge" />}
          </div>
          <div className="card-meta">
            <span className={`priority-badge ${getPriorityColor(announcement.priority)}`}>
              {announcement.priority}
            </span>
            <span><Calendar size={12} /> {new Date(announcement.publishedAt || '').toLocaleDateString()}</span>
          </div>
          <p className="card-description">{announcement.content.substring(0, 100)}...</p>
          <div className="card-stats">
            <span><Eye size={12} /> {announcement.viewCount || 0}</span>
            <span><Heart size={12} /> {announcement.likeCount || 0}</span>
          </div>
          <div className="card-actions">
            <button className="action-icon" onClick={() => setShowPreview(announcement)} title="Preview"><Eye size={16} /></button>
            <button className="action-icon" onClick={() => togglePin(announcement.id, announcement.isPinned)} title={announcement.isPinned ? 'Unpin' : 'Pin'}><Pin size={16} /></button>
            <button className="action-icon" onClick={() => del(announcement.id)} title="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={announcement.id} className="announcement-card" style={{ display: 'flex' }}>
      {announcement.mediaUrls && announcement.mediaUrls[0] && (
        <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
          {announcement.mediaTypes[0] === 'image' ? (
            <img src={announcement.mediaUrls[0]} alt={announcement.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <video src={announcement.mediaUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      )}
      <div className="card-content" style={{ flex: 1 }}>
        <div className="card-header">
          <h4 className="card-title">{announcement.title}</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {announcement.isPinned && <Pin size={16} className="pin-badge" />}
            <button className="action-icon" onClick={() => setShowPreview(announcement)}><Eye size={16} /></button>
            <button className="action-icon" onClick={() => togglePin(announcement.id, announcement.isPinned)}><Pin size={16} /></button>
            <button className="action-icon" onClick={() => del(announcement.id)}><Trash2 size={16} /></button>
          </div>
        </div>
        <div className="card-meta">
          <span className={`priority-badge ${getPriorityColor(announcement.priority)}`}>{announcement.priority}</span>
          <span><Calendar size={12} /> {new Date(announcement.publishedAt || '').toLocaleString()}</span>
        </div>
        <p className="card-description">{announcement.content.substring(0, 150)}...</p>
      </div>
    </div>
  );
}
