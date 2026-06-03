// client/src/components/roles/teacher/TeacherSidebar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { authService } from '../../../services/api';
import UserAvatar from '../../ui/UserAvatar';
import { clsx } from 'clsx';
import './teacher.css';
import {
  LayoutDashboard, BookOpen, Users, Calendar, Clock, CheckSquare,
  ClipboardList, FileText, MessageSquare, Megaphone, UserCheck,
  Star, Wrench, Trophy, Briefcase, BarChart3, Bell, Settings,
  HelpCircle, LogOut, GraduationCap, Home, AlertCircle, CalendarDays,
  FileSpreadsheet, Printer, Download, Mail, Phone, Video,
  MapPin, DoorOpen, Award, Flag, Target, TrendingUp, PieChart,
  Activity, UserPlus, Eye, Edit, Trash2, Plus, Search, Filter,
  RefreshCw, ChevronDown, ChevronUp, MoreVertical, Copy, Share2,
  Library
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

// Missing icons
const Lock = ({ size, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Tool = ({ size, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const Package = ({ size, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M12 22V12" />
  </svg>
);

const navItems: NavItem[] = [
  // SECTION 1: DASHBOARD
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/teacher/dashboard' },
  
  // SECTION 2: MY CLASSES
  { id: 'classes', label: 'My Classes', icon: <BookOpen size={20} />, path: '/teacher/classes' },
  { id: 'class-roster', label: 'Class Roster', icon: <Users size={20} />, path: '/teacher/classes/roster' },
  { id: 'class-representatives', label: 'Class Representatives', icon: <Award size={20} />, path: '/teacher/classes/representatives' },
  
  // SECTION 3: MY STUDENTS
  { id: 'students', label: 'All Students', icon: <GraduationCap size={20} />, path: '/teacher/students' },
  { id: 'student-directory', label: 'Student Directory', icon: <Search size={20} />, path: '/teacher/students/directory' },
  { id: 'student-profiles', label: 'Student Profiles', icon: <UserCheck size={20} />, path: '/teacher/students/profiles' },
  { id: 'at-risk-students', label: 'At-Risk Students', icon: <AlertCircle size={20} />, path: '/teacher/students/at-risk', badge: 3 },
  { id: 'academic-history', label: 'Academic History', icon: <FileText size={20} />, path: '/teacher/students/academic-history' },
  
  // SECTION 4: ATTENDANCE
  { id: 'attendance', label: 'Attendance', icon: <CalendarDays size={20} />, path: '/teacher/attendance' },
  { id: 'mark-attendance', label: 'Mark Attendance', icon: <CheckSquare size={20} />, path: '/teacher/attendance/mark' },
  { id: 'attendance-reports', label: 'Attendance Reports', icon: <BarChart3 size={20} />, path: '/teacher/attendance/reports' },
  { id: 'absentee-alerts', label: 'Absentee Alerts', icon: <Bell size={20} />, path: '/teacher/attendance/alerts', badge: 5 },
  
  // SECTION 5: RESULTS & GRADES
  { id: 'grades', label: 'Grades & Results', icon: <CheckSquare size={20} />, path: '/teacher/grades' },
  { id: 'enter-cat1', label: 'Enter CAT 1 Scores', icon: <FileText size={20} />, path: '/teacher/grades/cat1' },
  { id: 'enter-cat2', label: 'Enter CAT 2 Scores', icon: <FileText size={20} />, path: '/teacher/grades/cat2' },
  { id: 'enter-exam', label: 'Enter Exam Scores', icon: <FileText size={20} />, path: '/teacher/grades/exam' },
  { id: 'class-results', label: 'Class Result Sheet', icon: <FileSpreadsheet size={20} />, path: '/teacher/grades/results' },
  { id: 'report-cards', label: 'Report Cards', icon: <Printer size={20} />, path: '/teacher/grades/report-cards' },
  { id: 'grade-analysis', label: 'Grade Analysis', icon: <PieChart size={20} />, path: '/teacher/grades/analysis' },
  { id: 'performance-trends', label: 'Performance Trends', icon: <TrendingUp size={20} />, path: '/teacher/grades/trends' },
  
  // SECTION 6: HOMEWORK MANAGEMENT
  { id: 'homework', label: 'Homework', icon: <ClipboardList size={20} />, path: '/teacher/homework' },
  { id: 'assign-homework', label: 'Assign Homework', icon: <Plus size={20} />, path: '/teacher/homework/assign' },
  { id: 'submissions', label: 'View Submissions', icon: <Eye size={20} />, path: '/teacher/homework/submissions' },
  { id: 'grade-homework', label: 'Grade Homework', icon: <Star size={20} />, path: '/teacher/homework/grade' },
  { id: 'pending-homework', label: 'Pending Tasks', icon: <Clock size={20} />, path: '/teacher/homework/pending', badge: 8 },
  
  // SECTION 7: TIMETABLE
  { id: 'timetable', label: 'Timetable', icon: <Calendar size={20} />, path: '/teacher/timetable' },
  { id: 'my-timetable', label: 'My Timetable', icon: <Clock size={20} />, path: '/teacher/timetable/my' },
  { id: 'class-timetable', label: 'Class Timetable', icon: <BookOpen size={20} />, path: '/teacher/timetable/class' },
  { id: 'exam-schedule', label: 'Exam Schedule', icon: <CalendarDays size={20} />, path: '/teacher/timetable/exams' },
  { id: 'request-swap', label: 'Request Class Swap', icon: <RefreshCw size={20} />, path: '/teacher/timetable/swap' },
  
  // SECTION 8: DISCIPLINE MANAGEMENT
  { id: 'discipline', label: 'Discipline', icon: <Star size={20} />, path: '/teacher/discipline' },
  { id: 'give-merits', label: 'Give Merits', icon: <Award size={20} />, path: '/teacher/discipline/merits' },
  { id: 'give-demerits', label: 'Give Demerits', icon: <Flag size={20} />, path: '/teacher/discipline/demerits' },
  { id: 'discipline-records', label: 'Discipline Records', icon: <FileText size={20} />, path: '/teacher/discipline/records' },
  { id: 'merit-leaderboard', label: 'Merit Leaderboard', icon: <Trophy size={20} />, path: '/teacher/discipline/leaderboard' },
  { id: 'refer-student', label: 'Refer Student', icon: <Target size={20} />, path: '/teacher/discipline/refer' },
  
  // SECTION 9: PARENT COMMUNICATION
  { id: 'parents', label: 'Parent Communication', icon: <Megaphone size={20} />, path: '/teacher/parents' },
  { id: 'chat-parents', label: 'Chat with Parents', icon: <MessageSquare size={20} />, path: '/teacher/parents/chat' },
  { id: 'bulk-message', label: 'Bulk Message', icon: <Mail size={20} />, path: '/teacher/parents/bulk' },
  { id: 'parent-meetings', label: 'Parent Meetings', icon: <Users size={20} />, path: '/teacher/parents/meetings' },
  { id: 'video-meeting', label: 'Video Meeting', icon: <Video size={20} />, path: '/teacher/parents/video' },
  
  // SECTION 10: LESSON PLANNING
  { id: 'lessons', label: 'Lesson Plans', icon: <FileText size={20} />, path: '/teacher/lessons' },
  { id: 'create-lesson', label: 'Create Lesson Plan', icon: <Plus size={20} />, path: '/teacher/lessons/create' },
  { id: 'weekly-plan', label: 'Weekly Plan', icon: <Calendar size={20} />, path: '/teacher/lessons/weekly' },
  { id: 'teaching-resources', label: 'Teaching Resources', icon: <Library size={20} />, path: '/teacher/lessons/resources' },
  { id: 'share-lesson', label: 'Share Lesson', icon: <Share2 size={20} />, path: '/teacher/lessons/share' },
  
  // SECTION 11: EXAMINATIONS
  { id: 'examinations', label: 'Examinations', icon: <FileText size={20} />, path: '/teacher/examinations' },
  { id: 'exam-timetable', label: 'Exam Timetable', icon: <Calendar size={20} />, path: '/teacher/examinations/timetable' },
  { id: 'invigilation', label: 'Invigilation Duties', icon: <Clock size={20} />, path: '/teacher/examinations/invigilation' },
  { id: 'mark-exams', label: 'Mark Exams', icon: <CheckSquare size={20} />, path: '/teacher/examinations/mark' },
  { id: 'exam-analysis', label: 'Exam Analysis', icon: <PieChart size={20} />, path: '/teacher/examinations/analysis' },
  
  // SECTION 12: RESOURCES & FACILITIES
  { id: 'resources', label: 'Resources & Facilities', icon: <Wrench size={20} />, path: '/teacher/resources' },
  { id: 'request-maintenance', label: 'Request Maintenance', icon: <Tool size={20} />, path: '/teacher/resources/maintenance' },
  { id: 'book-facility', label: 'Book Facility', icon: <Calendar size={20} />, path: '/teacher/resources/book' },
  { id: 'borrow-equipment', label: 'Borrow Equipment', icon: <Package size={20} />, path: '/teacher/resources/borrow' },
  { id: 'request-printing', label: 'Request Printing', icon: <Printer size={20} />, path: '/teacher/resources/printing' },
  
  // SECTION 13: CO-CURRICULAR
  { id: 'cocurricular', label: 'Co-Curricular', icon: <Trophy size={20} />, path: '/teacher/cocurricular' },
  { id: 'sports-team', label: 'Sports Team', icon: <Activity size={20} />, path: '/teacher/cocurricular/sports' },
  { id: 'my-club', label: 'My Club', icon: <Users size={20} />, path: '/teacher/cocurricular/club' },
  { id: 'competitions', label: 'Competitions', icon: <Award size={20} />, path: '/teacher/cocurricular/competitions' },
  { id: 'field-trips', label: 'Field Trips', icon: <MapPin size={20} />, path: '/teacher/cocurricular/trips' },
  
  // SECTION 14: PROFESSIONAL DEVELOPMENT
  { id: 'development', label: 'Professional Development', icon: <Briefcase size={20} />, path: '/teacher/development' },
  { id: 'training', label: 'Training Opportunities', icon: <GraduationCap size={20} />, path: '/teacher/development/training' },
  { id: 'cpd-hours', label: 'CPD Hours', icon: <Clock size={20} />, path: '/teacher/development/cpd' },
  { id: 'performance-review', label: 'Performance Review', icon: <Star size={20} />, path: '/teacher/development/review' },
  { id: 'certificates', label: 'Certificates', icon: <Award size={20} />, path: '/teacher/development/certificates' },
  
  // SECTION 15: REPORTS & ANALYTICS
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 size={20} />, path: '/teacher/reports' },
  { id: 'class-performance', label: 'Class Performance', icon: <TrendingUp size={20} />, path: '/teacher/reports/class' },
  { id: 'subject-analysis', label: 'Subject Analysis', icon: <PieChart size={20} />, path: '/teacher/reports/subject' },
  { id: 'student-progress', label: 'Student Progress', icon: <Activity size={20} />, path: '/teacher/reports/progress' },
  { id: 'export-reports', label: 'Export Reports', icon: <Download size={20} />, path: '/teacher/reports/export' },
  
  // SECTION 16: NOTIFICATIONS
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, path: '/teacher/notifications', badge: 12 },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} />, path: '/teacher/announcements' },
  { id: 'message-alerts', label: 'Message Alerts', icon: <MessageSquare size={20} />, path: '/teacher/messages' },
  
  // SECTION 17: MY PROFILE
  { id: 'profile', label: 'My Profile', icon: <Settings size={20} />, path: '/teacher/profile' },
  { id: 'edit-profile', label: 'Edit Profile', icon: <Edit size={20} />, path: '/teacher/profile/edit' },
  { id: 'change-password', label: 'Change Password', icon: <Lock size={20} />, path: '/teacher/profile/change-password' },
  { id: 'my-attendance', label: 'My Attendance', icon: <CalendarDays size={20} />, path: '/teacher/profile/attendance' },
  { id: 'preferences', label: 'Preferences', icon: <Settings size={20} />, path: '/teacher/profile/preferences' },
  
  // SECTION 18: SUPPORT
  { id: 'support', label: 'Support', icon: <HelpCircle size={20} />, path: '/teacher/support' },
  { id: 'help-docs', label: 'Help Documentation', icon: <FileText size={20} />, path: '/teacher/support/help' },
  { id: 'video-tutorials', label: 'Video Tutorials', icon: <Video size={20} />, path: '/teacher/support/tutorials' },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={20} />, path: '/teacher/support/faq' },
  { id: 'submit-ticket', label: 'Submit Ticket', icon: <Mail size={20} />, path: '/teacher/support/ticket' },
  { id: 'system-status', label: 'System Status', icon: <Activity size={20} />, path: '/teacher/support/status' },
];

// Organize nav items by section
const navSections = [
  { title: 'DASHBOARD', items: ['dashboard'] },
  { title: 'MY CLASSES', items: ['classes', 'class-roster', 'class-representatives'] },
  { title: 'MY STUDENTS', items: ['students', 'student-directory', 'student-profiles', 'at-risk-students', 'academic-history'] },
  { title: 'ATTENDANCE', items: ['attendance', 'mark-attendance', 'attendance-reports', 'absentee-alerts'] },
  { title: 'RESULTS & GRADES', items: ['grades', 'enter-cat1', 'enter-cat2', 'enter-exam', 'class-results', 'report-cards', 'grade-analysis', 'performance-trends'] },
  { title: 'HOMEWORK', items: ['homework', 'assign-homework', 'submissions', 'grade-homework', 'pending-homework'] },
  { title: 'TIMETABLE', items: ['timetable', 'my-timetable', 'class-timetable', 'exam-schedule', 'request-swap'] },
  { title: 'DISCIPLINE', items: ['discipline', 'give-merits', 'give-demerits', 'discipline-records', 'merit-leaderboard', 'refer-student'] },
  { title: 'PARENT COMMUNICATION', items: ['parents', 'chat-parents', 'bulk-message', 'parent-meetings', 'video-meeting'] },
  { title: 'LESSON PLANNING', items: ['lessons', 'create-lesson', 'weekly-plan', 'teaching-resources', 'share-lesson'] },
  { title: 'EXAMINATIONS', items: ['examinations', 'exam-timetable', 'invigilation', 'mark-exams', 'exam-analysis'] },
  { title: 'RESOURCES & FACILITIES', items: ['resources', 'request-maintenance', 'book-facility', 'borrow-equipment', 'request-printing'] },
  { title: 'CO-CURRICULAR', items: ['cocurricular', 'sports-team', 'my-club', 'competitions', 'field-trips'] },
  { title: 'PROFESSIONAL DEVELOPMENT', items: ['development', 'training', 'cpd-hours', 'performance-review', 'certificates'] },
  { title: 'REPORTS & ANALYTICS', items: ['reports', 'class-performance', 'subject-analysis', 'student-progress', 'export-reports'] },
  { title: 'NOTIFICATIONS', items: ['notifications', 'announcements', 'message-alerts'] },
  { title: 'MY PROFILE', items: ['profile', 'edit-profile', 'change-password', 'my-attendance', 'preferences'] },
  { title: 'SUPPORT', items: ['support', 'help-docs', 'video-tutorials', 'faq', 'submit-ticket', 'system-status'] },
];

const getActiveItemFromPath = (pathname: string): string => {
  const match = navItems.find(item => pathname === item.path || pathname.startsWith(item.path + '/'));
  return match?.id || 'dashboard';
};

export default function TeacherSidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const confirmation = useConfirmationDialog();
  const [activeItem, setActiveItem] = useState(() => getActiveItemFromPath(location.pathname));

  useEffect(() => {
    setActiveItem(getActiveItemFromPath(location.pathname));
  }, [location.pathname]);

  const handleNavigation = (path: string, id: string) => {
    setActiveItem(id);
    navigate(path);
  };

  const handleLogout = async () => {
    const confirmed = await confirmation.confirm({
      title: t('confirmDialog.logout.title'),
      message: t('confirmDialog.logout.message'),
      confirmText: t('confirmDialog.logout.confirm'),
      cancelText: t('confirmDialog.logout.cancel'),
      type: 'warning',
    });
    if (!confirmed) return;
    try {
      await authService.logout();
    } catch {
      // Continue
    }
    logout();
    navigate('/login');
  };

  const getBadgeCount = (itemId: string): number => {
    const badges: Record<string, number> = {
      'at-risk-students': 3,
      'absentee-alerts': 5,
      'pending-homework': 8,
      'notifications': 12,
    };
    return badges[itemId] || 0;
  };

  const getNavItem = (id: string): NavItem | undefined => {
    return navItems.find(item => item.id === id);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">SH</span>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-lg">Teacher Portal</span>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        <UserAvatar
          src={user?.avatar}
          name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Teacher</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="px-3 space-y-4">
          {navSections.map((section) => {
            const sectionItems = section.items
              .map(id => getNavItem(id))
              .filter((item): item is NavItem => item !== undefined);
            
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
                {sectionItems.map((item) => {
                  const badge = getBadgeCount(item.id);
                  const isActive = activeItem === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path, item.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <span className={clsx('flex-shrink-0', isActive && 'text-blue-600')}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {badge > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer - Logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

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
    </aside>
  );
}