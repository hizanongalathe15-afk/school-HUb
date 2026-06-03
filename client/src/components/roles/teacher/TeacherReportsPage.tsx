import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3, PieChart, TrendingUp, TrendingDown, Download, Printer,
  FileText, Calendar, Filter, Search, RefreshCw, Eye, ChevronDown,
  ChevronUp, Users, BookOpen, Award, Target, AlertCircle, CheckCircle,
  Clock, Mail, Share2, Copy, Save, Settings, Zap, Activity,
  LineChart, AreaChart as AreaChartIcon, ScatterChart, Table, Grid, List,
  Maximize2, Minimize2, ExternalLink, Upload, Plus, Trash2
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
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  Treemap
} from 'recharts';
import { downloadFromServiceData } from '../../../utils/fileDownload';

interface ReportData {
  id: string;
  title: string;
  type: 'academic' | 'attendance' | 'discipline' | 'performance' | 'comparative';
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    term?: string;
    academicYear?: string;
  };
  filters: AnalyticsReportFilters;
  summary: AnalyticsReportSummary;
  charts: ReportChart[];
  tables: ReportTable[];
  insights: ReportInsight[];
}

interface AnalyticsReportFilters {
  classIds: string[];
  subjectIds: string[];
  studentIds: string[];
  includeComparative: boolean;
  includeTrends: boolean;
  includeDetailed: boolean;
}

interface AnalyticsReportSummary {
  totalStudents: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  attendanceRate: number;
  disciplineIncidents: number;
  topPerformers: TopPerformer[];
  strugglingStudents: StrugglingStudent[];
  gradeDistribution: Record<string, number>;
  subjectPerformance: SubjectPerformance[];
}

interface TopPerformer {
  studentId: string;
  studentName: string;
  score: number;
  rank: number;
  subjects: { subjectId: string; subjectName: string; score: number }[];
}

interface StrugglingStudent {
  studentId: string;
  studentName: string;
  score: number;
  attendanceRate: number;
  missingAssignments: number;
  recommendedAction: string;
}

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  gradeDistribution: Record<string, number>;
}

interface ReportChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'composed';
  data: any[];
  config: ChartConfig;
}

interface ChartConfig {
  xAxis: string;
  yAxis: string;
  series: string[];
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  stacked: boolean;
}

interface ReportTable {
  id: string;
  title: string;
  columns: string[];
  rows: any[];
  sortable: boolean;
  filterable: boolean;
  exportable: boolean;
}

interface ReportInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  action?: string;
  metric: string;
  value: number;
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
}

interface SavedReport {
  id: string;
  name: string;
  description: string;
  type: string;
  filters: AnalyticsReportFilters;
  createdAt: string;
  lastRun: string;
  schedule?: ReportSchedule;
}

interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

const TeacherReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'generated' | 'saved' | 'scheduled'>('generated');
  
  const [filters, setFilters] = useState<AnalyticsReportFilters>({
    classIds: [],
    subjectIds: [],
    studentIds: [],
    includeComparative: true,
    includeTrends: true,
    includeDetailed: false,
  });
  
  const [scheduleData, setScheduleData] = useState<ReportSchedule>({
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: [],
    format: 'pdf',
  });
  
  const [classes, setClasses] = useState<Array<{ id: string; name: string; stream: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; admissionNumber: string }>>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);

  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes, termsRes, reportsRes, savedRes] = await Promise.all([
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
        teacherService.academic.getTerms(),
        teacherService.reports.getGeneratedReports(),
        teacherService.reports.getSavedReports(),
      ]);
      
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (termsRes.success) setTerms(termsRes.data || []);
      if (reportsRes.success) setReports(reportsRes.data || []);
      if (savedRes.success) setSavedReports(savedRes.data || []);
      
      // Set default filters
      if (classesRes.data?.length) {
        setFilters(prev => ({ ...prev, classIds: [classesRes.data[0].id] }));
      }
      if (termsRes.data?.length) setSelectedTerm(termsRes.data[0].id);
      
      // Load students for selected class
      if (classesRes.data?.length) {
        loadStudents(classesRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      const response = await teacherService.students.getStudentsByClass(classId);
      if (response.success) setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await teacherService.reports.generateReport({
        type: 'academic',
        filters,
        period: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          term: selectedTerm,
          academicYear: selectedYear,
        },
      });
      
      if (response.success) {
        setSelectedReport(response.data);
        setReports(prev => [response.data, ...prev]);
        toast.success('Report generated successfully');
        setShowGenerateModal(false);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await teacherService.reports.exportReport(reportId, format);
      downloadFromServiceData(
        response.data,
        `report_${reportId}_${new Date().toISOString().split('T')[0]}.${format}`
      );
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export report');
    }
  };

  const saveReport = async () => {
    if (!selectedReport) return;
    
    const name = prompt('Enter a name for this report:', selectedReport.title);
    if (!name) return;
    
    try {
      const response = await teacherService.reports.saveReport({
        reportId: selectedReport.id,
        name,
        filters: selectedReport.filters,
      });
      
      if (response.success) {
        toast.success('Report saved');
        loadInitialData();
      }
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report');
    }
  };

  const scheduleReport = async (savedReportId: string) => {
    try {
      const response = await teacherService.reports.scheduleReport(savedReportId, scheduleData);
      if (response.success) {
        toast.success('Report scheduled successfully');
        setShowScheduleModal(false);
      }
    } catch (error) {
      console.error('Failed to schedule report:', error);
      toast.error('Failed to schedule report');
    }
  };

  const deleteReport = async (reportId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Report?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.reports.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Report deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete report');
    }
  };

  const sendReportByEmail = async (reportId: string, email: string) => {
    try {
      await teacherService.reports.emailReport(reportId, email);
      toast.success(`Report sent to ${email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading && !reports.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and analyze performance reports, track trends, and gain insights
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowGenerateModal(true)}>
            <BarChart3 className="w-4 h-4 mr-1" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('generated')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'generated'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Generated Reports
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'saved'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Saved Reports
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'scheduled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Scheduled Reports
        </button>
      </div>

      {/* Generated Reports */}
      {activeTab === 'generated' && (
        reports.length === 0 ? (
          <Card className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No reports generated yet</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowGenerateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Generate Your First Report
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Generated: {formatDate(report.generatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => exportReport(report.id, 'pdf')}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Export PDF"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => saveReport(report)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Save"
                      >
                        <Save className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-xl font-bold text-blue-600">{report.summary.averageScore}%</p>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-xl font-bold text-green-600">{report.summary.passRate}%</p>
                      <p className="text-xs text-gray-500">Pass Rate</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-xl font-bold text-purple-600">{report.summary.totalStudents}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                  </div>

                  {/* Key Insights */}
                  {report.insights.slice(0, 2).map((insight) => (
                    <div key={insight.id} className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <span className="text-sm font-medium">{insight.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Generated</th>
                    <th className="px-4 py-3 text-center">Avg Score</th>
                    <th className="px-4 py-3 text-center">Pass Rate</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium">{report.title}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(report.generatedAt)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{report.summary.averageScore}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">{report.summary.passRate}%</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedReport(report)} className="text-blue-500 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => exportReport(report.id, 'pdf')} className="text-gray-500 hover:text-gray-700">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteReport(report.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Saved Reports */}
      {activeTab === 'saved' && savedReports.length === 0 && (
        <Card className="text-center py-12">
          <Save className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No saved reports</p>
          <p className="text-sm text-gray-400">Generate and save reports to access them later</p>
        </Card>
      )}

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report Details" size="xl">
        {selectedReport && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-bold">{selectedReport.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generated: {formatDate(selectedReport.generatedAt)}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{selectedReport.summary.totalStudents}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{selectedReport.summary.averageScore}%</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Target className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{selectedReport.summary.passRate}%</p>
                <p className="text-xs text-gray-500">Pass Rate</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{selectedReport.summary.highestScore}%</p>
                <p className="text-xs text-gray-500">Highest Score</p>
              </div>
            </div>

            {/* Grade Distribution Chart */}
            <div>
              <h4 className="font-semibold mb-3">Grade Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={Object.entries(selectedReport.summary.gradeDistribution).map(([grade, count]) => ({ grade, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8">
                    {Object.entries(selectedReport.summary.gradeDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Performance */}
            {selectedReport.summary.subjectPerformance.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Subject Performance</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={selectedReport.summary.subjectPerformance.map(s => ({
                    name: s.subjectName,
                    score: s.averageScore,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Performers */}
            {selectedReport.summary.topPerformers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Top Performers
                </h4>
                <div className="space-y-2">
                  {selectedReport.summary.topPerformers.map((student) => (
                    <div key={student.studentId} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{student.studentName}</p>
                          <p className="text-sm text-gray-600">Rank #{student.rank}</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{student.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {selectedReport.insights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Key Insights</h4>
                <div className="space-y-3">
                  {selectedReport.insights.map((insight) => (
                    <div key={insight.id} className={`p-3 rounded-lg border-l-4 ${
                      insight.type === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      insight.type === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <p className="font-semibold">{insight.title}</p>
                          <p className="text-sm mt-1">{insight.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Current: <strong>{insight.value}</strong></span>
                            <span>Benchmark: <strong>{insight.benchmark}</strong></span>
                            <span>Trend: {insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➡️'}</span>
                          </div>
                          {insight.action && (
                            <button className="mt-2 text-sm text-blue-600 hover:underline">
                              {insight.action}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={() => exportReport(selectedReport.id, 'pdf')}>
                <Download className="w-4 h-4 mr-1" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport(selectedReport.id, 'excel')}>
                <FileText className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => saveReport()}>
                <Save className="w-4 h-4 mr-1" />
                Save Report
              </Button>
              <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
                <Calendar className="w-4 h-4 mr-1" />
                Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Report Modal */}
      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Report" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Classes</label>
              <select
                multiple
                value={filters.classIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({ ...filters, classIds: values });
                  if (values.length === 1) loadStudents(values[0]);
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                size={3}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subjects</label>
              <select
                multiple
                value={filters.subjectIds}
                onChange={(e) => setFilters({ ...filters, subjectIds: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                size={3}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Terms</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Academic Year</label>
              <input
                type="text"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="e.g., 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeComparative}
                onChange={(e) => setFilters({ ...filters, includeComparative: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Include comparative analysis with previous period</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeTrends}
                onChange={(e) => setFilters({ ...filters, includeTrends: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Include trend analysis and projections</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeDetailed}
                onChange={(e) => setFilters({ ...filters, includeDetailed: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Include detailed per-student breakdown</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={generateReport} disabled={generating}>
              {generating ? <Spinner size="sm" /> : <BarChart3 className="w-4 h-4 mr-1" />}
              Generate Report
            </Button>
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

export default TeacherReportsPage;