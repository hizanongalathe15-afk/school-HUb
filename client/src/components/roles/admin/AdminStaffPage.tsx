// client/src/components/roles/admin/AdminStaffPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye, RefreshCcw, X,
  Upload, Image, FileText, Mail, Phone, MessageCircle, Send,
  Users, Briefcase, Calendar, MapPin, Award, Clock, CheckCircle,
  AlertCircle, MoreVertical, Copy, Archive, Unlock, Lock,
  UserCheck, UserX, Shield, Crown, Star, Heart, TrendingUp,
  PieChart, BarChart3, Activity, Zap, Bell, BellOff,
  Grid, List as ListIcon, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, SlidersHorizontal, FolderTree
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementService, communicationService } from '../../../services/adminService';
import type { AdminUser } from '../../../types/admin';

interface Staff extends AdminUser {
  employeeId: string;
  department: string;
  position: string;
  dateJoined: string;
  status: 'active' | 'inactive' | 'on_leave';
  qualifications: string[];
  emergencyContact: { name: string; phone: string; relationship: string };
  salary?: number;
  joiningDate: string;
  contractType: 'permanent' | 'contract' | 'part-time' | 'probation';
  supervisor?: string;
  performance: { rating: number; reviewDate: string; comments: string[] };
  documents: { id: string; name: string; url: string; type: string }[];
}

interface DepartmentMessage {
  department: string;
  subject: string;
  message: string;
  attachments: File[];
  priority: 'low' | 'medium' | 'high';
  scheduleFor?: Date;
}

