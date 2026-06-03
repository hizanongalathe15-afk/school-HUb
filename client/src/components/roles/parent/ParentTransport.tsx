import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  User,
  Phone,
  AlertTriangle,
  Loader2,
  Navigation,
  AlertCircle,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';

interface BusRoute {
  id: string;
  routeNumber: string;
  pickupPoint: string;
  pickupTime: string;
  dropoffPoint: string;
  dropoffTime: string;
  driverName: string;
  driverPhone: string;
  attendantName?: string;
  attendantPhone?: string;
  latitude?: number;
  longitude?: number;
  currentLat?: number;
  currentLng?: number;
  status: 'on-route' | 'arrived' | 'delayed' | 'maintenance';
  estimatedArrival?: string;
}

interface TransportFee {
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

interface BusIssue {
  id: string;
  date: string;
  type: 'delay' | 'breakdown' | 'misconduct' | 'lost-item';
  description: string;
  status: 'reported' | 'investigating' | 'resolved';
  resolution?: string;
}

const ParentTransport: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'route' | 'tracking' | 'fees' | 'issues'>('route');
  
  const [busRoute, setBusRoute] = useState<BusRoute | null>(null);
  const [transportFee, setTransportFee] = useState<TransportFee | null>(null);
  const [busIssues, setBusIssues] = useState<BusIssue[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportIssueForm, setReportIssueForm] = useState({
    type: 'delay' as const,
    description: '',
  });
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Load children
  useEffect(() => {
    const loadChildren = async () => {
      try {
        const response = await parentService.getMyChildren();
        setChildren(response.filter((c: any) => c.transportMode === 'bus'));
        if (response.length > 0) {
          setSelectedChild(response[0].id);
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      }
    };
    loadChildren();
  }, []);

  // Load transport data
  useEffect(() => {
    if (!selectedChild) return;
    
    const loadTransportData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'route' || activeTab === 'tracking') {
          const data = await parentService.getChildBusRoute(selectedChild);
          setBusRoute(data);
        } else if (activeTab === 'fees') {
          const data = await parentService.getChildTransportFee(selectedChild);
          setTransportFee(data);
        } else if (activeTab === 'issues') {
          const data = await parentService.getChildBusIssues(selectedChild);
          setBusIssues(data);
        }
      } catch (err) {
        setError(`Failed to load ${activeTab} data`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTransportData();
  }, [selectedChild, activeTab]);

  // Refresh tracking data every 30 seconds
  useEffect(() => {
    if (activeTab !== 'tracking' || !selectedChild) return;

    const interval = setInterval(() => {
      loadTransportData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChild, activeTab]);

  const loadTransportData = async () => {
    try {
      const data = await parentService.getChildBusRoute(selectedChild);
      setBusRoute(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIssue(true);
    try {
      const newIssue = await parentService.reportBusIssue(selectedChild, {
        type: reportIssueForm.type,
        description: reportIssueForm.description,
      });
      setBusIssues([...busIssues, newIssue]);
      setReportIssueForm({ type: 'delay', description: '' });
      alert('Issue reported successfully');
    } catch (err) {
      setError('Failed to report issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'on-route': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'arrived': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'delayed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getIssueStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'reported': 'text-blue-600 dark:text-blue-400',
      'investigating': 'text-yellow-600 dark:text-yellow-400',
      'resolved': 'text-green-600 dark:text-green-400',
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transport Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage bus routes, real-time tracking, and transport issues</p>
        </div>

        {/* Child Selector */}
        {children.length > 0 ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Child
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.class}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400">
            No children with bus transport found
          </div>
        )}

        {children.length > 0 && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab('route')}
                className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'route'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <MapPin className="inline mr-2 w-4 h-4" />
                Bus Route
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tracking'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <Navigation className="inline mr-2 w-4 h-4" />
                Live Tracking
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'fees'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <DollarSign className="inline mr-2 w-4 h-4" />
                Fees
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'issues'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <AlertTriangle className="inline mr-2 w-4 h-4" />
                Issues
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {/* Bus Route Tab */}
            {activeTab === 'route' && !loading && busRoute && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Route Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Route Number</label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{busRoute.routeNumber}</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          <MapPin className="w-4 h-4" />
                          Pickup Point
                        </label>
                        <p className="text-gray-700 dark:text-gray-300">{busRoute.pickupPoint}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {busRoute.pickupTime}
                        </p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          <MapPin className="w-4 h-4" />
                          Dropoff Point
                        </label>
                        <p className="text-gray-700 dark:text-gray-300">{busRoute.dropoffPoint}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {busRoute.dropoffTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Driver Information</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">{busRoute.driverName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${busRoute.driverPhone}`}>{busRoute.driverPhone}</a>
                        </div>
                      </div>
                      {busRoute.attendantName && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">Attendant: {busRoute.attendantName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${busRoute.attendantPhone}`}>{busRoute.attendantPhone}</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Tracking Tab */}
            {activeTab === 'tracking' && !loading && busRoute && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <div className={`inline-block px-4 py-2 rounded-full font-semibold ${getStatusColor(busRoute.status)}`}>
                    {busRoute.status === 'on-route' && 'On Route'}
                    {busRoute.status === 'arrived' && 'Arrived'}
                    {busRoute.status === 'delayed' && 'Delayed'}
                    {busRoute.status === 'maintenance' && 'Maintenance'}
                  </div>
                </div>

                {busRoute.status === 'on-route' && busRoute.estimatedArrival && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Arrival:</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{busRoute.estimatedArrival}</p>
                  </div>
                )}

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Coordinates:</p>
                  <p className="font-mono text-gray-900 dark:text-white">
                    {busRoute.currentLat}, {busRoute.currentLng}
                  </p>
                  <button className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">
                    Open in Maps
                  </button>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Real-time tracking active</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data updates every 30 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fees Tab */}
            {activeTab === 'fees' && !loading && transportFee && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Fee</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">KES {transportFee.amount.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Amount Paid</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">KES {transportFee.paidAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Outstanding</h3>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">KES {transportFee.outstanding.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Due: {new Date(transportFee.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && !loading && (
              <div className="space-y-6">
                {/* Report Issue Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report an Issue</h3>
                  <form onSubmit={handleReportIssue} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Issue Type
                      </label>
                      <select
                        value={reportIssueForm.type}
                        onChange={(e) =>
                          setReportIssueForm({ ...reportIssueForm, type: e.target.value as any })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="delay">Bus Delay</option>
                        <option value="breakdown">Bus Breakdown</option>
                        <option value="misconduct">Misconduct on Bus</option>
                        <option value="lost-item">Lost Item</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={reportIssueForm.description}
                        onChange={(e) =>
                          setReportIssueForm({ ...reportIssueForm, description: e.target.value })
                        }
                        placeholder="Describe the issue..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingIssue}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {submittingIssue ? 'Submitting...' : 'Submit Issue'}
                    </button>
                  </form>
                </div>

                {/* Issue History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Issue History</h3>
                  {busIssues.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No issues reported
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {busIssues.map((issue) => (
                        <div key={issue.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(issue.date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`font-semibold text-sm capitalize ${getIssueStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">{issue.description}</p>
                          {issue.resolution && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                              <p className="font-medium mb-1">Resolution:</p>
                              <p>{issue.resolution}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentTransport;
