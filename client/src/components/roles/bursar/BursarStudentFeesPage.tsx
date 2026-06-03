import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { StudentFee, StudentFeeSummary, FeeBreakdown, PaymentRecord } from '../../../types/bursar';

const BursarStudentFeesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentRecord>>({
    amount: 0,
    paymentMethod: '',
    reference: '',
    notes: '',
  });
  const [modalOpen, setModalOpen] = useState(false);

  const searchStudents = async (term: string) => {
    if (!term.trim()) {
      setSelectedStudent(null);
      setFeeBreakdown([]);
      setPaymentHistory([]);
      return;
    }
    try {
      setLoading(true);
      const response = await bursarService.studentFees.searchStudents(term);
      if (response.success && response.data) {
        // Assuming the search returns a list, we take the first match for simplicity
        // In a real app, we might show a list to select from
        setSelectedStudent(response.data[0]);
        await loadStudentDetails(response.data[0].studentId);
      } else {
        toast.error(response.message || 'No students found');
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId: string) => {
    try {
      const [breakdownRes, historyRes] = await Promise.all([
        bursarService.studentFees.getFeeBreakdown(studentId),
        bursarService.studentFees.getPaymentHistory(studentId),
      ]);
      if (breakdownRes.success && breakdownRes.data) {
        setFeeBreakdown(breakdownRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setPaymentHistory(historyRes.data);
      }
    } catch (error) {
      console.error('Failed to load student details:', error);
      toast.error('Failed to load student fee details');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setLoading(true);
      const response = await bursarService.studentFees.recordPayment(selectedStudent.studentId, {
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        date: new Date().toISOString(),
      });
      if (response.success) {
        toast.success('Payment recorded successfully');
        setModalOpen(false);
        resetPaymentForm();
        await loadStudentDetails(selectedStudent.studentId);
      } else {
        toast.error(response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleWaiveFee = async (feeId: string) => {
    if (!selectedStudent) return;
    if (window.confirm('Are you sure you want to waive this fee? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await bursarService.studentFees.waiveFee(selectedStudent.studentId, feeId);
        if (response.success) {
          toast.success('Fee waived successfully');
          await loadStudentDetails(selectedStudent.studentId);
        } else {
          toast.error(response.message || 'Failed to waive fee');
        }
      } catch (error) {
        console.error('Waive fee error:', error);
        toast.error('Failed to waive fee');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: 0,
      paymentMethod: '',
      reference: '',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  if (loading && !selectedStudent) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Searching for student...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Student Fee Management</h1>
        <p className="text-amber-600">Lookup student fees and manage payments</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-amber-800 mb-3">Student Lookup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                Search by Student ID, Name, or Class
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchStudents(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Enter search term..."
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => searchStudents(searchTerm)}
                disabled={loading || !searchTerm.trim()}
                className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStudent(null);
                  setFeeBreakdown([]);
                  setPaymentHistory([]);
                }}
                className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedStudent ? (
        <>
          <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-amber-800">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  <p className="text-sm text-amber-600 mt-1">
                    Student ID: {selectedStudent.studentId}
                  </p>
                  <p className="text-sm text-amber-600">
                    Class: {selectedStudent.className} • Stream: {selectedStudent.stream || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-800">
                    {formatCurrency(selectedStudent.totalOutstanding)}
                  </div>
                  <p className="text-sm text-amber-500">Total Outstanding</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee Breakdown */}
            <div className="bg-white rounded-xl shadow-md border border-amber-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Fee Breakdown</h2>
                {feeBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {feeBreakdown.map((fee) => (
                      <div key={fee.id} className="border-b border-amber-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-amber-800">{fee.description}</h3>
                          <span className={`
                            px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fee.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : fee.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }
                          `}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-amber-500">Amount Due:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(fee.amount)}</p>
                          </div>
                          <div>
                            <span className="text-amber-500">Due Date:</span>
                            <p className="text-amber-800 mt-1">
                              {new Date(fee.dueDate).toLocaleDateString('en-KE')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end space-x-2">
                          {fee.status !== 'paid' && (
                            <button
                              onClick={() => handleWaiveFee(fee.id)}
                              className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1 text-sm"
                            >
                              Waive Fee
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setPaymentForm({
                                amount: fee.amount,
                                paymentMethod: '',
                                reference: '',
                                notes: '',
                              });
                              setModalOpen(true);
                            }}
                            className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm"
                          >
                            Pay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-amber-500">No fee breakdown available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-md border border-amber-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Payment History</h2>
                {paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="border-b border-amber-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-amber-800">
                            Payment #{payment.id.slice(0, 8)}
                          </h3>
                          <span className={`
                            px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.paymentMethod === 'mpesa'
                                ? 'bg-green-100 text-green-800'
                                : payment.paymentMethod === 'bank'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }
                          `}>
                            {payment.paymentMethod
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-amber-500">Amount:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div>
                            <span className="text-amber-500">Date:</span>
                            <p className="text-amber-800 mt-1">
                              {new Date(payment.date).toLocaleDateString('en-KE')}
                            </p>
                          </div>
                        </div>
                        {payment.reference && (
                          <div className="mt-2 text-sm">
                            <span className="text-amber-500">Reference:</span>
                            <p className="text-amber-800 mt-1 block">{payment.reference}</p>
                          </div>
                        )}
                        {payment.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-amber-500">Notes:</span>
                            <p className="text-amber-800 mt-1 block">{payment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-amber-500">No payment history found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-amber-500">Search for a student to view their fee details</p>
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-amber-800">Record Payment</h2>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount || 0}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mpesa">MPESA</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                Reference (optional)
              </label>
              <input
                type="text"
                value={paymentForm.reference || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={paymentForm.notes || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                rows={3}
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
                disabled={loading || !paymentForm.amount || !paymentForm.paymentMethod}
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default BursarStudentFeesPage;

/* Inline button style */
<style>{`
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
  }
`}</style>