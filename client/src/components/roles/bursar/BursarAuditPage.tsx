import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { AuditLog, AuditFilter, AuditSummary } from '../../../types/bursar';
import { downloadFromServiceData } from '../../../utils/fileDownload';

const BursarAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AuditFilter>({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    entityType: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, [filter]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      // Fetch logs and summary in parallel
      const [logsRes, summaryRes] = await Promise.all([
        bursarService.audit.getAuditLogs(filter),
        bursarService.audit.getAuditSummary(filter),
      ]);
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await bursarService.audit.exportAuditLog(filter);
      if (response.success) {
        // Assuming the response contains a download URL or blob
        // For simplicity, we'll show a success message
        toast.success('Audit log exported successfully');
        // In a real app, we would trigger a download
        if (response.data) {
          downloadFromServiceData(
            response.data,
            `audit-log-${new Date().toISOString().slice(0, 10)}.json`,
            'application/json'
          );
        }
      } else {
        toast.error(response.message || 'Failed to export audit log');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      approve: 'Approve',
      reject: 'Reject',
      post: 'Post',
      void: 'Void',
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading audit data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Audit Log & Compliance</h1>
        <p className="text-amber-600">Monitor system activities for accountability and compliance</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Audit Summary</h2>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => {
                setFilter({
                  startDate: '',
                  endDate: '',
                  userId: '',
                  action: '',
                  entityType: '',
                });
                fetchAuditData();
              }}
              className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
            >
              Reset Filters
              </button>
            <button
              onClick={handleExport}
              className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
            >
              Export Logs
              </button>
          </div>
        </div>
        <div className="p-6">
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-sm font-medium text-amber-600">Total Actions</h3>
                <p className="text-2xl font-bold text-amber-800 mt-2">
                  {summary?.totalActions?.toLocaleString() || '—'}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-sm font-medium text-amber-600">Unique Users</h3>
                <p className="text-2xl font-bold text-amber-800 mt-2">
                  {summary?.uniqueUsers?.toLocaleString() || '—'}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-sm font-medium text-amber-600">Failed Actions</h3>
                <p className="text-2xl font-bold text-amber-800 mt-2">
                  {summary?.failedActions?.toLocaleString() || '—'}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-sm font-medium text-amber-600">Today's Actions</h3>
                <p className="text-2xl font-bold text-amber-800 mt-2">
                  {summary?.todayActions?.toLocaleString() || '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
              <p className="text-amber-600">Loading summary...</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-amber-800 mb-3">Filter Audit Logs</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={filter.userId}
                  onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Action Type
                </label>
                <select
                  value={filter.action}
                  onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="post">Post</option>
                  <option value="void">Void</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Entity Type
                </label>
                <select
                  value={filter.entityType}
                  onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">All Entities</option>
                  <option value="student">Student</option>
                  <option value="fee">Fee</option>
                  <option value="invoice">Invoice</option>
                  <option value="payment">Payment</option>
                  <option value="expense">Expense</option>
                  <option value="account">Account</option>
                  <option value="user">User</option>
                </select>
              </div>
              {/* Empty div for alignment */}
              <div></div>
              <div></div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => fetchAuditData()}
                className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
              >
                Apply Filters
                </button>
              <button
                onClick={() => {
                  setFilter({
                    startDate: '',
                    endDate: '',
                    userId: '',
                    action: '',
                    entityType: '',
                  });
                  fetchAuditData();
                }}
                className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
              >
                Reset
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-4">Audit Log Entries</h2>
          {auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-amber-100 pb-4 last:border-b-0 last:pb-0 hover:bg-amber-50" onClick={() => handleViewDetails(log)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-800">
                        {actionLabel(log.action)} {log.entityType}
                      </h3>
                      <p className="text-sm text-amber-600 truncate">
                        {log.description}
                      </p>
                    </div>
                    <div className="text-right space-x-3">
                      <span className={`
                        px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      `}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                      <span className="text-sm text-amber-500">
                        {new Date(log.timestamp).toLocaleString('en-KE')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-amber-500 mt-1">
                    Performed by: {log.performedBy || 'System'} • IP: {log.ipAddress || '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-amber-500">No audit log entries found for the selected filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Log Details */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-6">
          {selectedLog ? (
            <>
              <h2 className="text-xl font-bold text-amber-800">Audit Log Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Action Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Action:</p>
                      <p className="text-amber-800">{actionLabel(selectedLog.action)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Entity Type:</p>
                      <p className="text-amber-800">{selectedLog.entityType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Entity ID:</p>
                      <p className="text-amber-800">{selectedLog.entityId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Status:</p>
                      <p className={`
                        px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedLog.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : selectedLog.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      `}>
                        {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Description</h3>
                  <p className="text-amber-700">{selectedLog.description}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Performed By</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-amber-700">User:</p>
                      <p className="text-amber-800">{selectedLog.performedBy || 'System'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">IP Address:</p>
                      <p className="text-amber-800">{selectedLog.ipAddress || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">Timestamp:</p>
                      <p className="text-amber-800">{new Date(selectedLog.timestamp).toLocaleString('en-KE')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">User Agent:</p>
                      <p className="text-amber-800 break-all">{selectedLog.userAgent || '—'}</p>
                    </div>
                  </div>
                </div>
                {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">Changes</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedLog.changes).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-amber-600 font-medium">{key}:</span>
                          <span className="text-amber-800">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-amber-500">No log details available</p>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setSelectedLog(null);
              }}
              className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
            >
              Close
              </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BursarAuditPage;

/* Inline button style */
<style>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>