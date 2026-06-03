import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2, Eye, RefreshCcw, X, Phone, Mail, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementService } from '../../../services/adminService';
import type { AdminUser } from '../../../types/admin';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { confirmationMessages, createConfirmationWithCallback } from '../../../utils/confirmationHelper';

interface Parent extends AdminUser {
  children: string[];
  childrenNames: string[];
  relationship: 'father' | 'mother' | 'guardian';
  emergencyContact: string;
  address: string;
  occupation: string;
}

export default function AdminParentsPage() {
  const confirmation = useConfirmationDialog();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParents, setTotalParents] = useState(0);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await userManagementService.getAllUsers({
        role: 'PARENT',
        search: searchTerm,
        page: currentPage,
        limit: 20
      });
      setParents(response.users as any);
      setTotalPages(response.pages);
      setTotalParents(response.total);
    } catch (error) {
      toast.error('Failed to load parents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [currentPage, searchTerm]);

  const handleCreateParent = async (data: Partial<Parent>) => {
    try {
      await userManagementService.createUser({
        email: data.email!,
        firstName: data.firstName!,
        lastName: data.lastName!,
        role: 'PARENT',
        phone: data.phone,
        password: 'temp123!'
      });
      toast.success('Parent created successfully');
      fetchParents();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create parent');
      console.error(error);
    }
  };

  const handleUpdateParent = async (id: string, data: Partial<Parent>) => {
    try {
      await userManagementService.updateUser(id, data);
      toast.success('Parent updated successfully');
      fetchParents();
      setShowModal(false);
      setEditingParent(null);
    } catch (error) {
      toast.error('Failed to update parent');
      console.error(error);
    }
  };

  const handleDeleteParent = async (id: string) => {
    const parent = parents.find(p => p.id === id);
    const confirmOptions = createConfirmationWithCallback(
      confirmationMessages.deleteParent(parent?.firstName || parent?.email),
      async () => {
        await userManagementService.deleteUser(id);
        setParents(prev => prev.filter(p => p.id !== id));
        toast.success('Parent deleted successfully');
      }
    );
    await confirmation.confirm(confirmOptions);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Parents Management</h2>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchParents} disabled={loading}>
            <RefreshCcw size={16} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => { /* Export */ }}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingParent(null); setShowModal(true); }}>
            <Plus size={16} /> Add Parent
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading parents...</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Children</th>
                <th>Relationship</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {parent.avatar ? <img src={parent.avatar} alt={parent.firstName} /> : <span>{parent.firstName.charAt(0)}</span>}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{parent.firstName} {parent.lastName}</span>
                        <span className="user-email">{parent.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{((parent as any).childrenNames || []).length} children</td>
                  <td>{(parent as any).relationship || '-'}</td>
                  <td>{parent.phone || '-'}</td>
                  <td>{parent.email || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="View"><Eye size={14} /></button>
                      <button className="action-btn" title="Edit" onClick={() => { setEditingParent(parent as Parent); setShowModal(true); }}><Edit size={14} /></button>
                      <button className="action-btn action-danger" title="Delete" onClick={() => handleDeleteParent(parent.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {parents.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No parents found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="btn btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
        <span className="page-info">Page {currentPage} of {totalPages} ({totalParents} parents)</span>
        <button className="btn btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingParent ? 'Edit Parent' : 'Add New Parent'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);
                if (editingParent) handleUpdateParent(editingParent.id, data as Partial<Parent>);
                else handleCreateParent(data as Partial<Parent>);
              }}>
                <div className="form-grid">
                  <div className="form-group"><label>First Name *</label><input type="text" name="firstName" defaultValue={editingParent?.firstName} required /></div>
                  <div className="form-group"><label>Last Name *</label><input type="text" name="lastName" defaultValue={editingParent?.lastName} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" name="email" defaultValue={editingParent?.email} required /></div>
                  <div className="form-group"><label>Phone</label><input type="tel" name="phone" defaultValue={editingParent?.phone} /></div>
                  <div className="form-group"><label>Relationship</label>
                    <select name="relationship" defaultValue={(editingParent as any)?.relationship}>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Occupation</label><input type="text" name="occupation" defaultValue={(editingParent as any)?.occupation} /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingParent ? 'Update Parent' : 'Create Parent'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page{padding:16px 0;}
        .page-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
        .page-actions{display:flex;gap:8px;flex-wrap:wrap;}
        .filters-bar{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;padding:12px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;}
        .search-box{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;flex:1;min-width:200px;}
        .search-box input{border:none;outline:none;width:100%;}
        .loading-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 0;color:#666;gap:10px;}
        .table-container{background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;overflow:hidden;margin-bottom:12px;}
        .data-table{width:100%;border-collapse:collapse;}
        .data-table thead th{background:#f8fafc;text-align:left;padding:12px 14px;font-size:12px;color:#4b5563;border-bottom:1px solid rgba(0,0,0,0.06);}
        .data-table tbody td{padding:12px 14px;border-bottom:1px solid rgba(0,0,0,0.04);font-size:13px;}
        .data-table tbody tr:hover{background:#fafbff;}
        .user-cell{display:flex;align-items:center;gap:10px;}
        .user-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;background:#e0f2fe;display:flex;align-items:center;justify-content:center;color:#0369a1;font-weight:600;}
        .user-avatar img{width:100%;height:100%;object-fit:cover;}
        .user-info{display:flex;flex-direction:column;}
        .user-name{font-weight:600;}
        .user-email{font-size:12px;color:#64748b;}
        .action-buttons{display:flex;gap:4px;}
        .action-btn{background:none;border:none;padding:6px;border-radius:4px;cursor:pointer;color:#64748b;}
        .action-btn:hover{background:#f1f5f9;color:#1d8a8a;}
        .action-danger:hover{background:#fef2f2;color:#dc2626;}
        .pagination{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 0;}
        .page-info{color:#64748b;font-size:13px;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e5e7eb;}
        .modal-close{background:none;border:none;cursor:pointer;color:#64748b;}
        .modal-body{padding:20px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .form-group{display:flex;flex-direction:column;gap:6px;}
        .form-group label{font-size:13px;font-weight:600;color:#374151;}
        .form-group input,.form-group select{padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;}
        .form-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px;}
        .btn{border-radius:10px;border:1px solid rgba(0,0,0,0.10);padding:9px 12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-size:13px;}
        .btn:disabled{opacity:0.6;cursor:not-allowed;}
        .btn-primary{background:#1d8a8a;color:#fff;border-color:#1d8a8a;}
        .btn-secondary{background:#fff;color:#0f172a;}
        .btn-sm{padding:6px 10px;font-size:12px;}
        .loader{width:42px;height:42px;border-radius:999px;border:3px solid #e5e7eb;border-top-color:#1d8a8a;animation:spin 0.8s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText || 'Confirm'}
        cancelLabel={confirmation.options?.cancelText || 'Cancel'}
        type={confirmation.options?.type || 'default'}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}