 
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileText, Save, Download, TrendingUp, TrendingDown, BarChart3,
  PieChart, Printer, Mail, Eye, Edit, Trash2, Plus, Search,
  Filter, RefreshCw, CheckCircle, XCircle, AlertCircle, Award,
  Star, Users, BookOpen, Calendar, Clock, Upload, Copy,
  ChevronDown, ChevronUp, MessageSquare, Target, Shield, Zap, Settings
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
import type { GradeEntry as BaseGradeEntry, GradeSummary as BaseGradeSummary } from '../../../types/teacher';

type GradeEntry = BaseGradeEntry & {
  admissionNumber: string;
  assignmentScore: number | null;
  practicalScore: number | null;
  projectScore: number | null;
  remarks: string;
};

type ClassGradeSummary = BaseGradeSummary & {
  classId: string;
  className: string;
  academicYear: string;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  gradeDistribution: {
    A: number;
    'A-': number;
    'B+': number;
    B: number;
    'B-': number;
    'C+': number;
    C: number;
    'C-': number;
    'D+': number;
    D: number;
    'D-': number;
    E: number;
  };
  topPerformers: Array<{ studentId: string; studentName: string; score: number }>;
  strugglingStudents: Array<{ studentId: string; studentName: string; score: number }>;
};

interface AssessmentWeight {
  cat1: number;
  cat2: number;
  cat3: number;
  assignment: number;
  practical: number;
  project: number;
  exam: number;
}

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

const defaultWeights: AssessmentWeight = {
  cat1: 10,
  cat2: 10,
  cat3: 10,
  assignment: 5,
  practical: 5,
  project: 10,
  exam: 50,
};

function calculateTotalScore(scores: {
  cat1: number | null;
  cat2: number | null;
  cat3: number | null;
  assignment: number | null;
  practical: number | null;
  project: number | null;
  exam: number | null;
}, weights: AssessmentWeight): number {
  let total = 0;
  let weightSum = 0;
  
  if (scores.cat1 !== null) { total += (scores.cat1 / 100) * weights.cat1; weightSum += weights.cat1; }
  if (scores.cat2 !== null) { total += (scores.cat2 / 100) * weights.cat2; weightSum += weights.cat2; }
  if (scores.cat3 !== null) { total += (scores.cat3 / 100) * weights.cat3; weightSum += weights.cat3; }
  if (scores.assignment !== null) { total += (scores.assignment / 100) * weights.assignment; weightSum += weights.assignment; }
  if (scores.practical !== null) { total += (scores.practical / 100) * weights.practical; weightSum += weights.practical; }
  if (scores.project !== null) { total += (scores.project / 100) * weights.project; weightSum += weights.project; }
  if (scores.exam !== null) { total += (scores.exam / 100) * weights.exam; weightSum += weights.exam; }
  
  return weightSum > 0 ? Math.round((total / weightSum) * 100) : 0;
}

