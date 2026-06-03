import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Cpu, HardDrive, Laptop,
  LogOut, MemoryStick, Network, RefreshCw, Router, Server, ShieldCheck,
  Smartphone, Tablet, Trash2, Users, Wifi, Battery, Thermometer, Fan, Zap,
  GitBranch, Database, Cloud, Lock, Eye, EyeOff, Terminal, Code, FileCode,
  Globe, MapPin, Calendar, BarChart3, PieChart, TrendingUp,
  TrendingDown, Minus, Plus, Settings, Bell, Mail, MessageSquare, Phone,
  Video as VideoIcon, Music, Gamepad2, BookOpen, Coffee, Sun, Moon, CloudRain, Wind,
  Droplets, Gauge, Gauge as Speedometer, Timer, Hourglass, StopCircle, PlayCircle,
  Power, RefreshCcw, RotateCcw, Upload, Download, Share2, Copy, Printer,
  FileText, FileJson, FileSpreadsheet, Archive, FolderTree, Hash, Link,
  ExternalLink, Maximize2, Minimize2, Square, Circle, Hexagon, Triangle,
  PlusCircle, MinusCircle, XCircle, AlertOctagon, HelpCircle, Info,
  Flag, Award, Star, Heart, ThumbsUp, ThumbsDown, MessageCircle, Send,
  Inbox, Send as Outbox, Archive as ArchiveIcon, Trash, Edit, MoreHorizontal,
  MoreVertical, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Copy as CopyIcon,
  Scissors, Link as LinkIcon, Unlink, DownloadCloud, UploadCloud,
  CloudLightning, CloudSnow, CloudRain as CloudRainIcon, Sun as SunIcon,
  Moon as MoonIcon, Wind as WindIcon, Droplets as DropletsIcon,
  Thermometer as ThermometerIcon, Activity as ActivityIcon, Zap as ZapIcon,
  Image as ImageIcon, Video, File, Folder, SortAsc, SortDesc, Filter, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, Treemap
} from 'recharts';
import { systemMetricsService } from '../../../services/api';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'degraded';
type SortOrder = 'asc' | 'desc';
type MediaType = 'image' | 'video' | 'document' | 'audio' | 'all';

