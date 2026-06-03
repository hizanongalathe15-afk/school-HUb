import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clipboard, Edit3, File, FolderOpen, Paperclip, Trash2, Upload } from 'lucide-react';
import { landingMediaService, schoolService } from '../../../services/api';
import toast from 'react-hot-toast';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  size: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface DropZoneProps {
  onDrop: (files: FileList) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, isDragging, setIsDragging }) => {
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [setIsDragging]);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  }, [onDrop, setIsDragging]);

  useEffect(() => {
    const div = dropRef.current;
    if (div) {
      div.addEventListener('dragenter', handleDragIn);
      div.addEventListener('dragleave', handleDragOut);
      div.addEventListener('dragover', handleDrag);
      div.addEventListener('drop', handleDrop);
    }
    return () => {
      if (div) {
        div.removeEventListener('dragenter', handleDragIn);
        div.removeEventListener('dragleave', handleDragOut);
        div.removeEventListener('dragover', handleDrag);
        div.removeEventListener('drop', handleDrop);
      }
    };
  }, [handleDrag, handleDragIn, handleDragOut, handleDrop]);

  return (
    <div
      ref={dropRef}
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drop-zone-content">
        <span className="drop-zone-icon"><FolderOpen size={48} /></span>
        <p>Drag & drop files here</p>
        <p className="drop-zone-hint">or click to browse</p>
        <p className="drop-zone-types">Supports: Images, Videos, PDFs, Documents</p>
      </div>
      <input
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
        onChange={(e) => e.target.files && onDrop(e.target.files)}
        className="drop-zone-input"
      />
    </div>
  );
};

