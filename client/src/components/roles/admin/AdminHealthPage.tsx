// client/src/components/roles/admin/AdminHealthPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, Save, Heart, Calendar, FileText, Image,
  Video, File, Eye, Filter, Users, AlertCircle, CheckCircle,
  Clock, MapPin, Phone, Mail, User, Stethoscope, Syringe,
  Pill, Activity, Thermometer, Droplets, Scissors, Bandage,
  Ambulance, Hospital, Microscope, Clipboard, FilePlus,
  FolderOpen, Printer, Share2, Link, Copy, ExternalLink,
  ChevronLeft, ChevronRight, MoreVertical, FileImage, FileSpreadsheet,
  FileArchive, FileText as FilePdf, Camera, Mic, Volume2, VolumeX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { healthService, userManagementService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

interface MedicalFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document' | 'lab_report' | 'prescription' | 'xray' | 'scan';
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  thumbnail?: string;
}

interface HealthRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentAdmission: string;
  studentClass: string;
  studentPhoto?: string;
  bloodGroup: string;
  genotype: string;
  height: number;
  weight: number;
  bmi: number;
  visionLeft: string;
  visionRight: string;
  hearingTest: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  chronicIllnesses: string[];
  disabilities: string[];
  surgeries: Array<{ name: string; date: string; hospital: string }>;
  vaccinations: Array<{ name: string; date: string; nextDue?: string; administeredBy: string }>;
  lastCheckup: string;
  nextCheckup?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
  };
  primaryDoctor: {
    name: string;
    clinic: string;
    phone: string;
    email?: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverage: string;
  };
  nhifNumber?: string;
  notes: string;
  status: 'active' | 'monitoring' | 'critical' | 'recovered';
  files: MedicalFile[];
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy: string;
}

interface HealthStat {
  totalRecords: number;
  activeRecords: number;
  criticalCases: number;
  monitoringCases: number;
  allergiesCount: number;
  chronicConditions: number;
  pendingCheckups: number;
  avgBmi: number;
}

