import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen, Video, FileText, Image, Music, Archive, Download, Upload,
  Search, Filter, Plus, Trash2, Edit, Eye, Share2, Copy, Star,
  FolderOpen, FolderPlus, ChevronRight, ChevronDown, Grid, List,
  RefreshCw, Settings, Clock, Users, Calendar, Tag, Link as LinkIcon,
  ExternalLink, Heart, MessageSquare, Award, TrendingUp, BarChart3,
  PieChart, AlertCircle, CheckCircle, XCircle, Lock, Unlock,
  Globe, Mail, Printer, Save, Send, Bell, EyeOff, Star as StarFilled
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

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'image' | 'audio' | 'presentation' | 'link' | 'other';
  category: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt: string;
  downloads: number;
  views: number;
  likes: number;
  isFavorite: boolean;
  isPublic: boolean;
  isShared: boolean;
  sharedWith: string[];
  tags: string[];
  folderId: string | null;
}

interface Folder {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  resourceCount: number;
  isShared: boolean;
  sharedWith: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

interface ResourceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  approvedAt?: string;
  fulfilledAt?: string;
  notes?: string;
}

const resourceTypeIcons: Record<string, any> = {
  document: FileText,
  video: Video,
  image: Image,
  audio: Music,
  presentation: FileText,
  link: LinkIcon,
  other: Archive,
};

const resourceTypeColors: Record<string, string> = {
  document: 'bg-blue-100 text-blue-800',
  video: 'bg-red-100 text-red-800',
  image: 'bg-green-100 text-green-800',
  audio: 'bg-purple-100 text-purple-800',
  presentation: 'bg-orange-100 text-orange-800',
  link: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800',
};

const TeacherResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'favorites' | 'requests'>('my');
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    type: 'document' as Resource['type'],
    category: '',
    subjectId: '',
    classId: '',
    tags: '',
    folderId: '',
    isPublic: false,
    shareWithClass: false,
  });
  
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  });
  
  const [requestFormData, setRequestFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as ResourceRequest['priority'],
    notes: '',
  });
  
  const [shareFormData, setShareFormData] = useState({
    shareWithTeachers: [] as string[],
    shareWithClasses: [] as string[],
    shareWithStudents: [] as string[],
    allowDownload: true,
    allowEdit: false,
    expiryDate: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [classes, setClasses] = useState<Array<{ id: string; name: string; stream: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  
  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resourcesRes, foldersRes, categoriesRes, requestsRes, classesRes, subjectsRes] = await Promise.all([
        teacherService.resources.getResources({ type: activeTab === 'favorites' ? 'favorites' : undefined }),
        teacherService.resources.getFolders(),
        teacherService.resources.getCategories(),
        teacherService.resources.getResourceRequests(),
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
      ]);
      
      if (resourcesRes.success) setResources(resourcesRes.data || []);
      if (foldersRes.success) setFolders(foldersRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (requestsRes.success) setRequests(requestsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      
      // Load teachers for sharing
      const teachersRes = await teacherService.users.getTeachers();
      if (teachersRes.success) setTeachers(teachersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-fill title from filename
    if (!uploadFormData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setUploadFormData(prev => ({ ...prev, title: fileName }));
    }
    
    // Auto-detect type
    if (file.type.startsWith('image/')) {
      setUploadFormData(prev => ({ ...prev, type: 'image' }));
    } else if (file.type.startsWith('video/')) {
      setUploadFormData(prev => ({ ...prev, type: 'video' }));
    } else if (file.type.startsWith('audio/')) {
      setUploadFormData(prev => ({ ...prev, type: 'audio' }));
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      setUploadFormData(prev => ({ ...prev, type: 'document' }));
    } else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
      setUploadFormData(prev => ({ ...prev, type: 'presentation' }));
    }
  };

  const uploadResource = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    if (!uploadFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadFormData.title);
      formData.append('description', uploadFormData.description);
      formData.append('type', uploadFormData.type);
      formData.append('category', uploadFormData.category);
      formData.append('subjectId', uploadFormData.subjectId);
      formData.append('classId', uploadFormData.classId);
      formData.append('tags', uploadFormData.tags);
      formData.append('folderId', uploadFormData.folderId);
      formData.append('isPublic', String(uploadFormData.isPublic));
      
      const response = await teacherService.resources.uploadResource(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.success) {
        toast.success('Resource uploaded successfully');
        setShowUploadModal(false);
        resetUploadForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      toast.error('Failed to upload resource');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const createFolder = async () => {
    if (!folderFormData.name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    
    try {
      const response = await teacherService.resources.createFolder(folderFormData);
      if (response.success) {
        toast.success('Folder created');
        setShowFolderModal(false);
        setFolderFormData({ name: '', description: '', parentId: '' });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const deleteResource = async (resourceId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Resource?',
      message: 'This action cannot be undone. The file will be permanently deleted.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.resources.deleteResource(resourceId);
      toast.success('Resource deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete resource');
    }
  };

  const deleteFolder = async (folderId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Folder?',
      message: 'All resources inside this folder will also be deleted. This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.resources.deleteFolder(folderId);
      toast.success('Folder deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const toggleFavorite = async (resourceId: string, isFavorite: boolean) => {
    try {
      await teacherService.resources.toggleFavorite(resourceId, !isFavorite);
      setResources(prev => prev.map(r => 
        r.id === resourceId ? { ...r, isFavorite: !isFavorite } : r
      ));
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update');
    }
  };

  const shareResource = async (resourceId: string) => {
    try {
      await teacherService.resources.shareResource(resourceId, shareFormData);
      toast.success('Resource shared successfully');
      setShowShareModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share resource');
    }
  };

  const downloadResource = async (resource: Resource) => {
    try {
      const response = await teacherService.resources.downloadResource(resource.id);
      const blob = new Blob([response.data], { type: resource.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      // Update download count locally
      setResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r
      ));
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download resource');
    }
  };

  const submitResourceRequest = async () => {
    if (!requestFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    try {
      const response = await teacherService.resources.submitResourceRequest(requestFormData);
      if (response.success) {
        toast.success('Resource request submitted');
        setShowRequestModal(false);
        setRequestFormData({ title: '', description: '', priority: 'medium', notes: '' });
        loadData();
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    }
  };

  const navigateToFolder = (folder: Folder | null) => {
    setSelectedFolder(folder);
    if (folder) {
      // Build breadcrumbs
      const crumbs: Folder[] = [];
      let current: Folder | null = folder;
      while (current) {
        crumbs.unshift(current);
        current = folders.find(f => f.id === current?.parentId) || null;
      }
      setBreadcrumbs(crumbs);
    } else {
      setBreadcrumbs([]);
    }
  };

  const filteredResources = useMemo(() => {
    let filtered = resources;
    
    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(r => r.folderId === selectedFolder.id);
    } else {
      filtered = filtered.filter(r => !r.folderId);
    }
    
    // Search
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedType);
    }
    
    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(r => r.subjectId === selectedSubject);
    }
    
    // Filter by class
    if (selectedClass !== 'all') {
      filtered = filtered.filter(r => r.classId === selectedClass);
    }
    
    return filtered;
  }, [resources, selectedFolder, searchTerm, selectedType, selectedSubject, selectedClass]);

  const resetUploadForm = () => {
    setUploadFormData({
      title: '',
      description: '',
      type: 'document',
      category: '',
      subjectId: '',
      classId: '',
      tags: '',
      folderId: '',
      isPublic: false,
      shareWithClass: false,
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !resources.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading resources..." />
      </div>
    );
  }

  const ResourceIcon = ({ type }: { type: string }) => {
    const Icon = resourceTypeIcons[type] || resourceTypeIcons.other;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Resource Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage teaching resources, upload files, and organize your materials
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFolderModal(true)}>
            <FolderPlus className="w-4 h-4 mr-1" />
            New Folder
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRequestModal(true)}>
            <Mail className="w-4 h-4 mr-1" />
            Request Resource
          </Button>
          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('my')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'my'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          My Resources
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'shared'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Shared with Me
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'favorites'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Star className="w-4 h-4 inline mr-1" />
          Favorites
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Mail className="w-4 h-4 inline mr-1" />
          Requests
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
            <option value="presentation">Presentations</option>
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
            ))}
          </select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Folder Navigation */}
      {activeTab === 'my' && folders.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigateToFolder(null)}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition',
              !selectedFolder ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'hover:bg-gray-100'
            )}
          >
            All Resources
          </button>
          {breadcrumbs.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => navigateToFolder(folder)}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Categories */}
      {activeTab === 'my' && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 transition"
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      )}

      {/* Resources Grid/List */}
      {activeTab !== 'requests' && filteredResources.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No resources found</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Upload Your First Resource
          </Button>
        </Card>
      ) : activeTab === 'requests' ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{request.title}</h3>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      )}>
                        {request.priority}
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      )}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Requested by {request.requestedByName} on {formatDate(request.requestedAt)}
                    </p>
                    {request.notes && (
                      <p className="text-sm bg-gray-50 p-2 rounded mt-2">{request.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Folders first */}
          {activeTab === 'my' && !selectedFolder && folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-lg transition cursor-pointer" onClick={() => navigateToFolder(folder)}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <FolderOpen className="w-12 h-12 text-yellow-500" />
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold truncate">{folder.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{folder.resourceCount} items</p>
                {folder.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{folder.description}</p>
                )}
              </div>
            </Card>
          ))}
          
          {/* Resources */}
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx('p-2 rounded-lg', resourceTypeColors[resource.type])}>
                    <ResourceIcon type={resource.type} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFavorite(resource.id, resource.isFavorite)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {resource.isFavorite ? (
                        <StarFilled className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedResource(resource);
                        setShowShareModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Share2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold truncate" title={resource.title}>{resource.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{resource.subjectName} • {resource.className}</p>
                
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {resource.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {resource.views}
                  </span>
                  <span>{formatFileSize(resource.fileSize)}</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => downloadResource(resource)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-center">Size</th>
                  <th className="px-4 py-3 text-center">Downloads</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredResources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium">{resource.title}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', resourceTypeColors[resource.type])}>
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{resource.subjectName}</td>
                    <td className="px-4 py-3">{resource.className}</td>
                    <td className="px-4 py-3 text-center">{formatFileSize(resource.fileSize)}</td>
                    <td className="px-4 py-3 text-center">{resource.downloads}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => window.open(resource.fileUrl, '_blank')} className="text-blue-500">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadResource(resource)} className="text-green-500">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleFavorite(resource.id, resource.isFavorite)}>
                          {resource.isFavorite ? (
                            <StarFilled className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Star className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button onClick={() => deleteResource(resource.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Resource" size="lg">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div>
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-2">
                  Change File
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">Supports: PDF, DOC, PPT, MP4, MP3, JPG (Max 50MB)</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-2">
                  Select File
                </Button>
              </div>
            )}
          </div>
          
          {uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Resource title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={uploadFormData.description}
              onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Describe the resource..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                value={uploadFormData.subjectId}
                onChange={(e) => setUploadFormData({ ...uploadFormData, subjectId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={uploadFormData.classId}
                onChange={(e) => setUploadFormData({ ...uploadFormData, classId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={uploadFormData.tags}
              onChange={(e) => setUploadFormData({ ...uploadFormData, tags: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="math, algebra, lesson1"
            />
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={uploadFormData.isPublic}
                onChange={(e) => setUploadFormData({ ...uploadFormData, isPublic: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Make public (visible to all teachers)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={uploadFormData.shareWithClass}
                onChange={(e) => setUploadFormData({ ...uploadFormData, shareWithClass: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Share with students</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button onClick={uploadResource} disabled={uploading || !selectedFile}>
              {uploading ? <Spinner size="sm" /> : <Upload className="w-4 h-4 mr-1" />}
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      {/* Folder Modal */}
      <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title="Create Folder" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Folder Name *</label>
            <input
              type="text"
              value={folderFormData.name}
              onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Lesson Plans, Worksheets"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={folderFormData.description}
              onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Folder description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Folder</label>
            <select
              value={folderFormData.parentId}
              onChange={(e) => setFolderFormData({ ...folderFormData, parentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Root (No parent)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create Folder</Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Resource" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Share with Teachers</label>
            <select
              multiple
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              size={3}
              value={shareFormData.shareWithTeachers}
              onChange={(e) => setShareFormData({
                ...shareFormData,
                shareWithTeachers: Array.from(e.target.selectedOptions, option => option.value)
              })}
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Share with Classes</label>
            <select
              multiple
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              size={3}
              value={shareFormData.shareWithClasses}
              onChange={(e) => setShareFormData({
                ...shareFormData,
                shareWithClasses: Array.from(e.target.selectedOptions, option => option.value)
              })}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareFormData.allowDownload}
                onChange={(e) => setShareFormData({ ...shareFormData, allowDownload: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Allow download</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareFormData.allowEdit}
                onChange={(e) => setShareFormData({ ...shareFormData, allowEdit: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Allow edit (for teachers)</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={shareFormData.expiryDate}
              onChange={(e) => setShareFormData({ ...shareFormData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowShareModal(false)}>Cancel</Button>
            <Button onClick={() => selectedResource && shareResource(selectedResource.id)}>Share</Button>
          </div>
        </div>
      </Modal>

      {/* Request Resource Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request Resource" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resource Title *</label>
            <input
              type="text"
              value={requestFormData.title}
              onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="What resource do you need?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={4}
              value={requestFormData.description}
              onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Describe the resource you need..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={requestFormData.priority}
              onChange={(e) => setRequestFormData({ ...requestFormData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Additional Notes</label>
            <textarea
              rows={3}
              value={requestFormData.notes}
              onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Any specific requirements..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button onClick={submitResourceRequest}>Submit Request</Button>
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

export default TeacherResourcesPage;