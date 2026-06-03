// client/src/components/roles/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Eye, KeyRound, Trash2, UserX, 
  Plus, Search, Filter, ChevronLeft, ChevronRight,
  Users, UserCheck, UserMinus, Shield, Mail, Phone,
  Calendar, Activity, Settings, MoreVertical, Lock,
  Unlock, RefreshCw, Download, Upload, Edit2,
  Copy, Send, AlertCircle, Star, StarOff
} from 'lucide-react';
import { userManagementService } from '../../../services/adminService';
import type { AdminUser } from '../../../types/admin';
import toast from 'react-hot-toast';

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'locked';
  sortBy?: 'name' | 'email' | 'lastLogin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'lastLogin' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

  const roleOptions = [
    { value: '', label: 'All Roles', icon: <Users size={14} /> },
    { value: 'ADMIN', label: 'Admin', icon: <Shield size={14} /> },
    { value: 'PRINCIPAL', label: 'Principal', icon: <Star size={14} /> },
    { value: 'TEACHER', label: 'Teacher', icon: <Users size={14} /> },
    { value: 'PARENT', label: 'Parent', icon: <Users size={14} /> },
    { value: 'STUDENT', label: 'Student', icon: <Users size={14} /> },
    { value: 'BURSAR', label: 'Bursar', icon: <Shield size={14} /> },
    { value: 'STORE_KEEPER', label: 'Store Keeper', icon: <Shield size={14} /> },
  ];

  const fetchUsers = async (filters: UserFilters = {}) => {
    try {
      setLoading(true);
      const response = await userManagementService.getAllUsers({
        role: filters.role || selectedRole || undefined,
        search: filters.search || searchQuery || undefined,
        status: filters.status || statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: filters.sortBy || sortBy,
        sortOrder: filters.sortOrder || sortOrder,
        page: filters.page || page,
        limit: 20,
      });
      setUsers(response.users);
      setTotal(response.total);
      setPages(response.pages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page: 1 });
  }, [selectedRole, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers({ page: 1 });
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setPage(1);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive' | 'locked') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSort = (field: 'name' | 'email' | 'lastLogin' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewUser = async (userId: string) => {
    try {
      try { await userManagementService.incrementProfileView(userId); } catch (err) { /* non-fatal */ }
      const user = await userManagementService.getUser(userId);
      setSelectedUser(user);
      setShowUserDetails(true);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user details');
    }
  };

  const handleEditUser = async (userId: string) => {
    try {
      const user = await userManagementService.getUser(userId);
      setSelectedUser(user);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Failed to load user data');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userManagementService.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers({ page });
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (confirm(`Reset password for ${userName}? A temporary password will be sent to their email.`)) {
      try {
        await userManagementService.resetPassword(userId);
        setPasswordResetSuccess(userId);
        toast.success(`Password reset email sent to ${userName}`);
        setTimeout(() => setPasswordResetSuccess(null), 3000);
      } catch (error) {
        toast.error('Failed to reset password');
      }
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    if (confirm(`Block ${userName}? They will not be able to log in.`)) {
      try {
        await userManagementService.blockUser(userId);
        toast.success(`${userName} has been blocked`);
        fetchUsers({ page });
      } catch (error) {
        toast.error('Failed to block user');
      }
    }
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    try {
      await userManagementService.unblockUser(userId);
      toast.success(`${userName} has been unblocked`);
      fetchUsers({ page });
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedUsers.map(id => userManagementService.deleteUser(id)));
        toast.success(`${selectedUsers.length} users deleted`);
        setSelectedUsers([]);
        setShowBulkActions(false);
        fetchUsers({ page });
      } catch (error) {
        toast.error('Failed to delete some users');
      }
    }
  };

  const handleBulkBlock = async () => {
    if (confirm(`Block ${selectedUsers.length} users?`)) {
      try {
        await Promise.all(selectedUsers.map(id => userManagementService.blockUser(id)));
        toast.success(`${selectedUsers.length} users blocked`);
        setSelectedUsers([]);
        setShowBulkActions(false);
        fetchUsers({ page });
      } catch (error) {
        toast.error('Failed to block some users');
      }
    }
  };

  const handleExportUsers = async () => {
    setExporting(true);
    try {
      const blob = await userManagementService.exportUsers({
        role: selectedRole || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      ADMIN: 'role-badge admin',
      PRINCIPAL: 'role-badge principal',
      TEACHER: 'role-badge teacher',
      PARENT: 'role-badge parent',
      STUDENT: 'role-badge student',
      BURSAR: 'role-badge bursar',
      STORE_KEEPER: 'role-badge store-keeper',
    };
    return classes[role] || 'role-badge default';
  };

  const getRoleDisplayName = (role: string) => {
    const names: Record<string, string> = {
      ADMIN: 'Administrator',
      PRINCIPAL: 'Principal',
      TEACHER: 'Teacher',
      PARENT: 'Parent',
      STUDENT: 'Student',
      BURSAR: 'Bursar',
      STORE_KEEPER: 'Store Keeper',
    };
    return names[role] || role;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-title">
          <h1>User Management</h1>
          <p>Manage all users, roles, permissions, and access control</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleExportUsers} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button className="btn-outline" onClick={() => setShowBulkImportModal(true)}>
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.isActive && !u.accountLocked).length}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <UserMinus size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => !u.isActive).length}</span>
            <span className="stat-label">Inactive</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon locked">
            <Lock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.accountLocked).length}</span>
            <span className="stat-label">Locked</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">Search</button>
        </form>

        <div className="filter-group">
          <Filter size={16} />
          <select value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value as any)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <div className="filter-group">
          <select value={sortBy} onChange={(e) => handleSort(e.target.value as any)} className="filter-select">
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="lastLogin">Sort by Last Login</option>
            <option value="createdAt">Sort by Created</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-direction">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Role Filters */}
      <div className="role-filters">
        {roleOptions.map((option) => (
          <button
            key={option.value}
            className={`role-filter-btn ${selectedRole === option.value ? 'active' : ''}`}
            onClick={() => handleRoleFilter(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-count">{selectedUsers.length} users selected</span>
          <div className="bulk-actions">
            <button className="bulk-action-btn" onClick={handleBulkBlock}>
              <Lock size={16} /> Block
            </button>
            <button className="bulk-action-btn danger" onClick={handleBulkDelete}>
              <Trash2 size={16} /> Delete
            </button>
            <button className="bulk-action-btn" onClick={() => setSelectedUsers([])}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  User {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Role</th>
                <th>Contact</th>
                <th className="sortable" onClick={() => handleSort('lastLogin')}>
                  Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="checkbox"
                    />
                  </td>
                  <td className="user-cell">
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.firstName} />
                      ) : (
                        <span className="avatar-initials">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.firstName} {user.lastName}</div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-id">ID: {user.id.slice(0, 8)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="contact-cell">
                    {user.phone && (
                      <div className="contact-item">
                        <Phone size={12} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="last-login-cell">
                    {user.lastLogin ? (
                      <div className="last-login-time">{formatDate(user.lastLogin)}</div>
                    ) : (
                      <span className="never-login">Never logged in</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <div className="status-indicators">
                      <span className={`status-badge ${user.isActive && !user.accountLocked ? 'active' : user.accountLocked ? 'locked' : 'inactive'}`}>
                        {user.isActive && !user.accountLocked ? 'Active' : user.accountLocked ? 'Locked' : 'Inactive'}
                      </span>
                      {passwordResetSuccess === user.id && (
                        <span className="reset-success">✓ Password reset</span>
                      )}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="action-icon" onClick={() => handleViewUser(user.id)} title="View Details">
                      <Eye size={16} />
                    </button>
                    <button className="action-icon" onClick={() => handleEditUser(user.id)} title="Edit User">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-icon" onClick={() => handleResetPassword(user.id, `${user.firstName} ${user.lastName}`)} title="Reset Password">
                      <KeyRound size={16} />
                    </button>
                    {user.isActive && !user.accountLocked ? (
                      <button className="action-icon warning" onClick={() => handleBlockUser(user.id, `${user.firstName} ${user.lastName}`)} title="Block User">
                        <Lock size={16} />
                      </button>
                    ) : user.accountLocked ? (
                      <button className="action-icon success" onClick={() => handleUnblockUser(user.id, `${user.firstName} ${user.lastName}`)} title="Unblock User">
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button className="action-icon success" onClick={() => handleUnblockUser(user.id, `${user.firstName} ${user.lastName}`)} title="Activate User">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button className="action-icon danger" onClick={() => handleDeleteUser(user.id)} title="Delete User">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p>No users found</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Add your first user
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let pageNum = page;
              if (pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pages - 2) {
                pageNum = pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`page-number ${page === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {pages > 5 && page < pages - 2 && <span className="page-dots">...</span>}
            {pages > 5 && page < pages - 2 && (
              <button className="page-number" onClick={() => handlePageChange(pages)}>
                {pages}
              </button>
            )}
          </div>
          <button
            className="page-btn"
            disabled={page === pages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={() => setShowUserDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-profile-header">
                <div className="profile-avatar-large">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.firstName} />
                  ) : (
                    <span>{selectedUser.firstName?.charAt(0)}</span>
                  )}
                </div>
                <div className="profile-info-large">
                  <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <span className={getRoleBadgeClass(selectedUser.role)}>
                    {getRoleDisplayName(selectedUser.role)}
                  </span>
                  <div className="profile-meta">
                    <span><Mail size={14} /> {selectedUser.email}</span>
                    {selectedUser.phone && <span><Phone size={14} /> {selectedUser.phone}</span>}
                  </div>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="detail-section">
                  <h4>Account Information</h4>
                  <div className="detail-row">
                    <span className="label">User ID</span>
                    <span className="value">{selectedUser.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status</span>
                    <span className={`value ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Account Locked</span>
                    <span className="value">{selectedUser.accountLocked ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">2FA Enabled</span>
                    <span className="value">{selectedUser.twoFactorEnabled ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Activity</h4>
                  <div className="detail-row">
                    <span className="label">Last Login</span>
                    <span className="value">{formatDate(selectedUser.lastLogin)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Account Created</span>
                    <span className="value">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Login Count</span>
                    <span className="value">{selectedUser.loginCount || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Profile Views</span>
                    <span className="value">{selectedUser.profileViews ?? 0}</span>
                  </div>
                </div>
              </div>

              {selectedUser.sessions && selectedUser.sessions.length > 0 && (
                <div className="sessions-section">
                  <h4>Active Sessions</h4>
                  <div className="sessions-list">
                    {selectedUser.sessions.filter(s => s.isActive).map((session) => (
                      <div key={session.id} className="session-item">
                        <div className="session-device">{session.userAgent}</div>
                        <div className="session-ip">IP: {session.ipAddress}</div>
                        <div className="session-time">Last active: {formatDate(session.lastActive)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserDetails(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => {
                setShowUserDetails(false);
                handleEditUser(selectedUser.id);
              }}>
                <Edit2 size={16} /> Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            fetchUsers({ page });
            setShowCreateModal(false);
          }} 
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }} 
          onSuccess={() => {
            fetchUsers({ page });
            setShowEditModal(false);
            setSelectedUser(null);
          }} 
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal 
          onClose={() => setShowBulkImportModal(false)} 
          onSuccess={() => {
            fetchUsers({ page });
            setShowBulkImportModal(false);
          }} 
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'TEACHER',
    phone: '',
    password: '',
    sendWelcomeEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await userManagementService.createUser(formData);
      toast.success(`User ${formData.firstName} ${formData.lastName} created successfully`);
      if (formData.sendWelcomeEmail) {
        toast.success('Welcome email sent to user');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@school.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 700 000 000"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="BURSAR">Bursar</option>
                  <option value="STORE_KEEPER">Store Keeper</option>
                  <option value="PARENT">Parent</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                />
                Send welcome email with login instructions
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSuccess }: { user: AdminUser; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await userManagementService.updateUser(user.id, formData);
      toast.success('User updated successfully');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="BURSAR">Bursar</option>
                  <option value="STORE_KEEPER">Store Keeper</option>
                  <option value="PARENT">Parent</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bulk Import Modal Component
function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    setError('');
    try {
      setLoading(true);
      await userManagementService.bulkImportUsers(file);
      toast.success('Users imported successfully');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bulk Import Users</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            <div className="import-area">
              <Upload size={48} />
              <p>Upload CSV or Excel file</p>
              <small>Format: firstName, lastName, email, role, phone</small>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="import-input"
              />
              {file && <div className="import-file-name">{file.name}</div>}
            </div>
            <div className="template-link">
              <a href="/templates/user-import-template.csv" download>Download template CSV</a>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !file}>
              {loading ? 'Importing...' : 'Import Users'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}