import { Route, Routes, Navigate, useParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';
import { Login } from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicFooter from './components/public/PublicFooter';
import PublicNavbar from './components/public/PublicNavbar';
import CookieConsent from './components/public/CookieConsent';
import PublicAdRail from './components/public/PublicAdRail';
import { useLandingContent } from './hooks/useLandingContent';
import {
  AdminDashboard,
  AdminDashboardHome,
  AdminCrudWorkspace,
  UserManagement,
  SchoolProfile,
  AnalyticsDashboard,
  AdminActivityLogsPage,
  AdminLocationPage,
  AdminInfrastructurePage,
  AdminMediaPage,
  AdminStudentsPage,
  AdminTeachersPage,
  AdminParentsPage,
  AdminStaffPage,
  AdminAdmissionsPage,
  AdminClassesPage,
  AdminSubjectsPage,
  AdminTimetablePage,
  AdminGradingPage,
  AdminTermsPage,
  AdminResultsPage,
  AdminEventsPage,
  AdminFinanceDashboardPage,
  AdminFeeStructurePage,
  AdminTransactionsPage,
  AdminBursariesPage,
  AdminScholarshipsPage,
  AdminFinancialReportsPage,
  AdminAttendancePage,
  AdminInventoryPage,
  AdminLibraryPage,
  AdminDisciplinePage,
  AdminHealthPage,
  AdminCocurricularPage,
  AdminSendMessagePage,
  AdminAnnouncementsPage,
  AdminSmsPage,
  AdminEmailPage,
  AdminWhatsappPage,
  AdminReportCenterPage,
  AdminAcademicReportsPage,
  AdminReportsFinancialPage,
  AdminKcsePage,
  AdminSettingsPage,
  AdminPermissionsPage,
  AdminBackupsPage,
  AdminDeveloperPage,
  AdminSystemMetricsPage,
  AdminAutomationsPage,
  AdminProfile,
} from './components/roles/admin';
import { ParentDashboard, ParentChildren, ParentAcademic, ParentAttendance, ParentFees, ParentHomework, ParentTimetable, ParentDiscipline, ParentMessages, ParentAnnouncements, ParentMeetings, ParentEvents, ParentProfile, ParentNotifications, ParentComplaints, ParentDownloads, ParentSchoolInfo, ParentExaminations, ParentExtraCurricular, ParentHealth, ParentBoarding, ParentTransport, ParentSupport } from './components/roles/parent';
import { TeacherDashboard, TeacherClassesPage, TeacherStudentsPage, TeacherAttendancePage, TeacherGradesPage, TeacherHomeworkPage, TeacherDisciplinePage, TeacherMessagesPage, TeacherAnnouncementsPage, TeacherMeetingsPage, TeacherLessonsPage, TeacherTimetablePage, TeacherNotificationsPage, TeacherProfile, TeacherExaminationsPage, TeacherResourcesPage, TeacherCocurricularPage, TeacherDevelopmentPage, TeacherReportsPage, TeacherSupportPage, TeacherTasksPage, TeacherAlertsPage } from './components/roles/teacher';
import { BursarDashboard } from './components/roles/bursar';
import BursarProfile from './components/roles/bursar/BursarProfile';
import BursarExpenseManagementPage from './components/roles/bursar/BursarExpenseManagementPage';
import BursarPayrollPage from './components/roles/bursar/BursarPayrollPage';
import BursarFinancialReportsPage from './components/roles/bursar/BursarFinancialReportsPage';
import BursarBudgetPage from './components/roles/bursar/BursarBudgetPage';
import BursarScholarshipsPage from './components/roles/bursar/BursarScholarshipsPage';
import BursarMPESAPage from './components/roles/bursar/BursarMPESAPage';
import BursarFeeManagementPage from './components/roles/bursar/BursarFeeManagementPage';
import BursarRecordPaymentsPage from './components/roles/bursar/BursarRecordPaymentsPage';
import BursarArrearsPage from './components/roles/bursar/BursarArrearsPage';
import BursarInvoicesPage from './components/roles/bursar/BursarInvoicesPage';
import BursarPaymentPlansPage from './components/roles/bursar/BursarPaymentPlansPage';
import BursarSalaryStructuresPage from './components/roles/bursar/BursarSalaryStructuresPage';
import BursarSalaryAdvancesPage from './components/roles/bursar/BursarSalaryAdvancesPage';
import BursarBankingPage from './components/roles/bursar/BursarBankingPage';
import BursarFixedAssetsPage from './components/roles/bursar/BursarFixedAssetsPage';
import BursarPettyCashPage from './components/roles/bursar/BursarPettyCashPage';
import BursarAnalyticsPage from './components/roles/bursar/BursarAnalyticsPage';
import BursarStudentFeesPage from './components/roles/bursar/BursarStudentFeesPage';
import BursarBulkOperationsPage from './components/roles/bursar/BursarBulkOperationsPage';
import BursarAuditPage from './components/roles/bursar/BursarAuditPage';
import BursarProjectsPage from './components/roles/bursar/BursarProjectsPage';
import BursarSettingsPage from './components/roles/bursar/BursarSettingsPage';
import { StoreKeeperDashboard } from './components/roles/storekeeper';
import DashboardSearchPage from './components/roles/shared/DashboardSearchPage';
import RoleNotificationsPage from './components/roles/shared/RoleNotificationsPage';
import StoreKeeperInventoryPage from './components/roles/storekeeper/StoreKeeperInventoryPage';
import StoreKeeperRequestsPage from './components/roles/storekeeper/StoreKeeperRequestsPage';
import StoreKeeperPurchaseOrdersPage from './components/roles/storekeeper/StoreKeeperPurchaseOrdersPage';
import StoreKeeperLowStockPage from './components/roles/storekeeper/StoreKeeperLowStockPage';
import StoreKeeperExpiringPage from './components/roles/storekeeper/StoreKeeperExpiringPage';
import StoreKeeperMovementsPage from './components/roles/storekeeper/StoreKeeperMovementsPage';
import StoreKeeperDeliveriesPage from './components/roles/storekeeper/StoreKeeperDeliveriesPage';
import StoreKeeperIssuesPage from './components/roles/storekeeper/StoreKeeperIssuesPage';
import StoreKeeperReturnsPage from './components/roles/storekeeper/StoreKeeperReturnsPage';
import StoreKeeperSuppliersPage from './components/roles/storekeeper/StoreKeeperSuppliersPage';
import StoreKeeperLocationsPage from './components/roles/storekeeper/StoreKeeperLocationsPage';
import StoreKeeperAlertsPage from './components/roles/storekeeper/StoreKeeperAlertsPage';
import StoreKeeperStockTakePage from './components/roles/storekeeper/StoreKeeperStockTakePage';
import StoreKeeperFixedAssetsPage from './components/roles/storekeeper/StoreKeeperFixedAssetsPage';
import StoreKeeperReportsPage from './components/roles/storekeeper/StoreKeeperReportsPage';
import StoreKeeperSettingsPage from './components/roles/storekeeper/StoreKeeperSettingsPage';
import About from './pages/About';
import Academics from './pages/Academics';
import Admissions from './pages/Admissions';
import AdmissionApplication from './pages/AdmissionApplication';
import Contact from './pages/Contact';
import Downloads from './pages/Downloads';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import { Home } from './pages/Home';
import Life from './pages/Life';
import PublicPage from './pages/PublicPage';
import { getDashboardPathForRole } from './utils/roleRoutes';
import OfflineResilience from './components/OfflineResilience';

function LegacyTeacherRedirect() {
  const params = useParams();
  const rest = params['*'] ? `/${params['*']}` : '/dashboard';
  return <Navigate to={`/teacher${rest}`} replace />;
}

function LegacyParentRedirect() {
  const params = useParams();
  const rest = params['*'] ? `/${params['*']}` : '';
  return <Navigate to={`/dashboard/parent${rest}`} replace />;
}

function LegacyBursarRedirect() {
  const params = useParams();
  const rest = params['*'] ? `/${params['*']}` : '';
  return <Navigate to={`/dashboard/bursar${rest}`} replace />;
}

function LegacyStoreRedirect() {
  const params = useParams();
  const rest = params['*'] ? `/${params['*']}` : '';
  return <Navigate to={`/dashboard/store${rest}`} replace />;
}

// Dashboard redirect component
function DashboardRedirect() {
  try {
    const { user } = useAuthStore();
    if (!user) return <Navigate to="/" replace />;
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  } catch (error) {
    console.error('Error in DashboardRedirect:', error);
    return <Navigate to="/" replace />;
  }
}

// Admin Routes
function AdminRoutes() {
  return (
    <Route path="/admin" element={<AdminDashboard />}>
      <Route path="dashboard" element={<AdminDashboardHome />} />
      <Route path="activity-logs" element={<AdminActivityLogsPage />} />
      <Route path="location" element={<AdminLocationPage />} />
      <Route path="infrastructure" element={<AdminInfrastructurePage />} />
      <Route path="media" element={<AdminMediaPage />} />
      <Route path="site-content" element={<Navigate to="/admin/school-profile" replace />} />
      <Route path="site-content/*" element={<Navigate to="/admin/school-profile" replace />} />

      <Route path="users" element={<UserManagement />} />
      <Route path="students" element={<AdminStudentsPage />} />
      <Route path="admissions" element={<AdminAdmissionsPage />} />
      <Route path="teachers" element={<AdminTeachersPage />} />
      <Route path="parents" element={<AdminParentsPage />} />
      <Route path="staff" element={<AdminStaffPage />} />

      <Route path="academic/classes" element={<AdminClassesPage />} />
      <Route path="academic/subjects" element={<AdminSubjectsPage />} />
      <Route path="academic/timetable" element={<AdminTimetablePage />} />
      <Route path="academic/grading" element={<AdminGradingPage />} />
      <Route path="academic/terms" element={<AdminTermsPage />} />
      <Route path="academic/calendar/*" element={<AdminTermsPage />} />
      <Route path="events" element={<AdminEventsPage />} />
      <Route path="results" element={<AdminResultsPage />} />

      <Route path="finance" element={<AdminFinanceDashboardPage />} />
      <Route path="finance/fees" element={<AdminFeeStructurePage />} />
      <Route path="finance/transactions" element={<AdminTransactionsPage />} />
      <Route path="finance/bursaries" element={<AdminBursariesPage />} />
      <Route path="finance/scholarships" element={<AdminScholarshipsPage />} />
      <Route path="finance/reports" element={<AdminFinancialReportsPage />} />

      <Route path="attendance" element={<AdminAttendancePage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="library" element={<AdminLibraryPage />} />
      <Route path="discipline" element={<AdminDisciplinePage />} />
      <Route path="health" element={<AdminHealthPage />} />
      <Route path="cocurricular" element={<AdminCocurricularPage />} />

      <Route path="communication/send" element={<AdminSendMessagePage />} />
      <Route path="communication/announcements" element={<AdminAnnouncementsPage />} />
      <Route path="communication/sms" element={<AdminSmsPage />} />
      <Route path="communication/email" element={<AdminEmailPage />} />
      <Route path="communication/whatsapp" element={<AdminWhatsappPage />} />

      <Route path="reports" element={<AdminReportCenterPage />} />
      <Route path="reports/academic" element={<AdminAcademicReportsPage />} />
      <Route path="reports/financial" element={<AdminReportsFinancialPage />} />
      <Route path="reports/kcse" element={<AdminKcsePage />} />

      <Route path="settings" element={<AdminSettingsPage />} />
      <Route path="permissions" element={<AdminPermissionsPage />} />
      <Route path="backups" element={<AdminBackupsPage />} />
      <Route path="automations" element={<AdminAutomationsPage />} />
      <Route path="developer" element={<AdminDeveloperPage />} />
      <Route path="system-metrics" element={<AdminSystemMetricsPage />} />
      <Route path="system-metrics/*" element={<AdminSystemMetricsPage />} />
      <Route path="support/status/*" element={<AdminSystemMetricsPage />} />
      <Route path="analytics" element={<AnalyticsDashboard />} />

      <Route path="school-profile" element={<SchoolProfile />} />
      <Route path="profile" element={<AdminProfile />} />

      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<AdminCrudWorkspace />} />
    </Route>
  );
}

function ParentRoutes() {
  return (
    <Route path="/dashboard/parent" element={<ParentDashboard />}>
      <Route index element={null} />
      <Route path="children" element={<ParentChildren />} />
      <Route path="academic" element={<ParentAcademic />} />
      <Route path="attendance" element={<ParentAttendance />} />
      <Route path="fees" element={<ParentFees />} />
      <Route path="homework" element={<ParentHomework />} />
      <Route path="timetable" element={<ParentTimetable />} />
      <Route path="discipline" element={<ParentDiscipline />} />
      <Route path="messages" element={<ParentMessages />} />
      <Route path="announcements" element={<ParentAnnouncements />} />
      <Route path="meetings" element={<ParentMeetings />} />
      <Route path="events" element={<ParentEvents />} />
      <Route path="profile" element={<ParentProfile />} />
      <Route path="notifications" element={<ParentNotifications />} />
      <Route path="complaints" element={<ParentComplaints />} />
      <Route path="downloads" element={<ParentDownloads />} />
      <Route path="school-info" element={<ParentSchoolInfo />} />
      <Route path="examinations" element={<ParentExaminations />} />
      <Route path="extra-curricular" element={<ParentExtraCurricular />} />
      <Route path="health" element={<ParentHealth />} />
      <Route path="boarding" element={<ParentBoarding />} />
      <Route path="transport" element={<ParentTransport />} />
      <Route path="support" element={<ParentSupport />} />
      <Route path="search" element={<DashboardSearchPage />} />
      <Route path="*" element={<Navigate to="/dashboard/parent" replace />} />
    </Route>
  );
}

function TeacherRoutes() {
  return (
    <Route path="/teacher" element={<TeacherDashboard />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={null} />
      <Route path="classes" element={<TeacherClassesPage />} />
      <Route path="classes/*" element={<TeacherClassesPage />} />
      <Route path="students" element={<TeacherStudentsPage />} />
      <Route path="students/*" element={<TeacherStudentsPage />} />
      <Route path="attendance" element={<TeacherAttendancePage />} />
      <Route path="attendance/*" element={<TeacherAttendancePage />} />
      <Route path="grades" element={<TeacherGradesPage />} />
      <Route path="grades/*" element={<TeacherGradesPage />} />
      <Route path="homework" element={<TeacherHomeworkPage />} />
      <Route path="homework/*" element={<TeacherHomeworkPage />} />
      <Route path="timetable" element={<TeacherTimetablePage />} />
      <Route path="timetable/*" element={<TeacherTimetablePage />} />
      <Route path="lessons" element={<TeacherLessonsPage />} />
      <Route path="lessons/*" element={<TeacherLessonsPage />} />
      <Route path="messages" element={<TeacherMessagesPage />} />
      <Route path="messages/*" element={<TeacherMessagesPage />} />
      <Route path="parents" element={<TeacherMessagesPage />} />
      <Route path="parents/*" element={<TeacherMessagesPage />} />
      <Route path="announcements" element={<TeacherAnnouncementsPage />} />
      <Route path="announcements/*" element={<TeacherAnnouncementsPage />} />
      <Route path="meetings" element={<TeacherMeetingsPage />} />
      <Route path="meetings/*" element={<TeacherMeetingsPage />} />
      <Route path="discipline" element={<TeacherDisciplinePage />} />
      <Route path="discipline/*" element={<TeacherDisciplinePage />} />
      <Route path="examinations" element={<TeacherExaminationsPage />} />
      <Route path="examinations/*" element={<TeacherExaminationsPage />} />
      <Route path="resources" element={<TeacherResourcesPage />} />
      <Route path="resources/*" element={<TeacherResourcesPage />} />
      <Route path="cocurricular" element={<TeacherCocurricularPage />} />
      <Route path="cocurricular/*" element={<TeacherCocurricularPage />} />
      <Route path="development" element={<TeacherDevelopmentPage />} />
      <Route path="development/*" element={<TeacherDevelopmentPage />} />
      <Route path="reports" element={<TeacherReportsPage />} />
      <Route path="reports/*" element={<TeacherReportsPage />} />
      <Route path="profile" element={<TeacherProfile />} />
      <Route path="profile/*" element={<TeacherProfile />} />
      <Route path="support" element={<TeacherSupportPage />} />
      <Route path="support/*" element={<TeacherSupportPage />} />
      <Route path="notifications" element={<TeacherNotificationsPage />} />
      <Route path="notifications/*" element={<TeacherNotificationsPage />} />
      <Route path="tasks" element={<TeacherTasksPage />} />
      <Route path="tasks/*" element={<TeacherTasksPage />} />
      <Route path="alerts" element={<TeacherAlertsPage />} />
      <Route path="alerts/*" element={<TeacherAlertsPage />} />
      <Route path="search" element={<DashboardSearchPage />} />
      <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
    </Route>
  );
}

function BursarRoutes() {
  return (
    <Route path="/dashboard/bursar" element={<BursarDashboard />}>
      <Route index element={null} />
      <Route path="fees" element={<BursarFeeManagementPage />} />
      <Route path="fees/payments" element={<BursarRecordPaymentsPage />} />
      <Route path="fees/arrears" element={<BursarArrearsPage />} />
      <Route path="fees/structures" element={<BursarFeeManagementPage />} />
      <Route path="fees/invoices" element={<BursarInvoicesPage />} />
      <Route path="fees/payment-plans" element={<BursarPaymentPlansPage />} />
      <Route path="fees/*" element={<BursarFeeManagementPage />} />
      <Route path="fee-collection/*" element={<BursarRecordPaymentsPage />} />
      <Route path="arrears" element={<BursarArrearsPage />} />
      <Route path="arrears/*" element={<BursarArrearsPage />} />
      <Route path="invoices" element={<BursarInvoicesPage />} />
      <Route path="invoices/*" element={<BursarInvoicesPage />} />
      <Route path="expenses" element={<BursarExpenseManagementPage />} />
      <Route path="expenses/*" element={<BursarExpenseManagementPage />} />
      <Route path="petty-cash/*" element={<BursarPettyCashPage />} />
      <Route path="payroll" element={<BursarPayrollPage />} />
      <Route path="payroll/runs" element={<BursarPayrollPage />} />
      <Route path="payroll/structures" element={<BursarSalaryStructuresPage />} />
      <Route path="payroll/advances" element={<BursarSalaryAdvancesPage />} />
      <Route path="payroll/payslips" element={<BursarPayrollPage />} />
      <Route path="payroll/*" element={<BursarPayrollPage />} />
      <Route path="budget" element={<BursarBudgetPage />} />
      <Route path="budget/*" element={<BursarBudgetPage />} />
      <Route path="scholarships" element={<BursarScholarshipsPage />} />
      <Route path="scholarships/*" element={<BursarScholarshipsPage />} />
      <Route path="bursaries/*" element={<BursarScholarshipsPage />} />
      <Route path="mpesa" element={<BursarMPESAPage />} />
      <Route path="mpesa/*" element={<BursarMPESAPage />} />
      <Route path="banking" element={<BursarBankingPage />} />
      <Route path="banking/*" element={<BursarBankingPage />} />
      <Route path="fixed-assets" element={<BursarFixedAssetsPage />} />
      <Route path="fixed-assets/*" element={<BursarFixedAssetsPage />} />
      <Route path="analytics/*" element={<BursarAnalyticsPage />} />
      <Route path="student-fees/*" element={<BursarStudentFeesPage />} />
      <Route path="bulk/*" element={<BursarBulkOperationsPage />} />
      <Route path="bulk-operations/*" element={<BursarBulkOperationsPage />} />
      <Route path="audit-compliance/*" element={<BursarAuditPage />} />
      <Route path="projects/*" element={<BursarProjectsPage />} />
      <Route path="reports" element={<BursarFinancialReportsPage />} />
      <Route path="reports/*" element={<BursarFinancialReportsPage />} />
      <Route path="settings" element={<BursarSettingsPage />} />
      <Route path="settings/*" element={<BursarSettingsPage />} />
      <Route path="profile" element={<BursarProfile />} />
      <Route path="notifications" element={<RoleNotificationsPage role="bursar" />} />
      <Route path="messages" element={<RoleNotificationsPage role="bursar" />} />
      <Route path="search" element={<DashboardSearchPage />} />
      <Route path="*" element={<Navigate to="/dashboard/bursar" replace />} />
    </Route>
  );
}

function StoreRoutes() {
  return (
    <Route path="/dashboard/store" element={<StoreKeeperDashboard />}>
      <Route index element={null} />
      <Route path="inventory" element={<StoreKeeperInventoryPage />} />
      <Route path="inventory/add" element={<StoreKeeperInventoryPage />} />
      <Route path="inventory/low-stock" element={<StoreKeeperLowStockPage />} />
      <Route path="inventory/expiring" element={<StoreKeeperExpiringPage />} />
      <Route path="inventory/*" element={<StoreKeeperInventoryPage />} />
      <Route path="categories" element={<StoreKeeperSettingsPage />} />
      <Route path="categories/*" element={<StoreKeeperSettingsPage />} />
      <Route path="requests" element={<StoreKeeperRequestsPage />} />
      <Route path="requests/*" element={<StoreKeeperRequestsPage />} />
      <Route path="issues" element={<StoreKeeperIssuesPage />} />
      <Route path="issues/*" element={<StoreKeeperIssuesPage />} />
      <Route path="returns" element={<StoreKeeperReturnsPage />} />
      <Route path="returns/*" element={<StoreKeeperReturnsPage />} />
      <Route path="movements" element={<StoreKeeperMovementsPage />} />
      <Route path="movements/*" element={<StoreKeeperMovementsPage />} />
      <Route path="purchase-orders" element={<StoreKeeperPurchaseOrdersPage />} />
      <Route path="purchase-orders/*" element={<StoreKeeperPurchaseOrdersPage />} />
      <Route path="deliveries" element={<StoreKeeperDeliveriesPage />} />
      <Route path="deliveries/*" element={<StoreKeeperDeliveriesPage />} />
      <Route path="suppliers" element={<StoreKeeperSuppliersPage />} />
      <Route path="suppliers/*" element={<StoreKeeperSuppliersPage />} />
      <Route path="locations" element={<StoreKeeperLocationsPage />} />
      <Route path="locations/*" element={<StoreKeeperLocationsPage />} />
      <Route path="alerts" element={<StoreKeeperAlertsPage />} />
      <Route path="alerts/*" element={<StoreKeeperAlertsPage />} />
      <Route path="stock-take" element={<StoreKeeperStockTakePage />} />
      <Route path="stock-take/*" element={<StoreKeeperStockTakePage />} />
      <Route path="fixed-assets" element={<StoreKeeperFixedAssetsPage />} />
      <Route path="fixed-assets/*" element={<StoreKeeperFixedAssetsPage />} />
      <Route path="reports" element={<StoreKeeperReportsPage />} />
      <Route path="reports/*" element={<StoreKeeperReportsPage />} />
      <Route path="analytics/*" element={<StoreKeeperReportsPage />} />
      <Route path="audit/*" element={<StoreKeeperReportsPage />} />
      <Route path="settings" element={<StoreKeeperSettingsPage />} />
      <Route path="settings/*" element={<StoreKeeperSettingsPage />} />
      <Route path="profile" element={<StoreKeeperSettingsPage />} />
      <Route path="support" element={<StoreKeeperSettingsPage />} />
      <Route path="notifications" element={<RoleNotificationsPage role="storekeeper" />} />
      <Route path="messages" element={<RoleNotificationsPage role="storekeeper" />} />
      <Route path="search" element={<DashboardSearchPage />} />
      <Route path="*" element={<Navigate to="/dashboard/store" replace />} />
    </Route>
  );
}

function PublicSite() {
  const { content, error } = useLandingContent();

  if (error) {
    return (
      <main className="state-screen">
        <div>
          <p className="eyebrow">API unavailable</p>
          <h1>Unable to load school content.</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  const publicThemeStyle = {
    '--public-bg': content.theme?.background || content.school.primaryColor || '#f8fafc',
    '--public-surface': content.theme?.surface || '#ffffff',
    '--public-panel': content.theme?.background || '#ffffff',
    '--public-text': content.theme?.text || '#0f172a',
    '--public-muted': content.theme?.mutedText || '#64748b',
    '--public-gold': content.theme?.primary || content.school.secondaryColor || '#2563eb',
    '--public-gold-light': content.theme?.primaryLight || '#38bdf8',
    '--public-danger': content.theme?.danger || '#e04545'
  } as CSSProperties;

  return (
    <div className="site-shell public-live-shell" style={publicThemeStyle}>
      <PublicNavbar content={content} />
      <Routes>
        <Route path="/" element={<Home content={content} />} />
        <Route path="/about" element={<About content={content} />} />
        <Route path="/academics" element={<Academics content={content} />} />
        <Route path="/life" element={<Life content={content} />} />
        <Route path="/admissions" element={<Admissions content={content} />} />
        <Route path="/admissions/apply" element={<AdmissionApplication content={content} />} />
        <Route path="/downloads" element={<Downloads content={content} />} />
        <Route path="/gallery" element={<Gallery content={content} />} />
        <Route path="/events" element={<Events content={content} />} />
        <Route path="/contact" element={<Contact content={content} />} />
        <Route path="*" element={<PublicPage content={content} />} />
      </Routes>
      <PublicAdRail content={content} />
      <PublicFooter content={content} />
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute roles={['ADMIN', 'PRINCIPAL', 'DEVELOPER']} />}>
          {AdminRoutes()}
        </Route>
        <Route element={<ProtectedRoute roles={['PARENT']} />}>
          {ParentRoutes()}
        </Route>
        <Route path="/parent/*" element={<LegacyParentRedirect />} />
        <Route path="/dashboard/teacher/*" element={<LegacyTeacherRedirect />} />
        <Route element={<ProtectedRoute roles={['TEACHER']} />}>
          {TeacherRoutes()}
        </Route>
        <Route path="/bursar/*" element={<LegacyBursarRedirect />} />
        <Route element={<ProtectedRoute roles={['BURSAR']} />}>
          {BursarRoutes()}
        </Route>
        <Route path="/storekeeper/*" element={<LegacyStoreRedirect />} />
        <Route element={<ProtectedRoute roles={['STORE_KEEPER']} />}>
          {StoreRoutes()}
        </Route>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          className: 'app-toast',
          success: { duration: 3500 },
          error: { duration: 6000 }
        }}
      />
      <OfflineResilience />
    </>
  );
}
