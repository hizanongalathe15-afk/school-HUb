// client/src/components/roles/admin/AdminSubjectsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Edit, Trash2, RefreshCcw, X, BookOpen,
  Eye, EyeOff, Globe, Lock, Upload, Download, Filter,
  CheckSquare, Square, Save, Copy, Link, AlertCircle,
  ChevronDown, ChevronRight, Move, ArrowUp, ArrowDown,
  Layers, Grid, List, ToggleLeft, ToggleRight, Settings,
  BookMarked, GraduationCap, Clock, Star, TrendingUp,
  Users, School, Database, Share2, Printer, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService } from '../../../services/adminService';
import type { Subject } from '../../../types/admin';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';

interface SubjectWithPublic extends Subject {
  isPublic: boolean;
  displayOrder: number;
  assignedClasses: string[];
  assignedTeachers: string[];
  syllabus: string;
  syllabusVersion: string;
  examWeight: number;
  continuousAssessmentWeight: number;
  icon?: string;
  color?: string;
}

export default function AdminSubjectsPage() {
  const confirmation = useConfirmationDialog();
  const [subjects, setSubjects] = useState<SubjectWithPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithPublic | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await academicManagementService.getSubjects();
      // Add public status and extra fields if not present
      const subjectsWithPublic = data.map((s: any, index: number) => ({
        ...s,
        isPublic: s.isPublic !== undefined ? s.isPublic : true,
        displayOrder: s.displayOrder || index,
        assignedClasses: s.assignedClasses || [],
        assignedTeachers: s.assignedTeachers || [],
        syllabus: s.syllabus || '',
        syllabusVersion: s.syllabusVersion || '2024',
        examWeight: s.examWeight || 70,
        continuousAssessmentWeight: s.continuousAssessmentWeight || 30
      }));
      setSubjects(subjectsWithPublic);
    } catch (error) {
      toast.error('Failed to load subjects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndTeachers = async () => {
    try {
      const [classesData, teachersData] = await Promise.all([
        academicManagementService.getClasses(),
        academicManagementService.getTeachers()
      ]);
      setClasses(classesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to fetch classes/teachers');
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchClassesAndTeachers();
  }, []);

  const handleCreateSubject = async (data: Partial<SubjectWithPublic>) => {
    try {
      const newSubject = {
        ...data,
        isPublic: data.isPublic ?? true,
        displayOrder: subjects.length
      };
      await academicManagementService.createSubject(newSubject as Omit<SubjectWithPublic, 'id'>);
      toast.success('Subject created successfully');
      fetchSubjects();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create subject');
      console.error(error);
    }
  };

  const handleUpdateSubject = async (id: string, data: Partial<SubjectWithPublic>) => {
    try {
      await academicManagementService.updateSubject(id, data);
      toast.success('Subject updated successfully');
      
      // If public visibility changed, reflect immediately
      if (data.isPublic !== undefined) {
        const subject = subjects.find(s => s.id === id);
        if (subject) {
          toast(`Subject is now ${data.isPublic ? 'visible to public' : 'hidden from public'}`);
        }
      }
      
      fetchSubjects();
      setShowModal(false);
      setEditingSubject(null);
    } catch (error) {
      toast.error('Failed to update subject');
      console.error(error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const subject = subjects.find(s => s.id === id);
    const confirmed = await confirmation.confirm({
      title: 'Delete Subject',
      message: `Delete "${subject?.name}"? This will affect all classes and students.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        await academicManagementService.deleteSubject(id);
        toast.success('Subject deleted successfully');
        fetchSubjects();
        setSelectedSubjects(prev => prev.filter(sid => sid !== id));
      } catch (error) {
        toast.error('Failed to delete subject');
      }
    }
  };

  const handleBulkUpdate = async (updates: Partial<SubjectWithPublic>) => {
    const confirmed = await confirmation.confirm({
      title: 'Bulk Update',
      message: `Update ${selectedSubjects.length} subject(s)?`,
      confirmText: 'Update All',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      setLoading(true);
      try {
        await Promise.all(
          selectedSubjects.map(id => 
            academicManagementService.updateSubject(id, updates)
          )
        );
        toast.success(`${selectedSubjects.length} subject(s) updated`);
        fetchSubjects();
        setSelectedSubjects([]);
        setShowBulkModal(false);
      } catch (error) {
        toast.error('Bulk update failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTogglePublic = async (id: string, currentStatus: boolean) => {
    try {
      await academicManagementService.updateSubject(id, { isPublic: !currentStatus });
      toast.success(`Subject ${!currentStatus ? 'visible to' : 'hidden from'} public`);
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleBulkTogglePublic = async (makePublic: boolean) => {
    await handleBulkUpdate({ isPublic: makePublic });
  };

  const handleAssignToClass = async (subjectId: string, classId: string) => {
    try {
      const subject = subjects.find(s => s.id === subjectId);
      const currentClasses = subject?.assignedClasses || [];
      const newClasses = currentClasses.includes(classId)
        ? currentClasses.filter(c => c !== classId)
        : [...currentClasses, classId];
      
      await academicManagementService.updateSubject(subjectId, { assignedClasses: newClasses });
      toast.success(`Subject ${currentClasses.includes(classId) ? 'removed from' : 'assigned to'} class`);
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to assign subject');
    }
  };

  const handleReorderSubjects = async (subjectId: string, direction: 'up' | 'down') => {
    const index = subjects.findIndex(s => s.id === subjectId);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === subjects.length - 1) return;
    
    const newSubjects = [...subjects];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSubjects[index], newSubjects[swapIndex]] = [newSubjects[swapIndex], newSubjects[index]];
    
    // Update display orders
    newSubjects.forEach((s, idx) => { s.displayOrder = idx; });
    
    setSubjects(newSubjects);
    
    try {
      await academicManagementService.reorderSubjects(newSubjects.map(s => ({ id: s.id, order: s.displayOrder })));
      toast.success('Subject order updated');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to reorder subjects');
      fetchSubjects(); // Revert on error
    }
  };

  const handleExportSubjects = async () => {
    try {
      const blob = await academicManagementService.exportSubjects();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subjects_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Subjects exported');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const toggleSubjectSelection = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAllSubjects = () => {
    if (selectedSubjects.length === filteredSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(filteredSubjects.map(s => s.id));
    }
  };

  const copySubjectLink = (subjectId: string) => {
    const link = `${window.location.origin}/subjects/${subjectId}`;
    navigator.clipboard.writeText(link);
    toast.success('Subject link copied');
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      compulsory: 'bg-green-100 text-green-800',
      optional: 'bg-blue-100 text-blue-800',
      technical: 'bg-orange-100 text-orange-800',
      humanities: 'bg-purple-100 text-purple-800',
      sciences: 'bg-cyan-100 text-cyan-800',
      languages: 'bg-indigo-100 text-indigo-800'
    };
    return <span className={`category-badge ${colors[category] || colors.compulsory}`}>{category}</span>;
  };

  const getPublicBadge = (isPublic: boolean) => {
    return isPublic ? (
      <span className="public-badge public"><Globe size={12} /> Public</span>
    ) : (
      <span className="public-badge private"><Lock size={12} /> Private</span>
    );
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesPublic = publicFilter === 'all' || 
                         (publicFilter === 'public' && s.isPublic) ||
                         (publicFilter === 'private' && !s.isPublic);
    return matchesSearch && matchesCategory && matchesPublic;
  });

  return (
    <div className="subjects-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><BookOpen size={28} /> Subjects Management</h1>
          <p>Manage all subjects, control public visibility, assign to classes, and organize curriculum</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchSubjects} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExportSubjects} className="btn-secondary">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="btn-secondary">
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            {viewMode === 'grid' ? 'List' : 'Grid'} View
          </button>
          <button onClick={() => { setEditingSubject(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedSubjects.length > 0 && (
        <div className="bulk-bar">
          <div className="bulk-info">
            <input type="checkbox" checked={selectedSubjects.length === filteredSubjects.length} onChange={toggleAllSubjects} />
            <span>{selectedSubjects.length} subject(s) selected</span>
          </div>
          <div className="bulk-actions">
            <button onClick={() => handleBulkTogglePublic(true)} className="btn-sm">
              <Globe size={14} /> Make Public
            </button>
            <button onClick={() => handleBulkTogglePublic(false)} className="btn-sm">
              <Lock size={14} /> Make Private
            </button>
            <button onClick={() => setShowBulkModal(true)} className="btn-sm">
              <Settings size={14} /> Bulk Edit
            </button>
            <button onClick={() => handleBulkUpdate({}) as any} className="btn-sm btn-danger">
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name, code, or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          <option value="all">All Categories</option>
          <option value="compulsory">Compulsory</option>
          <option value="optional">Optional</option>
          <option value="technical">Technical</option>
          <option value="sciences">Sciences</option>
          <option value="humanities">Humanities</option>
          <option value="languages">Languages</option>
        </select>
        <select value={publicFilter} onChange={(e) => setPublicFilter(e.target.value)} className="filter-select">
          <option value="all">All Visibility</option>
          <option value="public">Public (Visible)</option>
          <option value="private">Private (Hidden)</option>
        </select>
      </div>

      {/* Subjects Display */}
      {loading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading subjects...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0} onChange={toggleAllSubjects} />
                </th>
                <th>Order</th>
                <th>Subject</th>
                <th>Code</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Classes</th>
                <th>Assessment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject, idx) => (
                <tr key={subject.id} className={!subject.isPublic ? 'private-row' : ''}>
                  <td><input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => toggleSubjectSelection(subject.id)} /></td>
                  <td className="order-controls">
                    <button onClick={() => handleReorderSubjects(subject.id, 'up')} disabled={idx === 0}><ArrowUp size={14} /></button>
                    <span>{subject.displayOrder + 1}</span>
                    <button onClick={() => handleReorderSubjects(subject.id, 'down')} disabled={idx === filteredSubjects.length - 1}><ArrowDown size={14} /></button>
                  </td>
                  <td>
                    <div className="subject-cell">
                      <BookOpen size={16} style={{ color: subject.color || '#64748b' }} />
                      <div>
                        <div className="subject-name">{subject.name}</div>
                        {subject.description && <div className="subject-desc">{subject.description.substring(0, 50)}...</div>}
                      </div>
                    </div>
                  </td>
                  <td><code className="code-badge">{subject.code}</code></td>
                  <td>{getCategoryBadge(subject.category)}</td>
                  <td>
                    <button className="visibility-toggle" onClick={() => handleTogglePublic(subject.id, subject.isPublic)}>
                      {subject.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                      {getPublicBadge(subject.isPublic)}
                    </button>
                  </td>
                  <td>
                    <div className="assigned-classes">
                      {subject.assignedClasses?.slice(0, 2).map(c => (
                        <span key={c} className="class-badge">{c}</span>
                      ))}
                      {subject.assignedClasses && subject.assignedClasses.length > 2 && (
                        <span className="class-badge">+{subject.assignedClasses.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="assessment-info">
                    <span>Exam: {subject.examWeight}%</span>
                    <span>CA: {subject.continuousAssessmentWeight}%</span>
                  </td>
                  <td className="action-buttons">
                    <button className="action-btn" onClick={() => copySubjectLink(subject.id)} title="Copy Link"><Copy size={14} /></button>
                    <button className="action-btn" onClick={() => { setEditingSubject(subject); setShowModal(true); }} title="Edit"><Edit size={14} /></button>
                    <button className="action-btn action-danger" onClick={() => handleDeleteSubject(subject.id)} title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            {filteredSubjects.length === 0 && (
              <div className="empty-state">No subjects found. Create your first subject.</div>
            )}
          </div>
        ) : (
        <div className="subjects-grid">
          {filteredSubjects.map(subject => (
            <div key={subject.id} className={`subject-card ${!subject.isPublic ? 'private-card' : ''}`}>
              <div className="card-header">
                <div className="subject-icon" style={{ background: subject.color || '#e0e7ff' }}>
                  <BookOpen size={24} />
                </div>
                <div className="visibility-badge">
                  {getPublicBadge(subject.isPublic)}
                </div>
              </div>
              <div className="card-body">
                <h3>{subject.name}</h3>
                <code>{subject.code}</code>
                <div className="card-category">{getCategoryBadge(subject.category)}</div>
                {subject.description && <p className="card-description">{subject.description.substring(0, 80)}...</p>}
                <div className="card-stats">
                  <div><GraduationCap size={12} /> Exam: {subject.examWeight}%</div>
                  <div><Clock size={12} /> CA: {subject.continuousAssessmentWeight}%</div>
                </div>
                <div className="card-classes">
                  {subject.assignedClasses?.map(c => <span key={c}>{c}</span>)}
                </div>
              </div>
              <div className="card-actions">
                <button onClick={() => { setEditingSubject(subject); setShowModal(true); }}><Edit size={16} /> Edit</button>
                <button onClick={() => handleTogglePublic(subject.id, subject.isPublic)}>
                  {subject.isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                  {subject.isPublic ? 'Hide' : 'Publish'}
                </button>
                <button onClick={() => copySubjectLink(subject.id)}><Copy size={16} /> Link</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name'),
                  code: formData.get('code'),
                  category: formData.get('category'),
                  kcseGroup: formData.get('kcseGroup'),
                  description: formData.get('description'),
                  isPublic: formData.get('isPublic') === 'true',
                  syllabus: formData.get('syllabus'),
                  syllabusVersion: formData.get('syllabusVersion'),
                  examWeight: parseInt(formData.get('examWeight') as string) || 70,
                  continuousAssessmentWeight: parseInt(formData.get('continuousAssessmentWeight') as string) || 30,
                  color: formData.get('color')
                };
                if (editingSubject) handleUpdateSubject(editingSubject.id, data as Partial<SubjectWithPublic>);
                else handleCreateSubject(data as Partial<SubjectWithPublic>);
              }}>
                <div className="form-grid">
                  <div className="form-group"><label>Subject Name *</label><input type="text" name="name" defaultValue={editingSubject?.name} required /></div>
                  <div className="form-group"><label>Subject Code *</label><input type="text" name="code" defaultValue={editingSubject?.code} required /></div>
                  <div className="form-group"><label>Category *</label>
                    <select name="category" defaultValue={editingSubject?.category} required>
                      <option value="compulsory">Compulsory</option>
                      <option value="optional">Optional</option>
                      <option value="technical">Technical</option>
                      <option value="sciences">Sciences</option>
                      <option value="humanities">Humanities</option>
                      <option value="languages">Languages</option>
                    </select>
                  </div>
                  <div className="form-group"><label>KCSE Group</label><input type="text" name="kcseGroup" defaultValue={editingSubject?.kcseGroup} placeholder="e.g., Group 1, Group 2" /></div>
                  <div className="form-group"><label>Visibility</label>
                    <select name="isPublic" defaultValue={editingSubject?.isPublic !== undefined ? String(editingSubject.isPublic) : 'true'}>
                      <option value="true">Public (Visible to all)</option>
                      <option value="false">Private (Hidden from public)</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Theme Color</label><input type="color" name="color" defaultValue={editingSubject?.color || '#1d8a8a'} /></div>
                  <div className="form-group"><label>Syllabus</label><input type="text" name="syllabus" defaultValue={editingSubject?.syllabus} placeholder="Syllabus document URL or reference" /></div>
                  <div className="form-group"><label>Syllabus Version</label><input type="text" name="syllabusVersion" defaultValue={editingSubject?.syllabusVersion || '2024'} /></div>
                  <div className="form-group"><label>Exam Weight (%)</label><input type="number" name="examWeight" defaultValue={editingSubject?.examWeight || 70} min="0" max="100" /></div>
                  <div className="form-group"><label>Continuous Assessment (%)</label><input type="number" name="continuousAssessmentWeight" defaultValue={editingSubject?.continuousAssessmentWeight || 30} min="0" max="100" /></div>
                  <div className="form-group full-width"><label>Description</label><textarea name="description" defaultValue={editingSubject?.description} rows={3} placeholder="Subject description and objectives" /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary"><Save size={16} /> {editingSubject ? 'Update Subject' : 'Create Subject'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Edit Subjects ({selectedSubjects.length})</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="bulk-form">
                <div className="form-group"><label>Set Visibility</label>
                  <select onChange={e => e.target.value && handleBulkTogglePublic(e.target.value === 'public')}>
                    <option value="">No change</option>
                    <option value="public">Make Public</option>
                    <option value="private">Make Private</option>
                  </select>
                </div>
                <div className="form-group"><label>Set Category</label>
                  <select onChange={e => e.target.value && handleBulkUpdate({ category: e.target.value as any })}>
                    <option value="">No change</option>
                    <option value="compulsory">Compulsory</option>
                    <option value="optional">Optional</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .subjects-page { padding: 20px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { color: #64748b; margin-top: 4px; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; font-weight: 500; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn-sm { padding: 4px 12px; font-size: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-danger { background: #ef4444; color: white; border-color: #ef4444; }
        .bulk-bar { background: #eff6ff; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .bulk-info { display: flex; align-items: center; gap: 12px; }
        .bulk-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
        .table-container { background: white; border-radius: 12px; overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 12px 16px; border-bottom: 1px solid #f0f2f5; font-size: 13px; }
        .data-table tr:hover { background: #f8fafc; }
        .private-row { background: #fef2f2; opacity: 0.9; }
        .order-controls { display: flex; align-items: center; gap: 4px; }
        .order-controls button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; }
        .order-controls button:hover { background: #e2e8f0; }
        .subject-cell { display: flex; align-items: center; gap: 12px; }
        .subject-name { font-weight: 600; }
        .subject-desc { font-size: 11px; color: #64748b; }
        .code-badge { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 11px; }
        .category-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .public-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; }
        .public-badge.public { background: #dcfce7; color: #166534; }
        .public-badge.private { background: #fee2e2; color: #991b1b; }
        .visibility-toggle { background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .assigned-classes { display: flex; flex-wrap: wrap; gap: 4px; }
        .class-badge { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        .assessment-info { display: flex; gap: 8px; font-size: 11px; color: #64748b; }
        .action-buttons { display: flex; gap: 4px; }
        .action-btn { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; color: #64748b; }
        .action-btn:hover { background: #f1f5f9; }
        .action-danger:hover { background: #fee2e2; color: #ef4444; }
        .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .subject-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .subject-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .private-card { background: #fff5f5; border: 1px solid #fecaca; }
        .card-header { display: flex; justify-content: space-between; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .subject-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .visibility-badge { background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 20px; font-size: 10px; }
        .card-body { padding: 16px; }
        .card-body h3 { margin: 0 0 4px 0; font-size: 16px; }
        .card-body code { font-size: 11px; color: #64748b; }
        .card-description { font-size: 12px; color: #475569; margin: 8px 0; }
        .card-stats { display: flex; gap: 12px; margin: 12px 0; font-size: 11px; color: #64748b; }
        .card-classes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .card-classes span { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        .card-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e2e8f0; }
        .card-actions button { flex: 1; padding: 6px; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; }
        .loading-state { text-align: center; padding: 40px; }
        .loader { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state { text-align: center; padding: 60px; color: #64748b; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 12px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-large { width: 700px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .modal-close { background: none; border: none; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .full-width { grid-column: span 2; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .bulk-form { display: flex; flex-direction: column; gap: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}