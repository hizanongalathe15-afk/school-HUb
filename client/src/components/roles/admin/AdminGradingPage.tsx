// client/src/components/roles/admin/AdminGradingPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, RefreshCcw, X, Upload,
  Save, CheckSquare, Square, Shield,
  AlertTriangle, CheckCircle, XCircle, Clock,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService, governmentService } from '../../../services/adminService';
import type { GradingSystem, GovernmentExamResult, ApplicantFilter } from '../../../types/admin';

interface GradingLevel {
  minScore: number;
  maxScore: number;
  grade: string;
  points: number;
  description?: string;
  governmentEquivalency?: string;
  universityPoints?: number;
}

interface GovernmentIntegration {
  connected: boolean;
  lastSync: string;
  examBoard: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
  apiKey?: string;
  endpoint?: string;
}

interface Applicant {
  id: string;
  name: string;
  admissionNumber: string;
  appliedFor: string;
  examYear: number;
  examType: string;
  results: GovernmentExamResult[];
  status: 'pending' | 'qualified' | 'disqualified' | 'under_review';
  filterReason?: string;
  applicationDate: string;
}

export default function AdminGradingPage() {
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrading, setEditingGrading] = useState<GradingSystem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGovernmentModal, setShowGovernmentModal] = useState(false);
  const [showApplicantFilter, setShowApplicantFilter] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [governmentIntegration, setGovernmentIntegration] = useState<GovernmentIntegration>({
    connected: false,
    lastSync: '',
    examBoard: 'KNEC'
  });
  const [applicantFilters, setApplicantFilters] = useState<ApplicantFilter>({
    minMeanGrade: 'C+',
    minPoints: 7,
    allowedGrades: ['A', 'A-', 'B+', 'B', 'B-', 'C+'],
    autoRejectBelow: 'C',
    requireMathPass: true,
    requireEnglishPass: true,
    requireSciencePass: false,
    customSubjects: []
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    passMark: 50,
    levels: [] as GradingLevel[],
    governmentBoard: 'KNEC' as 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER',
    equivalencyMap: {} as Record<string, string>
  });

  const fetchGradingSystems = async () => {
    setLoading(true);
    try {
      const data = await academicManagementService.getGradingSystems();
      setGradingSystems(data);
      const govStatus = await governmentService.getIntegrationStatus();
      setGovernmentIntegration(govStatus);
    } catch (error) {
      toast.error('Failed to load grading systems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGradingSystems(); }, []);

  const openModal = (grading?: GradingSystem) => {
    if (grading) {
      setEditingGrading(grading);
      setFormData({
        name: grading.name,
        description: grading.description || '',
        passMark: grading.passMark || 50,
        levels: grading.levels || [],
        governmentBoard: grading.governmentBoard || 'KNEC',
        equivalencyMap: grading.equivalencyMap || {}
      });
    } else {
      setEditingGrading(null);
      setFormData({
        name: '',
        description: '',
        passMark: 50,
        levels: [
          { minScore: 80, maxScore: 100, grade: 'A', points: 12, description: 'Excellent', governmentEquivalency: 'A', universityPoints: 12 },
          { minScore: 75, maxScore: 79, grade: 'A-', points: 11, description: 'Very Good', governmentEquivalency: 'A-', universityPoints: 11 },
          { minScore: 70, maxScore: 74, grade: 'B+', points: 10, description: 'Good', governmentEquivalency: 'B+', universityPoints: 10 },
          { minScore: 65, maxScore: 69, grade: 'B', points: 9, description: 'Above Average', governmentEquivalency: 'B', universityPoints: 9 },
          { minScore: 60, maxScore: 64, grade: 'B-', points: 8, description: 'Average', governmentEquivalency: 'B-', universityPoints: 8 },
          { minScore: 55, maxScore: 59, grade: 'C+', points: 7, description: 'Satisfactory', governmentEquivalency: 'C+', universityPoints: 7 },
          { minScore: 50, maxScore: 54, grade: 'C', points: 6, description: 'Fair', governmentEquivalency: 'C', universityPoints: 6 },
          { minScore: 45, maxScore: 49, grade: 'C-', points: 5, description: 'Below Average', governmentEquivalency: 'C-', universityPoints: 5 },
          { minScore: 40, maxScore: 44, grade: 'D+', points: 4, description: 'Poor', governmentEquivalency: 'D+', universityPoints: 4 },
          { minScore: 35, maxScore: 39, grade: 'D', points: 3, description: 'Very Poor', governmentEquivalency: 'D', universityPoints: 3 },
          { minScore: 30, maxScore: 34, grade: 'D-', points: 2, description: 'Weak', governmentEquivalency: 'D-', universityPoints: 2 },
          { minScore: 0, maxScore: 29, grade: 'E', points: 1, description: 'Fail', governmentEquivalency: 'E', universityPoints: 0 }
        ],
        governmentBoard: 'KNEC',
        equivalencyMap: {}
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGrading(null);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (editingGrading) {
        await academicManagementService.updateGradingSystem(editingGrading.id, payload);
        toast.success('Grading system updated');
      } else {
        await academicManagementService.createGradingSystem(payload as any);
        toast.success('Grading system created');
      }
      fetchGradingSystems();
      closeModal();
    } catch (error) {
      toast.error('Failed to save grading system');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this grading system?')) return;
    try {
      await academicManagementService.deleteGradingSystem(id);
      toast.success('Deleted');
      fetchGradingSystems();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(g => g.id));
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} grading systems?`)) return;
    try {
      await Promise.all(selectedIds.map(id => academicManagementService.deleteGradingSystem(id)));
      toast.success(`Deleted ${selectedIds.length} systems`);
      setSelectedIds([]);
      fetchGradingSystems();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const bulkExport = async () => {
    try {
      const blob = await academicManagementService.bulkExport({ type: 'grading', ids: selectedIds.length ? selectedIds : undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grading-systems-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch {
      toast.error('Export failed');
    }
  };

  // Government Integration
  const connectToGovernment = async () => {
    try {
      await governmentService.connect({
        examBoard: governmentIntegration.examBoard,
        apiKey: governmentIntegration.apiKey,
        endpoint: governmentIntegration.endpoint
      });
      setGovernmentIntegration({ ...governmentIntegration, connected: true, lastSync: new Date().toISOString() });
      toast.success(`Connected to ${governmentIntegration.examBoard}`);
    } catch (error) {
      toast.error('Connection failed');
    }
  };

  const syncGovernmentResults = async () => {
    try {
      const results = await governmentService.syncResults(governmentIntegration.examBoard);
      toast.success(`Synced ${results.length} results from ${governmentIntegration.examBoard}`);
      // Process and filter applicants
      processApplicants(results);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const processApplicants = (results: GovernmentExamResult[]) => {
    const processed: Applicant[] = results.map(r => {
      const meetsCriteria = evaluateApplicant(r);
      return {
        id: r.studentId,
        name: r.studentName,
        admissionNumber: r.admissionNumber,
        appliedFor: r.appliedProgram || 'General Admission',
        examYear: r.examYear,
        examType: r.examType,
        results: [r],
        status: meetsCriteria ? 'qualified' : 'disqualified',
        filterReason: meetsCriteria ? undefined : getRejectionReason(r),
        applicationDate: new Date().toISOString()
      };
    });
    setApplicants(processed);
    setShowApplicantFilter(true);
  };

  const evaluateApplicant = (result: GovernmentExamResult): boolean => {
    const meanGrade = result.meanGrade;
    const totalPoints = result.totalPoints;
    const mathGrade = result.subjectGrades.find(s => s.subject === 'Mathematics')?.grade || '';
    const englishGrade = result.subjectGrades.find(s => s.subject === 'English')?.grade || '';
    
    const gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    const meanGradeIndex = gradeOrder.indexOf(meanGrade);
    const minGradeIndex = gradeOrder.indexOf(applicantFilters.minMeanGrade);
    
    if (meanGradeIndex > minGradeIndex) return false;
    if (totalPoints < applicantFilters.minPoints) return false;
    if (applicantFilters.autoRejectBelow && gradeOrder.indexOf(meanGrade) > gradeOrder.indexOf(applicantFilters.autoRejectBelow)) return false;
    if (applicantFilters.requireMathPass && (mathGrade === 'E' || mathGrade === 'D-' || mathGrade === 'D')) return false;
    if (applicantFilters.requireEnglishPass && (englishGrade === 'E' || englishGrade === 'D-' || englishGrade === 'D')) return false;
    
    return true;
  };

  const getRejectionReason = (result: GovernmentExamResult): string => {
    const reasons = [];
    const gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    
    if (gradeOrder.indexOf(result.meanGrade) > gradeOrder.indexOf(applicantFilters.minMeanGrade)) {
      reasons.push(`Mean grade ${result.meanGrade} below minimum ${applicantFilters.minMeanGrade}`);
    }
    if (result.totalPoints < applicantFilters.minPoints) {
      reasons.push(`Total points ${result.totalPoints} below minimum ${applicantFilters.minPoints}`);
    }
    if (applicantFilters.requireMathPass) {
      const mathGrade = result.subjectGrades.find(s => s.subject === 'Mathematics')?.grade || '';
      if (mathGrade === 'E' || mathGrade === 'D-' || mathGrade === 'D') {
        reasons.push(`Failed Mathematics (${mathGrade})`);
      }
    }
    if (applicantFilters.requireEnglishPass) {
      const englishGrade = result.subjectGrades.find(s => s.subject === 'English')?.grade || '';
      if (englishGrade === 'E' || englishGrade === 'D-' || englishGrade === 'D') {
        reasons.push(`Failed English (${englishGrade})`);
      }
    }
    return reasons.join('; ');
  };

  const updateApplicantStatus = async (applicantId: string, status: Applicant['status'], reason?: string) => {
    setApplicants(prev => prev.map(a => 
      a.id === applicantId ? { ...a, status, filterReason: reason } : a
    ));
    await governmentService.updateApplicantStatus(applicantId, status, reason);
    toast.success(`Applicant ${status}`);
  };

  const bulkProcessApplicants = async () => {
    const qualified = applicants.filter(a => a.status === 'qualified');
    const disqualified = applicants.filter(a => a.status === 'disqualified');
    
    await governmentService.bulkProcess(qualified.map(a => a.id), 'qualified');
    await governmentService.bulkProcess(disqualified.map(a => a.id), 'disqualified');
    
    toast.success(`Processed ${qualified.length} qualified, ${disqualified.length} disqualified`);
    await sendNotifications(qualified, disqualified);
  };

  const sendNotifications = async (qualified: Applicant[], disqualified: Applicant[]) => {
    // Send SMS/Email notifications
    for (const applicant of qualified) {
      await governmentService.sendNotification(applicant.id, 'qualified', {
        message: `Congratulations! You have qualified for admission at ${applicant.appliedFor}`
      });
    }
    for (const applicant of disqualified) {
      await governmentService.sendNotification(applicant.id, 'disqualified', {
        message: `We regret to inform you that you do not meet the minimum requirements. Reason: ${applicant.filterReason}`
      });
    }
    toast.success(`Notifications sent to ${qualified.length + disqualified.length} applicants`);
  };

  const addLevel = () => {
    setFormData(prev => ({
      ...prev,
      levels: [...prev.levels, { minScore: 0, maxScore: 100, grade: 'New', points: 0, governmentEquivalency: 'New', universityPoints: 0 }]
    }));
  };

  const updateLevel = (index: number, field: keyof GradingLevel, value: any) => {
    const newLevels = [...formData.levels];
    (newLevels[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, levels: newLevels }));
  };

  const removeLevel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.csv') || f.name.endsWith('.json')
    );
    if (files.length > 0) {
      setImportFile(files[0]);
      setShowImportModal(true);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      await academicManagementService.bulkImport('grading', importFile);
      toast.success('Import successful');
      setShowImportModal(false);
      setImportFile(null);
      fetchGradingSystems();
    } catch {
      toast.error('Import failed');
    }
  };

  const filtered = gradingSystems.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'qualified': return <CheckCircle size={16} className="text-green-500" />;
      case 'disqualified': return <XCircle size={16} className="text-red-500" />;
      case 'under_review': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="grading-page">
      <div className="page-header">
        <div>
          <h1>Grading Systems & Government Integration</h1>
          <p>Manage grading scales, connect to government exam boards, and filter applicants</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchGradingSystems} className="btn-secondary">
            <RefreshCcw size={16} /> Refresh
          </button>
          <button onClick={() => setShowGovernmentModal(true)} className="btn-secondary">
            <Globe size={16} /> Government Integration
          </button>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus size={16} /> New Grading System
          </button>
        </div>
      </div>

      {/* Government Integration Status Bar */}
      <div className={`gov-status ${governmentIntegration.connected ? 'connected' : 'disconnected'}`}>
        <div className="gov-status-left">
          <Shield size={20} />
          <div>
            <strong>Government Integration</strong>
            <span>{governmentIntegration.connected ? `Connected to ${governmentIntegration.examBoard}` : 'Not connected'}</span>
          </div>
        </div>
        <div className="gov-status-right">
          {governmentIntegration.connected && (
            <>
              <span>Last sync: {governmentIntegration.lastSync ? new Date(governmentIntegration.lastSync).toLocaleString() : 'Never'}</span>
              <button onClick={syncGovernmentResults} className="btn-sm">Sync Results</button>
              <button onClick={() => setShowApplicantFilter(true)} className="btn-sm">View Applicants</button>
            </>
          )}
          <button onClick={() => setShowGovernmentModal(true)} className="btn-sm">
            {governmentIntegration.connected ? 'Configure' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Applicant Filter Summary */}
      {showApplicantFilter && (
        <div className="applicant-filter-summary">
          <div className="filter-header">
            <h3>Applicant Filter Settings</h3>
            <button onClick={() => setShowApplicantFilter(false)}><X size={20} /></button>
          </div>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Min Mean Grade</label>
              <select value={applicantFilters.minMeanGrade} onChange={e => setApplicantFilters({...applicantFilters, minMeanGrade: e.target.value})}>
                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>Min Points</label>
              <input type="number" value={applicantFilters.minPoints} onChange={e => setApplicantFilters({...applicantFilters, minPoints: parseInt(e.target.value)})} />
            </div>
            <div className="filter-item">
              <label>Auto Reject Below</label>
              <select value={applicantFilters.autoRejectBelow} onChange={e => setApplicantFilters({...applicantFilters, autoRejectBelow: e.target.value})}>
                <option value="">None</option>
                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="filter-item checkbox">
              <label><input type="checkbox" checked={applicantFilters.requireMathPass} onChange={e => setApplicantFilters({...applicantFilters, requireMathPass: e.target.checked})} /> Require Math Pass</label>
            </div>
            <div className="filter-item checkbox">
              <label><input type="checkbox" checked={applicantFilters.requireEnglishPass} onChange={e => setApplicantFilters({...applicantFilters, requireEnglishPass: e.target.checked})} /> Require English Pass</label>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} />
        <input type="text" placeholder="Search grading systems..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="bulk-buttons">
            <button onClick={bulkExport} className="btn-sm">Export Selected</button>
            <button onClick={bulkDelete} className="btn-sm danger">Delete Selected</button>
            <button onClick={() => setSelectedIds([])} className="btn-sm">Clear</button>
          </div>
        </div>
      )}

      {/* Grading Systems Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox"><button onClick={toggleSelectAll}>{selectedIds.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                <th>Name</th>
                <th>Levels</th>
                <th>Pass Mark</th>
                <th>Government Board</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(gs => (
                <tr key={gs.id}>
                  <td className="checkbox"><button onClick={() => toggleSelect(gs.id)}>{selectedIds.includes(gs.id) ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} />}</button></td>
                  <td className="name-cell">{gs.name}</td>
                  <td>{gs.levels?.length || 0} levels</td>
                  <td>{gs.passMark || 50}%</td>
                  <td><span className="gov-badge">{gs.governmentBoard || 'N/A'}</span></td>
                  <td className="actions">
                    <button onClick={() => openModal(gs)}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(gs.id)} className="danger"><Trash2 size={16} /></button>
                    <button><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applicants Table (when shown) */}
      {showApplicantFilter && applicants.length > 0 && (
        <div className="applicants-section">
          <div className="applicants-header">
            <h3>Applicants from Government System</h3>
            <div className="applicant-actions">
              <button onClick={bulkProcessApplicants} className="btn-primary">Bulk Process</button>
              <button onClick={() => setApplicants([])} className="btn-secondary">Clear</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Admission No.</th><th>Applied For</th><th>Mean Grade</th><th>Points</th><th>Status</th><th>Reason</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {applicants.map(applicant => (
                  <tr key={applicant.id}>
                    <td>{applicant.name}</td>
                    <td>{applicant.admissionNumber}</td>
                    <td>{applicant.appliedFor}</td>
                    <td>{applicant.results[0]?.meanGrade || '-'}</td>
                    <td>{applicant.results[0]?.totalPoints || '-'}</td>
                    <td className="status-cell">{getStatusIcon(applicant.status)} {applicant.status.toUpperCase()}</td>
                    <td className="reason-cell">{applicant.filterReason || '-'}</td>
                    <td className="actions">
                      <button onClick={() => updateApplicantStatus(applicant.id, 'qualified')} className="success">Approve</button>
                      <button onClick={() => updateApplicantStatus(applicant.id, 'disqualified', 'Manually rejected')} className="danger">Reject</button>
                      <button onClick={() => updateApplicantStatus(applicant.id, 'under_review')} className="warning">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading System Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGrading ? 'Edit' : 'Create'} Grading System</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>System Name *</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., KCSE 8-4-4" />
                </div>
                <div className="form-group">
                  <label>Pass Mark (%)</label>
                  <input type="number" value={formData.passMark} onChange={e => setFormData({...formData, passMark: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Government Exam Board</label>
                  <select value={formData.governmentBoard} onChange={e => setFormData({...formData, governmentBoard: e.target.value as any})}>
                    <option value="KNEC">KNEC (Kenya)</option>
                    <option value="NECTA">NECTA (Tanzania)</option>
                    <option value="UNEB">UNEB (Uganda)</option>
                    <option value="WAEC">WAEC (West Africa)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
              </div>

              <div className="levels-section">
                <div className="levels-header">
                  <h3>Grading Levels</h3>
                  <button onClick={addLevel} className="btn-sm"><Plus size={14} /> Add Level</button>
                </div>
                <div className="levels-grid">
                  {formData.levels.map((level, index) => (
                    <div key={index} className="level-card">
                      <div className="level-fields">
                        <input placeholder="Grade" value={level.grade} onChange={e => updateLevel(index, 'grade', e.target.value)} />
                        <input type="number" placeholder="Min" value={level.minScore} onChange={e => updateLevel(index, 'minScore', parseInt(e.target.value))} />
                        <input type="number" placeholder="Max" value={level.maxScore} onChange={e => updateLevel(index, 'maxScore', parseInt(e.target.value))} />
                        <input type="number" placeholder="Points" value={level.points} onChange={e => updateLevel(index, 'points', parseInt(e.target.value))} />
                        <input placeholder="Gov Equivalency" value={level.governmentEquivalency || ''} onChange={e => updateLevel(index, 'governmentEquivalency', e.target.value)} />
                        <button onClick={() => removeLevel(index)} className="danger"><Trash2 size={14} /></button>
                      </div>
                      <input placeholder="Description" value={level.description || ''} onChange={e => updateLevel(index, 'description', e.target.value)} className="level-desc" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="drag-area" onDragOver={handleDragOver} onDrop={handleDrop}>
                <Upload size={32} />
                <p>Drag & drop syllabus or reference files</p>
                <small>PDF, DOCX, Excel - multiple files supported</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><Save size={16} /> {editingGrading ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Government Integration Modal */}
      {showGovernmentModal && (
        <div className="modal-overlay" onClick={() => setShowGovernmentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Government Integration</h3>
              <button className="close-btn" onClick={() => setShowGovernmentModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Exam Board</label>
                <select value={governmentIntegration.examBoard} onChange={e => setGovernmentIntegration({...governmentIntegration, examBoard: e.target.value as any})}>
                  <option value="KNEC">KNEC - Kenya National Examinations Council</option>
                  <option value="NECTA">NECTA - Tanzania</option>
                  <option value="UNEB">UNEB - Uganda</option>
                  <option value="WAEC">WAEC - West Africa</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>API Endpoint</label>
                <input type="url" placeholder="https://api.knec.go.ke/v1" value={governmentIntegration.endpoint || ''} onChange={e => setGovernmentIntegration({...governmentIntegration, endpoint: e.target.value})} />
              </div>
              <div className="form-group">
                <label>API Key</label>
                <input type="password" placeholder="Enter API key" value={governmentIntegration.apiKey || ''} onChange={e => setGovernmentIntegration({...governmentIntegration, apiKey: e.target.value})} />
              </div>
              <div className="integration-actions">
                <button onClick={connectToGovernment} className="btn-primary">Connect</button>
                {governmentIntegration.connected && <button onClick={syncGovernmentResults} className="btn-secondary">Sync Results</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Grading Systems</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="drag-area" onDragOver={handleDragOver} onDrop={handleDrop}>
                <Upload size={40} />
                <p>Drop Excel/CSV/JSON file here</p>
              </div>
              <input type="file" accept=".xlsx,.csv,.json" onChange={e => e.target.files && setImportFile(e.target.files[0])} />
              <a href="/templates/grading-template.xlsx" download className="template-link">Download template</a>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleImport} disabled={!importFile}>Import</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .grading-page { padding: 24px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-header h1 { font-size: 28px; margin: 0 0 8px 0; }
        .page-header p { margin: 0; color: #6b7280; }
        .header-actions { display: flex; gap: 12px; }
        .gov-status { background: white; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #dc2626; }
        .gov-status.connected { border-left-color: #10b981; }
        .gov-status-left { display: flex; align-items: center; gap: 12px; }
        .gov-status-left strong { display: block; }
        .gov-status-left span { font-size: 13px; color: #6b7280; }
        .gov-status-right { display: flex; gap: 12px; align-items: center; }
        .applicant-filter-summary { background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb; }
        .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .filter-header h3 { margin: 0; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .filter-item label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .filter-item select, .filter-item input { width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .filter-item.checkbox label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .search-bar { background: white; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .search-bar input { flex: 1; border: none; outline: none; }
        .bulk-bar { background: #e0f2fe; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .bulk-buttons { display: flex; gap: 8px; }
        .table-container { background: white; border-radius: 16px; overflow-x: auto; border: 1px solid #e5e7eb; margin-bottom: 24px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        .data-table th { background: #f9fafb; font-weight: 600; }
        .checkbox { width: 40px; text-align: center; }
        .name-cell { font-weight: 500; }
        .gov-badge { background: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 20px; font-size: 11px; }
        .actions { display: flex; gap: 8px; }
        .actions button { padding: 6px; border-radius: 6px; border: none; cursor: pointer; background: #f3f4f6; }
        .actions button.danger { color: #dc2626; }
        .status-cell { display: flex; align-items: center; gap: 6px; text-transform: capitalize; }
        .reason-cell { max-width: 250px; font-size: 12px; color: #6b7280; }
        .applicants-section { margin-top: 24px; }
        .applicants-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .applicant-actions { display: flex; gap: 12px; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 20px; width: 90%; max-width: 900px; max-height: 85vh; overflow-y: auto; }
        .modal-large { max-width: 900px; }
        .modal-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .full-width { grid-column: span 2; }
        .levels-section { margin-bottom: 24px; }
        .levels-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .levels-grid { display: flex; flex-direction: column; gap: 12px; }
        .level-card { background: #f9fafb; border-radius: 12px; padding: 12px; }
        .level-fields { display: grid; grid-template-columns: 80px 70px 70px 70px 100px 40px; gap: 8px; margin-bottom: 8px; }
        .level-fields input { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .level-desc { width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 8px; }
        .drag-area { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 32px; text-align: center; cursor: pointer; }
        .integration-actions { display: flex; gap: 12px; margin-top: 16px; }
        .btn-primary, .btn-secondary, .btn-sm { padding: 8px 16px; border-radius: 10px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .btn-sm.danger { background: #fee2e2; color: #dc2626; }
        .btn-sm.success { background: #d1fae5; color: #059669; }
        .loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
