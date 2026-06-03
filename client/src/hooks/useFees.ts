import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Fee, Payment } from '../types/fee';

export interface FeeFilters {
  studentId?: string;
  classId?: string;
  term?: number;
  year?: number;
  status?: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  type?: string;
  search?: string;
}

export interface FeeQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: FeeFilters;
}

export interface FeeStructure {
  id: string;
  classId: string;
  className: string;
  stream?: string;
  boardingStatus: 'BOARDING' | 'DAY';
  items: FeeStructureItem[];
  total: number;
  term: number;
  year: number;
  dueDate: string;
  latePenaltyPercent: number;
}

export interface FeeStructureItem {
  name: string;
  amount: number;
  category: 'TUITION' | 'BOARDING' | 'UNIFORM' | 'ACTIVITIES' | 'TRANSPORT' | 'OTHER';
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  amount: number;
  method: 'MPESA' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'CARD';
  transactionId?: string;
  mpesaReceipt?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentDate: string;
  recordedBy: string;
  receiptNumber?: string;
  notes?: string;
}

export interface FeeBalance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  totalFee: number;
  totalPaid: number;
  balance: number;
  daysOverdue: number;
  isDefaulter: boolean;
}

export interface MpesaTransaction {
  id: string;
  merchantRequestID?: string;
  checkoutRequestID?: string;
  resultCode?: number;
  resultDesc?: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  studentId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface UseFeesReturn {
  fees: Fee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchFees: (params?: FeeQueryParams) => Promise<void>;
  getFeeByStudent: (studentId: string) => Promise<Fee[]>;
  createFee: (data: Partial<Fee>) => Promise<Fee>;
  updateFee: (id: string, data: Partial<Fee>) => Promise<Fee>;
  deleteFee: (id: string) => Promise<void>;
  // Payment operations
  makePayment: (data: Partial<Payment>) => Promise<Payment>;
  getPayments: (studentId?: string) => Promise<Payment[]>;
  getPendingMpesaPayments: () => Promise<MpesaTransaction[]>;
  matchMpesaPayment: (transactionId: string, studentId: string) => Promise<void>;
  approvePayment: (paymentId: string) => Promise<void>;
  // Fee structure
  getFeeStructure: (classId?: string, term?: number, year?: number) => Promise<FeeStructure[]>;
  createFeeStructure: (data: Partial<FeeStructure>) => Promise<FeeStructure>;
  updateFeeStructure: (id: string, data: Partial<FeeStructure>) => Promise<FeeStructure>;
  // Fee balances
  getFeeBalances: (classId?: string, term?: number, year?: number) => Promise<FeeBalance[]>;
  getDefaulters: (daysOverdue?: number) => Promise<FeeBalance[]>;
  // Reports
  getCollectionReport: (startDate?: string, endDate?: string, classId?: string) => Promise<any>;
  exportFeeReport: (format?: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
  // M-PESA
  initiateSTKPush: (phoneNumber: string, amount: number, studentId?: string) => Promise<any>;
  getMpesaCallback: (transactionId: string) => Promise<MpesaTransaction | null>;
}

export function useFees(): UseFeesReturn {
  const [fees, setFees] = useState<Fee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async (params: FeeQueryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'dueDate',
        sortOrder = 'desc',
        filters = {}
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.term) queryParams.append('term', filters.term.toString());
      if (filters.year) queryParams.append('year', filters.year.toString());
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await api.get(`/fees?${queryParams.toString()}`);
      
      setFees(response.data.fees || response.data);
      setTotal(response.data.total || response.data.length);
      setTotalPages(response.data.totalPages || 1);
      setPage(page);
      setLimit(limit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fees');
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeeByStudent = useCallback(async (studentId: string): Promise<Fee[]> => {
    try {
      const response = await api.get(`/fees/student/${studentId}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching student fees:', err);
      return [];
    }
  }, []);

  const createFee = useCallback(async (data: Partial<Fee>): Promise<Fee> => {
    try {
      const response = await api.post('/fees', data);
      setFees(prev => [response.data, ...prev]);
      setTotal(prev => prev + 1);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create fee');
    }
  }, []);

  const updateFee = useCallback(async (id: string, data: Partial<Fee>): Promise<Fee> => {
    try {
      const response = await api.put(`/fees/${id}`, data);
      setFees(prev => prev.map(fee => fee.id === id ? response.data : fee));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update fee');
    }
  }, []);

  const deleteFee = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/fees/${id}`);
      setFees(prev => prev.filter(fee => fee.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete fee');
    }
  }, []);

  const makePayment = useCallback(async (data: Partial<Payment>): Promise<Payment> => {
    try {
      const response = await api.post('/fees/payment', data);
      // Refresh fees list
      await fetchFees({ page: 1, limit });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to make payment');
    }
  }, [fetchFees, limit]);

  const getPayments = useCallback(async (studentId?: string): Promise<Payment[]> => {
    try {
      const queryParams = studentId ? `?studentId=${studentId}` : '';
      const response = await api.get(`/fees/payments${queryParams}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      return [];
    }
  }, []);

  const getPendingMpesaPayments = useCallback(async (): Promise<MpesaTransaction[]> => {
    try {
      const response = await api.get('/fees/mpesa/pending');
      return response.data;
    } catch (err: any) {
      console.error('Error fetching pending M-PESA payments:', err);
      return [];
    }
  }, []);

  const matchMpesaPayment = useCallback(async (transactionId: string, studentId: string): Promise<void> => {
    try {
      await api.post('/fees/mpesa/match', { transactionId, studentId });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to match M-PESA payment');
    }
  }, []);

  const approvePayment = useCallback(async (paymentId: string): Promise<void> => {
    try {
      await api.post(`/fees/payments/${paymentId}/approve`);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to approve payment');
    }
  }, []);

  const getFeeStructure = useCallback(async (classId?: string, term?: number, year?: number): Promise<FeeStructure[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/fees/structure?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching fee structure:', err);
      return [];
    }
  }, []);

  const createFeeStructure = useCallback(async (data: Partial<FeeStructure>): Promise<FeeStructure> => {
    try {
      const response = await api.post('/fees/structure', data);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create fee structure');
    }
  }, []);

  const updateFeeStructure = useCallback(async (id: string, data: Partial<FeeStructure>): Promise<FeeStructure> => {
    try {
      const response = await api.put(`/fees/structure/${id}`, data);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update fee structure');
    }
  }, []);

  const getFeeBalances = useCallback(async (classId?: string, term?: number, year?: number): Promise<FeeBalance[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/fees/balances?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching fee balances:', err);
      return [];
    }
  }, []);

  const getDefaulters = useCallback(async (daysOverdue: number = 30): Promise<FeeBalance[]> => {
    try {
      const response = await api.get(`/fees/defaulters?days=${daysOverdue}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching defaulters:', err);
      return [];
    }
  }, []);

  const getCollectionReport = useCallback(async (startDate?: string, endDate?: string, classId?: string): Promise<any> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (classId) queryParams.append('classId', classId);

      const response = await api.get(`/fees/reports/collection?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching collection report:', err);
      return null;
    }
  }, []);

  const exportFeeReport = useCallback(async (format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    try {
      const response = await api.get(`/fees/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to export fee report');
    }
  }, []);

  const initiateSTKPush = useCallback(async (phoneNumber: string, amount: number, studentId?: string): Promise<any> => {
    try {
      const response = await api.post('/fees/mpesa/stkpush', { phoneNumber, amount, studentId });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to initiate STK Push');
    }
  }, []);

  const getMpesaCallback = useCallback(async (transactionId: string): Promise<MpesaTransaction | null> => {
    try {
      const response = await api.get(`/fees/mpesa/${transactionId}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching M-PESA callback:', err);
      return null;
    }
  }, []);

  return {
    fees,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchFees,
    getFeeByStudent,
    createFee,
    updateFee,
    deleteFee,
    makePayment,
    getPayments,
    getPendingMpesaPayments,
    matchMpesaPayment,
    approvePayment,
    getFeeStructure,
    createFeeStructure,
    updateFeeStructure,
    getFeeBalances,
    getDefaulters,
    getCollectionReport,
    exportFeeReport,
    initiateSTKPush,
    getMpesaCallback
  };
}

export default useFees;