// client/src/components/roles/admin/AdminStudentsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Filter, Download, Upload, Edit, Trash2,
  User, Users, GraduationCap, Calendar, Phone, Mail, MapPin,
  X, Check, AlertCircle, Eye, FileText, CreditCard, RefreshCcw,
  Award, BookOpen, Clock, Heart, Shield, AlertTriangle,
  TrendingUp, TrendingDown, BarChart3, PieChart, Printer,
  Send, MessageCircle, FileSpreadsheet, QrCode, Fingerprint,
  School, Building2, Home, Activity, Zap, Target, Star,
  ChevronLeft, ChevronRight, UserCheck, UserX, MailWarning,
  PhoneCall, MessageSquare, Copy, Link, ExternalLink, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementService, academicManagementService, communicationService } from '../../../services/adminService';
import type { AdminUser } from '../../../types/admin';
import EditableSelect from '../../ui/EditableSelect';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { confirmationMessages, createConfirmationWithCallback } from '../../../utils/confirmationHelper';

interface Student extends AdminUser {
  admissionNumber: string;
  rollNumber: string;
  currentClass: string;
  stream?: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  religion?: string;
  gender: 'male' | 'female';
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  disabilities?: string[];
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    homeAddress: string;
  };
  parentDetails: {
    fatherName: string;
    fatherPhone: string;
    fatherEmail?: string;
    fatherOccupation?: string;
    motherName: string;
    motherPhone: string;
    motherEmail?: string;
    motherOccupation?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;
    emergencyContact: string;
    emergencyPhone: string;
    parentWhatsapp?: string;
  };
  previousSchool?: string;
  previousSchoolAddress?: string;
  enrollmentDate: string;
  enrollmentTerm: string;
  enrollmentYear: number;
  graduationDate?: string;
  graduationYear?: number;
  leavingCertificate?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'expelled';
  feeStatus: 'paid' | 'partial' | 'pending' | 'scholarship';
  balance?: number;
  totalPaid: number;
  academicPerformance: {
    currentMeanGrade: string;
    previousMeanGrade: string;
    averageScore: number;
    rank: number;
    totalStudents: number;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    percentage: number;
  };
  disciplinary: {
    merits: number;
    demerits: number;
    warnings: number;
    suspensions: number;
  };
  cocurricular: {
    sports: string[];
    clubs: string[];
    achievements: string[];
  };
  health: {
    height: number;
    weight: number;
    bloodPressure: string;
    lastCheckup: string;
    doctorName: string;
    doctorPhone: string;
  };
  notes: string;
  lastLogin?: string;
  profileViews: number;
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  graduatedStudents: number;
  transferredStudents: number;
  suspendedStudents: number;
  maleStudents: number;
  femaleStudents: number;
  newEnrollments: number;
  pendingFees: number;
  totalFeesCollected: number;
  averageAttendance: number;
  averagePerformance: number;
}

