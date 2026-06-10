import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { BankAccount, BankAccountForm, BankReconciliation } from '../../../types/bursar';

const BursarBankingPage: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [reconciliation, setReconciliation] = useState<BankReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'reconciliation'>('accounts');
  const [formData, setFormData] = useState<BankAccountForm>({
    accountName: '',
    bankName: '',
    accountNumber: '',
    currency: 'KES',
    openingBalance: 0,
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
    fetchReconciliation();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await bursarService.bank.getBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const response = await bursarService.bank.getBankReconciliation();
      if (response.success && response.data) {
        setReconciliation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank reconciliation:', error);
      toast.error('Failed to load bank reconciliation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (editingId) {
        response = await bursarService.bank.updateBankAccount(editingId, formData);
      } else {
        response = await bursarService.bank.createBankAccount(formData);
      }
      if (response.success) {
        toast.success(response.message || 'Bank account saved successfully');
        setModalOpen(false);
        await fetchBankAccounts();
        resetForm();
      } else {
        toast.error(response.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Bank account save error:', error);
      toast.error('Failed to save bank account');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      try {
        const response = await bursarService.bank.deleteBankAccount(id);
        if (response.success) {
          toast.success('Bank account deleted successfully');
          await fetchBankAccounts();
        } else {
          toast.error(response.message || 'Failed to delete bank account');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete bank account');
      }
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      currency: account.currency,
      openingBalance: account.openingBalance,
      isActive: account.isActive,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      bankName: '',
      accountNumber: '',
      currency: 'KES',
      openingBalance: 0,
      isActive: true,
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
          <span className="ml-4 text-amber-800 font-medium">Loading banking data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Banking Management</h1>
        <p className="text-amber-600">Manage bank accounts and reconciliation</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200">
        <div className="flex border-b border-amber-100">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-3 text-left font-medium ${activeTab === 'accounts' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex-1 px-4 py-3 text-left font-medium ${activeTab === 'reconciliation' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Bank Reconciliation
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'accounts' && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-amber-800">Bank Accounts</h2>
                  <button
                    onClick={() => {
                      resetForm();
                      setModalOpen(true);
                    }}
                    className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                  >
                    Add Account
                    </button>
                </div>
                <p className="text-sm text-amber-500 mt-1">
                  Total accounts: {bankAccounts.length}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-100">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                        Bank Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                        Account Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                        Opening Balance
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
                    {bankAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-amber-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                          {account.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                          {account.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                          {account.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                          {formatCurrency(account.openingBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.isActive ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bankAccounts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-amber-500">
                          No bank accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'reconciliation' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-amber-800">Bank Reconciliation</h2>
                <p className="text-sm text-amber-500 mt-1">
                  Match your bank statements with school records
                </p>
                {!reconciliation ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
                    <p className="text-amber-600">Loading reconciliation data...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="text-sm font-medium text-amber-600">Statement Balance</h3>
                        <p className="text-2xl font-bold text-amber-800 mt-2">
                          {formatCurrency(reconciliation.statementBalance)}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="text-sm font-medium text-amber-600">School Balance</h3>
                        <p className="text-2xl font-bold text-amber-800 mt-2">
                          {formatCurrency(reconciliation.schoolBalance)}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="text-sm font-medium text-amber-600">Difference</h3>
                        <p className={`
                          text-2xl font-bold ${
                            reconciliation.difference === 0
                              ? 'text-green-800'
                              : reconciliation.difference > 0
                              ? 'text-amber-800'
                              : 'text-red-800'
                          }
                        `} mt-2>
                          {formatCurrency(Math.abs(reconciliation.difference))}
                          {reconciliation.difference === 0 ? ' (balanced)' : reconciliation.difference > 0 ? ' (unexplained surplus)' : ' (unexplained shortfall)'}
                        </p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          // Open reconciliation modal or redirect to reconciliation tool
                          toast('Reconciliation tool would open here');
                        }}
                        className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                      >
                        Start Reconciliation
                      </button>
                    </div>
                    {reconciliation.unmatchedTransactions && reconciliation.unmatchedTransactions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-amber-800 mb-3">Unmatched Transactions</h3>
                        <div className="overflow-x-auto">
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
                                  Amount (KES)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-amber-100">
                              {reconciliation.unmatchedTransactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-amber-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                                    {new Date(txn.date).toLocaleDateString('en-KE')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                                    {txn.description}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                                    {formatCurrency(txn.amount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {txn.type === 'credit' ? 'Credit' : 'Debit'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                      onClick={() => {
                                        // Match transaction
                                        toast.success('Transaction matched');
                                      }}
                                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                                    >
                                      Match
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Add as school transaction
                                        toast.success('Added as school transaction');
                                      }}
                                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                                    >
                                      Add
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {reconciliation.unmatchedTransactions.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 text-center text-amber-500">
                                    No unmatched transactions
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal for Bank Account Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-amber-800">
            {editingId ? 'Edit Bank Account' : 'Add New Bank Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="KES">KES (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Opening Balance (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
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
                {editingId ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default BursarBankingPage;
