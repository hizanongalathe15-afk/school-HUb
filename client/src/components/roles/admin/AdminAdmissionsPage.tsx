// client/src/components/roles/admin/AdminAdmissionsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, FileText, RefreshCcw, ShieldCheck, XCircle, 
  Eye, Download, Search, Calendar, User, Mail, Phone,
  GraduationCap, Clock, AlertCircle, Check, X,
  Info, UserPlus, MessageCircle, BookOpen, CreditCard,
  Home, ArrowRight, Send, Sparkles, TrendingUp, Award,
  BellRing, FileCheck, Users, Building2, School, Hash
} from 'lucide-react';
import { admissionManagementService, type AdmissionApplication } from '../../../services/adminService';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [manifest, setManifest] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | AdmissionApplication['status']>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; name: string } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    enrolled: 0
  });

  const filtered = useMemo(() => {
    let result = filter === 'ALL' ? applications : applications.filter((application) => application.status === filter);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => 
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(term) ||
        (app.parentName || '').toLowerCase().includes(term) ||
        (app.email || '').toLowerCase().includes(term) ||
        (app.parentPhone || app.phone || '').includes(term)
      );
    }
    
    return result;
  }, [applications, filter, searchTerm]);

  // Update stats when applications change
  useEffect(() => {
    setStats({
      total: applications.length,
      pending: applications.filter(a => a.status === 'PENDING').length,
      approved: applications.filter(a => a.status === 'APPROVED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
      enrolled: applications.filter(a => a.status === 'ENROLLED').length
    });
  }, [applications]);

  const load = async () => {
    setLoading(true);
    try {
      const [items, flowManifest] = await Promise.all([
        admissionManagementService.list(),
        admissionManagementService.manifest()
      ]);
      setApplications(items);
      setManifest(flowManifest);
    } catch (error) {
      toast.error('Failed to load admission applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (application: AdmissionApplication, status: AdmissionApplication['status']) => {
    let notes: string | undefined;
    
    if (status === 'REJECTED') {
      notes = window.prompt('Please provide a reason for rejection:') || 'Rejected after document review.';
      if (!notes) return;
    } else if (status === 'APPROVED') {
      notes = window.prompt('Add any approval notes (optional):') || 'Application approved and processed.';
    }
    
    setWorkingId(application.id);
    try {
      const response = await admissionManagementService.updateStatus(application.id, status, notes);
      setApplications((current) => current.map((item) => item.id === application.id ? response.data : item));
      
      // Show success animation and feedback
      setLastAction({ type: status, name: `${application.firstName} ${application.lastName}` });
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      
      toast.success(`Application ${status.toLowerCase()} successfully!`);
      
      if (status === 'APPROVED') {
        toast.success('✓ Student record created\n✓ Class auto-assigned\n✓ Admission number generated\n✓ Parent notified via SMS & Email', {
          duration: 5000,
          icon: '🎉'
        });
      }
      
      if (status === 'ENROLLED') {
        toast.success('✓ Student enrolled successfully\n✓ Timetable generated\n✓ Library card created\n✓ Welcome kit prepared', {
          duration: 5000,
          icon: '✅'
        });
      }
    } catch (error) {
      toast.error(status === 'APPROVED' ? 'Approval automation failed' : 'Unable to update application');
    } finally {
      setWorkingId(null);
    }
  };

  const viewDetails = (application: AdmissionApplication) => {
    setSelectedApp(application);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENROLLED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock size={14} />;
      case 'APPROVED': return <CheckCircle2 size={14} />;
      case 'ENROLLED': return <UserPlus size={14} />;
      case 'REJECTED': return <XCircle size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getAutomationSteps = () => {
    return [
      { icon: <CheckCircle2 size={16} />, text: 'Create student record', completed: true },
      { icon: <BookOpen size={16} />, text: 'Auto-assign class & stream', completed: true },
      { icon: <Hash size={16} />, text: 'Generate admission number', completed: true },
      { icon: <Users size={16} />, text: 'Assign class teacher', completed: true },
      { icon: <MessageCircle size={16} />, text: 'Create parent account', completed: true },
      { icon: <BellRing size={16} />, text: 'Send welcome notifications', completed: true },
      { icon: <CreditCard size={16} />, text: 'Generate fee structure', completed: false },
      { icon: <School size={16} />, text: 'Prepare orientation', completed: false }
    ];
  };

  return (
    <div className="admin-admissions-page">
      {/* Success Animation Toast */}
      {showSuccessAnimation && lastAction && (
        <div className="success-animation">
          <div className="success-content">
            <div className="success-icon">
              {lastAction.type === 'APPROVED' && <CheckCircle2 size={32} />}
              {lastAction.type === 'ENROLLED' && <UserPlus size={32} />}
              {lastAction.type === 'REJECTED' && <XCircle size={32} />}
            </div>
            <div className="success-text">
              <h4>Application {lastAction.type.toLowerCase()}!</h4>
              <p>{lastAction.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admissions Management</h1>
          <p className="text-gray-500 mt-1">Review and process student applications with automated enrollment</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Applications</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon enrolled">
            <UserPlus size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.enrolled}</span>
            <span className="stat-label">Enrolled</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rejected">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Automation Pipeline - Visual Flow */}
      <div className="automation-pipeline">
        <div className="pipeline-header">
          <Sparkles size={20} />
          <h3>Automation Pipeline</h3>
          <span className="pipeline-badge">8 Steps</span>
        </div>
        <div className="pipeline-steps">
          {getAutomationSteps().map((step, idx) => (
            <div key={idx} className={`pipeline-step ${step.completed ? 'completed' : 'pending'}`}>
              <div className="step-indicator">
                {step.completed ? <Check size={12} /> : idx + 1}
              </div>
              <span className="step-text">{step.text}</span>
              {step.completed && <CheckCircle2 size={12} className="step-check" />}
            </div>
          ))}
        </div>
      </div>

      {/* Filters - Fixed with APPROVED included */}
      <div className="filters-bar">
        <div className="filter-buttons">
          {(['PENDING', 'APPROVED', 'ENROLLED', 'REJECTED', 'ALL'] as const).map((item) => (
            <button
              key={item}
              className={`filter-btn ${filter === item ? 'active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item === 'ALL' ? 'All Applications' : item.charAt(0) + item.slice(1).toLowerCase()}
              {item !== 'ALL' && (
                <span className="filter-count">
                  {applications.filter(a => a.status === item).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, parent, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="loading-state">
          <div className="loader" />
          <p>Loading applications...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Information</th>
                <th>Parent/Guardian</th>
                <th>Documents</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((application) => (
                <tr key={application.id} className="application-row">
                  <td className="student-info">
                    <div className="student-avatar">
                      <span className="avatar-initials">
                        {application.firstName[0]}{application.lastName[0]}
                      </span>
                    </div>
                    <div className="student-details">
                      <strong>{application.firstName} {application.lastName}</strong>
                      <div className="meta-info">
                        <span><Calendar size={12} /> {formatDate(application.dateOfBirth)}</span>
                        <span><User size={12} /> {application.gender}</span>
                      </div>
                      {application.previousSchool && (
                        <span className="previous-school">
                          <GraduationCap size={12} /> {application.previousSchool}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="parent-info">
                    <strong>{application.parentName || 'Guardian'}</strong>
                    <div className="contact-info">
                      {application.parentPhone && (
                        <span><Phone size={12} /> {application.parentPhone}</span>
                      )}
                      {application.parentEmail && (
                        <span><Mail size={12} /> {application.parentEmail}</span>
                      )}
                    </div>
                  </td>
                  <td className="documents">
                    {application.documents.length ? (
                      <div className="document-list">
                        {application.documents.slice(0, 2).map((document) => (
                          <a key={document} href={document} target="_blank" rel="noreferrer" className="document-link">
                            <FileText size={14} /> View
                          </a>
                        ))}
                        {application.documents.length > 2 && (
                          <span className="more-docs">+{application.documents.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="no-docs">No documents</span>
                    )}
                  </td>
                  <td className="date-info">
                    <span className="date">{formatDate(application.applicationDate)}</span>
                    <span className="time">{formatDateTime(application.applicationDate).split(',')[1]}</span>
                  </td>
                  <td className="status-cell">
                    <div className="status-wrapper">
                      <span className={`status-badge ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                      {application.status === 'APPROVED' && (
                        <div className="status-progress">
                          <div className="progress-bar" style={{ width: '60%' }}></div>
                          <span>Awaiting enrollment</span>
                        </div>
                      )}
                      {application.status === 'ENROLLED' && (
                        <div className="status-progress completed">
                          <CheckCircle2 size={12} />
                          <span>Fully enrolled</span>
                        </div>
                      )}
                    </div>
                    {application.notes && (
                      <span className="status-note" title={application.notes}>
                        <Info size={12} />
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn view"
                      onClick={() => viewDetails(application)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {application.status === 'PENDING' && (
                      <>
                        <button
                          className="action-btn approve"
                          disabled={workingId === application.id}
                          onClick={() => updateStatus(application, 'APPROVED')}
                          title="Approve Application"
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button
                          className="action-btn reject"
                          disabled={workingId === application.id}
                          onClick={() => updateStatus(application, 'REJECTED')}
                          title="Reject Application"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    {application.status === 'APPROVED' && (
                      <button
                        className="action-btn enroll"
                        onClick={() => updateStatus(application, 'ENROLLED')}
                        title="Complete Enrollment"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                    {application.status === 'ENROLLED' && (
                      <button
                        className="action-btn view-enrolled"
                        onClick={() => viewDetails(application)}
                        title="View Enrolled Student"
                      >
                        <GraduationCap size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <div className="empty-content">
                      <GraduationCap size={48} className="empty-icon" />
                      <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} applications found</p>
                      <button className="btn-primary-sm" onClick={() => setFilter('ALL')}>
                        View all applications
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal with Automation Preview */}
      {showDetailsModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h4>Student Information</h4>
                <div className="details-grid">
                  <div><label>Full Name</label><span>{selectedApp.firstName} {selectedApp.lastName}</span></div>
                  <div><label>Date of Birth</label><span>{formatDate(selectedApp.dateOfBirth)}</span></div>
                  <div><label>Gender</label><span>{selectedApp.gender}</span></div>
                  <div><label>Previous School</label><span>{selectedApp.previousSchool || 'N/A'}</span></div>
                </div>
              </div>
              <div className="details-section">
                <h4>Parent/Guardian Information</h4>
                <div className="details-grid">
                  <div><label>Name</label><span>{selectedApp.parentName || 'N/A'}</span></div>
                  <div><label>Phone</label><span>{selectedApp.parentPhone || selectedApp.phone || 'N/A'}</span></div>
                  <div><label>Email</label><span>{selectedApp.parentEmail || selectedApp.email || 'N/A'}</span></div>
                </div>
              </div>
              <div className="details-section">
                <h4>Documents</h4>
                <div className="documents-grid">
                  {selectedApp.documents.map((doc, idx) => (
                    <a key={idx} href={doc} target="_blank" rel="noreferrer" className="document-card">
                      <FileText size={20} />
                      <span>Document {idx + 1}</span>
                      <Download size={14} />
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Automation Preview - What will happen */}
              {selectedApp.status === 'PENDING' && (
                <div className="details-section automation-preview">
                  <h4>What happens after approval?</h4>
                  <div className="automation-checklist">
                    {getAutomationSteps().map((step, idx) => (
                      <div key={idx} className="checklist-item">
                        <div className="checklist-icon pending">
                          <Clock size={14} />
                        </div>
                        <span>{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedApp.notes && (
                <div className="details-section">
                  <h4>Notes</h4>
                  <p className="notes-text">{selectedApp.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedApp.status === 'PENDING' && (
                <>
                  <button className="btn-primary" onClick={() => {
                    updateStatus(selectedApp, 'APPROVED');
                    setShowDetailsModal(false);
                  }}>
                    <ShieldCheck size={16} /> Approve Application
                  </button>
                  <button className="btn-danger" onClick={() => {
                    updateStatus(selectedApp, 'REJECTED');
                    setShowDetailsModal(false);
                  }}>
                    <XCircle size={16} /> Reject Application
                  </button>
                </>
              )}
              {selectedApp.status === 'APPROVED' && (
                <button className="btn-primary" onClick={() => {
                  updateStatus(selectedApp, 'ENROLLED');
                  setShowDetailsModal(false);
                }}>
                  <UserPlus size={16} /> Complete Enrollment
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-admissions-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Success Animation */
        .success-animation {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 2000;
          animation: slideInRight 0.3s ease-out;
        }

        .success-content {
          background: white;
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          border-left: 4px solid #10b981;
        }

        .success-icon {
          width: 48px;
          height: 48px;
          background: #d1fae5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
        }

        .success-text h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .success-text p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total { background: #e0e7ff; color: #4338ca; }
        .stat-icon.pending { background: #fef3c7; color: #d97706; }
        .stat-icon.approved { background: #d1fae5; color: #059669; }
        .stat-icon.enrolled { background: #dbeafe; color: #2563eb; }
        .stat-icon.rejected { background: #fee2e2; color: #dc2626; }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          display: block;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        /* Automation Pipeline */
        .automation-pipeline {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          color: white;
        }

        .pipeline-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .pipeline-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .pipeline-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
        }

        .pipeline-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .pipeline-step.completed {
          background: rgba(16,185,129,0.3);
        }

        .step-indicator {
          width: 20px;
          height: 20px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }

        .step-check {
          color: #10b981;
        }

        /* Filters */
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-btn.active {
          background: #1d8a8a;
          color: white;
          border-color: #1d8a8a;
        }

        .filter-count {
          background: rgba(0,0,0,0.1);
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 12px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          background: white;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 200px;
        }

        /* Table */
        .table-container {
          background: white;
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 16px;
          background: #f9fafb;
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        .data-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .application-row:hover {
          background: #f9fafb;
        }

        .student-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .student-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .student-details strong {
          display: block;
          margin-bottom: 4px;
        }

        .meta-info {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .meta-info span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #6b7280;
        }

        .progress-bar {
          height: 3px;
          background: #10b981;
          border-radius: 3px;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.view { background: #e0e7ff; color: #4338ca; }
        .action-btn.approve { background: #d1fae5; color: #059669; }
        .action-btn.reject { background: #fee2e2; color: #dc2626; }
        .action-btn.enroll { background: #dbeafe; color: #2563eb; }
        .action-btn.view-enrolled { background: #f3e8ff; color: #9333ea; }

        /* Modal */
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
          max-width: 650px;
          max-height: 80vh;
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

        .details-section {
          margin-bottom: 24px;
        }

        .details-section h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #374151;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .details-grid div {
          display: flex;
          flex-direction: column;
        }

        .details-grid label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .automation-preview {
          background: #f0fdf4;
          border-radius: 12px;
          padding: 16px;
        }

        .automation-checklist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }

        .checklist-icon.pending {
          color: #f59e0b;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-primary, .btn-secondary, .btn-danger {
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
        .btn-danger { background: #dc2626; color: white; }

        .empty-state {
          text-align: center;
          padding: 60px !important;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}