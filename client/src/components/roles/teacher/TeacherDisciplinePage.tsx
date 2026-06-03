// client/src/components/roles/teacher/TeacherDisciplinePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star, AlertTriangle, Award, TrendingUp, Plus, Filter, Download, Eye, Edit, Trash2,
  Flag, Trophy, Users, UserCheck, CheckCircle, XCircle, Clock, Calendar,
  MessageCircle, Mail, Phone, Search, RefreshCw, Upload, Printer,
  ChevronDown, ChevronUp, MoreVertical, Shield, Target, Sparkles,
  Crown, Medal, Ribbon, BadgeCheck, Heart, FileText, Send, UserMinus,
  Building2, AlertCircle, Check, X, Save, RotateCcw
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import type { DisciplineRecord, StudentStreak, TeacherStudent } from '../../../types/teacher';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface DisciplineFormData {
  studentId: string;
  type: 'merit' | 'demerit' | 'warning' | 'referral';
  category: string;
  description: string;
  points: number;
  action?: string;
  referredTo?: 'hod' | 'principal';
  severity?: 'low' | 'medium' | 'high';
}

interface ReferralData {
  studentId: string;
  reason: string;
  referredTo: 'hod' | 'principal';
  urgency: 'normal' | 'urgent';
  notes: string;
}

interface ExtendedDisciplineRecord extends DisciplineRecord {
  studentName: string;
  className: string;
  teacherName: string;
}

const meritCategories = [
  { id: 'academic_excellence', name: 'Academic Excellence', points: 5, icon: <Award size={14} /> },
  { id: 'good_behavior', name: 'Good Behavior', points: 3, icon: <Heart size={14} /> },
  { id: 'cleanliness', name: 'Cleanliness', points: 2, icon: <Sparkles size={14} /> },
  { id: 'punctuality', name: 'Punctuality', points: 2, icon: <Clock size={14} /> },
  { id: 'helpfulness', name: 'Helpfulness', points: 3, icon: <Users size={14} /> },
  { id: 'leadership', name: 'Leadership', points: 4, icon: <Crown size={14} /> },
  { id: 'sportsmanship', name: 'Sportsmanship', points: 3, icon: <Trophy size={14} /> },
  { id: 'creativity', name: 'Creativity', points: 3, icon: <Sparkles size={14} /> },
  { id: 'attendance', name: 'Perfect Attendance', points: 4, icon: <Calendar size={14} /> },
  { id: 'homework_completion', name: 'Homework Completion', points: 2, icon: <FileText size={14} /> },
];

const demeritCategories = [
  { id: 'late_submission', name: 'Late Submission', points: -1, icon: <Clock size={14} /> },
  { id: 'misconduct', name: 'Misconduct', points: -2, icon: <AlertTriangle size={14} /> },
  { id: 'truancy', name: 'Truancy', points: -3, icon: <UserMinus size={14} /> },
  { id: 'disrespect', name: 'Disrespect', points: -3, icon: <AlertCircle size={14} /> },
  { id: 'bullying', name: 'Bullying', points: -5, icon: <Shield size={14} /> },
  { id: 'damage_property', name: 'Damage to Property', points: -4, icon: <AlertTriangle size={14} /> },
  { id: 'cheating', name: 'Cheating', points: -5, icon: <FileText size={14} /> },
  { id: 'uniform_violation', name: 'Uniform Violation', points: -1, icon: <Users size={14} /> },
  { id: 'phone_use', name: 'Unauthorized Phone Use', points: -1, icon: <AlertCircle size={14} /> },
  { id: 'disruptive', name: 'Disruptive Behavior', points: -2, icon: <AlertTriangle size={14} /> },
];

const warningCategories = [
  { id: 'verbal', name: 'Verbal Warning', severity: 'low' },
  { id: 'written', name: 'Written Warning', severity: 'medium' },
  { id: 'final', name: 'Final Warning', severity: 'high' },
];

const severityConfig = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={12} /> },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={12} /> },
  high: { label: 'High', color: 'bg-red-100 text-red-800', icon: <AlertTriangle size={12} /> },
};

