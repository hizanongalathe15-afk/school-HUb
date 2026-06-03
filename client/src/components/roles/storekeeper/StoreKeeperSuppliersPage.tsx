// client/src/components/roles/storekeeper/StoreKeeperSuppliersPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, RefreshCw, Search, Filter, Download, 
  Eye, Star, Phone, Mail, MapPin, Building2, Package, 
  Clock, CheckCircle, XCircle, TrendingUp, TrendingDown,
  Award, Calendar, FileText, Truck, DollarSign, Percent,
  ChevronDown, ChevronUp, MoreVertical, MessageCircle,
  Send, Printer, Copy, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { Supplier, SupplierProduct, PurchaseOrder } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
  paymentTerms: string;
  leadTime: number;
  rating: number;
  status: 'active' | 'inactive' | 'suspended';
  notes: string;
  categories: string[];
}

const emptyForm: SupplierFormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  country: 'Kenya',
  postalCode: '',
  taxId: '',
  paymentTerms: '30 days',
  leadTime: 7,
  rating: 3,
  status: 'active',
  notes: '',
  categories: [],
};

const categoryOptions = [
  'Stationery', 'Textbooks', 'Uniforms', 'Sports Equipment', 
  'Laboratory Equipment', 'Computer Lab', 'Library Books', 'Furniture',
  'Cleaning Supplies', 'Kitchen/Dining', 'Medical Supplies', 'Electronics',
  'Maintenance Tools', 'Vehicles/Spares'
];

const paymentTermsOptions = ['Cash on Delivery', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days'];

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 9v4M12 17h.01" />
    <path d="M12 3L2 20h20L12 3z" />
  </svg>
);

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" /> },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
};

