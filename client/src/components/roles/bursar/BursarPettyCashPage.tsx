import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { PettyCashTransaction, PettyCashTransactionForm } from '../../../types/bursar';

const BursarPettyCashPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<PettyCashTransactionForm>({
    amount: 0,
    description: '',
    type: 'expense', // or 'income'
    date: new Date().toISOString().split('T')[0],
    reference: '',
    category: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await bursarService.pettyCash.getTransactions();
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch petty cash transactions:', error);
      toast.error('Failed to load petty cash transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (editingId) {
        response = await bursarService.pettyCash.updateTransaction(editingId, formData);
      } else {
        response = await bursarService.pettyCash.createTransaction(formData);
      }
      if (response.success) {
        toast.success(response.message || 'Transaction saved successfully');
        setModalOpen(false);
        await fetchTransactions();
        resetForm();
      } else {
        toast.error(response.message || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Transaction save error:', error);
      toast.error('Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await bursarService.pettyCash.deleteTransaction(id);
        if (response.success) {
          toast.success('Transaction deleted successfully');
          await fetchTransactions();
        } else {
          toast.error(response.message || 'Failed to delete transaction');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete transaction');
      }
    }
  };

  const handleEdit = (transaction: PettyCashTransaction) => {
    setEditingId(transaction.id);
    setFormData({
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      date: transaction.date,
      reference: transaction.reference || '',
      category: transaction.category || '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      description: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      category: '',
    });
    setEditingId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading petty cash transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Petty Cash Management</h1>
        <p className="text-amber-600">Track and manage petty cash transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Petty Cash Transactions</h2>
            <p className="text-sm text-amber-500 mt-1">
              Total balance: {formatCurrency(
                transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
            >
              Add Transaction
            </button>
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
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Amount (KES)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {new Date(transaction.date).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {transaction.category || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500">
                    {transaction.reference || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-amber-500">
                    No petty cash transactions found
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
          <h2 className="text-xl font-bold text-amber-800">
            {editingId ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
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
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
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
                {editingId ? 'Update Transaction' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default BursarPettyCashPage;

/* Inline button style */
<style>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>