import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Printer,
  Share2,
  Award,
  TrendingUp,
  TrendingDown,
  User,
  BookOpen,
  ChevronRight,
  RefreshCw,
  Eye,
  BarChart3,
  Trophy,
  Star,
  AlertTriangle,
  GraduationCap,
  Minus,
  Shirt
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Modal } from '../../ui/Modal';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface ExamTimetable {
  id: string;
  subject: string;
  subjectCode: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  room: string;
  building: string;
  invigilator: string;
  instructions?: string;
}

interface ExamResult {
  id: string;
  subject: string;
  subjectCode: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  classAverage: number;
  classPosition?: number;
  classTotal?: number;
  streamPosition?: number;
  streamTotal?: number;
  teacherComments: string;
  strengths?: string[];
  improvements?: string[];
  isImproved?: boolean;
  previousScore?: number;
}

interface ExamRules {
  reportingTime: string;
  latePolicy: string;
  allowedMaterials: string[];
  prohibitedItems: string[];
  duration: number;
  dressCode?: string;
  specialInstructions?: string[];
}

interface OverallSummary {
  totalScore: number;
  totalMaxScore: number;
  overallPercentage: number;
  overallGrade: string;
  classRank: number;
  classTotal: number;
  streamRank: number;
  streamTotal: number;
  bestSubject: string;
  bestScore: number;
  weakestSubject: string;
  weakestScore: number;
}

