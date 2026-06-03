import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, Filter, Users, AlertCircle, TrendingDown, TrendingUp,
  User, Phone, Mail, Calendar, Clock, Award, Star, FileText,
  MessageSquare, Eye, Edit, Download, Printer, Upload, Plus,
  CheckCircle, XCircle, AlertTriangle, Heart, Activity, BookOpen,
  BarChart3, PieChart, Target, Zap, Shield, Lock, Unlock,
  ChevronDown, ChevronUp, MoreVertical, Send, Bell, RefreshCw,
  GraduationCap, Home, Briefcase, Stethoscope, Pill, AlertOctagon
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import EditableSelect from '../../ui/EditableSelect';
import type {
  AttendanceSummary,
  DisciplineSummary,
} from '../../../types/teacher';

type StudentAttendanceSummary = AttendanceSummary & {
  excusedAbsences: number;
  monthlyAttendance: MonthlyAttendance[];
};

type StudentDisciplineSummary = DisciplineSummary & {
  detentions: number;
  suspensions: number;
  recentIncidents: DisciplineIncident[];
};

interface TeacherStudent {
  id: string;
  admissionNumber: string;
  name: string;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
  stream: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  motherName: string;
  motherPhone: string;
  fatherName: string;
  fatherPhone: string;
  emergencyContact: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  address: string;
  medicalAlerts: string[];
  medicalConditions: MedicalCondition[];
  allergies: Allergy[];
  medications: Medication[];
  specialNeeds: string[];
  learningDifficulties: string[];
  iep: IEP | null;
  attendanceSummary: StudentAttendanceSummary;
  disciplineSummary: StudentDisciplineSummary;
  academicHistory: TermAcademicRecord[];
  currentGrades: StudentGradeSummary[];
  behaviorNotes: BehaviorNote[];
  teacherNotes: TeacherNote[];
  parentContacts: ParentContact[];
  streaks: Streaks;
  flags: StudentFlags;
  enrolledAt: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
}

interface MedicalCondition {
  id: string;
  condition: string;
  diagnosedDate: string;
  severity: 'mild' | 'moderate' | 'severe';
  medication: string;
  notes: string;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  emergencyAction: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  administeredAt: string;
  prescribedBy: string;
}

interface IEP {
  id: string;
  goals: IEPGoal[];
  accommodations: string[];
  supportServices: string[];
  reviewDate: string;
  nextReview: string;
  status: 'active' | 'completed' | 'under_review';
}

interface IEPGoal {
  id: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
}

interface MonthlyAttendance {
  month: string;
  present: number;
  absent: number;
  late: number;
}

interface DisciplineIncident {
  id: string;
  date: string;
  type: 'merit' | 'demerit' | 'warning' | 'detention' | 'suspension';
  reason: string;
  points: number;
  reportedBy: string;
  resolved: boolean;
}

interface TermAcademicRecord {
  termId: string;
  termName: string;
  year: string;
  subjects: SubjectGrade[];
  average: number;
  grade: string;
  points: number;
  rank: number;
  classAverage: number;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  cat1: number | null;
  cat2: number | null;
  cat3: number | null;
  exam: number | null;
  total: number;
  grade: string;
  points: number;
  remarks: string;
}

interface StudentGradeSummary {
  subjectId: string;
  subjectName: string;
  currentScore: number;
  grade: string;
  classAverage: number;
  improvement: number;
}

interface BehaviorNote {
  id: string;
  date: string;
  note: string;
  type: 'positive' | 'negative' | 'neutral';
  recordedBy: string;
}

interface TeacherNote {
  id: string;
  date: string;
  note: string;
  category: 'academic' | 'behavior' | 'attendance' | 'medical' | 'general';
  isPrivate: boolean;
}

interface ParentContact {
  id: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'message';
  summary: string;
  actionItems: string[];
  followUpDate: string | null;
}

interface Streaks {
  academic: number;
  cleanliness: number;
  behavior: number;
  attendance: number;
  lastReset: string;
}

interface StudentFlags {
  atRisk: boolean;
  failing: boolean;
  lowAttendance: boolean;
  behaviorIssues: boolean;
  medicalAttention: boolean;
  parentContactNeeded: boolean;
}

const TeacherStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showParentContactModal, setShowParentContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'attendance' | 'behavior' | 'medical' | 'notes'>('overview');
  const [classes, setClasses] = useState<Array<{ id: string; name: string; stream: string }>>([]);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<'academic' | 'behavior' | 'attendance' | 'medical' | 'general'>('general');
  const [behaviorData, setBehaviorData] = useState({
    type: 'merit' as 'merit' | 'demerit' | 'warning',
    reason: '',
    points: 1,
  });
  const [parentContactData, setParentContactData] = useState({
    type: 'call' as 'call' | 'email' | 'meeting' | 'message',
    summary: '',
    actionItems: '',
    followUpDate: '',
  });

  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        teacherService.classes.getMyClasses(),
        teacherService.students.getMyStudents({ classId: selectedClass !== 'all' ? selectedClass : undefined }),
      ]);
      
      if (classesRes.success) setClasses(classesRes.data || []);
      if (studentsRes.success) setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const addTeacherNote = async () => {
    if (!selectedStudent || !noteText.trim()) return;
    
    try {
      const response = await teacherService.students.addTeacherNote(selectedStudent.id, {
        note: noteText,
        category: noteCategory,
        isPrivate: true,
      });
      
      if (response.success) {
        toast.success('Note added');
        setNoteText('');
        setShowNotesModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    }
  };

  const addBehaviorRecord = async () => {
    if (!selectedStudent) return;
    
    try {
      const response = await teacherService.students.addBehaviorRecord(selectedStudent.id, behaviorData);
      
      if (response.success) {
        toast.success(`${behaviorData.type === 'merit' ? 'Merit' : behaviorData.type === 'demerit' ? 'Demerit' : 'Warning'} recorded`);
        setBehaviorData({ type: 'merit', reason: '', points: 1 });
        setShowBehaviorModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Failed to add behavior record:', error);
      toast.error('Failed to record behavior');
    }
  };

  const recordParentContact = async () => {
    if (!selectedStudent) return;
    
    try {
      const response = await teacherService.students.recordParentContact(selectedStudent.id, {
        type: parentContactData.type,
        summary: parentContactData.summary,
        actionItems: parentContactData.actionItems.split(',').map(i => i.trim()),
        followUpDate: parentContactData.followUpDate || null,
      });
      
      if (response.success) {
        toast.success('Parent contact recorded');
        setParentContactData({
          type: 'call',
          summary: '',
          actionItems: '',
          followUpDate: '',
        });
        setShowParentContactModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Failed to record contact:', error);
      toast.error('Failed to record contact');
    }
  };

  const flagStudent = async (studentId: string, flagType: keyof StudentFlags, value: boolean) => {
    try {
      await teacherService.students.updateStudentFlag(studentId, flagType, value);
      loadData();
      toast.success('Student flag updated');
    } catch (error) {
      console.error('Failed to update flag:', error);
      toast.error('Failed to update flag');
    }
  };

  const sendMessageToParent = async (studentId: string, message: string) => {
    try {
      await teacherService.students.sendParentMessage(studentId, message);
      toast.success('Message sent to parent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.admissionNumber.includes(searchQuery) ||
                            student.guardianName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [students, searchQuery]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading students..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            My Students
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor student information, performance, and well-being
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-500" />
          <p className="text-2xl font-bold">{students.filter(s => s.flags?.atRisk).length}</p>
          <p className="text-xs text-gray-500">At Risk</p>
        </Card>
        <Card className="text-center">
          <TrendingDown className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold">{students.filter(s => s.flags?.failing).length}</p>
          <p className="text-xs text-gray-500">Failing</p>
        </Card>
        <Card className="text-center">
          <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <p className="text-2xl font-bold">{students.filter(s => s.flags?.lowAttendance).length}</p>
          <p className="text-xs text-gray-500">Low Attendance</p>
        </Card>
        <Card className="text-center">
          <Shield className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{students.filter(s => s.flags?.behaviorIssues).length}</p>
          <p className="text-xs text-gray-500">Behavior Issues</p>
        </Card>
        <Card className="text-center">
          <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
          <p className="text-2xl font-bold">{students.filter(s => s.medicalAlerts?.length).length}</p>
          <p className="text-xs text-gray-500">Medical Alerts</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="w-64">
            <EditableSelect
              value={selectedClass}
              onChange={setSelectedClass}
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes.map(c => ({ value: c.id, label: `${c.name} - ${c.stream}` }))
              ]}
              placeholder="Select Class"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-1" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No students found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Admission No</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-center">Attendance</th>
                  <th className="px-4 py-3 text-center">Behavior</th>
                  <th className="px-4 py-3 text-center">Avg Grade</th>
                  <th className="px-4 py-3 text-center">Flags</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-gray-500">Guardian: {student.guardianName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{student.admissionNumber}</td>
                    <td className="px-4 py-3">{student.className}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getAttendanceColor(student.attendanceSummary?.percentage || 0))}>
                        {student.attendanceSummary?.percentage || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-semibold',
                        (student.disciplineSummary?.merits || 0) > (student.disciplineSummary?.demerits || 0)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}>
                        Net: {(student.disciplineSummary?.merits || 0) - (student.disciplineSummary?.demerits || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('font-semibold', getGradeColor(student.currentGrades?.[0]?.grade || 'E'))}>
                        {student.currentGrades?.[0]?.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {student.flags?.atRisk && <AlertTriangle className="w-4 h-4 text-red-500" title="At Risk" />}
                        {student.flags?.failing && <TrendingDown className="w-4 h-4 text-red-500" title="Failing" />}
                        {student.flags?.lowAttendance && <Clock className="w-4 h-4 text-orange-500" title="Low Attendance" />}
                        {student.flags?.behaviorIssues && <Shield className="w-4 h-4 text-purple-500" title="Behavior Issues" />}
                        {student.medicalAlerts?.length > 0 && <Heart className="w-4 h-4 text-pink-500" title="Medical Alert" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowNotesModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Add Note"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowParentContactModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Contact Parent"
                        >
                          <Phone className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          onClick={() => {
                            const message = prompt('Enter message to send to parent:', 'Please contact me regarding your child\'s progress.');
                            if (message) sendMessageToParent(student.id, message);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Send Message"
                        >
                          <Send className="w-4 h-4 text-purple-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Student Profile Modal */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title="Student Profile" size="xl">
        {selectedStudent && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                <p className="text-sm opacity-90">Admission: {selectedStudent.admissionNumber}</p>
                <p className="text-sm opacity-90">{selectedStudent.className} • {selectedStudent.stream}</p>
              </div>
              <div className="text-right">
                {selectedStudent.flags?.atRisk && (
                  <span className="inline-block px-2 py-1 bg-red-500 rounded-full text-xs">At Risk</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              {(['overview', 'academic', 'attendance', 'behavior', 'medical', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium capitalize transition-colors',
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Parent/Guardian</p>
                    <p className="font-medium">{selectedStudent.guardianName}</p>
                    <p className="text-sm">{selectedStudent.guardianPhone}</p>
                    <p className="text-sm">{selectedStudent.guardianEmail}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{selectedStudent.emergencyContactName}</p>
                    <p className="text-sm">{selectedStudent.emergencyContact}</p>
                    <p className="text-sm">{selectedStudent.emergencyContactRelationship}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Personal Details</p>
                    <p>DOB: {formatDate(selectedStudent.dateOfBirth)}</p>
                    <p>Gender: {selectedStudent.gender}</p>
                    <p>Blood Group: {selectedStudent.bloodGroup}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm">{selectedStudent.address}</p>
                  </div>
                </div>

                {/* Streaks */}
                {selectedStudent.streaks && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      Current Streaks
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{selectedStudent.streaks.academic}</p>
                        <p className="text-xs">Academic</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{selectedStudent.streaks.cleanliness}</p>
                        <p className="text-xs">Cleanliness</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{selectedStudent.streaks.behavior}</p>
                        <p className="text-xs">Behavior</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{selectedStudent.streaks.attendance}</p>
                        <p className="text-xs">Attendance</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === 'academic' && (
              <div className="space-y-4">
                {/* Current Grades */}
                <div>
                  <h4 className="font-semibold mb-2">Current Performance</h4>
                  <div className="space-y-2">
                    {selectedStudent.currentGrades?.map((grade) => (
                      <div key={grade.subjectId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{grade.subjectName}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{grade.currentScore}%</span>
                          <span className={getGradeColor(grade.grade)}>{grade.grade}</span>
                          {grade.improvement > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : grade.improvement < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic History */}
                {selectedStudent.academicHistory?.map((term) => (
                  <div key={term.termId}>
                    <h4 className="font-semibold mb-2">{term.termName} {term.year}</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-center mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Average</p>
                          <p className="font-bold">{term.average}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Grade</p>
                          <p className={getGradeColor(term.grade)}>{term.grade}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rank</p>
                          <p className="font-bold">#{term.rank}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">Class Average: {term.classAverage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.attendanceSummary?.percentage || 0}%</p>
                    <p className="text-xs text-gray-500">Overall Attendance</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedStudent.attendanceSummary?.presentDays || 0}</p>
                    <p className="text-xs text-gray-500">Days Present</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{selectedStudent.attendanceSummary?.lateDays || 0}</p>
                    <p className="text-xs text-gray-500">Late Arrivals</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{selectedStudent.attendanceSummary?.absentDays || 0}</p>
                    <p className="text-xs text-gray-500">Absences</p>
                  </div>
                </div>

                {/* Monthly Attendance */}
                {selectedStudent.attendanceSummary?.monthlyAttendance && (
                  <div>
                    <h4 className="font-semibold mb-2">Monthly Breakdown</h4>
                    <div className="space-y-2">
                      {selectedStudent.attendanceSummary.monthlyAttendance.map((month) => (
                        <div key={month.month} className="flex items-center justify-between text-sm">
                          <span className="w-24">{month.month}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(month.present / (month.present + month.absent)) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs">{month.present}/{month.present + month.absent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowBehaviorModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Record Behavior
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.disciplineSummary?.merits || 0}</p>
                    <p className="text-xs text-gray-500">Merits</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{selectedStudent.disciplineSummary?.demerits || 0}</p>
                    <p className="text-xs text-gray-500">Demerits</p>
                  </div>
                </div>

                {/* Recent Incidents */}
                {selectedStudent.disciplineSummary?.recentIncidents && (
                  <div>
                    <h4 className="font-semibold mb-2">Recent Incidents</h4>
                    <div className="space-y-2">
                      {selectedStudent.disciplineSummary.recentIncidents.map((incident) => (
                        <div key={incident.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={clsx(
                                'px-2 py-0.5 rounded-full text-xs font-semibold',
                                incident.type === 'merit' ? 'bg-green-100 text-green-800' :
                                incident.type === 'demerit' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              )}>
                                {incident.type}
                              </span>
                              <p className="text-sm mt-1">{incident.reason}</p>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(incident.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-4">
                {/* Medical Alerts */}
                {selectedStudent.medicalAlerts && selectedStudent.medicalAlerts.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4" />
                      Medical Alerts
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudent.medicalAlerts.map((alert, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          {alert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {selectedStudent.medicalConditions && selectedStudent.medicalConditions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Medical Conditions</h4>
                    {selectedStudent.medicalConditions.map((condition) => (
                      <div key={condition.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                        <p className="font-medium">{condition.condition}</p>
                        <p className="text-sm text-gray-600">Severity: {condition.severity}</p>
                        <p className="text-sm">Medication: {condition.medication || 'None'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Allergies */}
                {selectedStudent.allergies && selectedStudent.allergies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Allergies</h4>
                    {selectedStudent.allergies.map((allergy) => (
                      <div key={allergy.id} className="p-3 bg-yellow-50 rounded-lg mb-2">
                        <p className="font-medium">{allergy.allergen}</p>
                        <p className="text-sm">Reaction: {allergy.reaction}</p>
                        <p className="text-sm">Emergency Action: {allergy.emergencyAction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medications */}
                {selectedStudent.medications && selectedStudent.medications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Medications</h4>
                    {selectedStudent.medications.map((med) => (
                      <div key={med.id} className="p-3 bg-blue-50 rounded-lg mb-2">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm">Dosage: {med.dosage}</p>
                        <p className="text-sm">Frequency: {med.frequency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <Button size="sm" onClick={() => setShowNotesModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Note
                </Button>

                {selectedStudent.teacherNotes?.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        note.category === 'academic' ? 'bg-blue-100 text-blue-800' :
                        note.category === 'behavior' ? 'bg-red-100 text-red-800' :
                        note.category === 'attendance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {note.category}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(note.date)}</span>
                    </div>
                    <p className="text-sm mt-2">{note.note}</p>
                    {note.isPrivate && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private note (only visible to you)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} title="Add Teacher Note" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="academic">Academic</option>
              <option value="behavior">Behavior</option>
              <option value="attendance">Attendance</option>
              <option value="medical">Medical</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              rows={5}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Enter your notes about this student..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>Cancel</Button>
            <Button onClick={addTeacherNote}>Add Note</Button>
          </div>
        </div>
      </Modal>

      {/* Behavior Modal */}
      <Modal isOpen={showBehaviorModal} onClose={() => setShowBehaviorModal(false)} title="Record Behavior" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={behaviorData.type}
              onChange={(e) => setBehaviorData({ ...behaviorData, type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="merit">Merit (Positive)</option>
              <option value="demerit">Demerit (Negative)</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            <input
              type="number"
              min="1"
              max="10"
              value={behaviorData.points}
              onChange={(e) => setBehaviorData({ ...behaviorData, points: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              rows={3}
              value={behaviorData.reason}
              onChange={(e) => setBehaviorData({ ...behaviorData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Describe the behavior..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBehaviorModal(false)}>Cancel</Button>
            <Button onClick={addBehaviorRecord}>Record</Button>
          </div>
        </div>
      </Modal>

      {/* Parent Contact Modal */}
      <Modal isOpen={showParentContactModal} onClose={() => setShowParentContactModal(false)} title="Record Parent Contact" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact Type</label>
            <select
              value={parentContactData.type}
              onChange={(e) => setParentContactData({ ...parentContactData, type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="call">Phone Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="message">Message</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Summary</label>
            <textarea
              rows={4}
              value={parentContactData.summary}
              onChange={(e) => setParentContactData({ ...parentContactData, summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="What was discussed?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action Items (comma separated)</label>
            <input
              type="text"
              value={parentContactData.actionItems}
              onChange={(e) => setParentContactData({ ...parentContactData, actionItems: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Follow up on homework, Schedule tutoring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Date</label>
            <input
              type="date"
              value={parentContactData.followUpDate}
              onChange={(e) => setParentContactData({ ...parentContactData, followUpDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowParentContactModal(false)}>Cancel</Button>
            <Button onClick={recordParentContact}>Save Contact</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherStudentsPage;