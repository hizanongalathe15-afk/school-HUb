// client/src/components/roles/admin/AdminCocurricularPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, Save, Trophy, Users, Calendar, MapPin,
  Clock, Award, Medal, Star, Heart, TrendingUp, TrendingDown,
  Video, Image, Film, Music, Mic, Palette, Gamepad2, Dumbbell,
  BookOpen, Globe, Camera, Share2, Copy, Link, ExternalLink,
  Eye, MessageCircle, Bell, Send, Mail, Phone, MessageCircle as WhatsApp,
  Filter, Grid, List, Play, Pause, Volume2, VolumeX, Maximize2,
  Image as ImageIcon, FileImage, PlayCircle as Youtube, Camera as Instagram, Share2 as Facebook, Send as Twitter,
  ChevronLeft, ChevronRight, PlusCircle, MinusCircle, Settings,
  BarChart3, PieChart, Activity, Zap, Target, Flag, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cocurricularService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  size: number;
  uploadedAt: string;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  competition: string;
  level: 'school' | 'zonal' | 'county' | 'national' | 'international';
  position: number;
  medal: 'gold' | 'silver' | 'bronze' | 'certificate';
  description: string;
  media: MediaItem[];
}

interface Participant {
  id: string;
  name: string;
  class: string;
  admissionNumber: string;
  role: string;
  achievements: string[];
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  venue: string;
  result: 'win' | 'loss' | 'draw' | 'pending';
  score: string;
  highlights: MediaItem[];
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  type: 'league' | 'knockout' | 'friendly';
  status: 'upcoming' | 'ongoing' | 'completed';
  matches: Match[];
  ranking: { team: string; points: number; position: number }[];
}

interface Activity {
  id: string;
  name: string;
  category: 'sports' | 'clubs' | 'music' | 'arts' | 'drama' | 'debate' | 'scouts' | 'charity' | 'academic' | 'technology';
  subCategory: string;
  description: string;
  coach: string;
  coachContact: string;
  coachEmail: string;
  assistantCoach: string;
  captain: string;
  viceCaptain: string;
  meetingDays: string[];
  meetingTime: string;
  venue: string;
  participants: number;
  maxParticipants?: number;
  minParticipants?: number;
  registrationDeadline?: string;
  season: string;
  year: number;
  status: 'active' | 'inactive' | 'registration' | 'season_ended';
  achievements: Achievement[];
  participantsList: Participant[];
  tournaments: Tournament[];
  mediaGallery: MediaItem[];
  coverImage?: string;
  coverVideo?: string;
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
  };
  upcomingEvents: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
  }[];
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    expenses: { id: string; item: string; amount: number; date: string }[];
  };
  galleryViews: number;
  likes: number;
  shares: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalActivities: number;
  activeActivities: number;
  totalParticipants: number;
  totalAchievements: number;
  nationalWins: number;
  internationalWins: number;
  totalMediaItems: number;
  totalViews: number;
  topPerforming: string;
}

