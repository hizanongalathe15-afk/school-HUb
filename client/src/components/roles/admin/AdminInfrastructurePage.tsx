// client/src/components/roles/admin/AdminInfrastructurePage.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Building2, Camera, Edit, Film, Plus, RefreshCw, Save, Trash2, Upload, Search,
  Image, Video, X, Check, AlertCircle, MapPin, Users, Calendar,
  Wrench, DollarSign, User, FileText, Grid, List, Eye, EyeOff,
  Copy, Link, ExternalLink, Download, Printer, Share2, Heart,
  Star, Trophy, Award, Clock, Settings, MoreVertical, Move,
  Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, RotateCcw,
  ZoomIn, ZoomOut, Navigation, Compass, FolderTree, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { infrastructureService } from '../../../services/adminService';
import type { MaintenanceLog } from '../../../types/admin';
import { fileToDataUrl } from '../../../utils/fileToDataUrl';

type Condition = 'excellent' | 'good' | 'fair' | 'poor';

interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'tour';
  url: string;
  thumbnail?: string;
  title: string;
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  condition: Condition;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  photos: MediaAsset[];
  videos: MediaAsset[];
  tours: MediaAsset[];
  lastMaintenance?: string;
  nextMaintenance?: string;
  assets: Array<{ name: string; quantity: number; condition: string; purchaseDate?: string }>;
  staff: Array<{ name: string; role: string; phone?: string }>;
  operatingHours: { open: string; close: string; days: string };
  isPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const emptyFacility: Omit<Facility, 'id'> = {
  name: '',
  type: 'building',
  capacity: 0,
  condition: 'good',
  description: '',
  location: '',
  photos: [],
  videos: [],
  tours: [],
  assets: [],
  staff: [],
  operatingHours: { open: '08:00', close: '17:00', days: 'Monday-Friday' },
  isPublic: true,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const facilityTypes = ['building', 'classroom', 'lab', 'library', 'hall', 'dormitory', 'field', 'kitchen', 'clinic', 'office', 'sports', 'chapel', 'canteen', 'hostel', 'other'];
const conditions: Condition[] = ['excellent', 'good', 'fair', 'poor'];

export default function AdminInfrastructurePage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'maintenance' | 'public'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [form, setForm] = useState<Omit<Facility, 'id'>>(emptyFacility);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [maintenanceForm, setMaintenanceForm] = useState({ description: '', cost: 0, performedBy: '', nextDue: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await infrastructureService.getData();
      setFacilities((data.facilities || []).map((facility: any) => ({
        ...facility,
        condition: conditions.includes(facility.condition) ? facility.condition : 'good',
        photos: facility.photos || [],
        videos: facility.videos || [],
        tours: facility.tours || [],
        assets: facility.assets || [],
        staff: facility.staff || [],
        isPublic: facility.isPublic !== false,
        displayOrder: facility.displayOrder || 0
      })));
      setMaintenanceLogs(data.maintenanceLogs || []);
    } catch (error) {
      toast.error('Failed to load infrastructure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalCapacity = facilities.reduce((sum, f) => sum + Number(f.capacity || 0), 0);
    const needsMaintenance = facilities.filter(f => f.condition === 'fair' || f.condition === 'poor').length;
    const totalMedia = facilities.reduce((sum, f) => sum + (f.photos?.length || 0) + (f.videos?.length || 0) + (f.tours?.length || 0), 0);
    const publicCount = facilities.filter(f => f.isPublic).length;
    const conditionCounts = conditions.reduce<Record<Condition, number>>((acc, condition) => {
      acc[condition] = facilities.filter(f => f.condition === condition).length;
      return acc;
    }, { excellent: 0, good: 0, fair: 0, poor: 0 });
    return { totalCapacity, needsMaintenance, totalMedia, publicCount, conditionCounts };
  }, [facilities]);

  const handleMediaUpload = async (files: FileList | null, type: 'image' | 'video' | 'tour') => {
    if (!files?.length) return;
    setUploadingMedia(true);
    setUploadProgress(0);
    
    const newMedia: MediaAsset[] = [];
    const filesArray = Array.from(files);
    
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const progress = ((i + 1) / filesArray.length) * 100;
      setUploadProgress(progress);
      
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if ((type === 'video' || type === 'tour') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video`);
        continue;
      }
      if (file.size > 10_000_000) {
        toast.error(`${file.name} is too large. Max 10MB`);
        continue;
      }
      
      try {
        const dataUrl = await fileToDataUrl(file);
        newMedia.push({
          id: Date.now() + i + '',
          type,
          url: dataUrl,
          thumbnail: type === 'video' ? dataUrl : undefined,
          title: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          isPrimary: (type === 'image' && form.photos?.length === 0 && i === 0)
        });
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    if (type === 'image') setForm({ ...form, photos: [...(form.photos || []), ...newMedia] });
    if (type === 'video') setForm({ ...form, videos: [...(form.videos || []), ...newMedia] });
    if (type === 'tour') setForm({ ...form, tours: [...(form.tours || []), ...newMedia] });
    
    setUploadingMedia(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success(`${newMedia.length} file(s) uploaded`);
  };

  const handleRemoveMedia = (mediaId: string, type: 'image' | 'video' | 'tour') => {
    if (type === 'image') setForm({ ...form, photos: form.photos?.filter(p => p.id !== mediaId) || [] });
    if (type === 'video') setForm({ ...form, videos: form.videos?.filter(v => v.id !== mediaId) || [] });
    if (type === 'tour') setForm({ ...form, tours: form.tours?.filter(t => t.id !== mediaId) || [] });
    toast.success('Media removed');
  };

  const handleSetPrimary = (mediaId: string, type: 'image' | 'video') => {
    if (type === 'image') {
      setForm({
        ...form,
        photos: form.photos?.map(p => ({ ...p, isPrimary: p.id === mediaId })) || []
      });
    }
    toast.success('Primary media set');
  };

  const saveFacility = async () => {
    if (!form.name.trim()) {
      toast.error('Facility name is required');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      type: form.type,
      capacity: Number(form.capacity || 0),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingFacility) {
        await infrastructureService.updateFacility(editingFacility.id, payload);
        toast.success('Facility updated successfully');
      } else {
        await infrastructureService.createFacility(payload);
        toast.success('Facility created successfully');
      }
      setEditingFacility(null);
      setForm(emptyFacility);
      await loadData();
      setActiveTab('facilities');
    } catch (error) {
      toast.error('Failed to save facility');
    }
  };

  const deleteFacility = async (facility: Facility) => {
    if (!confirm(`Delete "${facility.name}"? This will remove all associated media and maintenance logs.`)) return;
    try {
      await infrastructureService.deleteFacility(facility.id);
      toast.success('Facility deleted');
      await loadData();
    } catch (error) {
      toast.error('Failed to delete facility');
    }
  };

  const togglePublicStatus = async (facility: Facility) => {
    try {
      await infrastructureService.updateFacility(facility.id, { isPublic: !facility.isPublic });
      toast.success(`Facility is now ${!facility.isPublic ? 'visible to' : 'hidden from'} public`);
      await loadData();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const saveMaintenance = async () => {
    if (!selectedFacilityId || !maintenanceForm.description.trim()) {
      toast.error('Select a facility and enter maintenance details');
      return;
    }
    try {
      await infrastructureService.addMaintenanceLog({
        facilityId: selectedFacilityId,
        date: new Date().toISOString(),
        ...maintenanceForm
      });
      toast.success('Maintenance log added');
      setMaintenanceForm({ description: '', cost: 0, performedBy: '', nextDue: '' });
      await loadData();
    } catch (error) {
      toast.error('Failed to add maintenance log');
    }
  };

  const getConditionIcon = (condition: Condition) => {
    const icons: Record<Condition, JSX.Element> = {
      excellent: <Trophy size={14} />,
      good: <Star size={14} />,
      fair: <AlertCircle size={14} />,
      poor: <AlertCircle size={14} />
    };
    return icons[condition];
  };

  const getConditionColor = (condition: Condition) => {
    const colors: Record<Condition, string> = {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      poor: '#ef4444'
    };
    return colors[condition];
  };

  const renderMediaPreview = (facility: Facility, size: 'small' | 'large' = 'small') => {
    const primaryImage = facility.photos?.find(p => p.isPrimary) || facility.photos?.[0];
    const primaryVideo = facility.videos?.[0];
    
    if (primaryImage) return <img src={primaryImage.url} alt={facility.name} />;
    if (primaryVideo) return <video src={primaryVideo.url} poster={primaryVideo.thumbnail} muted />;
    return <Building2 size={size === 'large' ? 48 : 32} />;
  };

  const filteredFacilities = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                         f.description?.toLowerCase().includes(search.toLowerCase()) ||
                         f.location?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesCondition = conditionFilter === 'all' || f.condition === conditionFilter;
    const matchesPublic = publicFilter === 'all' || 
                         (publicFilter === 'public' && f.isPublic) ||
                         (publicFilter === 'private' && !f.isPublic);
    return matchesSearch && matchesType && matchesCondition && matchesPublic;
  });

  if (loading) {
    return <div className="infra-page"><div className="infra-loader"><div className="spinner"></div><p>Loading infrastructure...</p></div></div>;
  }

  return (
    <div className="infra-page">
      {/* Header */}
      <header className="infra-header">
        <div>
          <h1><Building2 size={28} /> Infrastructure Management</h1>
          <p>Manage school facilities, upload media, track maintenance, and control public visibility</p>
        </div>
        <div className="infra-header-actions">
          <button onClick={loadData} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={() => { setEditingFacility(null); setForm(emptyFacility); setActiveTab('facilities'); }} className="btn-primary">
            <Plus size={16} /> Add Facility
          </button>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="infra-stats">
        <div className="stat"><Building2 size={20} /><div><span>{facilities.length}</span><label>Facilities</label></div></div>
        <div className="stat"><Users size={20} /><div><span>{stats.totalCapacity}</span><label>Total Capacity</label></div></div>
        <div className="stat"><Wrench size={20} /><div><span>{stats.needsMaintenance}</span><label>Needs Maintenance</label></div></div>
        <div className="stat"><Camera size={20} /><div><span>{stats.totalMedia}</span><label>Media Files</label></div></div>
        <div className="stat"><Eye size={20} /><div><span>{stats.publicCount}</span><label>Public Visible</label></div></div>
      </div>

      {/* Tabs */}
      <nav className="infra-tabs">
        {['overview', 'facilities', 'maintenance', 'public'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab as any)}>
            {tab === 'overview' && '📊 Overview'}
            {tab === 'facilities' && '🏛️ Facilities'}
            {tab === 'maintenance' && '🔧 Maintenance'}
            {tab === 'public' && '🌐 Public Preview'}
          </button>
        ))}
      </nav>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="infra-condition-section">
            <h2>Facility Conditions</h2>
            <div className="condition-bars">
              {conditions.map(condition => {
                const count = stats.conditionCounts[condition];
                const percent = facilities.length ? (count / facilities.length) * 100 : 0;
                return (
                  <div key={condition} className="condition-bar">
                    <div className="condition-label">{getConditionIcon(condition)} {condition}</div>
                    <div className="bar"><div style={{ width: `${percent}%`, backgroundColor: getConditionColor(condition) }} /></div>
                    <span>{count} ({Math.round(percent)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="infra-recent">
            <h2>Recently Added Facilities</h2>
            <div className="recent-grid">
              {facilities.slice(0, 4).map(f => (
                <div key={f.id} className="recent-card" onClick={() => { setSelectedFacility(f); setShowDetailsModal(true); }}>
                  <div className="recent-media">{renderMediaPreview(f)}</div>
                  <div><strong>{f.name}</strong><small>{f.type}</small></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Facilities Tab */}
      {activeTab === 'facilities' && (
        <>
          {/* Filters */}
          <div className="infra-filters">
            <div className="search-box"><Search size={16} /><input type="text" placeholder="Search facilities..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">All Types</option>{facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}><option value="all">All Conditions</option>{conditions.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={publicFilter} onChange={e => setPublicFilter(e.target.value)}><option value="all">All Visibility</option><option value="public">Public</option><option value="private">Private</option></select>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="view-toggle">{viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}</button>
          </div>

          <div className="infra-workspace">
            {/* Edit Form Panel */}
            <aside className="infra-editor">
              <h2>{editingFacility ? '✏️ Edit Facility' : '➕ Add Facility'}</h2>
              <div className="editor-form">
                <div className="form-group"><label>Facility Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Science Laboratory" /></div>
                <div className="form-row"><div className="form-group"><label>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} /></div></div>
                <div className="form-row"><div className="form-group"><label>Condition</label><select value={form.condition} onChange={e => setForm({...form, condition: e.target.value as Condition})}>{conditions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Building/Floor/Room" /></div></div>
                <div className="form-group"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed description, features, accessibility..." /></div>
                
                {/* Media Upload Section */}
                <div className="media-upload-section">
                  <label>📸 Images & Videos</label>
                  <div className="upload-buttons">
                    <button type="button" className="btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Upload Images</button>
                    <button type="button" className="btn-sm" onClick={() => fileInputRef.current?.click()}><Video size={14} /> Upload Videos</button>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files) {
                      const hasVideo = Array.from(e.target.files).some(f => f.type.startsWith('video/'));
                      handleMediaUpload(e.target.files, hasVideo ? 'video' : 'image');
                    }
                  }} />
                  {uploadingMedia && <div className="upload-progress"><div className="progress-bar" style={{ width: `${uploadProgress}%` }} /><span>{uploadProgress}%</span></div>}
                  
                  {/* Image Gallery Preview */}
                  {form.photos && form.photos.length > 0 && (
                    <div className="media-gallery">
                      <h4>Images ({form.photos.length})</h4>
                      <div className="media-grid">
                        {form.photos.map(media => (
                          <div key={media.id} className="media-item">
                            <img src={media.url} alt={media.title} />
                            {media.isPrimary && <span className="primary-badge">Primary</span>}
                            <div className="media-overlay">
                              <button onClick={() => handleSetPrimary(media.id, 'image')} title="Set as Primary"><Star size={14} /></button>
                              <button onClick={() => handleRemoveMedia(media.id, 'image')} className="danger"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Video Gallery Preview */}
                  {form.videos && form.videos.length > 0 && (
                    <div className="media-gallery">
                      <h4>Videos ({form.videos.length})</h4>
                      <div className="media-grid">
                        {form.videos.map(media => (
                          <div key={media.id} className="media-item video-item">
                            <video src={media.url} poster={media.thumbnail} />
                            <div className="media-overlay">
                              <button onClick={() => handleRemoveMedia(media.id, 'video')} className="danger"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Public Visibility Toggle */}
                <div className="form-group visibility-toggle">
                  <label><input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} /> Show on Public Website</label>
                  <small>When enabled, this facility appears on the public infrastructure page</small>
                </div>

                <button onClick={saveFacility} className="btn-primary"><Save size={16} /> {editingFacility ? 'Update Facility' : 'Create Facility'}</button>
              </div>
            </aside>

            {/* Facilities List/Grid */}
            <div className={`infra-list ${viewMode}`}>
              {filteredFacilities.map(facility => (
                <div key={facility.id} className={`facility-card ${!facility.isPublic ? 'private' : ''}`}>
                  <div className="facility-media">{renderMediaPreview(facility)}</div>
                  <div className="facility-info">
                    <div className="facility-header">
                      <h3>{facility.name}</h3>
                      <div className="facility-badges">
                        <span className={`condition-badge ${facility.condition}`}>{getConditionIcon(facility.condition)} {facility.condition}</span>
                        {!facility.isPublic && <span className="private-badge"><EyeOff size={12} /> Private</span>}
                      </div>
                    </div>
                    <p className="facility-type">{facility.type} | Capacity: {facility.capacity} | {facility.location || 'Location not set'}</p>
                    <p className="facility-desc">{facility.description?.substring(0, 100)}...</p>
                    <div className="facility-meta">
                      <Camera size={12} /> {facility.photos?.length || 0} images
                      <Video size={12} /> {facility.videos?.length || 0} videos
                    </div>
                  </div>
                  <div className="facility-actions">
                    <button onClick={() => togglePublicStatus(facility)} title={facility.isPublic ? 'Hide from public' : 'Show to public'}>
                      {facility.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => { setEditingFacility(facility); setForm(facility); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => { setSelectedFacility(facility); setShowDetailsModal(true); }} title="View Details"><Eye size={16} /></button>
                    <button onClick={() => deleteFacility(facility)} className="danger" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {filteredFacilities.length === 0 && <div className="infra-empty">No facilities found. Create your first facility!</div>}
            </div>
          </div>
        </>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="maintenance-workspace">
          <aside className="infra-editor">
            <h2>🔧 Add Maintenance Log</h2>
            <div className="form-group"><label>Facility</label><select value={selectedFacilityId} onChange={e => setSelectedFacilityId(e.target.value)}><option value="">Select facility</option>{facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
            <div className="form-group"><label>Description</label><textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} rows={3} /></div>
            <div className="form-row"><div className="form-group"><label>Cost (KES)</label><input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: parseInt(e.target.value)})} /></div>
            <div className="form-group"><label>Performed By</label><input value={maintenanceForm.performedBy} onChange={e => setMaintenanceForm({...maintenanceForm, performedBy: e.target.value})} /></div></div>
            <div className="form-group"><label>Next Due Date</label><input type="date" value={maintenanceForm.nextDue} onChange={e => setMaintenanceForm({...maintenanceForm, nextDue: e.target.value})} /></div>
            <button onClick={saveMaintenance} className="btn-primary"><Save size={16} /> Add Log</button>
          </aside>
          <div className="maintenance-list">
            <h3>Recent Maintenance Logs</h3>
            {maintenanceLogs.map(log => {
              const facility = facilities.find(f => f.id === log.facilityId);
              return (
                <div key={log.id} className="maintenance-card">
                  <div><strong>{facility?.name || 'Unknown'}</strong><p>{log.description}</p><small>💰 {log.cost.toLocaleString()} KES | 👤 {log.performedBy || 'Unknown'} | 📅 {log.nextDue ? `Next: ${new Date(log.nextDue).toLocaleDateString()}` : 'No schedule'}</small></div>
                </div>
              );
            })}
            {maintenanceLogs.length === 0 && <div className="infra-empty">No maintenance logs yet.</div>}
          </div>
        </div>
      )}

      {/* Public Preview Tab */}
      {activeTab === 'public' && (
        <div className="public-preview">
          <div className="preview-header">
            <h2>🌐 Public Infrastructure Page Preview</h2>
            <a href="/infrastructure" target="_blank" rel="noopener noreferrer" className="btn-primary"><ExternalLink size={16} /> Open Public Page</a>
          </div>
          <div className="preview-grid">
            {facilities.filter(f => f.isPublic).map(facility => (
              <div key={facility.id} className="preview-card">
                <div className="preview-media">{renderMediaPreview(facility, 'large')}</div>
                <h3>{facility.name}</h3>
                <p>{facility.description?.substring(0, 80)}...</p>
                <span className={`condition-badge ${facility.condition}`}>{facility.condition}</span>
              </div>
            ))}
            {facilities.filter(f => f.isPublic).length === 0 && <div className="infra-empty">No public facilities. Toggle visibility to show facilities publicly.</div>}
          </div>
        </div>
      )}

      {/* Facility Details Modal */}
      {showDetailsModal && selectedFacility && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{selectedFacility.name}</h3><button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="detail-media-grid">
                {selectedFacility.photos?.slice(0, 4).map(photo => <img key={photo.id} src={photo.url} alt={photo.title} />)}
              </div>
              <div className="detail-info"><p><strong>Type:</strong> {selectedFacility.type}</p><p><strong>Capacity:</strong> {selectedFacility.capacity}</p><p><strong>Location:</strong> {selectedFacility.location || 'Not specified'}</p><p><strong>Condition:</strong> <span className={`condition-badge ${selectedFacility.condition}`}>{selectedFacility.condition}</span></p><p><strong>Description:</strong> {selectedFacility.description}</p><p><strong>Public:</strong> {selectedFacility.isPublic ? '✅ Visible' : '❌ Hidden'}</p></div>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button><button className="btn-primary" onClick={() => { setEditingFacility(selectedFacility); setForm(selectedFacility); setShowDetailsModal(false); }}><Edit size={16} /> Edit</button></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .infra-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .infra-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .infra-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
        .infra-header-actions { display: flex; gap: 12px; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-sm { padding: 4px 8px; font-size: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; }
        .infra-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat span { font-size: 24px; font-weight: 700; display: block; }
        .stat label { font-size: 12px; color: #64748b; }
        .infra-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .infra-tabs button { padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 500; color: #64748b; }
        .infra-tabs button.active { color: #1d8a8a; border-bottom: 2px solid #1d8a8a; }
        .infra-condition-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .condition-bars { margin-top: 16px; }
        .condition-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .condition-label { width: 80px; display: flex; align-items: center; gap: 4px; }
        .bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .bar div { height: 100%; transition: width 0.3s; }
        .infra-filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .infra-workspace { display: flex; gap: 24px; flex-wrap: wrap; }
        .infra-editor { width: 380px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: sticky; top: 20px; align-self: flex-start; max-height: calc(100vh - 40px); overflow-y: auto; }
        .editor-form { display: flex; flex-direction: column; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-group label { font-size: 12px; font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .media-upload-section { border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .upload-buttons { display: flex; gap: 8px; margin: 8px 0; }
        .upload-progress { background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin: 8px 0; }
        .upload-progress .progress-bar { background: #1d8a8a; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; transition: width 0.3s; }
        .media-gallery { margin-top: 12px; }
        .media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
        .media-item { position: relative; aspect-ratio: 1; background: #f1f5f9; border-radius: 8px; overflow: hidden; }
        .media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; }
        .primary-badge { position: absolute; top: 4px; left: 4px; background: #f59e0b; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; }
        .media-overlay { position: absolute; top: 0; right: 0; left: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: flex-end; gap: 4px; padding: 4px; opacity: 0; transition: opacity 0.2s; }
        .media-item:hover .media-overlay { opacity: 1; }
        .media-overlay button { background: white; border: none; border-radius: 4px; padding: 4px; cursor: pointer; }
        .media-overlay button.danger { color: #ef4444; }
        .visibility-toggle { flex-direction: row; align-items: center; gap: 8px; }
        .infra-list { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .infra-list.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; }
        .facility-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; transition: transform 0.2s; }
        .infra-list.grid .facility-card { flex-direction: column; }
        .infra-list.list .facility-card { flex-direction: row; }
        .facility-card.private { background: #fef2f2; border: 1px solid #fecaca; }
        .facility-media { width: 120px; height: 120px; background: #f1f5f9; overflow: hidden; flex-shrink: 0; }
        .infra-list.grid .facility-media { width: 100%; height: 180px; }
        .facility-media img, .facility-media video { width: 100%; height: 100%; object-fit: cover; }
        .facility-info { flex: 1; padding: 12px; }
        .facility-header { display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .facility-header h3 { margin: 0; font-size: 16px; }
        .facility-badges { display: flex; gap: 6px; }
        .condition-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; text-transform: uppercase; }
        .condition-badge.excellent { background: #dcfce7; color: #166534; }
        .condition-badge.good { background: #dbeafe; color: #1e40af; }
        .condition-badge.fair { background: #fef3c7; color: #92400e; }
        .condition-badge.poor { background: #fee2e2; color: #991b1b; }
        .private-badge { display: inline-flex; align-items: center; gap: 4px; background: #e2e8f0; padding: 2px 6px; border-radius: 12px; font-size: 10px; }
        .facility-type { font-size: 12px; color: #64748b; margin: 4px 0; }
        .facility-desc { font-size: 12px; color: #475569; margin: 8px 0; }
        .facility-meta { display: flex; gap: 12px; font-size: 11px; color: #64748b; margin-top: 8px; }
        .facility-actions { display: flex; gap: 6px; padding: 12px; border-left: 1px solid #e2e8f0; flex-direction: column; }
        .infra-list.grid .facility-actions { flex-direction: row; border-left: none; border-top: 1px solid #e2e8f0; }
        .facility-actions button { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; color: #64748b; }
        .facility-actions button:hover { background: #f1f5f9; }
        .facility-actions button.danger:hover { background: #fee2e2; color: #ef4444; }
        .maintenance-workspace { display: flex; gap: 24px; flex-wrap: wrap; }
        .maintenance-list { flex: 1; }
        .maintenance-card { background: white; border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .public-preview { background: white; border-radius: 12px; padding: 20px; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .preview-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .preview-media { height: 160px; overflow: hidden; }
        .preview-card h3 { padding: 12px 12px 0; margin: 0; font-size: 16px; }
        .preview-card p { padding: 8px 12px; font-size: 12px; color: #64748b; }
        .preview-card .condition-badge { margin: 0 12px 12px; display: inline-block; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-large { width: 600px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .detail-media-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
        .detail-media-grid img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; }
        .detail-info p { margin: 8px 0; font-size: 13px; }
        .infra-loader { text-align: center; padding: 60px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .infra-empty { text-align: center; padding: 40px; color: #64748b; }
        .recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
        .recent-card { background: white; border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .recent-card:hover { transform: translateY(-2px); }
        .recent-media { height: 120px; overflow: hidden; }
        .recent-card div { padding: 8px; }
        .recent-card strong { display: block; }
        .recent-card small { font-size: 11px; color: #64748b; }
      `}</style>
    </div>
  );
}