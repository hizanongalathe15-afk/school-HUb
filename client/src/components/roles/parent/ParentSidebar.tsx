import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronDown,
  Plus, 
  LogOut, 
  Settings, 
  Menu, 
  X,
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  FileText,
  Clock,
  Award,
  MessageCircle,
  Users,
  Calendar,
  Music,
  Heart,
  Home,
  Bus,
  AlertTriangle,
  Bell,
  User,
  GraduationCap,
  ChartBar,
  Receipt,
  DollarSign,
  Star,
  Video,
  Gift,
  Activity,
  Download,
  Info,
  HelpCircle,
  FileBarChart,
  Shield,
  Languages,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Archive,
  Search,
  CalendarDays,
  CalendarRange,
  Trophy,
  Medal,
  Flame,
  Navigation,
  Map,
  Images,
  Terminal,
  Server,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ParentSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  selectedChildId: string | null;
  onSelectChild: (id: string | null) => void;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  className: string;
  admissionNumber: string;
  profilePhoto?: string;
}

const ParentSidebar: React.FC<ParentSidebarProps> = ({
  currentPage,
  onPageChange,
  selectedChildId,
  onSelectChild,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('parent');
  const [children, setChildren] = useState<Child[]>([]);
  const [isChildrenOpen, setIsChildrenOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    children: false,
    academic: false,
    attendance: false,
    fees: false,
    homework: false,
    exams: false,
    timetable: false,
    discipline: false,
    communication: false,
    meetings: false,
    events: false,
    schoolInfo: false,
    activities: false,
    health: false,
    boarding: false,
    transport: false,
    complaints: false,
    notifications: false,
    profile: false,
    support: false,
  });

  const fetchChildren = useCallback(async () => {
    try {
      const response = await fetch('/api/parent/children', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedChildren = data.map((child: any) => ({
          ...child,
          name: `${child.firstName} ${child.lastName}`
        }));
        setChildren(formattedChildren);
        if (formattedChildren.length > 0 && !selectedChildId) {
          onSelectChild(formattedChildren[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    }
  }, [selectedChildId, onSelectChild]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const MenuItem = ({ label, page, icon, badge }: { label: string; page: string; icon: React.ReactNode; badge?: number | string }) => (
    <button
      onClick={() => handlePageChange(page)}
      className={clsx(
        'w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between gap-3 text-sm font-medium',
        currentPage === page
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
      )}
    >
      <span className={clsx('flex-shrink-0', currentPage === page ? 'text-white' : 'text-gray-500 dark:text-gray-400')}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge !== null && (
        <span className={clsx(
          'px-2 py-0.5 rounded-full text-xs font-semibold',
          currentPage === page ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {badge}
        </span>
      )}
    </button>
  );

  const SectionHeader = ({ label, section, icon }: { label: string; section: string; icon?: React.ReactNode }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronDown
        className={clsx(
          'h-4 w-4 transition-transform duration-200',
          expandedSections[section] && 'rotate-180'
        )}
      />
    </button>
  );

  const getUserInitials = () => {
    const first = user?.firstName?.[0] || 'P';
    const last = user?.lastName?.[0] || 'R';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-all duration-300 flex flex-col',
          isMobileOpen 
            ? 'fixed w-80 z-40 h-full shadow-2xl' 
            : 'hidden md:flex md:w-72'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <User className="h-3 w-3" />
                Parent Account
              </p>
            </div>
          </div>
        </div>

        {/* Children Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setIsChildrenOpen(!isChildrenOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              My Children
            </span>
            <ChevronDown
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                isChildrenOpen && 'rotate-180'
              )}
            />
          </button>

          {isChildrenOpen && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    onSelectChild(child.id);
                    setIsMobileOpen(false);
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200',
                    selectedChildId === child.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <p className="font-medium text-sm">{child.name}</p>
                  <p className={clsx(
                    'text-xs mt-1',
                    selectedChildId === child.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {child.className} • {child.admissionNumber}
                  </p>
                </button>
              ))}

              <button
                onClick={() => {
                  handlePageChange('children');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Link New Child
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {/* SECTION 1: DASHBOARD */}
          <div className="mb-1">
            <p className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Overview
            </p>
            <MenuItem label="Dashboard" page="dashboard" icon={<LayoutDashboard className="h-4 w-4" />} />
          </div>

          {/* SECTION 2: MY CHILDREN */}
          <div className="mb-1">
            <SectionHeader label="My Children" section="children" icon={<Users className="h-4 w-4" />} />
            {expandedSections.children && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="All Children" page="children" icon={<Users className="h-4 w-4" />} />
                <MenuItem label="Child Profiles" page="child-profiles" icon={<User className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 3: ACADEMIC PERFORMANCE */}
          <div className="mb-1">
            <SectionHeader label="Academic Performance" section="academic" icon={<BookOpen className="h-4 w-4" />} />
            {expandedSections.academic && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Results & Grades" page="academic" icon={<BookOpen className="h-4 w-4" />} />
                <MenuItem label="Performance Analysis" page="performance" icon={<ChartBar className="h-4 w-4" />} />
                <MenuItem label="Report Cards" page="reports" icon={<FileText className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 4: ATTENDANCE TRACKING */}
          <div className="mb-1">
            <SectionHeader label="Attendance" section="attendance" icon={<CalendarCheck className="h-4 w-4" />} />
            {expandedSections.attendance && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="View Attendance" page="attendance" icon={<CalendarCheck className="h-4 w-4" />} />
                <MenuItem label="Reports" page="attendance-reports" icon={<FileBarChart className="h-4 w-4" />} />
                <MenuItem label="Settings" page="attendance-settings" icon={<Settings className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 5: FEE MANAGEMENT */}
          <div className="mb-1">
            <SectionHeader label="Fees & Payments" section="fees" icon={<CreditCard className="h-4 w-4" />} />
            {expandedSections.fees && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Fee Balance" page="fees" icon={<DollarSign className="h-4 w-4" />} />
                <MenuItem label="Payment History" page="payment-history" icon={<Receipt className="h-4 w-4" />} />
                <MenuItem label="Make Payment" page="make-payment" icon={<CreditCard className="h-4 w-4" />} />
                <MenuItem label="Payment Plans" page="payment-plans" icon={<CalendarRange className="h-4 w-4" />} />
                <MenuItem label="Fee Reports" page="fee-reports" icon={<FileBarChart className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 6: HOMEWORK & ASSIGNMENTS */}
          <div className="mb-1">
            <SectionHeader label="Homework" section="homework" icon={<ClipboardList className="h-4 w-4" />} />
            {expandedSections.homework && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="View Homework" page="homework" icon={<ClipboardList className="h-4 w-4" />} />
                <MenuItem label="Submission Status" page="homework-status" icon={<CheckCircle className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 7: EXAMINATIONS */}
          <div className="mb-1">
            <SectionHeader label="Examinations" section="exams" icon={<Award className="h-4 w-4" />} />
            {expandedSections.exams && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Exam Timetable" page="exam-timetable" icon={<CalendarDays className="h-4 w-4" />} />
                <MenuItem label="Exam Results" page="exam-results" icon={<Award className="h-4 w-4" />} />
                <MenuItem label="Rules & Guidelines" page="exam-rules" icon={<FileText className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 8: TIMETABLE */}
          <div className="mb-1">
            <SectionHeader label="Timetable" section="timetable" icon={<Clock className="h-4 w-4" />} />
            {expandedSections.timetable && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Class Timetable" page="timetable" icon={<CalendarDays className="h-4 w-4" />} />
                <MenuItem label="Subject Teachers" page="subject-teachers" icon={<Users className="h-4 w-4" />} />
                <MenuItem label="Extra-Curricular" page="cocurricular-timetable" icon={<Music className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 9: DISCIPLINE & BEHAVIOR */}
          <div className="mb-1">
            <SectionHeader label="Discipline" section="discipline" icon={<Star className="h-4 w-4" />} />
            {expandedSections.discipline && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Merits" page="merits" icon={<Trophy className="h-4 w-4" />} />
                <MenuItem label="Demerits" page="demerits" icon={<AlertTriangle className="h-4 w-4" />} />
                <MenuItem label="Streaks" page="streaks" icon={<Flame className="h-4 w-4" />} />
                <MenuItem label="Behavior Reports" page="behavior-reports" icon={<FileBarChart className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 10: PARENT-TEACHER COMMUNICATION */}
          <div className="mb-1">
            <SectionHeader label="Messages" section="communication" icon={<MessageCircle className="h-4 w-4" />} />
            {expandedSections.communication && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Chat with Teachers" page="communication" icon={<MessageCircle className="h-4 w-4" />} />
                <MenuItem label="Announcements" page="announcements" icon={<Bell className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 11: PARENT-TEACHER MEETINGS */}
          <div className="mb-1">
            <SectionHeader label="Meetings" section="meetings" icon={<Video className="h-4 w-4" />} />
            {expandedSections.meetings && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Book Meeting" page="book-meeting" icon={<Calendar className="h-4 w-4" />} />
                <MenuItem label="My Meetings" page="meetings" icon={<Users className="h-4 w-4" />} />
                <MenuItem label="Meeting History" page="meeting-history" icon={<Archive className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 12: SCHOOL EVENTS */}
          <div className="mb-1">
            <SectionHeader label="Events" section="events" icon={<Calendar className="h-4 w-4" />} />
            {expandedSections.events && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Upcoming Events" page="events" icon={<CalendarDays className="h-4 w-4" />} />
                <MenuItem label="Event Gallery" page="event-gallery" icon={<Images className="h-4 w-4" />} />
                <MenuItem label="Volunteer" page="volunteer" icon={<Heart className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 13: SCHOOL INFORMATION */}
          <div className="mb-1">
            <SectionHeader label="School Info" section="schoolInfo" icon={<Info className="h-4 w-4" />} />
            {expandedSections.schoolInfo && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="School Profile" page="school-profile" icon={<Info className="h-4 w-4" />} />
                <MenuItem label="School Calendar" page="school-calendar" icon={<CalendarRange className="h-4 w-4" />} />
                <MenuItem label="Policies" page="school-policies" icon={<FileText className="h-4 w-4" />} />
                <MenuItem label="Staff Directory" page="staff-directory" icon={<Users className="h-4 w-4" />} />
                <MenuItem label="Downloads" page="downloads" icon={<Download className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 14: EXTRA-CURRICULAR ACTIVITIES */}
          <div className="mb-1">
            <SectionHeader label="Activities" section="activities" icon={<Activity className="h-4 w-4" />} />
            {expandedSections.activities && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Sports" page="sports" icon={<Trophy className="h-4 w-4" />} />
                <MenuItem label="Clubs & Societies" page="clubs" icon={<Music className="h-4 w-4" />} />
                <MenuItem label="Competitions" page="competitions" icon={<Medal className="h-4 w-4" />} />
                <MenuItem label="Field Trips" page="field-trips" icon={<MapPin className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 15: HEALTH & MEDICAL */}
          <div className="mb-1">
            <SectionHeader label="Health" section="health" icon={<Heart className="h-4 w-4" />} />
            {expandedSections.health && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Medical Records" page="medical-records" icon={<FileText className="h-4 w-4" />} />
                <MenuItem label="Sick Bay" page="sick-bay" icon={<Heart className="h-4 w-4" />} />
                <MenuItem label="Emergency Contacts" page="emergency-contacts" icon={<Phone className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 16: BOARDING */}
          <div className="mb-1">
            <SectionHeader label="Boarding" section="boarding" icon={<Home className="h-4 w-4" />} />
            {expandedSections.boarding && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Dormitory Info" page="dormitory" icon={<Home className="h-4 w-4" />} />
                <MenuItem label="Laundry" page="laundry" icon={<Droplets className="h-4 w-4" />} />
                <MenuItem label="Meal Menu" page="meal-menu" icon={<Gift className="h-4 w-4" />} />
                <MenuItem label="Visitation" page="visitation" icon={<Users className="h-4 w-4" />} />
                <MenuItem label="Leave Requests" page="leave-requests" icon={<Calendar className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 17: TRANSPORT */}
          <div className="mb-1">
            <SectionHeader label="Transport" section="transport" icon={<Bus className="h-4 w-4" />} />
            {expandedSections.transport && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Bus Route" page="bus-route" icon={<Navigation className="h-4 w-4" />} />
                <MenuItem label="Live Tracking" page="bus-tracking" icon={<Map className="h-4 w-4" />} />
                <MenuItem label="Transport Fees" page="transport-fees" icon={<DollarSign className="h-4 w-4" />} />
                <MenuItem label="Report Issues" page="transport-issues" icon={<AlertTriangle className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 18: COMPLAINTS & SUGGESTIONS */}
          <div className="mb-1">
            <SectionHeader label="Complaints" section="complaints" icon={<AlertTriangle className="h-4 w-4" />} />
            {expandedSections.complaints && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Submit Complaint" page="submit-complaint" icon={<FileText className="h-4 w-4" />} />
                <MenuItem label="Track Complaints" page="complaints" icon={<Search className="h-4 w-4" />} />
                <MenuItem label="Suggestions" page="suggestions" icon={<Lightbulb className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 19: NOTIFICATIONS & ALERTS */}
          <div className="mb-1">
            <SectionHeader label="Notifications" section="notifications" icon={<Bell className="h-4 w-4" />} />
            {expandedSections.notifications && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="All Notifications" page="notifications" icon={<Bell className="h-4 w-4" />} />
                <MenuItem label="Notification Settings" page="notification-settings" icon={<Settings className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 20: PROFILE SETTINGS */}
          <div className="mb-1">
            <SectionHeader label="Settings" section="profile" icon={<Settings className="h-4 w-4" />} />
            {expandedSections.profile && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="My Profile" page="profile" icon={<User className="h-4 w-4" />} />
                <MenuItem label="Security" page="security" icon={<Lock className="h-4 w-4" />} />
                <MenuItem label="Preferences" page="preferences" icon={<Languages className="h-4 w-4" />} />
                <MenuItem label="Privacy" page="privacy" icon={<Shield className="h-4 w-4" />} />
              </div>
            )}
          </div>

          {/* SECTION 21: SUPPORT */}
          <div className="mb-1">
            <SectionHeader label="Support" section="support" icon={<HelpCircle className="h-4 w-4" />} />
            {expandedSections.support && (
              <div className="ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <MenuItem label="Help & FAQ" page="help" icon={<HelpCircle className="h-4 w-4" />} />
                <MenuItem label="Contact School" page="contact-school" icon={<Mail className="h-4 w-4" />} />
                <MenuItem label="Technical Support" page="tech-support" icon={<Terminal className="h-4 w-4" />} />
                <MenuItem label="System Status" page="system-status" icon={<Server className="h-4 w-4" />} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-4 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f1f1f;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a4a4a;
        }
      `}</style>
    </>
  );
};

// Lightbulb icon component for suggestions
const Lightbulb = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export default ParentSidebar;