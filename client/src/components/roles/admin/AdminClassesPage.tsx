// client/src/components/roles/admin/AdminClassesPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, RefreshCcw, X, Users, BookOpen,
  Upload, Image, Camera, Mail, Phone, Calendar, Clock, Award,
  TrendingUp, BarChart3, PieChart, Activity, Zap, Shield,
  UserPlus, UserMinus, Copy, Archive, Settings, Bell, Filter,
  ChevronLeft, ChevronRight, Grid, List, Download, Printer,
  GraduationCap, School, MapPin, DollarSign, Star, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService, userManagementService } from '../../../services/adminService';
import type { AcademicClass, Stream, Student, Teacher } from '../../../types/admin';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

interface ClassWithDetails extends AcademicClass {
  streams: Stream[];
  students: Student[];
  teachers: Teacher[];
  averagePerformance: number;
  attendanceRate: number;
}

export default function AdminClassesPage() {
  const confirmation = useConfirmationDialog();
  
  // State Management
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'details'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Form state
  const [form, setForm] = useState<Partial<AcademicClass>>({
    name: '', level: 1, capacity: 40, classTeacherId: '', 
    streamIds: [], description: '', room: '', color: '#667eea',
    coverImage: '', academicYear: new Date().getFullYear().toString()
  });

  const [streamForm, setStreamForm] = useState<Partial<Stream>>({
    name: '', code: '', capacity: 20, classId: ''
  });

  const [studentForm, setStudentForm] = useState({
    studentId: '', name: '', email: '', phone: ''
  });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await academicManagementService.getClasses({
        search: searchTerm || undefined,
        level: levelFilter !== 'all' ? parseInt(levelFilter) : undefined,
        page: currentPage
      });
      setClasses(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      toast.error('Failed to load classes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [currentPage, searchTerm, levelFilter]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    try {
      const imageUrl = await academicManagementService.uploadClassImage(file);
      setForm({ ...form, coverImage: imageUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleCreateClass = async () => {
    if (!form.name) {
      toast.error('Class name is required');
      return;
    }
    try {
      await academicManagementService.createClass(form);
      toast.success('Class created successfully');
      fetchClasses();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass?.id) return;
    try {
      await academicManagementService.updateClass(editingClass.id, form);
      toast.success('Class updated successfully');
      fetchClasses();
      setShowModal(false);
      setEditingClass(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    const classData = classes.find(c => c.id === id);
    if (classData?.students?.length) {
      toast.error(`Cannot delete: ${classData.students.length} students still enrolled`);
      return;
    }
    
    const confirmOptions = {
      title: 'Delete Class',
      message: `Are you sure you want to delete ${classData?.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger' as const,
    };

    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await academicManagementService.deleteClass(id);
        toast.success('Class deleted successfully');
        fetchClasses();
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  const handleCreateStream = async () => {
    if (!streamForm.name || !selectedClass) return;
    try {
      await academicManagementService.createStream({
        ...streamForm,
        classId: selectedClass.id
      });
      toast.success('Stream created successfully');
      fetchClasses();
      setShowStreamModal(false);
      setStreamForm({ name: '', code: '', capacity: 20, classId: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create stream');
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    const confirmOptions = {
      title: 'Delete Stream',
      message: 'Are you sure you want to delete this stream?',
      confirmText: 'Delete',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await academicManagementService.deleteStream(streamId);
        toast.success('Stream deleted');
        fetchClasses();
      } catch (error) {
        toast.error('Failed to delete stream');
      }
    }
  };

  const handleAddStudent = async () => {
    if (!studentForm.studentId || !selectedClass) return;
    try {
      await academicManagementService.addStudentToClass(selectedClass.id, studentForm.studentId);
      toast.success('Student added to class');
      fetchClasses();
      setShowStudentModal(false);
      setStudentForm({ studentId: '', name: '', email: '', phone: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    const confirmOptions = {
      title: 'Remove Student',
      message: 'Remove this student from the class?',
      confirmText: 'Remove',
      type: 'warning' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await academicManagementService.removeStudentFromClass(selectedClass.id, studentId);
        toast.success('Student removed');
        fetchClasses();
      } catch (error) {
        toast.error('Failed to remove student');
      }
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    if (!selectedClass) return;
    try {
      await academicManagementService.assignClassTeacher(selectedClass.id, teacherId);
      toast.success('Teacher assigned');
      fetchClasses();
      setShowTeacherModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign teacher');
    }
  };

  const resetForm = () => {
    setForm({
      name: '', level: 1, capacity: 40, classTeacherId: '',
      streamIds: [], description: '', room: '', color: '#667eea',
      coverImage: '', academicYear: new Date().getFullYear().toString()
    });
    setCoverImagePreview('');
    setCoverImage(null);
  };

  const getLevelColor = (level: number) => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
    return colors[level - 1] || '#667eea';
  };

  const getClassStats = (cls: ClassWithDetails) => {
    const totalStudents = cls.students?.length || 0;
    const totalStreams = cls.streams?.length || 0;
    const capacityPercentage = (totalStudents / (cls.capacity || 1)) * 100;
    return { totalStudents, totalStreams, capacityPercentage };
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="classes-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><School size={24} /> Classes & Streams Management</h2>
          <p>Manage academic classes, streams, student enrollment, and teacher assignments</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={16} /> Grid</button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /> List</button>
          </div>
          <button className="btn btn-secondary" onClick={fetchClasses} disabled={loading}><RefreshCcw size={16} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => { setEditingClass(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Class</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search classes by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}><option value="all">All Levels</option><option value="1">Form 1</option><option value="2">Form 2</option><option value="3">Form 3</option><option value="4">Form 4</option></select>
        <select value={streamFilter} onChange={e => setStreamFilter(e.target.value)}><option value="all">All Streams</option><option value="has">Has Streams</option><option value="none">No Streams</option></select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading classes...</p></div>
      ) : viewMode === 'grid' ? (
        <div className="classes-grid">
          {filteredClasses.map((cls) => {
            const stats = getClassStats(cls);
            return (
              <div key={cls.id} className="class-card" style={{ borderTopColor: getLevelColor(cls.level) }}>
                <div className="card-cover">
                  {cls.coverImage ? <img src={cls.coverImage} alt={cls.name} /> : <div className="cover-placeholder"><School size={32} /></div>}
                  <div className="card-level" style={{ background: getLevelColor(cls.level) }}>Form {cls.level}</div>
                </div>
                <div className="card-body">
                  <h3>{cls.name}</h3>
                  <p className="class-room">{cls.room ? `📍 ${cls.room}` : '📍 Room not assigned'}</p>
                  <div className="card-stats">
                    <div className="stat"><Users size={14} /> {stats.totalStudents}/{cls.capacity} Students</div>
                    <div className="stat"><BookOpen size={14} /> {stats.totalStreams} Streams</div>
                    <div className="stat"><Award size={14} /> {cls.averagePerformance || 0}% Avg</div>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${stats.capacityPercentage}%`, background: getLevelColor(cls.level) }} /></div>
                  <div className="card-actions">
                    <button onClick={() => { setSelectedClass(cls); setViewMode('details'); }}><Eye size={14} /> View</button>
                    <button onClick={() => { setEditingClass(cls); setForm(cls); setShowModal(true); }}><Edit size={14} /> Edit</button>
                    <button className="danger" onClick={() => handleDeleteClass(cls.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Class</th><th>Level</th><th>Students</th><th>Capacity</th><th>Streams</th><th>Teacher</th><th>Actions</th></tr></thead>
            <tbody>{filteredClasses.map(cls => (<tr key={cls.id}><td><strong>{cls.name}</strong><div className="sub-text">{cls.description}</div></td><td><span className="level-badge" style={{ background: getLevelColor(cls.level) }}>Form {cls.level}</span></td><td>{cls.students?.length || 0}</td><td>{cls.capacity}</td><td>{cls.streams?.length || 0}</td><td>{cls.classTeacherId || 'Not assigned'}</td><td><div className="action-buttons"><button onClick={() => { setSelectedClass(cls); setViewMode('details'); }}><Eye size={14} /></button><button onClick={() => { setEditingClass(cls); setForm(cls); setShowModal(true); }}><Edit size={14} /></button><button className="danger" onClick={() => handleDeleteClass(cls.id)}><Trash2 size={14} /></button></div></td></tr>))}</tbody>
          </table>
        </div>
      ) : selectedClass && (
        <div className="class-details">
          <div className="details-header">
            <button className="back-btn" onClick={() => setViewMode('grid')}><ChevronLeft size={20} /> Back</button>
            <h3>{selectedClass.name} - Class Details</h3>
            <div className="details-actions">
              <button onClick={() => { setEditingClass(selectedClass); setForm(selectedClass); setShowModal(true); }}><Edit size={16} /> Edit</button>
              <button onClick={() => setShowStreamModal(true)}><Plus size={16} /> Add Stream</button>
              <button onClick={() => setShowStudentModal(true)}><UserPlus size={16} /> Add Student</button>
              <button onClick={() => setShowTeacherModal(true)}><UserPlus size={16} /> Assign Teacher</button>
            </div>
          </div>
          
          <div className="details-stats">
            <div className="detail-stat"><Users size={20} /><div><span>{selectedClass.students?.length || 0}</span><label>Students</label></div></div>
            <div className="detail-stat"><BookOpen size={20} /><div><span>{selectedClass.streams?.length || 0}</span><label>Streams</label></div></div>
            <div className="detail-stat"><Award size={20} /><div><span>{selectedClass.averagePerformance || 0}%</span><label>Avg Performance</label></div></div>
            <div className="detail-stat"><Activity size={20} /><div><span>{selectedClass.attendanceRate || 0}%</span><label>Attendance</label></div></div>
          </div>
          
          {/* Streams Section */}
          <div className="details-section"><h4>Streams</h4><div className="streams-list">{selectedClass.streams?.map(stream => (<div key={stream.id} className="stream-item"><div><strong>{stream.name}</strong><div className="stream-code">{stream.code}</div><div className="stream-capacity">{stream.capacity} capacity</div></div><button className="danger" onClick={() => handleDeleteStream(stream.id)}><Trash2 size={14} /></button></div>))}</div></div>
          
          {/* Students Section */}
          <div className="details-section"><h4>Students ({selectedClass.students?.length || 0}/{selectedClass.capacity})</h4><div className="students-list">{selectedClass.students?.map(student => (<div key={student.id} className="student-item"><div className="student-avatar">{student.name?.charAt(0)}</div><div><strong>{student.name}</strong><div>{student.email} | {student.phone}</div></div><button className="danger" onClick={() => handleRemoveStudent(student.id)}><UserMinus size={14} /></button></div>))}</div></div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && viewMode !== 'details' && (
        <div className="pagination"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Previous</button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={16} /></button></div>
      )}

      {/* Class Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editingClass ? 'Edit Class' : 'Create New Class'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              {/* Image Upload */}
              <div className="image-upload-section" onDragOver={e => e.preventDefault()} onDrop={handleDragDrop}>
                {form.coverImage ? (<div className="image-preview"><img src={form.coverImage} alt="Class cover" /><button onClick={() => setForm({...form, coverImage: ''})}><X size={20} /></button></div>) : (<div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}><Upload size={32} /><p>Click or drag to upload class image</p><small>PNG, JPG up to 5MB</small><input ref={fileInputRef} type="file" accept="image/*" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} style={{ display: 'none' }} /></div>)}
                {uploading && <div className="uploading"><div className="loader-small" /> Uploading...</div>}
              </div>
              
              <div className="form-grid">
                <div className="form-group"><label>Class Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Form 1 East" /></div>
                <div className="form-group"><label>Level *</label><select value={form.level} onChange={e => setForm({...form, level: parseInt(e.target.value)})}><option value={1}>Form 1</option><option value={2}>Form 2</option><option value={3}>Form 3</option><option value={4}>Form 4</option></select></div>
                <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Room/Location</label><input value={form.room} onChange={e => setForm({...form, room: e.target.value})} placeholder="Room 201, Building B" /></div>
                <div className="form-group"><label>Class Teacher ID</label><input value={form.classTeacherId} onChange={e => setForm({...form, classTeacherId: e.target.value})} placeholder="Teacher ID" /></div>
                <div className="form-group"><label>Color Theme</label><input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
                <div className="form-group full"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Class description..." /></div>
              </div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={editingClass ? handleUpdateClass : handleCreateClass}>{editingClass ? 'Update Class' : 'Create Class'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Modal */}
      {showStreamModal && selectedClass && (
        <div className="modal-overlay" onClick={() => setShowStreamModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Stream to {selectedClass.name}</h3><button className="modal-close" onClick={() => setShowStreamModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><div className="form-group"><label>Stream Name *</label><input value={streamForm.name} onChange={e => setStreamForm({...streamForm, name: e.target.value})} placeholder="e.g., Stream A" /></div><div className="form-group"><label>Stream Code</label><input value={streamForm.code} onChange={e => setStreamForm({...streamForm, code: e.target.value})} placeholder="e.g., 1A" /></div><div className="form-group"><label>Capacity</label><input type="number" value={streamForm.capacity} onChange={e => setStreamForm({...streamForm, capacity: parseInt(e.target.value)})} /></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowStreamModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreateStream}>Create Stream</button></div></div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && selectedClass && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Student to {selectedClass.name}</h3><button className="modal-close" onClick={() => setShowStudentModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><div className="form-group"><label>Student ID *</label><input value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})} placeholder="Student ID" /></div><div className="form-group"><label>Student Name</label><input value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} placeholder="Full name" /></div><div className="form-group"><label>Email</label><input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} /></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddStudent}>Add Student</button></div></div>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && selectedClass && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Assign Class Teacher</h3><button className="modal-close" onClick={() => setShowTeacherModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><div className="form-group"><label>Teacher ID</label><input placeholder="Enter teacher ID" onKeyPress={e => e.key === 'Enter' && handleAssignTeacher((e.target as HTMLInputElement).value)} /></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowTeacherModal(false)}>Cancel</button></div></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmation.isOpen} title={confirmation.options?.title || ''} message={confirmation.options?.message || ''} confirmLabel={confirmation.options?.confirmText} cancelLabel={confirmation.options?.cancelText} type={confirmation.options?.type} onConfirm={confirmation.handleConfirm} onCancel={confirmation.handleCancel} />

      <style>{`
        .classes-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .class-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid; transition: transform 0.2s; }
        .class-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .card-cover { position: relative; height: 140px; overflow: hidden; }
        .card-cover img { width: 100%; height: 100%; object-fit: cover; }
        .cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; }
        .card-level { position: absolute; top: 12px; right: 12px; padding: 4px 10px; border-radius: 20px; color: white; font-size: 11px; font-weight: 600; }
        .card-body { padding: 16px; }
        .card-body h3 { margin: 0 0 4px; font-size: 18px; }
        .class-room { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
        .card-stats { display: flex; gap: 16px; margin-bottom: 12px; }
        .stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; }
        .progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; margin-bottom: 16px; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .card-actions { display: flex; gap: 8px; }
        .card-actions button { flex: 1; padding: 6px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .card-actions button:hover { background: #f1f5f9; border-color: #1d8a8a; }
        .card-actions button.danger:hover { background: #fef2f2; border-color: #dc2626; color: #dc2626; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4b5563; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .level-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; color: white; font-size: 11px; font-weight: 600; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .class-details { background: white; border-radius: 12px; padding: 24px; }
        .details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .back-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: #1d8a8a; font-size: 14px; }
        .details-actions { display: flex; gap: 8px; }
        .details-actions button { padding: 6px 12px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; }
        .details-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .detail-stat { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8fafc; border-radius: 12px; }
        .detail-stat span { font-size: 24px; font-weight: 700; display: block; }
        .detail-stat label { font-size: 12px; color: #6b7280; }
        .details-section { margin-bottom: 24px; }
        .details-section h4 { margin: 0 0 12px; font-size: 16px; }
        .streams-list { display: flex; flex-direction: column; gap: 8px; }
        .stream-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .stream-code { font-size: 11px; color: #6b7280; }
        .stream-capacity { font-size: 11px; color: #10b981; }
        .students-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
        .student-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; }
        .student-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1d8a8a; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
        .image-upload-section { margin-bottom: 20px; }
        .upload-placeholder { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .upload-placeholder:hover { border-color: #1d8a8a; background: #f0fdf4; }
        .image-preview { position: relative; width: 100%; height: 160px; border-radius: 12px; overflow: hidden; }
        .image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .image-preview button { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
        .uploading { text-align: center; padding: 12px; color: #1d8a8a; font-size: 13px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        .loader-small { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } .details-stats { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}