export default function AdminStaffPage() {
  // State Management
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'dateJoined' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | 'email' | null>(null);
  
  // Department Communication
  const [showDeptMessageModal, setShowDeptMessageModal] = useState(false);
  const [departmentMessage, setDepartmentMessage] = useState<DepartmentMessage>({
    department: '',
    subject: '',
    message: '',
    attachments: [],
    priority: 'medium'
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  
  // Stats
  const [departmentStats, setDepartmentStats] = useState<Record<string, number>>({});
  const [statusStats, setStatusStats] = useState<Record<string, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await userManagementService.getAllUsers({
        role: 'STAFF',
        search: searchTerm,
        page: currentPage,
        limit: 20,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        position: positionFilter !== 'all' ? positionFilter : undefined,
        sortBy,
        sortOrder
      });
      setStaff(response.users as any);
      setTotalPages(response.pages);
      setTotalStaff(response.total);
      calculateStats(response.users as Staff[]);
    } catch (error) {
      toast.error('Failed to load staff');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (staffList: Staff[]) => {
    const deptStats: Record<string, number> = {};
    const statStats: Record<string, number> = { active: 0, inactive: 0, on_leave: 0 };
    
    staffList.forEach(s => {
      deptStats[s.department] = (deptStats[s.department] || 0) + 1;
      statStats[s.status] = (statStats[s.status] || 0) + 1;
    });
    
    setDepartmentStats(deptStats);
    setStatusStats(statStats);
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, searchTerm, departmentFilter, statusFilter, positionFilter, sortBy, sortOrder]);

  const handleCreateStaff = async (data: Partial<Staff>) => {
    try {
      const newStaff = await userManagementService.createUser({
        email: data.email!,
        firstName: data.firstName!,
        lastName: data.lastName!,
        role: 'STAFF',
        phone: data.phone,
        password: 'temp123!',
        employeeId: data.employeeId,
        department: data.department,
        position: data.position,
        dateJoined: data.dateJoined,
        status: 'active'
      });
      toast.success('Staff created successfully');
      
      // Send welcome email
      await communicationService.sendWelcomeEmail(newStaff.email, newStaff.firstName);
      
      fetchStaff();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff');
    }
  };

  const handleUpdateStaff = async (id: string, data: Partial<Staff>) => {
    try {
      await userManagementService.updateUser(id, data);
      toast.success('Staff updated successfully');
      fetchStaff();
      setShowModal(false);
      setEditingStaff(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update staff');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await userManagementService.deleteUser(id);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedStaff.length === 0) return;
    
    try {
      switch(bulkAction) {
        case 'activate':
          await userManagementService.bulkUpdateStatus(selectedStaff, 'active');
          toast.success(`${selectedStaff.length} staff activated`);
          break;
        case 'deactivate':
          await userManagementService.bulkUpdateStatus(selectedStaff, 'inactive');
          toast.success(`${selectedStaff.length} staff deactivated`);
          break;
        case 'delete':
          if (confirm(`Delete ${selectedStaff.length} staff members?`)) {
            await userManagementService.bulkDeleteUsers(selectedStaff);
            toast.success(`${selectedStaff.length} staff deleted`);
          }
          break;
        case 'email':
          setShowDeptMessageModal(true);
          return;
      }
      setSelectedStaff([]);
      setShowBulkModal(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Bulk action failed');
    }
  };

  // Department Communication
  const sendDepartmentMessage = async () => {
    if (!departmentMessage.department || !departmentMessage.subject || !departmentMessage.message) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSending(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('department', departmentMessage.department);
      formData.append('subject', departmentMessage.subject);
      formData.append('message', departmentMessage.message);
      formData.append('priority', departmentMessage.priority);
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      if (departmentMessage.scheduleFor) {
        formData.append('scheduleFor', departmentMessage.scheduleFor.toISOString());
      }
      
      const result = await communicationService.sendDepartmentMessage(formData);
      toast.success(`Message sent to ${result.recipientCount} staff members`);
      
      setShowDeptMessageModal(false);
      setDepartmentMessage({
        department: '',
        subject: '',
        message: '',
        attachments: [],
        priority: 'medium'
      });
      setAttachments([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      dragCounter.current++;
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      dragCounter.current--;
      if (dragCounter.current === 0) setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only images, PDFs, and documents allowed.');
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const exportStaffData = async () => {
    try {
      const blob = await userManagementService.exportStaffData({
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staff_export_${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Staff data exported');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <span className="status-badge active"><CheckCircle size={12} /> Active</span>;
      case 'inactive': return <span className="status-badge inactive"><X size={12} /> Inactive</span>;
      case 'on_leave': return <span className="status-badge leave"><Clock size={12} /> On Leave</span>;
      default: return null;
    }
  };

  const departments = ['admin', 'finance', 'hr', 'maintenance', 'academic', 'it', 'sports', 'library'];
  const positions = ['Manager', 'Supervisor', 'Coordinator', 'Officer', 'Assistant', 'Technician', 'Clerk'];

  return (
    <div className="staff-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Staff Management</h2>
          <p>Manage staff profiles, departments, and send department-wide communications</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <ListIcon size={16} /> List
            </button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <Grid size={16} /> Grid
            </button>
          </div>
          <button className="btn btn-secondary" onClick={exportStaffData}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-secondary" onClick={fetchStaff} disabled={loading}>
            <RefreshCcw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingStaff(null); setShowModal(true); }}>
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><Users size={24} /></div>
          <div className="stat-info"><span className="stat-value">{totalStaff}</span><span className="stat-label">Total Staff</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><UserCheck size={24} /></div>
          <div className="stat-info"><span className="stat-value">{statusStats.active || 0}</span><span className="stat-label">Active</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon leave"><Clock size={24} /></div>
          <div className="stat-info"><span className="stat-value">{statusStats.on_leave || 0}</span><span className="stat-label">On Leave</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon departments"><Briefcase size={24} /></div>
          <div className="stat-info"><span className="stat-value">{Object.keys(departmentStats).length}</span><span className="stat-label">Departments</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name, email, position..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="all">All Departments ({totalStaff})</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept.toUpperCase()} ({departmentStats[dept] || 0})</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
          <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="all">All Positions</option>
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => setShowDeptMessageModal(true)}>
            <Send size={16} /> Message Department
          </button>
        </div>
        {selectedStaff.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowBulkModal(true)}>
            Bulk Actions ({selectedStaff.length})
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading staff...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-col"><input type="checkbox" checked={selectedStaff.length === staff.length && staff.length > 0} onChange={(e) => setSelectedStaff(e.target.checked ? staff.map(s => s.id) : [])} /></th>
                <th onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Staff Member {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Position</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="checkbox-col"><input type="checkbox" checked={selectedStaff.includes(member.id)} onChange={(e) => { if (e.target.checked) setSelectedStaff([...selectedStaff, member.id]); else setSelectedStaff(selectedStaff.filter(id => id !== member.id)); }} /></td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{member.avatar ? <img src={member.avatar} alt={member.firstName} /> : <span>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</span>}</div>
                      <div className="user-info"><span className="user-name">{member.firstName} {member.lastName}</span><span className="user-email">{member.email}</span></div>
                    </div>
                   </td>
                  <td>{member.employeeId || '-'}</td>
                  <td><span className="dept-badge">{member.department || '-'}</span></td>
                  <td>{member.position || '-'}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{getStatusBadge(member.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="Quick Message" onClick={() => { setDepartmentMessage({ ...departmentMessage, department: member.department }); setShowDeptMessageModal(true); }}><Mail size={14} /></button>
                      <button className="action-btn" title="Edit" onClick={() => { setEditingStaff(member); setShowModal(true); }}><Edit size={14} /></button>
                      <button className="action-btn action-danger" title="Delete" onClick={() => handleDeleteStaff(member.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && <tr><td colSpan={8} className="empty-state"><Users size={48} /><p>No staff found</p><button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Your First Staff</button></td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-view">
          {staff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-card-header">
                <div className="user-avatar large">{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</div>
                <div className="staff-card-info">
                  <h4>{member.firstName} {member.lastName}</h4>
                  <p>{member.position}</p>
                  <span className="dept-badge">{member.department}</span>
                </div>
                {getStatusBadge(member.status)}
              </div>
              <div className="staff-card-details">
                <div><Mail size={14} /> {member.email}</div>
                <div><Phone size={14} /> {member.phone || 'No phone'}</div>
                <div><Calendar size={14} /> Joined: {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString() : 'N/A'}</div>
                <div><Briefcase size={14} /> ID: {member.employeeId || 'N/A'}</div>
              </div>
              <div className="staff-card-actions">
                <button onClick={() => { setEditingStaff(member); setShowModal(true); }}><Edit size={16} /> Edit</button>
                <button onClick={() => handleDeleteStaff(member.id)} className="danger"><Trash2 size={16} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Previous</button>
          <span className="page-info">Page {currentPage} of {totalPages} ({totalStaff} staff)</span>
          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {/* Staff Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = Object.fromEntries(formData); if (editingStaff) handleUpdateStaff(editingStaff.id, data as Partial<Staff>); else handleCreateStaff(data as Partial<Staff>); }}>
                <div className="form-grid">
                  <div className="form-group"><label>First Name *</label><input type="text" name="firstName" defaultValue={editingStaff?.firstName} required /></div>
                  <div className="form-group"><label>Last Name *</label><input type="text" name="lastName" defaultValue={editingStaff?.lastName} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" name="email" defaultValue={editingStaff?.email} required /></div>
                  <div className="form-group"><label>Phone</label><input type="tel" name="phone" defaultValue={editingStaff?.phone} /></div>
                  <div className="form-group"><label>Employee ID</label><input type="text" name="employeeId" defaultValue={editingStaff?.employeeId} placeholder="EMP001" /></div>
                  <div className="form-group"><label>Department</label><select name="department" defaultValue={editingStaff?.department}>{departments.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}</select></div>
                  <div className="form-group"><label>Position</label><select name="position" defaultValue={editingStaff?.position}>{positions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div className="form-group"><label>Date Joined</label><input type="date" name="dateJoined" defaultValue={editingStaff?.dateJoined?.split('T')[0]} /></div>
                  <div className="form-group"><label>Status</label><select name="status" defaultValue={editingStaff?.status}><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option></select></div>
                </div>
                <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingStaff ? 'Update Staff' : 'Create Staff'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Department Message Modal with Drag & Drop */}
      {showDeptMessageModal && (
        <div className="modal-overlay" onClick={() => setShowDeptMessageModal(false)}>
          <div className="modal modal-message" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><Send size={20} /> Send Department Message</h3><button className="modal-close" onClick={() => setShowDeptMessageModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label>Department *</label><select value={departmentMessage.department} onChange={(e) => setDepartmentMessage({...departmentMessage, department: e.target.value})}><option value="">Select Department</option>{departments.map(d => <option key={d} value={d}>{d.toUpperCase()} ({departmentStats[d] || 0} staff)</option>)}</select></div>
              <div className="form-group"><label>Subject *</label><input type="text" value={departmentMessage.subject} onChange={(e) => setDepartmentMessage({...departmentMessage, subject: e.target.value})} placeholder="Message subject..." /></div>
              <div className="form-group"><label>Priority</label><select value={departmentMessage.priority} onChange={(e) => setDepartmentMessage({...departmentMessage, priority: e.target.value as any})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div className="form-group"><label>Message *</label><textarea rows={5} value={departmentMessage.message} onChange={(e) => setDepartmentMessage({...departmentMessage, message: e.target.value})} placeholder="Type your message here..." /></div>
              
              {/* Drag & Drop Zone */}
              <div className={`drag-drop-zone ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" ref={fileInputRef} multiple onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" />
                <Upload size={32} />
                <p>Drag & drop files here or <button type="button" onClick={() => fileInputRef.current?.click()}>browse</button></p>
                <small>Supports: Images, PDF, Word documents (Max 10MB each)</small>
              </div>
              
              {/* Attachments Preview */}
              {attachments.length > 0 && (<div className="attachments-preview"><h4>Attachments ({attachments.length})</h4><div className="attachment-list">{attachments.map((file, idx) => (<div key={idx} className="attachment-item">{file.type.startsWith('image/') ? <Image size={20} /> : <FileText size={20} />}<span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span><button onClick={() => removeAttachment(idx)}><X size={14} /></button></div>))}</div></div>)}
              
              {uploadProgress > 0 && <div className="upload-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div><span>{uploadProgress}% uploaded</span></div>}
              
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowDeptMessageModal(false)}>Cancel</button><button className="btn btn-primary" onClick={sendDepartmentMessage} disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Bulk Actions</h3><button className="modal-close" onClick={() => setShowBulkModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><p>Selected {selectedStaff.length} staff members</p><div className="bulk-actions"><button className="bulk-btn" onClick={() => { setBulkAction('activate'); handleBulkAction(); }}><UserCheck size={16} /> Activate All</button><button className="bulk-btn" onClick={() => { setBulkAction('deactivate'); handleBulkAction(); }}><UserX size={16} /> Deactivate All</button><button className="bulk-btn" onClick={() => { setBulkAction('email'); handleBulkAction(); }}><Mail size={16} /> Send Email</button><button className="bulk-btn danger" onClick={() => { setBulkAction('delete'); if (confirm('Delete all selected?')) handleBulkAction(); }}><Trash2 size={16} /> Delete All</button></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button></div></div>
          </div>
        </div>
      )}

      <style>{`
        .staff-management-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.total { background: #e0e7ff; color: #4f46e5; }
        .stat-icon.active { background: #d1fae5; color: #10b981; }
        .stat-icon.leave { background: #fed7aa; color: #f59e0b; }
        .stat-icon.departments { background: #e0e7ff; color: #7c3aed; }
        .stat-info .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-info .stat-label { font-size: 13px; color: #6b7280; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .filter-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .filter-group select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; cursor: pointer; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr:hover { background: #fafbff; }
        .checkbox-col { width: 40px; text-align: center; }
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; }
        .user-avatar.large { width: 60px; height: 60px; font-size: 24px; }
        .user-name { font-weight: 600; display: block; }
        .user-email { font-size: 12px; color: #64748b; }
        .dept-badge { background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.active { background: #d1fae5; color: #10b981; }
        .status-badge.inactive { background: #fee2e2; color: #ef4444; }
        .status-badge.leave { background: #fed7aa; color: #f59e0b; }
        .action-buttons { display: flex; gap: 4px; }
        .action-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; display: inline-flex; align-items: center; transition: all 0.2s; }
        .action-btn:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-danger:hover { background: #fef2f2; color: #dc2626; }
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .staff-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .staff-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .staff-card-header { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
        .staff-card-info h4 { margin: 0; font-size: 16px; }
        .staff-card-info p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
        .staff-card-details { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }
        .staff-card-details div { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4b5563; }
        .staff-card-actions { display: flex; gap: 8px; }
        .staff-card-actions button { flex: 1; padding: 8px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; transition: all 0.2s; }
        .staff-card-actions button:hover { background: #f1f5f9; border-color: #1d8a8a; }
        .staff-card-actions button.danger:hover { background: #fef2f2; border-color: #dc2626; color: #dc2626; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; padding: 16px; }
        .page-btn { padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-message { max-width: 600px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .drag-drop-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
        .drag-drop-zone.drag-active { border-color: #1d8a8a; background: #f0fdf4; }
        .drag-drop-zone button { background: none; border: none; color: #1d8a8a; cursor: pointer; text-decoration: underline; }
        .attachments-preview { margin: 16px 0; }
        .attachment-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
        .attachment-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8fafc; border-radius: 8px; }
        .attachment-item button { background: none; border: none; cursor: pointer; margin-left: auto; color: #64748b; }
        .upload-progress { margin: 16px 0; }
        .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #1d8a8a; transition: width 0.3s ease; }
        .bulk-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
        .bulk-btn { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; display: flex; align-items: center; gap: 8px; justify-content: center; }
        .bulk-btn.danger:hover { background: #fef2f2; border-color: #ef4444; color: #ef4444; }
        .empty-state { text-align: center; padding: 60px; color: #6b7280; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .grid-view { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}