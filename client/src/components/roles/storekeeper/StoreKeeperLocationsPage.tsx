import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Building2,
  Layers,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Printer,
  Grid,
  List,
  MoreVertical,
  Copy,
  Archive,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Archive as Shelf,
  Package as Cabinet,
  DoorOpen,
  Home,
  Factory,
  Store,
  Map,
  Compass,
  Navigation,
  Target,
  Flag,
  Star,
  Award,
  Shield,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  Hash,
  FileText,
  Image,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { StorageLocation, LocationSummary } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface LocationForm {
  name: string;
  code: string;
  type: 'storeroom' | 'shelf' | 'cabinet' | 'warehouse' | 'display' | 'coldroom' | 'container';
  building: string;
  floor: string;
  room: string;
  section: string;
  row: string;
  shelfNumber: string;
  capacity: number;
  currentUsage: number;
  status: 'active' | 'inactive' | 'maintenance' | 'full' | 'reserved';
  temperature?: number;
  humidity?: number;
  notes: string;
  responsiblePerson?: string;
  contactPhone?: string;
}

const emptyForm: LocationForm = {
  name: '',
  code: '',
  type: 'storeroom',
  building: '',
  floor: '',
  room: '',
  section: '',
  row: '',
  shelfNumber: '',
  capacity: 0,
  currentUsage: 0,
  status: 'active',
  notes: '',
};

const Snowflake = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M4 12h16M12 6l-3 3 3 3 3-3-3-3zM12 18l-3-3 3-3 3 3-3 3z" />
  </svg>
);

const Box = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M12 22V12" />
    <path d="M3.3 7L12 12l8.7-5" />
  </svg>
);

const CabinetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const locationTypes = [
  { value: 'storeroom', label: 'Storeroom', icon: <DoorOpen className="w-4 h-4" /> },
  { value: 'shelf', label: 'Shelf', icon: <Layers className="w-4 h-4" /> },
  { value: 'cabinet', label: 'Cabinet', icon: <CabinetIcon className="w-4 h-4" /> },
  { value: 'warehouse', label: 'Warehouse', icon: <Warehouse className="w-4 h-4" /> },
  { value: 'display', label: 'Display', icon: <Store className="w-4 h-4" /> },
  { value: 'coldroom', label: 'Cold Room', icon: <Snowflake className="w-4 h-4" /> },
  { value: 'container', label: 'Container', icon: <Box className="w-4 h-4" /> },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: <XCircle className="w-3 h-3" /> },
  maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertTriangle className="w-3 h-3" /> },
  full: { label: 'Full', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="w-3 h-3" /> },
  reserved: { label: 'Reserved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Flag className="w-3 h-3" /> },
};

