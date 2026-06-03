import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { FixedAsset, FixedAssetForm, DepreciationRecord, MaintenanceRecord } from '../../../types/bursar';

const BursarFixedAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [depreciation, setDepreciation] = useState<DepreciationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetForm, setAssetForm] = useState<FixedAssetForm>({
    name: '',
    description: '',
    assetType: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    salvageValue: 0,
    usefulLife: 0,
    department: '',
    location: '',
    status: 'active',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'depreciation' | 'maintenance'>('create');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await bursarService.fixedAssets.getAssets();
      if (response.success && response.data) {
        setAssets(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch fixed assets:', error);
      toast.error('Failed to load fixed assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepreciation = async (assetId: string) => {
    try {
      const response = await bursarService.fixedAssets.getAssetDepreciation(assetId);
      if (response.success && response.data) {
        setDepreciation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch depreciation:', error);
      toast.error('Failed to load depreciation schedule');
    }
  };

  const fetchMaintenance = async (assetId: string) => {
    try {
      const response = await bursarService.fixedAssets.getAssetMaintenance(assetId);
      if (response.success && response.data) {
        setMaintenance(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance records:', error);
      toast.error('Failed to load maintenance history');
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (modalType === 'create') {
        response = await bursarService.fixedAssets.createAsset(assetForm);
      } else {
        response = await bursarService.fixedAssets.updateAsset(selectedAsset!.id, assetForm);
      }
      if (response.success) {
        toast.success(response.message || 'Asset saved successfully');
        setModalOpen(false);
        resetAssetForm();
        await fetchAssets();
      } else {
        toast.error(response.message || 'Failed to save asset');
      }
    } catch (error) {
      console.error('Asset save error:', error);
      toast.error('Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await bursarService.fixedAssets.deleteAsset(assetId);
        if (response.success) {
          toast.success('Asset deleted successfully');
          await fetchAssets();
          setSelectedAsset(null);
          setDepreciation([]);
          setMaintenance([]);
        } else {
          toast.error(response.message || 'Failed to delete asset');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete asset');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditAsset = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setAssetForm({
      name: asset.name,
      description: asset.description,
      assetType: asset.assetType,
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      salvageValue: asset.salvageValue,
      usefulLife: asset.usefulLife,
      department: asset.department,
      location: asset.location,
      status: asset.status,
    });
    setModalType('create');
    setModalOpen(true);
  };

  const handleViewDepreciation = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setModalType('depreciation');
    setModalOpen(true);
    fetchDepreciation(asset.id);
  };

  const handleViewMaintenance = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setModalType('maintenance');
    setModalOpen(true);
    fetchMaintenance(asset.id);
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: '',
      description: '',
      assetType: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      salvageValue: 0,
      usefulLife: 0,
      department: '',
      location: '',
      status: 'active',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      inactive: { bg: 'bg-amber-100', text: 'text-amber-800' },
      maintenance: { bg: 'bg-blue-100', text: 'text-blue-800' },
      disposed: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return config[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading fixed assets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Fixed Assets Management</h1>
        <p className="text-amber-600">Track and manage school property and equipment</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Fixed Assets</h2>
            <p className="text-sm text-amber-500 mt-1">
              Total assets: {assets.length}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => {
                resetAssetForm();
                setModalType('create');
                setModalOpen(true);
              }}
              className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
            >
              Add Asset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-amber-100">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Asset Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Asset Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Purchase Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {asset.assetType || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                    {formatCurrency(asset.purchaseCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                      asset.status
                    ).bg} ${statusBadge(asset.status).text}`}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {asset.department || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {asset.location || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditAsset(asset)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewDepreciation(asset)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Depreciation
                    </button>
                    <button
                      onClick={() => handleViewMaintenance(asset)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Maintenance
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-amber-500">
                    No fixed assets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAsset && (
        <>
          <div className="bg-white rounded-xl shadow-md border border-amber-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-amber-800 mb-4">
                {modalType === 'create' ? 'Asset Details' : modalType === 'depreciation' ? 'Depreciation Schedule' : 'Maintenance History'}
              </h2>
              {modalType === 'create' && (
                <div className="mb-4">
                  <p className="text-sm text-amber-600">
                    <strong>Asset:</strong> {selectedAsset.name}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Type:</strong> {selectedAsset.assetType || '—'}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Purchase Cost:</strong> {formatCurrency(selectedAsset.purchaseCost)}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Purchase Date:</strong> {new Date(selectedAsset.purchaseDate).toLocaleDateString('en-KE')}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Salvage Value:</strong> {formatCurrency(selectedAsset.salvageValue)}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Useful Life:</strong> {selectedAsset.usefulLife} years
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Status:</strong>
                    <span className={`
                      px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                        selectedAsset.status
                      ).bg} ${statusBadge(selectedAsset.status).text}
                    `}>
                      {selectedAsset.status.charAt(0).toUpperCase() + selectedAsset.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Department:</strong> {selectedAsset.department || '—'}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Location:</strong> {selectedAsset.location || '—'}
                  </p>
                </div>
              )}
              {modalType === 'depreciation' && depreciation.length > 0 && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-800">Depreciation Schedule</h3>
                    <p className="text-sm text-amber-600">
                      Annual Depreciation: {formatCurrency(
                        (selectedAsset.purchaseCost - selectedAsset.salvageValue) / selectedAsset.usefulLife
                      )}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {depreciation.map((record) => (
                      <div key={record.id} className="border-b border-amber-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-amber-800">Year {record.year}</h3>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            {record.method}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-amber-500">Beginning Value:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(record.beginningValue)}</p>
                          </div>
                          <div>
                            <span className="text-amber-500">Depreciation Expense:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(record.depreciationExpense)}</p>
                          </div>
                          <div>
                            <span className="text-amber-500">Ending Value:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(record.endingValue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {modalType === 'maintenance' && maintenance.length > 0 && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-800">Maintenance History</h3>
                  </div>
                  <div className="space-y-4">
                    {maintenance.map((record) => (
                      <div key={record.id} className="border-b border-amber-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-amber-800">Maintenance Record</h3>
                          <span className={`
                            px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.type === 'preventive'
                                ? 'bg-blue-100 text-blue-800'
                                : record.type === 'repair'
                                ? 'bg-amber-100 text-amber-800'
                                : record.type === 'upgrade'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-amber-500">Date:</span>
                            <p className="text-amber-800 mt-1">{new Date(record.date).toLocaleDateString('en-KE')}</p>
                          </div>
                          <div>
                            <span className="text-amber-500">Cost:</span>
                            <p className="font-medium text-amber-800 mt-1">{formatCurrency(record.cost)}</p>
                          </div>
                        </div>
                        {record.description && (
                          <div className="mt-2 text-sm">
                            <span className="text-amber-500">Description:</span>
                            <p className="text-amber-800 mt-1 block">{record.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {((modalType === 'depreciation' && depreciation.length === 0) || (modalType === 'maintenance' && maintenance.length === 0)) && (
                <div className="text-center py-8">
                  <p className="text-amber-500">No {modalType === 'depreciation' ? 'depreciation' : 'maintenance'} records found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BursarFixedAssetsPage;