export default function AdminStudentsPage() {
  const confirmation = useConfirmationDialog();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showGraduateModal, setShowGraduateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState({ subject: '', body: '', type: 'sms' });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    graduatedStudents: 0,
    transferredStudents: 0,
    suspendedStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    newEnrollments: 0,
    pendingFees: 0,
    totalFeesCollected: 0,
    averageAttendance: 0,
    averagePerformance: 0
  });
  const [graduateData, setGraduateData] = useState({
    graduationDate: new Date().toISOString().split('T')[0],
    certificateNumber: '',
    remarks: ''
  });
  const [transferData, setTransferData] = useState({
    transferDate: new Date().toISOString().split('T')[0],
    newSchool: '',
    reason: '',
    transferCertificate: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await userManagementService.getAllUsers({
        role: 'STUDENT',
        search: searchTerm,
        class: classFilter !== 'all' ? classFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        page: currentPage,
        limit: 50
      });
      setStudents(response.users as Student[]);
      setTotalPages(response.pages);
      setTotalStudents(response.total);
      
      const stats = await userManagementService.getStudentStats();
      setDashboardStats(stats);
    } catch (error) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm, classFilter, statusFilter, genderFilter]);

  const handleCreateStudent = async (data: Partial<Student>) => {
    try {
      const studentData = {
        ...data,
        role: 'STUDENT',
        password: data.admissionNumber + '@school',
        enrollmentDate: new Date().toISOString(),
        enrollmentYear: new Date().getFullYear(),
        enrollmentTerm: 'Term 1',
        status: 'active',
        feeStatus: 'pending',
        totalPaid: 0,
        balance: 0,
        profileViews: 0,
        academicPerformance: {
          currentMeanGrade: 'N/A',
          previousMeanGrade: 'N/A',
          averageScore: 0,
          rank: 0,
          totalStudents: 0
        },
        attendance: { presentDays: 0, absentDays: 0, percentage: 0 },
        disciplinary: { merits: 0, demerits: 0, warnings: 0, suspensions: 0 },
        cocurricular: { sports: [], clubs: [], achievements: [] },
        health: { height: 0, weight: 0, bloodPressure: '', lastCheckup: '', doctorName: '', doctorPhone: '' }
      };
      await userManagementService.createUser(studentData);
      toast.success('Student created successfully');
      fetchStudents();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create student');
      console.error(error);
    }
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    try {
      await userManagementService.updateUser(id, data);
      toast.success('Student updated successfully');
      fetchStudents();
      setShowModal(false);
      setEditingStudent(null);
    } catch (error) {
      toast.error('Failed to update student');
      console.error(error);
    }
  };

  const handleViewStudent = async (student: Student) => {
    try {
      // Increment profile view count
      await userManagementService.incrementProfileView(student.id);
      const updatedStudent = await userManagementService.getUser(student.id);
      setSelectedStudent(updatedStudent as Student);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load student details');
      setSelectedStudent(student);
      setShowDetailsModal(true);
    }
  };

  const handleGraduateStudent = async (id: string) => {
    try {
      await userManagementService.graduateStudent(id, graduateData);
      toast.success('Student marked as graduated');
      fetchStudents();
      setShowGraduateModal(false);
      setSelectedStudent(null);
    } catch (error) {
      toast.error('Failed to graduate student');
    }
  };

  const handleTransferStudent = async (id: string) => {
    try {
      await userManagementService.transferStudent(id, transferData);
      toast.success('Student transferred successfully');
      fetchStudents();
      setShowTransferModal(false);
      setSelectedStudent(null);
    } catch (error) {
      toast.error('Failed to transfer student');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedStudent) return;
    try {
      await communicationService.sendMessage({
        recipientId: selectedStudent.id,
        recipientPhone: selectedStudent.phone,
        parentPhone: selectedStudent.parentDetails?.fatherPhone || selectedStudent.parentDetails?.motherPhone,
        subject: messageContent.subject,
        message: messageContent.body,
        type: messageContent.type as 'sms' | 'email' | 'whatsapp'
      });
      toast.success(`Message sent to ${selectedStudent.firstName} and parents`);
      setShowSendMessageModal(false);
      setMessageContent({ subject: '', body: '', type: 'sms' });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleCallParent = (phoneNumber: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleWhatsAppParent = (phoneNumber: string, studentName: string) => {
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}?text=Hello, I'm contacting you regarding your child ${studentName}`, '_blank');
    } else {
      toast.error('No WhatsApp number available');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const student = students.find(s => s.id === id);
    const confirmOptions = createConfirmationWithCallback(
      confirmationMessages.deleteStudent(student?.firstName || student?.email),
      async () => {
        await userManagementService.deleteUser(id);
        setStudents(prev => prev.filter(s => s.id !== id));
        toast.success('Student deleted successfully');
        fetchStudents();
      }
    );
    await confirmation.confirm(confirmOptions);
  };

  const handleBulkImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await userManagementService.bulkImportStudents(formData);
      toast.success('Bulk import completed');
      setShowBulkImport(false);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to import students');
      console.error(error);
    }
  };

  const handleExportStudents = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const blob = await userManagementService.bulkExport({ 
        role: 'STUDENT', 
        format,
        class: classFilter !== 'all' ? classFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Failed to export students');
      console.error(error);
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      graduated: 'bg-blue-100 text-blue-800',
      transferred: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
      expelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

  const getFeeStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-red-100 text-red-800',
      scholarship: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="students-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Student Management</h1>
          <p>Manage all students, view details, and track academic progress</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchStudents} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-secondary" onClick={() => handleExportStudents('excel')}>
            <Download size={16} /> Export
          </button>
          <button className="btn-secondary" onClick={() => setShowBulkImport(true)}>
            <Upload size={16} /> Bulk Import
          </button>
          <button className="btn-primary" onClick={() => { setEditingStudent(null); setShowModal(true); }}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card"><GraduationCap size={20} /><div><span className="stat-value">{dashboardStats.totalStudents}</span><span className="stat-label">Total Students</span></div></div>
        <div className="stat-card"><UserCheck size={20} /><div><span className="stat-value">{dashboardStats.activeStudents}</span><span className="stat-label">Active</span></div></div>
        <div className="stat-card"><Award size={20} /><div><span className="stat-value">{dashboardStats.graduatedStudents}</span><span className="stat-label">Graduated</span></div></div>
        <div className="stat-card"><UserX size={20} /><div><span className="stat-value">{dashboardStats.transferredStudents}</span><span className="stat-label">Transferred</span></div></div>
        <div className="stat-card"><Users size={20} /><div><span className="stat-value">{dashboardStats.maleStudents}/{dashboardStats.femaleStudents}</span><span className="stat-label">M/F Ratio</span></div></div>
        <div className="stat-card"><TrendingUp size={20} /><div><span className="stat-value">{dashboardStats.averageAttendance}%</span><span className="stat-label">Avg Attendance</span></div></div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedStudents.length} students selected</span>
          <div className="bulk-buttons">
            <button className="btn-sm"><Mail size={14} /> Send Message</button>
            <button className="btn-sm"><FileText size={14} /> Generate Report</button>
            <button className="btn-sm danger"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name, admission number, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="filter-select">
          <option value="all">All Classes</option>
          <option value="Form 1">Form 1</option><option value="Form 2">Form 2</option>
          <option value="Form 3">Form 3</option><option value="Form 4">Form 4</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option><option value="graduated">Graduated</option>
          <option value="transferred">Transferred</option><option value="suspended">Suspended</option>
        </select>
        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="filter-select">
          <option value="all">All Gender</option><option value="male">Male</option><option value="female">Female</option>
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading students...</p></div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className="checkbox"><input type="checkbox" checked={selectedStudents.length === students.length && students.length > 0} onChange={toggleAllStudents} /></th>
                <th>Student</th><th>Admission No</th><th>Class</th><th>Parent Contacts</th><th>Fee Status</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className={selectedStudents.includes(student.id) ? 'selected' : ''}>
                  <td className="checkbox"><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudentSelection(student.id)} /></td>
                  <td className="student-cell">
                    <div className="student-avatar">{student.avatar ? <img src={student.avatar} alt="" /> : <span>{student.firstName?.charAt(0)}</span>}</div>
                    <div><div className="student-name">{student.firstName} {student.lastName}</div><div className="student-email">{student.email}</div></div>
                  </td>
                  <td><strong>{student.admissionNumber}</strong><br /><small>{student.rollNumber}</small></td>
                  <td>{student.currentClass} {student.stream}</td>
                  <td className="contacts-cell">
                    <div><Phone size={12} /> {student.parentDetails?.fatherPhone || student.phone || '-'}</div>
                    <div><Mail size={12} /> {student.parentDetails?.fatherEmail || student.email}</div>
                  </td>
                  <td>{getFeeStatusBadge(student.feeStatus)}<br /><small>KES {student.balance?.toLocaleString()}</small></td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td className="actions">
                    <button onClick={() => handleViewStudent(student)} title="View Details"><Eye size={14} /></button>
                    <button onClick={() => { setEditingStudent(student); setShowModal(true); }} title="Edit"><Edit size={14} /></button>
                    <button onClick={() => handleCallParent(student.parentDetails?.fatherPhone || student.phone)} title="Call Parent"><Phone size={14} /></button>
                    <button onClick={() => handleWhatsAppParent(student.parentDetails?.fatherPhone || student.phone, student.firstName)} title="WhatsApp"><MessageCircle size={14} /></button>
                    <button onClick={() => { setSelectedStudent(student); setShowSendMessageModal(true); }} title="Send Message"><Send size={14} /></button>
                    <button onClick={() => handleDeleteStudent(student.id)} className="danger" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Previous</button>
          <span>Page {currentPage} of {totalPages} ({totalStudents} students)</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Details - {selectedStudent.firstName} {selectedStudent.lastName}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Student Basic Info */}
              <div className="details-section">
                <h4>Basic Information</h4>
                <div className="details-grid">
                  <div><label>Admission Number:</label><span>{selectedStudent.admissionNumber}</span></div>
                  <div><label>Roll Number:</label><span>{selectedStudent.rollNumber}</span></div>
                  <div><label>Class & Stream:</label><span>{selectedStudent.currentClass} {selectedStudent.stream}</span></div>
                  <div><label>Date of Birth:</label><span>{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</span></div>
                  <div><label>Gender:</label><span>{selectedStudent.gender}</span></div>
                  <div><label>Blood Group:</label><span>{selectedStudent.bloodGroup || 'N/A'}</span></div>
                  <div><label>Nationality:</label><span>{selectedStudent.nationality}</span></div>
                  <div><label>Religion:</label><span>{selectedStudent.religion || 'N/A'}</span></div>
                </div>
              </div>

              {/* Parent/Guardian Details - CRITICAL SECTION */}
              <div className="details-section parent-section">
                <h4>Parent / Guardian Contact Information</h4>
                <div className="parent-cards">
                  {/* Father */}
                  <div className="parent-card">
                    <div className="parent-header"><User size={16} /> <strong>Father</strong></div>
                    <div><label>Name:</label> {selectedStudent.parentDetails?.fatherName || 'N/A'}</div>
                    <div className="contact-actions">
                      <label>Phone:</label> {selectedStudent.parentDetails?.fatherPhone || 'N/A'}
                      {selectedStudent.parentDetails?.fatherPhone && (
                        <>
                          <button onClick={() => handleCallParent(selectedStudent.parentDetails.fatherPhone)}><Phone size={14} /> Call</button>
                          <button onClick={() => handleWhatsAppParent(selectedStudent.parentDetails.fatherPhone, selectedStudent.firstName)}><MessageCircle size={14} /> WhatsApp</button>
                        </>
                      )}
                    </div>
                    <div><label>Email:</label> {selectedStudent.parentDetails?.fatherEmail || 'N/A'}</div>
                    <div><label>Occupation:</label> {selectedStudent.parentDetails?.fatherOccupation || 'N/A'}</div>
                  </div>

                  {/* Mother */}
                  <div className="parent-card">
                    <div className="parent-header"><User size={16} /> <strong>Mother</strong></div>
                    <div><label>Name:</label> {selectedStudent.parentDetails?.motherName || 'N/A'}</div>
                    <div className="contact-actions">
                      <label>Phone:</label> {selectedStudent.parentDetails?.motherPhone || 'N/A'}
                      {selectedStudent.parentDetails?.motherPhone && (
                        <>
                          <button onClick={() => handleCallParent(selectedStudent.parentDetails.motherPhone)}><Phone size={14} /> Call</button>
                          <button onClick={() => handleWhatsAppParent(selectedStudent.parentDetails.motherPhone, selectedStudent.firstName)}><MessageCircle size={14} /> WhatsApp</button>
                        </>
                      )}
                    </div>
                    <div><label>Email:</label> {selectedStudent.parentDetails?.motherEmail || 'N/A'}</div>
                    <div><label>Occupation:</label> {selectedStudent.parentDetails?.motherOccupation || 'N/A'}</div>
                  </div>

                  {/* Guardian / Emergency */}
<div className="parent-card emergency">
                     <div className="parent-header"><Shield size={16} /> <strong>Emergency Contact</strong></div>
                     <div><label>Name:</label> {selectedStudent.parentDetails?.guardianName || selectedStudent.parentDetails?.emergencyContact || 'N/A'}</div>
                     <div className="contact-actions">
                       <label>Phone:</label> {selectedStudent.parentDetails?.guardianPhone || selectedStudent.parentDetails?.emergencyPhone || 'N/A'}
                       {(selectedStudent.parentDetails?.guardianPhone || selectedStudent.parentDetails?.emergencyPhone) && (
                         <button onClick={() => handleCallParent(selectedStudent.parentDetails.guardianPhone || selectedStudent.parentDetails.emergencyPhone)}><Phone size={14} /> Call</button>
                       )}
                     </div>
                     <div><label>Relation:</label> {selectedStudent.parentDetails?.guardianRelation || 'Emergency Contact'}</div>
                   </div>
                 </div>
               </div>

               {/* Address */}
               <div className="details-section">
                 <h4>Address Information</h4>
                 <div className="details-grid">
                   <div><label>Home Address:</label><span>{selectedStudent.address?.homeAddress || selectedStudent.address?.street || 'N/A'}</span></div>
                   <div><label>City:</label><span>{selectedStudent.address?.city || 'N/A'}</span></div>
                   <div><label>Postal Code:</label><span>{selectedStudent.address?.postalCode || 'N/A'}</span></div>
                   <div><label>Country:</label><span>{selectedStudent.address?.country || 'Kenya'}</span></div>
                 </div>
               </div>

               {/* Academic Performance */}
               <div className="details-section">
                 <h4>Academic Performance</h4>
                 <div className="stats-grid-small">
                   <div><label>Current Mean Grade:</label><span className="grade">{selectedStudent.academicPerformance?.currentMeanGrade || 'N/A'}</span></div>
                   <div><label>Average Score:</label><span>{selectedStudent.academicPerformance?.averageScore || 0}%</span></div>
                   <div><label>Class Rank:</label><span>{selectedStudent.academicPerformance?.rank || 0}/{selectedStudent.academicPerformance?.totalStudents || 0}</span></div>
                   <div><label>Attendance:</label><span>{selectedStudent.attendance?.percentage || 0}%</span></div>
                 </div>
               </div>

               {/* Quick Actions */}
               <div className="details-actions">
                 <button className="btn-primary" onClick={() => { setShowDetailsModal(false); setEditingStudent(selectedStudent); setShowModal(true); }}>
                   <Edit size={16} /> Edit Student
                 </button>
                 <button className="btn-success" onClick={() => { setSelectedStudent(selectedStudent); setShowSendMessageModal(true); setShowDetailsModal(false); }}>
                   <Send size={16} /> Send Message
                 </button>
                 {selectedStudent.status === 'active' && (
                   <button className="btn-warning" onClick={() => { setSelectedStudent(selectedStudent); setShowGraduateModal(true); setShowDetailsModal(false); }}>
                     <Award size={16} /> Mark as Graduated
                   </button>
                 )}
                 <button className="btn-secondary" onClick={() => window.print()}>
                   <Printer size={16} /> Print Profile
                 </button>
               </div>
             </div>
           </div>
         </div>
)}

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  firstName: formData.get('firstName'),
                  lastName: formData.get('lastName'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  admissionNumber: formData.get('admissionNumber'),
                  rollNumber: formData.get('rollNumber'),
                  currentClass: formData.get('currentClass'),
                  stream: formData.get('stream'),
                  gender: formData.get('gender'),
                  dateOfBirth: formData.get('dateOfBirth'),
                  parentDetails: {
                    fatherName: formData.get('fatherName'),
                    fatherPhone: formData.get('fatherPhone'),
                    fatherEmail: formData.get('fatherEmail'),
                    motherName: formData.get('motherName'),
                    motherPhone: formData.get('motherPhone'),
                    motherEmail: formData.get('motherEmail'),
                    emergencyContact: formData.get('emergencyContact'),
                    emergencyPhone: formData.get('emergencyPhone')
                  },
                  address: {
                    homeAddress: formData.get('homeAddress'),
                    city: formData.get('city')
                  }
                };
                if (editingStudent) handleUpdateStudent(editingStudent.id, data as any);
                else handleCreateStudent(data as any);
              }}>
                <div className="form-grid">
                  <div className="form-group"><label>First Name *</label><input name="firstName" defaultValue={editingStudent?.firstName} required /></div>
                  <div className="form-group"><label>Last Name *</label><input name="lastName" defaultValue={editingStudent?.lastName} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" name="email" defaultValue={editingStudent?.email} required /></div>
                  <div className="form-group"><label>Phone</label><input name="phone" defaultValue={editingStudent?.phone} /></div>
                  <div className="form-group"><label>Admission Number *</label><input name="admissionNumber" defaultValue={editingStudent?.admissionNumber} required /></div>
                  <div className="form-group"><label>Roll Number</label><input name="rollNumber" defaultValue={editingStudent?.rollNumber} /></div>
                  <div className="form-group"><label>Class</label><input name="currentClass" defaultValue={editingStudent?.currentClass} /></div>
                  <div className="form-group"><label>Stream</label><input name="stream" defaultValue={editingStudent?.stream} /></div>
                  <div className="form-group"><label>Gender</label><select name="gender" defaultValue={editingStudent?.gender}><option value="male">Male</option><option value="female">Female</option></select></div>
                  <div className="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" defaultValue={editingStudent?.dateOfBirth?.split('T')[0]} /></div>
                </div>
                <div className="form-section"><h4>Parent/Guardian Details</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>Father's Name</label><input name="fatherName" defaultValue={editingStudent?.parentDetails?.fatherName} /></div>
                    <div className="form-group"><label>Father's Phone</label><input name="fatherPhone" defaultValue={editingStudent?.parentDetails?.fatherPhone} /></div>
                    <div className="form-group"><label>Father's Email</label><input name="fatherEmail" defaultValue={editingStudent?.parentDetails?.fatherEmail} /></div>
                    <div className="form-group"><label>Mother's Name</label><input name="motherName" defaultValue={editingStudent?.parentDetails?.motherName} /></div>
                    <div className="form-group"><label>Mother's Phone</label><input name="motherPhone" defaultValue={editingStudent?.parentDetails?.motherPhone} /></div>
                    <div className="form-group"><label>Mother's Email</label><input name="motherEmail" defaultValue={editingStudent?.parentDetails?.motherEmail} /></div>
                    <div className="form-group"><label>Emergency Contact Name</label><input name="emergencyContact" defaultValue={editingStudent?.parentDetails?.emergencyContact} /></div>
                    <div className="form-group"><label>Emergency Phone</label><input name="emergencyPhone" defaultValue={editingStudent?.parentDetails?.emergencyPhone} /></div>
                  </div>
                </div>
                <div className="form-section"><h4>Address</h4>
                  <div className="form-grid">
                    <div className="form-group full-width"><label>Home Address</label><input name="homeAddress" defaultValue={editingStudent?.address?.homeAddress} /></div>
                    <div className="form-group"><label>City</label><input name="city" defaultValue={editingStudent?.address?.city} /></div>
                  </div>
                </div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary"><Save size={16} /> {editingStudent ? 'Update' : 'Create'} Student</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showSendMessageModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowSendMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Message to {selectedStudent.firstName} & Parents</h3>
              <button className="close-btn" onClick={() => setShowSendMessageModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="message-recipients">
                <p><strong>Recipients:</strong></p>
                <ul>
                  <li>{selectedStudent.firstName} {selectedStudent.lastName} - Student</li>
                  <li>{selectedStudent.parentDetails?.fatherName} - Father ({selectedStudent.parentDetails?.fatherPhone})</li>
                  <li>{selectedStudent.parentDetails?.motherName} - Mother ({selectedStudent.parentDetails?.motherPhone})</li>
                </ul>
              </div>
              <div className="form-group">
                <label>Message Type</label>
                <select className="message-type-select" value={messageContent.type} onChange={e => setMessageContent({...messageContent, type: e.target.value})}>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" value={messageContent.subject} onChange={e => setMessageContent({...messageContent, subject: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Message Body</label>
                <textarea rows={4} value={messageContent.body} onChange={e => setMessageContent({...messageContent, body: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSendMessageModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSendMessage}>Send Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Graduate Modal */}
      {showGraduateModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowGraduateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Graduate Student - {selectedStudent.firstName}</h3>
              <button className="close-btn" onClick={() => setShowGraduateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Graduation Date</label>
                <input type="date" value={graduateData.graduationDate} onChange={e => setGraduateData({...graduateData, graduationDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Certificate Number</label>
                <input type="text" value={graduateData.certificateNumber} onChange={e => setGraduateData({...graduateData, certificateNumber: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea value={graduateData.remarks} onChange={e => setGraduateData({...graduateData, remarks: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGraduateModal(false)}>Cancel</button>
              <button className="btn-success" onClick={() => handleGraduateStudent(selectedStudent.id)}>Mark as Graduated</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transfer Student - {selectedStudent.firstName}</h3>
              <button className="close-btn" onClick={() => setShowTransferModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Transfer Date</label>
                <input type="date" value={transferData.transferDate} onChange={e => setTransferData({...transferData, transferDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>New School</label>
                <input type="text" value={transferData.newSchool} onChange={e => setTransferData({...transferData, newSchool: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea value={transferData.reason} onChange={e => setTransferData({...transferData, reason: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button className="btn-warning" onClick={() => handleTransferStudent(selectedStudent.id)}>Transfer Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="modal-overlay" onClick={() => setShowBulkImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Import Students</h3>
              <button className="close-btn" onClick={() => setShowBulkImport(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="import-instructions">
                <h4>Import Instructions</h4>
                <ul>
                  <li>Download the template file first</li>
                  <li>Fill in student data in the template</li>
                  <li>Upload the completed file</li>
                </ul>
                <a href="#" className="download-template" onClick={e => { e.preventDefault(); handleExportStudents('excel'); }}>
                  <Download size={14} /> Download Template
                </a>
              </div>
              <div className="form-group">
                <label>Upload File</label>
                <input type="file" accept=".xlsx,.csv" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleBulkImport(file);
                }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkImport(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}