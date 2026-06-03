// client/src/components/roles/teacher/TeacherExaminationsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Calendar, Clock, Users, BookOpen, CheckCircle, XCircle,
  AlertCircle, Eye, Edit, Trash2, Plus, Search, Filter, Download,
  RefreshCw, Upload, Printer, PieChart, BarChart3, TrendingUp,
  Award, Star, Flag, Shield, UserCheck, AlertTriangle, Send,
  Save, ChevronDown, ChevronUp, MoreVertical, Target, ClipboardList
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import type { 
  ExamTimetable, TeacherClass, TeacherSubject 
} from '../../../types/teacher';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface ExamFormData {
  title: string;
  type: 'cat1' | 'cat2' | 'end_term' | 'mock' | 'assignment';
  classId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  totalMarks: number;
  passMark: number;
  instructions: string;
}

interface ScoreEntryData {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  score: number;
  grade?: string;
  remarks?: string;
  status: 'present' | 'absent' | 'absent_with_reason';
}

interface IrregularityReport {
  studentId: string;
  studentName: string;
  description: string;
  evidence?: string;
  action?: string;
}

const examTypeConfig = {
  cat1: { label: 'CAT 1', color: 'bg-blue-100 text-blue-800', icon: <FileText size={12} /> },
  cat2: { label: 'CAT 2', color: 'bg-green-100 text-green-800', icon: <FileText size={12} /> },
  end_term: { label: 'End Term', color: 'bg-purple-100 text-purple-800', icon: <FileText size={12} /> },
  mock: { label: 'Mock', color: 'bg-orange-100 text-orange-800', icon: <FileText size={12} /> },
  assignment: { label: 'Assignment', color: 'bg-yellow-100 text-yellow-800', icon: <ClipboardList size={12} /> },
};

const invigilationStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={12} /> },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle size={12} /> },
};

const gradeScale = [
  { min: 80, max: 100, grade: 'A', points: 12, description: 'Excellent' },
  { min: 75, max: 79, grade: 'A-', points: 11, description: 'Very Good' },
  { min: 70, max: 74, grade: 'B+', points: 10, description: 'Good' },
  { min: 65, max: 69, grade: 'B', points: 9, description: 'Above Average' },
  { min: 60, max: 64, grade: 'B-', points: 8, description: 'Average' },
  { min: 55, max: 59, grade: 'C+', points: 7, description: 'Satisfactory' },
  { min: 50, max: 54, grade: 'C', points: 6, description: 'Acceptable' },
  { min: 45, max: 49, grade: 'C-', points: 5, description: 'Below Average' },
  { min: 40, max: 44, grade: 'D+', points: 4, description: 'Poor' },
  { min: 35, max: 39, grade: 'D', points: 3, description: 'Very Poor' },
  { min: 30, max: 34, grade: 'D-', points: 2, description: 'Extremely Poor' },
  { min: 0, max: 29, grade: 'E', points: 1, description: 'Fail' },
];

function calculateGrade(score: number, totalMarks: number): { grade: string; points: number; description: string } {
  const percentage = (score / totalMarks) * 100;
  const gradeInfo = gradeScale.find(g => percentage >= g.min && percentage <= g.max);
  return gradeInfo || { grade: 'E', points: 1, description: 'Fail' };
}

