// client/src/components/roles/admin/AdminBackupsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Download, Upload, RefreshCcw, Save, X, Database, Cloud, Clock,
  Calendar, Trash2, Eye, CheckCircle, AlertCircle, AlertTriangle,
  Settings, Bell, Mail, Server, HardDrive, Shield, Lock,
  ChevronRight, Plus, Search, Filter, MoreVertical, Copy,
  ExternalLink, Zap, Activity, PieChart, BarChart3,
  Moon, Sun, Wifi, WifiOff, CloudUpload, CloudDownload,
  Archive, FolderOpen, FileCode, FileText, FileJson, FileArchive,
  RotateCcw, History, GitBranch, Terminal, Code, Database as DatabaseIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';

interface Backup {
  id: string;
  filename: string;
  size: number;
  type: 'full' | 'database' | 'media' | 'config' | 'incremental';
  createdAt: string;
  createdBy: string;
  status: 'success' | 'failed' | 'in-progress';
  location: 'local' | 'cloud' | 'both';
  cloudUrl?: string;
  notes?: string;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  retentionDays: number;
  keepLocal: boolean;
  uploadToCloud: boolean;
  lastRun?: string;
  nextRun?: string;
}

interface CloudStorage {
  provider: 'aws' | 'google' | 'azure' | 'dropbox' | 'custom';
  bucketName: string;
  region: string;
  accessKey: string;
  secretKey: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  totalBackups: number;
  totalSize: number;
}

interface SystemHealth {
  databaseSize: number;
  mediaSize: number;
  totalSize: number;
  diskUsage: number;
  lastBackupSize: number;
  backupCount: number;
  healthScore: number;
}

