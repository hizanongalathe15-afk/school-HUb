import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Award, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Printer,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';
import parentService from '../../../services/parentService';
import type { 
  ParentChild, 
  SubjectPerformance, 
  AcademicReport,
  TermSummary 
} from '../../../types/parent';
import { useTranslation } from 'react-i18next';

const ParentAcademic: React.FC = () => {
  const { t } = useTranslation('parent');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [reports, setReports] = useState<AcademicReport[]>([]);
  const [termSummary, setTermSummary] = useState<TermSummary | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [error, setError] = useState<string | null>(null);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const loadChildren = useCallback(async () => {
    try {
      const res = await parentService.children.getMyChildren();
      if (res?.success && res.data) {
        setChildren(res.data);
        if (res.data[0] && !selectedChildId) {
          setSelectedChildId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      setError('Failed to load children data');
    }
  }, [selectedChildId]);

  const loadAcademicData = useCallback(async (childId: string, showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const [subjectsRes, reportsRes, summaryRes] = await Promise.all([
        parentService.academic.getSubjectPerformance(childId),
        parentService.academic.getReports(childId),
        parentService.academic.getTermSummary(childId)
      ]);

      if (subjectsRes?.success && subjectsRes.data) {
        setSubjectPerformance(subjectsRes.data);
      } else {
        setSubjectPerformance([]);
      }

      if (reportsRes?.success && reportsRes.data) {
        setReports(reportsRes.data);
      } else {
        setReports([]);
      }

      if (summaryRes?.success && summaryRes.data) {
        setTermSummary(summaryRes.data);
      } else {
        setTermSummary(null);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
      setError('Failed to load academic data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadAcademicData(selectedChildId);
    }
  }, [selectedChildId, loadAcademicData]);

  const handleRefresh = useCallback(() => {
    if (selectedChildId) {
      loadAcademicData(selectedChildId, true);
    }
  }, [selectedChildId, loadAcademicData]);

  const handleChildChange = useCallback((childId: string) => {
    setSelectedChildId(childId);
    setExpandedSubject(null);
  }, []);

  const handleDownloadReport = useCallback(async (reportId: string) => {
    try {
      // Use downloadsAPI for report downloads
      const res = await parentService.downloads.downloadReport(reportId);
      if (res) {
        // Create download link from blob
        const url = window.URL.createObjectURL(res);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${reportId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('Failed to download report');
    }
  }, []);

  const handleViewReport = useCallback(async (reportId: string) => {
    try {
      // For viewing, we'll open the report card preview with childId and termId
      if (selectedChildId) {
        // Try to get report preview using academic API with childId
        const res = await parentService.academic.getReportCard(selectedChildId, reportId);
        if (res?.data) {
          // Open report card in new tab
          const url = `/parent/reports/preview/${reportId}`;
          window.open(url, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to view report:', err);
      setError('Failed to load report preview');
    }
  }, [selectedChildId]);

  const getGradeColor = useCallback((grade: string) => {
    const gradeMap: Record<string, string> = {
      'A+': 'text-purple-600 dark:text-purple-400',
      'A': 'text-green-600 dark:text-green-400',
      'A-': 'text-green-600 dark:text-green-400',
      'B+': 'text-blue-600 dark:text-blue-400',
      'B': 'text-blue-600 dark:text-blue-400',
      'B-': 'text-yellow-600 dark:text-yellow-400',
      'C+': 'text-yellow-600 dark:text-yellow-400',
      'C': 'text-orange-600 dark:text-orange-400',
      'C-': 'text-orange-600 dark:text-orange-400',
      'D': 'text-red-600 dark:text-red-400',
      'E': 'text-red-600 dark:text-red-400'
    };
    return gradeMap[grade] || 'text-gray-600 dark:text-gray-400';
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  }, []);

  const getTrendText = useCallback((trend: string) => {
    const trendMap: Record<string, string> = {
      'improving': 'Improving',
      'stable': 'Stable',
      'declining': 'Declining',
      'needs_review': 'Needs Review'
    };
    return trendMap[trend] || trend;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, string> = {
      ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    
    const labels: Record<string, string> = {
      ready: 'Ready',
      updated: 'Updated',
      pending: 'Pending',
      in_progress: 'In Progress'
    };
    
    return (
      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', variants[status] || variants.pending)}>
        {labels[status] || status}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading academic data..." />
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Children Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please link a child to view academic progress.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Academic Progress
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track subject performance, report updates, and learning trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            Chart View
          </Button>
        </div>
      </div>

      {/* Child Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => handleChildChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.className}
                </option>
              ))}
            </select>
          </div>
          {termSummary && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{termSummary.term} • {termSummary.academicYear}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Cards - Real Data */}
      {termSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {termSummary.averageScore}%
                </p>
                {termSummary.scoreChange && (
                  <p className={clsx(
                    'text-xs mt-1',
                    termSummary.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {termSummary.scoreChange >= 0 ? '+' : ''}{termSummary.scoreChange}% from last term
                  </p>
                )}
              </div>
              <BookOpen className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Grade</p>
                <p className={clsx('text-2xl font-bold', getGradeColor(termSummary.grade))}>
                  {termSummary.grade}
                </p>
                <p className="text-xs text-gray-500 mt-1">Grade Point: {termSummary.gradePoint}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Class Position</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {termSummary.classPosition}/{termSummary.totalStudents}
                </p>
                <p className="text-xs text-gray-500 mt-1">Top {Math.round((termSummary.classPosition / termSummary.totalStudents) * 100)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {termSummary.attendance}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{termSummary.presentDays} / {termSummary.totalDays} days</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Subject Performance - Real Data */}
      <Card 
        title="Subject Performance"
        className="overflow-hidden"
      >
        {subjectPerformance.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No subject performance data available
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Class Avg</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subjectPerformance.map((subject) => (
                  <React.Fragment key={subject.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {subject.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{subject.score}%</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 rounded-full h-1.5"
                              style={{ width: `${subject.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('font-bold', getGradeColor(subject.grade))}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {subject.classAverage || '-'}%
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {subject.position ? `${subject.position}/${subject.totalStudents}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(subject.trend)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getTrendText(subject.trend)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedSubject === subject.id && subject.teacherComments && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-sm">
                            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher's Comments:</p>
                            <p className="text-gray-600 dark:text-gray-400">{subject.teacherComments}</p>
                            {subject.improvementAreas && subject.improvementAreas.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Areas for Improvement:</p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                                  {subject.improvementAreas.map((area, idx) => (
                                    <li key={idx}>{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{subject.name}</span>
                  <div className="flex items-center gap-4">
                    <span className={clsx('font-bold', getGradeColor(subject.grade))}>
                      {subject.grade} ({subject.score}%)
                    </span>
                    {getTrendIcon(subject.trend)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 rounded-full h-2 transition-all"
                    style={{ width: `${subject.score}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>Class Average: {subject.classAverage || '-'}%</span>
                  <span>Position: {subject.position ? `${subject.position}/${subject.totalStudents}` : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reports - Real Data */}
      <Card title="Academic Reports">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No reports available
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{report.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.date)}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewReport(report.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownloadReport(report.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ParentAcademic;