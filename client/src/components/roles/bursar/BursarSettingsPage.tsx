import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { Settings, PaymentMethod, NotificationPreferences } from '../../../types/bursar';

const BursarSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'notifications'>('general');
  const [formData, setFormData] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'general' | 'payment' | 'notification'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, paymentRes, notificationRes] = await Promise.all([
        bursarService.settings.getSettings(),
        bursarService.settings.getPaymentMethods(),
        bursarService.settings.getNotificationPreferences(),
      ]);
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
        setFormData(settingsRes.data);
      }
      if (paymentRes.success && paymentRes.data) {
        setPaymentMethods(paymentRes.data);
      }
      if (notificationRes.success && notificationRes.data) {
        setNotificationPreferences(notificationRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (modalType === 'general') {
        response = await bursarService.settings.updateSettings(formData);
      } else if (modalType === 'payment') {
        response = await bursarService.settings.updatePaymentMethods(formData);
      } else if (modalType === 'notification') {
        response = await bursarService.settings.updateNotificationPreferences(formData);
      }
      if (response.success) {
        toast.success(response.message || 'Settings saved successfully');
        setModalOpen(false);
        if (modalType === 'general') {
          fetchSettings();
        } else if (modalType === 'payment') {
          bursarService.settings.getPaymentMethods().then((res) => {
            if (res.success && res.data) {
              setPaymentMethods(res.data);
            }
          });
        } else if (modalType === 'notification') {
          bursarService.settings.getNotificationPreferences().then((res) => {
            if (res.success && res.data) {
              setNotificationPreferences(res.data);
            }
          });
        }
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === methodId ? { ...method, isActive: !method.isActive } : method
      )
    );
  };

  const handleToggleNotification = (type: string) => {
    setNotificationPreferences((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [type]: !prev[type as keyof NotificationPreferences],
      };
    });
  };

  const resetForm = () => {
    if (settings) {
      setFormData({ ...settings });
    } else {
      setFormData({});
    }
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Bursar Settings</h1>
        <p className="text-amber-600">Configure your bursar office preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex border-b border-amber-100">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 text-left font-medium ${activeTab === 'general' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-700'}`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-4 py-3 text-left font-medium ${activeTab === 'payments' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-4 py-3 text-left font-medium ${activeTab === 'notifications' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Notification Preferences
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'general' && (
            <>
              <h2 className="text-lg font-semibold text-amber-800 mb-4">General Settings</h2>
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Office Name
                    </label>
                    <input
                      type="text"
                      value={formData.officeName || ''}
                      onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Fiscal Year Start
                    </label>
                    <input
                      type="month"
                      value={formData.fiscalYearStart || ''}
                      onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Default Currency
                    </label>
                    <select
                      value={formData.defaultCurrency || 'KES'}
                      onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="KES">KES (Kenyan Shilling)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Bank Charges Account
                    </label>
                    <input
                      type="text"
                      value={formData.bankChargesAccount || ''}
                      onChange={(e) => setFormData({ ...formData, bankChargesAccount: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Enter account code for bank charges"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Enable Multi-User Approval
                    </label>
                    <select
                      value={formData.enableMultiUserApproval ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, enableMultiUserApproval: e.target.value === 'true' })}
                      className="px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Approval Threshold (KES)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.approvalThreshold || 0}
                      onChange={(e) => setFormData({ ...formData, approvalThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setModalOpen(false);
                    }}
                    className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                    disabled={loading}
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </>
          )}
          {activeTab === 'payments' && (
            <>
              <h2 className="text-lg font-semibold text-amber-800 mb-4">Payment Methods</h2>
              <p className="text-sm text-amber-600 mb-4">
                Configure which payment methods are accepted for school transactions
              </p>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 flex items-center justify-center rounded-full ${method.isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
                          {method.isActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-amber-800">{method.name}</h3>
                        <p className="text-sm text-amber-600">{method.description || 'No description'}</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.isActive}
                        onChange={() => handleTogglePaymentMethod(method.id)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <span className="ml-2 text-amber-700">Enable</span>
                    </label>
                  </div>
                ))}
                {paymentMethods.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-amber-500">No payment methods configured</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('payment');
                    setModalOpen(true);
                  }}
                  className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  Save Payment Methods
                </button>
              </div>
            </>
          )}
          {activeTab === 'notifications' && (
            <>
              <h2 className="text-lg font-semibold text-amber-800 mb-4">Notification Preferences</h2>
              <p className="text-sm text-amber-600 mb-4">
                Choose which notifications you want to receive
              </p>
              {notificationPreferences ? (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M6 18h12a3 3 0 003-3V9" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">Fee Reminders</h3>
                      <p className="text-sm text-amber-600">Receive notifications when student fees are due or overdue</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.feeReminders ?? true}
                        onChange={() => handleToggleNotification('feeReminders')}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <span className="ml-2 text-amber-700">Enable</span>
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M6 18h12a3 3 0 003-3V9" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">Payment Alerts</h3>
                      <p className="text-sm text-amber-600">Receive notifications when payments are received or failed</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.paymentAlerts ?? true}
                        onChange={() => handleToggleNotification('paymentAlerts')}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <span className="ml-2 text-amber-700">Enable</span>
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M6 18h12a3 3 0 003-3V9" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">Budget Alerts</h3>
                      <p className="text-sm text-amber-600">Receive notifications when department budgets exceed thresholds</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.budgetAlerts ?? true}
                        onChange={() => handleToggleNotification('budgetAlerts')}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <span className="ml-2 text-amber-700">Enable</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-amber-500">No notification preferences found</p>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('notification');
                    setModalOpen(true);
                  }}
                  className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  Save Notification Preferences
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BursarSettingsPage;