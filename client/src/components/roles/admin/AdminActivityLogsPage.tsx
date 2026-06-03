import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCcw,
  Search,
  Shield,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { systemSettingsService } from '../../../services/adminService';
import type { ActivityLog } from '../../../types/admin';

const actionOptions = ['all', 'login', 'logout', 'create', 'update', 'delete', 'export', 'backup', 'restore'];

function formatLogDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function actionTone(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('failed')) return 'danger';
  if (normalized.includes('login') || normalized.includes('create') || normalized.includes('backup')) return 'success';
  if (normalized.includes('update') || normalized.includes('restore')) return 'warning';
  return 'neutral';
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await systemSettingsService.getActivityLogs({
        action: action === 'all' ? undefined : action,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to load activity logs', error);
      toast.error('Failed to load activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [action, startDate, endDate]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.userName, log.userRole, log.action, log.resource, log.details, log.ipAddress]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [logs, search]);

  const exportLogs = async () => {
    setExporting(true);
    try {
      const blob = await systemSettingsService.exportActivityLogs({
        startDate: startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        endDate: endDate || new Date().toISOString().slice(0, 10),
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export activity logs');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-page activity-log-page">
      <div className="page-header">
        <div>
          <h1><Activity size={26} /> Activity Logs</h1>
          <p>Audit user activity, security events, backups, and system changes.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={exportLogs} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="activity-summary-grid">
        <div className="activity-summary-card">
          <Activity size={20} />
          <div><strong>{logs.length}</strong><span>Total events loaded</span></div>
        </div>
        <div className="activity-summary-card">
          <Shield size={20} />
          <div><strong>{logs.filter((log) => actionTone(log.action) === 'danger').length}</strong><span>Risk events</span></div>
        </div>
        <div className="activity-summary-card">
          <User size={20} />
          <div><strong>{new Set(logs.map((log) => log.userId || log.userName)).size}</strong><span>Active actors</span></div>
        </div>
      </div>

      <div className="filters-bar activity-filters">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs..." />
        </div>
        <div className="filter-field">
          <Filter size={16} />
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            {actionOptions.map((item) => (
              <option key={item} value={item}>{item === 'all' ? 'All Actions' : item[0].toUpperCase() + item.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <Calendar size={16} />
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="filter-field">
          <Calendar size={16} />
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>

      <div className="table-container activity-log-table">
        {loading ? (
          <div className="loading-state"><div className="loader" /><p>Loading activity logs...</p></div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <Activity size={34} />
            <h3>No activity found</h3>
            <p>Try a different filter or refresh the logs.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatLogDate(log.createdAt)}</td>
                  <td>
                    <div className="activity-user-cell">
                      <strong>{log.userName || 'System'}</strong>
                      <span>{log.userRole || 'SYSTEM'}</span>
                    </div>
                  </td>
                  <td><span className={`activity-action-badge ${actionTone(log.action)}`}>{log.action}</span></td>
                  <td>{log.resource || '-'}</td>
                  <td>{log.ipAddress || '-'}</td>
                  <td className="activity-details-cell">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