export default function AdminHealthPage() {
  const confirmation = useConfirmationDialog();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState<HealthStat>({
    totalRecords: 0, activeRecords: 0, criticalCases: 0, monitoringCases: 0,
    allergiesCount: 0, chronicConditions: 0, pendingCheckups: 0, avgBmi: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<HealthRecord>>({
    studentId: '',
    studentName: '',
    studentAdmission: '',
    studentClass: '',
    bloodGroup: '',
    genotype: '',
    height: 0,
    weight: 0,
    conditions: [],
    allergies: [],
    medications: [],
    chronicIllnesses: [],
    disabilities: [],
    surgeries: [],
    vaccinations: [],
    lastCheckup: new Date().toISOString().split('T')[0],
    emergencyContact: { name: '', relationship: '', phone: '' },
    primaryDoctor: { name: '', clinic: '', phone: '' },
    insurance: { provider: '', policyNumber: '', expiryDate: '', coverage: '' },
    notes: '',
    status: 'active',
    files: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthData, studentsData] = await Promise.all([
        healthService.getAllRecords(),
        userManagementService.getAllUsers({ role: 'STUDENT', limit: 1000 })
      ]);
      setRecords(healthData || []);
      setStudents(studentsData.users || []);
      
      // Calculate stats
      setStats({
        totalRecords: healthData.length,
        activeRecords: healthData.filter((r: HealthRecord) => r.status === 'active').length,
        criticalCases: healthData.filter((r: HealthRecord) => r.status === 'critical').length,
        monitoringCases: healthData.filter((r: HealthRecord) => r.status === 'monitoring').length,
        allergiesCount: healthData.filter((r: HealthRecord) => r.allergies?.length > 0).length,
        chronicConditions: healthData.filter((r: HealthRecord) => r.chronicIllnesses?.length > 0).length,
        pendingCheckups: healthData.filter((r: HealthRecord) => r.nextCheckup && new Date(r.nextCheckup) < new Date()).length,
        avgBmi: healthData.reduce((sum: number, r: HealthRecord) => sum + (r.bmi || 0), 0) / (healthData.length || 1)
      });
    } catch (error) {
      toast.error('Failed to load health records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (files: FileList) => {
    const newFiles = Array.from(files);
    setUploadingFiles(newFiles);
    setUploadProgress(0);
    
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const progress = ((i + 1) / newFiles.length) * 100;
      setUploadProgress(progress);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('studentId', form.studentId || '');
        
        const uploaded = await healthService.uploadMedicalFile(formData);
        setForm(prev => ({
          ...prev,
          files: [...(prev.files || []), uploaded]
        }));
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setUploadingFiles([]);
    setUploadProgress(0);
  };

  const save = async () => {
    if (!form.studentId || !form.studentName) {
      toast.error('Student information required');
      return;
    }
    
    try {
      const recordData = {
        ...form,
        bmi: form.weight && form.height ? (form.weight / ((form.height / 100) ** 2)).toFixed(1) : 0,
        lastUpdatedBy: 'Admin',
        updatedAt: new Date().toISOString()
      };
      
      if (editing) {
        await healthService.updateRecord(editing.id, recordData);
        toast.success('Health record updated');
      } else {
        await healthService.createRecord(recordData);
        toast.success('Health record created');
      }
      
      fetchData();
      setShowModal(false);
      setEditing(null);
      setForm({
        studentId: '', studentName: '', studentAdmission: '', studentClass: '',
        bloodGroup: '', genotype: '', height: 0, weight: 0,
        conditions: [], allergies: [], medications: [], chronicIllnesses: [], disabilities: [],
        surgeries: [], vaccinations: [], lastCheckup: new Date().toISOString().split('T')[0],
        emergencyContact: { name: '', relationship: '', phone: '' },
        primaryDoctor: { name: '', clinic: '', phone: '' },
        insurance: { provider: '', policyNumber: '', expiryDate: '', coverage: '' },
        notes: '', status: 'active', files: []
      });
    } catch (error) {
      toast.error('Save failed');
    }
  };

  const deleteRecord = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Health Record',
      message: 'This will permanently delete all medical records and files.',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      await healthService.deleteRecord(id);
      toast.success('Record deleted');
      fetchData();
    }
  };

  const exportData = async () => {
    try {
      const blob = await healthService.exportHealthRecords();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health_records_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      await healthService.importHealthRecords(file);
    }
    toast.success(`${importFiles.length} file(s) imported`);
    setShowImport(false);
    setImportFiles([]);
    fetchData();
  };

  const toggleAll = () => {
    if (selected.length === filtered.length && filtered.length > 0) {
      setSelected([]);
    } else {
      setSelected(filtered.map(r => r.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
      recovered: 'bg-blue-100 text-blue-800'
    };
    return <span className={`status-badge ${colors[status] || colors.active}`}>{status}</span>;
  };

  const filtered = records.filter(r => {
    const matchesSearch = r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.studentAdmission?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesBloodGroup = bloodGroupFilter === 'all' || r.bloodGroup === bloodGroupFilter;
    return matchesSearch && matchesStatus && matchesBloodGroup;
  });

  return (
    <div className="health-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Heart size={28} /> Student Health Records</h1>
          <p>Complete medical history, files, prescriptions, and health monitoring</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={exportData} className="btn-secondary">
            <Download size={16} /> Export All
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Add Health Record
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card"><Heart size={20} /><div><span className="stat-value">{stats.totalRecords}</span><span className="stat-label">Total Records</span></div></div>
        <div className="stat-card stat-green"><CheckCircle size={20} /><div><span className="stat-value">{stats.activeRecords}</span><span className="stat-label">Active</span></div></div>
        <div className="stat-card stat-red"><AlertCircle size={20} /><div><span className="stat-value">{stats.criticalCases}</span><span className="stat-label">Critical Cases</span></div></div>
        <div className="stat-card stat-yellow"><Activity size={20} /><div><span className="stat-value">{stats.monitoringCases}</span><span className="stat-label">Monitoring</span></div></div>
        <div className="stat-card"><Pill size={20} /><div><span className="stat-value">{stats.allergiesCount}</span><span className="stat-label">Allergies</span></div></div>
        <div className="stat-card"><Calendar size={20} /><div><span className="stat-value">{stats.pendingCheckups}</span><span className="stat-label">Pending Checkups</span></div></div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} records selected</span>
          <button onClick={async () => {
            await Promise.all(selected.map(id => healthService.deleteRecord(id)));
            toast.success(`Deleted ${selected.length} records`);
            setSelected([]);
            fetchData();
          }} className="btn-danger">Delete Selected</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by student name or admission number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="monitoring">Monitoring</option>
          <option value="critical">Critical</option>
          <option value="recovered">Recovered</option>
        </select>
        <select value={bloodGroupFilter} onChange={e => setBloodGroupFilter(e.target.value)} className="filter-select">
          <option value="all">All Blood Groups</option>
          <option value="A+">A+</option><option value="A-">A-</option>
          <option value="B+">B+</option><option value="B-">B-</option>
          <option value="O+">O+</option><option value="O-">O-</option>
          <option value="AB+">AB+</option><option value="AB-">AB-</option>
        </select>
      </div>

      {/* Drag & Drop Import Area */}
      <div className="drag-drop-area" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={32} />
        <p>Drag & drop health records (Excel, CSV, PDF, Images)</p>
        <small>Batch import student medical data with files</small>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading health records...</p></div>
      ) : (
        <div className="table-container">
          <table className="health-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" onChange={() => toggleAll()} checked={selected.length === filtered.length && filtered.length > 0} /></th>
                <th>Student</th>
                <th>Blood Group</th>
                <th>Conditions</th>
                <th>Allergies</th>
                <th>Last Checkup</th>
                <th>Status</th>
                <th>Files</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <tr key={record.id} className={record.status === 'critical' ? 'critical-row' : ''}>
                  <td><input type="checkbox" checked={selected.includes(record.id)} onChange={() => setSelected(prev => prev.includes(record.id) ? prev.filter(i => i !== record.id) : [...prev, record.id])} /></td>
                  <td>
                    <div className="student-cell">
                      {record.studentPhoto ? <img src={record.studentPhoto} alt="" /> : <div className="avatar">{record.studentName?.charAt(0)}</div>}
                      <div>
                        <div className="student-name">{record.studentName}</div>
                        <div className="student-admission">{record.studentAdmission} • {record.studentClass}</div>
                      </div>
                    </div>
                   </td>
                  <td><span className="blood-badge">{record.bloodGroup || 'N/A'}</span></td>
                  <td>
                    <div className="conditions-list">
                      {record.conditions?.slice(0, 2).map(c => <span key={c} className="condition-tag">{c}</span>)}
                      {record.conditions?.length > 2 && <span className="condition-tag">+{record.conditions.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="allergies-list">
                      {record.allergies?.slice(0, 2).map(a => <span key={a} className="allergy-tag">{a}</span>)}
                      {record.allergies?.length > 2 && <span className="allergy-tag">+{record.allergies.length - 2}</span>}
                    </div>
                  </td>
                  <td>{record.lastCheckup ? new Date(record.lastCheckup).toLocaleDateString() : '-'}</td>
                  <td>{getStatusBadge(record.status)}</td>
                  <td>
                    <div className="files-count">
                      <FileText size={14} />
                      <span>{record.files?.length || 0}</span>
                    </div>
                  </td>
                  <td className="actions">
                    <button onClick={() => { setSelectedRecord(record); setShowDetailsModal(true); }} title="View Details"><Eye size={16} /></button>
                    <button onClick={() => { setEditing(record); setForm(record); setShowModal(true); }} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => deleteRecord(record.id)} className="danger" title="Delete"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Health Details Modal with Files */}
      {showDetailsModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Health Record - {selectedRecord.studentName}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Student Info */}
              <div className="student-health-header">
                <div className="student-info">
                  <div className="student-avatar-large">{selectedRecord.studentName?.charAt(0)}</div>
                  <div>
                    <h4>{selectedRecord.studentName}</h4>
                    <p>{selectedRecord.studentAdmission} • {selectedRecord.studentClass}</p>
                    <p>Blood Group: {selectedRecord.bloodGroup || 'N/A'} | Genotype: {selectedRecord.genotype || 'N/A'}</p>
                  </div>
                </div>
                <div className="vitals">
                  <div><strong>Height:</strong> {selectedRecord.height || '-'} cm</div>
                  <div><strong>Weight:</strong> {selectedRecord.weight || '-'} kg</div>
                  <div><strong>BMI:</strong> {selectedRecord.bmi || '-'}</div>
                  <div><strong>Last Checkup:</strong> {selectedRecord.lastCheckup ? new Date(selectedRecord.lastCheckup).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="details-grid">
                <div className="detail-section">
                  <h4><Stethoscope size={18} /> Medical Conditions</h4>
                  <div className="tags-list">
                    {selectedRecord.conditions?.map(c => <span key={c} className="condition-badge">{c}</span>)}
                  </div>
                </div>
                <div className="detail-section">
                  <h4><Pill size={18} /> Allergies</h4>
                  <div className="tags-list">
                    {selectedRecord.allergies?.map(a => <span key={a} className="allergy-badge">{a}</span>)}
                  </div>
                </div>
                <div className="detail-section">
                  <h4><Syringe size={18} /> Medications</h4>
                  <div className="tags-list">
                    {selectedRecord.medications?.map(m => <span key={m} className="medication-badge">{m}</span>)}
                  </div>
                </div>
                <div className="detail-section">
                  <h4><Activity size={18} /> Chronic Illnesses</h4>
                  <div className="tags-list">
                    {selectedRecord.chronicIllnesses?.map(c => <span key={c} className="chronic-badge">{c}</span>)}
                  </div>
                </div>
              </div>

              {/* Emergency Contact & Doctor */}
              <div className="contact-grid">
                <div className="contact-card">
                  <h4><Phone size={16} /> Emergency Contact</h4>
                  <p><strong>{selectedRecord.emergencyContact?.name}</strong> ({selectedRecord.emergencyContact?.relationship})</p>
                  <p>📞 {selectedRecord.emergencyContact?.phone}</p>
                  {selectedRecord.emergencyContact?.alternatePhone && <p>📞 Alt: {selectedRecord.emergencyContact.alternatePhone}</p>}
                </div>
                <div className="contact-card">
                  <h4><Hospital size={16} /> Primary Doctor</h4>
                  <p><strong>{selectedRecord.primaryDoctor?.name}</strong></p>
                  <p>{selectedRecord.primaryDoctor?.clinic}</p>
                  <p>📞 {selectedRecord.primaryDoctor?.phone}</p>
                </div>
                <div className="contact-card">
                  <h4><FileText size={16} /> Insurance</h4>
                  <p><strong>{selectedRecord.insurance?.provider}</strong></p>
                  <p>Policy: {selectedRecord.insurance?.policyNumber}</p>
                  <p>Expires: {selectedRecord.insurance?.expiryDate ? new Date(selectedRecord.insurance.expiryDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              {/* Medical Files Section */}
              <div className="medical-files-section">
                <div className="section-header">
                  <h4><FolderOpen size={18} /> Medical Documents & Files</h4>
                  <button className="btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> Upload File
                  </button>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.doc" style={{ display: 'none' }} onChange={e => e.target.files && handleFileUpload(e.target.files)} />
                
                {uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    <span>{uploadProgress}% Uploading...</span>
                  </div>
                )}
                
                <div className="files-grid">
                  {selectedRecord.files?.map(file => (
                    <div key={file.id} className="file-card">
                      {file.type === 'image' || file.type === 'xray' || file.type === 'scan' ? (
                        <img src={file.url} alt={file.name} />
                      ) : file.type === 'pdf' ? (
                        <FilePdf size={32} className="file-icon pdf" />
                      ) : (
                        <File size={32} className="file-icon" />
                      )}
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <div className="file-actions">
                        <a href={file.url} target="_blank" rel="noopener noreferrer"><Eye size={14} /></a>
                        <a href={file.url} download><Download size={14} /></a>
                      </div>
                    </div>
                  ))}
                  {(!selectedRecord.files || selectedRecord.files.length === 0) && (
                    <div className="no-files">No medical files uploaded</div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="notes-section">
                  <h4><Clipboard size={16} /> Clinical Notes</h4>
                  <p>{selectedRecord.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => { setEditing(selectedRecord); setForm(selectedRecord); setShowModal(true); setShowDetailsModal(false); }}>
                <Edit size={16} /> Edit Record
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit' : 'Add'} Health Record</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); save(); }}>
                {/* Student Selection */}
                <div className="form-section">
                  <h4>Student Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Select Student *</label>
                      <select value={form.studentId} onChange={e => {
                        const student = students.find(s => s.id === e.target.value);
                        setForm({ ...form, studentId: student?.id, studentName: student?.firstName + ' ' + student?.lastName, studentAdmission: student?.admissionNumber, studentClass: student?.currentClass });
                      }} required>
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} - {s.admissionNumber}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Student Name</label><input value={form.studentName || ''} disabled /></div>
                    <div className="form-group"><label>Admission Number</label><input value={form.studentAdmission || ''} disabled /></div>
                    <div className="form-group"><label>Class</label><input value={form.studentClass || ''} disabled /></div>
                  </div>
                </div>

                {/* Vitals */}
                <div className="form-section">
                  <h4>Vitals & Blood Information</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Blood Group</label><select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}><option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
                    <div className="form-group"><label>Genotype</label><select value={form.genotype} onChange={e => setForm({...form, genotype: e.target.value})}><option value="">Select</option><option>AA</option><option>AS</option><option>SS</option><option>AC</option></select></div>
                    <div className="form-group"><label>Height (cm)</label><input type="number" value={form.height} onChange={e => setForm({...form, height: parseFloat(e.target.value)})} /></div>
                    <div className="form-group"><label>Weight (kg)</label><input type="number" value={form.weight} onChange={e => setForm({...form, weight: parseFloat(e.target.value)})} /></div>
                    <div className="form-group"><label>Last Checkup</label><input type="date" value={form.lastCheckup} onChange={e => setForm({...form, lastCheckup: e.target.value})} /></div>
                    <div className="form-group"><label>Next Checkup</label><input type="date" value={form.nextCheckup} onChange={e => setForm({...form, nextCheckup: e.target.value})} /></div>
                    <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}><option value="active">Active</option><option value="monitoring">Monitoring</option><option value="critical">Critical</option><option value="recovered">Recovered</option></select></div>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="form-section">
                  <h4>Medical History</h4>
                  <div className="form-grid">
                    <div className="form-group full-width"><label>Medical Conditions (comma separated)</label><input value={form.conditions?.join(', ')} onChange={e => setForm({...form, conditions: e.target.value.split(',').map(s => s.trim())})} placeholder="Asthma, Diabetes, Hypertension" /></div>
                    <div className="form-group full-width"><label>Allergies (comma separated)</label><input value={form.allergies?.join(', ')} onChange={e => setForm({...form, allergies: e.target.value.split(',').map(s => s.trim())})} placeholder="Peanuts, Pollen, Penicillin" /></div>
                    <div className="form-group full-width"><label>Medications (comma separated)</label><input value={form.medications?.join(', ')} onChange={e => setForm({...form, medications: e.target.value.split(',').map(s => s.trim())})} placeholder="Inhaler, Insulin" /></div>
                    <div className="form-group full-width"><label>Chronic Illnesses</label><input value={form.chronicIllnesses?.join(', ')} onChange={e => setForm({...form, chronicIllnesses: e.target.value.split(',').map(s => s.trim())})} /></div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <h4>Emergency & Doctor Contacts</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Emergency Contact Name</label><input value={form.emergencyContact?.name} onChange={e => setForm({...form, emergencyContact: {...form.emergencyContact!, name: e.target.value}})} /></div>
                    <div className="form-group"><label>Relationship</label><input value={form.emergencyContact?.relationship} onChange={e => setForm({...form, emergencyContact: {...form.emergencyContact!, relationship: e.target.value}})} /></div>
                    <div className="form-group"><label>Emergency Phone</label><input value={form.emergencyContact?.phone} onChange={e => setForm({...form, emergencyContact: {...form.emergencyContact!, phone: e.target.value}})} /></div>
                    <div className="form-group"><label>Doctor Name</label><input value={form.primaryDoctor?.name} onChange={e => setForm({...form, primaryDoctor: {...form.primaryDoctor!, name: e.target.value}})} /></div>
                    <div className="form-group"><label>Clinic/Hospital</label><input value={form.primaryDoctor?.clinic} onChange={e => setForm({...form, primaryDoctor: {...form.primaryDoctor!, clinic: e.target.value}})} /></div>
                    <div className="form-group"><label>Doctor Phone</label><input value={form.primaryDoctor?.phone} onChange={e => setForm({...form, primaryDoctor: {...form.primaryDoctor!, phone: e.target.value}})} /></div>
                  </div>
                </div>

                <div className="form-group full-width"><label>Clinical Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary"><Save size={16} /> {editing ? 'Update' : 'Save'} Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Health Records</h3><button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <p>Upload Excel/CSV files with student health data</p>
              <input type="file" multiple accept=".xlsx,.csv" onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} />
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn-primary" onClick={doImport}>Import</button></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmation.isOpen} title={confirmation.options?.title || ''} message={confirmation.options?.message || ''} confirmLabel={confirmation.options?.confirmText} cancelLabel={confirmation.options?.cancelText} type={confirmation.options?.type} onConfirm={confirmation.handleConfirm} onCancel={confirmation.handleCancel} />

      <style>{`
        .health-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-danger { background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; }
        .stats-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-label { font-size: 12px; color: #64748b; }
        .bulk-bar { background: #fee2e2; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px; background: #f8fafc; cursor: pointer; }
        .table-container { background: white; border-radius: 12px; overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .health-table { width: 100%; border-collapse: collapse; }
        .health-table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-weight: 600; font-size: 12px; }
        .health-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .critical-row { background: #fef2f2; }
        .student-cell { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 36px; height: 36px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
        .student-name { font-weight: 600; }
        .student-admission { font-size: 11px; color: #64748b; }
        .blood-badge { display: inline-block; padding: 4px 8px; background: #f1f5f9; border-radius: 6px; font-family: monospace; font-weight: 600; }
        .condition-tag, .allergy-tag { display: inline-block; padding: 2px 6px; background: #e0e7ff; border-radius: 4px; font-size: 10px; margin: 2px; }
        .allergy-tag { background: #fef3c7; color: #92400e; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .files-count { display: flex; align-items: center; gap: 4px; }
        .actions { display: flex; gap: 6px; }
        .actions button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; }
        .actions button.danger { color: #ef4444; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-xlarge { width: 1000px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .form-section { margin-bottom: 24px; }
        .form-section h4 { margin-bottom: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .full-width { grid-column: span 2; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .student-health-header { display: flex; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 20px; }
        .student-avatar-large { width: 60px; height: 60px; background: #1d8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 600; }
        .vitals { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
        .detail-section { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .tags-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .condition-badge { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; font-size: 11px; }
        .allergy-badge { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 11px; }
        .medication-badge { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 11px; }
        .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .contact-card { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .medical-files-section { margin-bottom: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .files-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
        .file-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; }
        .file-card img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
        .file-icon { width: 40px; height: 40px; }
        .file-icon.pdf { color: #ef4444; }
        .file-info { flex: 1; }
        .file-name { font-size: 11px; font-weight: 500; display: block; }
        .file-size { font-size: 10px; color: #64748b; }
        .file-actions { display: flex; gap: 6px; }
        .upload-progress { background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin: 12px 0; position: relative; }
        .upload-progress .progress-bar { background: #1d8a8a; height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; }
        .loading-state { text-align: center; padding: 60px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
