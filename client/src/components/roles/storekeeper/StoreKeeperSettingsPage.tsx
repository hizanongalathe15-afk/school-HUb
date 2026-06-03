// client/src/components/roles/storekeeper/StoreKeeperSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCcw, Bell, Shield, Clock, DollarSign, Users,
  Package, MapPin, Tag, AlertTriangle, Calendar, Percent,
  CreditCard, Building2, FileText, Mail, Phone, MessageCircle,
  Printer, Eye, Edit, Trash2, Plus, X, Check, Settings as SettingsIcon,
  ToggleLeft, ToggleRight, Sliders, Globe, Lock, UserCheck,
  Database, Archive, Filter, Download, Upload, Sun, Moon,
  Languages, BellRing, MessageSquare, Smartphone, Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';

interface StoreSettings {
  // Stock Settings
  defaultReorderLevel: number;
  defaultReorderPercentage: number;
  defaultMaxStockLevel: number;
  autoReorderSuggestions: boolean;
  
  // Return Settings
  defaultReturnPeriod: number; // days
  returnPeriodUnit: 'days' | 'weeks' | 'months';
  lateFeeType: 'percentage' | 'fixed';
  lateFeeValue: number;
  lateFeeCap: number;
  maxLateFeePercent: number;
  
  // Borrowing Limits
  maxItemsPerTeacher: number;
  maxItemsPerStudent: number;
  maxItemsPerStaff: number;
  maxBorrowDays: number;
  allowRenewals: boolean;
  maxRenewals: number;
  
  // Approval Workflow
  approvalRequired: boolean;
  autoApproveLowValue: boolean;
  autoApproveThreshold: number;
  principalApprovalRequired: boolean;
  principalApprovalThreshold: number;
  managerApprovalRoles: string[];
  
  // Notification Settings
  emailAlerts: boolean;
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  lowStockAlertThreshold: number;
  expiringAlertDays: number;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  alertRecipients: string[];
  
  // Display Settings
  language: 'en' | 'sw' | 'fr';
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  itemsPerPage: number;
  defaultView: 'table' | 'card';
  
  // Receipt Settings
  receiptHeader: string;
  receiptFooter: string;
  showLogo: boolean;
  receiptPrinter: 'default' | 'thermal' | 'a4';
  printCopies: number;
  
  // System Settings
  enableBarcode: boolean;
  enableBatchTracking: boolean;
  enableSerialTracking: boolean;
  enableExpiryTracking: boolean;
  stockTakeFrequency: 'monthly' | 'quarterly' | 'termly' | 'annually';
  autoArchiveOldItems: boolean;
  archiveAfterDays: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  color: string;
}

interface StorageLocation {
  id: string;
  name: string;
  building: string;
  room: string;
  shelf: string;
  capacity: number;
  currentOccupancy: number;
  description: string;
}

const defaultSettings: StoreSettings = {
  defaultReorderLevel: 10,
  defaultReorderPercentage: 20,
  defaultMaxStockLevel: 100,
  autoReorderSuggestions: false,
  defaultReturnPeriod: 14,
  returnPeriodUnit: 'days',
  lateFeeType: 'percentage',
  lateFeeValue: 1,
  lateFeeCap: 5000,
  maxLateFeePercent: 50,
  maxItemsPerTeacher: 20,
  maxItemsPerStudent: 5,
  maxItemsPerStaff: 15,
  maxBorrowDays: 30,
  allowRenewals: true,
  maxRenewals: 2,
  approvalRequired: true,
  autoApproveLowValue: true,
  autoApproveThreshold: 5000,
  principalApprovalRequired: true,
  principalApprovalThreshold: 50000,
  managerApprovalRoles: ['head_of_department', 'principal'],
  emailAlerts: true,
  smsAlerts: false,
  whatsappAlerts: false,
  lowStockAlertThreshold: 20,
  expiringAlertDays: 30,
  dailyDigest: true,
  weeklyDigest: false,
  alertRecipients: ['storekeeper@school.com'],
  language: 'en',
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  itemsPerPage: 50,
  defaultView: 'table',
  receiptHeader: 'SCHOOL STORE',
  receiptFooter: 'Thank you for your cooperation',
  showLogo: true,
  receiptPrinter: 'thermal',
  printCopies: 1,
  enableBarcode: true,
  enableBatchTracking: true,
  enableSerialTracking: false,
  enableExpiryTracking: true,
  stockTakeFrequency: 'monthly',
  autoArchiveOldItems: true,
  archiveAfterDays: 365,
};

