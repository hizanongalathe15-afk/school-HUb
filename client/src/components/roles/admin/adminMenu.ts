import {
  Activity,
  Archive,
  Award,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Bell,
  BookCopy,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileArchive,
  FileCheck2,
  FileClock,
  FileKey,
  FileText,
  GraduationCap,
  HandCoins,
  HardHat,
  HeartPulse,
  Image,
  KeyRound,
  Landmark,
  Library,
  LifeBuoy,
  Lock,
  Mail,
  Map,
  MessageCircle,
  MessageSquare,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Smartphone,
  Stethoscope,
  Trophy,
  Truck,
  UserCog,
  Users,
  WalletCards,
  Wrench,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavChild {
  name: string;
  path: string;
}

export interface AdminNavGroup {
  name: string;
  path: string;
  icon: LucideIcon;
  children?: AdminNavChild[];
}

export interface AdminNavSection {
  category: string;
  items: AdminNavGroup[];
}

export const adminNavigationSections: AdminNavSection[] = [
  {
    category: 'Dashboard',
    items: [
      { name: 'Main Dashboard', path: '/admin/dashboard', icon: BarChart3 },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'System Metrics', path: '/admin/system-metrics', icon: Activity },
    ],
  },
  {
    category: 'School',
    items: [
      { name: 'School Profile', path: '/admin/school-profile', icon: Building2 },
      { name: 'Media Gallery', path: '/admin/media', icon: Image },
      { name: 'Location', path: '/admin/location', icon: Map },
      { name: 'Infrastructure', path: '/admin/infrastructure', icon: HardHat },
    ],
  },
  {
    category: 'Academics',
    items: [
      { name: 'Classes & Streams', path: '/admin/academic/classes', icon: GraduationCap },
      { name: 'Subjects', path: '/admin/academic/subjects', icon: BookOpen },
      { name: 'Timetable', path: '/admin/academic/timetable', icon: CalendarDays },
      { name: 'Academic Calendar', path: '/admin/academic/calendar', icon: CalendarDays },
      { name: 'Events', path: '/admin/events', icon: CalendarDays },
      { name: 'Grading System', path: '/admin/academic/grading', icon: Trophy },
      { name: 'Results', path: '/admin/results', icon: FileText },
    ],
  },
  {
    category: 'People',
    items: [
      { name: 'Students', path: '/admin/students', icon: Users },
      { name: 'Admissions', path: '/admin/admissions', icon: FileCheck2 },
      { name: 'Parents', path: '/admin/parents', icon: Users },
      { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
      { name: 'Staff', path: '/admin/staff', icon: BriefcaseBusiness },
      { name: 'Users & Roles', path: '/admin/users', icon: UserCog },
      { name: 'Permissions', path: '/admin/permissions', icon: Lock },
    ],
  },
  {
    category: 'Finance',
    items: [
      { name: 'Finance Dashboard', path: '/admin/finance', icon: Landmark },
      { name: 'Fee Structure', path: '/admin/finance/fees', icon: CreditCard },
      { name: 'Transactions', path: '/admin/finance/transactions', icon: Receipt },
      { name: 'Bursaries', path: '/admin/finance/bursaries', icon: HandCoins },
      { name: 'Scholarships', path: '/admin/finance/scholarships', icon: Award },
      { name: 'Financial Reports', path: '/admin/finance/reports', icon: BarChart3 },
    ],
  },
  {
    category: 'Operations',
    items: [
      { name: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck },
      { name: 'Inventory', path: '/admin/inventory', icon: Package },
      { name: 'Library', path: '/admin/library', icon: Library },
      { name: 'Discipline', path: '/admin/discipline', icon: Shield },
      { name: 'Health', path: '/admin/health', icon: HeartPulse },
      { name: 'Co-Curricular', path: '/admin/cocurricular', icon: Trophy },
    ],
  },
  {
    category: 'Communication',
    items: [
      { name: 'Send Message', path: '/admin/communication/send', icon: MessageSquare },
      { name: 'Announcements', path: '/admin/communication/announcements', icon: Bell },
      { name: 'SMS', path: '/admin/communication/sms', icon: Smartphone },
      { name: 'Email', path: '/admin/communication/email', icon: Mail },
      { name: 'WhatsApp', path: '/admin/communication/whatsapp', icon: MessageCircle },
    ],
  },
  {
    category: 'Reports',
    items: [
      { name: 'Report Center', path: '/admin/reports', icon: FileText },
      { name: 'Academic Reports', path: '/admin/reports/academic', icon: BookOpen },
      { name: 'KCSE Reports', path: '/admin/reports/kcse', icon: Award },
      { name: 'Activity Logs', path: '/admin/activity-logs', icon: ScrollText },
    ],
  },
  {
    category: 'System',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Backups', path: '/admin/backups', icon: FileArchive },
      { name: 'Automations', path: '/admin/automations', icon: Wand2 },
      { name: 'Developer Tools', path: '/admin/developer', icon: Wrench },
      { name: 'Support Status', path: '/admin/support/status', icon: Activity },
    ],
  },
];

export const adminRouteCatalog = adminNavigationSections.flatMap((section) =>
  section.items.flatMap((item) => [
    { section: section.category, title: item.name, path: item.path, parentTitle: undefined },
    ...(item.children ?? []).map((child) => ({
      section: section.category,
      title: child.name,
      path: child.path,
      parentTitle: item.name,
    })),
  ]),
);

export function findAdminRoute(pathname: string) {
  return adminRouteCatalog
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`));
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
