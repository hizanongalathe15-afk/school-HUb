import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { FinancialOverview, RevenueTrend, ExpenseBreakdown, CashFlowStatement } from '../../../types/bursar';

const BursarAnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch all analytics data in parallel
      const [overviewRes, revenueRes, expenseRes, cashFlowRes] = await Promise.all([
        bursarService.analytics.getFinancialOverview(dateRange),
        bursarService.analytics.getRevenueTrends(dateRange),
        bursarService.analytics.getExpenseBreakdown(dateRange),
        bursarService.analytics.getCashFlowStatement(dateRange),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (revenueRes.success && revenueRes.data) {
        setRevenueTrends(revenueRes.data);
      }
      if (expenseRes.success && expenseRes.data) {
        setExpenseBreakdown(expenseRes.data);
      }
      if (cashFlowRes.success && cashFlowRes.data) {
        setCashFlow(cashFlowRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Financial Analytics</h1>
        <p className="text-amber-600">Monitor and analyze school financial performance</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Financial Overview</h2>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <label className="text-sm font-medium text-amber-700 mr-2">Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {/* Total Revenue */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="text-sm font-medium text-amber-600">Total Revenue</h3>
            <p className="text-2xl font-bold text-amber-800 mt-2">
              {overview ? formatCurrency(overview.totalRevenue) : '—'}
            </p>
            <p className="text-sm text-amber-500 mt-1">
              {overview ? formatPercentage(overview.revenueGrowth) : '—'} vs previous period
            </p>
          </div>
          {/* Total Expenses */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="text-sm font-medium text-amber-600">Total Expenses</h3>
            <p className="text-2xl font-bold text-amber-800 mt-2">
              {overview ? formatCurrency(overview.totalExpenses) : '—'}
            </p>
            <p className="text-sm text-amber-500 mt-1">
              {overview ? formatPercentage(overview.expenseGrowth) : '—'} vs previous period
            </p>
          </div>
          {/* Net Income */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="text-sm font-medium text-amber-600">Net Income</h3>
            <p className={`
              text-2xl font-bold mt-2 ${
                overview && overview.netIncome >= 0 ? 'text-green-800' : 'text-red-800'
              }
            `}>
              {overview ? formatCurrency(overview.netIncome) : '—'}
            </p>
            <p className="text-sm text-amber-500 mt-1">
              {overview ? formatPercentage(overview.netIncomeMargin) : '—'} margin
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trends Chart */}
        <div className="bg-white rounded-xl shadow-md border border-amber-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-4">Revenue Trends</h2>
            <div className="h-96 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
              <div className="text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-2 text-sm">Revenue Chart Placeholder</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {revenueTrends.map((trend, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-amber-600">{trend.period}</span>
                  <span className="font-medium text-amber-800">{formatCurrency(trend.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-md border border-amber-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-4">Expense Breakdown</h2>
            <div className="h-96 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
              <div className="text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-2 text-sm">Expense Chart Placeholder</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {expenseBreakdown.map((expense, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-amber-600">{expense.category}</span>
                  <span className="font-medium text-amber-800">{formatCurrency(expense.amount)} ({formatPercentage(expense.percentage)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-4">Cash Flow Statement</h2>
          {cashFlow ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Operating Cash Flow</span>
                <span className={`
                  font-medium ${
                    cashFlow.operatingCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
                  }
                `}>
                  {formatCurrency(cashFlow.operatingCashFlow)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Investing Cash Flow</span>
                <span className={`
                  font-medium ${
                    cashFlow.investingCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
                  }
                `}>
                  {formatCurrency(cashFlow.investingCashFlow)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Financing Cash Flow</span>
                <span className={`
                  font-medium ${
                    cashFlow.financingCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
                  }
                `}>
                  {formatCurrency(cashFlow.financingCashFlow)}
                </span>
              </div>
              <div className="border-t border-amber-200 pt-4 flex justify-between text-lg font-semibold">
                <span>Net Cash Flow</span>
                <span className={`
                  ${
                    cashFlow.netCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
                  }
                `}>
                  {formatCurrency(cashFlow.netCashFlow)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
              <p className="text-amber-600">Loading cash flow data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BursarAnalyticsPage;

/* Inline button style */
<style jsx>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>