export default function MediaManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const categories = ['all', 'banners', 'gallery', 'logos', 'documents', 'promotions', 'ads'];

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await landingMediaService.getAll();
      setMediaItems(response || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (files: FileList) => {
    try {
      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('category', activeCategory === 'all' ? 'gallery' : activeCategory);

        const response = await landingMediaService.create(formData);
        return response;
      });

      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded successfully`);
      fetchMedia();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      await landingMediaService.delete(id);
      toast.success('Media deleted');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  const handleUpdate = async (data: Partial<MediaItem>) => {
    if (!editingItem) return;
    try {
      await landingMediaService.update(editingItem.id, data);
      toast.success('Media updated');
      setEditingItem(null);
      fetchMedia();
    } catch (error) {
      toast.error('Failed to update media');
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    try {
      await landingMediaService.reorder(orderedIds);
      toast.success('Order updated');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const getMediaType = (file: File): MediaItem['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf' || file.name.match(/\.(doc|docx|xls|xlsx)$/)) return 'document';
    return 'other';
  };

  const renderMediaPreview = (item: MediaItem) => {
    switch (item.type) {
      case 'image':
        return <img src={item.thumbnailUrl || item.url} alt={item.title} className="media-preview" />;
      case 'video':
        return (
          <div className="media-preview video">
            <video src={item.url} />
            <span className="play-icon">▶</span>
          </div>
        );
      case 'document':
        return (
          <div className="media-preview document">
            <span className="doc-icon"><File size={30} /></span>
            <span className="doc-type">{item.url.split('.').pop()?.toUpperCase()}</span>
          </div>
        );
      default:
        return <div className="media-preview other"><span><Paperclip size={28} /></span></div>;
    }
  };

  return (
    <div className="media-manager">
      <div className="media-header">
        <div className="media-header-left">
          <h2>Media Manager</h2>
          <p>Upload, organize, and manage all media files</p>
        </div>
        <div className="media-header-right">
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> Upload Media
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Media</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <DropZone onDrop={handleDrop} isDragging={isDragging} setIsDragging={setIsDragging} />
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" />
                  </div>
                  <p>Uploading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Media</h3>
              <button className="modal-close" onClick={() => setEditingItem(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={editingItem.tags.join(', ')}
                  onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(',').map(t => t.trim()) })}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => handleUpdate(editingItem)}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="media-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="filter-group categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loader" />
          <p>Loading media...</p>
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map(item => (
            <div
              key={item.id}
              className={`media-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
              onClick={() => setSelectedItems(prev =>
                prev.includes(item.id)
                  ? prev.filter(id => id !== item.id)
                  : [...prev, item.id]
              )}
              onDoubleClick={() => setEditingItem(item)}
            >
              <div className="media-card-preview">
                {renderMediaPreview(item)}
                <div className="media-card-overlay">
                  <button className="overlay-btn" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} aria-label="Edit media"><Edit3 size={16} /></button>
                  <button className="overlay-btn" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url); toast.success('URL copied'); }} aria-label="Copy media URL"><Clipboard size={16} /></button>
                  <button className="overlay-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} aria-label="Delete media"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="media-card-info">
                <h4>{item.title}</h4>
                <span className="media-category">{item.category}</span>
                <span className="media-date">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Actions */}
      {selectedItems.length > 0 && (
        <div className="selected-actions">
          <span>{selectedItems.length} item(s) selected</span>
          <button className="btn btn-danger" onClick={() => selectedItems.forEach(id => handleDelete(id))}>
            Delete Selected
          </button>
        </div>
      )}

      <style>{`
        .media-manager { padding: 1.5rem; }
        .media-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .media-header h2 { margin: 0; }
        .media-header p { color: #666; margin: 0.25rem 0 0; }
        
        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          background: #fafafa;
        }
        .drop-zone.dragging { border-color: #667eea; background: #f0f4ff; }
        .drop-zone:hover { border-color: #667eea; }
        .drop-zone-content { pointer-events: none; }
        .drop-zone-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .drop-zone-hint { color: #999; font-size: 0.875rem; }
        .drop-zone-types { color: #666; font-size: 0.75rem; margin-top: 0.5rem; }
        .drop-zone-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        
        .media-filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
        .filter-group { display: flex; gap: 0.5rem; }
        .search-input { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 8px; min-width: 200px; }
        .category-btn { padding: 0.375rem 0.75rem; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; transition: all 0.2s; }
        .category-btn.active { background: #667eea; color: white; border-color: #667eea; }
        
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .media-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s; }
        .media-card:hover { transform: translateY(-4px); }
        .media-card.selected { box-shadow: 0 0 0 3px #667eea; }
        .media-card-preview { position: relative; aspect-ratio: 1; background: #f5f5f5; }
        .media-preview { width: 100%; height: 100%; object-fit: cover; }
        .media-preview.video { display: flex; align-items: center; justify-content: center; }
        .media-preview.document { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .doc-icon { font-size: 2rem; }
        .doc-type { font-size: 0.75rem; color: #666; }
        .play-icon { position: absolute; font-size: 2rem; color: white; }
        .media-card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; }
        .media-card:hover .media-card-overlay { opacity: 1; }
        .overlay-btn { padding: 0.5rem; background: white; border: none; border-radius: 50%; cursor: pointer; font-size: 1rem; }
        .overlay-btn.danger { background: #ef4444; color: white; }
        .media-card-info { padding: 0.75rem; }
        .media-card-info h4 { margin: 0 0 0.25rem; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .media-category { font-size: 0.75rem; color: #667eea; }
        .media-date { font-size: 0.75rem; color: #999; display: block; }
        
        .selected-actions { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 0.75rem 1.5rem; border-radius: 50px; display: flex; gap: 1rem; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #eee; }
        .modal-header h3 { margin: 0; }
        .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .modal-body { padding: 1.5rem; }
        .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem; }
        
        .upload-progress { margin-top: 1rem; text-align: center; }
        .progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #667eea; width: 60%; animation: progress 1s ease-in-out infinite; }
        @keyframes progress { 0% { width: 0; } 50% { width: 60%; } 100% { width: 100%; } }
        
        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; }
        .loader { width: 40px; height: 40px; border: 3px solid #eee; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
      `}</style>
    </div>
  );
}