export default function TeacherExaminationsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [invigilationDuties, setInvigilationDuties] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'timetable' | 'invigilation' | 'marking' | 'analysis' | 'reports'>('timetable');
  const [showExamModal, setShowExamModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showIrregularityModal, setShowIrregularityModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [selectedInvigilation, setSelectedInvigilation] = useState<any | null>(null);
  const [scores, setScores] = useState<ScoreEntryData[]>([]);
  const [irregularityReport, setIrregularityReport] = useState<IrregularityReport>({
    studentId: '',
    studentName: '',
    description: '',
    evidence: '',
    action: '',
  });
  const [examForm, setExamForm] = useState<ExamFormData>({
    title: '',
    type: 'cat1',
    classId: '',
    subjectId: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    totalMarks: 100,
    passMark: 50,
    instructions: '',
  });
  const [markingProgress, setMarkingProgress] = useState({ marked: 0, total: 0 });

  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsRes, timetableRes, invigilationRes, resultsRes, classesRes, subjectsRes] = await Promise.all([
        teacherService.examinations.getExams(),
        teacherService.examinations.getExamTimetable(),
        teacherService.examinations.getInvigilationDuties(),
        teacherService.examinations.getExamResults(),
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
      ]);
      
      if (examsRes.success) setExams(examsRes.data || []);
      if (timetableRes.success) setTimetable(timetableRes.data || []);
      if (invigilationRes.success) setInvigilationDuties(invigilationRes.data || []);
      if (resultsRes.success) setResults(resultsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Failed to load examinations data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createExam = async () => {
    if (!examForm.title || !examForm.classId || !examForm.subjectId) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      await teacherService.examinations.createExam(examForm);
      toast.success('Exam created successfully');
      setShowExamModal(false);
      setExamForm({
        title: '',
        type: 'cat1',
        classId: '',
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        totalMarks: 100,
        passMark: 50,
        instructions: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create exam:', error);
      toast.error('Failed to create exam');
    }
  };

  const loadScoresForMarking = async (examId: string) => {
    try {
      const response = await teacherService.examinations.getExamScores(examId);
      setScores(response.data || []);
      const exam = exams.find(e => e.id === examId);
      setSelectedExam(exam || null);
      setMarkingProgress({
        marked: scores.filter(s => s.score !== undefined && s.score !== null).length,
        total: scores.length,
      });
      setShowScoreModal(true);
    } catch (error) {
      console.error('Failed to load scores:', error);
      toast.error('Failed to load exam data');
    }
  };

  const saveScores = async () => {
    if (!selectedExam) return;
    
    try {
      await teacherService.examinations.saveExamScores(selectedExam.id, scores);
      toast.success('Scores saved successfully');
      setShowScoreModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save scores:', error);
      toast.error('Failed to save scores');
    }
  };

  const updateScore = (studentId: string, score: number) => {
    setScores(prev => prev.map(s => {
      if (s.studentId === studentId) {
        const gradeInfo = calculateGrade(score, selectedExam?.totalMarks || 100);
        return {
          ...s,
          score,
          grade: gradeInfo.grade,
          remarks: gradeInfo.description,
          status: 'present',
        };
      }
      return s;
    }));
  };

  const markAbsent = (studentId: string) => {
    setScores(prev => prev.map(s => {
      if (s.studentId === studentId) {
        return { ...s, score: 0, status: 'absent', grade: 'ABS', remarks: 'Absent' };
      }
      return s;
    }));
  };

  const reportIrregularity = async () => {
    if (!irregularityReport.description) {
      toast.error('Please describe the irregularity');
      return;
    }
    
    try {
      await teacherService.exams.reportExamIrregularity({
        examId: irregularityReport.studentId,
        studentId: irregularityReport.studentId,
        description: irregularityReport.description,
        type: 'other',
      });
      toast.success('Irregularity reported successfully');
      setShowIrregularityModal(false);
      setIrregularityReport({ studentId: '', studentName: '', description: '', evidence: '', action: '' });
    } catch (error) {
      console.error('Failed to report irregularity:', error);
      toast.error('Failed to report irregularity');
    }
  };

  const confirmInvigilation = async (dutyId: string) => {
    try {
      await teacherService.examinations.confirmInvigilation(dutyId);
      toast.success('Invigilation duty confirmed');
      loadData();
    } catch (error) {
      console.error('Failed to confirm:', error);
      toast.error('Failed to confirm invigilation');
    }
  };

  const exportResults = async (examId: string, format: 'excel' | 'pdf' | 'csv') => {
    try {
      const response = await teacherService.examinations.exportExamResults(examId, format);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam_results_${examId}_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export results');
    }
  };

  const generateAnalysis = async (examId: string) => {
    try {
      const response = await teacherService.examinations.getExamAnalysis(examId);
      setAnalysis(response.data as any);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      toast.error('Failed to generate analysis');
    }
  };

  const filteredTimetable = useMemo(() => {
     return timetable.filter(item => {
       const matchesSearch = (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.classId || '').toLowerCase().includes(searchTerm.toLowerCase());
       const matchesType = !typeFilter || item.type === typeFilter;
       return matchesSearch && matchesType;
     });
  }, [timetable, searchTerm, typeFilter]);

  const filteredInvigilation = useMemo(() => {
    return invigilationDuties.filter(duty => {
      const matchesSearch = duty.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           duty.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || duty.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invigilationDuties, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading examinations data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Examinations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage exams, marking, and performance analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowExamModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timetable')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'timetable' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Exam Timetable
          </button>
          <button
            onClick={() => setActiveTab('invigilation')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'invigilation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            <UserCheck className="w-4 h-4 inline mr-1" />
            Invigilation Duties
          </button>
          <button
            onClick={() => setActiveTab('marking')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'marking' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Marking & Scores
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'analysis' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Exam Analysis
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            <Download className="w-4 h-4 inline mr-1" />
            Reports
          </button>
        </nav>
      </div>

      {/* Exam Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Types</option>
                <option value="cat1">CAT 1</option>
                <option value="cat2">CAT 2</option>
                <option value="end_term">End Term</option>
                <option value="mock">Mock</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setTypeFilter(''); }}>
                Clear
              </Button>
            </div>
          </Card>

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredTimetable.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No exam timetable found</p>
              </Card>
            ) : (
              filteredTimetable.map(item => {
                const examType = examTypeConfig[item.examType as keyof typeof examTypeConfig] || examTypeConfig.cat1;
                return (
                  <Card key={item.id} className="hover:shadow-md transition">
                    <div className="p-4">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', examType.color)}>
                              {examType.icon}
                              {examType.label}
                            </span>
                            <span className="text-sm text-gray-500">{item.subjectName}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.examTitle}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.className}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{item.startTime} - {item.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <AlertCircle className="w-4 h-4" />
                              <span>{item.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <FileText className="w-4 h-4" />
                              <span>{item.totalMarks} marks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Invigilation Duties Tab */}
      {activeTab === 'invigilation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredInvigilation.length === 0 ? (
              <Card className="text-center py-12">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No invigilation duties assigned</p>
              </Card>
            ) : (
              filteredInvigilation.map(duty => {
                const status = invigilationStatusConfig[duty.status as keyof typeof invigilationStatusConfig] || invigilationStatusConfig.pending;
                return (
                  <Card key={duty.id} className="hover:shadow-md transition">
                    <div className="p-4">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{duty.examTitle}</h3>
                          <p className="text-sm text-gray-600 mt-1">{duty.subjectName} - {duty.className}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(duty.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{duty.startTime} - {duty.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <AlertCircle className="w-4 h-4" />
                              <span>{duty.venue}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                          {duty.status === 'pending' && (
                            <Button size="sm" className="mt-2 w-full" onClick={() => confirmInvigilation(duty.id)}>
                              Confirm Duty
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Marking & Scores Tab */}
      {activeTab === 'marking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => {
              const examType = examTypeConfig[exam.type as keyof typeof examTypeConfig] || examTypeConfig.cat1;
              const isMarked = results.some(r => r.examId === exam.id);
              
              return (
                <Card key={exam.id} className="hover:shadow-md transition cursor-pointer" onClick={() => loadScoresForMarking(exam.id)}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', examType.color)}>
                        {examType.icon}
                        {examType.label}
                      </span>
                      {isMarked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} /> Marked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{exam.className} - {exam.subjectName}</p>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-500">Total Marks: {exam.totalMarks}</span>
                      <span className="text-gray-500">Pass Mark: {exam.passMark}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Exam Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.slice(0, 6).map(exam => (
              <Card key={exam.id} className="hover:shadow-md transition">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                  <p className="text-sm text-gray-500">{exam.className} - {exam.subjectName}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => generateAnalysis(exam.id)}>
                      <PieChart className="w-4 h-4 mr-1" />
                      View Analysis
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => (
              <Card key={exam.id}>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                  <p className="text-sm text-gray-500">{exam.className} - {exam.subjectName}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => exportResults(exam.id, 'excel')}>
                      <Download className="w-4 h-4 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => exportResults(exam.id, 'pdf')}>
                      <Printer className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={showExamModal} onClose={() => setShowExamModal(false)} title="Create Exam" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Exam Title *</label>
              <input
                type="text"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., End of Term Examination"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exam Type</label>
              <select
                value={examForm.type}
                onChange={(e) => setExamForm({ ...examForm, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="cat1">CAT 1</option>
                <option value="cat2">CAT 2</option>
                <option value="end_term">End Term</option>
                <option value="mock">Mock</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <select
                value={examForm.classId}
                onChange={(e) => setExamForm({ ...examForm, classId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <select
                value={examForm.subjectId}
                onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input
                type="text"
                value={examForm.venue}
                onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Hall A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={examForm.date}
                onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={examForm.startTime}
                onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={examForm.endTime}
                onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Marks</label>
              <input
                type="number"
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pass Mark</label>
              <input
                type="number"
                value={examForm.passMark}
                onChange={(e) => setExamForm({ ...examForm, passMark: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Instructions</label>
              <textarea
                value={examForm.instructions}
                onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Exam instructions for students..."
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowExamModal(false)}>Cancel</Button>
          <Button onClick={createExam}>Create Exam</Button>
        </div>
      </Modal>

      {/* Score Entry Modal */}
      <Modal isOpen={showScoreModal} onClose={() => setShowScoreModal(false)} title={`Marking: ${selectedExam?.title}`} size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{selectedExam?.className} - {selectedExam?.subjectName}</p>
              <p className="text-sm font-medium">Total Marks: {selectedExam?.totalMarks} | Pass Mark: {selectedExam?.passMark}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-lg font-bold text-blue-600">{markingProgress.marked}/{markingProgress.total}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-sm">
                  <th className="px-3 py-2">Admission No</th>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Remarks</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scores.map(student => (
                  <tr key={student.studentId}>
                    <td className="px-3 py-2 text-sm">{student.admissionNumber}</td>
                    <td className="px-3 py-2 font-medium">{student.studentName}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={student.score || ''}
                        onChange={(e) => updateScore(student.studentId, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        min={0}
                        max={selectedExam?.totalMarks}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{student.grade || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">{student.remarks || '-'}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => markAbsent(student.studentId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Mark Absent
                      </button>
</td>
                  </tr>
                ))}
                </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <Button size="sm" variant="outline" onClick={() => setShowIrregularityModal(true)}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              Report Irregularity
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowScoreModal(false)}>Cancel</Button>
              <Button onClick={saveScores}>Save Scores</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Irregularity Report Modal */}
      <Modal isOpen={showIrregularityModal} onClose={() => setShowIrregularityModal(false)} title="Report Exam Irregularity" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              value={irregularityReport.studentId}
              onChange={(e) => {
                const student = scores.find(s => s.studentId === e.target.value);
                setIrregularityReport({
                  ...irregularityReport,
                  studentId: e.target.value,
                  studentName: student?.studentName || '',
                });
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select student...</option>
              {scores.map(s => (
                <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={irregularityReport.description}
              onChange={(e) => setIrregularityReport({ ...irregularityReport, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Describe the irregularity..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Evidence (Optional)</label>
            <textarea
              value={irregularityReport.evidence}
              onChange={(e) => setIrregularityReport({ ...irregularityReport, evidence: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Any evidence or witness statements..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowIrregularityModal(false)}>Cancel</Button>
          <Button onClick={reportIrregularity}>Submit Report</Button>
        </div>
      </Modal>

      {/* Exam Analysis Modal */}
      <Modal isOpen={showAnalysisModal} onClose={() => setShowAnalysisModal(false)} title="Exam Analysis" size="lg">
        {analysis && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analysis.totalStudents}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analysis.passed}</p>
                <p className="text-xs text-gray-500">Passed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{analysis.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{analysis.passRate}%</p>
                <p className="text-xs text-gray-500">Pass Rate</p>
              </div>
            </div>
            
            {analysis && (
              <div>
                <h4 className="font-semibold mb-3">Grade Distribution</h4>
                <div className="space-y-2">
                  {(analysis.gradeDistribution || []).map((item: any) => (
                    <div key={item.grade || item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Grade {item.grade || item.name}</span>
                        <span>{item.count || item.value} students ({item.percentage || 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-3">Top Performers</h4>
              <div className="space-y-2">
                {(analysis?.topPerformers || []).map((student: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-500">#{idx + 1}</span>
                      <span>{student.name}</span>
                    </div>
                    <span className="font-semibold">{student.score}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Areas for Improvement</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {analysis.weakTopics?.map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
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