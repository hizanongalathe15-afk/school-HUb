// client/src/components/roles/admin/AdminEventsPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Calendar, Plus, Edit, Trash2, Eye, X, Search, Filter,
  Clock, MapPin, Users, Bell, AlertCircle, CheckCircle,
  RefreshCcw, Download, Upload, Send, MessageCircle,
  Copy, Link, ExternalLink, Save, Image, Video,
  Upload as UploadIcon, Trash2 as TrashIcon, Plus as PlusIcon,
  FileImage, Film, Grid, List, Star, TrendingUp, ChevronLeft, ChevronRight,
  PlayCircle as Youtube, Camera as Instagram, Share2 as Facebook, Send as Twitter, Share2, Eye as EyeIcon,
  Heart, MessageSquare, MoreVertical, Play, Pause, Volume2, VolumeX,
  BookOpen, Activity, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventManagementService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import { confirmationMessages, createConfirmationWithCallback } from '../../../utils/confirmationHelper';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  size: number;
  uploadedAt: string;
  isCover?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: 'academic' | 'sports' | 'cultural' | 'religious' | 'meeting' | 'holiday' | 'exam' | 'other';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  venue: string;
  organizer: string;
  organizerContact: string;
  targetAudience: ('students' | 'teachers' | 'parents' | 'staff' | 'public')[];
  classesInvolved: string[];
  maxAttendees?: number;
  currentRegistrations: number;
  registrationRequired: boolean;
  registrationDeadline?: string;
  registrationLink?: string;
  fee?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  priority: 'high' | 'medium' | 'low';
  coverImage?: string;
  coverVideo?: string;
  mediaGallery: MediaItem[];
  attachments: { name: string; url: string }[];
  reminders: {
    sendEmail: boolean;
    sendSms: boolean;
    sendWhatsapp: boolean;
    daysBefore: number[];
  };
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  published: boolean;
  publishedBy: string;
  publishedAt: string;
  lastUpdated: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  rsvps: {
    student: string[];
    teacher: string[];
    parent: string[];
    staff: string[];
  };
  notes?: string;
}

interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  averageAttendance: number;
  mostPopularEvent: string;
  totalMediaItems: number;
  totalViews: number;
  totalEngagement: number;
}

