import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  Receipt,
  RefreshCw,
  Settings,
  Smartphone,
  Users,
  WalletCards,
} from 'lucide-react';
import RoleShell, { type RoleNavItem } from '../shared/RoleShell';
import { useAuth } from '../../../hooks/useAuth';
import bursarService from '../../../services/bursarService';
import type { BursarDashboard as BursarDashboardType } from '../../../types/bursar';

const bursarNavItems: RoleNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard/bursar', category: 'Overview' },
  { id: 'fees', label: 'Fee Management', icon: CreditCard, path: '/dashboard/bursar/fees', category: 'Finance' },
  { id: 'payments', label: 'Record Payments', icon: Receipt, path: '/dashboard/bursar/fees/payments', category: 'Finance' },
  { id: 'arrears', label: 'Arrears Management', icon: WalletCards, path: '/dashboard/bursar/fees/arrears', category: 'Finance' },
  { id: 'expenses', label: 'Expenses', icon: Calculator, path: '/dashboard/bursar/expenses', category: 'Finance' },
  { id: 'payroll', label: 'Payroll', icon: Users, path: '/dashboard/bursar/payroll', category: 'Operations' },
  { id: 'budget', label: 'Budget', icon: BarChart3, path: '/dashboard/bursar/budget', category: 'Operations' },
  { id: 'scholarships', label: 'Scholarships', icon: GraduationCap, path: '/dashboard/bursar/scholarships', category: 'Support' },
  { id: 'mpesa', label: 'MPESA', icon: Smartphone, path: '/dashboard/bursar/mpesa', category: 'Banking' },
  { id: 'banking', label: 'Banking', icon: Landmark, path: '/dashboard/bursar/banking', category: 'Banking' },
  { id: 'assets', label: 'Fixed Assets', icon: Building2, path: '/dashboard/bursar/fixed-assets', category: 'Control' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/dashboard/bursar/reports', category: 'Reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/bursar/settings', category: 'Account' },
];

const BursarDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<BursarDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await bursarService.dashboard.getDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await bursarService.notifications.getNotifications(true);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDashboardHome = location.pathname.replace(/\/+$/, '') === '/dashboard/bursar';

  if (loading) {
    return <RoleShell roleName="Bursar" title="Financial Dashboard" navItems={bursarNavItems} loading> </RoleShell>;
  }

  return (
    <RoleShell
      roleName="Bursar"
      title="Financial Dashboard"
      subtitle={`Welcome back, ${user?.firstName || 'Bursar'}`}
      navItems={bursarNavItems}
      notificationCount={notifications.length}
      onNotificationsClick={() => setNotifications([])}
      actions={(
        <button className="btn btn-secondary" onClick={() => loadDashboardData()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      )}
    >
      <div className="bursar-dashboard role-dashboard-surface">
        <div className="dashboard-content">
          {isDashboardHome && dashboardData ? (
            <>
              {/* Quick Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Today's Collections</span>
                    <span className="stat-value">{formatCurrency(dashboardData.quickStats.totalCollectedToday)}</span>
                    <span className="stat-change positive">+12% from yesterday</span>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Total Arrears</span>
                    <span className="stat-value">{formatCurrency(dashboardData.quickStats.totalArrears)}</span>
                    <span className="stat-change negative">15 students in arrears</span>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Monthly Collections</span>
                    <span className="stat-value">{formatCurrency(dashboardData.quickStats.totalCollectedThisMonth)}</span>
                    <span className="stat-change positive">85% collection rate</span>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Monthly Expenses</span>
                    <span className="stat-value">{formatCurrency(dashboardData.quickStats.totalExpensesThisMonth)}</span>
                    <span className="stat-change">Within budget</span>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="dashboard-grid">
                {/* Left Column */}
                <div className="dashboard-column">
                  {/* Recent Payments */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3>Recent Payments</h3>
                      <a href="/dashboard/bursar/fees/payments" className="card-link">View All</a>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentPayments.slice(0, 5).map(payment => (
                              <tr key={payment.id}>
                                <td>
                                  <div className="student-info">
                                    <span className="student-name">{payment.studentName}</span>
                                    <span className="student-class">{payment.className}</span>
                                  </div>
                                </td>
                                <td className="amount">{formatCurrency(payment.amount)}</td>
                                <td>
                                  <span className={`badge badge-${payment.paymentMethod}`}>
                                    {payment.paymentMethod.toUpperCase()}
                                  </span>
                                </td>
                                <td>{formatDate(payment.paymentDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Pending Arrears */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3>Pending Arrears</h3>
                      <a href="/dashboard/bursar/fees/arrears" className="card-link">View All</a>
                    </div>
                    <div className="card-body">
                      <div className="arrears-list">
                        {dashboardData.pendingArrears.slice(0, 4).map(student => (
                          <div key={student.studentId} className="arrear-item">
                            <div className="arrear-info">
                              <span className="arrear-name">{student.studentName}</span>
                              <span className="arrear-class">{student.className}</span>
                            </div>
                            <div className="arrear-amount">{formatCurrency(student.arrears)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="dashboard-column">
                  {/* Quick Actions */}
                  <div className="dashboard-card quick-actions">
                    <div className="card-header">
                      <h3>Quick Actions</h3>
                    </div>
                    <div className="card-body">
                      <div className="actions-grid">
                        <a href="/dashboard/bursar/fees/payments" className="action-btn">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Record Payment</span>
                        </a>
                        <a href="/dashboard/bursar/expenses/record" className="action-btn">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>Record Expense</span>
                        </a>
                        <a href="/dashboard/bursar/reports/financial" className="action-btn">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Generate Report</span>
                        </a>
                        <a href="/dashboard/bursar/payroll/runs" className="action-btn">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Process Payroll</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Budget Alerts */}
                  {dashboardData.budgetAlerts.length > 0 && (
                    <div className="dashboard-card alerts-card">
                      <div className="card-header">
                        <h3>Budget Alerts</h3>
                        <a href="/dashboard/bursar/budget/reports" className="card-link">View All</a>
                      </div>
                      <div className="card-body">
                        {dashboardData.budgetAlerts.map((alert, index) => (
                          <div key={index} className={`alert-item alert-${alert.severity}`}>
                            <div className="alert-content">
                              <span className="alert-title">{alert.department}</span>
                              <span className="alert-message">
                                {alert.percentage}% of budget used
                              </span>
                            </div>
                            <div className="alert-progress">
                              <div
                                className="progress-bar"
                                style={{ width: `${alert.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MPESA Reconciliation */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3>MPESA Reconciliation</h3>
                      <a href="/dashboard/bursar/mpesa/reconcile" className="card-link">Reconcile</a>
                    </div>
                    <div className="card-body">
                      <div className="reconciliation-stats">
                        <div className="recon-stat">
                          <span className="recon-label">Unmatched</span>
                          <span className="recon-value warning">
                            {dashboardData.mpesaReconciliation.totalUnmatched}
                          </span>
                        </div>
                        <div className="recon-stat">
                          <span className="recon-label">Matched</span>
                          <span className="recon-value success">
                            {dashboardData.mpesaReconciliation.totalMatched}
                          </span>
                        </div>
                        <div className="recon-stat">
                          <span className="recon-label">Total Amount</span>
                          <span className="recon-value">
                            {formatCurrency(dashboardData.mpesaReconciliation.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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

export default BursarDashboard;
