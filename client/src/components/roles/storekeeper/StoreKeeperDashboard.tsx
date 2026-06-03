import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Home,
  MapPin,
  MessageSquare,
  Package,
  PackagePlus,
  RefreshCw,
  Repeat,
  RotateCcw,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Printer,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Star,
  Flame,
  Zap,
  Award,
  Crown,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Gauge,
  Target,
  Flag,
  Activity,
  PieChart,
  LineChart,
  GripVertical,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  PlusCircle,
  MinusCircle,
  Send,
  Mail,
  Phone,
  MessageCircle,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  Battery,
  BatteryCharging,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Navigation,
  Map,
  Layers,
  Grid,
  ListChecks,
  ClipboardCheck as ClipboardCheckIcon,
  Receipt,
  CreditCard,
  Wallet,
  Percent,
  Calculator,
  Activity as ActivityIcon,
  Gauge as GaugeIcon,
  Target as TargetIcon,
  Flag as FlagIcon,
  Award as AwardIcon,
  Crown as CrownIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import RoleShell, { type RoleNavItem } from '../shared/RoleShell';
import { useAuth } from '../../../hooks/useAuth';
import storeKeeperService from '../../../services/storeKeeperService';
import type { StoreKeeperDashboard as StoreKeeperDashboardType, DashboardStats, RecentActivity, TopMovingItem } from '../../../types/storeKeeper';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Modal } from '../../ui/Modal';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// Navigation Items - Complete based on requirements
const storeKeeperNavItems: RoleNavItem[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard/store', category: 'Overview' },
  
  // Stock Management
  { id: 'inventory', label: 'Stock Items', icon: Boxes, path: '/dashboard/store/inventory', category: 'Stock Management' },
  { id: 'add-stock', label: 'Add Stock', icon: PackagePlus, path: '/dashboard/store/inventory/add', category: 'Stock Management' },
  { id: 'categories', label: 'Categories', icon: Grid, path: '/dashboard/store/categories', category: 'Stock Management' },
  { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, path: '/dashboard/store/inventory/low-stock', category: 'Stock Management' },
  { id: 'expiring', label: 'Expiring Stock', icon: Calendar, path: '/dashboard/store/inventory/expiring', category: 'Stock Management' },
  { id: 'fixed-assets', label: 'Fixed Assets', icon: Archive, path: '/dashboard/store/fixed-assets', category: 'Stock Management' },
  { id: 'storage-locations', label: 'Storage Locations', icon: MapPin, path: '/dashboard/store/locations', category: 'Stock Management' },
  
  // Operations
  { id: 'requests', label: 'Stock Requests', icon: ClipboardList, path: '/dashboard/store/requests', category: 'Operations' },
  { id: 'issue-items', label: 'Issue Items', icon: Package, path: '/dashboard/store/issues', category: 'Operations' },
  { id: 'returns', label: 'Returns', icon: RotateCcw, path: '/dashboard/store/returns', category: 'Operations' },
  { id: 'movements', label: 'Stock Movements', icon: Repeat, path: '/dashboard/store/movements', category: 'Operations' },
  
  // Procurement
  { id: 'suppliers', label: 'Suppliers', icon: Users, path: '/dashboard/store/suppliers', category: 'Procurement' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, path: '/dashboard/store/purchase-orders', category: 'Procurement' },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, path: '/dashboard/store/deliveries', category: 'Procurement' },
  
  // Control & Audit
  { id: 'stock-take', label: 'Stock Take', icon: ClipboardCheck, path: '/dashboard/store/stock-take', category: 'Control' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardCheckIcon, path: '/dashboard/store/audit', category: 'Control' },
  
  // Insights
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/dashboard/store/alerts', category: 'Insights' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/dashboard/store/reports', category: 'Reports' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/dashboard/store/analytics', category: 'Reports' },
  
  // Communication
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/store/messages', category: 'Communication' },
  { id: 'notifications', label: 'Notifications', icon: BellRing, path: '/dashboard/store/notifications', category: 'Communication' },
  
  // Account
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/store/settings', category: 'Account' },
  { id: 'profile', label: 'My Profile', icon: Users, path: '/dashboard/store/profile', category: 'Account' },
  { id: 'support', label: 'Support', icon: MessageCircle, path: '/dashboard/store/support', category: 'Account' },
];

const StoreKeeperDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<StoreKeeperDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showQuickStats, setShowQuickStats] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [showMovements, setShowMovements] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await storeKeeperService.dashboard.getDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await storeKeeperService.notifications.getNotifications(true);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData, loadNotifications]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return colors[priority] || colors.normal;
  };

  const getStockStatusColor = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return 'text-red-600 dark:text-red-400 font-bold';
    if (quantity <= reorderLevel) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const isDashboardHome = location.pathname.replace(/\/+$/, '') === '/dashboard/store';

  if (loading) {
    return (
      <RoleShell roleName="Store Keeper" title="Inventory Dashboard" navItems={storeKeeperNavItems} loading>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" showLabel label="Loading dashboard..." />
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell
      roleName="Store Keeper"
      title="Inventory Dashboard"
      subtitle={`Welcome back, ${user?.firstName || 'Store Keeper'}! ${new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      navItems={storeKeeperNavItems}
      notificationCount={notifications.length}
      onNotificationsClick={() => navigate('/dashboard/store/notifications')}
      actions={(
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('p-1.5 rounded transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-1.5 rounded transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadDashboardData(true)} isLoading={refreshing}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/store/reports')}>
            <Download className="w-4 h-4 mr-1" />
            Reports
          </Button>
        </div>
      )}
    >
      <div className="storekeeper-dashboard role-dashboard-surface">
        <div className="dashboard-content space-y-6">
          {isDashboardHome && dashboardData ? (
            <>
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Low Stock Card */}
                <Card className="hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.quickStats.lowStockCount}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">Critical: {dashboardData.quickStats.criticalStockCount}</p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Need immediate reorder</p>
                  </div>
                </Card>

                {/* Pending Requests Card */}
                <Card className="hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {dashboardData.quickStats.pendingRequestsCount}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Awaiting fulfillment</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Urgent: {dashboardData.quickStats.urgentRequestsCount}</p>
                  </div>
                </Card>

                {/* Total Stock Value Card */}
                <Card className="hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Stock Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardData.quickStats.totalValue)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{dashboardData.quickStats.totalItems} total items</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span>Movement trend</span>
                      {getTrendIcon(dashboardData.quickStats.trend)}
                      <span>{dashboardData.quickStats.trendPercentage}% vs last month</span>
                    </div>
                  </div>
                </Card>

                {/* Overdue Returns Card */}
                <Card className="hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Returns</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboardData.quickStats.overdueBorrowingsCount}
                      </p>
                      <p className="text-xs text-red-600 mt-1">Need follow-up</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <RotateCcw className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">Late fees: {formatCurrency(dashboardData.quickStats.lateFeesAccrued || 0)}</p>
                  </div>
                </Card>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.quickStats.monthlyIssuedValue || 0}</p>
                  <p className="text-xs text-gray-500">Monthly Issued Value</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.quickStats.monthlyReceivedValue || 0}</p>
                  <p className="text-xs text-gray-500">Monthly Received Value</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.quickStats.stockTurnoverRate || 0}%</p>
                  <p className="text-xs text-gray-500">Stock Turnover Rate</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.quickStats.averageRequestTime || 0} hrs</p>
                  <p className="text-xs text-gray-500">Avg Request Processing</p>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Low Stock Alerts */}
                  {showLowStock && dashboardData.lowStockItems && dashboardData.lowStockItems.length > 0 && (
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate('/dashboard/store/inventory/low-stock')}
                          >
                            View All
                          </Button>
                          <button onClick={() => setShowLowStock(false)} className="text-gray-400">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.lowStockItems.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span>Current: <strong className={getStockStatusColor(item.quantity, item.reorderLevel)}>{item.quantity}</strong></span>
                                <span>Reorder Level: {item.reorderLevel}</span>
                                <span>Category: {item.category}</span>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => navigate(`/dashboard/store/purchase-orders/create?item=${item.id}`)}>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Reorder
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Pending Requests */}
                  {showRequests && dashboardData.pendingRequests && dashboardData.pendingRequests.length > 0 && (
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-blue-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/store/requests')}>
                            View All
                          </Button>
                          <button onClick={() => setShowRequests(false)} className="text-gray-400">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr className="text-left text-sm">
                              <th className="pb-2 font-semibold">Request #</th>
                              <th className="pb-2 font-semibold">Requester</th>
                              <th className="pb-2 font-semibold">Items</th>
                              <th className="pb-2 font-semibold">Priority</th>
                              <th className="pb-2 font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {dashboardData.pendingRequests.slice(0, 5).map(request => (
                              <tr key={request.id} className="text-sm">
                                <td className="py-3">{request.requestNumber}</td>
                                <td className="py-3">
                                  <div>
                                    <p className="font-medium">{request.requesterName}</p>
                                    <p className="text-xs text-gray-500">{request.requesterRole}</p>
                                  </div>
                                </td>
                                <td className="py-3">{request.items?.length || 0} items</td>
                                <td className="py-3">
                                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getPriorityColor(request.priority))}>
                                    {request.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <Button size="sm" onClick={() => navigate(`/dashboard/store/requests/${request.id}`)}>
                                    Process
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Expiring Items */}
                  {dashboardData.expiringItems && dashboardData.expiringItems.length > 0 && (
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Expiring Items</h3>
                          <span className="text-xs text-purple-600">({dashboardData.expiring7DaysCount || 0} expiring in 7 days)</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/store/inventory/expiring')}>
                          View All
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {dashboardData.expiringItems.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span>Quantity: {item.quantity}</span>
                                <span className={clsx(
                                  new Date(item.expiryDate) < new Date() ? 'text-red-600' : 'text-orange-600'
                                )}>
                                  Expires: {formatDate(item.expiryDate)}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/store/inventory/edit/${item.id}`)}>
                              Update
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Top Moving Items */}
                  {dashboardData.topMovingItems && dashboardData.topMovingItems.length > 0 && (
                    <Card>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Top Moving Items</h3>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.topMovingItems.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                <span className="text-sm text-gray-500">{item.issuedCount} issued</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-green-600 rounded-full h-1.5"
                                  style={{ width: `${(item.issuedCount / dashboardData.topMovingItems[0].issuedCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Quick Actions Grid */}
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                      <Button size="sm" variant="ghost" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                      </Button>
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/dashboard/store/inventory/add')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <PackagePlus className="w-6 h-6 text-blue-600" />
                          <span className="text-sm font-medium">Add Stock</span>
                        </button>
                        <button onClick={() => navigate('/dashboard/store/requests')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <ClipboardList className="w-6 h-6 text-green-600" />
                          <span className="text-sm font-medium">Process Requests</span>
                        </button>
                        <button onClick={() => navigate('/dashboard/store/purchase-orders/create')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <ShoppingCart className="w-6 h-6 text-purple-600" />
                          <span className="text-sm font-medium">Create Order</span>
                        </button>
                        <button onClick={() => navigate('/dashboard/store/stock-take')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <ClipboardCheck className="w-6 h-6 text-orange-600" />
                          <span className="text-sm font-medium">Stock Take</span>
                        </button>
                        <button onClick={() => navigate('/dashboard/store/returns')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <RotateCcw className="w-6 h-6 text-red-600" />
                          <span className="text-sm font-medium">Process Returns</span>
                        </button>
                        <button onClick={() => navigate('/dashboard/store/reports')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <BarChart3 className="w-6 h-6 text-teal-600" />
                          <span className="text-sm font-medium">View Reports</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[
                          { icon: PackagePlus, label: 'Add New Stock', path: '/dashboard/store/inventory/add', color: 'blue' },
                          { icon: ClipboardList, label: 'Process Pending Requests', path: '/dashboard/store/requests', color: 'green' },
                          { icon: ShoppingCart, label: 'Create Purchase Order', path: '/dashboard/store/purchase-orders/create', color: 'purple' },
                          { icon: ClipboardCheck, label: 'Start Stock Take', path: '/dashboard/store/stock-take', color: 'orange' },
                          { icon: RotateCcw, label: 'Process Returns', path: '/dashboard/store/returns', color: 'red' },
                          { icon: BarChart3, label: 'Generate Reports', path: '/dashboard/store/reports', color: 'teal' },
                        ].map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigate(action.path)}
                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >
                            <action.icon className={clsx('w-5 h-5', `text-${action.color}-600`)} />
                            <span className="text-sm">{action.label}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Recent Stock Movements */}
                  {showMovements && dashboardData.recentMovements && dashboardData.recentMovements.length > 0 && (
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-5 h-5 text-gray-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Movements</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/store/movements')}>
                            View All
                          </Button>
                          <button onClick={() => setShowMovements(false)} className="text-gray-400">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dashboardData.recentMovements.slice(0, 5).map(movement => (
                          <div key={movement.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
                            <div className={clsx('p-2 rounded-lg', 
                              movement.movementType === 'issue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                              movement.movementType === 'return' ? 'bg-green-100 dark:bg-green-900/30' :
                              'bg-gray-100 dark:bg-gray-700'
                            )}>
                              {movement.movementType === 'issue' && <Package className="w-4 h-4 text-blue-600" />}
                              {movement.movementType === 'return' && <RotateCcw className="w-4 h-4 text-green-600" />}
                              {movement.movementType === 'transfer' && <Repeat className="w-4 h-4 text-gray-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{movement.itemName}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{movement.movementType.toUpperCase()}</span>
                                <span>{movement.quantity} units</span>
                                <span>{formatDate(movement.createdAt)}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{movement.referenceNumber}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Reorder Suggestions */}
                  {dashboardData.reorderSuggestions && dashboardData.reorderSuggestions.length > 0 && (
                    <Card className="border-l-4 border-l-green-500">
                      <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Generated Reorder Suggestions</h3>
                      </div>
                      <div className="space-y-2">
                        {dashboardData.reorderSuggestions.slice(0, 4).map(suggestion => (
                          <div key={suggestion.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{suggestion.itemName}</p>
                              <p className="text-xs text-gray-500">{suggestion.reason}</p>
                            </div>
                            <Button size="sm" onClick={() => navigate(`/dashboard/store/purchase-orders/create?suggestion=${suggestion.id}`)}>
                              Create PO
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="nested-routes route-page-only">
              <Outlet />
            </div>
          )}
        </div>
      </div>
    </RoleShell>
  );
};

export default StoreKeeperDashboard;