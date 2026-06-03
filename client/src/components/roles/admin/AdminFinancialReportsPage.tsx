// client/src/components/roles/admin/AdminReportsFinancialPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, TrendingUp, TrendingDown, DollarSign,
  PieChart, BarChart3, LineChart, Calendar, Filter,
  Search, Eye, Printer, Mail, Share2, Copy, Link,
  ChevronDown, ChevronUp, Plus, Minus, Clock, Award,
  Users, Building2, CreditCard, Wallet, Landmark,
  Receipt, FileSpreadsheet, FileJson, FileText as FilePdf,
  AlertCircle, CheckCircle, ArrowUp, ArrowDown,
  RefreshCcw, Settings, DownloadCloud, UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsService } from '../../../services/adminService';

interface FinancialReport {
  id: string;
  name: string;
  category: 'summary' | 'payment' | 'arrears' | 'budget' | 'donor' | 'expense' | 'salary' | 'investment';
  dateRange: { start: string; end: string };
  data: any[];
  totalAmount: number;
  generatedAt: string;
}

interface FilterOptions {
  startYear: number;
  endYear: number;
  includeArchived: boolean;
  classFilter: string;
  paymentMethod: string;
  minAmount: number;
  maxAmount: number;
}

export default function AdminReportsFinancialPage() {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [filters, setFilters] = useState<FilterOptions>({
    startYear: 1920,
    endYear: new Date().getFullYear(),
    includeArchived: false,
    classFilter: 'all',
    paymentMethod: 'all',
    minAmount: 0,
    maxAmount: 10000000
  });
  const [historicalData, setHistoricalData] = useState<any>(null);

  // Generate all years from 1920 to current
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let year = 1920; year <= currentYear; year++) {
      yearsList.push(year);
    }
    return yearsList.reverse();
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleGenerate = async (type: string, year?: number, month?: number) => {
    setLoading(true);
    try {
      const blob = await reportsService.generateFinancialReport(type, {
        year: year || selectedYear,
        month: month || selectedMonth,
        startYear: filters.startYear,
        endYear: filters.endYear,
        includeArchived: filters.includeArchived,
        class: filters.classFilter,
        paymentMethod: filters.paymentMethod,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${year || selectedYear}_${month ? months[month-1] : 'annual'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} report generated for ${year || selectedYear}`);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHistorical = async () => {
    setLoading(true);
    try {
      const blob = await reportsService.generateHistoricalFinancialReport({
        startYear: filters.startYear,
        endYear: filters.endYear,
        includeAllData: true
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historical_financial_${filters.startYear}_${filters.endYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Historical report generated (${filters.startYear}-${filters.endYear})`);
    } catch (error) {
      toast.error('Failed to generate historical report');
    } finally {
      setLoading(false);
    }
  };

  const reportCategories = [
    {
      title: 'Fee Summary Reports',
      icon: <DollarSign size={24} />,
      color: 'bg-blue-500',
      reports: [
        { name: 'Fee Collection Summary', key: 'fee-summary', description: 'Total fees collected, pending, and overdue' },
        { name: 'Fee by Class', key: 'fee-by-class', description: 'Fee breakdown per class and stream' },
        { name: 'Fee by Term', key: 'fee-by-term', description: 'Term-wise fee collection analysis' },
        { name: 'Fee Structure History', key: 'fee-structure-history', description: 'Historical fee changes over years' }
      ]
    },
    {
      title: 'Payment Reports',
      icon: <CreditCard size={24} />,
      color: 'bg-green-500',
      reports: [
        { name: 'Daily Payment Log', key: 'daily-payments', description: 'All payments recorded daily' },
        { name: 'Payment Method Analysis', key: 'payment-methods', description: 'Cash/MPESA/Bank transfer breakdown' },
        { name: 'Student Payment History', key: 'student-payments', description: 'Individual student payment records' },
        { name: 'Bulk Payment Report', key: 'bulk-payments', description: 'Batch payment processing report' }
      ]
    },
    {
      title: 'Arrears & Debt Reports',
      icon: <AlertCircle size={24} />,
      color: 'bg-red-500',
      reports: [
        { name: 'Outstanding Arrears', key: 'arrears-outstanding', description: 'Students with unpaid fees' },
        { name: 'Arrears Aging Analysis', key: 'arrears-aging', description: '30/60/90+ days overdue' },
        { name: 'Arrears by Class', key: 'arrears-by-class', description: 'Class-wise debt summary' },
        { name: 'Payment Plans Report', key: 'payment-plans', description: 'Active payment arrangements' }
      ]
    },
    {
      title: 'Budget Reports',
      icon: <Landmark size={24} />,
      color: 'bg-purple-500',
      reports: [
        { name: 'Budget vs Actual', key: 'budget-vs-actual', description: 'Budget allocation vs actual spending' },
        { name: 'Departmental Budget', key: 'department-budget', description: 'Budget per department' },
        { name: 'Budget Variance Analysis', key: 'budget-variance', description: 'Positive/negative variance report' },
        { name: 'Multi-Year Budget Trend', key: 'budget-trend', description: 'Budget changes over 10+ years' }
      ]
    },
    {
      title: 'Expense Reports',
      icon: <TrendingDown size={24} />,
      color: 'bg-orange-500',
      reports: [
        { name: 'Monthly Expenses', key: 'monthly-expenses', description: 'Recurring and one-time expenses' },
        { name: 'Expense by Category', key: 'expense-category', description: 'Operational vs capital expenses' },
        { name: 'Supplier Payment History', key: 'supplier-payments', description: 'Vendor payment records' },
        { name: 'Petty Cash Report', key: 'petty-cash', description: 'Small expense transactions' }
      ]
    },
    {
      title: 'Salary & Payroll',
      icon: <Users size={24} />,
      color: 'bg-teal-500',
      reports: [
        { name: 'Monthly Payroll Summary', key: 'payroll-summary', description: 'Teacher and staff salaries' },
        { name: 'Salary Structure Report', key: 'salary-structure', description: 'Salary scales and grades' },
        { name: 'Deductions Report', key: 'deductions', description: 'PAYE, NHIF, NSSF deductions' },
        { name: 'Annual Payroll History', key: 'payroll-history', description: 'Yearly payroll trends' }
      ]
    },
    {
      title: 'Donor & Grant Reports',
      icon: <Award size={24} />,
      color: 'bg-pink-500',
      reports: [
        { name: 'Donor Contribution Summary', key: 'donor-summary', description: 'All donor contributions' },
        { name: 'Scholarship Fund Report', key: 'scholarship-funds', description: 'Scholarship disbursements' },
        { name: 'Grant Utilization', key: 'grant-utilization', description: 'Grant fund usage report' },
        { name: 'Sponsorship Report', key: 'sponsorship', description: 'Student sponsorship tracking' }
      ]
    },
    {
      title: 'Investment Reports',
      icon: <TrendingUp size={24} />,
      color: 'bg-indigo-500',
      reports: [
        { name: 'Investment Portfolio', key: 'investment-portfolio', description: 'School investments summary' },
        { name: 'Interest Income Report', key: 'interest-income', description: 'Interest earned on accounts' },
        { name: 'Asset Appreciation', key: 'asset-appreciation', description: 'School asset value growth' },
        { name: 'ROI Analysis', key: 'roi-analysis', description: 'Return on investment calculations' }
      ]
    },
    {
      title: 'Historical Reports (100+ Years)',
      icon: <Calendar size={24} />,
      color: 'bg-gray-700',
      reports: [
        { name: 'Full Financial History', key: 'full-history', description: `All records from ${filters.startYear} to ${filters.endYear}` },
        { name: 'Decade Summary', key: 'decade-summary', description: 'Financial summary per decade' },
        { name: 'Long-term Trends', key: 'long-term-trends', description: 'Fee and expense trends over time' },
        { name: 'Archive Access Report', key: 'archive-report', description: 'Access historical archived data' }
      ]
    }
  ];

  return (
    <div className="financial-reports-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><DollarSign size={28} /> Financial Reports</h1>
          <p>Comprehensive financial reporting with 100+ year historical data</p>
        </div>
        <div className="header-actions">
          <button onClick={() => window.location.reload()} className="btn-secondary">
            <RefreshCcw size={16} /> Refresh
          </button>
          <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="btn-secondary">
            <Filter size={16} /> {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Year/Month Selection */}
      <div className="date-selector">
        <div className="selector-group">
          <label>Select Year</label>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>Select Month</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>
        <button onClick={() => handleGenerateHistorical()} className="btn-primary" disabled={loading}>
          <DownloadCloud size={16} /> Generate Historical Report
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <h3>Advanced Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Start Year</label>
              <select value={filters.startYear} onChange={e => setFilters({...filters, startYear: parseInt(e.target.value)})}>
                {years.slice().reverse().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>End Year</label>
              <select value={filters.endYear} onChange={e => setFilters({...filters, endYear: parseInt(e.target.value)})}>
                {years.slice().reverse().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Class Filter</label>
              <select value={filters.classFilter} onChange={e => setFilters({...filters, classFilter: e.target.value})}>
                <option value="all">All Classes</option>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Payment Method</label>
              <select value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})}>
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="mpesa">MPESA</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Min Amount (KES)</label>
              <input type="number" value={filters.minAmount} onChange={e => setFilters({...filters, minAmount: parseInt(e.target.value)})} />
            </div>
            <div className="filter-group">
              <label>Max Amount (KES)</label>
              <input type="number" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: parseInt(e.target.value)})} />
            </div>
            <div className="filter-group checkbox">
              <label>
                <input type="checkbox" checked={filters.includeArchived} onChange={e => setFilters({...filters, includeArchived: e.target.checked})} />
                Include Archived Data (pre-2000)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat"><DollarSign size={20} /><div><span>KES 45.2M</span><label>Total Revenue (YTD)</label></div></div>
        <div className="stat"><TrendingDown size={20} /><div><span>KES 28.1M</span><label>Total Expenses</label></div></div>
        <div className="stat"><TrendingUp size={20} /><div><span>KES 17.1M</span><label>Net Surplus</label></div></div>
        <div className="stat"><AlertCircle size={20} /><div><span>KES 3.2M</span><label>Outstanding Arrears</label></div></div>
      </div>

      {/* Report Grid */}
      <div className="reports-grid">
        {reportCategories.map((category, idx) => (
          <div key={idx} className="report-category">
            <div className={`category-header ${category.color}`}>
              {category.icon}
              <h2>{category.title}</h2>
            </div>
            <div className="report-list">
              {category.reports.map((report, ridx) => (
                <div key={ridx} className="report-card">
                  <div className="report-info">
                    <FileText size={20} className="report-icon" />
                    <div>
                      <h4>{report.name}</h4>
                      <p>{report.description}</p>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button 
                      onClick={() => handleGenerate(report.key, selectedYear, selectedMonth)} 
                      className="btn-sm btn-primary"
                      disabled={loading}
                    >
                      <Download size={14} /> Excel
                    </button>
                    <button className="btn-sm btn-secondary" title="Preview">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Historical Data Section */}
      <div className="historical-section">
        <div className="historical-header">
          <h2><Calendar size={20} /> Historical Financial Data Archive</h2>
          <p>Access financial records dating back to 1920</p>
        </div>
        <div className="historical-grid">
          {[1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map(decade => (
            <div key={decade} className="decade-card">
              <h3>{decade}s</h3>
              <p>Financial records from {decade} to {decade + 9}</p>
              <button onClick={() => handleGenerate(`decade-${decade}`, decade)} className="btn-sm btn-secondary">
                <Download size={12} /> Download Decade Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Generating report... This may take a moment</p>
        </div>
      )}

      <style>{`
        .financial-reports-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
        .header-actions { display: flex; gap: 12px; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .date-selector { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; background: white; padding: 20px; border-radius: 12px; }
        .selector-group { display: flex; flex-direction: column; gap: 6px; }
        .selector-group label { font-size: 12px; font-weight: 600; color: #475569; }
        .selector-group select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; min-width: 120px; }
        .advanced-filters { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .advanced-filters h3 { margin: 0 0 16px 0; font-size: 16px; }
        .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-group label { font-size: 12px; font-weight: 500; color: #475569; }
        .filter-group input, .filter-group select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .filter-group.checkbox { flex-direction: row; align-items: center; }
        .stats-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat span { font-size: 20px; font-weight: 700; display: block; }
        .stat label { font-size: 12px; color: #64748b; }
        .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; margin-bottom: 32px; }
        .report-category { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .category-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; color: white; }
        .category-header.bg-blue-500 { background: #3b82f6; }
        .category-header.bg-green-500 { background: #10b981; }
        .category-header.bg-red-500 { background: #ef4444; }
        .category-header.bg-purple-500 { background: #8b5cf6; }
        .category-header.bg-orange-500 { background: #f59e0b; }
        .category-header.bg-teal-500 { background: #14b8a6; }
        .category-header.bg-pink-500 { background: #ec4899; }
        .category-header.bg-indigo-500 { background: #6366f1; }
        .category-header.bg-gray-700 { background: #374151; }
        .category-header h2 { margin: 0; font-size: 18px; }
        .report-list { padding: 8px 0; }
        .report-card { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; transition: background 0.2s; }
        .report-card:hover { background: #f8fafc; }
        .report-info { display: flex; align-items: center; gap: 12px; flex: 1; }
        .report-icon { color: #1d8a8a; }
        .report-info h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; }
        .report-info p { margin: 0; font-size: 11px; color: #64748b; }
        .report-actions { display: flex; gap: 8px; }
        .historical-section { background: white; border-radius: 16px; padding: 24px; margin-top: 16px; }
        .historical-header { margin-bottom: 20px; }
        .historical-header h2 { margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
        .historical-header p { margin: 0; color: #64748b; font-size: 13px; }
        .historical-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .decade-card { padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center; transition: transform 0.2s; }
        .decade-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .decade-card h3 { margin: 0 0 8px 0; font-size: 20px; color: #1d8a8a; }
        .decade-card p { margin: 0 0 12px 0; font-size: 11px; color: #64748b; }
        .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; color: white; gap: 16px; }
        .spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .reports-grid { grid-template-columns: 1fr; } .historical-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
