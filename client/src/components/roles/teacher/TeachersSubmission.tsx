// client/src/components/roles/teacher/TeacherSubmissions.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Upload, Download, Eye, Trash2, Edit, Plus,
  Search, Filter, Calendar, Clock, MapPin, Navigation,
  CheckCircle, XCircle, AlertCircle, Clock as ClockIcon,
  Send, Save, File, Image, Video, FileSpreadsheet,
  Mic, Camera, Link, Copy, ExternalLink, Share2,
  Wifi, WifiOff, Locate, Target, Compass, Map,
  Shield, Lock, Unlock, EyeOff, UserCheck, Fingerprint,
  Radio, Activity, Zap, Award, Star, TrendingUp,
  ChevronLeft, ChevronRight, MoreVertical, RefreshCw,
  Bell, MessageCircle, Phone, Mail, Users, School,
  BookOpen, GraduationCap, ClipboardList, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService } from '../../../services/teacherService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import type { HomeworkAssignment, HomeworkSubmission } from '../../../types/teacher';

// Types for UI-only fields (extending API types)
interface Assignment extends Omit<HomeworkAssignment, 'subject' | 'totalMarks' | 'submissions'> {
  subject: string; // Maps from subjectName
  totalMarks: number; // Maps from maxMarks
  stream: string;
  dueTime: string;
  submissions: Submission[];
}

interface Submission extends Omit<HomeworkSubmission, 'status' | 'score'> {
  studentAdmission: string;
  submittedAt: string;
  content: string;
  attachments: Attachment[];
  marks?: number;
  status: 'submitted' | 'late' | 'graded' | 'resubmitted';
  locationVerified: boolean;
  submissionLocation: LocationData;
}

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'link';
  url: string;
  size: number;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  isInSchool: boolean;
  distanceFromSchool: number;
  schoolBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface TeacherStatus {
  isAuthenticated: boolean;
  isInSchool: boolean;
  locationVerified: boolean;
  currentLocation: LocationData | null;
  lastSync: string;
}

const SCHOOL_COORDINATES = {
  lat: -1.286389, // Example - replace with actual school coordinates
  lng: 36.817223,
  radius: 500 // meters - school boundary
};

