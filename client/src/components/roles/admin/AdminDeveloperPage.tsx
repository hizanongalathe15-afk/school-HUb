// client/src/components/roles/admin/AdminDeveloperPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, Trash2, RefreshCcw, Save, X, Database, Server, 
  Shield, Lock, Key, Eye, EyeOff, AlertTriangle, CheckCircle,
  Activity, BarChart3, PieChart, LineChart, Clock, Calendar,
  HardDrive, Cpu, MemoryStick, Wifi, Zap, Bug, Code, GitBranch,
  Layers, Package, FileCode, FileJson, FileText, FolderTree,
  Upload, Download, Copy, Play, Pause, Power, RotateCcw,
  AlertCircle, Info, ChevronDown, ChevronRight, Search, Filter,
  Settings, Users, MessageSquare, Bell, Mail, Globe, Link,
  Plus, Minus, Edit, Trash, MoreVertical, LogOut, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { developerService } from '../../../services/adminService';

interface SystemInfo {
  nodeVersion: string;
  reactVersion: string;
  databaseType: string;
  databaseVersion: string;
  os: string;
  cpuCores: number;
  memoryTotal: number;
  memoryUsed: number;
  diskTotal: number;
  diskFree: number;
  uptime: number;
  lastBackup: string;
}

interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: string;
  ip?: string;
}

