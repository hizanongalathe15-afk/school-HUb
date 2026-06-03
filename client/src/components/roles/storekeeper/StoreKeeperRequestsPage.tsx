// client/src/components/roles/storekeeper/StoreKeeperRequestsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Search, Check, X, RefreshCcw, Eye, Filter, Download,
  Clock, AlertCircle, CheckCircle, XCircle, Truck, Calendar,
  User, BookOpen, Building2, Flag, Phone, Mail, MessageCircle,
  Printer, Send, ChevronDown, ChevronUp, MoreVertical, Edit,
  Trash2, Ban, Package, Users, GraduationCap, Briefcase,
  Flame, FileText, Tag, Hash, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';
import type { StockRequest, RequestItem as BaseRequestItem } from '../../../types/storeKeeper';

type RequestItem = BaseRequestItem & {
  issuedQuantity?: number;
  stockAvailable: number;
};

type Request = StockRequest & {
  title: string;
  description: string;
  requestedBy: string;
  requestedById: string;
  requesterType: 'teacher' | 'student' | 'staff';
  requesterClass?: string;
  requesterDepartment?: string;
  status: StockRequest['status'] | 'partial' | 'completed' | 'cancelled';
  requestType: string;
  dateNeeded: string;
  rejectedAt?: string;
  approvalNotes?: string;
  expectedPickupDate?: string;
  expectedDeliveryDate?: string;
};

