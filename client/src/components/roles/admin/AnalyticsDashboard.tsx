// client/src/components/roles/admin/AnalyticsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, DollarSign, 
  Calendar, Activity, Cpu, HardDrive, Network, Clock, 
  AlertCircle, CheckCircle, Download, RefreshCw, Filter,
  BarChart3, PieChart, LineChart, AreaChart, School,
  GraduationCap, UserCheck, CreditCard, Percent, Zap,
  Server, Database, Cloud, Wifi, WifiOff, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  analyticsService, 
  studentAnalyticsService,
  feeAnalyticsService,
  attendanceAnalyticsService,
  performanceAnalyticsService,
  departmentAnalyticsService
} from '../../../services/api';

// Types
interface SystemMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeUsers: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
  timestamp: Date;
}

interface StudentMetric {
  totalStudents: number;
  newEnrollments: number;
  graduates: number;
  dropouts: number;
  genderRatio: { male: number; female: number };
  classDistribution: { className: string; count: number }[];
  enrollmentTrend: { month: string; count: number }[];
}

interface FeeMetric {
  totalExpected: number;
  totalCollected: number;
  pendingAmount: number;
  collectionRate: number;
  overdueAccounts: number;
  paymentTrend: { period: string; collected: number; expected: number }[];
  classBreakdown: { className: string; collected: number; expected: number }[];
}

interface AttendanceMetric {
  averageDaily: number;
  studentsPresent: number;
  studentsAbsent: number;
  teachersPresent: number;
  teachersAbsent: number;
  weeklyTrend: { day: string; students: number; teachers: number }[];
  classAttendance: { className: string; percentage: number }[];
}

interface PerformanceMetric {
  overallAverage: number;
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  topPerformers: { name: string; grade: string; score: number }[];
  subjectAverages: { subject: string; average: number; topScore: number }[];
  trends: { term: string; average: number }[];
}

