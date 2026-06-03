import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const BursarSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard', 'fee-structure', 'fee-collection', 'arrears-management', 'expenses', 'petty-cash', 'payroll', 'budget', 'mpesa', 'banking', 'scholarships', 'invoices', 'reports', 'analytics', 'student-fees', 'bulk-operations', 'audit-compliance', 'fixed-assets', 'project-financing', 'settings']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard/bursar',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'fee-structure',
      label: 'Fee Structure',
      path: '/dashboard/bursar/fees',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      children: [
        { id: 'fee-structures', label: 'Fee Structures', path: '/dashboard/bursar/fees/structures', icon: null },
        { id: 'fee-categories', label: 'Fee Categories', path: '/dashboard/bursar/fees/categories', icon: null },
        { id: 'payment-terms', label: 'Payment Terms', path: '/dashboard/bursar/fees/terms', icon: null },
      ],
    },
    {
      id: 'fee-collection',
      label: 'Fee Collection',
      path: '/dashboard/bursar/fee-collection',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      children: [
        { id: 'record-payment', label: 'Record Payment', path: '/dashboard/bursar/fee-collection/record', icon: null },
        { id: 'receipts', label: 'Receipts', path: '/dashboard/bursar/fee-collection/receipts', icon: null },
        { id: 'payment-history', label: 'Payment History', path: '/dashboard/bursar/fee-collection/history', icon: null },
      ],
    },
    {
      id: 'arrears-management',
      label: 'Arrears Management',
      path: '/dashboard/bursar/arrears',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.93 5.414A7.5 7.5 0 0112 20.5a7.5 7.5 0 016.93-10.086A7.5 7.5 0 0112 2.5a7.5 7.5 0 01-6.93 7.414A7.5 7.5 0 0112 20.5z" />
        </svg>
      ),
      children: [
        { id: 'arrears-list', label: 'Arrears List', path: '/dashboard/bursar/arrears/list', icon: null },
        { id: 'aging-report', label: 'Aging Report', path: '/dashboard/bursar/arrears/aging', icon: null },
        { id: 'payment-plans', label: 'Payment Plans', path: '/dashboard/bursar/arrears/payment-plans', icon: null },
        { id: 'reminders', label: 'Reminders', path: '/dashboard/bursar/arrears/reminders', icon: null },
      ],
    },
    {
      id: 'expenses',
      label: 'Expenses',
      path: '/dashboard/bursar/expenses',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      children: [
        { id: 'all-expenses', label: 'All Expenses', path: '/dashboard/bursar/expenses/list', icon: null },
        { id: 'record-expense', label: 'Record Expense', path: '/dashboard/bursar/expenses/record', icon: null },
        { id: 'expense-categories', label: 'Expense Categories', path: '/dashboard/bursar/expenses/categories', icon: null },
        { id: 'expense-reports', label: 'Expense Reports', path: '/dashboard/bursar/expenses/reports', icon: null },
      ],
    },
    {
      id: 'petty-cash',
      label: 'Petty Cash',
      path: '/dashboard/bursar/petty-cash',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      children: [
        { id: 'petty-cash-float', label: 'Petty Cash Float', path: '/dashboard/bursar/petty-cash/float', icon: null },
        { id: 'petty-record-expense', label: 'Record Expense', path: '/dashboard/bursar/petty-cash/record', icon: null },
        { id: 'reconciliation', label: 'Reconciliation', path: '/dashboard/bursar/petty-cash/reconciliation', icon: null },
        { id: 'petty-reports', label: 'Reports', path: '/dashboard/bursar/petty-cash/reports', icon: null },
      ],
    },
    {
      id: 'payroll',
      label: 'Payroll',
      path: '/dashboard/bursar/payroll',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      children: [
        { id: 'process-payroll', label: 'Process Payroll', path: '/dashboard/bursar/payroll/process', icon: null },
        { id: 'salary-structures', label: 'Salary Structures', path: '/dashboard/bursar/payroll/structures', icon: null },
        { id: 'salary-advances', label: 'Salary Advances', path: '/dashboard/bursar/payroll/advances', icon: null },
        { id: 'payslips', label: 'Payslips', path: '/dashboard/bursar/payroll/payslips', icon: null },
        { id: 'payroll-runs', label: 'Payroll Runs', path: '/dashboard/bursar/payroll/runs', icon: null },
      ],
    },
    {
      id: 'budget',
      label: 'Budget',
      path: '/dashboard/bursar/budget',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      children: [
        { id: 'budget-list', label: 'Budget List', path: '/dashboard/bursar/budget/list', icon: null },
        { id: 'create-budget', label: 'Create Budget', path: '/dashboard/bursar/budget/create', icon: null },
        { id: 'budget-reports', label: 'Budget Reports', path: '/dashboard/bursar/budget/reports', icon: null },
        { id: 'budget-variance', label: 'Budget Variance', path: '/dashboard/bursar/budget/variance', icon: null },
      ],
    },
    {
      id: 'mpesa',
      label: 'MPESA',
      path: '/dashboard/bursar/mpesa',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      badge: 5,
      children: [
        { id: 'mpesa-transactions', label: 'Transactions', path: '/dashboard/bursar/mpesa/transactions', icon: null },
        { id: 'mpesa-reconcile', label: 'Reconciliation', path: '/dashboard/bursar/mpesa/reconcile', icon: null },
      ],
    },
    {
      id: 'banking',
      label: 'Banking',
      path: '/dashboard/bursar/banking',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      children: [
        { id: 'bank-accounts', label: 'Bank Accounts', path: '/dashboard/bursar/banking/accounts', icon: null },
        { id: 'bank-reconciliation', label: 'Reconciliation', path: '/dashboard/bursar/banking/reconciliation', icon: null },
        { id: 'bank-statements', label: 'Statements', path: '/dashboard/bursar/banking/statements', icon: null },
      ],
    },
    {
      id: 'scholarships',
      label: 'Scholarships & Bursaries',
      path: '/dashboard/bursar/scholarships',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      ),
      children: [
        { id: 'scholarships-list', label: 'Scholarships', path: '/dashboard/bursar/scholarships/list', icon: null },
        { id: 'bursaries-list', label: 'Bursaries', path: '/dashboard/bursar/bursaries/list', icon: null },
        { id: 'applications', label: 'Applications', path: '/dashboard/bursar/scholarships/applications', icon: null },
      ],
    },
    {
      id: 'invoices',
      label: 'Invoices',
      path: '/dashboard/bursar/invoices',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      children: [
        { id: 'all-invoices', label: 'All Invoices', path: '/dashboard/bursar/invoices/list', icon: null },
        { id: 'create-invoice', label: 'Create Invoice', path: '/dashboard/bursar/invoices/create', icon: null },
        { id: 'bulk-generate', label: 'Bulk Generate', path: '/dashboard/bursar/invoices/bulk', icon: null },
        { id: 'invoice-history', label: 'Invoice History', path: '/dashboard/bursar/invoices/history', icon: null },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/dashboard/bursar/reports',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      children: [
        { id: 'financial-reports', label: 'Financial Reports', path: '/dashboard/bursar/reports/financial', icon: null },
        { id: 'fee-reports', label: 'Fee Reports', path: '/dashboard/bursar/reports/fees', icon: null },
        { id: 'expense-reports-nav', label: 'Expense Reports', path: '/dashboard/bursar/reports/expenses', icon: null },
        { id: 'payroll-reports', label: 'Payroll Reports', path: '/dashboard/bursar/reports/payroll', icon: null },
        { id: 'specialized-reports', label: 'Specialized Reports', path: '/dashboard/bursar/reports/specialized', icon: null },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/dashboard/bursar/analytics',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-4v4m-4-8v4m0 4v4M4 4h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
      children: [
        { id: 'financial-analytics', label: 'Financial Analytics', path: '/dashboard/bursar/analytics/financial', icon: null },
        { id: 'revenue-trends', label: 'Revenue Trends', path: '/dashboard/bursar/analytics/revenue', icon: null },
        { id: 'expense-trends', label: 'Expense Trends', path: '/dashboard/bursar/analytics/expenses', icon: null },
        { id: 'kpis', label: 'KPIs', path: '/dashboard/bursar/analytics/kpis', icon: null },
      ],
    },
    {
      id: 'student-fees',
      label: 'Student Fees',
      path: '/dashboard/bursar/student-fees',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 10-8 0 4 4 0 008 0zm-4 8a7 7 0 00-7-7h14a7 7 0 00-7 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v4m-2 0h4" />
        </svg>
      ),
      children: [
        { id: 'student-fee-lookup', label: 'Student Fee Lookup', path: '/dashboard/bursar/student-fees/lookup', icon: null },
        { id: 'fee-statements', label: 'Fee Statements', path: '/dashboard/bursar/student-fees/statements', icon: null },
        { id: 'adjustments', label: 'Adjustments', path: '/dashboard/bursar/student-fees/adjustments', icon: null },
      ],
    },
    {
      id: 'bulk-operations',
      label: 'Bulk Operations',
      path: '/dashboard/bursar/bulk-operations',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      children: [
        { id: 'bulk-import', label: 'Bulk Import', path: '/dashboard/bursar/bulk/import', icon: null },
        { id: 'bulk-invoices', label: 'Bulk Invoices', path: '/dashboard/bursar/bulk/invoices', icon: null },
        { id: 'bulk-reminders', label: 'Bulk Reminders', path: '/dashboard/bursar/bulk/reminders', icon: null },
        { id: 'bulk-adjustments', label: 'Bulk Adjustments', path: '/dashboard/bursar/bulk/adjustments', icon: null },
      ],
    },
    {
      id: 'audit-compliance',
      label: 'Audit & Compliance',
      path: '/dashboard/bursar/audit-compliance',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7m14-14l-7 7 7 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 7.835A7 7 0 0112 5.66a7 7 0 014.17 1.176m0 0L20.5 9.5l-4.335 4.335" />
        </svg>
      ),
      children: [
        { id: 'audit-log', label: 'Audit Log', path: '/dashboard/bursar/audit-compliance/log', icon: null },
        { id: 'compliance-reports', label: 'Compliance Reports', path: '/dashboard/bursar/audit-compliance/reports', icon: null },
        { id: 'tax-records', label: 'Tax Records', path: '/dashboard/bursar/audit-compliance/tax', icon: null },
      ],
    },
    {
      id: 'fixed-assets',
      label: 'Fixed Assets',
      path: '/dashboard/bursar/fixed-assets',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'project-financing',
      label: 'Project Financing',
      path: '/dashboard/bursar/projects',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      children: [
        { id: 'projects', label: 'Projects', path: '/dashboard/bursar/projects/list', icon: null },
        { id: 'project-expenses', label: 'Project Expenses', path: '/dashboard/bursar/projects/expenses', icon: null },
        { id: 'milestones', label: 'Milestones', path: '/dashboard/bursar/projects/milestones', icon: null },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/dashboard/bursar/settings',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573.732c1.154-.9 2.47-.086 2.47 1.388v.731c0 1.11-.9 2.03-2.03 2.03H4.03C2.9 9.03 2 8.12 2 6.99v-.73c0-1.47.876-2.15 2.47-1.388a2.013 2.013 0 002.573.732zM15 12a3 3 0 10-6 0 3 3 0 006 0z" />
        </svg>
      ),
      children: [
        { id: 'financial-settings', label: 'Financial Settings', path: '/dashboard/bursar/settings/financial', icon: null },
        { id: 'tax-configuration', label: 'Tax Configuration', path: '/dashboard/bursar/settings/tax', icon: null },
        { id: 'general-settings', label: 'General Settings', path: '/dashboard/bursar/settings/general', icon: null },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/dashboard/bursar/profile',
      icon: (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 10-8 0 4 4 0 008 0zm-4 8a7 7 0 00-7-7h14a7 7 0 00-7 7z" />
        </svg>
      ),
    },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => isActiveRoute(child.path));
  };

  return (
    <aside className="bursar-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg className="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="sidebar-user-info">
          <span className="user-name">{user?.firstName || 'Bursar'}</span>
          <span className="user-role">Finance Department</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.id} className={`nav-item ${item.children ? 'has-children' : ''}`}>
              {item.children ? (
                <>
                  <button
                    className={`nav-link parent ${expandedMenus.includes(item.id) ? 'expanded' : ''} ${hasActiveChild(item) ? 'active' : ''}`}
                    onClick={() => toggleMenu(item.id)}
                  >
                    <span className="nav-icon-wrapper">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                    <svg className={`nav-arrow ${expandedMenus.includes(item.id) ? 'rotated' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {expandedMenus.includes(item.id) && (
                    <ul className="nav-sublist">
                      {item.children.map(child => (
                        <li key={child.id}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `nav-link child ${isActive ? 'active' : ''}`
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-icon-wrapper">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-info">
          <span className="school-name">School Hub</span>
          <span className="version">v2.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default BursarSidebar;