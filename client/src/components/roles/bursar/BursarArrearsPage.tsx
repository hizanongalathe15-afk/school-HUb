import { useState, useEffect } from 'react';
import {
  WalletCards,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Phone,
  Mail,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { feeService } from '../../../services/feeService';
import EditableSelect from '../../ui/EditableSelect';
import { studentService } from '../../../services/studentService';
import { bursarService } from '../../../services/bursarService';

interface Arrear {
  studentId: string;
  studentName: string;
  studentClass: string;
  amountOwed: number;
  daysOverdue: number;
  feeStructure: string;
  parentPhone?: string;
  parentEmail?: string;
}

export default function BursarArrearsPage() {
  const [loading, setLoading] = useState(true);
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  const [selectedArrears, setSelectedArrears] = useState<Arrear[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use the real dedicated arrears API
      const arrearsResponse = await bursarService.studentFees.getStudentsInArrears({
        minArrears: 1,
        limit: 500
      });
      
      const realArrears: Arrear[] = (arrearsResponse.data || arrearsResponse.arrears || []).map((item: any) => ({
        studentId: item.studentId || item.student?.id,
        studentName: item.studentName || item.student?.name || `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.trim(),
        studentClass: item.studentClass || item.student?.currentClass || item.className,
        amountOwed: item.amountOwed || item.balance || item.arrearsAmount || 0,
        daysOverdue: item.daysOverdue || item.agingDays || 0,
        feeStructure: item.feeStructure || item.termName || item.feeTerm || 'Current Term',
        parentPhone: item.parentPhone || item.parent?.phone,
        parentEmail: item.parentEmail || item.parent?.email,
      }));
      
      setArrears(realArrears);
      
      // Also fetch students for filters if needed
      const studentsRes = await studentService.list().catch(() => ({ data: [] }));
      setStudents(studentsRes.data || []);
      
    } catch (error) {
      toast.error('Failed to load arrears data from server');
      setArrears([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const filteredArrears = arrears.filter(arrear => {
    const matchesSearch = arrear.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || arrear.studentClass === selectedClass;
    const matchesRange = selectedRange === 'all' || 
      (selectedRange === '30' && arrear.daysOverdue <= 30) ||
      (selectedRange === '60' && arrear.daysOverdue > 30 && arrear.daysOverdue <= 60) ||
      (selectedRange === '90' && arrear.daysOverdue > 60);
    return matchesSearch && matchesClass && matchesRange;
  });

  const totalArrears = arrears.reduce((sum, a) => sum + a.amountOwed, 0);
  const avgDaysOverdue = Math.round(arrears.reduce((sum, a) => sum + a.daysOverdue, 0) / (arrears.length || 1));

  const handleSendReminder = async (arrear: Arrear) => {
    try {
      await bursarService.studentFees.bulkSendArrearsReminders([arrear.studentId], 
        `Dear Parent, ${arrear.studentName} has an outstanding balance of ${formatCurrency(arrear.amountOwed)}. Please make payment at your earliest convenience.`);
      toast.success(`Reminder sent to ${arrear.studentName}'s parent`);
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  const classes = ['all', ...Array.from(new Set(students.map(s => s.currentClass || s.className).filter(Boolean)))];
  const ranges = [
    { value: 'all', label: 'All Time' },
    { value: '30', label: '0-30 Days' },
    { value: '60', label: '31-60 Days' },
    { value: '90', label: '60+ Days' },
  ];

  return (
    <div className="bursar-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <WalletCards size={24} />
            Arrears Management
          </h1>
          <p>Track and manage outstanding fee payments</p>
        </div>
<div className="header-actions">
           <button className="btn btn-secondary" onClick={async () => {
              const ids = selectedArrears.length > 0 ? selectedArrears.map(a => a.studentId) : arrears.map(a => a.studentId);
              if (ids.length === 0) return toast.error('No students');
              try {
                await bursarService.studentFees.bulkSendArrearsReminders(ids, 'Reminder: Please clear your outstanding fees.');
                toast.success(`Reminders sent to ${ids.length} parents`);
              } catch { toast.error('Failed to send'); }
            }}>
             <Send size={16} />
             Send Bulk Reminders
           </button>
          <button className="btn btn-primary" onClick={loadData}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{arrears.length}</span>
            <span className="stat-label">Students in Arrears</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">
            <WalletCards size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalArrears)}</span>
            <span className="stat-label">Total Arrears</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{avgDaysOverdue} days</span>
            <span className="stat-label">Avg. Overdue</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {Math.round((arrears.filter(a => a.daysOverdue <= 30).length / (arrears.length || 1)) * 100)}%
            </span>
            <span className="stat-label">Collectible</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <EditableSelect
            value={selectedClass}
            onChange={setSelectedClass}
            options={classes.map((cls) => ({ value: cls, label: cls === 'all' ? 'All Classes' : cls }))}
            placeholder="Type or select class"
          />
        </div>
        <div className="filter-group">
          <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}>
            {ranges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-icon" title="Export">
          <Download size={18} />
        </button>
      </div>

      {/* Arrears Table */}
      <div className="data-card">
        <div className="table-header">
          <h3>Outstanding Arrears</h3>
          <span className="table-count">{filteredArrears.length} students</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Amount Owed</th>
                <th>Days Overdue</th>
                <th>Fee Structure</th>
                <th>Parent Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-cell">
                    <div className="loader" />
                    Loading...
                  </td>
                </tr>
              ) : filteredArrears.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No arrears found. All students are up to date!
                  </td>
                </tr>
              ) : (
                filteredArrears.map((arrear) => (
                  <tr key={arrear.studentId} className={arrear.daysOverdue > 60 ? 'row-danger' : arrear.daysOverdue > 30 ? 'row-warning' : ''}>
                    <td>
                      <div className="cell-primary">{arrear.studentName}</div>
                      <div className="cell-secondary text-sm">{arrear.studentId}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{arrear.studentClass}</span>
                    </td>
                    <td>
                      <strong className="text-danger">{formatCurrency(arrear.amountOwed)}</strong>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-${
                          arrear.daysOverdue > 60 ? 'danger' : 
                          arrear.daysOverdue > 30 ? 'warning' : 'info'
                        }`}>
                          {arrear.daysOverdue} days
                        </span>
                      </div>
                    </td>
                    <td>{arrear.feeStructure}</td>
                    <td>
                      <div className="contact-info">
                        {arrear.parentPhone && (
                          <span className="contact-item">
                            <Phone size={14} /> {arrear.parentPhone}
                          </span>
                        )}
                        {arrear.parentEmail && (
                          <span className="contact-item">
                            <Mail size={14} /> {arrear.parentEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Send Reminder"
                          onClick={() => handleSendReminder(arrear)}
                        >
                          <Send size={16} />
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

      {/* Quick Stats Panel */}
      <div className="stats-panel">
        <div className="panel-card">
          <h4>Arrears by Class</h4>
          <div className="mini-chart">
            {classes.filter(c => c !== 'all').map(cls => {
              const classArrears = arrears.filter(a => a.studentClass === cls);
              const total = classArrears.reduce((sum, a) => sum + a.amountOwed, 0);
              const percentage = (classArrears.length / arrears.length) * 100;
              return (
                <div key={cls} className="chart-item">
                  <div className="chart-label">{cls}</div>
                  <div className="chart-bar">
                    <div className="chart-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="chart-value">{classArrears.length} students</div>
                  <div className="chart-value text-sm">{formatCurrency(total)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel-card">
          <h4>Collection Priority</h4>
          <div className="priority-list">
            <div className="priority-item high">
              <span className="priority-label">High Priority (60+ days)</span>
              <span className="priority-count">{arrears.filter(a => a.daysOverdue > 60).length}</span>
            </div>
            <div className="priority-item medium">
              <span className="priority-label">Medium Priority (31-60 days)</span>
              <span className="priority-count">{arrears.filter(a => a.daysOverdue > 30 && a.daysOverdue <= 60).length}</span>
            </div>
            <div className="priority-item low">
              <span className="priority-label">Low Priority (0-30 days)</span>
              <span className="priority-count">{arrears.filter(a => a.daysOverdue <= 30).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