const colorOptions = [
  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800', 'bg-orange-100 text-orange-800', 'bg-teal-100 text-teal-800'
];

export default function StoreKeeperSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'locations' | 'returns' | 'notifications' | 'approvals'>('general');
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: colorOptions[0] });
  const [locationForm, setLocationForm] = useState({
    name: '', building: '', room: '', shelf: '', capacity: 100, description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, categoriesRes, locationsRes] = await Promise.all([
        storeKeeperService.settings.getSettings(),
        storeKeeperService.categories.getCategories(),
        storeKeeperService.locations.getLocations()
      ]);
      if (settingsRes.data) setSettings({ ...defaultSettings, ...settingsRes.data });
      setCategories(categoriesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await storeKeeperService.settings.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      if (editingCategory) {
        await storeKeeperService.settings.updateCategory(editingCategory.id, categoryForm);
        toast.success('Category updated');
      } else {
        await storeKeeperService.settings.createCategory(categoryForm);
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: colorOptions[0] });
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Failed to save category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) return;
    try {
      await storeKeeperService.settings.deleteCategory(id);
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  const saveLocation = async () => {
    if (!locationForm.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    try {
      if (editingLocation) {
        await storeKeeperService.settings.updateLocation(editingLocation.id, locationForm);
        toast.success('Location updated');
      } else {
        await storeKeeperService.settings.createLocation(locationForm);
        toast.success('Location created');
      }
      setShowLocationModal(false);
      setEditingLocation(null);
      setLocationForm({ name: '', building: '', room: '', shelf: '', capacity: 100, description: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save location:', error);
      toast.error('Failed to save location');
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? Items will need to be reassigned.')) return;
    try {
      await storeKeeperService.settings.deleteLocation(id);
      toast.success('Location deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Failed to delete location');
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {/* Stock Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          Stock Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Reorder Level (Quantity)</label>
            <input
              type="number"
              value={settings.defaultReorderLevel}
              onChange={(e) => setSettings({ ...settings, defaultReorderLevel: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Reorder Percentage (%)</label>
            <input
              type="number"
              value={settings.defaultReorderPercentage}
              onChange={(e) => setSettings({ ...settings, defaultReorderPercentage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Max Stock Level</label>
            <input
              type="number"
              value={settings.defaultMaxStockLevel}
              onChange={(e) => setSettings({ ...settings, defaultMaxStockLevel: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Auto Reorder Suggestions</label>
              <p className="text-xs text-gray-500">Automatically generate PO suggestions</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoReorderSuggestions: !settings.autoReorderSuggestions })}
              className={clsx('w-12 h-6 rounded-full transition', settings.autoReorderSuggestions ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.autoReorderSuggestions && 'translate-x-6')} />
            </button>
          </div>
        </div>
      </div>

      {/* Borrowing Limits */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          Borrowing Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Items per Teacher</label>
            <input
              type="number"
              value={settings.maxItemsPerTeacher}
              onChange={(e) => setSettings({ ...settings, maxItemsPerTeacher: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Items per Student</label>
            <input
              type="number"
              value={settings.maxItemsPerStudent}
              onChange={(e) => setSettings({ ...settings, maxItemsPerStudent: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Items per Staff</label>
            <input
              type="number"
              value={settings.maxItemsPerStaff}
              onChange={(e) => setSettings({ ...settings, maxItemsPerStaff: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Borrow Days</label>
            <input
              type="number"
              value={settings.maxBorrowDays}
              onChange={(e) => setSettings({ ...settings, maxBorrowDays: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Allow Renewals</label>
              <p className="text-xs text-gray-500">Allow items to be renewed</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowRenewals: !settings.allowRenewals })}
              className={clsx('w-12 h-6 rounded-full transition', settings.allowRenewals ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.allowRenewals && 'translate-x-6')} />
            </button>
          </div>
          {settings.allowRenewals && (
            <div>
              <label className="block text-sm font-medium mb-1">Max Renewals</label>
              <input
                type="number"
                value={settings.maxRenewals}
                onChange={(e) => setSettings({ ...settings, maxRenewals: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Display Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-purple-500" />
          Display Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Items Per Page</label>
            <select
              value={settings.itemsPerPage}
              onChange={(e) => setSettings({ ...settings, itemsPerPage: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipt Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-orange-500" />
          Receipt Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Receipt Header</label>
            <input
              type="text"
              value={settings.receiptHeader}
              onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Receipt Footer</label>
            <input
              type="text"
              value={settings.receiptFooter}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Printer Type</label>
            <select
              value={settings.receiptPrinter}
              onChange={(e) => setSettings({ ...settings, receiptPrinter: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="default">Default Printer</option>
              <option value="thermal">Thermal Printer</option>
              <option value="a4">A4 Printer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Print Copies</label>
            <input
              type="number"
              min={1}
              max={5}
              value={settings.printCopies}
              onChange={(e) => setSettings({ ...settings, printCopies: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* System Features */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-500" />
          System Features
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Enable Barcode System</span>
              <p className="text-xs text-gray-500">Generate and scan barcodes for items</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableBarcode: !settings.enableBarcode })}
              className={clsx('w-12 h-6 rounded-full transition', settings.enableBarcode ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.enableBarcode && 'translate-x-6')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Enable Batch Number Tracking</span>
              <p className="text-xs text-gray-500">Track items by batch numbers</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableBatchTracking: !settings.enableBatchTracking })}
              className={clsx('w-12 h-6 rounded-full transition', settings.enableBatchTracking ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.enableBatchTracking && 'translate-x-6')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Enable Serial Number Tracking</span>
              <p className="text-xs text-gray-500">Track electronics and high-value items</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableSerialTracking: !settings.enableSerialTracking })}
              className={clsx('w-12 h-6 rounded-full transition', settings.enableSerialTracking ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.enableSerialTracking && 'translate-x-6')} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock Take Frequency</label>
            <select
              value={settings.stockTakeFrequency}
              onChange={(e) => setSettings({ ...settings, stockTakeFrequency: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="termly">Termly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stock Categories</h3>
        <Button size="sm" onClick={() => {
          setEditingCategory(null);
          setCategoryForm({ name: '', description: '', color: colorOptions[0] });
          setShowCategoryModal(true);
        }}>
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-md transition">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={clsx('w-3 h-3 rounded-full', category.color.split(' ')[0])} />
                  <h4 className="font-semibold">{category.name}</h4>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryForm({ name: category.name, description: category.description, color: category.color });
                      setShowCategoryModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{category.description || 'No description'}</p>
              <p className="text-xs text-gray-400 mt-2">{category.itemCount || 0} items</p>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="text-center py-8">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No categories created yet</p>
          <Button className="mt-4" onClick={() => setShowCategoryModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create First Category
          </Button>
        </Card>
      )}
    </div>
  );

  const renderLocationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Storage Locations</h3>
        <Button size="sm" onClick={() => {
          setEditingLocation(null);
          setLocationForm({ name: '', building: '', room: '', shelf: '', capacity: 100, description: '' });
          setShowLocationModal(true);
        }}>
          <Plus className="w-4 h-4 mr-1" />
          Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map(location => (
          <Card key={location.id}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{location.name}</h4>
                  <p className="text-sm text-gray-500">
                    {location.building} - Room {location.room} - Shelf {location.shelf}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingLocation(location);
                      setLocationForm({
                        name: location.name,
                        building: location.building,
                        room: location.room,
                        shelf: location.shelf,
                        capacity: location.capacity,
                        description: location.description
                      });
                      setShowLocationModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span>Capacity: {location.currentOccupancy || 0}/{location.capacity}</span>
                  <span>{Math.round(((location.currentOccupancy || 0) / location.capacity) * 100)}% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={clsx('h-2 rounded-full', ((location.currentOccupancy || 0) / location.capacity) > 0.8 ? 'bg-red-500' : 'bg-green-500')}
                    style={{ width: `${Math.min(((location.currentOccupancy || 0) / location.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {location.description && (
                <p className="text-xs text-gray-500 mt-2">{location.description}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <Card className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No storage locations configured</p>
          <Button className="mt-4" onClick={() => setShowLocationModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add First Location
          </Button>
        </Card>
      )}
    </div>
  );

  const renderReturnsSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-500" />
        Return & Late Fee Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Default Return Period</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={settings.defaultReturnPeriod}
              onChange={(e) => setSettings({ ...settings, defaultReturnPeriod: parseInt(e.target.value) || 0 })}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <select
              value={settings.returnPeriodUnit}
              onChange={(e) => setSettings({ ...settings, returnPeriodUnit: e.target.value as any })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Late Fee Type</label>
          <select
            value={settings.lateFeeType}
            onChange={(e) => setSettings({ ...settings, lateFeeType: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="percentage">Percentage of Item Value</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {settings.lateFeeType === 'percentage' ? 'Late Fee Percentage (%)' : 'Late Fee Amount (KES)'}
          </label>
          <input
            type="number"
            value={settings.lateFeeValue}
            onChange={(e) => setSettings({ ...settings, lateFeeValue: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {settings.lateFeeType === 'percentage' && (
            <p className="text-xs text-gray-500">Applied per day overdue</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Maximum Late Fee Cap (KES)</label>
          <input
            type="number"
            value={settings.lateFeeCap}
            onChange={(e) => setSettings({ ...settings, lateFeeCap: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Maximum Late Fee (% of Item Value)</label>
          <input
            type="number"
            value={settings.maxLateFeePercent}
            onChange={(e) => setSettings({ ...settings, maxLateFeePercent: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-500">Stop charging after this percentage</p>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="w-5 h-5 text-yellow-500" />
        Notification Settings
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Email Alerts</span>
            <p className="text-xs text-gray-500">Receive email notifications</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
            className={clsx('w-12 h-6 rounded-full transition', settings.emailAlerts ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.emailAlerts && 'translate-x-6')} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">SMS Alerts</span>
            <p className="text-xs text-gray-500">Receive SMS notifications</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, smsAlerts: !settings.smsAlerts })}
            className={clsx('w-12 h-6 rounded-full transition', settings.smsAlerts ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.smsAlerts && 'translate-x-6')} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">WhatsApp Alerts</span>
            <p className="text-xs text-gray-500">Receive WhatsApp notifications</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, whatsappAlerts: !settings.whatsappAlerts })}
            className={clsx('w-12 h-6 rounded-full transition', settings.whatsappAlerts ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.whatsappAlerts && 'translate-x-6')} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Alert Threshold (%)</label>
            <input
              type="number"
              value={settings.lowStockAlertThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockAlertThreshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiring Alert Days</label>
            <input
              type="number"
              value={settings.expiringAlertDays}
              onChange={(e) => setSettings({ ...settings, expiringAlertDays: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Daily Digest</span>
            <p className="text-xs text-gray-500">Receive daily summary report</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, dailyDigest: !settings.dailyDigest })}
            className={clsx('w-12 h-6 rounded-full transition', settings.dailyDigest ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.dailyDigest && 'translate-x-6')} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alert Recipients (Emails)</label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value && !settings.alertRecipients.includes(input.value)) {
                    setSettings({ ...settings, alertRecipients: [...settings.alertRecipients, input.value] });
                    input.value = '';
                  }
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {settings.alertRecipients.map(email => (
              <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {email}
                <button onClick={() => setSettings({ ...settings, alertRecipients: settings.alertRecipients.filter(e => e !== email) })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovalsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5 text-red-500" />
        Approval Workflow
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Require Approval for Requests</span>
            <p className="text-xs text-gray-500">All requests need approval before issuing</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, approvalRequired: !settings.approvalRequired })}
            className={clsx('w-12 h-6 rounded-full transition', settings.approvalRequired ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.approvalRequired && 'translate-x-6')} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Auto-Approve Low Value Requests</span>
            <p className="text-xs text-gray-500">Automatically approve requests below threshold</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, autoApproveLowValue: !settings.autoApproveLowValue })}
            className={clsx('w-12 h-6 rounded-full transition', settings.autoApproveLowValue ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.autoApproveLowValue && 'translate-x-6')} />
          </button>
        </div>

        {settings.autoApproveLowValue && (
          <div>
            <label className="block text-sm font-medium mb-1">Auto-Approve Threshold (KES)</label>
            <input
              type="number"
              value={settings.autoApproveThreshold}
              onChange={(e) => setSettings({ ...settings, autoApproveThreshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Requests below this amount are auto-approved</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Principal Approval Required</span>
            <p className="text-xs text-gray-500">High-value requests need principal approval</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, principalApprovalRequired: !settings.principalApprovalRequired })}
            className={clsx('w-12 h-6 rounded-full transition', settings.principalApprovalRequired ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={clsx('w-5 h-5 bg-white rounded-full transition-transform', settings.principalApprovalRequired && 'translate-x-6')} />
          </button>
        </div>

        {settings.principalApprovalRequired && (
          <div>
            <label className="block text-sm font-medium mb-1">Principal Approval Threshold (KES)</label>
            <input
              type="number"
              value={settings.principalApprovalThreshold}
              onChange={(e) => setSettings({ ...settings, principalApprovalThreshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Requests above this amount need principal approval</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            Store Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure store preferences, categories, locations, and system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-2 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: <SettingsIcon className="w-4 h-4" /> },
            { id: 'categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
            { id: 'locations', label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
            { id: 'returns', label: 'Returns & Fees', icon: <Clock className="w-4 h-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
            { id: 'approvals', label: 'Approvals', icon: <Shield className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition border-b-2',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'locations' && renderLocationsTab()}
        {activeTab === 'returns' && renderReturnsSettings()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'approvals' && renderApprovalsTab()}
      </div>

      {/* Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Stationery, Textbooks, Uniforms"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Category description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color Theme</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setCategoryForm({ ...categoryForm, color })}
                  className={clsx('w-8 h-8 rounded-full transition', color.split(' ')[0], categoryForm.color === color && 'ring-2 ring-offset-2 ring-blue-500')}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
          <Button onClick={saveCategory}>{editingCategory ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      {/* Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title={editingLocation ? 'Edit Location' : 'Add Location'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location Name</label>
            <input
              type="text"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Main Store, Lab Store, Sports Store"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Building</label>
              <input
                type="text"
                value={locationForm.building}
                onChange={(e) => setLocationForm({ ...locationForm, building: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Main Building"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                value={locationForm.room}
                onChange={(e) => setLocationForm({ ...locationForm, room: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Room 101"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shelf/Rack</label>
              <input
                type="text"
                value={locationForm.shelf}
                onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Shelf A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (Items)</label>
              <input
                type="number"
                value={locationForm.capacity}
                onChange={(e) => setLocationForm({ ...locationForm, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={locationForm.description}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Additional notes about this location..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowLocationModal(false)}>Cancel</Button>
          <Button onClick={saveLocation}>{editingLocation ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}