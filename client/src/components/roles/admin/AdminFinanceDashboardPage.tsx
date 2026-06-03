// client/src/components/roles/admin/AdminFinanceDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  RefreshCcw, TrendingUp, DollarSign, Users, FileText, 
  Calendar, ArrowUp, ArrowDown, CreditCard, Banknote,
  Smartphone, Building2, PieChart, BarChart3, LineChart,
  Download, Eye, AlertCircle, CheckCircle, Clock,
  Wallet, Target, Award, Activity, Zap, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { financeService } from '../../../services/adminService';
import type { FinanceDashboard } from '../../../types/admin';

interface FinanceMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

export default function AdminFinanceDashboardPage() {
  const [metrics, setMetrics] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'expenses' | 'collection'>('revenue');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getDashboard(period);
      setMetrics(data);
    } catch (error) {
      toast.error('Failed to load finance dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const financeMetrics: FinanceMetric[] = [
    {
      id: 'total_collected',
      label: 'Total Collected',
      value: metrics?.totalCollected || 0,
      change: metrics?.collectionGrowth || 0,
      trend: (metrics?.collectionGrowth || 0) >= 0 ? 'up' : 'down',
      icon: <DollarSign size={24} />,
      color: 'green'
    },
    {
      id: 'outstanding',
      label: 'Outstanding Fees',
      value: metrics?.totalOutstanding || 0,
      change: metrics?.outstandingChange || 0,
      trend: (metrics?.outstandingChange || 0) <= 0 ? 'down' : 'up',
      icon: <AlertCircle size={24} />,
      color: 'red'
    },
    {
      id: 'collection_rate',
      label: 'Collection Rate',
      value: metrics?.collectionRate || 0,
      change: metrics?.rateChange || 0,
      trend: (metrics?.rateChange || 0) >= 0 ? 'up' : 'down',
      icon: <Target size={24} />,
      color: 'blue'
    },
    {
      id: 'mpesa',
      label: 'M-Pesa Collections',
      value: metrics?.mpesaTotal || 0,
      change: metrics?.mpesaGrowth || 0,
      trend: (metrics?.mpesaGrowth || 0) >= 0 ? 'up' : 'down',
      icon: <Smartphone size={24} />,
      color: 'purple'
    },
    {
      id: 'cash',
      label: 'Cash Collections',
      value: metrics?.cashTotal || 0,
      change: metrics?.cashGrowth || 0,
      trend: (metrics?.cashGrowth || 0) >= 0 ? 'up' : 'down',
      icon: <Banknote size={24} />,
      color: 'orange'
    },
    {
      id: 'expenses',
      label: 'Total Expenses',
      value: metrics?.totalExpenses || 0,
      change: metrics?.expensesGrowth || 0,
      trend: (metrics?.expensesGrowth || 0) <= 0 ? 'down' : 'up',
      icon: <TrendingUp size={24} />,
      color: 'red'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUp size={14} className="text-green-500" />;
    if (trend === 'down') return <ArrowDown size={14} className="text-red-500" />;
    return <Activity size={14} className="text-gray-400" />;
  };

  return (
    <div className="finance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Finance Dashboard</h1>
          <p>Real-time financial overview and analytics</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <button className={`period-btn ${period === 'today' ? 'active' : ''}`} onClick={() => setPeriod('today')}>Today</button>
            <button className={`period-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>This Week</button>
            <button className={`period-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>This Month</button>
            <button className={`period-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>This Year</button>
          </div>
          <button className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => financeService.exportDashboard(period)}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            {financeMetrics.map(metric => (
              <div key={metric.id} className={`metric-card metric-${metric.color}`}>
                <div className="metric-header">
                  <div className="metric-icon">{metric.icon}</div>
                  <div className={`metric-trend ${metric.trend}`}>
                    {getTrendIcon(metric.trend)}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div className="metric-value">{formatCurrency(metric.value)}</div>
                <div className="metric-label">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            <div className="chart-header">
              <div className="chart-tabs">
                <button className={`chart-tab ${selectedChart === 'revenue' ? 'active' : ''}`} onClick={() => setSelectedChart('revenue')}>
                  <BarChart3 size={16} /> Revenue Trend
                </button>
                <button className={`chart-tab ${selectedChart === 'expenses' ? 'active' : ''}`} onClick={() => setSelectedChart('expenses')}>
                  <LineChart size={16} /> Expenses
                </button>
                <button className={`chart-tab ${selectedChart === 'collection' ? 'active' : ''}`} onClick={() => setSelectedChart('collection')}>
                  <PieChart size={16} /> Collection Methods
                </button>
              </div>
              <button className="btn-sm" onClick={() => financeService.exportChart(selectedChart, period)}>
                <Download size={14} /> Export
              </button>
            </div>
            <div className="chart-container">
              {/* Revenue Chart */}
              {selectedChart === 'revenue' && metrics?.revenueData && (
                <div className="revenue-chart">
                  <div className="chart-bars">
                    {metrics.revenueData.map((item, index) => (
                      <div key={index} className="chart-bar-item">
                        <div className="bar-container">
                          <div className="bar" style={{ height: `${(item.amount / Math.max(...metrics.revenueData.map(d => d.amount))) * 100}%` }} />
                        </div>
                        <span className="bar-label">{item.month}</span>
                        <span className="bar-value">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses Chart */}
              {selectedChart === 'expenses' && metrics?.expensesData && (
                <div className="expenses-chart">
                  <div className="expense-categories">
                    {metrics.expensesData.map((category, index) => (
                      <div key={index} className="expense-item">
                        <div className="expense-header">
                          <span>{category.category}</span>
                          <span>{formatCurrency(category.amount)}</span>
                        </div>
                        <div className="expense-bar">
                          <div className="bar-fill" style={{ width: `${(category.amount / metrics.totalExpenses) * 100}%` }} />
                        </div>
                        <span className="expense-percent">{((category.amount / metrics.totalExpenses) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Methods Chart */}
              {selectedChart === 'collection' && metrics?.collectionMethods && (
                <div className="collection-chart">
                  <div className="methods-grid">
                    <div className="method-card mpesa">
                      <Smartphone size={32} />
                      <div className="method-amount">{formatCurrency(metrics.collectionMethods.mpesa)}</div>
                      <div className="method-label">M-Pesa</div>
                      <div className="method-percent">{((metrics.collectionMethods.mpesa / metrics.totalCollected) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="method-card cash">
                      <Banknote size={32} />
                      <div className="method-amount">{formatCurrency(metrics.collectionMethods.cash)}</div>
                      <div className="method-label">Cash</div>
                      <div className="method-percent">{((metrics.collectionMethods.cash / metrics.totalCollected) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="method-card bank">
                      <Building2 size={32} />
                      <div className="method-amount">{formatCurrency(metrics.collectionMethods.bank)}</div>
                      <div className="method-label">Bank Transfer</div>
                      <div className="method-percent">{((metrics.collectionMethods.bank / metrics.totalCollected) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="transactions-section">
            <div className="section-header">
              <h3>Recent Transactions</h3>
              <button className="btn-sm" onClick={() => window.location.href = '/admin/finance/transactions'}>
                View All <Eye size={14} />
              </button>
            </div>
            <div className="transactions-list">
              {metrics?.recentTransactions?.map((transaction, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-icon">
                    {transaction.method === 'mpesa' ? <Smartphone size={20} /> : 
                     transaction.method === 'cash' ? <Banknote size={20} /> : 
                     <CreditCard size={20} />}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-student">{transaction.studentName}</div>
                    <div className="transaction-meta">
                      <span>{transaction.receiptNumber}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className={`status-${transaction.status}`}>{transaction.status}</span>
                    </div>
                  </div>
                  <div className="transaction-amount">{formatCurrency(transaction.amount)}</div>
                </div>
              ))}
              {(!metrics?.recentTransactions || metrics.recentTransactions.length === 0) && (
                <div className="empty-state">
                  <FileText size={48} />
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Contributors & Alerts */}
          <div className="bottom-sections">
            {/* Top Contributors */}
            <div className="contributors-section">
              <div className="section-header">
                <h3>Top Contributors</h3>
                <Award size={20} />
              </div>
              <div className="contributors-list">
                {metrics?.topContributors?.map((contributor, index) => (
                  <div key={index} className="contributor-item">
                    <div className="contributor-rank">#{index + 1}</div>
                    <div className="contributor-details">
                      <div className="contributor-name">{contributor.studentName}</div>
                      <div className="contributor-class">{contributor.className}</div>
                    </div>
                    <div className="contributor-amount">{formatCurrency(contributor.totalPaid)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts Section */}
            <div className="alerts-section">
              <div className="section-header">
                <h3>Financial Alerts</h3>
                <Shield size={20} />
              </div>
              <div className="alerts-list">
                {metrics?.alerts?.map((alert, index) => (
                  <div key={index} className={`alert-item alert-${alert.type}`}>
                    {alert.type === 'warning' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{alert.message}</span>
                  </div>
                ))}
                {(!metrics?.alerts || metrics.alerts.length === 0) && (
                  <div className="alert-item success">
                    <CheckCircle size={16} />
                    <span>All financial metrics are healthy</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="quick-stats-footer">
            <div className="stat">
              <Calendar size={14} />
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
            <div className="stat">
              <Users size={14} />
              <span>{metrics?.studentsWithBalance || 0} students with balance</span>
            </div>
            <div className="stat">
              <Clock size={14} />
              <span>{metrics?.overdueAccounts || 0} overdue accounts</span>
            </div>
            <div className="stat">
              <Zap size={14} />
              <span>Collection rate: {metrics?.collectionRate || 0}%</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        .finance-dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8fafc;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
        }

        .dashboard-header p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .period-selector {
          display: flex;
          gap: 4px;
          background: white;
          padding: 4px;
          border-radius: 40px;
          border: 1px solid #e5e7eb;
        }

        .period-btn {
          padding: 6px 16px;
          border-radius: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
        }

        .period-btn.active {
          background: #1d8a8a;
          color: white;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-card.metric-green .metric-icon { background: #d1fae5; color: #059669; }
        .metric-card.metric-red .metric-icon { background: #fee2e2; color: #dc2626; }
        .metric-card.metric-blue .metric-icon { background: #dbeafe; color: #2563eb; }
        .metric-card.metric-purple .metric-icon { background: #f3e8ff; color: #9333ea; }
        .metric-card.metric-orange .metric-icon { background: #fed7aa; color: #c2410c; }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .metric-trend.up { background: #d1fae5; color: #059669; }
        .metric-trend.down { background: #fee2e2; color: #dc2626; }
        .metric-trend.stable { background: #f3f4f6; color: #6b7280; }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 13px;
          color: #6b7280;
        }

        .chart-section {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chart-tabs {
          display: flex;
          gap: 8px;
        }

        .chart-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: #f3f4f6;
          cursor: pointer;
        }

        .chart-tab.active {
          background: #1d8a8a;
          color: white;
        }

        .chart-container {
          min-height: 300px;
        }

        .revenue-chart {
          padding: 20px 0;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          justify-content: center;
        }

        .chart-bar-item {
          text-align: center;
          flex: 1;
        }

        .bar-container {
          height: 200px;
          display: flex;
          align-items: flex-end;
          margin-bottom: 8px;
        }

        .bar {
          width: 100%;
          background: #1d8a8a;
          border-radius: 8px 8px 0 0;
          transition: height 0.3s;
          min-height: 4px;
        }

        .bar-label {
          font-size: 12px;
          color: #6b7280;
          display: block;
        }

        .bar-value {
          font-size: 11px;
          font-weight: 600;
          display: block;
        }

        .expense-categories {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .expense-item {
          width: 100%;
        }

        .expense-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .expense-bar {
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .bar-fill {
          height: 100%;
          background: #ef4444;
          border-radius: 4px;
        }

        .expense-percent {
          font-size: 11px;
          color: #6b7280;
        }

        .methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .method-card {
          text-align: center;
          padding: 24px;
          border-radius: 16px;
          background: #f9fafb;
        }

        .method-card.mpesa { border-top: 4px solid #8b5cf6; }
        .method-card.cash { border-top: 4px solid #10b981; }
        .method-card.bank { border-top: 4px solid #3b82f6; }

        .method-amount {
          font-size: 20px;
          font-weight: bold;
          margin: 12px 0 4px;
        }

        .method-label {
          font-size: 13px;
          color: #6b7280;
        }

        .method-percent {
          font-size: 24px;
          font-weight: bold;
          margin-top: 8px;
          color: #1d8a8a;
        }

        .transactions-section, .contributors-section, .alerts-section {
          background: white;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }

        .transactions-section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-student {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .transaction-meta {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .status-pending { color: #d97706; }
        .status-approved, .status-completed { color: #059669; }
        .status-rejected { color: #dc2626; }

        .transaction-amount {
          font-weight: 700;
          font-size: 16px;
          color: #1d8a8a;
        }

        .bottom-sections {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .contributors-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contributor-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .contributor-rank {
          width: 32px;
          height: 32px;
          background: #1d8a8a;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }

        .contributor-details {
          flex: 1;
        }

        .contributor-name {
          font-weight: 600;
        }

        .contributor-class {
          font-size: 11px;
          color: #6b7280;
        }

        .contributor-amount {
          font-weight: 700;
          color: #059669;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
        }

        .alert-item.warning {
          background: #fef3c7;
          color: #d97706;
        }

        .alert-item.success {
          background: #d1fae5;
          color: #059669;
        }

        .quick-stats-footer {
          display: flex;
          gap: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          flex-wrap: wrap;
          justify-content: center;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .btn-primary, .btn-secondary, .btn-sm {
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }

        .loading-state {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 20px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e5e7eb;
          border-top-color: #1d8a8a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .bottom-sections { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: 1fr; }
          .chart-bars { gap: 8px; }
          .bar-label { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}