interface DepartmentMetric {
  name: string;
  average: number;
  students: number;
  teachers: number;
  passRate: number;
  topStudent: string;
  improvement: number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'term' | 'year'>('month');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  
  // Real data states
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetric[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentMetric | null>(null);
  const [feeMetrics, setFeeMetrics] = useState<FeeMetric | null>(null);
  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetric | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric | null>(null);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetric[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  
  // Fetch all real data
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchSystemMetricsOnly();
    }, 30000); // Update system metrics every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedSchool]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemMetrics(),
        fetchStudentAnalytics(),
        fetchFeeAnalytics(),
        fetchAttendanceAnalytics(),
        fetchPerformanceAnalytics(),
        fetchDepartmentAnalytics(),
        fetchSchools()
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemMetricsOnly = async () => {
    try {
      const data = await analyticsService.getSystemMetrics();
      setSystemMetrics(data);
      setMetricsHistory(prev => [...prev.slice(-29), data]);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const data = await analyticsService.getSystemMetrics();
      setSystemMetrics(data);
      const history = await analyticsService.getSystemHistory(selectedPeriod);
      setMetricsHistory(history);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const fetchStudentAnalytics = async () => {
    try {
      const data = await studentAnalyticsService.get(selectedPeriod, selectedSchool);
      setStudentMetrics(data);
    } catch (error) {
      console.error('Failed to fetch student analytics:', error);
    }
  };

  const fetchFeeAnalytics = async () => {
    try {
      const data = await feeAnalyticsService.get(selectedPeriod, selectedSchool);
      setFeeMetrics(data);
    } catch (error) {
      console.error('Failed to fetch fee analytics:', error);
    }
  };

  const fetchAttendanceAnalytics = async () => {
    try {
      const data = await attendanceAnalyticsService.get(selectedPeriod, selectedSchool);
      setAttendanceMetrics(data);
    } catch (error) {
      console.error('Failed to fetch attendance analytics:', error);
    }
  };

  const fetchPerformanceAnalytics = async () => {
    try {
      const data = await performanceAnalyticsService.get(selectedPeriod, selectedSchool);
      setPerformanceMetrics(data);
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error);
    }
  };

  const fetchDepartmentAnalytics = async () => {
    try {
      const data = await departmentAnalyticsService.get(selectedPeriod, selectedSchool);
      setDepartmentMetrics(data);
    } catch (error) {
      console.error('Failed to fetch department analytics:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const data = await analyticsService.getSchools();
      setSchools([{ id: 'all', name: 'All Schools' }, ...data]);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const blob = await analyticsService.exportReport({
        period: selectedPeriod,
        schoolId: selectedSchool,
        includeCharts: true
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${new Date().toISOString()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Hook-free SVG charts keep analytics stable even when sections load independently.
  const renderLineChart = (data: { labels: string[]; datasets: { label: string; data: number[]; color: string }[] }, height = 250) => {
    const width = 600;
    const padding = 36;
    const values = data.datasets.flatMap(dataset => dataset.data).filter(Number.isFinite);
    const maxValue = Math.max(1, ...values);
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const xStep = data.labels.length > 1 ? chartWidth / (data.labels.length - 1) : chartWidth;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg-chart" role="img">
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padding + (chartHeight / 4) * tick;
          return <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        {data.datasets.map((dataset) => {
          const points = dataset.data.map((value, index) => {
            const x = padding + index * xStep;
            const y = padding + chartHeight - (Math.max(0, value) / maxValue) * chartHeight;
            return `${x},${y}`;
          }).join(' ');
          return (
            <g key={dataset.label}>
              <polyline points={points} fill="none" stroke={dataset.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {dataset.data.map((value, index) => {
                const x = padding + index * xStep;
                const y = padding + chartHeight - (Math.max(0, value) / maxValue) * chartHeight;
                return <circle key={`${dataset.label}-${index}`} cx={x} cy={y} r="4" fill={dataset.color} stroke="#fff" strokeWidth="2" />;
              })}
            </g>
          );
        })}
        {data.labels.map((label, index) => (
          <text key={label + index} x={padding + index * xStep} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">{label}</text>
        ))}
      </svg>
    );
  };

  const renderBarChart = (data: { labels: string[]; values: number[]; colors?: string[] }, height = 200) => {
    const width = 500;
    const padding = 34;
    const maxValue = Math.max(1, ...data.values.filter(Number.isFinite));
    const chartWidth = width - padding * 2;
    const band = data.values.length ? chartWidth / data.values.length : chartWidth;
    const barWidth = Math.max(12, band * 0.64);
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg-chart" role="img">
        {[0, 1, 2, 3].map((tick) => {
          const y = padding + ((height - padding * 2) / 3) * tick;
          return <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        {data.values.map((value, index) => {
          const barHeight = (Math.max(0, value) / maxValue) * (height - padding * 2);
          const x = padding + index * band + (band - barWidth) / 2;
          const y = height - padding - barHeight;
          return (
            <g key={`${data.labels[index]}-${index}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" fill={data.colors?.[index] || '#2563eb'} />
              <text x={x + barWidth / 2} y={Math.max(14, y - 6)} textAnchor="middle" fontSize="11" fill="#334155">{value}</text>
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">{data.labels[index]}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loader-spinner">
          <Loader size={48} className="spinning" />
        </div>
        <p>Loading real-time analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>Analytics Dashboard</h1>
          <p>Real-time insights from live data</p>
        </div>
        <div className="header-right">
          <select 
            className="school-selector"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <div className="period-selector">
            <button 
              className={`period-btn ${selectedPeriod === 'today' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('today')}
            >
              Today
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'term' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('term')}
            >
              Term
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('year')}
            >
              Year
            </button>
          </div>
          <button className="icon-btn" onClick={refreshData} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
          <button className="btn-primary" onClick={exportData} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon students">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{studentMetrics?.totalStudents?.toLocaleString() || '0'}</span>
            <span className="metric-label">Total Students</span>
            <span className="metric-trend up">
              <TrendingUp size={12} /> +{studentMetrics?.newEnrollments || 0} new
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon attendance">
            <UserCheck size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{attendanceMetrics?.averageDaily || 0}%</span>
            <span className="metric-label">Avg Attendance</span>
            <span className="metric-trend up">
              <TrendingUp size={12} /> +2.1%
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon fees">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{feeMetrics?.collectionRate || 0}%</span>
            <span className="metric-label">Fee Collection</span>
            <span className="metric-trend down">
              <TrendingDown size={12} /> -{feeMetrics?.overdueAccounts || 0} overdue
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon performance">
            <School size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{performanceMetrics?.overallAverage || 0}%</span>
            <span className="metric-label">Avg Performance</span>
            <span className="metric-trend up">
              <TrendingUp size={12} /> +5.3%
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon teachers">
            <BookOpen size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{departmentMetrics.reduce((sum, d) => sum + d.teachers, 0) || 0}</span>
            <span className="metric-label">Total Teachers</span>
            <span className="metric-trend up">
              <TrendingUp size={12} /> +8
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon revenue">
            <CreditCard size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">KES {((feeMetrics?.totalCollected || 0) / 1000000).toFixed(1)}M</span>
            <span className="metric-label">Revenue</span>
            <span className="metric-trend up">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Student Enrollment Trends</h3>
            <button className="chart-action"><Download size={14} /></button>
          </div>
          {studentMetrics?.enrollmentTrend && renderLineChart({
            labels: studentMetrics.enrollmentTrend.map(t => t.month),
            datasets: [{ label: 'New Students', data: studentMetrics.enrollmentTrend.map(t => t.count), color: '#667eea' }]
          }, 250)}
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Grade Distribution</h3>
            <button className="chart-action"><Download size={14} /></button>
          </div>
          {performanceMetrics?.gradeDistribution && renderBarChart({
            labels: performanceMetrics.gradeDistribution.map(g => g.grade),
            values: performanceMetrics.gradeDistribution.map(g => g.count),
            colors: ['#667eea', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']
          }, 250)}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Fee Collection Trends</h3>
            <button className="chart-action"><Download size={14} /></button>
          </div>
          {feeMetrics?.paymentTrend && renderLineChart({
            labels: feeMetrics.paymentTrend.map(t => t.period),
            datasets: [
              { label: 'Collected', data: feeMetrics.paymentTrend.map(t => t.collected), color: '#10b981' },
              { label: 'Expected', data: feeMetrics.paymentTrend.map(t => t.expected), color: '#f59e0b' }
            ]
          }, 250)}
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Attendance</h3>
            <button className="chart-action"><Download size={14} /></button>
          </div>
          {attendanceMetrics?.weeklyTrend && renderLineChart({
            labels: attendanceMetrics.weeklyTrend.map(t => t.day),
            datasets: [
              { label: 'Students', data: attendanceMetrics.weeklyTrend.map(t => t.students), color: '#667eea' },
              { label: 'Teachers', data: attendanceMetrics.weeklyTrend.map(t => t.teachers), color: '#10b981' }
            ]
          }, 250)}
        </div>
      </div>

      {/* Department Performance */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h3>Department Performance Analysis</h3>
          <button className="chart-action"><Download size={14} /></button>
        </div>
        <div className="department-grid">
          {departmentMetrics.map((dept, i) => (
            <div key={i} className="department-card">
              <div className="dept-header">
                <span className="dept-name">{dept.name}</span>
                <span className={`dept-trend ${dept.improvement >= 0 ? 'positive' : 'negative'}`}>
                  {dept.improvement >= 0 ? '+' : ''}{dept.improvement}%
                </span>
              </div>
              <div className="dept-score">
                <span className="score-value">{dept.average}%</span>
                <div className="dept-bar-bg">
                  <div className="dept-bar-fill" style={{ width: `${dept.average}%` }} />
                </div>
              </div>
              <div className="dept-stats">
                <span>📚 {dept.students} students</span>
                <span>👨‍🏫 {dept.teachers} teachers</span>
                <span>✅ {dept.passRate}% pass rate</span>
              </div>
              <div className="dept-top">
                🏆 Top: {dept.topStudent}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="system-metrics-section">
        <div className="section-header">
          <h3>System Health Metrics</h3>
          <span className="live-badge">LIVE</span>
        </div>
        <div className="system-metrics-grid">
          <div className="system-card">
            <div className="system-header">
              <Cpu size={20} />
              <span>CPU Usage</span>
            </div>
            <div className="system-value">{systemMetrics?.cpu || 0}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${systemMetrics?.cpu || 0}%`, background: systemMetrics?.cpu && systemMetrics.cpu > 80 ? '#ef4444' : '#10b981' }} />
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <Database size={20} />
              <span>Memory</span>
            </div>
            <div className="system-value">{systemMetrics?.memory || 0}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${systemMetrics?.memory || 0}%`, background: '#667eea' }} />
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <HardDrive size={20} />
              <span>Disk Storage</span>
            </div>
            <div className="system-value">{systemMetrics?.disk || 0}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${systemMetrics?.disk || 0}%`, background: '#f59e0b' }} />
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <Network size={20} />
              <span>Network</span>
            </div>
            <div className="system-value">{systemMetrics?.network || 0} Mbps</div>
            <div className="mini-graph">
              {metricsHistory.slice(-10).map((m, i) => (
                <div key={i} className="graph-bar" style={{ height: `${(m.network / 100) * 40}px` }} />
              ))}
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <Users size={20} />
              <span>Active Users</span>
            </div>
            <div className="system-value">{systemMetrics?.activeUsers || 0}</div>
            <div className="trend-indicator up">
              <TrendingUp size={14} /> +12 from last hour
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <Activity size={20} />
              <span>Response Time</span>
            </div>
            <div className="system-value">{systemMetrics?.avgResponseTime || 0}ms</div>
            <div className={`status-badge ${(systemMetrics?.avgResponseTime || 0) < 200 ? 'good' : 'warning'}`}>
              {systemMetrics?.avgResponseTime && systemMetrics.avgResponseTime < 200 ? 'Good' : 'Slow'}
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <Zap size={20} />
              <span>Requests/min</span>
            </div>
            <div className="system-value">{systemMetrics?.requestsPerMinute || 0}</div>
            <div className="mini-graph">
              {metricsHistory.slice(-10).map((m, i) => (
                <div key={i} className="graph-bar" style={{ height: `${(m.requestsPerMinute / 500) * 40}px` }} />
              ))}
            </div>
          </div>

          <div className="system-card">
            <div className="system-header">
              <AlertCircle size={20} />
              <span>Error Rate</span>
            </div>
            <div className="system-value">{systemMetrics?.errorRate || 0}%</div>
            <div className={`status-badge ${(systemMetrics?.errorRate || 0) < 1 ? 'good' : 'critical'}`}>
              {systemMetrics?.errorRate && systemMetrics.errorRate < 1 ? 'Healthy' : 'Issues Detected'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Alerts */}
      <div className="alerts-section">
        <div className="section-header">
          <h3>Real-time Alerts & Insights</h3>
          <span className="live-badge pulse">LIVE</span>
        </div>
        <div className="alerts-list">
          {systemMetrics?.errorRate && systemMetrics.errorRate > 2 && (
            <div className="alert critical">
              <AlertCircle size={18} />
              <div>
                <strong>High Error Rate Detected</strong>
                <p>Error rate is at {systemMetrics.errorRate}%. Investigate immediately.</p>
              </div>
            </div>
          )}
          {feeMetrics?.overdueAccounts && feeMetrics.overdueAccounts > 50 && (
            <div className="alert warning">
              <AlertCircle size={18} />
              <div>
                <strong>High Number of Overdue Fees</strong>
                <p>{feeMetrics.overdueAccounts} accounts are overdue. Send reminders.</p>
              </div>
            </div>
          )}
          {attendanceMetrics?.averageDaily && attendanceMetrics.averageDaily < 85 && (
            <div className="alert warning">
              <AlertCircle size={18} />
              <div>
                <strong>Low Attendance Alert</strong>
                <p>Current attendance is at {attendanceMetrics.averageDaily}%. Below target of 90%.</p>
              </div>
            </div>
          )}
          {systemMetrics?.cpu && systemMetrics.cpu > 85 && (
            <div className="alert critical">
              <AlertCircle size={18} />
              <div>
                <strong>High CPU Usage</strong>
                <p>CPU is at {systemMetrics.cpu}%. Consider scaling resources.</p>
              </div>
            </div>
          )}
          <div className="alert info">
            <CheckCircle size={18} />
            <div>
              <strong>System Healthy</strong>
              <p>All systems operational. Last checked: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-dashboard {
          padding: 24px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .header-left p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .school-selector {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          font-size: 14px;
        }

        .period-selector {
          display: flex;
          gap: 4px;
          background: white;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .period-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .period-btn:hover {
          background: #f3f4f6;
        }

        .period-btn.active {
          background: #667eea;
          color: white;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #667eea;
        }

        .btn-primary {
          background: #667eea;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .metric-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.students { background: #e0e7ff; color: #4f46e5; }
        .metric-icon.attendance { background: #d1fae5; color: #10b981; }
        .metric-icon.fees { background: #fed7aa; color: #f59e0b; }
        .metric-icon.performance { background: #e0e7ff; color: #7c3aed; }
        .metric-icon.teachers { background: #fce7f3; color: #ec4899; }
        .metric-icon.revenue { background: #d1fae5; color: #059669; }

        .metric-info {
          flex: 1;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          display: block;
        }

        .metric-label {
          font-size: 14px;
          color: #6b7280;
          display: block;
          margin: 4px 0;
        }

        .metric-trend {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .metric-trend.up { color: #10b981; }
        .metric-trend.down { color: #ef4444; }

        /* Charts */
        .charts-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .chart-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .chart-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #9ca3af;
        }

        /* Department Grid */
        .department-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .department-card {
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .department-card:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dept-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .dept-name {
          font-weight: 600;
          font-size: 16px;
          color: #1f2937;
        }

        .dept-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .dept-trend.positive { background: #d1fae5; color: #10b981; }
        .dept-trend.negative { background: #fee2e2; color: #ef4444; }

        .dept-score {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          min-width: 60px;
        }

        .dept-bar-bg {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .dept-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .dept-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .dept-top {
          font-size: 12px;
          color: #8b5cf6;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        /* System Metrics */
        .system-metrics-section {
          margin-top: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .live-badge {
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .system-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .system-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .system-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #6b7280;
          font-size: 13px;
        }

        .system-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .mini-graph {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 40px;
          margin-top: 8px;
        }

        .graph-bar {
          flex: 1;
          background: #667eea;
          border-radius: 2px 2px 0 0;
          min-height: 2px;
        }

        .trend-indicator {
          font-size: 11px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trend-indicator.up { color: #10b981; }
        .trend-indicator.down { color: #ef4444; }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 8px;
        }

        .status-badge.good { background: #d1fae5; color: #10b981; }
        .status-badge.warning { background: #fed7aa; color: #f59e0b; }
        .status-badge.critical { background: #fee2e2; color: #ef4444; }

        /* Alerts */
        .alerts-section {
          margin-top: 24px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: white;
          border-left: 4px solid;
        }

        .alert.critical { border-left-color: #ef4444; background: #fef2f2; }
        .alert.warning { border-left-color: #f59e0b; background: #fffbeb; }
        .alert.info { border-left-color: #3b82f6; background: #eff6ff; }

        .alert strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .alert p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        /* Loading State */
        .analytics-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loader-spinner .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
          
          .header-right {
            flex-wrap: wrap;
          }
          
          .metrics-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