const ParentExaminations: React.FC = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'timetable' | 'rules' | 'results'>('timetable');
  
  const [examTimetable, setExamTimetable] = useState<ExamTimetable[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [examRules, setExamRules] = useState<ExamRules | null>(null);
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const selectedChild = useMemo(() => 
    children.find(c => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const loadChildren = useCallback(async () => {
    try {
      const response = await parentService.getMyChildren();
      setChildren(response);
      if (response.length > 0 && !selectedChildId) {
        setSelectedChildId(response[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      toast.error('Failed to load children data');
    }
  }, [selectedChildId]);

  const loadExamData = useCallback(async (showRefresh = false) => {
    if (!selectedChildId) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (activeTab === 'timetable') {
        const data = await parentService.getExamTimetable(selectedChildId);
        setExamTimetable(data);
      } else if (activeTab === 'results') {
        const [resultsData, summaryData] = await Promise.all([
          parentService.getExamResults(selectedChildId),
          parentService.getExamOverallSummary(selectedChildId)
        ]);
        setExamResults(resultsData);
        setOverallSummary(summaryData);
      } else if (activeTab === 'rules') {
        const rulesData = await parentService.getExamRules();
        setExamRules(rulesData);
      }
    } catch (err) {
      setError(`Failed to load ${activeTab} data`);
      console.error(err);
      toast.error(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChildId, activeTab]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadExamData();
    }
  }, [selectedChildId, activeTab, loadExamData]);

  const handleRefresh = () => {
    loadExamData(true);
  };

  const handleDownloadTimetable = async () => {
    try {
      const blob = await parentService.downloadExamTimetable(selectedChildId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-timetable-${selectedChildId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Timetable downloaded successfully');
    } catch (err) {
      console.error('Failed to download timetable:', err);
      toast.error('Failed to download timetable');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Exam Timetable',
        text: `Exam schedule for ${selectedChild?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'A': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'A-': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'B+': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'B': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'B-': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'C+': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'C': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'C-': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'D': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'E': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const getPerformanceIcon = (score: number, classAverage: number) => {
    if (score > classAverage + 10) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score < classAverage - 10) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-yellow-600" />;
  };

  const groupByDate = (timetable: ExamTimetable[]) => {
    const grouped: Record<string, ExamTimetable[]> = {};
    timetable.forEach(exam => {
      const date = exam.date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(exam);
    });
    return grouped;
  };

  const groupedTimetable = useMemo(() => groupByDate(examTimetable), [examTimetable]);

  if (children.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Children Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please link a child to view examination information.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Examinations
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View exam schedules, rules, and performance results
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'timetable' && examTimetable.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadTimetable}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <Card>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.class} ({child.admissionNumber})
                </option>
              ))}
            </select>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'timetable', label: 'Exam Timetable', icon: <Calendar className="w-4 h-4" /> },
            { id: 'rules', label: 'Rules & Guidelines', icon: <AlertCircle className="w-4 h-4" /> },
            { id: 'results', label: 'Results', icon: <Award className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button size="sm" onClick={() => setError(null)} className="ml-auto">
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Exam Timetable Tab */}
        {activeTab === 'timetable' && !loading && (
          <div className="space-y-4">
            {examTimetable.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No exam schedule available</p>
              </Card>
            ) : (
              Object.entries(groupedTimetable).map(([date, exams]) => (
                <div key={date} className="space-y-3">
                  <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  {exams.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                              {exam.subjectCode}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {exam.subject}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {exam.startTime} - {exam.endTime} ({exam.duration} min)
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {exam.room}, {exam.building}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Invigilator:</span> {exam.invigilator}
                          </div>
                          {exam.instructions && (
                            <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {exam.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules & Guidelines Tab */}
        {activeTab === 'rules' && !loading && (
          <Card>
            {examRules ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Reporting Time
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{examRules.reportingTime}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Exam Duration
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{examRules.duration} minutes</p>
                  </div>
                </div>

                {examRules.dressCode && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-blue-500" />
                      Dress Code
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{examRules.dressCode}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Allowed Materials
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {examRules.allowedMaterials.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Prohibited Items
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {examRules.prohibitedItems.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {examRules.specialInstructions && examRules.specialInstructions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Special Instructions</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {examRules.specialInstructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {examRules.latePolicy}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No exam rules available
              </div>
            )}
          </Card>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && !loading && (
          <div className="space-y-6">
            {/* Overall Summary Card */}
            {overallSummary && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall Percentage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overallSummary.overallPercentage.toFixed(1)}%
                    </p>
                    <span className={clsx('inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1', getGradeColor(overallSummary.overallGrade))}>
                      Grade: {overallSummary.overallGrade}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Class Rank</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overallSummary.classRank}/{overallSummary.classTotal}
                    </p>
                    <p className="text-xs text-gray-500">
                      Top {Math.round((overallSummary.classRank / overallSummary.classTotal) * 100)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best Subject</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {overallSummary.bestSubject}
                    </p>
                    <p className="text-sm text-green-600">{overallSummary.bestScore}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Area for Improvement</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {overallSummary.weakestSubject}
                    </p>
                    <p className="text-sm text-red-600">{overallSummary.weakestScore}%</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Subject Results Table */}
            {examResults.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No exam results available</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Subject</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Score</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Grade</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Class Avg</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Performance</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {examResults.map((result) => (
                        <tr 
                          key={result.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowResultModal(true);
                          }}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{result.subject}</p>
                              <p className="text-xs text-gray-500">{result.subjectCode}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {result.score}/{result.maxScore}
                              </span>
                              <span className="text-sm text-gray-500">({result.percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-blue-600 rounded-full h-1.5"
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx('inline-block px-2 py-1 rounded-full text-xs font-semibold', getGradeColor(result.grade))}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {result.classAverage.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {getPerformanceIcon(result.percentage, result.classAverage)}
                              <span className="text-sm">
                                {result.percentage > result.classAverage ? '+' : ''}
                                {(result.percentage - result.classAverage).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Result Details Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Subject Performance Details"
      >
        {selectedResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedResult.subject}
                </h3>
                <p className="text-sm text-gray-500">{selectedResult.subjectCode}</p>
              </div>
              <span className={clsx('px-3 py-1 rounded-full text-sm font-semibold', getGradeColor(selectedResult.grade))}>
                {selectedResult.grade}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedResult.score}/{selectedResult.maxScore}
                </p>
                <p className="text-sm text-gray-500">Score</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedResult.percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Percentage</p>
              </div>
            </div>

            {selectedResult.classPosition && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-center">
                  <span className="font-medium">Class Position:</span> {selectedResult.classPosition}/{selectedResult.classTotal}
                  {selectedResult.streamPosition && ` • Stream Position: ${selectedResult.streamPosition}/${selectedResult.streamTotal}`}
                </p>
              </div>
            )}

            {selectedResult.isImproved && selectedResult.previousScore && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Improved by {(selectedResult.percentage - selectedResult.previousScore).toFixed(1)}% from last exam
                </p>
              </div>
            )}

            {selectedResult.strengths && selectedResult.strengths.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Strengths</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedResult.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.improvements && selectedResult.improvements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Areas for Improvement</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedResult.improvements.map((improvement, idx) => (
                    <li key={idx}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.teacherComments && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-1">Teacher's Comments</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedResult.teacherComments}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentExaminations;