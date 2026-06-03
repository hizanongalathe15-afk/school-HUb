import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Phone, 
  Download, 
  History, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  Banknote,
  Smartphone,
  Lock,
  Shield
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentChild, FeeBalance, FeePayment, FeeStructure } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

type PaymentMode = 'mpesa' | 'card' | 'bank_transfer';
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: PaymentMode;
  status: PaymentStatus;
  transactionId?: string;
  reference?: string;
  createdAt: string;
  receiptUrl?: string;
  notes?: string;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ParentFees: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [balance, setBalance] = useState<FeeBalance | null>(null);
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [bankReference, setBankReference] = useState('');
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('payment');

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const loadChildren = useCallback(async () => {
    try {
      const res = await parentService.children.getMyChildren();
      if (res.success && res.data) {
        setChildren(res.data);
        if (res.data[0] && !selectedChildId) {
          setSelectedChildId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      setError('Failed to load children data');
    }
  }, [selectedChildId]);

  const refreshChildData = useCallback(async (childId: string, showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const [balRes, structureRes, paymentsRes] = await Promise.all([
        parentService.fees.getChildFeeBalance(childId),
        parentService.fees.getFeeStructure(childId),
        parentService.fees.getPaymentHistory(childId),
      ]);

      if (balRes?.success && balRes.data) setBalance(balRes.data);
      if (structureRes?.success && structureRes.data) setFeeStructure(structureRes.data);
      if (paymentsRes?.success && paymentsRes.data) {
        setPaymentHistory(paymentsRes.data.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          transactionId: p.transactionId,
          reference: p.reference,
          createdAt: p.createdAt,
          receiptUrl: p.receiptUrl,
          notes: p.notes,
        })));
      }
    } catch (err) {
      console.error('Failed to load fee data:', err);
      setError('Failed to load fee information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      refreshChildData(selectedChildId);
    }
  }, [selectedChildId, refreshChildData]);

  const handleRefresh = useCallback(() => {
    if (selectedChildId) {
      refreshChildData(selectedChildId, true);
    }
  }, [selectedChildId, refreshChildData]);

  const handlePay = useCallback(async () => {
    if (!selectedChildId) {
      setError('Please select a child');
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      let res;
      
      if (paymentMode === 'mpesa') {
        const amount = Number(mpesaAmount);
        if (!amount || amount <= 0) {
          setError('Please enter a valid amount');
          return;
        }
        if (!mpesaPhone || mpesaPhone.length < 10) {
          setError('Please enter a valid phone number');
          return;
        }

        res = await parentService.fees.makeMPESAPayment(
          selectedChildId, 
          amount, 
          mpesaPhone
        );
        
        if (res?.success) {
          setSuccess(`Payment of ${formatCurrency(amount)} initiated! Check your phone for STK push.`);
          setMpesaAmount(0);
          setMpesaPhone('');
          setTimeout(() => refreshChildData(selectedChildId, true), 3000);
        }
      } else if (paymentMode === 'card') {
        const amount = Number(cardAmount);
        if (!amount || amount <= 0) {
          setError('Please enter a valid amount');
          return;
        }
        if (!cardNumber || !cardExpiry || !cardCvv) {
          setError('Please enter complete card details');
          return;
        }

        res = await parentService.fees.makeCardPayment(
          selectedChildId,
          amount,
          { cardNumber, cardExpiry, cardCvv }
        );
        
        if (res?.success) {
          setSuccess(`Payment of ${formatCurrency(amount)} processed successfully!`);
          setCardAmount(0);
          setCardNumber('');
          setCardExpiry('');
          setCardCvv('');
          refreshChildData(selectedChildId, true);
        }
      } else if (paymentMode === 'bank_transfer') {
        const amount = Number(bankAmount);
        if (!amount || amount <= 0) {
          setError('Please enter a valid amount');
          return;
        }
        if (!bankReference) {
          setError('Please enter bank reference number');
          return;
        }

        res = await parentService.fees.confirmBankTransfer(
          selectedChildId,
          amount,
          bankReference
        );
        
        if (res?.success) {
          setSuccess(`Bank transfer of ${formatCurrency(amount)} confirmed!`);
          setBankAmount(0);
          setBankReference('');
          refreshChildData(selectedChildId, true);
        }
      }

      if (!res?.success) {
        setError(res?.message || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
      setTimeout(() => setSuccess(null), 5000);
      setTimeout(() => setError(null), 5000);
    }
  }, [paymentMode, selectedChildId, mpesaAmount, mpesaPhone, cardAmount, cardNumber, cardExpiry, cardCvv, bankAmount, bankReference, refreshChildData]);

  const downloadReceipt = useCallback(async (paymentId: string) => {
    setLoadingReceiptId(paymentId);
    try {
      const blob = await parentService.fees.downloadReceipt(paymentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${paymentId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess('Receipt downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Receipt download failed:', err);
      setError('Failed to download receipt');
    } finally {
      setLoadingReceiptId(null);
    }
  }, []);

  const getStatusBadge = useCallback((status: PaymentStatus) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    };
    
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      processing: <RefreshCw className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
      refunded: <RefreshCw className="w-3 h-3" />
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }, []);

  const totalFee = balance?.totalFee ?? 0;
  const paidAmount = balance?.paidAmount ?? 0;
  const remainingBalance = balance?.balance ?? 0;
  const progressPercent = totalFee > 0 ? Math.min(100, (paidAmount / totalFee) * 100) : 0;

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading fee information..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Fees & Payments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage school fees, view payment history, and make payments
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          isLoading={refreshing}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Child Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.className} ({c.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          
          {selectedChild && (
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Class:</span> {selectedChild.className}
              </div>
              <div>
                <span className="font-medium">Adm No:</span> {selectedChild.admissionNumber}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(remainingBalance)}</p>
            </div>
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
          {remainingBalance > 0 && (
            <p className="text-xs mt-2 opacity-80">Due for {balance?.dueDate ? new Date(balance.dueDate).toLocaleDateString() : 'immediate payment'}</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalFee)}</p>
            </div>
            <Banknote className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payment Progress</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm font-medium mt-1 text-gray-900 dark:text-white">
                {Math.round(progressPercent)}% Complete
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fee Structure */}
      {feeStructure.length > 0 && (
        <Card title="Fee Structure">
          <div className="space-y-3">
            {feeStructure.map((fee) => (
              <div key={fee.id} className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{fee.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(fee.amount)}</p>
                  {fee.paid && <p className="text-xs text-green-600">Paid</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment Section */}
      <Card title="Make a Payment">
        {/* Payment Method Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { mode: 'mpesa', label: 'M-Pesa', icon: <Smartphone className="w-4 h-4" /> },
            { mode: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
            { mode: 'bank_transfer', label: 'Bank Transfer', icon: <Banknote className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setPaymentMode(tab.mode as PaymentMode)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2',
                paymentMode === tab.mode
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* M-Pesa Form */}
        {paymentMode === 'mpesa' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                icon={<Smartphone className="w-4 h-4" />}
              />
              <Input
                label="Amount (KES)"
                type="number"
                value={mpesaAmount || ''}
                onChange={(e) => setMpesaAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min={0}
                icon={<Banknote className="w-4 h-4" />}
              />
            </div>
            <Button
              onClick={handlePay}
              isLoading={paymentLoading}
              fullWidth
              icon={<Phone className="w-4 h-4" />}
            >
              Pay with M-Pesa
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              You will receive an STK push on your phone to complete the payment
            </p>
          </div>
        )}

        {/* Card Form */}
        {paymentMode === 'card' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Card Number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                icon={<CreditCard className="w-4 h-4" />}
              />
              <Input
                label="Amount (KES)"
                type="number"
                value={cardAmount || ''}
                onChange={(e) => setCardAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min={0}
              />
              <Input
                label="Expiry Date"
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="MM/YY"
              />
              <Input
                label="CVV"
                type="password"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                placeholder="123"
                maxLength={4}
              />
            </div>
            <Button
              onClick={handlePay}
              isLoading={paymentLoading}
              fullWidth
              icon={<Lock className="w-4 h-4" />}
            >
              Pay with Card
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              Secure payment processed via SSL
            </div>
          </div>
        )}

        {/* Bank Transfer Form */}
        {paymentMode === 'bank_transfer' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">Bank Details</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Bank: KCB Bank Kenya</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Account Name: School Hub</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Account Number: 1234567890</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Reference: {selectedChild?.admissionNumber || 'Student ID'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount (KES)"
                type="number"
                value={bankAmount || ''}
                onChange={(e) => setBankAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min={0}
              />
              <Input
                label="Transaction Reference"
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="Enter bank reference number"
              />
            </div>
            <Button
              onClick={handlePay}
              isLoading={paymentLoading}
              fullWidth
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Confirm Bank Transfer
            </Button>
          </div>
        )}
      </Card>

      {/* Payment History */}
      <Card 
        title="Payment History"
        header={
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {paymentHistory.length} transactions
            </span>
          </div>
        }
      >
        {paymentHistory.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Reference</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {payment.transactionId || payment.reference || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 capitalize">
                        {payment.method === 'mpesa' && <Smartphone className="w-3 h-3" />}
                        {payment.method === 'card' && <CreditCard className="w-3 h-3" />}
                        {payment.method === 'bank_transfer' && <Banknote className="w-3 h-3" />}
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.receiptUrl && payment.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadReceipt(payment.id)}
                          isLoading={loadingReceiptId === payment.id}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ParentFees;