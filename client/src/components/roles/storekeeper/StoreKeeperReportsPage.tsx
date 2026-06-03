// client/src/components/roles/storekeeper/StoreKeeperReportsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, FileText, TrendingUp, TrendingDown, Package, AlertTriangle,
  CheckCircle, XCircle, Clock, Calendar, Filter, RefreshCcw, Printer,
  Mail, Info, Plus, BarChart3, PieChart, LineChart, Activity, DollarSign,
  ShoppingCart, RotateCcw, Users, Boxes, Truck, Eye, ChevronDown,
  Award, Star, Flag, Percent, CreditCard, Wallet
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import storeKeeperService from '../../../services/storeKeeperService';
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { clsx } from 'clsx';

interface ReportConfig {
  type: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  filters: string[];
}

const reportTypes: ReportConfig[] = [
  { type: 'stock_levels', title: 'Current Stock Levels', icon: <Package className="w-5 h-5" />, description: 'Current inventory levels with low stock alerts', color: 'bg-blue-500', filters: ['category', 'location'] },
  { type: 'stock_value', title: 'Stock Value Report', icon: <DollarSign className="w-5 h-5" />, description: 'Total stock value by category and location', color: 'bg-green-500', filters: ['category', 'date'] },
  { type: 'movements', title: 'Stock Movements', icon: <Activity className="w-5 h-5" />, description: 'Inflow and outflow transactions', color: 'bg-purple-500', filters: ['date_range', 'type'] },
  { type: 'requests', title: 'Stock Requests', icon: <ShoppingCart className="w-5 h-5" />, description: 'Request patterns and fulfillment rates', color: 'bg-orange-500', filters: ['date_range', 'requester', 'status'] },
  { type: 'issues', title: 'Items Issued', icon: <Truck className="w-5 h-5" />, description: 'Items issued to teachers, students, staff', color: 'bg-indigo-500', filters: ['date_range', 'issued_to'] },
  { type: 'returns', title: 'Returns Report', icon: <RotateCcw className="w-5 h-5" />, description: 'Returned items, damages, and losses', color: 'bg-red-500', filters: ['date_range', 'condition'] },
  { type: 'purchases', title: 'Purchase Orders', icon: <FileText className="w-5 h-5" />, description: 'PO status, spending by supplier', color: 'bg-cyan-500', filters: ['date_range', 'supplier', 'status'] },
  { type: 'slow_moving', title: 'Slow Moving Items', icon: <TrendingDown className="w-5 h-5" />, description: 'Items with no movement for 30+ days', color: 'bg-yellow-500', filters: ['category', 'days_inactive'] },
  { type: 'fast_moving', title: 'Fast Moving Items', icon: <TrendingUp className="w-5 h-5" />, description: 'Most requested and issued items', color: 'bg-emerald-500', filters: ['category', 'period'] },
  { type: 'expiring', title: 'Expiring Items', icon: <AlertTriangle className="w-5 h-5" />, description: 'Items expiring within 7/30/90 days', color: 'bg-rose-500', filters: ['category', 'expiry_window'] },
  { type: 'overstock', title: 'Overstock Report', icon: <Boxes className="w-5 h-5" />, description: 'Items exceeding max stock levels', color: 'bg-teal-500', filters: ['category'] },
  { type: 'dead_stock', title: 'Dead Stock', icon: <Package className="w-5 h-5" />, description: 'No movement for 90+ days', color: 'bg-gray-500', filters: ['category'] },
  { type: 'supplier_performance', title: 'Supplier Performance', icon: <Award className="w-5 h-5" />, description: 'On-time delivery and quality ratings', color: 'bg-sky-500', filters: ['supplier', 'date_range'] },
  { type: 'damage_writeoff', title: 'Damage & Write-off', icon: <AlertTriangle className="w-5 h-5" />, description: 'Damaged, lost, and written off items', color: 'bg-pink-500', filters: ['date_range', 'type'] },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function StoreKeeperReportsPage() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    location: '',
    status: '',
    supplier: '',
    requester: '',
    issuedTo: '',
    condition: '',
    expiryWindow: '30',
    daysInactive: '30',
    period: 'month'
  });
  const [reportData, setReportData] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  const generateReport = async () => {
    if (!selectedReport) return;
    setLoading(true);
    try {
      const response = await storeKeeperService.reports.generateReport(selectedReport.type, filters);
      setReportData(response.data);
      toast.success(`${selectedReport.title} generated successfully`);
      setShowModal(false);
      setPreviewMode(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf' | 'csv') => {
    if (!selectedReport || !reportData) return;
    setLoading(true);
    try {
      const response = await storeKeeperService.reports.exportReport(selectedReport.type, format, filters);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport.type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const sendReportByEmail = async () => {
    if (!selectedReport || !reportData) return;
    setLoading(true);
    try {
      await storeKeeperService.reports.emailReport(selectedReport.type, filters);
      toast.success('Report sent to your email');
    } catch (error) {
      console.error('Failed to send report:', error);
      toast.error('Failed to send report');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${selectedReport?.title} - Store Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
          </head>
          <body>
            <div class="header">
              <h1>${selectedReport?.title}</h1>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
            <div class="footer">School Store Management System - Confidential Report</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Chart rendering based on report type
  const renderChart = () => {
    if (!reportData?.chartData) return null;

    switch (selectedReport?.type) {
      case 'stock_levels':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ReBarChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentStock" fill="#3B82F6" name="Current Stock" />
              <Bar dataKey="reorderLevel" fill="#F59E0B" name="Reorder Level" />
            </ReBarChart>
          </ResponsiveContainer>
        );

      case 'movements':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="inflow" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Stock In" />
              <Area type="monotone" dataKey="outflow" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Stock Out" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'stock_value':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RePieChart>
              <Pie
                data={reportData.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        );

      case 'requests':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ReLineChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#8B5CF6" name="Requests" />
              <Line type="monotone" dataKey="fulfilled" stroke="#10B981" name="Fulfilled" />
            </ReLineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate comprehensive inventory reports and export data for analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <Card
            key={report.type}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => {
              setSelectedReport(report);
              setFilters({
                startDate: '',
                endDate: '',
                category: '',
                location: '',
                status: '',
                supplier: '',
                requester: '',
                issuedTo: '',
                condition: '',
                expiryWindow: '30',
                daysInactive: '30',
                period: 'month'
              });
              setShowModal(true);
            }}
          >
            <div className="p-4">
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center mb-3', report.color, 'bg-opacity-10')}>
                <div className={clsx('text-white', report.color.replace('bg-', 'text-'))}>
                  {report.icon}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{report.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <Package className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">1,234</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </Card>
        <Card className="text-center">
          <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">KES 2.5M</p>
          <p className="text-xs text-gray-500">Stock Value</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">+15%</p>
          <p className="text-xs text-gray-500">Turnover Rate</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">23</p>
          <p className="text-xs text-gray-500">Low Stock Alerts</p>
        </Card>
        <Card className="text-center">
          <ShoppingCart className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">45</p>
          <p className="text-xs text-gray-500">Pending Requests</p>
        </Card>
        <Card className="text-center">
          <Truck className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-xs text-gray-500">Active POs</p>
        </Card>
      </div>

      {/* Report Preview Modal */}
      {previewMode && reportData && (
        <Modal
          isOpen={previewMode}
          onClose={() => setPreviewMode(false)}
          title={selectedReport?.title || 'Report Preview'}
          size="xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Report Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  Filters: {Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'None'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={printReport}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
                <Button size="sm" variant="outline" onClick={sendReportByEmail} disabled={loading}>
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportReport('excel')} disabled={loading}>
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportReport('pdf')} disabled={loading}>
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                  <Card key={key} className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Chart */}
            {renderChart()}

            {/* Data Table */}
            {reportData.data && reportData.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left font-semibold">{key.replace(/_/g, ' ').toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.data.slice(0, 50).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {Object.values(row).map((value: any, colIdx: number) => (
                          <td key={colIdx} className="px-4 py-2">
                            {typeof value === 'number' ? value.toLocaleString() : (value || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export full report for complete data.
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Generate ${selectedReport?.title || 'Report'}`}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          {selectedReport?.filters.includes('category') && (
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Categories</option>
                <option value="stationery">Stationery</option>
                <option value="textbooks">Textbooks</option>
                <option value="uniforms">Uniforms</option>
                <option value="sports">Sports Equipment</option>
                <option value="lab">Lab Equipment</option>
                <option value="electronics">Electronics</option>
              </select>
            </div>
          )}

          {selectedReport?.filters.includes('supplier') && (
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Suppliers</option>
              </select>
            </div>
          )}

          {selectedReport?.type === 'expiring' && (
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Window</label>
              <div className="flex gap-2">
                {['7', '30', '90'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setFilters({ ...filters, expiryWindow: days })}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg border transition',
                      filters.expiryWindow === days
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              This report will include data from {filters.startDate || 'all time'} to {filters.endDate || 'present'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={generateReport} disabled={loading}>
            {loading ? <Spinner size="sm" /> : <Download className="w-4 h-4 mr-1" />}
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </Modal>

      {/* Scheduled Reports Section */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Scheduled Reports
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Weekly Stock Summary</p>
                <p className="text-xs text-gray-500">Every Monday at 8:00 AM</p>
              </div>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Monthly Low Stock Alert</p>
                <p className="text-xs text-gray-500">1st of every month at 9:00 AM</p>
              </div>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Schedule New Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}