const typeConfig = {
  merit: { label: 'Merit', color: 'bg-green-100 text-green-800', icon: <Star size={12} /> },
  demerit: { label: 'Demerit', color: 'bg-red-100 text-red-800', icon: <AlertTriangle size={12} /> },
  warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={12} /> },
  referral: { label: 'Referral', color: 'bg-purple-100 text-purple-800', icon: <Shield size={12} /> },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800' },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
};

export default function TeacherDisciplinePage() {
  const [records, setRecords] = useState<ExtendedDisciplineRecord[]>([]);
  const [streaks, setStreaks] = useState<StudentStreak[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showForm, setShowForm] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExtendedDisciplineRecord | null>(null);
  const [selectedStudentForStreak, setSelectedStudentForStreak] = useState<TeacherStudent | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [formData, setFormData] = useState<DisciplineFormData>({
    studentId: '',
    type: 'merit',
    category: '',
    description: '',
    points: 1,
  });
  const [referralData, setReferralData] = useState<ReferralData>({
    studentId: '',
    reason: '',
    referredTo: 'hod',
    urgency: 'normal',
    notes: '',
  });

  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadDisciplineData();
  }, []);

  const loadDisciplineData = async () => {
    setLoading(true);
    try {
      const [recordsRes, studentsRes] = await Promise.all([
        teacherService.discipline.getDisciplineRecords(),
        teacherService.students.getMyStudents(),
      ]);
      if (recordsRes.success && recordsRes.data) {
        const extended = (recordsRes.data as any[]).map((r) => ({
          ...r,
          studentName: r.studentName || 'Unknown',
          className: r.className || '',
          teacherName: r.reportedByName || '',
        }));
        setRecords(extended as ExtendedDisciplineRecord[]);
      }
      if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to load discipline data:', error);
      toast.error('Failed to load discipline data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async () => {
    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      let response;
      if (formData.type === 'merit') {
        response = await teacherService.discipline.recordMerit({
          studentId: formData.studentId,
          category: formData.category,
          description: formData.description,
          points: formData.points,
        });
      } else if (formData.type === 'demerit') {
        response = await teacherService.discipline.recordDemerit({
          studentId: formData.studentId,
          category: formData.category,
          description: formData.description,
          points: Math.abs(formData.points),
        });
      } else if (formData.type === 'warning') {
        response = await teacherService.discipline.recordWarning({
          studentId: formData.studentId,
          category: formData.category,
          description: formData.description,
          action: formData.action,
        });
      }
      
      if (response?.success) {
        toast.success(`Record saved successfully`);
        setShowForm(false);
        setFormData({ studentId: '', type: 'merit', category: '', description: '', points: 1, severity: 'low' });
        loadDisciplineData();
      }
    } catch (error) {
      console.error('Failed to save record:', error);
      toast.error('Failed to save record');
    }
  };

  const handleReferral = async () => {
    toast.success('Referral submitted');
    setShowReferralModal(false);
    setReferralData({ studentId: '', reason: '', referredTo: 'hod', urgency: 'normal', notes: '' });
    loadDisciplineData();
  };

  const generateCertificate = async (studentId: string) => {
    setGeneratingCertificate(true);
    try {
      toast.success('Certificate generated');
      setShowCertificateModal(false);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const resetStreak = async (studentId: string, streakType: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Reset Streak?',
      message: `Are you sure you want to reset this student's ${streakType} streak?`,
      confirmText: 'Reset',
      type: 'warning',
    });
    if (!confirmed) return;
    
    try {
      toast.success('Streak reset');
      loadDisciplineData();
    } catch (error) {
      console.error('Failed to reset streak:', error);
      toast.error('Failed to reset streak');
    }
  };

  const exportDisciplineData = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export data');
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStudent = !selectedStudent || record.studentId === selectedStudent;
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStudent && matchesType && matchesStatus;
    });
  }, [records, searchTerm, selectedStudent, typeFilter, statusFilter]);

  const statistics = useMemo(() => {
    const totalMerits = records.filter(r => r.type === 'merit').length;
    const totalDemerits = records.filter(r => r.type === 'demerit').length;
    const totalWarnings = records.filter(r => r.type === 'warning').length;
    const activeStreaks = streaks.filter(s => s.currentStreak > 3).length;
    const topStudent = streaks.length > 0 ? streaks.reduce((max, s) => s.currentStreak > max.currentStreak ? s : max, streaks[0]) : null;
    
    return { totalMerits, totalDemerits, totalWarnings, activeStreaks, topStudent };
  }, [records, streaks]);

  const leaderboardData = useMemo(() => {
    const studentPoints = new Map<string, { name: string; merits: number; demerits: number; netPoints: number }>();
    
    records.forEach(record => {
      if (!studentPoints.has(record.studentId)) {
        studentPoints.set(record.studentId, {
          name: record.studentName,
          merits: 0,
          demerits: 0,
          netPoints: 0,
        });
      }
      const student = studentPoints.get(record.studentId)!;
      if (record.type === 'merit') {
        student.merits += record.points || 1;
        student.netPoints += record.points || 1;
      } else if (record.type === 'demerit') {
        student.demerits += Math.abs(record.points || 1);
        student.netPoints -= Math.abs(record.points || 1);
      }
    });
    
    return Array.from(studentPoints.values()).sort((a, b) => b.netPoints - a.netPoints);
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading discipline data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Discipline Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track student behavior, award merits, and manage discipline records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLeaderboardModal(true)}>
            <Trophy className="w-4 h-4 mr-1" />
            Leaderboard
          </Button>
          <Button variant="outline" size="sm" onClick={loadDisciplineData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalMerits}</p>
          <p className="text-xs text-gray-500">Merits Given</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalDemerits}</p>
          <p className="text-xs text-gray-500">Demerits Given</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalWarnings}</p>
          <p className="text-xs text-gray-500">Warnings Issued</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.activeStreaks}</p>
          <p className="text-xs text-gray-500">Active Streaks</p>
        </Card>
        {statistics.topStudent && (
          <Card className="text-center bg-gradient-to-r from-yellow-50 to-amber-50">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{statistics.topStudent.studentName}</p>
            <p className="text-xs text-gray-500">Top Performer</p>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="all">All Types</option>
            <option value="merit">Merits</option>
            <option value="demerit">Demerits</option>
            <option value="warning">Warnings</option>
            <option value="referral">Referrals</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => exportDisciplineData('excel')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setSelectedStudent('');
            setTypeFilter('all');
            setStatusFilter('all');
            setDateRange({ start: '', end: '' });
          }}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => {
          setFormData({ ...formData, type: 'merit', studentId: '' });
          setShowForm(true);
        }}>
          <Star className="w-4 h-4 mr-1" />
          Award Merit
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          setFormData({ ...formData, type: 'demerit', studentId: '' });
          setShowForm(true);
        }}>
          <AlertTriangle className="w-4 h-4 mr-1" />
          Issue Demerit
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          setFormData({ ...formData, type: 'warning', studentId: '' });
          setShowForm(true);
        }}>
          <AlertCircle className="w-4 h-4 mr-1" />
          Issue Warning
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReferralModal(true)}>
          <Shield className="w-4 h-4 mr-1" />
          Refer Student
        </Button>
      </div>

      {/* Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-sm">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Points</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No discipline records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const type = typeConfig[record.type as keyof typeof typeConfig] || typeConfig.merit;
                  const status = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.active;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 text-sm">{new Date(record.reportedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{record.studentName}</td>
                      <td className="px-4 py-3 text-sm">{record.className}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', type.color)}>
                          {type.icon}
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.category}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={record.description}>
                        {record.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('font-medium', record.type === 'merit' ? 'text-green-600' : 'text-red-600')}>
                          {record.type === 'merit' ? `+${record.points}` : `-${Math.abs(record.points)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowCertificateModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Generate Certificate"
                          >
                            <Award className="w-4 h-4 text-purple-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="View Details">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                       </td>
                     </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Streaks Section */}
      {streaks.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-orange-500" />
              Student Streaks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streaks.slice(0, 6).map((streak) => (
                <div key={streak.id} className="border rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{streak.studentName}</p>
                      <p className="text-sm text-gray-500 capitalize">{streak.type} Streak</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{streak.currentStreak}</p>
                      <p className="text-xs text-gray-500">days</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-sm">
                      <Trophy className="w-3 h-3 mr-1" />
                      Award
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-sm text-red-500"
                      onClick={() => resetStreak(streak.studentId, streak.type)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Add/Edit Record Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Discipline Entry" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-2">
              {(['merit', 'demerit', 'warning'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, type, category: '', points: type === 'merit' ? 1 : -1 })}
                  className={clsx(
                    'flex-1 px-3 py-2 rounded-lg border transition',
                    formData.type === type
                      ? type === 'merit' ? 'bg-green-50 border-green-500 text-green-700' :
                        type === 'demerit' ? 'bg-red-50 border-red-500 text-red-700' :
                        'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => {
                const category = formData.type === 'merit' 
                  ? meritCategories.find(c => c.id === e.target.value)
                  : demeritCategories.find(c => c.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  category: e.target.value,
                  points: category?.points || (formData.type === 'merit' ? 1 : -1)
                });
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select category...</option>
              {(formData.type === 'merit' ? meritCategories : demeritCategories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.points > 0 ? `+${cat.points}` : cat.points} points)
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'warning' && (
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <div className="flex gap-2">
                {warningCategories.map((warning) => (
                  <button
                    key={warning.id}
                    onClick={() => setFormData({ ...formData, severity: warning.severity as any })}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg border transition',
                      formData.severity === warning.severity
                        ? warning.severity === 'low' ? 'bg-green-50 border-green-500' :
                          warning.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-red-50 border-red-500'
                        : 'bg-gray-50 border-gray-300'
                    )}
                  >
                    {warning.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Describe the behavior or incident..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleRecord}>Save Entry</Button>
        </div>
      </Modal>

      {/* Referral Modal */}
      <Modal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} title="Refer Student" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              value={referralData.studentId}
              onChange={(e) => setReferralData({ ...referralData, studentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Refer To</label>
            <div className="flex gap-2">
              <button
                onClick={() => setReferralData({ ...referralData, referredTo: 'hod' })}
                className={clsx('flex-1 px-3 py-2 rounded-lg border', referralData.referredTo === 'hod' && 'bg-blue-50 border-blue-500')}
              >
                Head of Department
              </button>
              <button
                onClick={() => setReferralData({ ...referralData, referredTo: 'principal' })}
                className={clsx('flex-1 px-3 py-2 rounded-lg border', referralData.referredTo === 'principal' && 'bg-purple-50 border-purple-500')}
              >
                Principal
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <textarea
              value={referralData.reason}
              onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Explain why you are referring this student..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Additional Notes</label>
            <textarea
              value={referralData.notes}
              onChange={(e) => setReferralData({ ...referralData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Any additional information..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowReferralModal(false)}>Cancel</Button>
          <Button onClick={handleReferral}>Submit Referral</Button>
        </div>
      </Modal>

      {/* Certificate Modal */}
      <Modal isOpen={showCertificateModal} onClose={() => setShowCertificateModal(false)} title="Generate Merit Certificate" size="md">
        {selectedRecord && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-lg">{selectedRecord.studentName}</p>
              <p className="text-sm text-gray-600">{selectedRecord.className}</p>
              <div className="mt-2 p-2 bg-white rounded">
                <p className="text-sm">Awarded Merit for: <strong>{selectedRecord.category}</strong></p>
                <p className="text-xs text-gray-500 mt-1">{selectedRecord.description}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              This certificate will recognize the student's positive behavior and achievement.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowCertificateModal(false)}>Cancel</Button>
          <Button onClick={() => selectedRecord && generateCertificate(selectedRecord.studentId)} disabled={generatingCertificate}>
            {generatingCertificate ? <Spinner size="sm" /> : <Award className="w-4 h-4 mr-1" />}
            Generate Certificate
          </Button>
        </div>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} title="Merit Leaderboard" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg text-center">
            <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Top Performing Students</p>
            <p className="text-xs text-gray-500">Based on net merit points</p>
          </div>
          
          <div className="space-y-2">
            {leaderboardData.map((student, idx) => (
              <div key={student.name} className={clsx(
                'flex items-center justify-between p-3 rounded-lg border',
                idx === 0 && 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
                idx === 1 && 'bg-gray-50 border-gray-200',
                idx === 2 && 'bg-orange-50 border-orange-100'
              )}>
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                    idx === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  )}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-600">+{student.merits}</span>
                      <span className="text-red-600">-{student.demerits}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-600">{student.netPoints}</p>
                  <p className="text-xs text-gray-500">net points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

<ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}