export default function AdminEventsPage() {
  const confirmation = useConfirmationDialog();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'list'>('grid');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    totalRegistrations: 0,
    averageAttendance: 0,
    mostPopularEvent: '',
    totalMediaItems: 0,
    totalViews: 0,
    totalEngagement: 0
  });

  // Form state for creating/editing events
  const [eventForm, setEventForm] = useState<Partial<Event>>({
    title: '',
    description: '',
    eventType: 'academic',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '16:00',
    location: '',
    venue: '',
    organizer: '',
    organizerContact: '',
    targetAudience: ['students', 'teachers'],
    classesInvolved: [],
    registrationRequired: false,
    status: 'upcoming',
    priority: 'medium',
    mediaGallery: [],
    attachments: [],
    socialLinks: {},
    reminders: {
      sendEmail: true,
      sendSms: false,
      sendWhatsapp: false,
      daysBefore: [1, 3]
    },
    published: false
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventManagementService.getAllEvents({
        search: searchTerm,
        eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: 50
      });
      setEvents(response.events);
      setTotalPages(response.pages);
      setTotalEvents(response.total);
      
      const eventStats = await eventManagementService.getEventStats();
      setStats(eventStats);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, eventTypeFilter, statusFilter]);

  const handleMediaUpload = async (files: FileList, type: 'image' | 'video') => {
    if (!files.length) return;
    
    const validFiles = Array.from(files);
    const newMediaItems: MediaItem[] = [];
    
    for (const file of validFiles) {
      // Validate file size
      const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max ${maxSize / 1024 / 1024}MB`);
        continue;
      }
      
      // Validate file type
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      
      if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image`);
        continue;
      }
      
      if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid video`);
        continue;
      }
      
      setUploadingMedia(true);
      setUploadProgress(0);
      
      try {
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('eventId', editingEvent?.id || 'temp');
        
        const response = await eventManagementService.uploadMedia(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
        
        clearInterval(interval);
        setUploadProgress(100);
        
        // Create preview URL for local display
        const previewUrl = URL.createObjectURL(file);
        
        newMediaItems.push({
          id: response.data.id || Date.now().toString(),
          type,
          url: response.data.url || previewUrl,
          thumbnail: type === 'video' ? response.data.thumbnail : previewUrl,
          title: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          isCover: eventForm.mediaGallery?.length === 0
        });
        
        toast.success(`${file.name} uploaded successfully`);
        
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(error);
      } finally {
        setUploadingMedia(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
    
    // Update form with new media
    setEventForm({
      ...eventForm,
      mediaGallery: [...(eventForm.mediaGallery || []), ...newMediaItems]
    });
  };

  const handleRemoveMedia = (mediaId: string) => {
    setEventForm({
      ...eventForm,
      mediaGallery: eventForm.mediaGallery?.filter(m => m.id !== mediaId) || []
    });
    toast.success('Media removed');
  };

  const handleSetCoverImage = (mediaId: string) => {
    const media = eventForm.mediaGallery?.find(m => m.id === mediaId);
    if (media && media.type === 'image') {
      setEventForm({
        ...eventForm,
        coverImage: media.url,
        mediaGallery: eventForm.mediaGallery?.map(m => ({
          ...m,
          isCover: m.id === mediaId
        })) || []
      });
      toast.success('Cover image set');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.startDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const eventData = {
        ...eventForm,
        publishedBy: 'Admin',
        publishedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        rsvps: { student: [], teacher: [], parent: [], staff: [] },
        currentRegistrations: 0
      };
      await eventManagementService.createEvent(eventData);
      toast.success('Event created successfully');
      fetchEvents();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create event');
      console.error(error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent?.id) return;
    try {
      await eventManagementService.updateEvent(editingEvent.id, eventForm);
      toast.success('Event updated successfully');
      fetchEvents();
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update event');
      console.error(error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const event = events.find(e => e.id === id);
    const confirmOptions = createConfirmationWithCallback(
      confirmationMessages.deleteEvent(event?.title || 'this event'),
      async () => {
        await eventManagementService.deleteEvent(id);
        toast.success('Event deleted successfully');
        fetchEvents();
      }
    );
    await confirmation.confirm(confirmOptions);
  };

  const handlePublishEvent = async (id: string) => {
    try {
      await eventManagementService.publishEvent(id);
      toast.success('Event published successfully');
      fetchEvents();
      setShowPublishModal(false);
    } catch (error) {
      toast.error('Failed to publish event');
    }
  };

  const handleNotifyAttendees = async () => {
    if (!selectedEvent) return;
    try {
      await eventManagementService.sendEventNotifications(selectedEvent.id, {
        type: 'reminder',
        subject: `Reminder: ${selectedEvent.title}`,
        message: `This is a reminder for the upcoming event: ${selectedEvent.title} on ${selectedEvent.startDate} at ${selectedEvent.startTime}. Location: ${selectedEvent.location}`
      });
      toast.success(`Notifications sent to ${selectedEvent.rsvps.student.length + selectedEvent.rsvps.teacher.length + selectedEvent.rsvps.parent.length} attendees`);
      setShowNotifyModal(false);
    } catch (error) {
      toast.error('Failed to send notifications');
    }
  };

  const handleCopyEventLink = (eventId: string) => {
    const link = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(link);
    toast.success('Event link copied to clipboard');
  };

  const handleShareEvent = async (eventId: string, platform: string) => {
    const event = events.find(e => e.id === eventId);
    const url = `${window.location.origin}/events/${eventId}`;
    const text = `Check out this event: ${event?.title}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      await eventManagementService.trackShare(eventId, platform);
      toast.success(`Shared on ${platform}`);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      eventType: 'academic',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '16:00',
      location: '',
      venue: '',
      organizer: '',
      organizerContact: '',
      targetAudience: ['students', 'teachers'],
      classesInvolved: [],
      registrationRequired: false,
      status: 'upcoming',
      priority: 'medium',
      mediaGallery: [],
      attachments: [],
      socialLinks: {},
      reminders: {
        sendEmail: true,
        sendSms: false,
        sendWhatsapp: false,
        daysBefore: [1, 3]
      },
      published: false
    });
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      academic: <BookOpen size={16} />,
      sports: <Activity size={16} />,
      cultural: <Star size={16} />,
      religious: <Heart size={16} />,
      meeting: <Users size={16} />,
      holiday: <Calendar size={16} />,
      exam: <FileText size={16} />
    };
    return icons[type] || <Calendar size={16} />;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      postponed: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.upcoming}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="events-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Event Management</h1>
          <p>Create, manage, and publish school events with full media support (images & videos)</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchEvents} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => { setEditingEvent(null); resetForm(); setShowModal(true); }}>
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <span className="stat-value">{stats.totalEvents}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span className="stat-value">{stats.upcomingEvents}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
        <div className="stat-card">
          <Activity size={20} />
          <div>
            <span className="stat-value">{stats.ongoingEvents}</span>
            <span className="stat-label">Ongoing</span>
          </div>
        </div>
        <div className="stat-card">
          <Image size={20} />
          <div>
            <span className="stat-value">{stats.totalMediaItems}</span>
            <span className="stat-label">Media Items</span>
          </div>
        </div>
        <div className="stat-card">
          <EyeIcon size={20} />
          <div>
            <span className="stat-value">{stats.totalViews}</span>
            <span className="stat-label">Total Views</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search events by title, location, organizer..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="filter-select">
          <option value="all">All Types</option>
          <option value="academic">Academic</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
          <option value="religious">Religious</option>
          <option value="meeting">Meeting</option>
          <option value="holiday">Holiday</option>
          <option value="exam">Exam</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className={`event-card priority-${event.priority}`}>
              {/* Media Preview */}
              {(event.coverImage || event.mediaGallery?.[0]) && (
                <div className="event-media-preview">
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} />
                  ) : event.mediaGallery?.[0]?.type === 'video' ? (
                    <video src={event.mediaGallery[0].url} poster={event.mediaGallery[0].thumbnail} />
                  ) : (
                    <img src={event.mediaGallery?.[0]?.url} alt={event.title} />
                  )}
                  {!event.published && <span className="draft-badge">Draft</span>}
                  {event.mediaGallery && event.mediaGallery.length > 1 && (
                    <span className="media-count-badge">+{event.mediaGallery.length} media</span>
                  )}
                </div>
              )}
              <div className="event-content">
                <div className="event-header">
                  <div className="event-type">
                    {getEventTypeIcon(event.eventType)}
                    <span>{event.eventType}</span>
                  </div>
                  {getPriorityBadge(event.priority)}
                  {getStatusBadge(event.status)}
                </div>
                <h3>{event.title}</h3>
                <p className="event-description">{event.description.substring(0, 100)}...</p>
                <div className="event-details">
                  <div className="detail">
                    <Calendar size={14} />
                    <span>{new Date(event.startDate).toLocaleDateString()} {event.startTime}</span>
                  </div>
                  <div className="detail">
                    <MapPin size={14} />
                    <span>{event.location || event.venue}</span>
                  </div>
                  <div className="detail">
                    <Users size={14} />
                    <span>{event.currentRegistrations} / {event.maxAttendees || 'Unlimited'}</span>
                  </div>
                  <div className="detail engagement-stats">
                    <EyeIcon size={12} /> {event.views}
                    <Heart size={12} /> {event.likes}
                    <MessageSquare size={12} /> {event.comments}
                  </div>
                </div>
                <div className="event-actions">
                  <button onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }} title="View Details">
                    <Eye size={16} /> View
                  </button>
                  <button onClick={() => { setEditingEvent(event); setEventForm(event); setShowModal(true); }} title="Edit">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => handleCopyEventLink(event.id)} title="Copy Link">
                    <Copy size={16} /> Copy Link
                  </button>
                  <button onClick={() => handleShareEvent(event.id, 'whatsapp')} title="Share">
                    <Share2 size={16} /> Share
                  </button>
                  {!event.published && (
                    <button onClick={() => { setSelectedEvent(event); setShowPublishModal(true); }} className="btn-success" title="Publish">
                      <CheckCircle size={16} /> Publish
                    </button>
                  )}
                  <button onClick={() => handleDeleteEvent(event.id)} className="danger" title="Delete">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span>Page {currentPage} of {totalPages} ({totalEvents} events)</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create/Edit Event Modal with Media Support */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingEvent) handleUpdateEvent();
                else handleCreateEvent();
              }}>
                {/* Basic Information */}
                <div className="form-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Event Title *</label>
                      <input 
                        type="text" 
                        value={eventForm.title || ''}
                        onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                        placeholder="Enter event title"
                        required 
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Description *</label>
                      <textarea 
                        rows={4}
                        value={eventForm.description || ''}
                        onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                        placeholder="Detailed description of the event"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Event Type *</label>
                      <select 
                        value={eventForm.eventType}
                        onChange={(e) => setEventForm({...eventForm, eventType: e.target.value as any})}
                      >
                        <option value="academic">Academic</option>
                        <option value="sports">Sports</option>
                        <option value="cultural">Cultural</option>
                        <option value="religious">Religious</option>
                        <option value="meeting">Meeting</option>
                        <option value="holiday">Holiday</option>
                        <option value="exam">Exam</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select 
                        value={eventForm.priority}
                        onChange={(e) => setEventForm({...eventForm, priority: e.target.value as any})}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="form-section">
                  <h4>Date & Time</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input 
                        type="date" 
                        value={eventForm.startDate}
                        onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Time</label>
                      <input 
                        type="time" 
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        value={eventForm.endDate}
                        onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input 
                        type="time" 
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* MEDIA UPLOAD SECTION - IMAGES & VIDEOS */}
                <div className="form-section media-section">
                  <h4>
                    <Image size={18} /> Media Gallery (Images & Videos)
                    <button 
                      type="button" 
                      className="btn-sm btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                    >
                      <UploadIcon size={14} /> Upload Media
                    </button>
                  </h4>
                  
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        const hasVideo = Array.from(e.target.files).some(f => f.type.startsWith('video/'));
                        const hasImage = Array.from(e.target.files).some(f => f.type.startsWith('image/'));
                        if (hasVideo && hasImage) {
                          toast.error('Please upload images and videos separately');
                          return;
                        }
                        handleMediaUpload(e.target.files, hasVideo ? 'video' : 'image');
                      }
                    }}
                  />
                  
                  {uploadingMedia && (
                    <div className="upload-progress">
                      <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      <span>{uploadProgress}% Uploading...</span>
                    </div>
                  )}
                  
                  {/* Media Gallery Preview */}
                  {eventForm.mediaGallery && eventForm.mediaGallery.length > 0 && (
                    <div className="media-gallery">
                      <div className="media-toolbar">
                        <button type="button" onClick={() => setMediaViewMode('grid')} className={mediaViewMode === 'grid' ? 'active' : ''}>
                          <Grid size={14} /> Grid
                        </button>
                        <button type="button" onClick={() => setMediaViewMode('list')} className={mediaViewMode === 'list' ? 'active' : ''}>
                          <List size={14} /> List
                        </button>
                      </div>
                      
                      {mediaViewMode === 'grid' ? (
                        <div className="media-grid">
                          {eventForm.mediaGallery.map((media) => (
                            <div key={media.id} className="media-item">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={media.title} />
                              ) : (
                                <div className="video-thumbnail">
                                  {media.thumbnail ? (
                                    <img src={media.thumbnail} alt={media.title} />
                                  ) : (
                                    <video src={media.url} />
                                  )}
                                  <div className="video-play-icon"><Play size={24} /></div>
                                </div>
                              )}
                              <div className="media-overlay">
                                {media.type === 'image' && (
                                  <button type="button" onClick={() => handleSetCoverImage(media.id)} title="Set as Cover">
                                    <Star size={14} />
                                  </button>
                                )}
                                <button type="button" onClick={() => handleRemoveMedia(media.id)} title="Remove">
                                  <TrashIcon size={14} />
                                </button>
                              </div>
                              {media.isCover && <span className="cover-badge">Cover</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="media-list">
                          {eventForm.mediaGallery.map((media) => (
                            <div key={media.id} className="media-list-item">
                              <div className="media-icon">
                                {media.type === 'image' ? <FileImage size={20} /> : <Film size={20} />}
                              </div>
                              <div className="media-info">
                                <div className="media-title">{media.title || `${media.type}`}</div>
                                <div className="media-meta">{formatFileSize(media.size)}</div>
                              </div>
                              <div className="media-actions">
                                {media.type === 'image' && (
                                  <button type="button" onClick={() => handleSetCoverImage(media.id)}>
                                    <Star size={14} /> {media.isCover ? 'Cover' : 'Set as Cover'}
                                  </button>
                                )}
                                <button type="button" onClick={() => handleRemoveMedia(media.id)} className="danger">
                                  <TrashIcon size={14} /> Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="media-tips">
                    <small>Supported formats: JPG, PNG, GIF, WebP, MP4, MOV. Max image size: 10MB, Max video size: 100MB</small>
                  </div>
                </div>

                {/* Location & Organizer */}
                <div className="form-section">
                  <h4>Location & Organizer</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Venue/Location *</label>
                      <input 
                        type="text" 
                        value={eventForm.location || ''}
                        onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                        placeholder="e.g., School Hall, Field, Online"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Organizer Name</label>
                      <input 
                        type="text" 
                        value={eventForm.organizer || ''}
                        onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
                        placeholder="Person or department organizing"
                      />
                    </div>
                    <div className="form-group">
                      <label>Organizer Contact</label>
                      <input 
                        type="text" 
                        value={eventForm.organizerContact || ''}
                        onChange={(e) => setEventForm({...eventForm, organizerContact: e.target.value})}
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="form-section">
                  <h4>Social Media Links</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><Youtube size={14} /> YouTube</label>
                      <input 
                        type="url" 
                        value={eventForm.socialLinks?.youtube || ''}
                        onChange={(e) => setEventForm({...eventForm, socialLinks: {...eventForm.socialLinks, youtube: e.target.value}})}
                        placeholder="YouTube video URL"
                      />
                    </div>
                    <div className="form-group">
                      <label><Instagram size={14} /> Instagram</label>
                      <input 
                        type="url" 
                        value={eventForm.socialLinks?.instagram || ''}
                        onChange={(e) => setEventForm({...eventForm, socialLinks: {...eventForm.socialLinks, instagram: e.target.value}})}
                        placeholder="Instagram post URL"
                      />
                    </div>
                    <div className="form-group">
                      <label><Facebook size={14} /> Facebook</label>
                      <input 
                        type="url" 
                        value={eventForm.socialLinks?.facebook || ''}
                        onChange={(e) => setEventForm({...eventForm, socialLinks: {...eventForm.socialLinks, facebook: e.target.value}})}
                        placeholder="Facebook event URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div className="form-section">
                  <h4>Target Audience</h4>
                  <div className="checkbox-group">
                    <label><input type="checkbox" checked={eventForm.targetAudience?.includes('students')} onChange={(e) => {
                      const current = eventForm.targetAudience || [];
                      if (e.target.checked) setEventForm({...eventForm, targetAudience: [...current, 'students']});
                      else setEventForm({...eventForm, targetAudience: current.filter(t => t !== 'students')});
                    }} /> Students</label>
                    <label><input type="checkbox" checked={eventForm.targetAudience?.includes('teachers')} onChange={(e) => {
                      const current = eventForm.targetAudience || [];
                      if (e.target.checked) setEventForm({...eventForm, targetAudience: [...current, 'teachers']});
                      else setEventForm({...eventForm, targetAudience: current.filter(t => t !== 'teachers')});
                    }} /> Teachers</label>
                    <label><input type="checkbox" checked={eventForm.targetAudience?.includes('parents')} onChange={(e) => {
                      const current = eventForm.targetAudience || [];
                      if (e.target.checked) setEventForm({...eventForm, targetAudience: [...current, 'parents']});
                      else setEventForm({...eventForm, targetAudience: current.filter(t => t !== 'parents')});
                    }} /> Parents</label>
                    <label><input type="checkbox" checked={eventForm.targetAudience?.includes('staff')} onChange={(e) => {
                      const current = eventForm.targetAudience || [];
                      if (e.target.checked) setEventForm({...eventForm, targetAudience: [...current, 'staff']});
                      else setEventForm({...eventForm, targetAudience: current.filter(t => t !== 'staff')});
                    }} /> Staff</label>
                    <label><input type="checkbox" checked={eventForm.targetAudience?.includes('public')} onChange={(e) => {
                      const current = eventForm.targetAudience || [];
                      if (e.target.checked) setEventForm({...eventForm, targetAudience: [...current, 'public']});
                      else setEventForm({...eventForm, targetAudience: current.filter(t => t !== 'public')});
                    }} /> Public</label>
                  </div>
                </div>

                {/* Registration Settings */}
                <div className="form-section">
                  <h4>Registration Settings</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><input type="checkbox" checked={eventForm.registrationRequired} onChange={(e) => setEventForm({...eventForm, registrationRequired: e.target.checked})} /> Require Registration</label>
                    </div>
                    {eventForm.registrationRequired && (
                      <>
                        <div className="form-group">
                          <label>Max Attendees</label>
                          <input type="number" value={eventForm.maxAttendees || ''} onChange={(e) => setEventForm({...eventForm, maxAttendees: parseInt(e.target.value)})} placeholder="Unlimited" />
                        </div>
                        <div className="form-group">
                          <label>Registration Deadline</label>
                          <input type="date" value={eventForm.registrationDeadline || ''} onChange={(e) => setEventForm({...eventForm, registrationDeadline: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Registration Fee (KES)</label>
                          <input type="number" value={eventForm.fee || ''} onChange={(e) => setEventForm({...eventForm, fee: parseInt(e.target.value)})} placeholder="0 for free" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary"><Save size={16} /> {editingEvent ? 'Update Event' : 'Create Event'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal with Media Viewer */}
      {showDetailsModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.title}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Media Gallery Viewer */}
              {selectedEvent.mediaGallery && selectedEvent.mediaGallery.length > 0 && (
                <div className="event-media-viewer">
                  <div className="featured-media">
                    {selectedEvent.coverImage ? (
                      <img src={selectedEvent.coverImage} alt={selectedEvent.title} />
                    ) : selectedEvent.mediaGallery[0]?.type === 'video' ? (
                      <video controls src={selectedEvent.mediaGallery[0].url} poster={selectedEvent.mediaGallery[0].thumbnail} />
                    ) : (
                      <img src={selectedEvent.mediaGallery[0].url} alt={selectedEvent.title} />
                    )}
                  </div>
                  {selectedEvent.mediaGallery.length > 1 && (
                    <div className="media-thumbnails">
                      {selectedEvent.mediaGallery.map((media, idx) => (
                        <div key={media.id} className="thumbnail" onClick={() => setSelectedMedia(media)}>
                          {media.type === 'image' ? (
                            <img src={media.url} alt={`Media ${idx + 1}`} />
                          ) : (
                            <div className="video-thumb">
                              <img src={media.thumbnail || media.url} alt="" />
                              <Play size={16} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="event-detail-grid">
                <div className="detail-item">
                  <Calendar size={18} />
                  <div><strong>Date & Time</strong><p>{new Date(selectedEvent.startDate).toLocaleDateString()} {selectedEvent.startTime} - {new Date(selectedEvent.endDate).toLocaleDateString()} {selectedEvent.endTime}</p></div>
                </div>
                <div className="detail-item">
                  <MapPin size={18} />
                  <div><strong>Location</strong><p>{selectedEvent.location || selectedEvent.venue}</p></div>
                </div>
                <div className="detail-item">
                  <Users size={18} />
                  <div><strong>Organizer</strong><p>{selectedEvent.organizer} - {selectedEvent.organizerContact}</p></div>
                </div>
                <div className="detail-item full-width">
                  <strong>Description</strong>
                  <p>{selectedEvent.description}</p>
                </div>
                <div className="detail-item">
                  <strong>Target Audience</strong>
                  <p>{selectedEvent.targetAudience?.join(', ')}</p>
                </div>
                <div className="detail-item">
                  <strong>Registration</strong>
                  <p>{selectedEvent.registrationRequired ? `Required - ${selectedEvent.currentRegistrations}/${selectedEvent.maxAttendees || 'Unlimited'} registered` : 'Not required'}</p>
                </div>
                <div className="detail-item">
                  <strong>Engagement</strong>
                  <p><EyeIcon size={14} /> {selectedEvent.views} views • <Heart size={14} /> {selectedEvent.likes} likes • <MessageSquare size={14} /> {selectedEvent.comments} comments • <Share2 size={14} /> {selectedEvent.shares} shares</p>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => handleCopyEventLink(selectedEvent.id)}><Copy size={16} /> Copy Link</button>
                <button className="btn-secondary" onClick={() => handleShareEvent(selectedEvent.id, 'whatsapp')}><Share2 size={16} /> Share</button>
                <button className="btn-primary" onClick={() => { setSelectedEvent(selectedEvent); setShowNotifyModal(true); setShowDetailsModal(false); }}><Bell size={16} /> Send Notifications</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Publish Event</h3>
              <button className="close-btn" onClick={() => setShowPublishModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to publish "<strong>{selectedEvent.title}</strong>"?</p>
              <p>Once published, the event will be visible to all targeted audiences on the portal and mobile app.</p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowPublishModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => handlePublishEvent(selectedEvent.id)}><CheckCircle size={16} /> Publish Event</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Notifications Modal */}
      {showNotifyModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowNotifyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Event Notifications</h3>
              <button className="close-btn" onClick={() => setShowNotifyModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Send reminders for "<strong>{selectedEvent.title}</strong>" to:</p>
              <ul className="notify-list">
                <li>✓ {selectedEvent.rsvps?.student?.length || 0} Students</li>
                <li>✓ {selectedEvent.rsvps?.teacher?.length || 0} Teachers</li>
                <li>✓ {selectedEvent.rsvps?.parent?.length || 0} Parents</li>
                <li>✓ {selectedEvent.rsvps?.staff?.length || 0} Staff</li>
              </ul>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowNotifyModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleNotifyAttendees}><Send size={16} /> Send Notifications</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