const Tools = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const requestTypeConfig = {
  'teacher_classroom': { label: 'Teacher Classroom', icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
  'teacher_lab': { label: 'Teacher Lab', icon: <Flame className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' },
  'student': { label: 'Student Request', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-green-100 text-green-800' },
  'staff_office': { label: 'Staff Office', icon: <Briefcase className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800' },
  'sports': { label: 'Sports Department', icon: <Flag className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800' },
  'library': { label: 'Library', icon: <BookOpen className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-800' },
  'kitchen': { label: 'Kitchen', icon: <Package className="w-4 h-4" />, color: 'bg-red-100 text-red-800' },
  'maintenance': { label: 'Maintenance', icon: <Tools className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800' },
  'emergency': { label: 'Emergency', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-red-600 text-white' },
  'bulk': { label: 'Bulk Request', icon: <Users className="w-4 h-4" />, color: 'bg-pink-100 text-pink-800' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800', icon: <Flag className="w-3 h-3" /> },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800', icon: <Flag className="w-3 h-3" /> },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: <Flag className="w-3 h-3" /> },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: <Flame className="w-3 h-3" /> },
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  partial: { label: 'Partially Approved', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" /> },
};

const requesterTypeIcons = {
  teacher: <User className="w-4 h-4" />,
  student: <GraduationCap className="w-4 h-4" />,
  staff: <Briefcase className="w-4 h-4" />,
};

export default function StoreKeeperRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [requesterTypeFilter, setRequesterTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalData, setApprovalData] = useState({
    notes: '',
    expectedPickupDate: '',
    expectedDeliveryDate: '',
    sendSms: true,
    sendEmail: true,
    sendWhatsApp: false,
    items: [] as Array<{ itemId: string; approvedQuantity: number }>
  });
  const [rejectionData, setRejectionData] = useState({
    reason: '',
    customReason: '',
    sendNotification: true
  });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await storeKeeperService.requests.getRequests({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        requestType: typeFilter || undefined,
        requesterType: requesterTypeFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, typeFilter, requesterTypeFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [requests, searchTerm]);

  const statistics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const urgent = requests.filter(r => r.priority === 'urgent' && r.status === 'pending').length;
    const totalItemsRequested = requests.reduce((sum, r) => sum + (r.items?.length || 0), 0);
    return { total, pending, approved, rejected, completed, urgent, totalItemsRequested };
  }, [requests]);

  const approveRequest = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    try {
      await storeKeeperService.requests.approveRequest(selectedRequest.id, approvalData.items, {
        notes: approvalData.notes,
        expectedPickupDate: approvalData.expectedPickupDate,
        expectedDeliveryDate: approvalData.expectedDeliveryDate,
        sendNotifications: {
          sms: approvalData.sendSms,
          email: approvalData.sendEmail,
          whatsapp: approvalData.sendWhatsApp
        }
      });
      toast.success('Request approved successfully');
      setShowApproveModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    try {
      const reason = rejectionData.reason === 'custom' ? rejectionData.customReason : rejectionData.reason;
      await storeKeeperService.requests.rejectRequest(selectedRequest.id, reason, rejectionData.sendNotification);
      toast.success('Request rejected');
      setShowRejectModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const fulfillRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    setProcessingId(requestId);
    try {
      const itemsToIssue = request.items.map(item => ({
        itemId: item.itemId,
        quantity: item.approvedQuantity || item.requestedQuantity,
        itemName: item.itemName
      }));
      await storeKeeperService.requests.fulfillRequest(requestId, itemsToIssue);
      toast.success('Request fulfilled and items issued');
      fetchData();
    } catch (error) {
      console.error('Failed to fulfill request:', error);
      toast.error('Failed to fulfill request');
    } finally {
      setProcessingId(null);
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    setProcessingId(requestId);
    try {
      await storeKeeperService.requests.cancelRequest(requestId);
      toast.success('Request cancelled');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setProcessingId(null);
    }
  };

  const exportRequests = () => {
    const csv = [
      ['Request #', 'Title', 'Requester', 'Type', 'Priority', 'Items', 'Status', 'Date'],
      ...filteredRequests.map(r => [
        r.requestNumber,
        r.title,
        r.requestedBy,
        r.requestType,
        r.priority,
        r.items?.length || 0,
        r.status,
        new Date(r.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const printRequestSlip = (request: Request) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Request Slip - ${request.requestNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .details { margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
              .status-approved { color: green; font-weight: bold; }
              .status-pending { color: orange; }
              .status-rejected { color: red; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>STORE REQUEST SLIP</h2>
              <p>${request.requestNumber}</p>
            </div>
            <div class="details">
              <p><strong>Requested By:</strong> ${request.requestedBy}</p>
              <p><strong>Date:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="status-${request.status}">${request.status.toUpperCase()}</span></p>
              ${request.dateNeeded ? `<p><strong>Date Needed:</strong> ${new Date(request.dateNeeded).toLocaleDateString()}</p>` : ''}
              ${request.approvalNotes ? `<p><strong>Approval Notes:</strong> ${request.approvalNotes}</p>` : ''}
            </div>
            <h3>Requested Items:</h3>
            <table>
              <thead><tr><th>Item</th><th>Requested Qty</th><th>Approved Qty</th><th>Unit</th></tr></thead>
              <tbody>
                ${request.items.map(item => `
                  <tr>
                    <td>${item.itemName}</td>
                    <td>${item.requestedQuantity}</td>
                    <td>${item.approvedQuantity || item.requestedQuantity}</td>
                    <td>${item.unit}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Store Keeper Signature: _________________</p>
              <p>Requester Signature: _________________</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sendNotification = async (requestId: string, type: 'sms' | 'email' | 'whatsapp') => {
    try {
      await storeKeeperService.requests.sendNotification(requestId, type);
      toast.success(`${type.toUpperCase()} notification sent`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const getRejectionReasons = () => [
    'Insufficient stock available',
    'Request outside policy guidelines',
    'Missing required information',
    'Budget constraints',
    'Duplicate request',
    'Request not urgent at this time',
    'Item not in store inventory',
    'Requester not eligible',
    'custom'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading requests..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Stock Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and process stock requests from teachers, students, and staff
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Card View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={exportRequests}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">Total Requests</p>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </Card>
        <Card className="text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
          <p className="text-xs text-gray-500">Approved</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
          <p className="text-xs text-gray-500">Rejected</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{statistics.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </Card>
        {statistics.urgent > 0 && (
          <Card className="text-center border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
            <p className="text-2xl font-bold text-red-600">{statistics.urgent}</p>
            <p className="text-xs text-gray-500">Urgent Requests</p>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request #, title, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={requesterTypeFilter}
            onChange={(e) => setRequesterTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Requesters</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
            <option value="staff">Staff</option>
          </select>
          <input
            type="date"
            placeholder="From"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <input
            type="date"
            placeholder="To"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPriorityFilter('');
              setTypeFilter('');
              setRequesterTypeFilter('');
              setDateRange({ start: '', end: '' });
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No stock requests found</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Request #</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.map((request) => {
                  const priority = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig.normal;
                  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                  const requestType = requestTypeConfig[request.requestType as keyof typeof requestTypeConfig] || requestTypeConfig.staff_office;
                  
                  return (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-4 py-3 font-mono text-sm">{request.requestNumber}</td>
                        <td className="px-4 py-3 font-medium">{request.title}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {requesterTypeIcons[request.requesterType as keyof typeof requesterTypeIcons]}
                            <span>{request.requestedBy}</span>
                            {request.requesterClass && (
                              <span className="text-xs text-gray-500">({request.requesterClass})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', requestType.color)}>
                            {requestType.icon}
                            {requestType.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{request.items?.length || 0} items</td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                            {priority.icon}
                            {priority.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setApprovalData({
                                      notes: '',
                                      expectedPickupDate: '',
                                      expectedDeliveryDate: '',
                                      sendSms: true,
                                      sendEmail: true,
                                      sendWhatsApp: false,
                                      items: request.items.map(item => ({
                                        itemId: item.itemId,
                                        approvedQuantity: item.requestedQuantity
                                      }))
                                    });
                                    setShowApproveModal(true);
                                  }}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setRejectionData({ reason: '', customReason: '', sendNotification: true });
                                    setShowRejectModal(true);
                                  }}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <button
                                onClick={() => fulfillRequest(request.id)}
                                disabled={processingId === request.id}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Fulfill & Issue"
                              >
                                <Truck className="w-4 h-4 text-blue-500" />
                              </button>
                            )}
                            <button
                              onClick={() => printRequestSlip(request)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="Print Slip"
                            >
                              <Printer className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === request.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Date Needed</p>
                                  <p className="text-sm font-medium">{request.dateNeeded ? new Date(request.dateNeeded).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Created At</p>
                                  <p className="text-sm font-medium">{new Date(request.createdAt).toLocaleString()}</p>
                                </div>
                                {request.approvalNotes && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Approval Notes</p>
                                    <p className="text-sm">{request.approvalNotes}</p>
                                  </div>
                                )}
                              </div>
                              {request.rejectionReason && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                  <p className="text-xs text-red-600 dark:text-red-400">Rejection Reason</p>
                                  <p className="text-sm">{request.rejectionReason}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Requested Items</p>
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Requested</th><th className="px-3 py-2 text-right">Approved</th><th className="px-3 py-2 text-right">Available</th></tr>
                                  </thead>
                                  <tbody>
                                    {request.items.map((item, idx) => (
                                      <tr key={idx} className="border-b">
                                        <td className="px-3 py-2">{item.itemName}</td>
                                        <td className="px-3 py-2 text-right">{item.requestedQuantity} {item.unit}</td>
                                        <td className="px-3 py-2 text-right">{item.approvedQuantity || '-'} {item.unit}</td>
                                        <td className={clsx('px-3 py-2 text-right', item.stockAvailable < (item.approvedQuantity || item.requestedQuantity) ? 'text-red-500' : 'text-green-500')}>
                                          {item.stockAvailable} {item.unit}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request) => {
            const priority = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
            const requestType = requestTypeConfig[request.requestType as keyof typeof requestTypeConfig] || requestTypeConfig.staff_office;
            
            return (
              <Card key={request.id} className="hover:shadow-lg transition">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-500">{request.requestNumber}</span>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                      {priority.icon}
                      {priority.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {requesterTypeIcons[request.requesterType as keyof typeof requesterTypeIcons]}
                    <span>{request.requestedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', requestType.color)}>
                      {requestType.icon}
                      {requestType.label}
                    </span>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">{request.items?.length || 0} items</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }} className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }} className="p-1 hover:bg-gray-100 rounded">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }} className="p-1 hover:bg-gray-100 rounded">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button onClick={() => fulfillRequest(request.id)} className="p-1 hover:bg-gray-100 rounded">
                          <Truck className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Request" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Approving request from <strong>{selectedRequest?.requestedBy}</strong> for {selectedRequest?.items?.length} items
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-2">Item Quantities to Approve</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedRequest?.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
                  <span className="flex-1 text-sm">{item.itemName}</span>
                  <span className="text-xs text-gray-500">Requested: {item.requestedQuantity} {item.unit}</span>
                  <input
                    type="number"
                    value={approvalData.items.find(i => i.itemId === item.itemId)?.approvedQuantity || item.requestedQuantity}
                    onChange={(e) => {
                      const newItems = approvalData.items.map(i => 
                        i.itemId === item.itemId ? { ...i, approvedQuantity: parseInt(e.target.value) || 0 } : i
                      );
                      setApprovalData({ ...approvalData, items: newItems });
                    }}
                    className="w-24 px-2 py-1 border rounded text-sm"
                    min={0}
                    max={item.requestedQuantity}
                  />
                  <span className="text-xs">{item.unit}</span>
                  {item.stockAvailable < (approvalData.items.find(i => i.itemId === item.itemId)?.approvedQuantity || item.requestedQuantity) && (
                    <span className="text-xs text-red-500">(Low stock: {item.stockAvailable})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Approval Notes (Optional)</label>
            <textarea
              value={approvalData.notes}
              onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Add any instructions for the requester..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Pickup Date</label>
              <input
                type="date"
                value={approvalData.expectedPickupDate}
                onChange={(e) => setApprovalData({ ...approvalData, expectedPickupDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={approvalData.expectedDeliveryDate}
                onChange={(e) => setApprovalData({ ...approvalData, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Send Notifications</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={approvalData.sendSms} onChange={(e) => setApprovalData({ ...approvalData, sendSms: e.target.checked })} />
                <Phone className="w-4 h-4" /> SMS
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={approvalData.sendEmail} onChange={(e) => setApprovalData({ ...approvalData, sendEmail: e.target.checked })} />
                <Mail className="w-4 h-4" /> Email
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={approvalData.sendWhatsApp} onChange={(e) => setApprovalData({ ...approvalData, sendWhatsApp: e.target.checked })} />
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
          <Button onClick={approveRequest} disabled={processingId === selectedRequest?.id}>
            {processingId === selectedRequest?.id ? <Spinner size="sm" /> : <Check className="w-4 h-4 mr-1" />}
            Approve Request
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Request" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Rejecting request from <strong>{selectedRequest?.requestedBy}</strong></p>
          
          <div>
            <label className="block text-sm font-medium mb-1">Rejection Reason</label>
            <select
              value={rejectionData.reason}
              onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select a reason...</option>
              {getRejectionReasons().map(reason => (
                <option key={reason} value={reason}>{reason === 'custom' ? 'Other (specify)' : reason}</option>
              ))}
            </select>
          </div>

          {rejectionData.reason === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-1">Custom Reason</label>
              <textarea
                value={rejectionData.customReason}
                onChange={(e) => setRejectionData({ ...rejectionData, customReason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Please provide detailed reason for rejection..."
              />
            </div>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={rejectionData.sendNotification} onChange={(e) => setRejectionData({ ...rejectionData, sendNotification: e.target.checked })} />
            <span className="text-sm">Send notification to requester</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button onClick={rejectRequest} disabled={processingId === selectedRequest?.id} className="bg-red-600 hover:bg-red-700">
            {processingId === selectedRequest?.id ? <Spinner size="sm" /> : <X className="w-4 h-4 mr-1" />}
            Reject Request
          </Button>
        </div>
      </Modal>

      {/* Request Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Request Details" size="lg">
        {selectedRequest && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Request Number</p>
                <p className="font-mono font-bold">{selectedRequest.requestNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig[selectedRequest.status]?.color)}>
                  {statusConfig[selectedRequest.status]?.icon}
                  {statusConfig[selectedRequest.status]?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Requester</p>
                <p className="font-medium">{selectedRequest.requestedBy}</p>
                <p className="text-xs text-gray-500">{selectedRequest.requesterType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Needed</p>
                <p>{selectedRequest.dateNeeded ? new Date(selectedRequest.dateNeeded).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Requested Items</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Requested</th><th className="px-3 py-2 text-right">Approved</th><th className="px-3 py-2 text-right">Available</th></tr>
                </thead>
                <tbody>
                  {selectedRequest.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2 text-right">{item.requestedQuantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{item.approvedQuantity || '-'} {item.unit}</td>
                      <td className={clsx('px-3 py-2 text-right', item.stockAvailable < (item.approvedQuantity || item.requestedQuantity) ? 'text-red-500' : 'text-green-500')}>
                        {item.stockAvailable} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedRequest.approvalNotes && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-800">Approval Notes</p>
                <p className="text-sm">{selectedRequest.approvalNotes}</p>
              </div>
            )}

            {selectedRequest.rejectionReason && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                <p className="text-sm">{selectedRequest.rejectionReason}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => printRequestSlip(selectedRequest)}>
                <Printer className="w-4 h-4 mr-1" />
                Print Slip
              </Button>
              <Button variant="outline" onClick={() => sendNotification(selectedRequest.id, 'sms')}>
                <Phone className="w-4 h-4 mr-1" />
                Send SMS
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