export default function StoreKeeperSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<PurchaseOrder[]>([]);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await storeKeeperService.suppliers.getSuppliers({
        status: statusFilter || undefined,
        category: categoryFilter || undefined
      });
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        storeKeeperService.suppliers.getSupplierProducts(supplierId),
        storeKeeperService.suppliers.getSupplierOrders(supplierId)
      ]);
      setSupplierProducts(productsRes.data || []);
      setSupplierOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Failed to load supplier details:', error);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.phone.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [suppliers, searchTerm]);

  const statistics = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.status === 'active').length;
    const inactive = suppliers.filter(s => s.status === 'inactive').length;
    const suspended = suppliers.filter(s => s.status === 'suspended').length;
    const avgRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / (total || 1);
    const totalSpent = suppliers.reduce((sum, s) => sum + (s.totalSpent || 0), 0);
    return { total, active, inactive, suspended, avgRating, totalSpent };
  }, [suppliers]);

  const saveSupplier = async () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await storeKeeperService.suppliers.updateSupplier(editing.id, form);
        toast.success('Supplier updated successfully');
      } else {
        await storeKeeperService.suppliers.addSupplier(form);
        toast.success('Supplier created successfully');
      }
      fetchSuppliers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      toast.error('Unable to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to archive this supplier?')) return;
    try {
      await storeKeeperService.suppliers.deleteSupplier(supplierId);
      toast.success('Supplier archived');
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to archive supplier:', error);
      toast.error('Unable to archive supplier');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditing(supplier);
      setForm({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        alternatePhone: supplier.alternatePhone || '',
        address: supplier.address,
        city: supplier.city,
        country: supplier.country,
        postalCode: supplier.postalCode || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms,
        leadTime: supplier.leadTime || 7,
        rating: supplier.rating || 3,
        status: supplier.status,
        notes: supplier.notes || '',
        categories: supplier.categories || [],
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const viewSupplierDetails = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    await fetchSupplierDetails(supplier.id);
    setShowDetailModal(true);
  };

  const exportSuppliers = () => {
    const csv = [
      ['Name', 'Contact Person', 'Email', 'Phone', 'Payment Terms', 'Lead Time', 'Rating', 'Status', 'Total Orders', 'Total Spent'],
      ...filteredSuppliers.map(s => [
        s.name,
        s.contactPerson,
        s.email,
        s.phone,
        s.paymentTerms,
        s.leadTime || '-',
        s.rating || '-',
        s.status,
        s.totalOrders || 0,
        s.totalSpent || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const sendMessage = (supplier: Supplier, type: 'email' | 'whatsapp') => {
    // Implementation would open email client or WhatsApp
    if (type === 'email') {
      window.location.href = `mailto:${supplier.email}`;
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${supplier.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading suppliers..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Supplier Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage suppliers, track performance, and view order history
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
          <Button variant="outline" size="sm" onClick={exportSuppliers}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSuppliers}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">Total Suppliers</p>
        </Card>
        <Card className="text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-600">{statistics.inactive}</p>
          <p className="text-xs text-gray-500">Inactive</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{statistics.suspended}</p>
          <p className="text-xs text-gray-500">Suspended</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-1">{renderStars(Math.round(statistics.avgRating))}</div>
          <p className="text-xs text-gray-500">Avg Rating ({statistics.avgRating.toFixed(1)})</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">KES {statistics.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setCategoryFilter('');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No suppliers found</p>
          <Button className="mt-4" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Your First Supplier
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Categories</th>
                  <th className="px-4 py-3 font-semibold">Lead Time</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSuppliers.map((supplier) => {
                  const status = statusConfig[supplier.status as keyof typeof statusConfig] || statusConfig.active;
                  return (
                    <React.Fragment key={supplier.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                            <p className="text-xs text-gray-500">{supplier.city}, {supplier.country}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm">{supplier.contactPerson}</p>
                            <p className="text-xs text-gray-500">{supplier.phone}</p>
                            <p className="text-xs text-gray-500">{supplier.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {supplier.categories?.slice(0, 2).map(cat => (
                              <span key={cat} className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                                {cat}
                              </span>
                            ))}
                            {supplier.categories && supplier.categories.length > 2 && (
                              <span className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                                +{supplier.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{supplier.leadTime || '-'} days</span>
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(supplier.rating || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => viewSupplierDetails(supplier)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => openModal(supplier)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => sendMessage(supplier, 'email')}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Archive"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const status = statusConfig[supplier.status as keyof typeof statusConfig] || statusConfig.active;
            return (
              <Card key={supplier.id} className="hover:shadow-lg transition">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                      <p className="text-xs text-gray-500">{supplier.city}</p>
                    </div>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Contact:</span> {supplier.contactPerson}</p>
                    <p><span className="text-gray-500">Phone:</span> {supplier.phone}</p>
                    <p><span className="text-gray-500">Email:</span> {supplier.email}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>{renderStars(supplier.rating || 0)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => viewSupplierDetails(supplier)} className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(supplier)} className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => sendMessage(supplier, 'whatsapp')} className="p-1 hover:bg-gray-100 rounded">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., ABC Stationers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="supplier@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="+254..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alternate Phone</label>
              <input
                value={form.alternatePhone}
                onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {paymentTermsOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={form.leadTime}
                onChange={(e) => setForm({ ...form, leadTime: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Average delivery days"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={star <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nairobi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax ID / PIN</label>
              <input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Supplied Categories</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {categoryOptions.map(cat => (
                <label key={cat} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, categories: [...form.categories, cat] });
                      } else {
                        setForm({ ...form, categories: form.categories.filter(c => c !== cat) });
                      }
                    }}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Additional notes about this supplier..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={saveSupplier} disabled={saving}>
            {saving ? <Spinner size="sm" /> : (editing ? 'Update Supplier' : 'Create Supplier')}
          </Button>
        </div>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Supplier Details" size="lg">
        {selectedSupplier && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Supplier Name</p>
                <p className="font-semibold">{selectedSupplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                {renderStars(selectedSupplier.rating || 0)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Person</p>
                <p>{selectedSupplier.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', 
                  selectedSupplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                )}>
                  {selectedSupplier.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{selectedSupplier.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{selectedSupplier.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p>{selectedSupplier.paymentTerms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lead Time</p>
                <p>{selectedSupplier.leadTime || '-'} days</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p>{selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.country}</p>
              </div>
            </div>

            {/* Categories Supplied */}
            {selectedSupplier.categories && selectedSupplier.categories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Categories Supplied</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.categories.map(cat => (
                    <span key={cat} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products Supplied */}
            {supplierProducts.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium">Products Supplied</p>
                  <Button size="sm" variant="outline" onClick={() => setShowProductsModal(true)}>
                    View All ({supplierProducts.length})
                  </Button>
                </div>
                <div className="space-y-2">
                  {supplierProducts.slice(0, 5).map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">Last ordered: {product.lastOrdered ? new Date(product.lastOrdered).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">KES {product.unitPrice?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Ordered: {product.totalOrdered || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {supplierOrders.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium">Recent Purchase Orders</p>
                  <Button size="sm" variant="outline" onClick={() => setShowOrdersModal(true)}>
                    View All ({supplierOrders.length})
                  </Button>
                </div>
                <div className="space-y-2">
                  {supplierOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{order.poNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">KES {order.total?.toLocaleString()}</p>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', 
                          order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSupplier.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{selectedSupplier.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => sendMessage(selectedSupplier, 'email')}>
                <Mail className="w-4 h-4 mr-1" />
                Send Email
              </Button>
              <Button variant="outline" onClick={() => sendMessage(selectedSupplier, 'whatsapp')}>
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
