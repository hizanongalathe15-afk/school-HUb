import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { BulkOperation, BulkOperationForm, BulkOperationLog } from '../../../types/bursar';

const BursarBulkOperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [logs, setLogs] = useState<BulkOperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [formData, setFormData] = useState<BulkOperationForm>({
    operationType: 'fee_upload',
    description: '',
    parameters: {},
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'viewLogs'>('create');

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const response = await bursarService.bulk.getBulkOperations();
      if (response.success && response.data) {
        setOperations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bulk operations:', error);
      toast.error('Failed to load bulk operations');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (operationId: string) => {
    try {
      const response = await bursarService.bulk.getBulkOperationLogs(operationId);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bulk operation logs:', error);
      toast.error('Failed to load operation logs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (modalType === 'create') {
        response = await bursarService.bulk.createBulkOperation(formData);
      } else {
        // This should not happen; we separate create and execute
        return;
      }
      if (response.success && response.data) {
        toast.success('Bulk operation created successfully');
        setModalOpen(false);
        resetForm();
        await fetchOperations();
        // Automatically execute the operation? Or let user choose?
        // We'll ask the user
        if (window.confirm('Operation created. Execute now?')) {
          const execResponse = await bursarService.bulk.executeBulkOperation(response.data.id);
          if (execResponse.success) {
            toast.success('Bulk operation executed successfully');
          } else {
            toast.error(execResponse.message || 'Failed to execute bulk operation');
          }
        }
      } else {
        toast.error(response.message || 'Failed to create bulk operation');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Failed to create bulk operation');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (operationId: string) => {
    if (window.confirm('Are you sure you want to execute this bulk operation? This action may process multiple records.')) {
      try {
        setLoading(true);
        const response = await bursarService.bulk.executeBulkOperation(operationId);
        if (response.success) {
          toast.success('Bulk operation executed successfully');
          await fetchOperations();
          // Fetch logs after execution
          fetchLogs(operationId);
        } else {
          toast.error(response.message || 'Failed to execute bulk operation');
        }
      } catch (error) {
        console.error('Execution error:', error);
        toast.error('Failed to execute bulk operation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewLogs = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setModalType('viewLogs');
    setModalOpen(true);
    fetchLogs(operation.id);
  };

  const handleDelete = async (operationId: string) => {
    if (window.confirm('Are you sure you want to delete this bulk operation record?')) {
      try {
        setLoading(true);
        const response = await bursarService.bulk.deleteBulkOperation(operationId);
        if (response.success) {
          toast.success('Bulk operation deleted successfully');
          await fetchOperations();
        } else {
          toast.error(response.message || 'Failed to delete bulk operation');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete bulk operation');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      operationType: 'fee_upload',
      description: '',
      parameters: {},
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const operationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fee_upload: 'Fee Upload',
      payment_processing: 'Payment Processing',
      invoice_generation: 'Invoice Generation',
      statement_generation: 'Statement Generation',
      data_export: 'Data Export',
      mass_waiver: 'Mass Fee Waiver',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading bulk operations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Bulk Operations</h1>
        <p className="text-amber-600">Process large volumes of financial data efficiently</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Bulk Operations Management</h2>
            <p className="text-sm text-amber-500 mt-1">
              Total operations: {operations.length}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => {
                resetForm();
                setModalType('create');
                setModalOpen(true);
              }}
              className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
            >
              New Operation
              </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-amber-100">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Records Processed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {operations.map((op) => (
                <tr key={op.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {operationTypeLabel(op.operationType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {op.description || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      op.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : op.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : op.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {op.startedAt ? new Date(op.startedAt).toLocaleString('en-KE') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {op.completedAt ? new Date(op.completedAt).toLocaleString('en-KE') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                    {op.recordsProcessed?.toLocaleString() || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {op.status === 'pending' && (
                      <button
                        onClick={() => handleExecute(op.id)}
                        className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-3 py-1"
                      >
                        Execute
                      </button>
                    )}
                    {op.status !== 'deleted' && (
                      <button
                        onClick={() => handleViewLogs(op)}
                        className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                      >
                        View Logs
                      </button>
                    )}
                    {op.status !== 'deleted' && (
                      <button
                        onClick={() => handleDelete(op.id)}
                        className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {operations.length === 0 && (
                <tr>
                  <td colspan="7" className="px-6 py-4 text-center text-amber-500">
                    No bulk operations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-6">
          {modalType === 'create' && (
            <>
              <h2 className="text-xl font-bold text-amber-800">Create Bulk Operation</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Operation Type
                  </label>
                  <select
                    value={formData.operationType}
                    onChange={(e) => setFormData({ ...formData, operationType: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="fee_upload">Fee Upload</option>
                    <option value="payment_processing">Payment Processing</option>
                    <option value="invoice_generation">Invoice Generation</option>
                    <option value="statement_generation">Statement Generation</option>
                    <option value="data_export">Data Export</option>
                    <option value="mass_waiver">Mass Fee Waiver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Parameters (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(formData.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, parameters: parsed });
                      } catch (err) {
                        // Keep invalid JSON but don't update state; show error via toast?
                        // For simplicity, we'll ignore invalid JSON
                      }
                    }}
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    rows={4}
                    placeholder='{\n  "key": "value"\n}'
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                    disabled={loading}
                  >
                    Create Operation
                  </button>
                </div>
              </form>
            </>
          )}
          {modalType === 'viewLogs' && (
            <>
              <h2 className="text-xl font-bold text-amber-800">Operation Logs</h2>
              {selectedOperation ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-800">
                      {operationTypeLabel(selectedOperation.operationType)}
                    </h3>
                    <p className="text-sm text-amber-600">
                      {selectedOperation.description}
                    </p>
                  </div>
                  {logs.length > 0 ? (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="border-l-2 border-amber-300 pl-3 py-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-amber-800">
                              {new Date(log.timestamp).toLocaleTimeString('en-KE')}
                            </span>
                            <span className={`
                              px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                log.level === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : log.level === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : log.level === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-amber-700">{log.message}</p>
                          {log.details && (
                            <div className="mt-1 text-xs text-amber-500">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-500">No logs available for this operation</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-amber-500">No operation selected</p>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedOperation(null);
                  }}
                  className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BursarBulkOperationsPage;

/* Inline button style */
<style jsx>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>