export default function TeacherSubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherStatus, setTeacherStatus] = useState<TeacherStatus>({
    isAuthenticated: false,
    isInSchool: false,
    locationVerified: false,
    currentLocation: null,
    lastSync: ''
  });
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject: '',
    className: '',
    stream: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '23:59',
    totalMarks: 100
  });
  const [submissionForm, setSubmissionForm] = useState({
    studentId: '',
    content: '',
    marks: 0,
    feedback: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmationDialog();

  // Real-time location verification
  const verifyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return false;
    }

    setIsVerifying(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      setGpsAccuracy(accuracy);
      
      // Calculate distance from school
      const distance = calculateDistance(
        latitude, longitude,
        SCHOOL_COORDINATES.lat, SCHOOL_COORDINATES.lng
      );
      
      const isInSchool = distance <= SCHOOL_COORDINATES.radius;
      
      const locationData: LocationData = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date().toISOString(),
        isInSchool,
        distanceFromSchool: distance,
        schoolBounds: {
          north: SCHOOL_COORDINATES.lat + 0.01,
          south: SCHOOL_COORDINATES.lat - 0.01,
          east: SCHOOL_COORDINATES.lng + 0.01,
          west: SCHOOL_COORDINATES.lng - 0.01
        }
      };
      
      setTeacherStatus(prev => ({
        ...prev,
        isInSchool,
        locationVerified: true,
        currentLocation: locationData,
        lastSync: new Date().toISOString()
      }));
      
      if (!isInSchool) {
        toast.error(`You must be within school premises (${SCHOOL_COORDINATES.radius}m) to create assignments. Current distance: ${Math.round(distance)}m`);
        return false;
      }
      
      toast.success(`Location verified! You are within school premises (${Math.round(distance)}m)`);
      return true;
      
    } catch (error) {
      console.error('Location verification failed:', error);
      toast.error('Unable to verify location. Please enable GPS and try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Start real-time location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const distance = calculateDistance(
          latitude, longitude,
          SCHOOL_COORDINATES.lat, SCHOOL_COORDINATES.lng
        );
        const isInSchool = distance <= SCHOOL_COORDINATES.radius;
        
        setTeacherStatus(prev => ({
          ...prev,
          isInSchool,
          currentLocation: {
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            isInSchool,
            distanceFromSchool: distance
          }
        }));
        
        setGpsAccuracy(accuracy);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
    
    setLocationWatchId(watchId);
  }, []);

  useEffect(() => {
    // Initial location verification
    verifyLocation();
    startLocationTracking();
    fetchAssignments();
    
    return () => {
      if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await teacherService.getAssignments();
      // Map HomeworkAssignment[] to Assignment[] with transformed fields
      const mappedAssignments: Assignment[] = (response.data || []).map(a => ({
        ...a,
        subject: a.subjectName,
        totalMarks: a.maxMarks,
        stream: '', // API doesn't provide stream separately
        dueTime: '23:59', // API doesn't provide dueTime separately
        submissions: (a.submissions || []).map(s => ({
          ...s,
          studentAdmission: s.studentId, // Use studentId as admission since API doesn't provide separate admission
          submittedAt: s.submissionDate,
          content: '',
          attachments: s.attachment ? [{ id: s.id, name: s.attachment, type: 'pdf' as const, url: s.attachment, size: 0 }] : [],
          marks: s.score,
          status: s.status === 'graded' ? 'graded' : s.status === 'submitted' ? 'submitted' : 'submitted',
          locationVerified: false,
          submissionLocation: {
            lat: 0,
            lng: 0,
            accuracy: 0,
            timestamp: s.submissionDate,
            isInSchool: false,
            distanceFromSchool: 0
          }
        }))
      }));
      setAssignments(mappedAssignments);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    // VERIFY LOCATION BEFORE CREATING ASSIGNMENT
    const isVerified = await verifyLocation();
    if (!isVerified) {
      toast.error('Cannot create assignment. You must be physically present in school.');
      return;
    }
    
    if (!assignmentForm.title || !assignmentForm.subject || !assignmentForm.className) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      // Map form fields to API expected format
      const assignmentData = {
        classId: assignmentForm.className, // Using className as classId since we don't have actual IDs
        subjectId: assignmentForm.subject, // Using subject as subjectId since we don't have actual IDs
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        maxMarks: assignmentForm.totalMarks,
        attachments: attachments.map(f => f.name) // Send file names as strings
      };
      
      await teacherService.createAssignment(assignmentData);
      toast.success('Assignment created successfully');
      setShowAssignmentModal(false);
      setAssignmentForm({
        title: '', description: '', subject: '', className: '', stream: '',
        dueDate: new Date().toISOString().split('T')[0], dueTime: '23:59', totalMarks: 100
      });
      setAttachments([]);
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleGradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    try {
      await teacherService.gradeSubmission(submissionId, { grade: marks, feedback });
      toast.success('Submission graded successfully');
      fetchAssignments();
      setShowSubmissionModal(false);
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100';
    }
  };

  const getSubmissionStatusBadge = (submission: Submission) => {
    if (submission.status === 'graded') {
      return <span className="badge-graded"><CheckCircle size={12} /> Graded: {submission.marks} marks</span>;
    }
    if (submission.status === 'late') {
      return <span className="badge-late"><AlertCircle size={12} /> Late Submission</span>;
    }
    return <span className="badge-submitted"><ClockIcon size={12} /> Pending Review</span>;
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || a.subject === subjectFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div className="teacher-submissions">
      {/* Location Status Banner */}
      <div className={`location-banner ${teacherStatus.isInSchool ? 'verified' : 'unverified'}`}>
        <div className="location-status">
          {teacherStatus.isInSchool ? (
            <>
              <CheckCircle size={20} />
              <div>
                <strong>Location Verified</strong>
                <span>You are within school premises</span>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={20} />
              <div>
                <strong>Location Not Verified</strong>
                <span>You must be in school to create assignments</span>
              </div>
            </>
          )}
        </div>
        <div className="location-details">
          <MapPin size={14} />
          <span>{teacherStatus.currentLocation?.distanceFromSchool ? 
            `${Math.round(teacherStatus.currentLocation.distanceFromSchool)}m from school` : 
            'Location unknown'}</span>
          <span>GPS Accuracy: ±{Math.round(gpsAccuracy)}m</span>
          <button onClick={verifyLocation} disabled={isVerifying} className="refresh-location">
            <RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />
            Verify Now
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="submissions-header">
        <div>
          <h1><FileText size={28} /> Assignments & Submissions</h1>
          <p>Create assignments, review student submissions, and provide feedback</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAssignments} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button 
            onClick={() => setShowAssignmentModal(true)} 
            className="btn-primary"
            disabled={!teacherStatus.isInSchool}
            title={!teacherStatus.isInSchool ? "You must be in school to create assignments" : ""}
          >
            <Plus size={16} /> Create Assignment
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat"><FileText size={20} /><div><span>{assignments.length}</span><label>Total Assignments</label></div></div>
        <div className="stat"><CheckCircle size={20} /><div><span>{assignments.filter(a => a.status === 'published').length}</span><label>Published</label></div></div>
        <div className="stat"><ClockIcon size={20} /><div><span>{assignments.filter(a => new Date(a.dueDate) > new Date()).length}</span><label>Active</label></div></div>
        <div className="stat"><Users size={20} /><div><span>{assignments.reduce((sum, a) => sum + a.submissions.length, 0)}</span><label>Submissions</label></div></div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search assignments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="all">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="English">English</option>
          <option value="Kiswahili">Kiswahili</option>
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading assignments...</p></div>
      ) : (
        <div className="assignments-grid">
          {filteredAssignments.map(assignment => (
            <div key={assignment.id} className="assignment-card">
              <div className="card-header">
                <div className={`status-badge ${getStatusColor(assignment.status)}`}>
                  {assignment.status}
                </div>
                <button className="menu-btn"><MoreVertical size={16} /></button>
              </div>
              <h3>{assignment.title}</h3>
              <p className="description">{assignment.description.substring(0, 100)}...</p>
              <div className="assignment-meta">
                <div><BookOpen size={14} /> {assignment.subject}</div>
                <div><Users size={14} /> {assignment.className} {assignment.stream}</div>
                <div><Calendar size={14} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                <div><Award size={14} /> {assignment.totalMarks} marks</div>
              </div>
              <div className="submissions-info">
                <Users size={14} />
                <span>{assignment.submissions.length} submissions</span>
                <span className="pending-count">
                  {assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'late').length} pending review
                </span>
              </div>
              <div className="card-actions">
                <button onClick={() => { setSelectedAssignment(assignment); setShowSubmissionModal(true); }} className="view-btn">
                  <Eye size={16} /> View Submissions
                </button>
                <button className="edit-btn"><Edit size={16} /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Assignment</h3>
              <button className="close-btn" onClick={() => setShowAssignmentModal(false)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Location Warning */}
              {!teacherStatus.isInSchool && (
                <div className="location-warning">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Location Required</strong>
                    <p>You must be physically present within the school premises to create assignments. Please enable GPS and ensure you're in school.</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={e => { e.preventDefault(); handleCreateAssignment(); }}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Assignment Title *</label>
                    <input type="text" value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea rows={4} value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select value={assignmentForm.subject} onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})} required>
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Kiswahili">Kiswahili</option>
                      <option value="Biology">Biology</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Physics">Physics</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Class *</label>
                    <select value={assignmentForm.className} onChange={e => setAssignmentForm({...assignmentForm, className: e.target.value})} required>
                      <option value="">Select Class</option>
                      <option value="Form 1">Form 1</option>
                      <option value="Form 2">Form 2</option>
                      <option value="Form 3">Form 3</option>
                      <option value="Form 4">Form 4</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stream</label>
                    <input type="text" value={assignmentForm.stream} onChange={e => setAssignmentForm({...assignmentForm, stream: e.target.value})} placeholder="e.g., A, B, C" />
                  </div>
                  <div className="form-group">
                    <label>Due Date *</label>
                    <input type="date" value={assignmentForm.dueDate} onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Due Time</label>
                    <input type="time" value={assignmentForm.dueTime} onChange={e => setAssignmentForm({...assignmentForm, dueTime: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Total Marks *</label>
                    <input type="number" value={assignmentForm.totalMarks} onChange={e => setAssignmentForm({...assignmentForm, totalMarks: parseInt(e.target.value)})} min="1" max="100" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Attachments</label>
                    <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={24} />
                      <p>Click or drag files to upload</p>
                      <small>PDF, DOC, Images, Videos up to 50MB</small>
                    </div>
                    <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => e.target.files && setAttachments(Array.from(e.target.files))} />
                    {attachments.length > 0 && (
                      <div className="attachment-list">
                        {attachments.map((f, i) => <div key={i}><File size={14} /> {f.name}</div>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!teacherStatus.isInSchool}>
                    <Save size={16} /> Create Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowSubmissionModal(false)}>
          <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submissions - {selectedAssignment.title}</h3>
              <button className="close-btn" onClick={() => setShowSubmissionModal(false)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="submissions-table-container">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Admission No</th>
                      <th>Submitted At</th>
                      <th>Location Verified</th>
                      <th>Status</th>
                      <th>Marks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssignment.submissions.map(sub => (
                      <tr key={sub.id}>
                        <td><strong>{sub.studentName}</strong></td>
                        <td>{sub.studentAdmission}</td>
                        <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                        <td>{sub.locationVerified ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}</td>
                        <td>{getSubmissionStatusBadge(sub)}</td>
                        <td>{sub.marks || '-'}/{selectedAssignment.totalMarks}</td>
                        <td>
                          <button className="grade-btn" onClick={() => {
                            setSubmissionForm({
                              studentId: sub.studentId,
                              content: sub.content,
                              marks: sub.marks || 0,
                              feedback: sub.feedback || ''
                            });
                            // Open grading modal
                            const marks = prompt('Enter marks:', sub.marks?.toString() || '');
                            if (marks) {
                              const feedback = prompt('Enter feedback:');
                              handleGradeSubmission(sub.id, parseInt(marks), feedback || '');
                            }
                          }}>
                            <Edit size={14} /> Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />

      <style>{`
        .teacher-submissions { padding: 24px; background: #f8fafc; min-height: 100vh; }
        
        .location-banner { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-radius: 12px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .location-banner.verified { background: #dcfce7; border: 1px solid #bbf7d0; }
        .location-banner.unverified { background: #fee2e2; border: 1px solid #fecaca; }
        .location-status { display: flex; align-items: center; gap: 12px; }
        .location-status strong { display: block; }
        .location-status span { font-size: 12px; }
        .location-details { display: flex; align-items: center; gap: 16px; font-size: 12px; color: #64748b; }
        .refresh-location { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; color: #3b82f6; }
        
        .submissions-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .submissions-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 12px; }
        
        .btn-primary { background: #1d8a8a; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        
        .stats-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat span { font-size: 28px; font-weight: 700; display: block; }
        .stat label { font-size: 12px; color: #64748b; }
        
        .filters-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filters-bar select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
        
        .assignments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        .assignment-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .assignment-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: space-between; padding: 16px 16px 0; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 500; text-transform: uppercase; }
        .assignment-card h3 { padding: 12px 16px 0; margin: 0; font-size: 18px; }
        .description { padding: 8px 16px; color: #64748b; font-size: 13px; }
        .assignment-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px 16px; background: #f8fafc; margin: 8px 16px; border-radius: 8px; font-size: 12px; }
        .assignment-meta div { display: flex; align-items: center; gap: 6px; }
        .submissions-info { display: flex; align-items: center; gap: 12px; padding: 8px 16px; font-size: 12px; border-top: 1px solid #e2e8f0; background: #fafbff; }
        .pending-count { color: #f59e0b; font-weight: 500; }
        .card-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e2e8f0; }
        .card-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; }
        .view-btn { background: #e0f2fe; color: #0369a1; }
        .edit-btn { background: #f1f5f9; color: #475569; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-large { width: 700px; }
        .modal-xlarge { width: 1000px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        
        .location-warning { display: flex; gap: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .full-width { grid-column: span 2; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
        
        .file-upload-area { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .file-upload-area:hover { border-color: #1d8a8a; background: #f8fafc; }
        .attachment-list { margin-top: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; }
        .attachment-list div { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 0; }
        
        .submissions-table-container { overflow-x: auto; max-height: 500px; overflow-y: auto; }
        .submissions-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .submissions-table th { text-align: left; padding: 12px; background: #f8fafc; position: sticky; top: 0; border-bottom: 1px solid #e2e8f0; }
        .submissions-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .grade-btn { background: #f1f5f9; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; }
        
        .badge-graded { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 12px; font-size: 11px; }
        .badge-late { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #fef3c7; color: #92400e; border-radius: 12px; font-size: 11px; }
        .badge-submitted { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 11px; }
        
        .loading-state { text-align: center; padding: 60px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}