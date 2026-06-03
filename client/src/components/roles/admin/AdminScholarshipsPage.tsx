// client/src/components/roles/admin/AdminScholarshipsPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, 
  CheckCircle, XCircle, Clock, Eye, Send, Download,
  Upload, Filter, Calendar, DollarSign, Users,
  Building2, FileText, Mail, MessageCircle, Bell,
  TrendingUp, Award, Heart, Globe, Link, Copy,
  Share2, Printer, BarChart3, PieChart, Settings,
  UserPlus, UserCheck, UserX, AlertCircle, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { financeService, communicationService } from '../../../services/adminService';
import type { ScholarshipRecipient } from '../../../types/bursar';
import type { ScholarshipApplication, Sponsor } from '../../../types/bursar';

export default function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState<ScholarshipRecipient[]>([]);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'scholarships' | 'applications' | 'sponsors' | 'reports'>('scholarships');
  const [showModal, setShowModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showPublicDisplay, setShowPublicDisplay] = useState(false);
  const [stats, setStats] = useState({
    totalScholarships: 0,
    totalAmount: 0,
    activeSponsors: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    disbursedAmount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scholarshipsData, applicationsData, sponsorsData] = await Promise.all([
        financeService.getScholarships(),
        financeService.getScholarshipApplications(),
        financeService.getSponsors()
      ]);
      setScholarships(scholarshipsData || []);
      setApplications(applicationsData || []);
      setSponsors(sponsorsData || []);
      
      setStats({
        totalScholarships: scholarshipsData?.length || 0,
        totalAmount: scholarshipsData?.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0,
        activeSponsors: sponsorsData?.filter((s: any) => s.active).length || 0,
        pendingApplications: applicationsData?.filter((a: any) => a.status === 'pending').length || 0,
        approvedApplications: applicationsData?.filter((a: any) => a.status === 'approved').length || 0,
        disbursedAmount: scholarshipsData?.filter((s: any) => s.status === 'disbursed').reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateScholarship = async (data: any) => {
    try {
      await financeService.createScholarship(data);
      toast.success('Scholarship awarded successfully');
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create scholarship');
    }
  };

  const handleUpdateScholarship = async (id: string, data: any) => {
    try {
      await financeService.updateScholarship(id, data);
      toast.success('Scholarship updated');
      fetchData();
      setShowModal(false);
      setEditing(null);
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDeleteScholarship = async (id: string) => {
    if (!confirm('Delete this scholarship record?')) return;
    try {
      await financeService.deleteScholarship(id);
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleApplicationAction = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await financeService.updateApplicationStatus(id, status, notes);
      toast.success(`Application ${status}`);
      fetchData();
      if (status === 'approved') {
        await communicationService.sendNotification({
          type: 'scholarship_approved',
          recipient: applications.find(a => a.id === id)?.studentId,
          message: `Congratulations! Your scholarship application has been approved.`
        });
      }
    } catch (error) {
      toast.error('Failed to update application');
    }
  };

  const handleCreateSponsor = async (data: any) => {
    try {
      await financeService.createSponsor(data);
      toast.success('Sponsor registered');
      fetchData();
      setShowSponsorModal(false);
    } catch (error) {
      toast.error('Failed to create sponsor');
    }
  };

  const handleSendNotification = async (type: string, recipient: string, message: string) => {
    try {
      await communicationService.sendNotification({ type, recipient, message });
      toast.success('Notification sent');
      setShowSendModal(false);
    } catch (error) {
      toast.error('Failed to send');
    }
  };

  const handlePublicDisplay = async () => {
    const publicData = scholarships.filter(s => s.status === 'active').map(s => ({
      studentName: s.studentName,
      amount: s.amount,
      sponsor: s.sponsor,
      date: s.dateAwarded
    }));
    await financeService.publishScholarships(publicData);
    toast.success('Scholarships published publicly');
    setShowPublicDisplay(false);
  };

  const filteredScholarships = scholarships.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sponsor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(a => 
    a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSponsors = sponsors.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="scholarships-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Scholarship Management</h1>
          <p>Manage scholarships, process applications, and coordinate with sponsors</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCcw size={16} /> Refresh
          </button>
          <button onClick={() => setShowPublicDisplay(true)} className="btn-secondary">
            <Globe size={16} /> Public Display
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Award Scholarship
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><Award size={24} /></div>
          <div><span className="stat-value">{stats.totalScholarships}</span><span className="stat-label">Total Scholarships</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amount"><DollarSign size={24} /></div>
          <div><span className="stat-value">KES {stats.totalAmount.toLocaleString()}</span><span className="stat-label">Total Amount</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sponsors"><Building2 size={24} /></div>
          <div><span className="stat-value">{stats.activeSponsors}</span><span className="stat-label">Active Sponsors</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending"><Clock size={24} /></div>
          <div><span className="stat-value">{stats.pendingApplications}</span><span className="stat-label">Pending Applications</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved"><CheckCircle size={24} /></div>
          <div><span className="stat-value">{stats.approvedApplications}</span><span className="stat-label">Approved</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon disbursed"><Heart size={24} /></div>
          <div><span className="stat-value">KES {stats.disbursedAmount.toLocaleString()}</span><span className="stat-label">Disbursed</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'scholarships' ? 'active' : ''}`} onClick={() => setActiveTab('scholarships')}>
          <Award size={16} /> Scholarships
        </button>
        <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          <FileText size={16} /> Applications ({stats.pendingApplications})
        </button>
        <button className={`tab ${activeTab === 'sponsors' ? 'active' : ''}`} onClick={() => setActiveTab('sponsors')}>
          <Building2 size={16} /> Sponsors
        </button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <BarChart3 size={16} /> Reports
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} />
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`} 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Scholarships Tab */}
      {activeTab === 'scholarships' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Amount</th><th>Sponsor</th><th>Date Awarded</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredScholarships.map(s => (
                <tr key={s.id}>
                  <td><span className="student-name">{s.studentName}</span><small>{s.admissionNumber}</small></td>
                  <td><strong>KES {s.amount.toLocaleString()}</strong></td>
                  <td>{s.sponsor || 'School Fund'}</td>
                  <td>{s.dateAwarded ? new Date(s.dateAwarded).toLocaleDateString() : '-'}</td>
                  <td><span className={`status-badge ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="actions">
                    <button onClick={() => { setEditing(s); setShowModal(true); }}><Edit size={14} /></button>
                    <button
                      onClick={() => {
                        if (!s.id) {
                          toast.error('Unable to delete scholarship: missing ID');
                          return;
                        }
                        void handleDeleteScholarship(s.id);
                      }}
                      className="danger"
                    ><Trash2 size={14} /></button>
                    <button onClick={() => handleSendNotification('scholarship', s.studentId, `Your scholarship of KES ${s.amount} has been awarded`)}><Send size={14} /></button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="applications-container">
          {filteredApplications.map(app => (
            <div key={app.id} className="application-card">
              <div className="application-header">
                <div>
                  <h4>{app.studentName}</h4>
                  <span className={`status-badge ${getStatusBadge(app.status)}`}>{app.status}</span>
                </div>
                <div className="application-amount">KES {(app.amount || 0).toLocaleString()}</div>
              </div>
              <div className="application-details">
                <div><strong>Class:</strong> {app.class}</div>
                <div><strong>Admission No:</strong> {app.admissionNumber}</div>
                <div><strong>Applied:</strong> {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'}</div>
              </div>
              <div className="application-reason">
                <strong>Reason for application:</strong>
                <p>{app.reason}</p>
              </div>
              <div className="application-metrics">
                <div><strong>Academic Performance:</strong> {app.academicPerformance}</div>
                <div><strong>Financial Status:</strong> {app.financialStatus}</div>
              </div>
              {app.supportingDocs && app.supportingDocs.length > 0 && (
                <div className="application-docs">
                  <strong>Supporting Documents:</strong>
                  {app.supportingDocs.map((doc, i) => (
                    <a key={i} href={doc} target="_blank" rel="noopener noreferrer"><FileText size={14} /> Document {i+1}</a>
                  ))}
                </div>
              )}
              {app.status === 'pending' && (
                <div className="application-actions">
                  <button className="btn-approve" onClick={() => handleApplicationAction(app.id, 'approved')}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="btn-reject" onClick={() => {
                    const notes = prompt('Reason for rejection:');
                    if (notes) handleApplicationAction(app.id, 'rejected', notes);
                  }}>
                    <XCircle size={16} /> Reject
                  </button>
                  <button className="btn-review" onClick={() => setSelectedApplication(app)}>
                    <Eye size={16} /> Review Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sponsors Tab */}
      {activeTab === 'sponsors' && (
        <div>
          <div className="table-header-actions">
            <button onClick={() => setShowSponsorModal(true)} className="btn-primary"><Plus size={16} /> Add Sponsor</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Sponsor</th><th>Organization</th><th>Contact</th><th>Total Donation</th><th>Active Scholarships</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredSponsors.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.organization}</td>
                    <td><small>{s.email}</small><br /><small>{s.phone}</small></td>
                    <td>KES {(s.totalDonation || 0).toLocaleString()}</td>
                    <td>{s.activeScholarships}</td>
                    <td className="actions">
                      <button><Mail size={14} /></button>
                      <button><MessageCircle size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-container">
          <div className="report-card">
            <h3>Scholarship Summary</h3>
            <div className="report-stats">
              <div><span>Total Awarded:</span><strong>KES {stats.totalAmount.toLocaleString()}</strong></div>
              <div><span>Average Scholarship:</span><strong>KES {(stats.totalAmount / stats.totalScholarships || 0).toLocaleString()}</strong></div>
              <div><span>Disbursement Rate:</span><strong>{((stats.disbursedAmount / stats.totalAmount) * 100 || 0).toFixed(1)}%</strong></div>
            </div>
            <button className="btn-secondary" onClick={() => {
              financeService.exportReport('scholarships');
              toast.success('Report exported');
            }}><Download size={16} /> Export Report</button>
          </div>
          <div className="report-card">
            <h3>Sponsor Contributions</h3>
            <div className="sponsor-list">
              {sponsors.map(s => (
                <div key={s.id} className="sponsor-contribution">
                  <span>{s.organization}</span>
                  <span className="amount">KES {(s.totalDonation || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scholarship Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit' : 'Award'} Scholarship</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  studentId: formData.get('studentId'),
                  studentName: formData.get('studentName'),
                  amount: parseFloat(formData.get('amount') as string),
                  sponsor: formData.get('sponsor'),
                  status: formData.get('status'),
                  dateAwarded: formData.get('dateAwarded')
                };
                if (editing?.id) handleUpdateScholarship(editing.id, data);
                else handleCreateScholarship(data);
              }}>
                <div className="form-group"><label>Student Name *</label><input name="studentName" defaultValue={editing?.studentName} required /></div>
                <div className="form-group"><label>Student ID</label><input name="studentId" defaultValue={editing?.studentId} /></div>
                <div className="form-group"><label>Amount (KES) *</label><input type="number" name="amount" defaultValue={editing?.amount} required /></div>
                <div className="form-group"><label>Sponsor</label><input name="sponsor" defaultValue={editing?.sponsor} placeholder="School Fund or Sponsor Name" /></div>
                <div className="form-group"><label>Status</label><select name="status" defaultValue={editing?.status || 'active'}>
                  <option value="active">Active</option><option value="disbursed">Disbursed</option><option value="completed">Completed</option>
                </select></div>
                <div className="form-group"><label>Date Awarded</label><input type="date" name="dateAwarded" defaultValue={editing?.dateAwarded?.split('T')[0] || new Date().toISOString().split('T')[0]} /></div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary">Save</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="modal-overlay" onClick={() => setShowSponsorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Register Sponsor</h3><button className="close-btn" onClick={() => setShowSponsorModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateSponsor(Object.fromEntries(formData));
              }}>
                <div className="form-group"><label>Sponsor Name *</label><input name="name" required /></div>
                <div className="form-group"><label>Organization *</label><input name="organization" required /></div>
                <div className="form-group"><label>Email</label><input type="email" name="email" /></div>
                <div className="form-group"><label>Phone</label><input name="phone" /></div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setShowSponsorModal(false)}>Cancel</button><button type="submit" className="btn-primary">Register</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scholarships-page { padding: 24px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 28px; margin: 0 0 8px 0; }
        .page-header p { margin: 0; color: #6b7280; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid #e5e7eb; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.total { background: #e0e7ff; color: #4338ca; }
        .stat-icon.amount { background: #d1fae5; color: #059669; }
        .stat-icon.sponsors { background: #fed7aa; color: #c2410c; }
        .stat-icon.pending { background: #fef3c7; color: #d97706; }
        .stat-icon.approved { background: #dbeafe; color: #2563eb; }
        .stat-icon.disbursed { background: #fae8ff; color: #a855f7; }
        .stat-value { font-size: 20px; font-weight: bold; display: block; }
        .stat-label { font-size: 12px; color: #6b7280; }
        .tabs { display: flex; gap: 8px; background: white; padding: 8px 16px; border-radius: 60px; margin-bottom: 24px; flex-wrap: wrap; }
        .tab { display: flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 40px; border: none; background: transparent; cursor: pointer; }
        .tab.active { background: #1d8a8a; color: white; }
        .search-bar { background: white; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .search-bar input { flex: 1; border: none; outline: none; }
        .table-container { background: white; border-radius: 16px; overflow-x: auto; border: 1px solid #e5e7eb; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        .data-table th { background: #f9fafb; font-weight: 600; }
        .student-name { display: block; font-weight: 500; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .actions { display: flex; gap: 8px; }
        .actions button { padding: 6px; border-radius: 6px; border: none; cursor: pointer; background: #f3f4f6; }
        .actions button.danger { color: #dc2626; }
        .applications-container { display: flex; flex-direction: column; gap: 16px; }
        .application-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e5e7eb; }
        .application-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .application-header h4 { margin: 0; font-size: 18px; }
        .application-amount { font-size: 24px; font-weight: bold; color: #1d8a8a; }
        .application-details { display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; }
        .application-reason { background: #f9fafb; padding: 12px; border-radius: 12px; margin-bottom: 16px; }
        .application-reason p { margin: 8px 0 0; color: #4b5563; }
        .application-metrics { display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; }
        .application-docs { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
        .application-docs a { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f3f4f6; border-radius: 6px; text-decoration: none; font-size: 12px; }
        .application-actions { display: flex; gap: 12px; margin-top: 16px; }
        .btn-approve, .btn-reject, .btn-review { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-approve { background: #d1fae5; color: #059669; }
        .btn-reject { background: #fee2e2; color: #dc2626; }
        .btn-review { background: #f3f4f6; color: #374151; }
        .table-header-actions { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .reports-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; }
        .report-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e5e7eb; }
        .report-card h3 { margin: 0 0 16px 0; }
        .report-stats { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .report-stats div { display: flex; justify-content: space-between; }
        .sponsor-list { display: flex; flex-direction: column; gap: 12px; }
        .sponsor-contribution { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .sponsor-contribution .amount { font-weight: 600; color: #1d8a8a; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 20px; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; }
        .modal-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .btn-primary, .btn-secondary { padding: 8px 16px; border-radius: 10px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
      `}</style>
    </div>
  );
}