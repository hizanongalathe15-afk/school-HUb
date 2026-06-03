import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Archive,
  RefreshCcw,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
  Calendar,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  Percent,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  Tag,
  Barcode,
  QrCode,
  Shield,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  PlusCircle,
  MinusCircle,
  Settings,
  Wrench,
  Wrench as Tool,
  ClipboardList,
  History,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';

interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  subCategory?: string;
  location: string;
  department?: string;
  assignedTo?: string;
  assignedToName?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  depreciationMethod: 'straight-line' | 'reducing-balance';
  usefulLife: number; // in years
  accumulatedDepreciation: number;
  salvageValue: number;
  status: 'active' | 'maintenance' | 'disposed' | 'lost' | 'transferred';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  supplier?: string;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceHistory?: Array<{
    id: string;
    date: string;
    type: string;
    cost: number;
    notes: string;
  }>;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AssetSummary {
  totalAssets: number;
  totalValue: number;
  activeCount: number;
  maintenanceCount: number;
  disposedCount: number;
  categories: Record<string, number>;
}

const StoreKeeperFixedAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const [regForm, setRegForm] = useState({
    name: '',
    category: 'Furniture',
    subCategory: '',
    location: '',
    department: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    usefulLife: 5,
    salvageValue: 0,
    serialNumber: '',
    model: '',
    manufacturer: '',
    supplier: '',
    warrantyExpiry: '',
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'routine',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    notes: ''
  });

  const [disposeForm, setDisposeForm] = useState({
    reason: 'obsolete',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsRes, summaryRes] = await Promise.all([
        storeKeeperService.getFixedAssets(),
        storeKeeperService.getFixedAssetsSummary()
      ]);
      setAssets(Array.isArray(assetsRes) ? assetsRes : assetsRes?.data || []);
      setSummary(summaryRes?.data || null);
    } catch (error) {
      console.error('Failed to load fixed assets:', error);
      toast.error('Failed to load fixed assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (asset.assetCode && asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? asset.category === categoryFilter : true;
      const matchesStatus = statusFilter ? asset.status === statusFilter : true;
      const matchesLocation = locationFilter ? asset.location === locationFilter : true;
      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [assets, searchTerm, categoryFilter, statusFilter, locationFilter]);

  const categories = useMemo(() => {
    const cats = new Set(assets.map(asset => asset.category));
    return Array.from(cats);
  }, [assets]);

  const locations = useMemo(() => {
    const locs = new Set(assets.map(asset => asset.location).filter(Boolean));
    return Array.from(locs);
  }, [assets]);

  const registerAsset = async () => {
    if (!regForm.name) {
      toast.error('Asset name is required');
      return;
    }
    if (regForm.purchasePrice <= 0) {
      toast.error('Valid purchase price is required');
      return;
    }

    setSaving(true);
    try {
      const newAsset = {
        ...regForm,
        assetCode: `AST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'active',
        condition: 'excellent',
        currentValue: regForm.purchasePrice,
        accumulatedDepreciation: 0
      };
      await storeKeeperService.inventory.addFixedAsset(newAsset);
      toast.success('Fixed asset registered successfully');
      setShowRegisterModal(false);
      setRegForm({
        name: '',
        category: 'Furniture',
        subCategory: '',
        location: '',
        department: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        usefulLife: 5,
        salvageValue: 0,
        serialNumber: '',
        model: '',
        manufacturer: '',
        supplier: '',
        warrantyExpiry: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register asset');
    } finally {
      setSaving(false);
    }
  };

  const updateAsset = async () => {
    if (!selectedAsset) return;
    
    setSaving(true);
    try {
      await storeKeeperService.inventory.updateFixedAsset(selectedAsset.id, selectedAsset);
      toast.success('Asset updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const addMaintenance = async () => {
    if (!selectedAsset) return;
    
    setSaving(true);
    try {
      const maintenanceRecord = {
        ...maintenanceForm,
        id: Date.now().toString(),
        assetId: selectedAsset.id
      };
      await storeKeeperService.inventory.addAssetMaintenance(selectedAsset.id, maintenanceRecord);
      toast.success('Maintenance record added');
      setShowMaintenanceModal(false);
      setMaintenanceForm({ type: 'routine', date: new Date().toISOString().split('T')[0], cost: 0, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add maintenance:', error);
      toast.error('Failed to add maintenance record');
    } finally {
      setSaving(false);
    }
  };

  const disposeAsset = async () => {
    if (!selectedAsset) return;
    
    setSaving(true);
    try {
      await storeKeeperService.inventory.disposeFixedAsset(selectedAsset.id, {
        reason: disposeForm.reason,
        notes: disposeForm.notes,
        date: new Date().toISOString()
      });
      toast.success('Asset disposed successfully');
      setShowDisposeModal(false);
      setDisposeForm({ reason: 'obsolete', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Disposal failed:', error);
      toast.error('Failed to dispose asset');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Wrench className="w-3 h-3" /> },
      disposed: { label: 'Disposed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
      lost: { label: 'Lost', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: <AlertCircle className="w-3 h-3" /> },
      transferred: { label: 'Transferred', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <ExternalLink className="w-3 h-3" /> }
    };
    const c = config[status as keyof typeof config] || config.active;
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', c.color)}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  const getConditionBadge = (condition: string) => {
    const config = {
      excellent: { label: 'Excellent', color: 'bg-green-100 text-green-800' },
      good: { label: 'Good', color: 'bg-blue-100 text-blue-800' },
      fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
      poor: { label: 'Poor', color: 'bg-orange-100 text-orange-800' },
      damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800' }
    };
    const c = config[condition as keyof typeof config] || config.good;
    return <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', c.color)}>{c.label}</span>;
  };

  const calculateDepreciation = (asset: FixedAsset) => {
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const annualDepreciation = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    const expectedDepreciation = Math.min(annualDepreciation * yearsOwned, asset.purchasePrice - asset.salvageValue);
    const expectedValue = asset.purchasePrice - expectedDepreciation;
    return { annualDepreciation, expectedValue, depreciationStatus: expectedValue > asset.currentValue ? 'accelerated' : 'normal' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading fixed assets..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Archive className="w-6 h-6 text-blue-600" />
            Fixed Assets Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all fixed assets including depreciation and maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Card View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowRegisterModal(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Register Asset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalAssets}</p>
            <p className="text-xs text-gray-500">Total Assets</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
            <p className="text-xs text-gray-500">Total Value</p>
          </Card>
          <Card className="text-center border-l-4 border-l-green-500">
            <p className="text-2xl font-bold text-green-600">{summary.activeCount}</p>
            <p className="text-xs text-gray-500">Active</p>
          </Card>
          <Card className="text-center border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold text-yellow-600">{summary.maintenanceCount}</p>
            <p className="text-xs text-gray-500">Maintenance</p>
          </Card>
          <Card className="text-center border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600">{summary.disposedCount}</p>
            <p className="text-xs text-gray-500">Disposed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{Object.keys(summary.categories).length}</p>
            <p className="text-xs text-gray-500">Categories</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, asset code, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="disposed">Disposed</option>
            <option value="lost">Lost</option>
            <option value="transferred">Transferred</option>
          </select>
          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('');
              setLocationFilter('');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <Card className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No fixed assets found</p>
          <Button className="mt-4" onClick={() => setShowRegisterModal(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Register Your First Asset
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Asset Code</th>
                  <th className="px-4 py-3 font-semibold">Asset Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Purchase Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Value</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Condition</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssets.map((asset) => (
                  <React.Fragment key={asset.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-sm">{asset.assetCode}</p>
                          {asset.serialNumber && (
                            <p className="text-xs text-gray-500">SN: {asset.serialNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                      <td className="px-4 py-3">{asset.category}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                        <p className="text-xs text-gray-500">{((asset.currentValue / asset.purchasePrice) * 100).toFixed(0)}% of original</p>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(asset.status)}</td>
                      <td className="px-4 py-3">{getConditionBadge(asset.condition)}</td>
                      <td className="px-4 py-3 text-center">
<div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedAsset(asset);
                            setShowDetailModal(true);
                          }}>
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedAsset(asset);
                            setShowEditModal(true);
                          }}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => {
                            setSelectedAsset(asset);
                            setShowDisposeModal(true);
                          }}>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Dispose
                          </Button>
                        </div>
                      </td>
                      </tr>
                    {expandedAssetId === asset.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium">{asset.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Assigned To</p>
                              <p className="font-medium">{asset.assignedToName || 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Purchase Date</p>
                              <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Warranty</p>
                              <p className="font-medium">{asset.warrantyExpiry ? `Expires ${new Date(asset.warrantyExpiry).toLocaleDateString()}` : 'Not specified'}</p>
                            </div>
                            {asset.model && (
                              <div>
                                <p className="text-gray-500">Model</p>
                                <p className="font-medium">{asset.model}</p>
                              </div>
                            )}
                            {asset.manufacturer && (
                              <div>
                                <p className="text-gray-500">Manufacturer</p>
                                <p className="font-medium">{asset.manufacturer}</p>
                              </div>
                            )}
                            {asset.supplier && (
                              <div>
                                <p className="text-gray-500">Supplier</p>
                                <p className="font-medium">{asset.supplier}</p>
                              </div>
                            )}
                          </div>
                         </td>
                       </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-500">{asset.assetCode}</p>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{asset.name}</h3>
                </div>
                {getStatusBadge(asset.status)}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span>{asset.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Price:</span>
                  <span className="font-medium">{formatCurrency(asset.purchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Value:</span>
                  <span className="font-medium text-green-600">{formatCurrency(asset.currentValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span>{asset.location || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition:</span>
                  {getConditionBadge(asset.condition)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" fullWidth onClick={() => {
                  setSelectedAsset(asset);
                  setShowDetailModal(true);
                }}>
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" variant="outline" fullWidth onClick={() => {
                  setSelectedAsset(asset);
                  setShowMaintenanceModal(true);
                }}>
                  <Wrench className="w-3 h-3 mr-1" />
                  Maintenance
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Register Asset Modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register New Fixed Asset" size="lg">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Name *</label>
              <input value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select value={regForm.category} onChange={e => setRegForm({ ...regForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option>Furniture</option>
                <option>Computer Lab</option>
                <option>Electronics</option>
                <option>Vehicles/Spares</option>
                <option>Laboratory Equipment</option>
                <option>Office Equipment</option>
                <option>Sports Equipment</option>
                <option>Musical Instruments</option>
                <option>Library Books</option>
                <option>Building/Facilities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input value={regForm.location} onChange={e => setRegForm({ ...regForm, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input value={regForm.department} onChange={e => setRegForm({ ...regForm, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
              <input type="date" value={regForm.purchaseDate} onChange={e => setRegForm({ ...regForm, purchaseDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price (KES)</label>
              <input type="number" value={regForm.purchasePrice} onChange={e => setRegForm({ ...regForm, purchasePrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Useful Life (years)</label>
              <input type="number" value={regForm.usefulLife} onChange={e => setRegForm({ ...regForm, usefulLife: parseInt(e.target.value) || 5 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salvage Value</label>
              <input type="number" value={regForm.salvageValue} onChange={e => setRegForm({ ...regForm, salvageValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
              <input value={regForm.serialNumber} onChange={e => setRegForm({ ...regForm, serialNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
              <input value={regForm.model} onChange={e => setRegForm({ ...regForm, model: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
              <input value={regForm.manufacturer} onChange={e => setRegForm({ ...regForm, manufacturer: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty Expiry</label>
              <input type="date" value={regForm.warrantyExpiry} onChange={e => setRegForm({ ...regForm, warrantyExpiry: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={regForm.notes} onChange={e => setRegForm({ ...regForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowRegisterModal(false)}>Cancel</Button>
          <Button fullWidth onClick={registerAsset} isLoading={saving}>Register Asset</Button>
        </div>
      </Modal>

      {/* Asset Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Asset Details" size="lg">
        {selectedAsset && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Asset Code</p>
                <p className="font-mono text-sm">{selectedAsset.assetCode}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Asset Name</p>
                <p className="font-semibold">{selectedAsset.name}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Category</p>
                <p>{selectedAsset.category}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Location</p>
                <p>{selectedAsset.location || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Assigned To</p>
                <p>{selectedAsset.assignedToName || 'Unassigned'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Status</p>
                {getStatusBadge(selectedAsset.status)}
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Purchase Date</p>
                <p>{new Date(selectedAsset.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Purchase Price</p>
                <p className="font-medium">{formatCurrency(selectedAsset.purchasePrice)}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Current Value</p>
                <p className="font-medium text-green-600">{formatCurrency(selectedAsset.currentValue)}</p>
              </div>
              {selectedAsset.serialNumber && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Serial Number</p>
                  <p className="font-mono text-sm">{selectedAsset.serialNumber}</p>
                </div>
              )}
              {selectedAsset.model && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Model</p>
                  <p>{selectedAsset.model}</p>
                </div>
              )}
              {selectedAsset.manufacturer && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Manufacturer</p>
                  <p>{selectedAsset.manufacturer}</p>
                </div>
              )}
            </div>
            {selectedAsset.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm">{selectedAsset.notes}</p>
              </div>
            )}
            {selectedAsset.maintenanceHistory && selectedAsset.maintenanceHistory.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Maintenance History</h4>
                <div className="space-y-2">
                  {selectedAsset.maintenanceHistory.slice(0, 3).map(record => (
                    <div key={record.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{record.type}</span>
                        <span className="text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600">{record.notes}</p>
                      {record.cost > 0 && <p className="text-xs">Cost: {formatCurrency(record.cost)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Add Maintenance Record" size="md">
        {selectedAsset && (
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="font-medium">{selectedAsset.name}</p>
              <p className="text-sm text-gray-600">Asset Code: {selectedAsset.assetCode}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maintenance Type</label>
              <select value={maintenanceForm.type} onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="routine">Routine Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="calibration">Calibration</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (KES)</label>
                <input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea value={maintenanceForm.notes} onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowMaintenanceModal(false)}>Cancel</Button>
          <Button fullWidth onClick={addMaintenance} isLoading={saving}>Add Record</Button>
        </div>
      </Modal>

      {/* Dispose Modal */}
      <Modal isOpen={showDisposeModal} onClose={() => setShowDisposeModal(false)} title="Dispose Asset" size="md">
        {selectedAsset && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <p className="font-medium">{selectedAsset.name}</p>
              <p className="text-sm text-gray-600">Current Value: {formatCurrency(selectedAsset.currentValue)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Disposal</label>
              <select value={disposeForm.reason} onChange={e => setDisposeForm({ ...disposeForm, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="obsolete">Obsolete</option>
                <option value="damaged">Damaged beyond repair</option>
                <option value="lost">Lost</option>
                <option value="stolen">Stolen</option>
                <option value="sold">Sold</option>
                <option value="donated">Donated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea value={disposeForm.notes} onChange={e => setDisposeForm({ ...disposeForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="text-sm text-red-600">
              ⚠️ This action will mark the asset as disposed and remove it from active inventory. This cannot be undone.
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowDisposeModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={disposeAsset} isLoading={saving}>Confirm Disposal</Button>
        </div>
      </Modal>
    </div>
  );
};

export default StoreKeeperFixedAssetsPage;