export default function AdminBackupsPage() {
  const confirmation = useConfirmationDialog();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [backupType, setBackupType] = useState<'full' | 'database' | 'media' | 'config'>('full');
  const [autoBackupRunning, setAutoBackupRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    databaseSize: 0,
    mediaSize: 0,
    totalSize: 0,
    diskUsage: 0,
    lastBackupSize: 0,
    backupCount: 0,
    healthScore: 85
  });

  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
    keepLocal: true,
    uploadToCloud: true
  });

  const [cloudConfig, setCloudConfig] = useState<CloudStorage>({
    provider: 'aws',
    bucketName: '',
    region: 'us-east-1',
    accessKey: '',
    secretKey: '',
    status: 'disconnected',
    totalBackups: 0,
    totalSize: 0
  });

  // Fetch backups on load
  useEffect(() => {
    fetchBackups();
    fetchSystemHealth();
    fetchSchedule();
    fetchCloudStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!loading) fetchBackups();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBackups = async () => {
    try {
      const data = await settingsService.getBackups();
      setBackups(data || []);
    } catch (error) {
      console.error('Failed to fetch backups');
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const health = await settingsService.getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to fetch system health');
    }
  };

  const fetchSchedule = async () => {
    try {
      const sched = await settingsService.getBackupSchedule();
      if (sched) setSchedule(sched);
    } catch (error) {
      console.error('Failed to fetch schedule');
    }
  };

  const fetchCloudStatus = async () => {
    try {
      const cloud = await settingsService.getCloudConfig();
      if (cloud) setCloudConfig(cloud);
    } catch (error) {
      console.error('Failed to fetch cloud config');
    }
  };

  const createBackup = async (type: 'full' | 'database' | 'media' | 'config', uploadToCloud = false) => {
    setLoading(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const result = await settingsService.createBackup({ type, uploadToCloud });
      clearInterval(progressInterval);
      setProgress(100);
      toast.success(`${type.toUpperCase()} backup created successfully`);
      fetchBackups();
      fetchSystemHealth();
      
      // Send notification
      await settingsService.sendBackupNotification({
        type: 'backup_created',
        filename: result.filename,
        size: result.size
      });
      
      setTimeout(() => setProgress(0), 2000);
    } catch (error) {
      clearInterval(progressInterval);
      toast.error('Backup failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backup: Backup) => {
    const confirmed = await confirmation.confirm({
      title: 'Restore Backup',
      message: `Are you sure you want to restore "${backup.filename}"? This will overwrite current data.`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (confirmed) {
      setLoading(true);
      try {
        await settingsService.restoreBackup(backup.id);
        toast.success('System restored successfully');
        fetchBackups();
        setShowRestoreModal(false);
      } catch (error) {
        toast.error('Restore failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteBackup = async (backup: Backup) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Backup',
      message: `Delete "${backup.filename}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        await settingsService.deleteBackup(backup.id);
        toast.success('Backup deleted');
        fetchBackups();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      const blob = await settingsService.downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const saveSchedule = async () => {
    try {
      await settingsService.saveBackupSchedule(schedule);
      toast.success('Backup schedule saved');
      setShowScheduleModal(false);
      
      // Restart scheduler if auto-backup is running
      if (schedule.enabled && !autoBackupRunning) {
        startAutoBackupScheduler();
      }
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const saveCloudConfig = async () => {
    try {
      // Test connection first
      const testResult = await settingsService.testCloudConnection(cloudConfig);
      if (testResult.success) {
        await settingsService.saveCloudConfig(cloudConfig);
        setCloudConfig({ ...cloudConfig, status: 'connected' });
        toast.success('Cloud storage configured successfully');
        setShowCloudModal(false);
      } else {
        toast.error(testResult.message || 'Connection failed');
        setCloudConfig({ ...cloudConfig, status: 'error' });
      }
    } catch (error) {
      toast.error('Failed to save cloud config');
    }
  };

  const syncToCloud = async () => {
    setLoading(true);
    try {
      await settingsService.syncBackupsToCloud();
      toast.success('Backups synced to cloud');
      fetchBackups();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const startAutoBackupScheduler = () => {
    setAutoBackupRunning(true);
    
    // Calculate next run time
    const now = new Date();
    let nextRun = new Date();
    
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setHours(parseInt(schedule.time.split(':')[0]));
        nextRun.setMinutes(parseInt(schedule.time.split(':')[1]));
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        // Implementation
        break;
      case 'monthly':
        // Implementation
        break;
    }
    
    setSchedule({ ...schedule, nextRun: nextRun.toISOString() });
    
    // Set timeout for next backup
    const timeUntilNext = nextRun.getTime() - now.getTime();
    setTimeout(() => {
      createBackup('full', schedule.uploadToCloud);
      startAutoBackupScheduler(); // Re-schedule
    }, timeUntilNext);
  };

  const runManualAutoBackup = async () => {
    setAutoBackupRunning(true);
    await createBackup('full', schedule.uploadToCloud);
    toast('Auto-backup completed', { icon: 'ℹ️' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImportFiles(files);
    setShowImport(true);
  };

  const restoreFromFiles = async () => {
    if (importFiles.length === 0) return;
    setLoading(true);
    try {
      for (const file of importFiles) {
        await settingsService.restoreFromFile(file);
      }
      toast.success(`${importFiles.length} backup(s) restored`);
      setShowImport(false);
      setImportFiles([]);
      fetchBackups();
    } catch (error) {
      toast.error('Restore failed');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getBackupIcon = (type: string) => {
    switch (type) {
      case 'full': return <DatabaseIcon size={16} />;
      case 'database': return <Database size={16} />;
      case 'media': return <FolderOpen size={16} />;
      case 'config': return <Settings size={16} />;
      default: return <FileArchive size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const filteredBackups = backups.filter(b => 
    b.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="backups-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Database size={28} /> Backups & Disaster Recovery</h1>
          <p>Manage system backups, automatic schedules, cloud storage, and restore points</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowScheduleModal(true)} className="btn-secondary">
            <Clock size={16} /> Schedule
          </button>
          <button onClick={() => setShowCloudModal(true)} className="btn-secondary">
            <Cloud size={16} /> Cloud Storage
          </button>
          <button onClick={() => setShowAutoBackupModal(true)} className="btn-secondary">
            <Settings size={16} /> Auto-Backup
          </button>
          <button onClick={() => createBackup('full', false)} disabled={loading} className="btn-primary">
            {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Download size={16} />}
            Create Full Backup
          </button>
        </div>
      </div>

      {/* System Health Dashboard */}
      <div className="health-dashboard">
        <div className="health-card">
          <div className="health-icon"><HardDrive size={24} /></div>
          <div><span className="health-value">{formatSize(systemHealth.totalSize)}</span><span className="health-label">Total Data Size</span></div>
        </div>
        <div className="health-card">
          <div className="health-icon"><Database size={24} /></div>
          <div><span className="health-value">{formatSize(systemHealth.databaseSize)}</span><span className="health-label">Database Size</span></div>
        </div>
        <div className="health-card">
          <div className="health-icon"><FolderOpen size={24} /></div>
          <div><span className="health-value">{formatSize(systemHealth.mediaSize)}</span><span className="health-label">Media Files</span></div>
        </div>
        <div className="health-card">
          <div className="health-icon"><Archive size={24} /></div>
          <div><span className="health-value">{systemHealth.backupCount}</span><span className="health-label">Total Backups</span></div>
        </div>
        <div className="health-card">
          <div className="health-icon"><Activity size={24} /></div>
          <div><span className="health-value">{systemHealth.healthScore}%</span><span className="health-label">System Health</span></div>
          <div className="health-progress"><div className="progress-fill" style={{ width: `${systemHealth.healthScore}%` }}></div></div>
        </div>
      </div>

      {/* Backup Progress */}
      {progress > 0 && (
        <div className="backup-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span>{progress}% - Creating backup...</span>
        </div>
      )}

      {/* Auto-Backup Status Banner */}
      {schedule.enabled && (
        <div className="auto-backup-banner">
          <div className="banner-icon"><Zap size={20} /></div>
          <div>
            <strong>Auto-Backup Active</strong>
            <span>Next backup: {schedule.nextRun ? formatDate(schedule.nextRun) : 'Calculating...'}</span>
          </div>
          <button onClick={runManualAutoBackup} className="btn-sm">Run Now</button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => createBackup('database', false)} className="action-btn">
          <Database size={20} /> Backup Database
        </button>
        <button onClick={() => createBackup('media', false)} className="action-btn">
          <FolderOpen size={20} /> Backup Media
        </button>
        <button onClick={() => createBackup('config', false)} className="action-btn">
          <Settings size={20} /> Backup Config
        </button>
        <button onClick={syncToCloud} disabled={cloudConfig.status !== 'connected'} className="action-btn">
          <CloudUpload size={20} /> Sync to Cloud
        </button>
      </div>

      {/* Search & Filter */}
      <div className="search-bar">
        <Search size={18} />
        <input type="text" placeholder="Search backups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Backups Table */}
      <div className="backups-table-container">
        <table className="backups-table">
          <thead>
            <tr>
              <th>Backup</th><th>Type</th><th>Size</th><th>Created</th><th>Status</th><th>Location</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBackups.map(backup => (
              <tr key={backup.id}>
                <td><div className="backup-name">{getBackupIcon(backup.type)} {backup.filename}</div></td>
                <td><span className={`type-badge type-${backup.type}`}>{backup.type}</span></td>
                <td>{formatSize(backup.size)}</td>
                <td>{formatDate(backup.createdAt)}<br /><small>by {backup.createdBy}</small></td>
                <td>{getStatusBadge(backup.status)}</td>
                <td><span className={`location-badge location-${backup.location}`}>{backup.location}</span></td>
                <td className="actions">
                  <button onClick={() => downloadBackup(backup)} title="Download"><Download size={16} /></button>
                  <button onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }} title="Restore"><RotateCcw size={16} /></button>
                  <button onClick={() => deleteBackup(backup)} title="Delete" className="danger"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filteredBackups.length === 0 && (
              <tr><td colSpan={7} className="empty-state">No backups found. Create your first backup.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drag & Drop Restore Area */}
      <div className="drag-drop-area" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={32} />
        <p>Drag & drop backup files here to restore</p>
        <small>Supports .zip, .sql, .json, .tar.gz formats</small>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Backup Schedule</h3><button className="close-btn" onClick={() => setShowScheduleModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label><input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule({...schedule, enabled: e.target.checked})} /> Enable Automatic Backups</label></div>
              <div className="form-group"><label>Frequency</label><select value={schedule.frequency} onChange={e => setSchedule({...schedule, frequency: e.target.value as any})}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              <div className="form-group"><label>Time (24hr)</label><input type="time" value={schedule.time} onChange={e => setSchedule({...schedule, time: e.target.value})} /></div>
              <div className="form-group"><label>Retention (days)</label><input type="number" value={schedule.retentionDays} onChange={e => setSchedule({...schedule, retentionDays: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label><input type="checkbox" checked={schedule.keepLocal} onChange={e => setSchedule({...schedule, keepLocal: e.target.checked})} /> Keep local copy</label></div>
              <div className="form-group"><label><input type="checkbox" checked={schedule.uploadToCloud} onChange={e => setSchedule({...schedule, uploadToCloud: e.target.checked})} disabled={cloudConfig.status !== 'connected'} /> Upload to cloud</label></div>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button><button className="btn-primary" onClick={saveSchedule}>Save Schedule</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Storage Modal */}
      {showCloudModal && (
        <div className="modal-overlay" onClick={() => setShowCloudModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Cloud Storage Configuration</h3><button className="close-btn" onClick={() => setShowCloudModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="cloud-status"><div className={`status-dot status-${cloudConfig.status}`}></div> Status: {cloudConfig.status}</div>
              <div className="form-group"><label>Provider</label><select value={cloudConfig.provider} onChange={e => setCloudConfig({...cloudConfig, provider: e.target.value as any})}><option value="aws">AWS S3</option><option value="google">Google Cloud</option><option value="azure">Azure Blob</option><option value="dropbox">Dropbox</option></select></div>
              <div className="form-group"><label>Bucket/Container Name</label><input value={cloudConfig.bucketName} onChange={e => setCloudConfig({...cloudConfig, bucketName: e.target.value})} /></div>
              <div className="form-group"><label>Region</label><input value={cloudConfig.region} onChange={e => setCloudConfig({...cloudConfig, region: e.target.value})} /></div>
              <div className="form-group"><label>Access Key ID</label><input type="password" value={cloudConfig.accessKey} onChange={e => setCloudConfig({...cloudConfig, accessKey: e.target.value})} /></div>
              <div className="form-group"><label>Secret Access Key</label><input type="password" value={cloudConfig.secretKey} onChange={e => setCloudConfig({...cloudConfig, secretKey: e.target.value})} /></div>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowCloudModal(false)}>Cancel</button><button className="btn-primary" onClick={saveCloudConfig}>Test & Save</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Restore System</h3><button className="close-btn" onClick={() => setShowRestoreModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
              <p><strong>Warning!</strong> Restoring from backup will overwrite current data.</p>
              <p>Backup: <strong>{selectedBackup.filename}</strong><br />Created: {formatDate(selectedBackup.createdAt)}</p>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowRestoreModal(false)}>Cancel</button><button className="btn-danger" onClick={() => restoreBackup(selectedBackup)}>Restore Now</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Restore from Files</h3><button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <p>{importFiles.length} file(s) selected:</p>
              <ul>{importFiles.map(f => <li key={f.name}>📁 {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>)}</ul>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn-primary" onClick={restoreFromFiles}>Restore</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Backup Settings Modal */}
      {showAutoBackupModal && (
        <div className="modal-overlay" onClick={() => setShowAutoBackupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Auto-Backup Status</h3><button className="close-btn" onClick={() => setShowAutoBackupModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="auto-backup-info">
                <p><strong>Auto-Backup is {autoBackupRunning ? 'Running' : 'Stopped'}</strong></p>
                <p>Frequency: {schedule.frequency} at {schedule.time}</p>
                <p>Retention: {schedule.retentionDays} days</p>
                <p>Cloud sync: {schedule.uploadToCloud ? 'Enabled' : 'Disabled'}</p>
                <button className="btn-primary" onClick={() => { startAutoBackupScheduler(); setShowAutoBackupModal(false); }}>Start Scheduler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .backups-page { padding: 2rem; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-header h1 { font-size: 1.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; font-weight: 500; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .btn-danger { background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; }
        .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
        .health-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .health-card { background: white; padding: 1rem; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; }
        .health-icon { width: 48px; height: 48px; background: #eff6ff; border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: #3b82f6; }
        .health-value { font-size: 1.5rem; font-weight: 700; display: block; }
        .health-label { font-size: 0.75rem; color: #64748b; }
        .health-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #e2e8f0; border-radius: 0 0 1rem 1rem; overflow: hidden; }
        .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
        .backup-progress { background: #e2e8f0; border-radius: 0.5rem; margin-bottom: 1rem; height: 40px; overflow: hidden; position: relative; }
        .backup-progress .progress-bar { background: #3b82f6; height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; }
        .auto-backup-banner { background: #ecfdf5; border: 1px solid #10b981; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; }
        .quick-actions { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .action-btn { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .action-btn:hover { border-color: #3b82f6; color: #3b82f6; }
        .search-bar { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 1rem; margin-bottom: 1rem; gap: 0.5rem; }
        .search-bar input { flex: 1; border: none; outline: none; }
        .backups-table-container { background: white; border-radius: 1rem; overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
        .backups-table { width: 100%; border-collapse: collapse; }
        .backups-table th { text-align: left; padding: 1rem; background: #f8fafc; font-weight: 600; font-size: 0.875rem; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .backups-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
        .backup-name { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
        .type-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; text-transform: uppercase; }
        .type-full { background: #dbeafe; color: #1e40af; }
        .type-database { background: #dcfce7; color: #166534; }
        .type-media { background: #fef3c7; color: #92400e; }
        .location-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.7rem; }
        .location-local { background: #f1f5f9; color: #475569; }
        .location-cloud { background: #e0e7ff; color: #3730a3; }
        .location-both { background: #dbeafe; color: #1e40af; }
        .actions { display: flex; gap: 0.5rem; }
        .actions button { background: none; border: none; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem; }
        .actions button:hover { background: #f1f5f9; }
        .actions button.danger:hover { background: #fee2e2; color: #ef4444; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 1rem; padding: 2rem; text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s; }
        .drag-drop-area:hover { border-color: #3b82f6; background: #eff6ff; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 1rem; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-medium { width: 500px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #475569; }
        .form-group input, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.875rem; }
        .cloud-status { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; margin-bottom: 1rem; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-connected { background: #10b981; box-shadow: 0 0 0 2px #dcfce7; }
        .status-disconnected { background: #ef4444; }
        .status-error { background: #f59e0b; }
        .loading-state { text-align: center; padding: 4rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}