export default function StoreKeeperLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [summary, setSummary] = useState<LocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState<StorageLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const [locationsRes, summaryRes] = await Promise.all([
        storeKeeperService.locations.getLocations(),
        storeKeeperService.locations.getLocationSummary()
      ]);
      setLocations(locationsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (location.building || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (location.room || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter ? location.type === typeFilter : true;
      const matchesStatus = statusFilter ? location.status === statusFilter : true;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [locations, searchTerm, typeFilter, statusFilter]);

  const statistics = useMemo(() => {
    const total = locations.length;
    const active = locations.filter(l => l.status === 'active').length;
    const full = locations.filter(l => l.status === 'full').length;
    const maintenance = locations.filter(l => l.status === 'maintenance').length;
    const totalCapacity = locations.reduce((sum, l) => sum + (l.capacity || 0), 0);
    const currentUsage = locations.reduce((sum, l) => sum + (l.currentUsage || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (currentUsage / totalCapacity) * 100 : 0;
    return { total, active, full, maintenance, totalCapacity, currentUsage, utilizationRate };
  }, [locations]);

  const openModal = (location?: StorageLocation) => {
    if (location) {
      setEditing(location);
      setForm({
        name: location.name,
        code: location.code,
        type: location.type,
        building: location.building || '',
        floor: location.floor || '',
        room: location.room || '',
        section: location.section || '',
        row: location.row || '',
        shelfNumber: location.shelfNumber || '',
        capacity: location.capacity || 0,
        currentUsage: location.currentUsage || 0,
        status: location.status,
        notes: location.notes || '',
        responsiblePerson: location.responsiblePerson || '',
        contactPhone: location.contactPhone || '',
      });
    } else {
      setEditing(null);
      setForm({ ...emptyForm, code: `LOC-${Date.now()}` });
    }
    setShowModal(true);
  };

  const saveLocation = async () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await storeKeeperService.locations.updateLocation(editing.id, form);
        toast.success('Location updated successfully');
      } else {
        await storeKeeperService.locations.addLocation(form);
        toast.success('Location created successfully');
      }
      fetchLocations();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save location:', error);
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? Items in this location will become unassigned.')) return;
    try {
      await storeKeeperService.locations.deleteLocation(locationId);
      toast.success('Location deleted');
      fetchLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Failed to delete location');
    }
  };

  const exportLocations = () => {
    const csv = [
      ['Name', 'Code', 'Type', 'Building', 'Floor', 'Room', 'Capacity', 'Current Usage', 'Utilization', 'Status'],
      ...filteredLocations.map(loc => [
        loc.name,
        loc.code,
        loc.type,
        loc.building || '-',
        loc.floor || '-',
        loc.room || '-',
        loc.capacity || 0,
        loc.currentUsage || 0,
        loc.capacity ? `${Math.round(((loc.currentUsage || 0) / loc.capacity) * 100)}%` : 'N/A',
        loc.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locations_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      storeroom: <DoorOpen className="w-4 h-4" />,
      shelf: <Layers className="w-4 h-4" />,
      cabinet: <CabinetIcon className="w-4 h-4" />,
      warehouse: <Warehouse className="w-4 h-4" />,
      display: <Store className="w-4 h-4" />,
      coldroom: <Snowflake className="w-4 h-4" />,
      container: <Box className="w-4 h-4" />,
    };
    return iconMap[type] || <MapPin className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading storage locations..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Storage Locations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage physical storage locations, track capacity, and organize inventory
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={exportLocations}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchLocations()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">Total Locations</p>
        </Card>
        <Card className="text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.full}</p>
          <p className="text-xs text-gray-500">Full</p>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{statistics.maintenance}</p>
          <p className="text-xs text-gray-500">Maintenance</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{statistics.totalCapacity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Capacity</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{statistics.currentUsage.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Current Usage</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-600">{statistics.utilizationRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Utilization</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, building, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Types</option>
            {locationTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="full">Full</option>
            <option value="reserved">Reserved</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setStatusFilter('');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Locations List */}
      {filteredLocations.length === 0 ? (
        <Card className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No storage locations found</p>
          <Button className="mt-4" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Your First Location
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Building/Room</th>
                  <th className="px-4 py-3 font-semibold text-right">Capacity</th>
                  <th className="px-4 py-3 font-semibold text-right">Usage</th>
                  <th className="px-4 py-3 font-semibold text-right">Utilization</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLocations.map((location) => {
                  const utilization = location.capacity ? ((location.currentUsage || 0) / location.capacity) * 100 : 0;
                  const status = statusConfig[location.status as keyof typeof statusConfig] || statusConfig.active;
                  return (
                    <React.Fragment key={location.id}>
                      <tr 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => setExpandedId(expandedId === location.id ? null : location.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(location.type)}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{location.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{location.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">{location.type}</td>
                        <td className="px-4 py-3">
                          {[location.building, location.floor, location.room].filter(Boolean).join(' / ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{location.capacity?.toLocaleString() || '-'}</td>
                        <td className="px-4 py-3 text-right">{location.currentUsage?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={clsx(
                                  'rounded-full h-1.5',
                                  utilization > 90 ? 'bg-red-600' : utilization > 70 ? 'bg-yellow-600' : 'bg-green-600'
                                )}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs">{utilization.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedLocation(location);
                              setShowDetailModal(true);
                            }}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openModal(location)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteLocation(location.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === location.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {location.floor && (
                                <div>
                                  <p className="text-gray-500">Floor</p>
                                  <p className="font-medium">{location.floor}</p>
                                </div>
                              )}
                              {location.section && (
                                <div>
                                  <p className="text-gray-500">Section</p>
                                  <p className="font-medium">{location.section}</p>
                                </div>
                              )}
                              {location.row && (
                                <div>
                                  <p className="text-gray-500">Row</p>
                                  <p className="font-medium">{location.row}</p>
                                </div>
                              )}
                              {location.shelfNumber && (
                                <div>
                                  <p className="text-gray-500">Shelf</p>
                                  <p className="font-medium">{location.shelfNumber}</p>
                                </div>
                              )}
                              {location.responsiblePerson && (
                                <div>
                                  <p className="text-gray-500">Responsible Person</p>
                                  <p className="font-medium">{location.responsiblePerson}</p>
                                </div>
                              )}
                              {location.temperature !== undefined && (
                                <div>
                                  <p className="text-gray-500">Temperature</p>
                                  <p className="font-medium">{location.temperature}°C</p>
                                </div>
                              )}
                              {location.humidity !== undefined && (
                                <div>
                                  <p className="text-gray-500">Humidity</p>
                                  <p className="font-medium">{location.humidity}%</p>
                                </div>
                              )}
                            </div>
                            {location.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500">Notes</p>
                                <p className="text-sm">{location.notes}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => {
            const utilization = location.capacity ? ((location.currentUsage || 0) / location.capacity) * 100 : 0;
            const status = statusConfig[location.status as keyof typeof statusConfig] || statusConfig.active;
            return (
              <Card key={location.id} className="hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(location.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{location.code}</p>
                    </div>
                  </div>
                  <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="capitalize">{location.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span>{[location.building, location.floor, location.room].filter(Boolean).join(' / ') || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacity:</span>
                    <span>{location.capacity?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Usage:</span>
                    <span>{location.currentUsage?.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Utilization</span>
                      <span>{utilization.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={clsx(
                          'rounded-full h-1.5',
                          utilization > 90 ? 'bg-red-600' : utilization > 70 ? 'bg-yellow-600' : 'bg-green-600'
                        )}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" fullWidth onClick={() => {
                    setSelectedLocation(location);
                    setShowDetailModal(true);
                  }}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" fullWidth onClick={() => openModal(location)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Location Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Location Details" size="lg">
        {selectedLocation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Location Name</p>
                <p className="font-semibold">{selectedLocation.name}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Code</p>
                <p className="font-mono">{selectedLocation.code}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Type</p>
                <p className="capitalize">{selectedLocation.type}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Status</p>
                {statusConfig[selectedLocation.status as keyof typeof statusConfig]?.label || selectedLocation.status}
              </div>
              {selectedLocation.building && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Building</p>
                  <p>{selectedLocation.building}</p>
                </div>
              )}
              {selectedLocation.floor && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Floor</p>
                  <p>{selectedLocation.floor}</p>
                </div>
              )}
              {selectedLocation.room && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Room</p>
                  <p>{selectedLocation.room}</p>
                </div>
              )}
              {selectedLocation.section && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Section</p>
                  <p>{selectedLocation.section}</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Capacity</p>
                <p>{selectedLocation.capacity?.toLocaleString() || 'Unlimited'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Current Usage</p>
                <p>{selectedLocation.currentUsage?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Utilization</p>
                <p>{selectedLocation.capacity ? ((selectedLocation.currentUsage || 0) / selectedLocation.capacity * 100).toFixed(1) : 'N/A'}%</p>
              </div>
              {selectedLocation.responsiblePerson && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Responsible Person</p>
                  <p>{selectedLocation.responsiblePerson}</p>
                </div>
              )}
            </div>
            {selectedLocation.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm">{selectedLocation.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Location Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Storage Location' : 'Add Storage Location'} size="lg">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border rounded-lg font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                {locationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="full">Full</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Building</label>
              <input value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
              <input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
              <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
              <input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Row</label>
              <input value={form.row} onChange={e => setForm({ ...form, row: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shelf Number</label>
              <input value={form.shelfNumber} onChange={e => setForm({ ...form, shelfNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Usage</label>
              <input type="number" value={form.currentUsage} onChange={e => setForm({ ...form, currentUsage: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsible Person</label>
              <input value={form.responsiblePerson || ''} onChange={e => setForm({ ...form, responsiblePerson: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
              <input value={form.contactPhone || ''} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
          <Button fullWidth onClick={saveLocation} isLoading={saving}>
            {editing ? 'Update Location' : 'Create Location'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
