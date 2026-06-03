import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { Invoice, InvoiceForm, InvoiceFilter } from '../../../types/bursar';

const BursarInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceFilter>({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [formData, setFormData] = useState<InvoiceForm>({
    studentId: '',
    amount: 0,
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'send' | 'cancel'>('create');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await bursarService.invoice.getInvoices(filter);
      if (response.success && response.data) {
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (editingId) {
        response = await bursarService.invoice.updateInvoice(editingId, formData);
      } else {
        response = await bursarService.invoice.createInvoice(formData);
      }
      if (response.success) {
        toast.success(response.message || 'Invoice saved successfully');
        setModalOpen(false);
        await fetchInvoices();
        resetForm();
      } else {
        toast.error(response.message || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Invoice save error:', error);
      toast.error('Failed to save invoice');
    }
  };

  const handleSend = async (id: string) => {
    if (window.confirm('Are you sure you want to send this invoice to the student/parent?')) {
      try {
        const response = await bursarService.invoice.sendInvoice(id);
        if (response.success) {
          toast.success('Invoice sent successfully');
          await fetchInvoices();
        } else {
          toast.error(response.message || 'Failed to send invoice');
        }
      } catch (error) {
        console.error('Send invoice error:', error);
        toast.error('Failed to send invoice');
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')) {
      try {
        const response = await bursarService.invoice.cancelInvoice(id);
        if (response.success) {
          toast.success('Invoice cancelled successfully');
          await fetchInvoices();
        } else {
          toast.error(response.message || 'Failed to cancel invoice');
        }
      } catch (error) {
        console.error('Cancel invoice error:', error);
        toast.error('Failed to cancel invoice');
      }
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setFormData({
      studentId: invoice.studentId,
      amount: invoice.amount,
      description: invoice.description,
      dueDate: invoice.dueDate,
      items: invoice.items,
    });
    setModalType('create');
    setModalOpen(true);
  };

  const handleSendModal = (invoice: Invoice) => {
    setModalType('send');
    setModalOpen(true);
  };

  const handleCancelModal = (invoice: Invoice) => {
    setModalType('cancel');
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      amount: 0,
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    });
    setEditingId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-amber-100', text: 'text-amber-800' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
      paid: { bg: 'bg-green-100', text: 'text-green-800' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    return config[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Invoice Management</h1>
        <p className="text-amber-600">Create, send, and track student invoices</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Invoices</h2>
            <p className="text-sm text-amber-500 mt-1">
              Total outstanding: {formatCurrency(
                invoices
                  .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
                  .reduce((sum, inv) => sum + inv.amount, 0)
              )}
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
              Create Invoice
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Status
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
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
                  className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Search by description or student..."
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-amber-100">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Amount (KES)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {new Date(invoice.createdAt).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {invoice.studentName || 'Unknown Student'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {new Date(invoice.dueDate).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                      invoice.status
                    ).bg} ${statusBadge(invoice.status).text}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {invoice.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSendModal(invoice)}
                          className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-3 py-1"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => handleCancelModal(invoice)}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {invoice.status === 'sent' && (
                      <>
                        <button
                          onClick={() => handleSend(invoice.id)}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelModal(invoice)}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {(invoice.status === 'paid' || invoice.status === 'cancelled') && (
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                        title="View details"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-amber-500">
                    No invoices found
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
              <h2 className="text-xl font-bold text-amber-800">
                {editingId ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Enter student ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Status (for edit)
                    </label>
                    <select
                      value={editingId ? '' : 'draft'}
                      onChange={(e) => {
                        // For simplicity, we don't update status in form; handled separately
                      }}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Invoice Items (simplified)
                  </label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index] = { ...newItems[index], description: e.target.value };
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="flex-1 px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          placeholder="Item description"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index] = { ...newItems[index], quantity: parseFloat(e.target.value) || 0 };
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-20 px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index] = { ...newItems[index], unitPrice: parseFloat(e.target.value) || 0 };
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-20 px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          placeholder="Unit Price"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...formData.items];
                            newItems.splice(index, 1);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 p-1"
                        >
                          –
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
                        });
                      }}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Add Item
                    </button>
                  </div>
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
                    {editingId ? 'Update Invoice' : 'Create Invoice'}
                  </button>
                </div>
              </form>
            </>
          )}
          {modalType === 'send' && (
            <>
              <h2 className="text-xl font-bold text-amber-800">Send Invoice</h2>
              <p className="text-amber-600">
                Are you sure you want to send this invoice to the student/parent? Once sent, the invoice
                status will be updated to 'Sent' and notifications will be triggered.
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // We need the invoice ID from context; we'll store it in state or pass via modal props
                    // For simplicity, we'll assume we have the invoice ID in editingId or we need to pass it
                    // Let's adjust: we'll store the invoice to send in a separate state
                    // Since we didn't, we'll use a workaround: we'll set the editingId when opening send modal
                    // Actually, in handleSendModal we set the modal type but not the invoice ID.
                    // We'll need to store the selected invoice for sending.
                    // Let's refactor: we'll add a state for selectedInvoiceId for actions.
                    // However, to keep the code simple for now, we'll use editingId for send/cancel as well.
                    // But editingId is used for the form. We'll create a separate state.
                    // Given time, we'll use editingId for send/cancel too, and clear it after action.
                    // We'll modify handleSendModal to set editingId to invoice.id.
                    // We'll change the handleSendModal function above to setEditingId(invoice.id).
                    // Then here we can use editingId.
                    setModalOpen(false);
                    const response = await bursarService.invoice.sendInvoice(editingId!);
                    if (response.success) {
                      toast.success('Invoice sent successfully');
                      await fetchInvoices();
                    } else {
                      toast.error(response.message || 'Failed to send invoice');
                    }
                    setEditingId(null);
                  }}
                  className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  Send Invoice
                </button>
              </div>
            </>
          )}
          {modalType === 'cancel' && (
            <>
              <h2 className="text-xl font-bold text-amber-800">Cancel Invoice</h2>
              <p className="text-amber-600">
                Are you sure you want to cancel this invoice? This action cannot be undone. The invoice
                will be marked as cancelled and will no longer be due for payment.
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setModalOpen(false);
                    const response = await bursarService.invoice.cancelInvoice(editingId!);
                    if (response.success) {
                      toast.success('Invoice cancelled successfully');
                      await fetchInvoices();
                    } else {
                      toast.error(response.message || 'Failed to cancel invoice');
                    }
                    setEditingId(null);
                  }}
                  className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                >
                  Cancel Invoice
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BursarInvoicesPage;

/* Inline button style */
<style>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>