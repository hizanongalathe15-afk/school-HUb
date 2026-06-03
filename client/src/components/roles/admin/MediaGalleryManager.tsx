import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Download,
  Edit3,
  Trash2,
  Upload,
  Search,
  Grid3x3,
  List,
  Plus,
  RefreshCw,
  Check,
  X,
  Image,
  FileText,
  Video,
  Eye,
  Copy,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { mediaManagementService } from '../../../services/adminService';
import toast from 'react-hot-toast';
import type { MediaItem } from '../../../types/admin';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';

type ViewMode = 'grid' | 'list';
type MediaCategory = 'hero' | 'features' | 'gallery' | 'events' | 'testimonials' | 'team' | 'documents' | 'all';
type SortBy = 'date' | 'name' | 'size';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function resolveMediaUrl(url?: string) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/assets/')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface EditingMedia extends Partial<MediaItem> {
  id: string;
  isEditing: boolean;
}

const CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: 'all', label: 'All Media' },
  { value: 'hero', label: 'Hero Section' },
  { value: 'features', label: 'Features' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'events', label: 'Events' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'team', label: 'Team' },
  { value: 'documents', label: 'Documents' },
];

export default function MediaGalleryManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categories, setCategories] = useState<{ value: string; label: string }[]>(CATEGORIES);
  const [category, setCategory] = useState<MediaCategory>('all');
  const [newCategory, setNewCategory] = useState('');
  const [newMedia, setNewMedia] = useState({
    title: '',
    caption: '',
    tags: '',
    category: CATEGORIES[1]?.value ?? 'gallery',
    isFeatured: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingMedia, setEditingMedia] = useState<EditingMedia | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmationDialog();

  // Fetch media items
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      // Note: Category filtering is done client-side after fetching
      const data = await mediaManagementService.getAll();
      setMediaItems(Array.isArray(data) ? data : []);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to fetch media:', error);
      toast.error('Failed to load media');
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, '-');
    if (categories.some((cat) => cat.value === normalized)) {
      toast('Category already exists');
      return;
    }
    setCategories((prev) => [...prev, { value: normalized, label: trimmed }]);
    setNewCategory('');
    toast.success('Category added');
  };

  const handleDeleteCategory = (value: string) => {
    if (value === 'all') return;
    setCategories((prev) => prev.filter((cat) => cat.value !== value));
    if (category === value) setCategory('all');
    toast.success('Category removed');
  };

  const handleNewMediaChange = (key: string, value: string | boolean) => {
    setNewMedia((prev) => ({ ...prev, [key]: value }));
  };

  const resetNewMedia = () => {
    setNewMedia({
      title: '',
      caption: '',
      tags: '',
      category: CATEGORIES[1]?.value ?? 'gallery',
      isFeatured: false,
    });
  };

  // Filter and sort media
  const filteredAndSortedMedia = useMemo(() => {
    let filtered = mediaItems.filter((item) => {
      // Filter by category (client-side)
      if (category !== 'all' && item.tags && !item.tags.includes(category)) {
        return false;
      }
      
      // Filter by search query
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return filtered;
  }, [mediaItems, searchQuery, sortBy, category]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items?.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer?.files?.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    []
  );

  // File handling
  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files).filter((file) => {
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} - Invalid file type`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} - File too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (fileArray.length === 0) return;

    setUploading(true);
    const newProgress: UploadProgress[] = fileArray.map((f, i) => ({
      fileId: `${Date.now()}-${i}`,
      fileName: f.name,
      progress: 0,
      status: 'uploading',
    }));
    setUploadProgress(newProgress);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const progressIndex = i;

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const updated = [...prev];
            if (updated[progressIndex].progress < 90) {
              updated[progressIndex].progress += Math.random() * 30;
            }
            return updated;
          });
        }, 200);

        const customTags = newMedia.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        let uploadedMedia = await mediaManagementService.uploadMedia(file, {
          title: newMedia.title || file.name.replace(/\.[^/.]+$/, ''),
          caption: newMedia.caption || undefined,
          tags: [
            ...(newMedia.category !== 'all' ? [newMedia.category] : ['general']),
            ...customTags,
          ],
        });

        if (newMedia.isFeatured && uploadedMedia?.id) {
          uploadedMedia = await mediaManagementService.featureMedia(uploadedMedia.id);
        }

        clearInterval(progressInterval);
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[progressIndex].progress = 100;
          updated[progressIndex].status = 'success';
          return updated;
        });

        setMediaItems((prev) => [uploadedMedia as MediaItem, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[progressIndex].status = 'error';
          updated[progressIndex].error = error.message || 'Upload failed';
          return updated;
        });
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setTimeout(() => setUploadProgress([]), 3000);
  };

  // Multi-select handlers
  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedMedia.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedMedia.map((m) => m.id)));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmed = await confirmation.confirm({
      title: 'Delete selected media?',
      message: `This will permanently delete ${selectedItems.size} selected item(s).`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setUploading(true);
      for (const id of selectedItems) {
        await mediaManagementService.deleteMedia(id);
      }
      setMediaItems((prev) => prev.filter((m) => !selectedItems.has(m.id)));
      setSelectedItems(new Set());
      toast.success(`Deleted ${selectedItems.size} item(s)`);
    } catch (error) {
      toast.error('Failed to delete items');
    } finally {
      setUploading(false);
    }
  };

  // Delete single item
  const handleDeleteItem = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete media?',
      message: 'This media item will be permanently removed from the library.',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await mediaManagementService.deleteMedia(id);
      setMediaItems((prev) => prev.filter((m) => m.id !== id));
      toast.success('Media deleted');
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  // Update media
  const handleUpdateMedia = async () => {
    if (!editingMedia) return;
    try {
      const updated = await mediaManagementService.updateMedia(editingMedia.id, {
        title: editingMedia.title,
        caption: editingMedia.caption,
        tags: editingMedia.tags,
      });
      setMediaItems((prev) => prev.map((m) => (m.id === editingMedia.id ? updated : m)));
      setEditingMedia(null);
      toast.success('Media updated');
    } catch (error) {
      toast.error('Failed to update media');
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      if (isFeatured) {
        await mediaManagementService.unfeatureMedia(id);
      } else {
        await mediaManagementService.featureMedia(id);
      }
      setMediaItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isFeatured: !isFeatured } : m))
      );
      toast.success(isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      case 'document':
      case 'pdf':
        return <FileText size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div className="media-gallery-manager admin-overview">
      {/* Header */}
      <div className="media-manager-shell bg-white rounded-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-sm">
        <div className="media-manager-head sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">School Media Manager</h2>
            <p className="text-sm text-gray-500">Drop images, videos, PDFs, and school documents. Manage everything without leaving the page.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 transition hover:text-gray-600"
            title="Clear form"
            onClick={resetNewMedia}
          >
            <X size={20} />
          </button>
        </div>

        <div className="media-upload-panel px-6 py-6 border-b border-gray-200 space-y-6">
          <div className="media-upload-grid grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="media-form-stack space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block media-field">
                  <span className="text-sm font-medium text-gray-700">Media Title</span>
                  <input
                    type="text"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                    placeholder="Enter media title"
                    value={newMedia.title}
                    onChange={(e) => handleNewMediaChange('title', e.target.value)}
                  />
                </label>
                <label className="block media-field">
                  <span className="text-sm font-medium text-gray-700">Category</span>
                  <div className="mt-2 flex gap-2">
                    <select
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                      value={newMedia.category}
                      onChange={(e) => handleNewMediaChange('category', e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      onClick={handleAddCategory}
                    >
                      Add
                    </button>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block media-field">
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                  <input
                    type="text"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                    placeholder="e.g. graduation, sports"
                    value={newMedia.tags}
                    onChange={(e) => handleNewMediaChange('tags', e.target.value)}
                  />
                </label>
                <label className="block media-field">
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={newMedia.isFeatured}
                        onChange={(e) => handleNewMediaChange('isFeatured', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      Mark as featured
                    </label>
                  </div>
                </label>
              </div>

              <label className="block media-field">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                  placeholder="Describe the media item"
                  value={newMedia.caption}
                  onChange={(e) => handleNewMediaChange('caption', e.target.value)}
                />
              </label>
            </div>

            <div className="space-y-6">
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
              >
                <div className="dropzone-content">
                  <span className="media-drop-emoji">📸</span>
                  <h3 className="text-lg font-semibold text-gray-900">Drop files to upload</h3>
                  <p className="text-sm text-gray-500">Drag many files here, or tap the button to pick images, videos, and PDFs.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Plus size={16} /> Add Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="media-category-panel rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Manage categories</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                      placeholder="New category e.g. Sports"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                      onClick={handleAddCategory}
                    >
                      Add
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                    {categories.filter((cat) => cat.value !== 'all').map((cat) => (
                      <div key={cat.value} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span className="truncate">{cat.label}</span>
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleDeleteCategory(cat.value)}
                          aria-label={`Delete ${cat.label}`}
                          title={`Delete ${cat.label}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
          {uploadProgress.map((progress) => (
            <div key={progress.fileId} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{progress.fileName}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-semibold text-xs ${
                  progress.status === 'uploading' ? 'bg-indigo-100 text-indigo-700' :
                  progress.status === 'success' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {progress.status === 'uploading' && <span>{Math.round(progress.progress)}%</span>}
                  {progress.status === 'success' && (
                    <>
                      <Check size={14} /> Done
                    </>
                  )}
                  {progress.status === 'error' && (
                    <>
                      <X size={14} /> {progress.error || 'Failed'}
                    </>
                  )}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="media-controls flex flex-wrap gap-4 items-center justify-between mb-4">
        <div className="media-control-group flex flex-wrap gap-3 flex-1 min-w-80">
          <div className="media-search flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={16} />
            <input
              type="text"
              className="border-none outline-none flex-1 text-sm"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer"
          >
            <option value="date">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">Largest First</option>
          </select>

          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold bg-white hover:bg-gray-50 transition" onClick={fetchMedia} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="media-actions flex gap-3 items-center">
          {selectedItems.size > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
              <span>{selectedItems.size} selected</span>
              <button className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition" onClick={handleBulkDelete} disabled={uploading}>
                <Trash2 size={14} /> Delete All
              </button>
            </div>
          )}

          <div className="media-view-toggle flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid3x3 size={16} />
            </button>
            <button
              className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Select All */}
      {filteredAndSortedMedia.length > 0 && (
        <div className="mb-4 flex items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedItems.size === filteredAndSortedMedia.length && filteredAndSortedMedia.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer"
            />
            <span>Select all {filteredAndSortedMedia.length} items</span>
          </label>
        </div>
      )}

      {/* Media Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm">Loading media...</p>
        </div>
      ) : filteredAndSortedMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
          <AlertCircle size={32} />
          <h3 className="text-lg font-semibold text-gray-900">No media found</h3>
          <p className="text-sm">{searchQuery ? 'Try a different search' : 'Upload your first media file'}</p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="media-card-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedMedia.map((item) => (
              <div key={item.id} className="media-library-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-teal-600 transition">
                <div className="media-library-preview relative w-full aspect-square bg-gray-100 overflow-hidden cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="absolute top-2 left-2 z-10 w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer"
                  />
                  {item.type === 'image' && (
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={item.title}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => { setPreviewZoom(1); setPreviewMedia(item); }}
                    />
                  )}
                  {item.type === 'video' && (
                    <video src={resolveMediaUrl(item.url)} className="w-full h-full object-cover" />
                  )}
                  {item.type !== 'image' && item.type !== 'video' && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      {getMediaIcon(item.type)}
                    </div>
                  )}
                  {item.isFeatured && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">Featured</div>}
                </div>

                <div className="media-library-info p-3">
                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={item.title}>{item.title || 'Untitled'}</h4>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(item.fileSize || 0)} • {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="media-library-actions flex gap-1 p-2 border-t border-gray-100">
                  <button
                    className="flex-1 p-2 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-teal-600 rounded transition"
                    onClick={() => { setPreviewZoom(1); setPreviewMedia(item); }}
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className="flex-1 p-2 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-teal-600 rounded transition"
                    onClick={() => setEditingMedia({ ...item, isEditing: true })}
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className={`flex-1 p-2 flex items-center justify-center rounded transition ${item.isFeatured ? 'bg-yellow-50 text-yellow-600' : 'text-gray-500 hover:bg-gray-50 hover:text-teal-600'}`}
                    onClick={() => handleToggleFeatured(item.id, item.isFeatured || false)}
                    title={item.isFeatured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="flex-1 p-2 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="media-list-view space-y-2">
            {filteredAndSortedMedia.map((item) => (
              <div key={item.id} className="media-list-row flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-teal-600 hover:shadow-md transition">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer"
                />
                <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded text-gray-600">
                  {getMediaIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                  <p className="text-xs text-gray-500">{formatFileSize(item.fileSize || 0)} • {new Date(item.uploadedAt).toLocaleDateString()}</p>
                </div>
                {item.tags && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => (
                      <span key={t} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-600 rounded transition" onClick={() => { setPreviewZoom(1); setPreviewMedia(item); }} title="Preview"><Eye size={14} /></button>
                  <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-600 rounded transition" onClick={() => setEditingMedia({ ...item, isEditing: true })} title="Edit"><Edit3 size={14} /></button>
                  <button className={`p-1.5 rounded transition ${item.isFeatured ? 'bg-yellow-50 text-yellow-600' : 'text-gray-500 hover:bg-gray-100 hover:text-teal-600'}`} onClick={() => handleToggleFeatured(item.id, item.isFeatured || false)} title={item.isFeatured ? 'Remove' : 'Feature'}><Check size={14} /></button>
                  <button className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition" onClick={() => handleDeleteItem(item.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Edit Modal */}
      {editingMedia?.isEditing && (
        <div className="media-edit-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingMedia(null)}>
          <div className="media-edit-panel bg-white rounded-lg p-6 max-w-md w-11/12 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="media-edit-close" onClick={() => setEditingMedia(null)} aria-label="Close media editor">
              <X size={18} />
            </button>
            <div className="media-edit-preview">
              {editingMedia.type === 'image' && <img src={resolveMediaUrl(editingMedia.url)} alt={editingMedia.title || 'Media preview'} />}
              {editingMedia.type === 'video' && <video src={resolveMediaUrl(editingMedia.url)} controls playsInline preload="metadata" />}
              {editingMedia.type !== 'image' && editingMedia.type !== 'video' && (
                <a href={resolveMediaUrl(editingMedia.url)} target="_blank" rel="noreferrer">
                  <FileText size={46} /> Open document
                </a>
              )}
            </div>
            <div className="media-edit-form">
              <div>
                <span className="media-edit-eyebrow">Edit media</span>
                <h3>{editingMedia.title || 'Untitled media'}</h3>
                <p>Update how this item appears in the school media gallery.</p>
              </div>
              <label>
                Title
                <input
                  type="text"
                  value={editingMedia.title || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                />
              </label>
              <label>
                Caption
                <textarea
                  value={editingMedia.caption || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, caption: e.target.value })}
                  rows={4}
                />
              </label>
              <label>
                Tags
                <input
                  type="text"
                  placeholder="Separate tags with commas"
                  value={(editingMedia.tags || []).join(', ')}
                  onChange={(e) => setEditingMedia({ ...editingMedia, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                />
              </label>
              <label>
                Media URL
                <input type="text" value={resolveMediaUrl(editingMedia.url)} readOnly />
              </label>
              <div className="media-edit-meta">
                <span>{editingMedia.type || 'media'}</span>
                <span>{formatFileSize(editingMedia.fileSize || 0)}</span>
                {editingMedia.uploadedAt && <span>{new Date(editingMedia.uploadedAt).toLocaleDateString()}</span>}
              </div>
              <div className="media-edit-actions">
                <button type="button" className="media-edit-save" onClick={handleUpdateMedia}>Save Changes</button>
                <button type="button" className="media-edit-cancel" onClick={() => setEditingMedia(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div className="media-preview-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewMedia(null)}>
          <div className="media-preview-panel bg-white rounded-lg p-6 max-w-2xl w-11/12 max-h-96 overflow-y-auto flex flex-col gap-4 relative" onClick={(e) => e.stopPropagation()}>
            <button className="media-preview-close absolute top-4 right-4 p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition" onClick={() => setPreviewMedia(null)} aria-label="Close preview">
              <X size={20} />
            </button>
            <div className="media-preview-toolbar">
              <button type="button" onClick={() => setPreviewZoom((zoom) => Math.max(0.5, zoom - 0.25))}>-</button>
              <span>{Math.round(previewZoom * 100)}%</span>
              <button type="button" onClick={() => setPreviewZoom((zoom) => Math.min(3, zoom + 0.25))}>+</button>
            </div>
            <div className="media-preview-stage">
              {previewMedia.type === 'image' && (
                <img
                  src={resolveMediaUrl(previewMedia.url)}
                  alt={previewMedia.title}
                  className="w-full h-auto rounded-lg"
                  style={{ transform: `scale(${previewZoom})` }}
                />
              )}
              {previewMedia.type === 'video' && <video controls src={resolveMediaUrl(previewMedia.url)} className="w-full rounded-lg" style={{ transform: `scale(${previewZoom})` }} />}
              {previewMedia.type !== 'image' && previewMedia.type !== 'video' && (
                <a className="media-document-preview" href={resolveMediaUrl(previewMedia.url)} target="_blank" rel="noreferrer">
                  <FileText size={44} /> Open document
                </a>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{previewMedia.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{previewMedia.caption}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {new Date(previewMedia.uploadedAt).toLocaleDateString()}
                </span>
                <span>{formatFileSize(previewMedia.fileSize || 0)}</span>
                {previewMedia.isFeatured && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">Featured</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .upload-dropzone.uploading {
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.isLoading}
      />
    </div>
  </div>
  );
}