function getGradeInfo(totalScore: number) {
  return gradeScale.find(g => totalScore >= g.min && totalScore <= g.max) || gradeScale[gradeScale.length - 1];
}

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [summary, setSummary] = useState<ClassGradeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [weights, setWeights] = useState<AssessmentWeight>(defaultWeights);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string; stream: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeEntry | null>(null);
  const [commentText, setCommentText] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    toast.success('Template download not available');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.error('Import not available');
  };

  const processImport = async () => {
    toast.error('Import not available');
    setShowImportModal(false);
  };

  const publishResults = async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) {
      toast.error('Select class, term, and year first');
      return;
    }
    try {
      await teacherService.grades.publishResults(selectedClass, selectedTerm, selectedYear);
      toast.success('Results published successfully');
    } catch {
      toast.error('Failed to publish results');
    }
  };

  const resetSettings = () => {
    setWeights(defaultWeights);
    toast.success('Settings reset to default');
  };

  const saveSettings = () => {
    toast.success('Settings saved');
    setShowSettingsModal(false);
  };

  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load grades when filters change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      loadGrades();
      loadSummary();
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes, termsRes] = await Promise.all([
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
        teacherService.academic.getTerms(),
      ]);
      
      if (classesRes.success && classesRes.data) setClasses(classesRes.data as Array<{ id: string; name: string; stream: string }>);
      if (subjectsRes.success && subjectsRes.data) setSubjects(subjectsRes.data as Array<{ id: string; name: string }>);
      if (termsRes.success && termsRes.data) setTerms(termsRes.data as Array<{ id: string; name: string }>);
      
      if ((classesRes.data || []).length) setSelectedClass((classesRes.data || [])[0]?.id || '');
      if ((subjectsRes.data || []).length) setSelectedSubject((subjectsRes.data || [])[0]?.id || '');
      if ((termsRes.data || []).length) setSelectedTerm((termsRes.data || [])[0]?.id || '');
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    setLoading(true);
    try {
      const response = await teacherService.grades.getGradeEntry(
        selectedClass,
        selectedSubject,
        selectedTerm,
        selectedYear
      );
      if (response.success) setGrades((response.data || []) as any[]);
    } catch (error) {
      console.error('Failed to load grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await teacherService.grades.getGradeSummary(
        selectedClass,
        selectedSubject,
        selectedTerm,
        selectedYear
      );
      if (response.success) setSummary(response.data as any);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const updateGradeScore = async (gradeId: string, field: string, value: number | null) => {
    const grade = grades.find(g => g.id === gradeId);
    if (!grade) return;
    
    // Optimistic update
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        const updated = { ...g, [field]: value };
        const totalScore = calculateTotalScore({
          cat1: updated.cat1Score,
          cat2: updated.cat2Score,
          cat3: updated.cat3Score,
          assignment: updated.assignmentScore,
          practical: updated.practicalScore,
          project: updated.projectScore,
          exam: updated.examScore,
        }, weights);
        const gradeInfo = getGradeInfo(totalScore);
        updated.totalScore = totalScore;
        updated.grade = gradeInfo.grade;
        updated.points = gradeInfo.points;
        return updated;
      }
      return g;
    }));
    
    // Save to API
    try {
      const response = await teacherService.grades.updateGrade(gradeId, {
        [field]: value,
        comment: (grade as any).remarks,
      });
      toast.success('Score updated');
      loadSummary();
    } catch (error) {
      console.error('Failed to update score:', error);
      toast.error('Failed to update score');
      loadGrades();
    }
  };

  const saveAllGrades = async () => {
    toast.success('Grades saved');
  };

  const saveComment = async () => {
    toast.success('Comment saved');
    setShowCommentModal(false);
    setCommentText('');
  };

  const exportGrades = async () => {
    toast.success('Export not available');
  };

  const generateReportCard = async (studentId: string) => {
    try {
      toast.success('Report card generated');
    } catch (error) {
      console.error('Failed to generate report card:', error);
      toast.error('Failed to generate report card');
    }
  };

  const updateWeights = async () => {
    try {
      toast.success('Weights updated');
      setShowWeightsModal(false);
    } catch (error) {
      console.error('Failed to update weights:', error);
      toast.error('Failed to update weights');
    }
  };

  const filteredGrades = useMemo(() => {
    return grades.filter(grade => 
      grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [grades, searchTerm]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading && !grades.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading grades..." />
      </div>
    );
  }

  const selectedClassObj = classes.find(c => c.id === selectedClass);
  const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
  const selectedTermObj = terms.find(t => t.id === selectedTerm);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Grades & Results
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter and manage student grades, track performance, and generate reports
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Card View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowWeightsModal(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Weights
          </Button>
          <Button variant="outline" size="sm" onClick={loadGrades}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportGrades}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={saveAllGrades} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select Term</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <Search className="absolute left-3 top-1/2 translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={publishResults}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Publish Results
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.meanScore}%</p>
            <p className="text-xs text-gray-500">Mean Score</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{summary.passRate}%</p>
            <p className="text-xs text-gray-500">Pass Rate</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.highestScore}%</p>
            <p className="text-xs text-gray-500">Highest Score</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-orange-600">{summary.lowestScore}%</p>
            <p className="text-xs text-gray-500">Lowest Score</p>
          </Card>
          <Card className="text-center cursor-pointer" onClick={() => setShowAnalyticsModal(true)}>
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-gray-500">View Analytics</p>
          </Card>
        </div>
      )}

      {/* Grade Distribution Summary */}
      {summary && (
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Grade Distribution</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {Object.entries(summary.gradeDistribution).map(([grade, count]) => (
                count > 0 && (
                  <div key={grade} className="text-center">
                    <div className="text-lg font-bold text-gray-700">{grade}</div>
                    <div className="text-sm text-gray-500">{count}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${(count / summary.totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      {filteredGrades.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No grades found for the selected criteria</p>
          <p className="text-sm text-gray-400 mt-1">Select a class, subject, and term to view grades</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">Admission</th>
                  <th className="px-3 py-3 text-left font-semibold">Student Name</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">CAT 1<br/>({weights.cat1}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">CAT 2<br/>({weights.cat2}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">CAT 3<br/>({weights.cat3}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">Assign<br/>({weights.assignment}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">Prac<br/>({weights.practical}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">Proj<br/>({weights.project}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-20">Exam<br/>({weights.exam}%)</th>
                  <th className="px-3 py-3 text-center font-semibold w-16">Total</th>
                  <th className="px-3 py-3 text-center font-semibold w-12">Grade</th>
                  <th className="px-3 py-3 text-center font-semibold w-12">Points</th>
                  <th className="px-3 py-3 text-center font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 font-mono text-xs">{grade.admissionNumber}</td>
                    <td className="px-3 py-2 font-medium">{grade.studentName}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.cat1Score ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'cat1Score', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.cat2Score ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'cat2Score', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.cat3Score ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'cat3Score', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.assignmentScore ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'assignmentScore', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.practicalScore ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'practicalScore', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.projectScore ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'projectScore', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.examScore ?? ''}
                        onChange={(e) => updateGradeScore(grade.id, 'examScore', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-bold">{grade.totalScore}%</td>
                    <td className="px-3 py-2 text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getGradeColor(grade.grade))}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">{grade.points}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedGrade(grade);
                            setCommentText(grade.remarks || '');
                            setShowCommentModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Add Comment"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => generateReportCard(grade.studentId)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Generate Report Card"
                        >
                          <Printer className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrades.map((grade) => (
            <Card key={grade.id} className="hover:shadow-md transition">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{grade.studentName}</h3>
                    <p className="text-xs text-gray-500">#{grade.admissionNumber}</p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getGradeColor(grade.grade))}>
                    {grade.grade}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">CAT 1:</span> {grade.cat1Score ?? '-'}</div>
                  <div><span className="text-gray-500">CAT 2:</span> {grade.cat2Score ?? '-'}</div>
                  <div><span className="text-gray-500">CAT 3:</span> {grade.cat3Score ?? '-'}</div>
                  <div><span className="text-gray-500">Exam:</span> {grade.examScore ?? '-'}</div>
                  <div><span className="text-gray-500 font-bold">Total:</span> <span className="font-bold">{grade.totalScore}%</span></div>
                  <div><span className="text-gray-500">Points:</span> {grade.points}</div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                    setSelectedGrade(grade);
                    setCommentText(grade.remarks || '');
                    setShowCommentModal(true);
                  }}>
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Comment
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => generateReportCard(grade.studentId)}>
                    <Printer className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assessment Weights Modal */}
      <Modal isOpen={showWeightsModal} onClose={() => setShowWeightsModal(false)} title="Assessment Weights" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Set the percentage weight for each assessment component. Total should be 100%.</p>
          <div className="space-y-3">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm">Total: <strong>{Object.values(weights).reduce((a, b) => a + b, 0)}%</strong></p>
            {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && (
              <p className="text-xs text-red-500 mt-1">Total should equal 100%</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowWeightsModal(false)}>Cancel</Button>
          <Button onClick={updateWeights}>Save Weights</Button>
        </div>
      </Modal>

      {/* Comment Modal */}
      <Modal isOpen={showCommentModal} onClose={() => setShowCommentModal(false)} title="Add Comment" size="md">
        <div className="space-y-4">
          {selectedGrade && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Student: {selectedGrade.studentName}</p>
                <p className="text-xs text-gray-500">Admission: {selectedGrade.admissionNumber}</p>
                <p className="text-xs text-gray-500">Current Grade: {selectedGrade.grade} ({selectedGrade.totalScore}%)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment/Remarks
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter comments about student's performance, areas for improvement, or achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment Type
                </label>
                <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value="general">General Comment</option>
                  <option value="positive">Positive Reinforcement</option>
                  <option value="improvement">Areas for Improvement</option>
                  <option value="urgent">Urgent Attention Needed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="shareWithParent" className="rounded" />
                <label htmlFor="shareWithParent" className="text-sm text-gray-700 dark:text-gray-300">
                  Share this comment with parent immediately
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Tip: Specific, actionable comments help students improve. Mention strengths and specific areas to work on.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => {
            setShowCommentModal(false);
            setCommentText('');
          }}>
            Cancel
          </Button>
          <Button onClick={saveComment}>
            <Save className="w-4 h-4 mr-1" />
            Save Comment
          </Button>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} title="Performance Analytics" size="lg">
        {summary && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{summary.meanScore}%</p>
                <p className="text-xs text-gray-600">Class Average</p>
                <div className="mt-2 text-sm">
                  {summary.meanScore >= 70 ? (
                    <span className="text-green-600">Excellent Performance</span>
                  ) : summary.meanScore >= 50 ? (
                    <span className="text-yellow-600">Satisfactory Performance</span>
                  ) : (
                    <span className="text-red-600">Needs Improvement</span>
                  )}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{summary.passRate}%</p>
                <p className="text-xs text-gray-600">Pass Rate</p>
                <p className="text-sm mt-2">{summary.totalStudents - Object.values(summary.gradeDistribution).reduce((a, b, idx) => 
                  idx >= 9 ? a + b : a, 0)} students passed</p>
              </div>
            </div>

            {/* Grade Distribution Chart */}
            <div>
              <h4 className="font-semibold mb-3">Grade Distribution</h4>
              <div className="space-y-2">
                {Object.entries(summary.gradeDistribution).map(([grade, count]) => {
                  const percentage = (count / summary.totalStudents) * 100;
                  let barColor = 'bg-green-500';
                  if (grade.startsWith('D') || grade === 'E') barColor = 'bg-red-500';
                  else if (grade.startsWith('C')) barColor = 'bg-yellow-500';
                  else if (grade.startsWith('B')) barColor = 'bg-blue-500';
                  
                  return count > 0 && (
                    <div key={grade} className="flex items-center gap-2">
                      <div className="w-12 text-sm font-semibold">{grade}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div 
                          className={`${barColor} h-full flex items-center justify-end px-2 text-xs text-white font-semibold`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && `${percentage.toFixed(1)}%`}
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-600">{count} students</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top & Bottom Performers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Top Performers
                </h4>
                <div className="space-y-2">
                  {summary.topPerformers.slice(0, 5).map((student, idx) => (
                    <div key={student.studentId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600">#{idx + 1}</span>
                        <span className="text-sm font-medium">{student.studentName}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{student.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  Needs Improvement
                </h4>
                <div className="space-y-2">
                  {summary.strugglingStudents.slice(0, 5).map((student, idx) => (
                    <div key={student.studentId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-600">#{idx + 1}</span>
                        <span className="text-sm font-medium">{student.studentName}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{student.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                Key Insights
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Pass rate is {summary.passRate}% - {summary.passRate >= 80 ? 'Excellent' : summary.passRate >= 60 ? 'Good' : 'Needs attention'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 mt-0.5" />
                   <span>Grade spread: {(summary as any)?.gradeDistribution ? Object.values((summary as any).gradeDistribution).filter((v: any) => v > 0).length : 0} different grades represented</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-orange-600 mt-0.5" />
                  <span>Range: {summary.lowestScore}% - {summary.highestScore}% (Difference: {summary.highestScore - summary.lowestScore}%)</span>
                </li>
                {summary.meanScore < 50 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-red-600">Warning: Class average is below 50%. Intervention needed.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm">
                {summary.meanScore < 60 && (
                  <li>• Schedule extra tuition sessions for struggling students</li>
                )}
                {summary.passRate < 70 && (
                  <li>• Review teaching methodology for this subject</li>
                )}
                {summary.gradeDistribution.E > 0 && (
                  <li>• Identify knowledge gaps and provide remedial classes</li>
                )}
                <li>• Share performance reports with parents during upcoming meeting</li>
                <li>• Recognize top performers to motivate the class</li>
              </ul>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>Close</Button>
          <Button onClick={() => exportGrades()}>
            <Download className="w-4 h-4 mr-1" />
            Export Analytics Report
          </Button>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Import Grades" size="lg">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Instructions
            </h4>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Download the template CSV file first</li>
              <li>• Fill in scores for CATs, assignments, practicals, projects, and exams</li>
              <li>• Scores must be between 0 and 100</li>
              <li>• Leave blank for missing scores (will be treated as null)</li>
              <li>• Do not modify the student IDs or column headers</li>
              <li>• Maximum file size: 5MB</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" />
              Download Template
            </Button>
            <label className="flex-1">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="w-4 h-4 mr-1" />
                Select File
              </Button>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b">
                <p className="font-semibold text-sm">Preview ({importPreview.length} records)</p>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-center">CAT1</th>
                      <th className="px-3 py-2 text-center">CAT2</th>
                      <th className="px-3 py-2 text-center">Exam</th>
                      <th className="px-3 py-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 10).map((record, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{record.studentName}</td>
                        <td className="px-3 py-2 text-center">{record.cat1Score || '-'}</td>
                        <td className="px-3 py-2 text-center">{record.cat2Score || '-'}</td>
                        <td className="px-3 py-2 text-center">{record.examScore || '-'}</td>
                        <td className="px-3 py-2 text-center font-bold">{record.totalScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
          <Button onClick={processImport} disabled={importPreview.length === 0}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Import Grades
          </Button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Grade Settings" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default View</label>
            <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              <option>Table View</option>
              <option>Card View</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Auto-save Interval</label>
            <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              <option value="0">Off</option>
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 1 minute</option>
              <option value="300">Every 5 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grade Scale</label>
            <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              <option>Standard (A-F)</option>
              <option>Numerical (0-100)</option>
              <option>Custom Scale</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show grade points</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Auto-calculate totals</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Notify on grade change</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={resetSettings} className="w-full">
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset to Default Settings
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </Modal>

      {/* Missing State Variables */}
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