export default function AdminCocurricularPage() {
  const confirmation = useConfirmationDialog();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState<Stats>({
    totalActivities: 0,
    activeActivities: 0,
    totalParticipants: 0,
    totalAchievements: 0,
    nationalWins: 0,
    internationalWins: 0,
    totalMediaItems: 0,
    totalViews: 0,
    topPerforming: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [form, setForm] = useState<Partial<Activity>>({
    name: '',
    category: 'sports',
    subCategory: '',
    description: '',
    coach: '',
    coachContact: '',
    coachEmail: '',
    assistantCoach: '',
    captain: '',
    viceCaptain: '',
    meetingDays: [],
    meetingTime: '',
    venue: '',
    participants: 0,
    maxParticipants: undefined,
    minParticipants: undefined,
    registrationDeadline: '',
    season: new Date().getFullYear().toString(),
    year: new Date().getFullYear(),
    status: 'active',
    achievements: [],
    participantsList: [],
    tournaments: [],
    mediaGallery: [],
    upcomingEvents: [],
    budget: { allocated: 0, spent: 0, remaining: 0, expenses: [] },
    published: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await cocurricularService.getAll({
        search: searchTerm,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setActivities(data || []);
      const activityStats = await cocurricularService.getStats();
      setStats(activityStats);
    } catch (error) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, categoryFilter, statusFilter]);

  const handleMediaUpload = async (files: FileList, type: 'image' | 'video') => {
    if (!files.length) return;
    
    const newMediaItems: MediaItem[] = [];
    
    for (const file of Array.from(files)) {
      const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds size limit`);
        continue;
      }
      
      setUploadingMedia(true);
      setUploadProgress(0);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('activityId', editing?.id || 'temp');
        
        const response = await cocurricularService.uploadMedia(formData, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
        
        const previewUrl = URL.createObjectURL(file);
        
        newMediaItems.push({
          id: response.data?.id || Date.now().toString(),
          type,
          url: response.data?.url || previewUrl,
          thumbnail: type === 'video' ? response.data?.thumbnail : previewUrl,
          title: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
        
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingMedia(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
    
    setForm({
      ...form,
      mediaGallery: [...(form.mediaGallery || []), ...newMediaItems]
    });
  };

  const handleRemoveMedia = (mediaId: string) => {
    setForm({
      ...form,
      mediaGallery: form.mediaGallery?.filter(m => m.id !== mediaId) || []
    });
    toast.success('Media removed');
  };

  const handleSetCoverImage = (mediaId: string) => {
    const media = form.mediaGallery?.find(m => m.id === mediaId);
    if (media && media.type === 'image') {
      setForm({ ...form, coverImage: media.url });
      toast.success('Cover image set');
    }
  };

  const handleAddAchievement = async (achievement: Achievement) => {
    if (editing) {
      setForm({
        ...form,
        achievements: [...(form.achievements || []), achievement]
      });
    } else {
      // Store temporarily
      setForm({
        ...form,
        achievements: [...(form.achievements || []), achievement]
      });
    }
    toast.success('Achievement added');
    setShowAchievementModal(false);
  };

  const handleAddTournament = async (tournament: Tournament) => {
    setForm({
      ...form,
      tournaments: [...(form.tournaments || []), tournament]
    });
    toast.success('Tournament added');
    setShowTournamentModal(false);
  };

  const handleAddParticipant = (participant: Participant) => {
    setForm({
      ...form,
      participantsList: [...(form.participantsList || []), participant],
      participants: (form.participants || 0) + 1
    });
    toast.success('Participant added');
    setShowParticipantModal(false);
  };

  const handleAddExpense = (expense: { item: string; amount: number }) => {
    const newExpense = {
      id: Date.now().toString(),
      item: expense.item,
      amount: expense.amount,
      date: new Date().toISOString()
    };
    const newBudget = {
      ...form.budget!,
      spent: (form.budget?.spent || 0) + expense.amount,
      remaining: (form.budget?.allocated || 0) - ((form.budget?.spent || 0) + expense.amount),
      expenses: [...(form.budget?.expenses || []), newExpense]
    };
    setForm({ ...form, budget: newBudget });
    toast.success('Expense recorded');
  };

  const save = async () => {
    if (!form.name) {
      toast.error('Activity name required');
      return;
    }
    try {
      if (editing) {
        await cocurricularService.update(editing.id, form);
      } else {
        await cocurricularService.create(form);
      }
      toast.success('Activity saved successfully');
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const del = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Activity',
      message: 'Are you sure? This will delete all associated media, achievements, and tournaments.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      await cocurricularService.delete(id);
      toast.success('Deleted');
      fetchData();
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(a => a.id));
    }
  };

  const bulkDelete = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Bulk Delete',
      message: `Delete ${selected.length} activities?`,
      confirmText: 'Delete All',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      await Promise.all(selected.map(id => cocurricularService.delete(id)));
      toast.success(`${selected.length} activities deleted`);
      setSelected([]);
      fetchData();
    }
  };

  const exportData = async () => {
    try {
      const blob = await cocurricularService.exportActivities();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cocurricular_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImportFiles(files);
    setShowImport(true);
  };

  const doImport = async () => {
    for (const file of importFiles) {
      try {
        await cocurricularService.importActivities(file);
      } catch (error) {
        toast.error(`Failed to import ${file.name}`);
      }
    }
    toast.success('Import completed');
    setShowImport(false);
    fetchData();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      sports: <Trophy size={16} />,
      clubs: <Users size={16} />,
      music: <Music size={16} />,
      arts: <Palette size={16} />,
      drama: <Film size={16} />,
      debate: <Mic size={16} />,
      scouts: <Flag size={16} />,
      charity: <Heart size={16} />,
      academic: <BookOpen size={16} />,
      technology: <Gamepad2 size={16} />
    };
    return icons[category] || <Activity size={16} />;
  };

  const getMedalColor = (medal: string) => {
    const colors: Record<string, string> = {
      gold: 'text-yellow-500 bg-yellow-100',
      silver: 'text-gray-400 bg-gray-100',
      bronze: 'text-amber-600 bg-amber-100',
      certificate: 'text-blue-500 bg-blue-100'
    };
    return colors[medal] || 'text-gray-500 bg-gray-100';
  };

  const getResultBadge = (result: string) => {
    const colors: Record<string, string> = {
      win: 'bg-green-100 text-green-800',
      loss: 'bg-red-100 text-red-800',
      draw: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[result] || colors.pending;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filtered = activities.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.coach?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.captain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cocurricular-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Trophy size={28} /> Co-Curricular Activities</h1>
          <p>Manage sports, clubs, arts, competitions, achievements, and media</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={exportData} className="btn-secondary">
            <Download size={16} /> Export
          </button>
          <button onClick={() => { setEditing(null); setForm({}); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Add Activity
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card"><Trophy size={20} /><div><span className="stat-value">{stats.totalActivities}</span><span className="stat-label">Total Activities</span></div></div>
        <div className="stat-card"><Users size={20} /><div><span className="stat-value">{stats.totalParticipants}</span><span className="stat-label">Participants</span></div></div>
        <div className="stat-card"><Medal size={20} /><div><span className="stat-value">{stats.totalAchievements}</span><span className="stat-label">Achievements</span></div></div>
        <div className="stat-card"><Flag size={20} /><div><span className="stat-value">{stats.nationalWins}</span><span className="stat-label">National Wins</span></div></div>
        <div className="stat-card"><Globe size={20} /><div><span className="stat-value">{stats.internationalWins}</span><span className="stat-label">International</span></div></div>
        <div className="stat-card"><Image size={20} /><div><span className="stat-value">{stats.totalMediaItems}</span><span className="stat-label">Media Items</span></div></div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} activities selected</span>
          <div className="bulk-buttons">
            <button onClick={bulkDelete} className="btn-danger"><Trash2 size={14} /> Delete Selected</button>
            <button className="btn-secondary"><Download size={14} /> Export Selected</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search activities, coaches, captains..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
          <option value="all">All Categories</option>
          <option value="sports">Sports</option><option value="clubs">Clubs</option>
          <option value="music">Music & Arts</option><option value="drama">Drama</option>
          <option value="debate">Debate</option><option value="scouts">Scouts</option>
          <option value="charity">Charity</option><option value="academic">Academic</option>
          <option value="technology">Technology</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option><option value="inactive">Inactive</option>
          <option value="registration">Registration Open</option><option value="season_ended">Season Ended</option>
        </select>
      </div>

      {/* Drag & Drop Area */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="drag-drop-area">
        <Upload size={24} />
        <p>Drag & drop Excel/CSV files here for bulk import</p>
        <small>Supports multiple files with participants, achievements, and tournament data</small>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading activities...</p></div>
      ) : (
        <div className="activities-grid">
          {filtered.map(activity => (
            <div key={activity.id} className="activity-card">
              {activity.coverImage && (
                <div className="activity-cover">
                  <img src={activity.coverImage} alt={activity.name} />
                  {activity.mediaGallery && activity.mediaGallery.length > 0 && (
                    <span className="media-badge">+{activity.mediaGallery.length} media</span>
                  )}
                </div>
              )}
              <div className="activity-content">
                <div className="activity-header">
                  {getCategoryIcon(activity.category)}
                  <span className="category">{activity.category}</span>
                  <span className={`status-badge status-${activity.status}`}>{activity.status}</span>
                </div>
                <h3>{activity.name}</h3>
                <p className="description">{activity.description?.substring(0, 80)}...</p>
                <div className="activity-stats">
                  <div><Users size={14} /> {activity.participants} members</div>
                  <div><Medal size={14} /> {activity.achievements?.length || 0} awards</div>
                  <div><Eye size={14} /> {activity.galleryViews || 0} views</div>
                </div>
                <div className="activity-actions">
                  <button onClick={() => { setSelectedActivity(activity); setShowDetailsModal(true); }}><Eye size={16} /> View</button>
                  <button onClick={() => { setEditing(activity); setForm(activity); setShowModal(true); }}><Edit size={16} /> Edit</button>
                  <button onClick={() => handleAddTournament as any}><Trophy size={16} /> Tournaments</button>
                  <button onClick={() => del(activity.id)} className="danger"><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal with Full Features */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit' : 'Add'} Co-Curricular Activity</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); save(); }}>
                {/* Basic Info */}
                <div className="form-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group full-width"><label>Activity Name *</label><input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                    <div className="form-group"><label>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                      <option value="sports">Sports</option><option value="clubs">Clubs</option><option value="music">Music & Arts</option>
                      <option value="drama">Drama</option><option value="debate">Debate</option><option value="scouts">Scouts</option>
                      <option value="charity">Charity</option><option value="academic">Academic</option><option value="technology">Technology</option>
                    </select></div>
                    <div className="form-group"><label>Sub Category</label><input value={form.subCategory || ''} onChange={e => setForm({...form, subCategory: e.target.value})} placeholder="e.g., Football, Basketball, Chess" /></div>
                    <div className="form-group full-width"><label>Description</label><textarea rows={3} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="Full description of the activity" /></div>
                  </div>
                </div>

                {/* Leadership */}
                <div className="form-section">
                  <h4>Leadership & Coaching</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Head Coach/Teacher</label><input value={form.coach || ''} onChange={e => setForm({...form, coach: e.target.value})} /></div>
                    <div className="form-group"><label>Coach Phone</label><input value={form.coachContact || ''} onChange={e => setForm({...form, coachContact: e.target.value})} /></div>
                    <div className="form-group"><label>Coach Email</label><input type="email" value={form.coachEmail || ''} onChange={e => setForm({...form, coachEmail: e.target.value})} /></div>
                    <div className="form-group"><label>Assistant Coach</label><input value={form.assistantCoach || ''} onChange={e => setForm({...form, assistantCoach: e.target.value})} /></div>
                    <div className="form-group"><label>Captain</label><input value={form.captain || ''} onChange={e => setForm({...form, captain: e.target.value})} /></div>
                    <div className="form-group"><label>Vice Captain</label><input value={form.viceCaptain || ''} onChange={e => setForm({...form, viceCaptain: e.target.value})} /></div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="form-section">
                  <h4>Meeting Schedule</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Meeting Days</label>
                      <div className="checkbox-group">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                          <label key={day}><input type="checkbox" checked={form.meetingDays?.includes(day)} onChange={e => {
                            const days = form.meetingDays || [];
                            if (e.target.checked) setForm({...form, meetingDays: [...days, day]});
                            else setForm({...form, meetingDays: days.filter(d => d !== day)});
                          }} /> {day}</label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group"><label>Meeting Time</label><input type="time" value={form.meetingTime || ''} onChange={e => setForm({...form, meetingTime: e.target.value})} /></div>
                    <div className="form-group"><label>Venue</label><input value={form.venue || ''} onChange={e => setForm({...form, venue: e.target.value})} /></div>
                  </div>
                </div>

                {/* Media Upload Section */}
                <div className="form-section media-section">
                  <h4><Image size={18} /> Media Gallery (Images & Videos)</h4>
                  <button type="button" className="btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}>
                    <Upload size={14} /> Upload Media
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => {
                    if (e.target.files?.length) {
                      const hasVideo = Array.from(e.target.files).some(f => f.type.startsWith('video/'));
                      handleMediaUpload(e.target.files, hasVideo ? 'video' : 'image');
                    }
                  }} />
                  
                  {uploadingMedia && <div className="upload-progress"><div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div><span>{uploadProgress}%</span></div>}
                  
                  {form.mediaGallery && form.mediaGallery.length > 0 && (
                    <div className="media-gallery">
                      <div className="media-toolbar">
                        <button type="button" onClick={() => setMediaViewMode('grid')} className={mediaViewMode === 'grid' ? 'active' : ''}><Grid size={14} /> Grid</button>
                        <button type="button" onClick={() => setMediaViewMode('list')} className={mediaViewMode === 'list' ? 'active' : ''}><List size={14} /> List</button>
                      </div>
                      {mediaViewMode === 'grid' ? (
                        <div className="media-grid">
                          {form.mediaGallery.map(media => (
                            <div key={media.id} className="media-item">
                              {media.type === 'image' ? <img src={media.url} alt={media.title} /> : <video src={media.url} poster={media.thumbnail} />}
                              <div className="media-overlay">
                                {media.type === 'image' && <button type="button" onClick={() => handleSetCoverImage(media.id)}><Star size={14} /></button>}
                                <button type="button" onClick={() => handleRemoveMedia(media.id)}><Trash2 size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="media-list">
                          {form.mediaGallery.map(media => (
                            <div key={media.id} className="media-list-item">
                              <div className="media-icon">{media.type === 'image' ? <FileImage size={20} /> : <Film size={20} />}</div>
                              <div className="media-info"><div className="media-title">{media.title}</div><div className="media-meta">{formatFileSize(media.size)}</div></div>
                              <button type="button" onClick={() => handleRemoveMedia(media.id)} className="danger"><Trash2 size={14} /> Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Budget */}
                <div className="form-section">
                  <h4>Budget</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Allocated Budget (KES)</label><input type="number" value={form.budget?.allocated || 0} onChange={e => setForm({...form, budget: {...form.budget!, allocated: parseInt(e.target.value), remaining: parseInt(e.target.value) - (form.budget?.spent || 0)}})} /></div>
                    <div className="form-group"><label>Spent (KES)</label><input type="number" value={form.budget?.spent || 0} disabled /></div>
                    <div className="form-group"><label>Remaining (KES)</label><input type="number" value={form.budget?.remaining || 0} disabled /></div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="form-section">
                  <h4>Social Media Links</h4>
                  <div className="form-grid">
                    <div className="form-group"><label><Youtube size={14} /> YouTube</label><input value={form.socialLinks?.youtube || ''} onChange={e => setForm({...form, socialLinks: {...form.socialLinks, youtube: e.target.value}})} /></div>
                    <div className="form-group"><label><Instagram size={14} /> Instagram</label><input value={form.socialLinks?.instagram || ''} onChange={e => setForm({...form, socialLinks: {...form.socialLinks, instagram: e.target.value}})} /></div>
                    <div className="form-group"><label><Facebook size={14} /> Facebook</label><input value={form.socialLinks?.facebook || ''} onChange={e => setForm({...form, socialLinks: {...form.socialLinks, facebook: e.target.value}})} /></div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary"><Save size={16} /> Save Activity</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal with Media Viewer */}
      {showDetailsModal && selectedActivity && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedActivity.name}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Media Gallery */}
              {selectedActivity.mediaGallery && selectedActivity.mediaGallery.length > 0 && (
                <div className="event-media-viewer">
                  <div className="featured-media">
                    {selectedActivity.coverImage ? (
                      <img src={selectedActivity.coverImage} alt={selectedActivity.name} />
                    ) : selectedActivity.mediaGallery[0]?.type === 'video' ? (
                      <video controls src={selectedActivity.mediaGallery[0].url} poster={selectedActivity.mediaGallery[0].thumbnail} />
                    ) : (
                      <img src={selectedActivity.mediaGallery[0].url} alt={selectedActivity.name} />
                    )}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedActivity.achievements && selectedActivity.achievements.length > 0 && (
                <div className="details-section">
                  <h4><Medal size={18} /> Achievements & Awards</h4>
                  <div className="achievements-list">
                    {selectedActivity.achievements.map(ach => (
                      <div key={ach.id} className="achievement-item">
                        <div className={`medal-icon ${getMedalColor(ach.medal)}`}><Medal size={20} /></div>
                        <div><strong>{ach.title}</strong><br />{ach.competition} - {ach.level} Level<br />Position: {ach.position}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedActivity.participantsList && selectedActivity.participantsList.length > 0 && (
                <div className="details-section">
                  <h4><Users size={18} /> Participants ({selectedActivity.participantsList.length})</h4>
                  <div className="participants-grid">
                    {selectedActivity.participantsList.map(p => (
                      <div key={p.id} className="participant-card">
                        <strong>{p.name}</strong><br />Class: {p.class}<br />Role: {p.role}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => { setEditing(selectedActivity); setForm(selectedActivity); setShowModal(true); setShowDetailsModal(false); }}><Edit size={16} /> Edit</button>
                <button className="btn-primary" onClick={() => { setShowAchievementModal(true); }}><Medal size={16} /> Add Achievement</button>
                <button className="btn-primary" onClick={() => { setShowParticipantModal(true); }}><Users size={16} /> Add Participant</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAchievementModal && (
        <div className="modal-overlay" onClick={() => setShowAchievementModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Achievement</h3><button className="close-btn" onClick={() => setShowAchievementModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <AchievementForm onSave={handleAddAchievement} onCancel={() => setShowAchievementModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showParticipantModal && (
        <div className="modal-overlay" onClick={() => setShowParticipantModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Participant</h3><button className="close-btn" onClick={() => setShowParticipantModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <ParticipantForm onSave={handleAddParticipant} onCancel={() => setShowParticipantModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Bulk Import Activities</h3><button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="import-instructions">
                <h4>Instructions:</h4>
                <ul><li>Upload Excel (.xlsx) or CSV files</li><li>Supports: name, category, coach, participants, achievements</li><li>Max 500 rows per file</li></ul>
              </div>
              <input type="file" multiple accept=".xlsx,.csv" onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} />
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn-primary" onClick={doImport}>Import</button></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cocurricular-page { padding: 2rem; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-header h1 { font-size: 1.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; font-weight: 500; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .btn-danger { background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; }
        .stats-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1rem; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 1.5rem; font-weight: 700; display: block; }
        .stat-label { font-size: 0.75rem; color: #64748b; }
        .bulk-bar { background: #eff6ff; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 1rem; gap: 0.5rem; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filter-select { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 1rem; padding: 2rem; text-align: center; margin-bottom: 1.5rem; background: #f8fafc; }
        .activities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .activity-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .activity-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .activity-cover { height: 160px; overflow: hidden; position: relative; }
        .activity-cover img { width: 100%; height: 100%; object-fit: cover; }
        .media-badge { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; }
        .activity-content { padding: 1rem; }
        .activity-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .category { text-transform: capitalize; font-size: 0.75rem; color: #64748b; }
        .status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-inactive { background: #fee2e2; color: #991b1b; }
        .activity-stats { display: flex; gap: 1rem; margin: 0.75rem 0; font-size: 0.75rem; color: #64748b; }
        .activity-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .activity-actions button { padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #f1f5f9; border: none; border-radius: 0.25rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .activity-actions button.danger:hover { background: #fee2e2; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 1rem; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-xlarge { width: 900px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .form-section { margin-bottom: 1.5rem; }
        .form-section h4 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 0.75rem; font-weight: 500; color: #475569; }
        .form-group input, .form-group select, .form-group textarea { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.875rem; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .checkbox-group label { display: flex; align-items: center; gap: 0.25rem; font-weight: normal; }
        .media-section { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
        .media-item { position: relative; aspect-ratio: 1; border-radius: 0.5rem; overflow: hidden; }
        .media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; }
        .media-overlay { position: absolute; top: 0; right: 0; padding: 0.25rem; display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .media-item:hover .media-overlay { opacity: 1; }
        .media-overlay button { background: white; border: none; border-radius: 4px; padding: 4px; cursor: pointer; }
        .upload-progress { background: #e2e8f0; border-radius: 8px; margin: 1rem 0; height: 30px; overflow: hidden; position: relative; }
        .progress-bar { background: #3b82f6; height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; }
        .achievements-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .achievement-item { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; }
        .medal-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .participants-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
        .participant-card { padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; }
        .loading-state { text-align: center; padding: 4rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Achievement Form Component
function AchievementForm({ onSave, onCancel }: { onSave: (achievement: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: '', competition: '', level: 'school', position: 1, medal: 'certificate', description: '', date: new Date().toISOString().split('T')[0]
  });
  return (
    <div className="space-y-3">
      <input placeholder="Achievement Title" className="w-full border p-2 rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
      <input placeholder="Competition Name" className="w-full border p-2 rounded" value={form.competition} onChange={e => setForm({...form, competition: e.target.value})} />
      <select className="w-full border p-2 rounded" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
        <option value="school">School Level</option><option value="zonal">Zonal Level</option>
        <option value="county">County Level</option><option value="national">National Level</option><option value="international">International Level</option>
      </select>
      <select className="w-full border p-2 rounded" value={form.medal} onChange={e => setForm({...form, medal: e.target.value})}>
        <option value="gold">🥇 Gold</option><option value="silver">🥈 Silver</option>
        <option value="bronze">🥉 Bronze</option><option value="certificate">📜 Certificate</option>
      </select>
      <input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
      <textarea placeholder="Description" className="w-full border p-2 rounded" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      <div className="flex gap-2"><button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button><button className="btn-primary flex-1" onClick={() => onSave({...form, id: Date.now().toString()})}>Save</button></div>
    </div>
  );
}

// Participant Form Component
function ParticipantForm({ onSave, onCancel }: { onSave: (participant: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', class: '', admissionNumber: '', role: 'Member', achievements: [] });
  return (
    <div className="space-y-3">
      <input placeholder="Full Name" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      <input placeholder="Class" className="w-full border p-2 rounded" value={form.class} onChange={e => setForm({...form, class: e.target.value})} />
      <input placeholder="Admission Number" className="w-full border p-2 rounded" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
      <select className="w-full border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
        <option value="Member">Member</option><option value="Captain">Captain</option>
        <option value="Vice Captain">Vice Captain</option><option value="Coach">Coach</option>
      </select>
      <div className="flex gap-2"><button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button><button className="btn-primary flex-1" onClick={() => onSave({...form, id: Date.now().toString()})}>Add</button></div>
    </div>
  );
}
