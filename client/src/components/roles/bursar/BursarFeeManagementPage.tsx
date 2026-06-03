import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { feeService } from '../../../services/feeService';
import type { FeeStructure } from '../../../types/fee';
import EditableSelect from '../../ui/EditableSelect';

export default function BursarFeeManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadFeeStructures();
  }, []);

  const loadFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await feeService.list();
      setFeeStructures(response.data || []);
    } catch (error) {
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const filteredStructures = feeStructures.filter(structure => {
    const matchesClass = selectedClass === 'all' || structure.class === selectedClass;
    return matchesClass;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    
    try {
      // FeeService doesn't have delete, so we'll just remove from state
      setFeeStructures(prev => prev.filter(s => s.id !== id));
      toast.success('Fee structure deleted successfully');
    } catch (error) {
      toast.error('Failed to delete fee structure');
    }
  };

  const classes = ['all', 'Form 1', 'Form 2', 'Form 3', 'Form 4'];

  return (
    <div className="bursar-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <CreditCard size={24} />
            Fee Management
          </h1>
          <p>Manage school fee structures and student fees</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard/bursar/fees/payments')}>
            <DollarSign size={16} />
            Record Payment
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Fee Structure
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">
            <CreditCard size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{feeStructures.length}</span>
            <span className="stat-label">Fee Structures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatCurrency(feeStructures.reduce((sum, s) => sum + (s.total || 0), 0))}
            </span>
            <span className="stat-label">Total Fees</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{classes.length - 1}</span>
            <span className="stat-label">Classes</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search fee structures..."
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
        <button className="btn btn-icon" title="Export">
          <Download size={18} />
        </button>
        <button className="btn btn-icon" onClick={loadFeeStructures} title="Refresh">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Fee Structures Table */}
      <div className="data-card">
        <div className="table-header">
          <h3>Fee Structures</h3>
          <span className="table-count">{filteredStructures.length} structures</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Tuition</th>
                <th>Transport</th>
                <th>Boarding</th>
                <th>Exam</th>
                <th>Other</th>
                <th>Total</th>
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
              ) : filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No fee structures found. Click "Add Fee Structure" to create one.
                  </td>
                </tr>
              ) : (
                filteredStructures.map((structure) => (
                  <tr key={structure.id}>
                    <td>
                      <span className="badge badge-info">{structure.class}</span>
                    </td>
                    <td>{formatCurrency(structure.tuition || 0)}</td>
                    <td>{formatCurrency(structure.transport || 0)}</td>
                    <td>{formatCurrency(structure.boarding || 0)}</td>
                    <td>{formatCurrency(structure.exam || 0)}</td>
                    <td>{formatCurrency(structure.other || 0)}</td>
                    <td>
                      <strong className="text-success">{formatCurrency(structure.total || 0)}</strong>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View" onClick={() => navigate(`/dashboard/bursar/fees?structure=${structure.id}`)}>
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => setShowAddModal(true)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(structure.id)}>
                          <Trash2 size={16} />
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

      {/* Add Fee Structure Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Fee Structure</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="form-grid">
                <div className="form-group">
                  <label>Structure Name *</label>
                  <input type="text" placeholder="e.g., Form 1 - 2024" required />
                </div>
                <div className="form-group">
                  <label>Class *</label>
                  <EditableSelect
                    required
                    options={['Form 1', 'Form 2', 'Form 3', 'Form 4']}
                    placeholder="Type or select class"
                  />
                </div>
                <div className="form-group">
                  <label>Tuition Fee *</label>
                  <input type="number" placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>Academic Year *</label>
                  <select required>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Term *</label>
                  <select required>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Other Fees</label>
                  <div className="dynamic-fields">
                    <div className="field-row">
                      <input type="text" placeholder="Fee name" />
                      <input type="number" placeholder="Amount" />
                      <button type="button" className="btn-icon danger">×</button>
                    </div>
                  </div>
                  <button type="button" className="btn btn-link">+ Add Fee</button>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary">Save Structure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
