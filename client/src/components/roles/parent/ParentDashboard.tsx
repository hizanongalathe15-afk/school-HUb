import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
  GraduationCap,
  Home,
  Info,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Star,
  User,
  Users,
  Wallet,
  AlertTriangle,
  ChartBar,
  FileText,
  FileBarChart,
  Receipt,
  CalendarRange,
  Award,
  Clock,
  Music,
  Trophy,
  Flame,
  Video,
  Calendar,
  Images,
  Heart,
  Heart as MedicalHeart,
  Bus,
  Navigation,
  Map,
  Search,
  Settings,
  Lock,
  Languages,
  Shield,
  HelpCircle,
  Mail,
  Terminal,
  Server,
  Activity,
  Medal,
  MapPin,
  CheckCircle,
  Archive,
} from 'lucide-react';
import RoleShell, { type RoleNavItem } from '../shared/RoleShell';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';
import type { ParentChild, ParentDashboard as ParentDashboardType } from '../../../types/parent';
import ParentLinkStudentForm from './ParentLinkStudentForm';
import { useTranslation } from 'react-i18next';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation('parent');
  const location = useLocation();
  const [dashboard, setDashboard] = useState<ParentDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await parentService.dashboard.getDashboard();
      if (response.success && response.data) {
        setDashboard(response.data);
        if (response.data.children.length > 0) {
          setSelectedChild(response.data.children[0]);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const parentNavItems: RoleNavItem[] = [
    { id: 'dashboard', label: t('parent.sidebar.dashboard'), icon: Home, path: '/dashboard/parent', category: t('parent.dashboard.title') },
    { id: 'children', label: t('parent.sidebar.myChildren'), icon: GraduationCap, path: '/dashboard/parent/children', category: 'Family' },
    { id: 'academic', label: t('parent.sidebar.resultsGrades'), icon: BookOpen, path: '/dashboard/parent/academic', category: 'Academic' },
    { id: 'examinations', label: t('parent.examinations.timetable'), icon: BookOpen, path: '/dashboard/parent/examinations', category: 'Academic' },
    { id: 'homework', label: t('parent.sidebar.homework'), icon: ClipboardList, path: '/dashboard/parent/homework', category: 'Academic' },
    { id: 'timetable', label: t('parent.sidebar.timetable'), icon: CalendarDays, path: '/dashboard/parent/timetable', category: 'Academic' },
    { id: 'attendance', label: t('parent.sidebar.attendance'), icon: CalendarDays, path: '/dashboard/parent/attendance', category: 'Family' },
    { id: 'discipline', label: t('parent.sidebar.discipline'), icon: AlertTriangle, path: '/dashboard/parent/discipline', category: 'Family' },
    { id: 'fees', label: 'Fees & Payments', icon: Wallet, path: '/dashboard/parent/fees', category: 'Finance' },
    { id: 'messages', label: t('parent.sidebar.messages'), icon: MessageSquare, path: '/dashboard/parent/messages', category: 'Communication' },
    { id: 'announcements', label: t('parent.sidebar.announcements') || 'Announcements', icon: Megaphone, path: '/dashboard/parent/announcements', category: 'Communication' },
    { id: 'meetings', label: t('parent.sidebar.meetings'), icon: Users, path: '/dashboard/parent/meetings', category: 'Communication' },
    { id: 'events', label: t('parent.sidebar.events'), icon: CalendarDays, path: '/dashboard/parent/events', category: 'School' },
    { id: 'notifications', label: t('parent.sidebar.notifications'), icon: Bell, path: '/dashboard/parent/notifications', category: 'Account' },
    { id: 'complaints', label: t('parent.sidebar.complaints'), icon: AlertTriangle, path: '/dashboard/parent/complaints', category: 'Account' },
    { id: 'profile', label: t('parent.sidebar.dashboard').replace('Dashboard', 'My Profile') || 'My Profile', icon: User, path: '/dashboard/parent/profile', category: 'Account' },
    { id: 'downloads', label: t('parent.downloads.title'), icon: Download, path: '/dashboard/parent/downloads', category: 'Account' },
    { id: 'school-info', label: 'School Info', icon: Info, path: '/dashboard/parent/school-info', category: 'School' },
  ];

  if (loading) {
    return <RoleShell roleName="Parent" title={t('parent.dashboard.title')} navItems={parentNavItems} loading> </RoleShell>;
  }

  const isDashboardHome = location.pathname === '/dashboard/parent';

  return (
    <RoleShell
      roleName="Parent"
      title={t('parent.dashboard.title')}
      subtitle={t('parent.dashboard.welcome', { name: user?.firstName ? `${user.firstName}'s` : 'your' })}
      navItems={parentNavItems}
      actions={(
        <button className="btn btn-secondary" onClick={loadDashboard}>
          <RefreshCw size={16} />
          {t('parent.dashboard.refresh')}
        </button>
      )}
    >
    {isDashboardHome ? (
    <div className="parent-dashboard role-dashboard-surface">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>{t('parent.dashboard.welcome', { name: user?.firstName || 'Parent' })}</h1>
          <p>
            {dashboard && dashboard.children.length > 0
              ? t('parent.dashboard.welcomeWithChild')
              : t('parent.dashboard.welcomeNoChild')}
          </p>
        </div>
        {dashboard && dashboard.children.length > 0 && (
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard/parent/fees'}>
              <CreditCard size={16} />
              {t('parent.dashboard.payFees')}
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/dashboard/parent/meetings'}>
              <CalendarDays size={16} />
              {t('parent.dashboard.bookMeeting')}
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/dashboard/parent/messages'}>
              <MessageSquare size={16} />
              {t('parent.dashboard.messages')}
            </button>
          </div>
        )}
      </div>

      {dashboard && dashboard.children.length === 0 && (
        <ParentLinkStudentForm onLinked={loadDashboard} />
      )}

      {/* Children Selector */}
      {dashboard && dashboard.children.length > 0 && (
        <div className="children-selector">
          <h2>{t('parent.common.selectChild')}</h2>
          <div className="children-tabs">
            {dashboard.children.map((child) => (
              <button
                key={child.id}
                className={`child-tab ${selectedChild?.id === child.id ? 'active' : ''}`}
                onClick={() => setSelectedChild(child)}
              >
                <div className="child-avatar">
                  {child.photo ? (
                    <img src={child.photo} alt={child.firstName} />
                  ) : (
                    <span>{child.firstName[0]}{child.lastName[0]}</span>
                  )}
                </div>
                <div className="child-info">
                  <span className="child-name">{child.firstName} {child.lastName}</span>
                  <span className="child-class">{child.className}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {dashboard && (
        <div className="quick-stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><GraduationCap size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{dashboard.quickStats.totalChildren}</span>
              <span className="stat-label">{t('parent.children.totalChildren')}</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><Wallet size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">KES {dashboard.quickStats.totalFeesPending.toLocaleString()}</span>
              <span className="stat-label">{t('parent.fees.currentBalance')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><MessageSquare size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{dashboard.quickStats.unreadMessages}</span>
              <span className="stat-label">{t('parent.common.unread') || 'Unread Messages'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CalendarDays size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{dashboard.quickStats.upcomingEventsCount}</span>
              <span className="stat-label">{t('parent.events.upcoming')}</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{dashboard.quickStats.attendanceAlertsCount}</span>
              <span className="stat-label">{t('parent.attendance.title')} {t('parent.common.alert') || 'Alerts'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><ClipboardList size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{dashboard.quickStats.pendingHomeworkCount}</span>
              <span className="stat-label">{t('parent.homework.title')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Attendance Alerts */}
        {dashboard && dashboard.attendanceAlerts.length > 0 && (
          <div className="dashboard-card attendance-alerts">
            <div className="card-header">
              <h3>{t('parent.attendance.title')} {t('parent.common.alert') || 'Alerts'}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/attendance'}>
                {t('parent.common.viewAll')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.attendanceAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="alert-item">
                  <div className="alert-icon"><AlertTriangle size={18} /></div>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-date">{new Date(alert.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {dashboard && dashboard.upcomingEvents.length > 0 && (
          <div className="dashboard-card upcoming-events">
            <div className="card-header">
              <h3>{t('parent.events.upcomingEvents')}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/events'}>
                {t('parent.common.viewAll')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-date">
                    <span className="day">{new Date(event.date).getDate()}</span>
                    <span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="event-content">
                    <span className="event-title">{event.title}</span>
                    <span className="event-time">{event.startTime} - {event.endTime}</span>
                  </div>
                  {event.rsvpRequired && (
                    <button className="btn btn-sm" onClick={() => window.location.href = `/parent/events/${event.id}`}>
                      RSVP
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Homework */}
        {dashboard && dashboard.pendingHomework.length > 0 && (
          <div className="dashboard-card pending-homework">
            <div className="card-header">
              <h3>{t('parent.homework.title')}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/homework'}>
                {t('parent.common.viewAll')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.pendingHomework.slice(0, 3).map((homework) => (
                <div key={homework.id} className="homework-item">
                  <div className="homework-subject">{homework.subjectName}</div>
                  <div className="homework-title">{homework.title}</div>
                  <div className="homework-due">Due: {new Date(homework.dueDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Announcements */}
        {dashboard && dashboard.recentAnnouncements.length > 0 && (
          <div className="dashboard-card announcements">
            <div className="card-header">
              <h3>{t('parent.announcements.title')}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/announcements'}>
                {t('parent.common.viewAll')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.recentAnnouncements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className={`announcement-item priority-${announcement.priority}`}>
                  <div className="announcement-title">{announcement.title}</div>
                  <div className="announcement-date">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fee Reminders */}
        {dashboard && dashboard.pendingFees.length > 0 && (
          <div className="dashboard-card fee-reminders">
            <div className="card-header">
              <h3>{t('parent.fees.title')}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/fees'}>
                {t('parent.fees.payNow' || 'Pay Now')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.pendingFees.slice(0, 3).map((fee) => (
                <div key={fee.studentId} className="fee-item">
                  <div className="fee-student">{fee.studentName}</div>
                  <div className="fee-details">
                    <span className="fee-balance">Balance: KES {fee.balance.toLocaleString()}</span>
                    {fee.isOverdue && <span className="fee-overdue">Overdue!</span>}
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => window.location.href = `/parent/fees/pay/${fee.studentId}`}>
                    Pay
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        {dashboard && dashboard.upcomingMeetings.length > 0 && (
          <div className="dashboard-card upcoming-meetings">
            <div className="card-header">
              <h3>{t('parent.sidebar.meetings')}</h3>
              <button className="btn-link" onClick={() => window.location.href = '/dashboard/parent/meetings'}>
                {t('parent.common.viewAll')}
              </button>
            </div>
            <div className="card-content">
              {dashboard.upcomingMeetings.slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="meeting-item">
                  <div className="meeting-date">
                    {new Date(meeting.date).toLocaleDateString()}
                  </div>
                  <div className="meeting-details">
                    <span className="meeting-teacher">With: {meeting.teacherName}</span>
                    <span className="meeting-time">{meeting.startTime}</span>
                  </div>
                  {meeting.type === 'video' && (
                    <button className="btn btn-sm">Join</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    ) : (
      <Outlet />
    )}
    </RoleShell>
  );
};

export default ParentDashboard;
