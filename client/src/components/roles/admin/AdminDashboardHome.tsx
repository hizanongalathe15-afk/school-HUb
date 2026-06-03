import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  GraduationCap,
  Info,
  Landmark,
  Megaphone,
  Package,
  Shield,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
} from 'lucide-react';
import { adminDashboardService } from '../../../services/adminService';
import CounterCard from '../../ui/CounterCard';
import type { AdminDashboardMetrics, ActivityLog, SystemAlert } from '../../../types/admin';

export default function AdminDashboardHome() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsData, logsData, alertsData] = await Promise.all([
          adminDashboardService.getMetrics(),
          adminDashboardService.getActivityLogs(20),
          adminDashboardService.getAlerts(),
        ]);
        setMetrics(metricsData);
        setActivityLogs(Array.isArray(logsData) ? logsData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setActivityLogs([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const overviewStats = [
    {
      label: 'Total Students',
      value: metrics?.totalStudents?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Total Teachers',
      value: metrics?.totalTeachers?.toLocaleString() || '0',
      change: '+5.2%',
      trend: 'up',
      icon: GraduationCap,
      tone: 'purple',
    },
    {
      label: 'Library Books',
      value: metrics?.libraryBooks?.toLocaleString() || '0',
      change: '+2.1%',
      trend: 'up',
      icon: BookOpen,
      tone: 'emerald',
    },
    {
      label: 'Fee Collection',
      value: `${metrics?.feeCollectionRate || 0}%`,
      change: '+18.3%',
      trend: 'up',
      icon: CreditCard,
      tone: 'amber',
    },
    {
      label: 'Attendance Rate',
      value: `${metrics?.attendanceRate || 0}%`,
      change: '-1.2%',
      trend: 'down',
      icon: UserCheck,
      tone: 'cyan',
    },
    {
      label: 'Discipline Cases',
      value: `${metrics?.activeDisciplineCases || 0}`,
      change: '+0.8%',
      trend: 'up',
      icon: Shield,
      tone: 'rose',
    },
  ];

  const upcomingEvents = [
    { title: 'Parent-Teacher Meeting', date: 'May 28, 2026', time: '2:00 PM', attendees: 45 },
    { title: 'Sports Day Competition', date: 'May 30, 2026', time: '9:00 AM', attendees: 320 },
    { title: 'Science Fair', date: 'June 2, 2026', time: '10:00 AM', attendees: 156 },
    { title: 'Annual Day Celebration', date: 'June 15, 2026', time: '5:00 PM', attendees: 500 },
  ];

  const topPerformers = [
    { name: 'Emma Wilson', grade: 'Grade 12', score: '98.5%', avatar: 'EW' },
    { name: 'Liam Johnson', grade: 'Grade 11', score: '97.8%', avatar: 'LJ' },
    { name: 'Olivia Brown', grade: 'Grade 10', score: '96.9%', avatar: 'OB' },
    { name: 'Noah Davis', grade: 'Grade 12', score: '96.2%', avatar: 'ND' },
    { name: 'Ava Martinez', grade: 'Grade 11', score: '95.7%', avatar: 'AM' },
  ];

  return (
    <div className="admin-dashboard-home admin-overview">
      {/* Welcome Section */}
      <div className="welcome-section admin-hero-panel">
        <div>
          <span className="admin-page-kicker">Dashboard Overview</span>
          <h2>Welcome back, Administrator</h2>
          <p>Here's what's happening with your school today.</p>
        </div>
        <div className="admin-hero-metric">
          <Activity size={18} />
          <span>{metrics?.systemHealth?.status || 'healthy'}</span>
        </div>
      </div>

      {/* API-backed Quick Counters */}
      <div className="stats-grid quick-counters" style={{ marginTop: 16 }}>
        <CounterCard label="Learners enrolled" value={metrics?.totalStudents ?? 0} />
        <CounterCard label="Roles configured" value={metrics?.rolesReady ?? 0} />
        <CounterCard label={metrics?.systemHealth?.uptime && metrics.systemHealth.uptime >= 99 ? 'Always available' : 'Portal uptime'} value={metrics && metrics.systemHealth ? (metrics.systemHealth.uptime >= 99 ? '24/7' : `${metrics.systemHealth.uptime}%`) : '—'} />
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid admin-stat-showcase">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={stat.label} className={`stat-card-large stat-card-large--${stat.tone}`}>
              <div className="stat-card-topline">
                <div>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                </div>
                <span className="stat-icon"><Icon size={27} /></span>
              </div>
              <div className={`stat-trend ${stat.trend === 'up' ? 'positive' : 'negative'}`}>
                <TrendIcon size={16} />
                <span>{stat.change}</span>
                <small>vs last month</small>
              </div>
              {(stat.label === 'Attendance Rate' || stat.label === 'Fee Collection') && (
                <div className="stat-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: stat.label === 'Attendance Rate' ? `${metrics?.attendanceRate || 0}%` : `${metrics?.feeCollectionRate || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div className="system-health-section">
        <h3>System Health</h3>
        <div className="health-cards">
          <div className="health-card">
            <span className={`health-indicator ${metrics?.systemHealth?.database?.status}`}></span>
            <span className="health-name">Database</span>
            <span className="health-response">{metrics?.systemHealth?.database?.responseTime || 0}ms</span>
          </div>
          <div className="health-card">
            <span className={`health-indicator ${metrics?.systemHealth?.email?.status}`}></span>
            <span className="health-name">Email Service</span>
            <span className="health-response">{metrics?.systemHealth?.email?.responseTime || 0}ms</span>
          </div>
          <div className="health-card">
            <span className={`health-indicator ${metrics?.systemHealth?.sms?.status}`}></span>
            <span className="health-name">SMS Gateway</span>
            <span className="health-response">{metrics?.systemHealth?.sms?.responseTime || 0}ms</span>
          </div>
          <div className="health-card">
            <span className={`health-indicator ${metrics?.systemHealth?.mpesa?.status}`}></span>
            <span className="health-name">MPESA</span>
            <span className="health-response">{metrics?.systemHealth?.mpesa?.responseTime || 0}ms</span>
          </div>
          <div className="health-card">
            <span className="health-label">Uptime</span>
            <span className="health-value">{metrics?.systemHealth?.uptime || 0}%</span>
          </div>
          <div className="health-card">
            <span className="health-label">Last Backup</span>
            <span className="health-value">{metrics?.systemHealth?.lastBackup || 'Never'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="dashboard-grid-2 admin-overview-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><Activity size={19} /> Recent Activity</h3>
            <a href="/admin/activity-logs" className="view-all">View All</a>
          </div>
          <div className="activity-list">
            {Array.isArray(activityLogs) && activityLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="activity-item">
                <div className="activity-avatar">
                  {log.userName.charAt(0).toUpperCase()}
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{log.userName}</strong> {log.action}
                    {log.resource && <span> - {log.resource}</span>}
                  </p>
                  <span className="activity-time"><Clock size={13} /> {new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!Array.isArray(activityLogs) || activityLogs.length === 0) && (
              <div className="empty-state">No recent activity</div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><AlertTriangle size={19} /> System Alerts</h3>
            <span className="alert-badge">{Array.isArray(alerts) ? alerts.length : 0}</span>
          </div>
          <div className="alerts-list">
            {Array.isArray(alerts) && alerts.slice(0, 8).map((alert) => (
              <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                <span className="alert-icon">
                  {alert.type === 'critical' && <AlertTriangle size={18} />}
                  {alert.type === 'error' && <XCircle size={18} />}
                  {alert.type === 'warning' && <AlertTriangle size={18} />}
                  {alert.type === 'info' && <Info size={18} />}
                </span>
                <div className="alert-content">
                  <span className="alert-title">{alert.title}</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
                <span className="alert-time">{new Date(alert.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {(!Array.isArray(alerts) || alerts.length === 0) && (
              <div className="empty-state">
                <span className="success-icon"><CheckCircle2 size={22} /></span>
                <p>All systems normal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2 admin-overview-grid">
        <div className="dashboard-card top-performers-card">
          <div className="card-header">
            <h3><Award size={19} /> Top Performers</h3>
          </div>
          <div className="performer-list">
            {topPerformers.map((student, index) => (
              <div key={student.name} className="performer-item">
                <div className="performer-avatar">
                  <span>{student.avatar}</span>
                  {index === 0 && <Award size={14} />}
                </div>
                <div>
                  <strong>{student.name}</strong>
                  <small>{student.grade}</small>
                </div>
                <b>{student.score}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><UserX size={19} /> Staff Watch</h3>
            <span className="alert-badge muted">0 on leave</span>
          </div>
          <div className="system-health-mini">
            <div><span>Teachers present</span><strong>{metrics?.totalTeachers || 0}</strong></div>
            <div><span>Pending fees</span><strong>KES {metrics?.pendingFees?.toLocaleString() || 0}</strong></div>
            <div><span>Inventory items</span><strong>{metrics?.inventoryItems || 0}</strong></div>
          </div>
        </div>
      </div>

      <div className="dashboard-card upcoming-events-card">
        <div className="card-header">
          <h3><Calendar size={19} /> Upcoming Events</h3>
        </div>
        <div className="events-grid">
          {upcomingEvents.map((event) => (
            <div key={event.title} className="event-card">
              <h3>{event.title}</h3>
              <span><CalendarDays size={15} /> {event.date}</span>
              <span><Clock size={15} /> {event.time}</span>
              <span><Users size={15} /> {event.attendees} attendees</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <a href="/admin/users/new" className="action-card">
            <span className="action-icon"><UserPlus size={22} /></span>
            <span className="action-label">Add User</span>
          </a>
          <a href="/admin/academic/timetable" className="action-card">
            <span className="action-icon"><CalendarDays size={22} /></span>
            <span className="action-label">Edit Timetable</span>
          </a>
          <a href="/admin/finance/transactions" className="action-card">
            <span className="action-icon"><Landmark size={22} /></span>
            <span className="action-label">Record Payment</span>
          </a>
          <a href="/admin/communication/send" className="action-card">
            <span className="action-icon"><Megaphone size={22} /></span>
            <span className="action-label">Send Announcement</span>
          </a>
          <a href="/admin/reports" className="action-card">
            <span className="action-icon"><BarChart3 size={22} /></span>
            <span className="action-label">Generate Report</span>
          </a>
          <a href="/admin/settings/backup" className="action-card">
            <span className="action-icon"><Database size={22} /></span>
            <span className="action-label">Create Backup</span>
          </a>
          <a href="/admin/academic/results" className="action-card">
            <span className="action-icon"><ClipboardList size={22} /></span>
            <span className="action-label">Enter Results</span>
          </a>
          <a href="/admin/inventory" className="action-card">
            <span className="action-icon"><Package size={22} /></span>
            <span className="action-label">Manage Inventory</span>
          </a>
        </div>
      </div>
    </div>
  );
}
