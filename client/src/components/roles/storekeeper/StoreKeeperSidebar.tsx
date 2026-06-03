// client/src/components/roles/storekeeper/StoreKeeperSidebar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { authService } from '../../../services/api';
import UserAvatar from '../../../components/ui/UserAvatar';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../../i18n/Language';
import i18n from '../../../i18n/i18n';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  FileText,
  Building2,
  MapPin,
  Bell,
  BarChart3,
  ClipboardList,
  Activity,
  Settings,
  User,
  HelpCircle,
  LogOut,
  AlertTriangle,
  Boxes,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Shield,
  Plus,
  Tag,
  Warehouse,
  Clock,
  CheckCircle,
  XCircle,
  PackageCheck,
  PackageX,
  TruckIcon,
  Receipt,
  Users,
  GraduationCap,
  Briefcase,
  AlertCircle,
  BellRing,
  MessageCircle,
  Smartphone,
  Mail,
  MessageSquare,
  Lock,
  Database,
  Download,
  Printer,
  Send,
  BookOpen,
  Flag,
  Percent,
  Grid3x3,
  Barcode,
  Sliders,
  Play,
  RefreshCw,
  RefreshCcw,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const Trash2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PlayIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const navItems: NavItem[] = [
  // SECTION 1: DASHBOARD
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/storekeeper' },
  { id: 'low-stock', label: 'Low Stock Alerts', icon: <AlertTriangle size={20} />, path: '/storekeeper/low-stock' },
  { id: 'out-of-stock', label: 'Out of Stock', icon: <PackageX size={20} />, path: '/storekeeper/out-of-stock' },
  { id: 'expiring', label: 'Expiring Items', icon: <Calendar size={20} />, path: '/storekeeper/expiring' },
  { id: 'reorder-suggestions', label: 'Reorder Suggestions', icon: <TrendingUp size={20} />, path: '/storekeeper/reorder-suggestions' },

  // SECTION 2: INVENTORY MANAGEMENT
  { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, path: '/storekeeper/inventory' },
  { id: 'add-stock', label: 'Add Stock', icon: <Plus size={20} />, path: '/storekeeper/inventory/add' },
  { id: 'categories', label: 'Categories', icon: <Tag size={20} />, path: '/storekeeper/categories' },
  { id: 'storage-locations', label: 'Storage Locations', icon: <Warehouse size={20} />, path: '/storekeeper/locations' },

  // SECTION 3: STOCK REQUESTS
  { id: 'requests', label: 'Stock Requests', icon: <ShoppingCart size={20} />, path: '/storekeeper/requests' },
  { id: 'pending-requests', label: 'Pending Requests', icon: <Clock size={20} />, path: '/storekeeper/requests/pending' },
  { id: 'approved-requests', label: 'Approved Requests', icon: <CheckCircle size={20} />, path: '/storekeeper/requests/approved' },
  { id: 'rejected-requests', label: 'Rejected Requests', icon: <XCircle size={20} />, path: '/storekeeper/requests/rejected' },
  { id: 'completed-requests', label: 'Completed Requests', icon: <PackageCheck size={20} />, path: '/storekeeper/requests/completed' },

  // SECTION 4: ISSUE ITEMS
  { id: 'issues', label: 'Issue Items', icon: <Truck size={20} />, path: '/storekeeper/issues' },
  { id: 'issue-to-teachers', label: 'Issue to Teachers', icon: <Users size={20} />, path: '/storekeeper/issues/teachers' },
  { id: 'issue-to-students', label: 'Issue to Students', icon: <GraduationCap size={20} />, path: '/storekeeper/issues/students' },
  { id: 'issue-to-staff', label: 'Issue to Staff', icon: <Briefcase size={20} />, path: '/storekeeper/issues/staff' },
  { id: 'bulk-issue', label: 'Bulk Issue', icon: <Boxes size={20} />, path: '/storekeeper/issues/bulk' },

  // SECTION 5: RETURNS PROCESSING
  { id: 'returns', label: 'Returns', icon: <RotateCcw size={20} />, path: '/storekeeper/returns' },
  { id: 'overdue-items', label: 'Overdue Items', icon: <AlertCircle size={20} />, path: '/storekeeper/returns/overdue' },
  { id: 'damaged-items', label: 'Damaged Items', icon: <AlertTriangle size={20} />, path: '/storekeeper/returns/damaged' },
  { id: 'lost-items', label: 'Lost Items', icon: <PackageX size={20} />, path: '/storekeeper/returns/lost' },
  { id: 'write-off', label: 'Write-off Items', icon: <Trash2 size={20} />, path: '/storekeeper/returns/write-off' },

  // SECTION 6: PURCHASE ORDERS
  { id: 'purchase-orders', label: 'Purchase Orders', icon: <FileText size={20} />, path: '/storekeeper/purchase-orders' },
  { id: 'create-po', label: 'Create PO', icon: <Plus size={20} />, path: '/storekeeper/purchase-orders/create' },
  { id: 'pending-orders', label: 'Pending Orders', icon: <Clock size={20} />, path: '/storekeeper/purchase-orders/pending' },
  { id: 'received-orders', label: 'Received Orders', icon: <PackageCheck size={20} />, path: '/storekeeper/purchase-orders/received' },
  { id: 'receive-stock', label: 'Receive Stock', icon: <TruckIcon size={20} />, path: '/storekeeper/purchase-orders/receive' },
  { id: 'goods-received-note', label: 'Goods Received Note', icon: <Receipt size={20} />, path: '/storekeeper/purchase-orders/grn' },

  // SECTION 7: SUPPLIER MANAGEMENT
  { id: 'suppliers', label: 'Suppliers', icon: <Building2 size={20} />, path: '/storekeeper/suppliers' },
  { id: 'add-supplier', label: 'Add Supplier', icon: <Plus size={20} />, path: '/storekeeper/suppliers/add' },
  { id: 'supplier-performance', label: 'Supplier Performance', icon: <Award size={20} />, path: '/storekeeper/suppliers/performance' },

  // SECTION 8: ALERTS & NOTIFICATIONS
  { id: 'alerts', label: 'Alerts', icon: <Bell size={20} />, path: '/storekeeper/alerts' },
  { id: 'low-stock-alerts', label: 'Low Stock Alerts', icon: <AlertTriangle size={20} />, path: '/storekeeper/alerts/low-stock' },
  { id: 'expiry-alerts', label: 'Expiry Alerts', icon: <Calendar size={20} />, path: '/storekeeper/alerts/expiry' },
  { id: 'overstock-alerts', label: 'Overstock Alerts', icon: <AlertCircle size={20} />, path: '/storekeeper/alerts/overstock' },
  { id: 'notifications', label: 'Notifications', icon: <BellRing size={20} />, path: '/storekeeper/notifications' },

  // SECTION 9: REPORTS & ANALYTICS
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, path: '/storekeeper/reports' },
  { id: 'stock-reports', label: 'Stock Reports', icon: <Package size={20} />, path: '/storekeeper/reports/stock' },
  { id: 'movement-reports', label: 'Movement Reports', icon: <Activity size={20} />, path: '/storekeeper/reports/movements' },
  { id: 'financial-reports', label: 'Financial Reports', icon: <DollarSign size={20} />, path: '/storekeeper/reports/financial' },
  { id: 'export-reports', label: 'Export Reports', icon: <Download size={20} />, path: '/storekeeper/reports/export' },

  // SECTION 10: STOCK TAKING (AUDIT)
  { id: 'stock-take', label: 'Stock Take', icon: <ClipboardList size={20} />, path: '/storekeeper/stock-take' },
  { id: 'physical-count', label: 'Physical Count', icon: <CheckCircle size={20} />, path: '/storekeeper/stock-take/count' },
  { id: 'reconciliation', label: 'Reconciliation', icon: <RefreshCcw size={20} />, path: '/storekeeper/stock-take/reconciliation' },
  { id: 'cycle-counting', label: 'Cycle Counting', icon: <RotateCcw size={20} />, path: '/storekeeper/stock-take/cycle' },
  { id: 'variance-report', label: 'Variance Report', icon: <AlertTriangle size={20} />, path: '/storekeeper/stock-take/variance' },

  // SECTION 11: STOCK MOVEMENTS HISTORY
  { id: 'movements', label: 'Movements', icon: <Activity size={20} />, path: '/storekeeper/movements' },
  { id: 'transaction-log', label: 'Transaction Log', icon: <FileText size={20} />, path: '/storekeeper/movements/log' },
  { id: 'export-movements', label: 'Export Movements', icon: <Download size={20} />, path: '/storekeeper/movements/export' },

  // SECTION 12: STORAGE MANAGEMENT
  { id: 'storage-management', label: 'Storage Management', icon: <Warehouse size={20} />, path: '/storekeeper/storage' },
  { id: 'location-map', label: 'Location Map', icon: <MapPin size={20} />, path: '/storekeeper/storage/map' },
  { id: 'location-occupancy', label: 'Location Occupancy', icon: <Percent size={20} />, path: '/storekeeper/storage/occupancy' },
  { id: 'space-optimization', label: 'Space Optimization', icon: <Grid3x3 size={20} />, path: '/storekeeper/storage/optimization' },

  // SECTION 13: BARCODE SYSTEM
  { id: 'barcode', label: 'Barcode System', icon: <Barcode size={20} />, path: '/storekeeper/barcode' },
  { id: 'generate-barcodes', label: 'Generate Barcodes', icon: <Plus size={20} />, path: '/storekeeper/barcode/generate' },
  { id: 'print-labels', label: 'Print Labels', icon: <Printer size={20} />, path: '/storekeeper/barcode/print' },

  // SECTION 14: COMMUNICATION
  { id: 'communication', label: 'Communication', icon: <MessageCircle size={20} />, path: '/storekeeper/communication' },
  { id: 'send-sms', label: 'Send SMS', icon: <Smartphone size={20} />, path: '/storekeeper/communication/sms' },
  { id: 'send-email', label: 'Send Email', icon: <Mail size={20} />, path: '/storekeeper/communication/email' },
  { id: 'send-whatsapp', label: 'Send WhatsApp', icon: <MessageSquare size={20} />, path: '/storekeeper/communication/whatsapp' },

  // SECTION 15: SETTINGS
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/storekeeper/settings' },
  { id: 'store-settings', label: 'Store Settings', icon: <Sliders size={20} />, path: '/storekeeper/settings/store' },
  { id: 'user-preferences', label: 'User Preferences', icon: <User size={20} />, path: '/storekeeper/settings/preferences' },
  { id: 'backup-restore', label: 'Backup & Restore', icon: <Database size={20} />, path: '/storekeeper/settings/backup' },

  // SECTION 16: MY PROFILE
  { id: 'profile', label: 'My Profile', icon: <User size={20} />, path: '/storekeeper/profile' },
  { id: 'change-password', label: 'Change Password', icon: <Lock size={20} />, path: '/storekeeper/profile/change-password' },
  { id: 'activity-log', label: 'My Activity Log', icon: <Activity size={20} />, path: '/storekeeper/profile/activity' },

  // SECTION 17: SUPPORT
  { id: 'support', label: 'Support', icon: <HelpCircle size={20} />, path: '/storekeeper/support' },
  { id: 'help-documentation', label: 'Help Documentation', icon: <BookOpen size={20} />, path: '/storekeeper/support/help' },
  { id: 'video-tutorials', label: 'Video Tutorials', icon: <PlayIcon size={20} />, path: '/storekeeper/support/tutorials' },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={20} />, path: '/storekeeper/support/faq' },
  { id: 'submit-ticket', label: 'Submit Ticket', icon: <Send size={20} />, path: '/storekeeper/support/ticket' },
  { id: 'system-status', label: 'System Status', icon: <Activity size={20} />, path: '/storekeeper/support/status' },
  { id: 'printer-setup', label: 'Printer Setup', icon: <Printer size={20} />, path: '/storekeeper/support/printer' },
];