interface MediaFile {
  id: string;
  name: string;
  path: string;
  type: MediaType;
  size: number;
  format: string;
  createdAt: string;
  modifiedAt: string;
  uploadedBy: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

interface MediaStats {
  totalSize: number;
  totalFiles: number;
  images: { count: number; size: number };
  videos: { count: number; size: number };
  documents: { count: number; size: number };
  audio: { count: number; size: number };
  largestFile: MediaFile | null;
  smallestFile: MediaFile | null;
  averageSize: number;
}

interface ProcessInfo {
  pid: number; name: string; cpu: number; memory: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  uptime: number; command: string;
}

interface ServiceStatus {
  name: string; status: 'running' | 'stopped' | 'degraded';
  port: number; uptime: number; health: number;
}

interface NetworkSpeed {
  download: number;
  upload: number;
  latency: number;
  timestamp: string;
  downloadHistory: number[];
  uploadHistory: number[];
}

interface MetricResponse {
  server: {
    status: string; responseMs: number; uptimeSeconds: number;
    memoryMb: number; loadAverage: number[]; platform: string;
    hostname: string; kernelVersion: string; architecture: string;
  };
  health: {
    status: HealthStatus; issues: string[]; score: number; recommendations: string[];
  };
  system: {
    cpu: {
      usage: number; cores: number; model: string; speed: number;
      loadAvg1: number; loadAvg5: number; loadAvg15: number;
      perCore: number[]; temperature: number; voltage: number;
      cache: { l1: number; l2: number; l3: number };
      processes: number; threads: number;
    };
    memory: {
      total: number; used: number; free: number; available: number; usage: number;
      swapTotal: number; swapUsed: number; swapFree: number; swapUsage: number;
      cached: number; buffers: number; shared: number;
    };
    storage: {
      total: number; used: number; free: number; usage: number;
      disks: Array<{ name: string; total: number; used: number; free: number; usage: number; type: string; mount: string; readSpeed: number; writeSpeed: number }>;
      iops: { read: number; write: number };
    };
    network: {
      download: number; upload: number; latency: number; errors: number;
      packets: { received: number; sent: number; dropped: number };
      interfaces: Array<{ name: string; ip: string; mac: string; rx: number; tx: number; speed: number; status: 'up' | 'down' }>;
      connections: { tcp: number; udp: number; total: number };
      speed: NetworkSpeed;
    };
    database: {
      size: number; connections: number; queriesPerSecond: number;
      slowQueries: number; hitRatio: number; transactionsPerSecond: number;
      replicationLag: number; bufferHitRatio: number; tableCount: number; indexCount: number;
    };
    mediaFiles: MediaFile[];
    mediaStats: MediaStats;
    processes: ProcessInfo[];
    services: ServiceStatus[];
    timestamp: string;
    requestsPerMinute: number[];
    responseTime: number[];
    errorRate: number[];
    activeUsers: number;
  };
  wakeTime: {
    bootTime: string; uptime: string; totalUptime: string;
    currentTime: string; timezone: string;
    scheduledDowntime?: { start: string; end: string; reason: string };
  };
  request: {
    ip: string; userAgent: string; acceptedLanguage: string;
    geoLocation?: { city: string; country: string; lat: number; lon: number };
  };
  account: {
    email: string; accountName: string; loginCount: number; adminCount: number;
    activeSessions: Array<{
      id: string; ip: string; userAgent: string; createdAt: string;
      lastSeenAt: string; isCurrent: boolean; browser: string;
      deviceName: string; location: string; os: string; screenResolution: string;
    }>;
    revokedSessions: Array<{ id: string; revokedAt?: string | null }>;
    permissions: string[]; role: string;
  };
  alerts: Array<{
    id: string; type: 'info' | 'warning' | 'critical';
    message: string; timestamp: string; acknowledged: boolean;
    source: string; severity: number;
  }>;
}

const emptyMetrics: MetricResponse = {
  server: { status: 'offline', responseMs: 0, uptimeSeconds: 0, memoryMb: 0, loadAverage: [], platform: 'Unknown', hostname: 'Unknown', kernelVersion: 'Unknown', architecture: 'Unknown' },
  health: { status: 'warning', issues: ['Loading metrics...'], score: 0, recommendations: [] },
  system: {
    cpu: { usage: 0, cores: 0, model: 'Unknown CPU', speed: 0, loadAvg1: 0, loadAvg5: 0, loadAvg15: 0, perCore: [], temperature: 0, voltage: 0, cache: { l1: 0, l2: 0, l3: 0 }, processes: 0, threads: 0 },
    memory: { total: 0, used: 0, free: 0, available: 0, usage: 0, swapTotal: 0, swapUsed: 0, swapFree: 0, swapUsage: 0, cached: 0, buffers: 0, shared: 0 },
    storage: { total: 0, used: 0, free: 0, usage: 0, disks: [], iops: { read: 0, write: 0 } },
    network: { download: 0, upload: 0, latency: 0, errors: 0, packets: { received: 0, sent: 0, dropped: 0 }, interfaces: [], connections: { tcp: 0, udp: 0, total: 0 }, speed: { download: 0, upload: 0, latency: 0, timestamp: '', downloadHistory: [], uploadHistory: [] } },
    database: { size: 0, connections: 0, queriesPerSecond: 0, slowQueries: 0, hitRatio: 0, transactionsPerSecond: 0, replicationLag: 0, bufferHitRatio: 0, tableCount: 0, indexCount: 0 },
    mediaFiles: [],
    mediaStats: { totalSize: 0, totalFiles: 0, images: { count: 0, size: 0 }, videos: { count: 0, size: 0 }, documents: { count: 0, size: 0 }, audio: { count: 0, size: 0 }, largestFile: null, smallestFile: null, averageSize: 0 },
    processes: [],
    services: [],
    timestamp: new Date().toISOString(),
    requestsPerMinute: [],
    responseTime: [],
    errorRate: [],
    activeUsers: 0
  },
  wakeTime: { bootTime: '', uptime: '0m', totalUptime: '0m', currentTime: new Date().toISOString(), timezone: 'Server local time' },
  request: { ip: '', userAgent: '', acceptedLanguage: '' },
  account: { email: '', accountName: '', loginCount: 0, adminCount: 0, activeSessions: [], revokedSessions: [], permissions: [], role: 'admin' },
  alerts: []
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

function getMediaTypeIcon(type: MediaType) {
  switch (type) {
    case 'image': return <ImageIcon size={16} />;
    case 'video': return <Video size={16} />;
    case 'document': return <FileText size={16} />;
    case 'audio': return <Music size={16} />;
    default: return <File size={16} />;
  }
}

export default function AdminSystemMetricsPage() {
  const [data, setData] = useState<MetricResponse>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [mediaSortBy, setMediaSortBy] = useState<'size' | 'name' | 'type' | 'date'>('size');
  const [mediaSortOrder, setMediaSortOrder] = useState<SortOrder>('desc');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [showNetworkSpeed, setShowNetworkSpeed] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const confirmation = useConfirmationDialog();

  const loadMetrics = useCallback(async () => {
    setRefreshing(true);
    try {
      const metricsResponse = await systemMetricsService.getDetailed();
      setData(prev => ({
        ...emptyMetrics,
        ...metricsResponse,
        system: {
          ...emptyMetrics.system,
          ...metricsResponse.system,
          mediaStats: metricsResponse.system?.mediaStats || emptyMetrics.system.mediaStats,
          mediaFiles: metricsResponse.system?.mediaFiles || []
        }
      }));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load system metrics', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => loadMetrics(), 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadMetrics]);

  const sortedMediaFiles = useMemo(() => {
    let filtered = data.system.mediaFiles.filter(f => 
      (mediaTypeFilter === 'all' || f.type === mediaTypeFilter) &&
      f.name.toLowerCase().includes(mediaSearch.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (mediaSortBy) {
        case 'size': comparison = a.size - b.size; break;
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'type': comparison = a.type.localeCompare(b.type); break;
        case 'date': comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(); break;
      }
      return mediaSortOrder === 'desc' ? -comparison : comparison;
    });
  }, [data.system.mediaFiles, mediaSortBy, mediaSortOrder, mediaTypeFilter, mediaSearch]);

  const mediaPieData = [
    { name: 'Images', value: data.system.mediaStats.images.size, count: data.system.mediaStats.images.count, color: '#3b82f6' },
    { name: 'Videos', value: data.system.mediaStats.videos.size, count: data.system.mediaStats.videos.count, color: '#ef4444' },
    { name: 'Documents', value: data.system.mediaStats.documents.size, count: data.system.mediaStats.documents.count, color: '#f59e0b' },
    { name: 'Audio', value: data.system.mediaStats.audio.size, count: data.system.mediaStats.audio.count, color: '#10b981' }
  ];

  const chartData = useMemo(() => {
    const requests = data.system.requestsPerMinute || [];
    const response = data.system.responseTime || [];
    const errors = data.system.errorRate || [];
    return requests.slice(-30).map((value, index) => ({
      label: `${index + 1}`,
      requests: value,
      responseMs: response[response.length - requests.slice(-30).length + index] || 0,
      errors: errors[errors.length - requests.slice(-30).length + index] || 0
    }));
  }, [data.system.requestsPerMinute, data.system.responseTime, data.system.errorRate]);

  const downloadHistory = data.system.network?.speed?.downloadHistory || [];
  const uploadHistory = data.system.network?.speed?.uploadHistory || [];
  const networkChartData = downloadHistory.slice(-20).map((d, i) => ({
    time: i,
    download: d / 1024 / 1024,
    upload: (uploadHistory[i] || 0) / 1024 / 1024
  }));

  if (loading) {
    return (
      <div className="metrics-loader">
        <RefreshCw size={40} className="spin" />
        <h2>Loading System Metrics...</h2>
        <p>Fetching server data, media files, and network statistics</p>
      </div>
    );
  }

  return (
    <div className="system-metrics-container">
      {/* Header */}
      <header className="metrics-header">
        <div>
          <h1><Activity size={28} /> System Metrics Dashboard</h1>
          <p>Real-time server monitoring, media storage analysis, and network performance</p>
        </div>
        <div className="header-actions">
          <span className="last-updated">Last updated: {lastUpdated}</span>
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={autoRefresh ? 'active' : ''}>
            <RefreshCcw size={16} /> {autoRefresh ? 'Auto (10s)' : 'Manual'}
          </button>
          <button onClick={() => loadMetrics()} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Health Status */}
      <div className={`health-banner health-${data.health.status}`}>
        <div className="health-status">
          {data.health.status === 'healthy' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
          <div>
            <strong>System Health: {data.health.score}%</strong>
            <span>{data.health.status.toUpperCase()}</span>
          </div>
        </div>
        <div className="health-details">
          <span><Server size={14} /> {data.server.hostname}</span>
          <span><Clock3 size={14} /> Uptime: {data.wakeTime.uptime}</span>
          <span><Globe size={14} /> {data.server.platform}</span>
        </div>
      </div>

      {/* Issues */}
      {data.health.issues.length > 0 && (
        <div className="issues-list">
          {data.health.issues.map(issue => (
            <div key={issue}><AlertTriangle size={14} /> {issue}</div>
          ))}
        </div>
      )}

      {/* Stats Grid - CPU, Memory, Storage, Network */}
      <div className="stats-grid">
        <div className="stat-card">
          <Cpu size={22} />
          <div className="stat-info">
            <span className="stat-label">CPU Usage</span>
            <span className="stat-value">{data.system.cpu.usage}%</span>
            <span className="stat-detail">{data.system.cpu.cores} cores @ {data.system.cpu.speed}MHz</span>
            <div className="progress-bar"><div style={{ width: `${data.system.cpu.usage}%` }} /></div>
          </div>
        </div>

        <div className="stat-card">
          <MemoryStick size={22} />
          <div className="stat-info">
            <span className="stat-label">Memory Usage</span>
            <span className="stat-value">{data.system.memory.usage}%</span>
            <span className="stat-detail">{formatBytes(data.system.memory.used)} / {formatBytes(data.system.memory.total)}</span>
            <div className="progress-bar"><div style={{ width: `${data.system.memory.usage}%` }} /></div>
          </div>
        </div>

        {/* SWAP MEMORY CARD */}
        <div className="stat-card swap-card">
          <Database size={22} />
          <div className="stat-info">
            <span className="stat-label">Swap Memory</span>
            <span className="stat-value">{data.system.memory.swapUsage}%</span>
            <span className="stat-detail">{formatBytes(data.system.memory.swapUsed)} / {formatBytes(data.system.memory.swapTotal)}</span>
            <div className="progress-bar"><div style={{ width: `${data.system.memory.swapUsage}%` }} className="swap" /></div>
          </div>
        </div>

        <div className="stat-card">
          <HardDrive size={22} />
          <div className="stat-info">
            <span className="stat-label">Storage Usage</span>
            <span className="stat-value">{data.system.storage.usage}%</span>
            <span className="stat-detail">{formatBytes(data.system.storage.used)} / {formatBytes(data.system.storage.total)}</span>
            <div className="progress-bar"><div style={{ width: `${data.system.storage.usage}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Network Speed Section - UPLOAD & DOWNLOAD */}
      <div className="network-speed-section">
        <div className="section-header">
          <h2><Wifi size={20} /> Network Speed</h2>
          <button onClick={() => setShowNetworkSpeed(!showNetworkSpeed)}>
            {showNetworkSpeed ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        </div>
        {showNetworkSpeed && (
          <div className="network-speed-grid">
            <div className="speed-card download">
              <Download size={28} />
              <div>
                <span className="speed-label">Download Speed</span>
                <span className="speed-value">{formatSpeed(data.system.network.speed.download)}</span>
                <span className="speed-detail">Peak: {formatSpeed(Math.max(...data.system.network.speed.downloadHistory, data.system.network.speed.download))}</span>
              </div>
            </div>
            <div className="speed-card upload">
              <Upload size={28} />
              <div>
                <span className="speed-label">Upload Speed</span>
                <span className="speed-value">{formatSpeed(data.system.network.speed.upload)}</span>
                <span className="speed-detail">Peak: {formatSpeed(Math.max(...data.system.network.speed.uploadHistory, data.system.network.speed.upload))}</span>
              </div>
            </div>
            <div className="speed-card latency">
              <Gauge size={28} />
              <div>
                <span className="speed-label">Latency</span>
                <span className="speed-value">{data.system.network.speed.latency} ms</span>
                <span className="speed-detail">Response time</span>
              </div>
            </div>
          </div>
        )}
        {networkChartData.length > 0 && (
          <div className="network-chart">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={networkChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${(v as number).toFixed(2)} Mbps`} />
                <Area type="monotone" dataKey="download" stroke="#3b82f6" fill="#3b82f620" name="Download" />
                <Area type="monotone" dataKey="upload" stroke="#10b981" fill="#10b98120" name="Upload" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Storage Details with Disk IOPS */}
      <div className="storage-details">
        <h2><HardDrive size={20} /> Storage Details</h2>
        <div className="disks-list">
          {data.system.storage.disks.map(disk => (
            <div key={disk.name} className="disk-card">
              <div className="disk-header">
                <strong>{disk.name}</strong>
                <span>{disk.type}</span>
              </div>
              <div className="disk-stats">
                <span>Total: {formatBytes(disk.total)}</span>
                <span>Used: {formatBytes(disk.used)}</span>
                <span>Free: {formatBytes(disk.free)}</span>
              </div>
              <div className="progress-bar"><div style={{ width: `${disk.usage}%` }} /></div>
              <div className="disk-speed">
                <span><Download size={12} /> Read: {formatSpeed(disk.readSpeed)}</span>
                <span><Upload size={12} /> Write: {formatSpeed(disk.writeSpeed)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="iops-info">
          <span>IOPS Read: {data.system.storage.iops.read}</span>
          <span>IOPS Write: {data.system.storage.iops.write}</span>
        </div>
      </div>

      {/* MEDIA FILES SECTION - Largest to Smallest */}
      <div className="media-files-section">
        <div className="section-header">
          <h2><ImageIcon size={20} /> Media Files Analysis</h2>
          <div className="media-stats-summary">
            <span>{data.system.mediaStats.totalFiles} files</span>
            <span>{formatBytes(data.system.mediaStats.totalSize)} total</span>
          </div>
        </div>

        {/* Media Statistics Cards */}
        <div className="media-stats-grid">
          <div className="media-stat-card">
            <ImageIcon size={24} />
            <div><strong>{data.system.mediaStats.images.count}</strong> Images</div>
            <span>{formatBytes(data.system.mediaStats.images.size)}</span>
          </div>
          <div className="media-stat-card">
            <Video size={24} />
            <div><strong>{data.system.mediaStats.videos.count}</strong> Videos</div>
            <span>{formatBytes(data.system.mediaStats.videos.size)}</span>
          </div>
          <div className="media-stat-card">
            <FileText size={24} />
            <div><strong>{data.system.mediaStats.documents.count}</strong> Documents</div>
            <span>{formatBytes(data.system.mediaStats.documents.size)}</span>
          </div>
          <div className="media-stat-card">
            <Music size={24} />
            <div><strong>{data.system.mediaStats.audio.count}</strong> Audio</div>
            <span>{formatBytes(data.system.mediaStats.audio.size)}</span>
          </div>
        </div>

        {/* Largest & Smallest Files */}
        <div className="extreme-files">
          {data.system.mediaStats.largestFile && (
            <div className="largest-file">
              <strong>🔴 Largest File:</strong>
              <span>{data.system.mediaStats.largestFile.name}</span>
              <span>{formatBytes(data.system.mediaStats.largestFile.size)}</span>
              <span>{data.system.mediaStats.largestFile.type}</span>
            </div>
          )}
          {data.system.mediaStats.smallestFile && (
            <div className="smallest-file">
              <strong>🟢 Smallest File:</strong>
              <span>{data.system.mediaStats.smallestFile.name}</span>
              <span>{formatBytes(data.system.mediaStats.smallestFile.size)}</span>
              <span>{data.system.mediaStats.smallestFile.type}</span>
            </div>
          )}
          <div className="average-size">
            <strong>📊 Average Size:</strong>
            <span>{formatBytes(data.system.mediaStats.averageSize)} per file</span>
          </div>
        </div>

        {/* Media Distribution Pie Chart */}
        <div className="media-chart">
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie data={mediaPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {mediaPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatBytes(v as number)} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Media Files Table with Sorting */}
        <div className="media-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search media files..." value={mediaSearch} onChange={e => setMediaSearch(e.target.value)} />
          </div>
          <select value={mediaTypeFilter} onChange={e => setMediaTypeFilter(e.target.value as MediaType)}>
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="audio">Audio</option>
          </select>
          <div className="sort-controls">
            <button onClick={() => setMediaSortBy('size')} className={mediaSortBy === 'size' ? 'active' : ''}>
              Size {mediaSortBy === 'size' && (mediaSortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />)}
            </button>
            <button onClick={() => setMediaSortBy('name')} className={mediaSortBy === 'name' ? 'active' : ''}>Name</button>
            <button onClick={() => setMediaSortBy('type')} className={mediaSortBy === 'type' ? 'active' : ''}>Type</button>
            <button onClick={() => setMediaSortBy('date')} className={mediaSortBy === 'date' ? 'active' : ''}>Date</button>
            <button onClick={() => setMediaSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
              {mediaSortOrder === 'desc' ? '↓ Largest First' : '↑ Smallest First'}
            </button>
          </div>
        </div>

        <div className="media-table-container">
          <table className="media-table">
            <thead>
              <tr>
                <th>Type</th><th>Name</th><th>Format</th><th>Size</th><th>Modified</th><th>Uploaded By</th>
              </tr>
            </thead>
            <tbody>
              {sortedMediaFiles.slice(0, 100).map(file => (
                <tr key={file.id}>
                  <td>{getMediaTypeIcon(file.type)}</td>
                  <td className="filename">{file.name}</td>
                  <td>{file.format}</td>
                  <td className="size-cell">{formatBytes(file.size)}</td>
                  <td>{new Date(file.modifiedAt).toLocaleDateString()}</td>
                  <td>{file.uploadedBy}</td>
                </tr>
              ))}
              {sortedMediaFiles.length === 0 && (
                <tr><td colSpan={6} className="empty">No media files found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedMediaFiles.length > 100 && (
          <div className="table-note">Showing first 100 of {sortedMediaFiles.length} files</div>
        )}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Request Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="requestGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="requests" stroke="#0f766e" fill="url(#requestGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Response Time (ms)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="responseMs" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Details */}
      <div className="database-section">
        <h2><Database size={20} /> Database Performance</h2>
        <div className="database-stats">
          <div><span>Size:</span><strong>{formatBytes(data.system.database.size)}</strong></div>
          <div><span>Connections:</span><strong>{data.system.database.connections}</strong></div>
          <div><span>Queries/sec:</span><strong>{data.system.database.queriesPerSecond}</strong></div>
          <div><span>Cache Hit:</span><strong>{data.system.database.hitRatio}%</strong></div>
          <div><span>Slow Queries:</span><strong>{data.system.database.slowQueries}</strong></div>
          <div><span>Tables:</span><strong>{data.system.database.tableCount}</strong></div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />

      <style>{`
        .system-metrics-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .metrics-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .metrics-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 12px; align-items: center; }
        .header-actions button { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .header-actions button.active { background: #0f766e; color: white; border-color: #0f766e; }
        .last-updated { font-size: 12px; color: #64748b; }
        .health-banner { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .health-healthy { border-left: 4px solid #10b981; }
        .health-warning { border-left: 4px solid #f59e0b; }
        .health-critical { border-left: 4px solid #ef4444; }
        .health-status { display: flex; align-items: center; gap: 12px; }
        .health-status strong { font-size: 18px; }
        .health-details { display: flex; gap: 20px; color: #64748b; }
        .issues-list { background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
        .issues-list div { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #92400e; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-info { flex: 1; }
        .stat-label { font-size: 12px; color: #64748b; display: block; }
        .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-detail { font-size: 11px; color: #64748b; }
        .progress-bar { background: #e2e8f0; border-radius: 10px; height: 6px; margin-top: 8px; overflow: hidden; }
        .progress-bar div { background: #3b82f6; height: 100%; border-radius: 10px; transition: width 0.3s; }
        .progress-bar div.swap { background: #f59e0b; }
        .swap-card { border-left: 3px solid #f59e0b; }
        .network-speed-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .network-speed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .speed-card { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: #f8fafc; }
        .speed-card.download { border-left: 3px solid #3b82f6; }
        .speed-card.upload { border-left: 3px solid #10b981; }
        .speed-card.latency { border-left: 3px solid #f59e0b; }
        .speed-label { font-size: 12px; color: #64748b; display: block; }
        .speed-value { font-size: 20px; font-weight: 700; display: block; }
        .network-chart { margin-top: 16px; }
        .storage-details { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .disks-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
        .disk-card { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .disk-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .disk-stats { display: flex; gap: 16px; font-size: 12px; margin-bottom: 8px; }
        .disk-speed { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #64748b; }
        .iops-info { display: flex; gap: 20px; margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 13px; }
        .media-files-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .media-stats-summary { display: flex; gap: 16px; font-size: 13px; font-weight: normal; }
        .media-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .media-stat-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .media-stat-card strong { font-size: 18px; }
        .media-stat-card span { font-size: 12px; color: #64748b; }
        .extreme-files { display: flex; flex-wrap: wrap; gap: 20px; padding: 12px; background: #f1f5f9; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
        .extreme-files > div { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .media-chart { margin-bottom: 24px; }
        .media-filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .search-box { flex: 1; display: flex; align-items: center; background: #f1f5f9; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; background: none; border: none; outline: none; }
        .sort-controls { display: flex; gap: 8px; flex-wrap: wrap; }
        .sort-controls button { padding: 6px 12px; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
        .sort-controls button.active { background: #0f766e; color: white; }
        .media-table-container { overflow-x: auto; max-height: 500px; overflow-y: auto; }
        .media-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .media-table th { text-align: left; padding: 12px; background: #f8fafc; position: sticky; top: 0; }
        .media-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        .media-table tr:hover { background: #f8fafc; }
        .filename { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .size-cell { font-family: monospace; font-weight: 500; }
        .table-note { text-align: center; padding: 12px; font-size: 12px; color: #64748b; }
        .charts-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .chart-card { background: white; border-radius: 12px; padding: 20px; }
        .chart-card h3 { margin-bottom: 16px; font-size: 16px; }
        .database-section { background: white; border-radius: 12px; padding: 20px; }
        .database-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 16px; }
        .database-stats div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .metrics-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 40px; color: #64748b; }
      `}</style>
    </div>
  );
}

// Add missing import
import { Search } from 'lucide-react';
