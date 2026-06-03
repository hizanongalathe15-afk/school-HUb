import { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  RefreshCw,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Smartphone,
  Building,
  Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { feeService } from '../../../services/feeService';
import { studentService } from '../../../services/studentService';

interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  amount: number;
  method: 'MPESA' | 'BANK' | 'CASH' | 'CARD';
  reference: string;
  date: string;
  receivedBy: string;
  status: 'PENDING' | 'VERIFIED' | 'REVERSED';
}

export default function BursarRecordPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    method: 'MPESA' as Payment['method'],
    reference: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadPayments();
    loadStudents();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await feeService.list();
      // Filter to show only payment-like records
      setPayments((response.data || []).filter((item: any) => item.paymentMethod || item.method));
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentService.list();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MPESA': return <Smartphone size={16} />;
      case 'BANK': return <Building size={16} />;
      case 'CASH': return <Banknote size={16} />;
      case 'CARD': return <CreditCard size={16} />;
      default: return <Receipt size={16} />;
    }
  };

  const handleRecordPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.reference) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await feeService.makePayment({
        studentId: newPayment.studentId,
        amount: parseFloat(newPayment.amount),
        method: newPayment.method,
        reference: newPayment.reference,
        date: newPayment.date,
      });
      toast.success('Payment recorded successfully');
      setShowRecordModal(false);
      setNewPayment({
        studentId: '',
        amount: '',
        method: 'MPESA',
        reference: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadPayments();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : studentId;
  };

  const getStudentClass = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.currentClass : 'N/A';
  };

  return (
    <div className="bursar-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Receipt size={24} />
            Record Payments
          </h1>
          <p>Record and manage student fee payments</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
            <Plus size={16} />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Receipt size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{payments.length}</span>
            <span className="stat-label">Total Payments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
            </span>
            <span className="stat-label">Total Collected</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {payments.filter(p => p.status === 'VERIFIED').length}
            </span>
            <span className="stat-label">Verified</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {payments.filter(p => p.status === 'PENDING').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-bar">
        <button className="action-chip" onClick={() => setShowRecordModal(true)}>
          <Smartphone size={16} />
          MPESA Payment
        </button>
        <button className="action-chip" onClick={() => setShowRecordModal(true)}>
          <Building size={16} />
          Bank Transfer
        </button>
        <button className="action-chip" onClick={() => setShowRecordModal(true)}>
          <Banknote size={16} />
          Cash Payment
        </button>
        <button className="action-chip" onClick={() => setShowRecordModal(true)}>
          <CreditCard size={16} />
          Card Payment
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by student name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="MPESA">MPESA</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
        </div>
        <button className="btn btn-icon" title="Export">
          <Download size={18} />
        </button>
        <button className="btn btn-icon" onClick={loadPayments} title="Refresh">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Payments Table */}
      <div className="data-card">
        <div className="table-header">
          <h3>Recent Payments</h3>
          <span className="table-count">{filteredPayments.length} payments</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-cell">
                    <div className="loader" />
                    Loading...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No payments found. Click "Record Payment" to add one.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="cell-primary">
                        {payment.studentName || getStudentName(payment.studentId)}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {payment.studentClass || getStudentClass(payment.studentId)}
                      </span>
                    </td>
                    <td>
                      <strong className="text-success">{formatCurrency(payment.amount)}</strong>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <span>{payment.method}</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-sm">{payment.reference}</code>
                    </td>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <span className={`badge badge-${
                        payment.status === 'VERIFIED' ? 'success' :
                        payment.status === 'PENDING' ? 'warning' : 'danger'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" title="Edit">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="modal-close" onClick={() => setShowRecordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="form-grid">
                <div className="form-group full-width">
                  <label>Student *</label>
                  <select
                    value={newPayment.studentId}
                    onChange={(e) => setNewPayment({ ...newPayment, studentId: e.target.value })}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.currentClass}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                    required
                  >
                    <option value="MPESA">MPESA</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reference/Transaction ID *</label>
                  <input
                    type="text"
                    placeholder="e.g., QHH123456"
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRecordPayment}>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}