// Group nav items by section
const navSections = [
  { title: 'DASHBOARD', items: ['dashboard', 'low-stock', 'out-of-stock', 'expiring', 'reorder-suggestions'] },
  { title: 'INVENTORY MANAGEMENT', items: ['inventory', 'add-stock', 'categories', 'storage-locations'] },
  { title: 'STOCK REQUESTS', items: ['requests', 'pending-requests', 'approved-requests', 'rejected-requests', 'completed-requests'] },
  { title: 'ISSUE ITEMS', items: ['issues', 'issue-to-teachers', 'issue-to-students', 'issue-to-staff', 'bulk-issue'] },
  { title: 'RETURNS PROCESSING', items: ['returns', 'overdue-items', 'damaged-items', 'lost-items', 'write-off'] },
  { title: 'PURCHASE ORDERS', items: ['purchase-orders', 'create-po', 'pending-orders', 'received-orders', 'receive-stock', 'goods-received-note'] },
  { title: 'SUPPLIER MANAGEMENT', items: ['suppliers', 'add-supplier', 'supplier-performance'] },
  { title: 'ALERTS & NOTIFICATIONS', items: ['alerts', 'low-stock-alerts', 'expiry-alerts', 'overstock-alerts', 'notifications'] },
  { title: 'REPORTS & ANALYTICS', items: ['reports', 'stock-reports', 'movement-reports', 'financial-reports', 'export-reports'] },
  { title: 'STOCK TAKING (AUDIT)', items: ['stock-take', 'physical-count', 'reconciliation', 'cycle-counting', 'variance-report'] },
  { title: 'STOCK MOVEMENTS', items: ['movements', 'transaction-log', 'export-movements'] },
  { title: 'STORAGE MANAGEMENT', items: ['storage-management', 'location-map', 'location-occupancy', 'space-optimization'] },
  { title: 'BARCODE SYSTEM', items: ['barcode', 'generate-barcodes', 'print-labels'] },
  { title: 'COMMUNICATION', items: ['communication', 'send-sms', 'send-email', 'send-whatsapp'] },
  { title: 'SETTINGS', items: ['settings', 'store-settings', 'user-preferences', 'backup-restore'] },
  { title: 'MY PROFILE', items: ['profile', 'change-password', 'activity-log'] },
  { title: 'SUPPORT', items: ['support', 'help-documentation', 'video-tutorials', 'faq', 'submit-ticket', 'system-status', 'printer-setup'] },
];

const getActiveItemFromPath = (pathname: string): string => {
  const match = navItems.find(item => pathname === item.path || pathname.startsWith(item.path + '/'));
  return match?.id || 'dashboard';
};



export default function StoreKeeperSidebar() {
  const { user, logout } = useAuth();
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
      title: 'Log out?',
      message: 'Your current session will end and you will be redirected to the login page.',
      confirmText: 'Log out',
      type: 'warning',
    });
    if (!confirmed) return;
    try {
      await authService.logout();
    } catch {
      // Continue to clear local state even if backend logout fails.
    }
    logout();
    navigate('/login');
  };

  const getBadgeCount = (itemId: string): number => {
    // These would come from your API in production
    if (itemId === 'low-stock-alerts') return 12;
    if (itemId === 'expiry-alerts') return 5;
    if (itemId === 'pending-requests') return 8;
    if (itemId === 'overdue-items') return 3;
    return 0;
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
        <span className="font-semibold text-gray-900 dark:text-white text-lg">StoreHub</span>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        <UserAvatar
          src={user?.avatar}
          name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Store Keeper'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Store Keeper</p>
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