interface QueueJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export default function AdminDeveloperPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sql, setSql] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sql');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationFiles, setMigrationFiles] = useState<File[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: string; message: string; callback: () => void } | null>(null);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [performanceData, setPerformanceData] = useState<any>(null);
  
  const passwordRef = useRef<HTMLInputElement>(null);

  // Developer password (in production, this should be hashed and stored in env)
  const DEVELOPER_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || 'Admin@Dev2024!';

  useEffect(() => {
    if (authenticated) {
      fetchSystemInfo();
      fetchDatabaseTables();
      fetchLogs();
      fetchQueueJobs();
      fetchPerformanceData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchSystemInfo();
        fetchQueueJobs();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEVELOPER_PASSWORD) {
      setAuthenticated(true);
      toast.success('Developer access granted');
    } else {
      toast.error('Invalid developer password');
      setPassword('');
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const info = await developerService.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to fetch system info');
    }
  };

  const fetchDatabaseTables = async () => {
    try {
      const tables = await developerService.getDatabaseTables();
      setDatabaseTables(tables);
    } catch (error) {
      console.error('Failed to fetch tables');
    }
  };

  const fetchLogs = async () => {
    try {
      const logsData = await developerService.getSystemLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch logs');
    }
  };

  const fetchQueueJobs = async () => {
    try {
      const jobs = await developerService.getQueueJobs();
      setQueueJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch queue jobs');
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const data = await developerService.getPerformanceMetrics();
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to fetch performance data');
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const data = await developerService.getTableData(tableName);
      setTableData(data);
      setSelectedTable(tableName);
    } catch (error) {
      toast.error('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async () => {
    if (!sql.trim()) {
      toast.error('SQL query required');
      return;
    }
    
    // Confirm destructive operations
    const destructiveKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE'];
    const isDestructive = destructiveKeywords.some(keyword => 
      sql.toUpperCase().includes(keyword)
    );
    
    if (isDestructive) {
      const confirmed = await showConfirmation(
        'Destructive Query Warning',
        'This query modifies or deletes data. Are you absolutely sure?',
        'Execute Anyway'
      );
      if (!confirmed) return;
    }
    
    setLoading(true);
    try {
      const result = await developerService.executeSql(sql);
      setSqlResult(result);
      toast.success('Query executed successfully');
      
      // Refresh tables if schema changed
      if (sql.toUpperCase().includes('CREATE') || sql.toUpperCase().includes('ALTER') || sql.toUpperCase().includes('DROP')) {
        fetchDatabaseTables();
      }
    } catch (error: any) {
      toast.error(error.message || 'Query failed');
      setSqlResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (type: 'all' | 'redis' | 'memory' | 'views' = 'all') => {
    const confirmed = await showConfirmation(
      'Clear Cache',
      `Clear ${type} cache? This may temporarily affect performance.`,
      'Clear Cache'
    );
    if (confirmed) {
      try {
        await developerService.clearCache(type);
        toast.success(`${type} cache cleared`);
      } catch (error) {
        toast.error('Failed to clear cache');
      }
    }
  };

  const runMigrations = async () => {
    if (migrationFiles.length === 0) return;
    
    const confirmed = await showConfirmation(
      'Run Migrations',
      `Apply ${migrationFiles.length} migration(s)? This may change database schema.`,
      'Run Migrations'
    );
    
    if (confirmed) {
      setLoading(true);
      try {
        for (const file of migrationFiles) {
          await developerService.runMigration(file);
        }
        toast.success(`${migrationFiles.length} migration(s) applied`);
        setShowMigrationModal(false);
        setMigrationFiles([]);
        fetchDatabaseTables();
      } catch (error) {
        toast.error('Migration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const retryFailedJob = async (jobId: string) => {
    try {
      await developerService.retryQueueJob(jobId);
      toast.success('Job retried');
      fetchQueueJobs();
    } catch (error) {
      toast.error('Failed to retry job');
    }
  };

  const clearAllJobs = async () => {
    const confirmed = await showConfirmation(
      'Clear All Jobs',
      'Remove all pending and failed jobs from queue?',
      'Clear All'
    );
    if (confirmed) {
      try {
        await developerService.clearQueue();
        toast.success('Queue cleared');
        fetchQueueJobs();
      } catch (error) {
        toast.error('Failed to clear queue');
      }
    }
  };

  const optimizeDatabase = async () => {
    const confirmed = await showConfirmation(
      'Optimize Database',
      'Run database optimization? This may take a few minutes.',
      'Optimize'
    );
    if (confirmed) {
      setLoading(true);
      try {
        await developerService.optimizeDatabase();
        toast.success('Database optimized');
        fetchDatabaseTables();
      } catch (error) {
        toast.error('Optimization failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const generateReport = async (type: string) => {
    try {
      const blob = await developerService.generateReport(type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const showConfirmation = (title: string, message: string, confirmText: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmAction({
        action: title,
        message,
        callback: () => {
          resolve(true);
          setConfirmAction(null);
        }
      });
      setShowConfirmModal(true);
      
      // Handle modal close
      const handleClose = () => {
        resolve(false);
        setConfirmAction(null);
        setShowConfirmModal(false);
      };
      
      // Store the close handler
      (window as any).__confirmClose = handleClose;
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getLogLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>{level}</span>;
  };

  const getJobStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
  };

  // Password protection screen
  if (!authenticated) {
    return (
      <div className="dev-login-container">
        <div className="dev-login-card">
          <div className="dev-login-icon">
            <Shield size={48} />
          </div>
          <h2>Developer Access</h2>
          <p>Enter developer password to access system tools</p>
          <form onSubmit={handleLogin}>
            <div className="password-input-wrapper">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Developer Password"
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="login-btn">
              <Lock size={16} /> Access Developer Zone
            </button>
          </form>
          <div className="security-notice">
            <AlertTriangle size={14} />
            <small>Unauthorized access is prohibited and will be logged</small>
          </div>
        </div>
        <style>{`
          .dev-login-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          }
          .dev-login-card {
            background: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            text-align: center;
            width: 400px;
            max-width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          .dev-login-icon {
            background: #f59e0b;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
          }
          .dev-login-card h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .dev-login-card p { color: #64748b; margin-bottom: 1.5rem; }
          .password-input-wrapper {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .password-input-wrapper input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.5rem;
            font-size: 1rem;
          }
          .password-input-wrapper button {
            padding: 0.75rem;
            border: 1px solid #cbd5e1;
            background: white;
            border-radius: 0.5rem;
            cursor: pointer;
          }
          .login-btn {
            width: 100%;
            background: #3b82f6;
            color: white;
            padding: 0.75rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          .security-notice {
            margin-top: 1.5rem;
            padding: 0.75rem;
            background: #fef3c7;
            border-radius: 0.5rem;
            color: #92400e;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="developer-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Terminal size={28} /> Developer Zone</h1>
          <p>System administration, database management, debugging, and performance monitoring</p>
        </div>
        <div className="header-actions">
          <button onClick={() => window.location.reload()} className="btn-secondary">
            <RefreshCcw size={16} /> Reload
          </button>
          <button onClick={() => setAuthenticated(false)} className="btn-danger">
            <LogOut size={16} /> Lock Screen
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemInfo && (
        <div className="system-health">
          <div className="health-item"><Server size={18} /><span>Node: {systemInfo.nodeVersion}</span></div>
          <div className="health-item"><Database size={18} /><span>{systemInfo.databaseType} {systemInfo.databaseVersion}</span></div>
          <div className="health-item"><Cpu size={18} /><span>{systemInfo.cpuCores} Cores</span></div>
          <div className="health-item"><HardDrive size={18} /><span>Disk: {formatBytes(systemInfo.diskFree)} free / {formatBytes(systemInfo.diskTotal)}</span></div>
          <div className="health-item"><Clock size={18} /><span>Uptime: {formatDuration(systemInfo.uptime)}</span></div>
        </div>
      )}

      {/* Tabs */}
      <div className="dev-tabs">
        <button className={`tab ${activeTab === 'sql' ? 'active' : ''}`} onClick={() => setActiveTab('sql')}>
          <Terminal size={16} /> SQL Console
        </button>
        <button className={`tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
          <Database size={16} /> Database
        </button>
        <button className={`tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
          <Layers size={16} /> Queue Manager
        </button>
        <button className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <FileText size={16} /> System Logs
        </button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <Activity size={16} /> Performance
        </button>
        <button className={`tab ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
          <Settings size={16} /> Tools
        </button>
      </div>

      {/* SQL Console Tab */}
      {activeTab === 'sql' && (
        <div className="tab-content">
          <div className="sql-console">
            <div className="sql-editor">
              <div className="editor-header">
                <span>SQL Query Editor</span>
                <div className="editor-actions">
                  <button onClick={() => setSql('')} className="btn-sm"><X size={14} /> Clear</button>
                  <button onClick={executeSql} disabled={loading} className="btn-primary btn-sm">
                    <Play size={14} /> Execute
                  </button>
                </div>
              </div>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="SELECT * FROM users LIMIT 10;"
                className="sql-textarea"
                rows={8}
              />
              <div className="sql-hints">
                <small>⚠️ Destructive queries (DROP, DELETE, TRUNCATE) require confirmation</small>
              </div>
            </div>
            {sqlResult && (
              <div className="sql-result">
                <div className="result-header">
                  <span>Query Result</span>
                  <button onClick={() => setSqlResult(null)} className="btn-sm"><X size={14} /></button>
                </div>
                {sqlResult.error ? (
                  <div className="result-error">{sqlResult.error}</div>
                ) : (
                  <pre className="result-data">{JSON.stringify(sqlResult, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Management Tab */}
      {activeTab === 'database' && (
        <div className="tab-content">
          <div className="database-manager">
            <div className="database-sidebar">
              <div className="sidebar-header">
                <Database size={16} /> Tables ({databaseTables.length})
                <button onClick={optimizeDatabase} className="btn-sm" title="Optimize Database">
                  <Zap size={14} />
                </button>
              </div>
              <div className="table-list">
                {databaseTables.map(table => (
                  <button
                    key={table.name}
                    className={`table-item ${selectedTable === table.name ? 'active' : ''}`}
                    onClick={() => fetchTableData(table.name)}
                  >
                    <FolderTree size={14} />
                    <span>{table.name}</span>
                    <span className="table-rows">{table.rows.toLocaleString()} rows</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="database-content">
              {selectedTable ? (
                <>
                  <div className="table-header">
                    <h3>{selectedTable}</h3>
                    <button onClick={() => fetchTableData(selectedTable)} className="btn-sm">
                      <RefreshCcw size={14} /> Refresh
                    </button>
                  </div>
                  {loading ? (
                    <div className="loading-state">Loading table data...</div>
                  ) : (
                    <div className="table-data-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.slice(0, 100).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((val: any, j) => (
                                <td key={j}>{String(val).substring(0, 100)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {tableData.length > 100 && (
                        <div className="table-note">Showing first 100 of {tableData.length} rows</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selection">Select a table from the left to view data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue Manager Tab */}
      {activeTab === 'queue' && (
        <div className="tab-content">
          <div className="queue-manager">
            <div className="queue-header">
              <h3>Job Queue</h3>
              <div className="queue-actions">
                <button onClick={fetchQueueJobs} className="btn-sm"><RefreshCcw size={14} /> Refresh</button>
                <button onClick={clearAllJobs} className="btn-danger btn-sm"><Trash2 size={14} /> Clear All</button>
              </div>
            </div>
            <div className="queue-stats">
              <div className="stat">Pending: {queueJobs.filter(j => j.status === 'pending').length}</div>
              <div className="stat">Processing: {queueJobs.filter(j => j.status === 'processing').length}</div>
              <div className="stat">Completed: {queueJobs.filter(j => j.status === 'completed').length}</div>
              <div className="stat">Failed: {queueJobs.filter(j => j.status === 'failed').length}</div>
            </div>
            <div className="queue-jobs">
              {queueJobs.map(job => (
                <div key={job.id} className={`job-item status-${job.status}`}>
                  <div className="job-info">
                    <strong>{job.name}</strong>
                    <div className="job-meta">Created: {new Date(job.createdAt).toLocaleString()}</div>
                    {job.processedAt && <div className="job-meta">Processed: {new Date(job.processedAt).toLocaleString()}</div>}
                    {job.error && <div className="job-error">Error: {job.error}</div>}
                  </div>
                  <div className="job-status">
                    {getJobStatusBadge(job.status)}
                    {job.status === 'failed' && (
                      <button onClick={() => retryFailedJob(job.id)} className="btn-sm" title="Retry">
                        <RefreshCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {queueJobs.length === 0 && (
                <div className="empty-state">No jobs in queue</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Logs Tab */}
      {activeTab === 'logs' && (
        <div className="tab-content">
          <div className="logs-viewer">
            <div className="logs-header">
              <h3>System Logs</h3>
              <div className="logs-filters">
                <div className="filter-group">
                  <Search size={14} />
                  <input type="text" placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} />
                </div>
                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}>
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="debug">Debug</option>
                </select>
                <button onClick={fetchLogs} className="btn-sm"><RefreshCcw size={14} /> Refresh</button>
              </div>
            </div>
            <div className="logs-list">
              {logs
                .filter(log => logFilter === 'all' || log.level === logFilter)
                .filter(log => log.message.toLowerCase().includes(logSearch.toLowerCase()))
                .map(log => (
                  <div key={log.id} className={`log-entry level-${log.level}`}>
                    <div className="log-time">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="log-level">{getLogLevelBadge(log.level)}</div>
                    <div className="log-source">{log.source}</div>
                    <div className="log-message">{log.message}</div>
                    {log.userId && <div className="log-user">User: {log.userId}</div>}
                    {log.ip && <div className="log-ip">IP: {log.ip}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceData && (
        <div className="tab-content">
          <div className="performance-dashboard">
            <div className="perf-grid">
              <div className="perf-card">
                <h4>API Response Times</h4>
                <div className="perf-stat">Avg: {performanceData.avgApiTime}ms</div>
                <div className="perf-stat">P95: {performanceData.p95ApiTime}ms</div>
                <div className="perf-stat">P99: {performanceData.p99ApiTime}ms</div>
              </div>
              <div className="perf-card">
                <h4>Database Performance</h4>
                <div className="perf-stat">Query Avg: {performanceData.avgQueryTime}ms</div>
                <div className="perf-stat">Slow Queries: {performanceData.slowQueries}</div>
                <div className="perf-stat">Connections: {performanceData.dbConnections}</div>
              </div>
              <div className="perf-card">
                <h4>Memory Usage</h4>
                <div className="perf-stat">Heap Used: {formatBytes(performanceData.heapUsed)}</div>
                <div className="perf-stat">Heap Total: {formatBytes(performanceData.heapTotal)}</div>
                <div className="perf-stat">External: {formatBytes(performanceData.external)}</div>
              </div>
              <div className="perf-card">
                <h4>Request Statistics</h4>
                <div className="perf-stat">Total Requests: {performanceData.totalRequests}</div>
                <div className="perf-stat">Requests/min: {performanceData.requestsPerMinute}</div>
                <div className="perf-stat">Error Rate: {performanceData.errorRate}%</div>
              </div>
            </div>
            <div className="perf-actions">
              <button onClick={() => generateReport('performance')} className="btn-secondary">
                <Download size={14} /> Export Performance Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="tab-content">
          <div className="tools-grid">
            <div className="tool-card">
              <Bug size={24} />
              <h3>System Tools</h3>
              <button onClick={() => clearCache('all')} className="tool-btn">Clear All Cache</button>
              <button onClick={() => clearCache('redis')} className="tool-btn">Clear Redis Cache</button>
              <button onClick={() => clearCache('memory')} className="tool-btn">Clear Memory Cache</button>
              <button onClick={optimizeDatabase} className="tool-btn">Optimize Database</button>
            </div>
            
            <div className="tool-card">
              <GitBranch size={24} />
              <h3>Migrations</h3>
              <button onClick={() => setShowMigrationModal(true)} className="tool-btn">
                <Upload size={14} /> Run Migrations
              </button>
              <small>Upload SQL migration files</small>
            </div>
            
            <div className="tool-card">
              <FileCode size={24} />
              <h3>Reports</h3>
              <button onClick={() => generateReport('system')} className="tool-btn">System Report</button>
              <button onClick={() => generateReport('database')} className="tool-btn">Database Report</button>
              <button onClick={() => generateReport('security')} className="tool-btn">Security Report</button>
            </div>
            
            <div className="tool-card">
              <AlertCircle size={24} />
              <h3>Maintenance</h3>
              <button onClick={() => {
                toast.success('Maintenance mode not implemented in demo');
              }} className="tool-btn">Enable Maintenance Mode</button>
              <button onClick={() => {
                toast.success('Health check passed');
              }} className="tool-btn">Run Health Check</button>
            </div>
          </div>

          {/* Drag & Drop Migration Area */}
          <div className="drag-drop-area" onDragOver={e => e.preventDefault()} onDrop={e => {
            e.preventDefault();
            setMigrationFiles(Array.from(e.dataTransfer.files));
            setShowMigrationModal(true);
          }}>
            <Upload size={24} />
            <p>Drag & drop migration files here</p>
            <small>Supports .sql, .json, .js migration files</small>
          </div>
        </div>
      )}

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="modal-overlay" onClick={() => setShowMigrationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Run Migrations</h3>
              <button className="close-btn" onClick={() => setShowMigrationModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>{migrationFiles.length} file(s) selected:</p>
              <ul className="file-list">
                {migrationFiles.map(f => (
                  <li key={f.name}>📄 {f.name} ({(f.size / 1024).toFixed(2)} KB)</li>
                ))}
              </ul>
              <div className="warning-box">
                <AlertTriangle size={16} />
                <span>Warning: Migrations can modify database schema. Ensure you have a backup.</span>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => { setShowMigrationModal(false); setMigrationFiles([]); }}>Cancel</button>
                <button className="btn-primary" onClick={runMigrations} disabled={migrationFiles.length === 0}>
                  <Play size={16} /> Run Migrations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="modal-overlay" onClick={() => {
          (window as any).__confirmClose?.();
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmAction.action}</h3>
              <button className="close-btn" onClick={() => (window as any).__confirmClose?.()}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
              <p>{confirmAction.message}</p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => (window as any).__confirmClose?.()}>Cancel</button>
                <button className="btn-danger" onClick={confirmAction.callback}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .developer-page { padding: 2rem; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-header h1 { font-size: 1.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .header-actions { display: flex; gap: 0.75rem; }
        .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; font-weight: 500; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .btn-danger { background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; }
        .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #f1f5f9; border: none; border-radius: 0.25rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .system-health { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem; background: white; border-radius: 0.5rem; }
        .health-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #475569; }
        .dev-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .tab { padding: 0.75rem 1.5rem; background: none; border: none; cursor: pointer; font-weight: 500; color: #64748b; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .tab.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; }
        .tab-content { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .sql-console { display: flex; flex-direction: column; gap: 1.5rem; }
        .sql-editor { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
        .editor-header { display: flex; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .sql-textarea { width: 100%; padding: 1rem; font-family: monospace; font-size: 0.875rem; border: none; outline: none; resize: vertical; }
        .sql-hints { padding: 0.5rem 1rem; background: #fef3c7; font-size: 0.75rem; }
        .sql-result { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
        .result-header { display: flex; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .result-data { padding: 1rem; background: #0f172a; color: #4ade80; font-family: monospace; font-size: 0.75rem; overflow-x: auto; max-height: 300px; }
        .result-error { padding: 1rem; background: #fee2e2; color: #991b1b; }
        .database-manager { display: flex; gap: 1.5rem; min-height: 500px; }
        .database-sidebar { width: 280px; border-right: 1px solid #e2e8f0; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-weight: 600; }
        .table-list { display: flex; flex-direction: column; gap: 0.25rem; }
        .table-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; width: 100%; text-align: left; background: none; border: none; font-size: 0.875rem; }
        .table-item:hover { background: #f1f5f9; }
        .table-item.active { background: #eff6ff; color: #3b82f6; }
        .table-rows { margin-left: auto; font-size: 0.7rem; color: #64748b; }
        .database-content { flex: 1; overflow-x: auto; }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
        .data-table th, .data-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .data-table th { background: #f8fafc; font-weight: 600; }
        .queue-stats { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .queue-stats .stat { padding: 0.5rem 1rem; background: #f1f5f9; border-radius: 0.5rem; }
        .queue-jobs { display: flex; flex-direction: column; gap: 0.5rem; max-height: 500px; overflow-y: auto; }
        .job-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
        .job-item.status-pending { border-left: 3px solid #f59e0b; }
        .job-item.status-completed { border-left: 3px solid #10b981; }
        .job-item.status-failed { border-left: 3px solid #ef4444; }
        .job-info { flex: 1; }
        .job-meta { font-size: 0.7rem; color: #64748b; }
        .job-error { font-size: 0.7rem; color: #ef4444; margin-top: 0.25rem; }
        .job-status { display: flex; align-items: center; gap: 0.5rem; }
        .logs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .logs-filters { display: flex; gap: 0.5rem; align-items: center; }
        .filter-group { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.25rem 0.5rem; gap: 0.25rem; }
        .filter-group input { border: none; outline: none; font-size: 0.875rem; }
        .logs-list { max-height: 500px; overflow-y: auto; }
        .log-entry { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; flex-wrap: wrap; }
        .log-time { color: #64748b; font-family: monospace; }
        .log-message { flex: 1; }
        .level-error { background: #fef2f2; }
        .level-warning { background: #fffbeb; }
        .perf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .perf-card { padding: 1rem; background: #f8fafc; border-radius: 0.5rem; }
        .perf-card h4 { margin-bottom: 0.5rem; }
        .perf-stat { font-size: 0.875rem; color: #475569; margin-top: 0.25rem; }
        .tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .tool-card { padding: 1.5rem; background: #f8fafc; border-radius: 1rem; text-align: center; }
        .tool-card h3 { margin: 1rem 0; font-size: 1.125rem; }
        .tool-btn { display: block; width: 100%; margin: 0.5rem 0; padding: 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 1rem; padding: 2rem; text-align: center; margin-top: 1rem; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 1rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .modal-body { padding: 1.5rem; text-align: center; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .warning-box { background: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: 1rem 0; display: flex; align-items: center; gap: 0.5rem; color: #92400e; }
        .file-list { text-align: left; margin: 1rem 0; padding-left: 1.5rem; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .loading-state { text-align: center; padding: 2rem; }
        .table-note { font-size: 0.7rem; color: #64748b; margin-top: 0.5rem; text-align: center; }
        .no-selection { text-align: center; padding: 3rem; color: #64748b; }
      `}</style>
    </div>
  );
}