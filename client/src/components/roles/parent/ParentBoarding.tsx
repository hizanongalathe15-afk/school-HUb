import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Home,
  Utensils,
  Shirt,
  Calendar,
  MapPin,
  LogOut,
  AlertCircle,
  Loader2,
  Edit2,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  User,
  Users,
  DoorOpen,
  Bed,
  Mail,
  Phone,
  WashingMachine,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Calendar as CalendarIcon,
  Building,
  Shield,
  Gift,
  Coffee,
  Apple,
  Soup,
  Cake,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { Modal } from '../../ui/Modal';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

interface DormitoryInfo {
  id: string;
  name: string;
  roomNumber: string;
  bedNumber: string;
  dormMaster: string;
  dormMasterContact?: string;
  rules: string[];
  roommates: Array<{ id: string; name: string; class: string }>;
  facilities?: string[];
}

interface LaundryStatus {
  id: string;
  submittedDate: string;
  status: 'submitted' | 'processing' | 'ready' | 'delivered';
  deliveryDate?: string;
  items: number;
  itemList?: string[];
  notes?: string;
}

interface MealMenu {
  day: string;
  breakfast: string;
  lunch: string;
  supper: string;
  snacks?: string;
  specialDiet?: string;
}

interface LeaveRequest {
  id: string;
  fromDate: string;
  toDate: string;
  reason: 'family-event' | 'medical' | 'emergency' | 'other';
  reasonDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  responseDate?: string;
  notes?: string;
  approvedBy?: string;
}

interface VisitationSlot {
  id: string;
  date: string;
  timeSlot: string;
  available: boolean;
  bookedBy?: string;
}

const ParentBoarding: React.FC = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dormitory' | 'laundry' | 'meals' | 'visitation' | 'leave'>('dormitory');
  
  const [dormitoryInfo, setDormitoryInfo] = useState<DormitoryInfo | null>(null);
  const [laundryStatus, setLaundryStatus] = useState<LaundryStatus[]>([]);
  const [mealMenu, setMealMenu] = useState<MealMenu[]>([]);
  const [visitationSlots, setVisitationSlots] = useState<VisitationSlot[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showVisitationModal, setShowVisitationModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VisitationSlot | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    fromDate: '',
    toDate: '',
    reason: 'family-event' as const,
    reasonDescription: '',
  });

  const selectedChild = useMemo(() => 
    children.find(c => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const loadChildren = useCallback(async () => {
    try {
      const response = await parentService.getMyChildren();
      const boarders = response.filter((c: any) => c.isBoarder);
      setChildren(boarders);
      if (boarders.length > 0 && !selectedChildId) {
        setSelectedChildId(boarders[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      toast.error('Failed to load children data');
    }
  }, [selectedChildId]);

  const loadBoardingData = useCallback(async (showRefresh = false) => {
    if (!selectedChildId) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      switch (activeTab) {
        case 'dormitory':
          const dormData = await parentService.getChildDormitoryInfo(selectedChildId);
          setDormitoryInfo(dormData);
          break;
        case 'laundry':
          const laundryData = await parentService.getChildLaundryStatus(selectedChildId);
          setLaundryStatus(laundryData);
          break;
        case 'meals':
          const menuData = await parentService.getMealMenu(selectedChildId);
          setMealMenu(menuData);
          break;
        case 'visitation':
          const slotsData = await parentService.getVisitationSlots(selectedChildId);
          setVisitationSlots(slotsData);
          break;
        case 'leave':
          const leaveData = await parentService.getChildLeaveRequests(selectedChildId);
          setLeaveRequests(leaveData);
          break;
      }
    } catch (err) {
      setError(`Failed to load ${activeTab} data`);
      console.error(err);
      toast.error(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChildId, activeTab]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadBoardingData();
    }
  }, [selectedChildId, activeTab, loadBoardingData]);

  const handleRefresh = () => {
    loadBoardingData(true);
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate) {
      toast.error('Please select dates');
      return;
    }

    try {
      const newRequest = await parentService.requestLeave(selectedChildId, leaveForm);
      setLeaveRequests(prev => [newRequest, ...prev]);
      setLeaveForm({ fromDate: '', toDate: '', reason: 'family-event', reasonDescription: '' });
      setShowLeaveForm(false);
      toast.success('Leave request submitted successfully');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      toast.error('Failed to submit leave request');
    }
  };

  const handleBookVisitation = async () => {
    if (!selectedSlot) return;

    try {
      await parentService.bookVisitationSlot(selectedChildId, selectedSlot.id);
      toast.success('Visitation slot booked successfully');
      setShowVisitationModal(false);
      setSelectedSlot(null);
      loadBoardingData(true);
    } catch (err) {
      console.error('Failed to book visitation:', err);
      toast.error('Failed to book visitation slot');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      delivered: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      submitted: <Clock className="w-3 h-3" />,
      processing: <Loader2 className="w-3 h-3 animate-spin" />,
      ready: <Check className="w-3 h-3" />,
      delivered: <CheckCircle className="w-3 h-3" />,
    };

    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMealIcon = (mealType: string) => {
    const icons: Record<string, React.ReactNode> = {
      breakfast: <Coffee className="w-4 h-4" />,
      lunch: <Soup className="w-4 h-4" />,
      supper: <Apple className="w-4 h-4" />,
      snacks: <Cake className="w-4 h-4" />,
    };
    return icons[mealType] || <Utensils className="w-4 h-4" />;
  };

  if (children.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Boarding Information Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your child may not be enrolled as a boarder or no boarding information has been set up yet.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" />
              Boarding Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage dormitory, laundry, meals, visitation, and leave requests
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <Card>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.class} ({child.admissionNumber})
                </option>
              ))}
            </select>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'dormitory', label: 'Dormitory', icon: <Home className="w-4 h-4" /> },
            { id: 'laundry', label: 'Laundry', icon: <Shirt className="w-4 h-4" /> },
            { id: 'meals', label: 'Meals', icon: <Utensils className="w-4 h-4" /> },
            { id: 'visitation', label: 'Visitation', icon: <Calendar className="w-4 h-4" /> },
            { id: 'leave', label: 'Leave Requests', icon: <LogOut className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button size="sm" onClick={() => setError(null)} className="ml-auto">
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Dormitory Tab */}
        {activeTab === 'dormitory' && !loading && dormitoryInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dormitory Info */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-500" />
                Dormitory Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dormitory:</span>
                    <span className="text-gray-900 dark:text-white">{dormitoryInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DoorOpen className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Room:</span>
                    <span className="text-gray-900 dark:text-white">{dormitoryInfo.roomNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bed className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Bed:</span>
                    <span className="text-gray-900 dark:text-white">{dormitoryInfo.bedNumber}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dorm Master:</span>
                    <span className="text-gray-900 dark:text-white">{dormitoryInfo.dormMaster}</span>
                  </div>
                  {dormitoryInfo.dormMasterContact && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
                      <span className="text-gray-900 dark:text-white">{dormitoryInfo.dormMasterContact}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Roommates */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Roommates
              </h3>
              {dormitoryInfo.roommates.length > 0 ? (
                <div className="space-y-3">
                  {dormitoryInfo.roommates.map((roommate) => (
                    <div key={roommate.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {roommate.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{roommate.name}</p>
                        <p className="text-xs text-gray-500">{roommate.class}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No roommates assigned</p>
              )}
            </Card>

            {/* Dormitory Rules */}
            <Card className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Dormitory Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dormitoryInfo.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Facilities */}
            {dormitoryInfo.facilities && dormitoryInfo.facilities.length > 0 && (
              <Card className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {dormitoryInfo.facilities.map((facility, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      {facility}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Laundry Tab */}
        {activeTab === 'laundry' && !loading && (
          <div className="space-y-4">
            {laundryStatus.length === 0 ? (
              <Card className="text-center py-12">
                <WashingMachine className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No laundry records found</p>
              </Card>
            ) : (
              laundryStatus.map((laundry) => (
                <Card key={laundry.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(laundry.submittedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        {getStatusBadge(laundry.status)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {laundry.items} item{laundry.items !== 1 ? 's' : ''}
                        </p>
                        {laundry.itemList && laundry.itemList.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Items: {laundry.itemList.join(', ')}
                          </p>
                        )}
                        {laundry.deliveryDate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Expected delivery: {new Date(laundry.deliveryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {laundry.notes && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                        <span className="font-medium">Note:</span> {laundry.notes}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Meals Tab */}
        {activeTab === 'meals' && !loading && (
          <div className="space-y-4">
            {mealMenu.length === 0 ? (
              <Card className="text-center py-12">
                <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No meal menu available</p>
              </Card>
            ) : (
              mealMenu.map((day, idx) => (
                <Card key={idx}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {day.day}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-start gap-2">
                      {getMealIcon('breakfast')}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Breakfast</p>
                        <p className="text-gray-900 dark:text-white">{day.breakfast}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      {getMealIcon('lunch')}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lunch</p>
                        <p className="text-gray-900 dark:text-white">{day.lunch}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      {getMealIcon('supper')}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Supper</p>
                        <p className="text-gray-900 dark:text-white">{day.supper}</p>
                      </div>
                    </div>
                    {day.snacks && (
                      <div className="flex items-start gap-2">
                        {getMealIcon('snacks')}
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Snacks</p>
                          <p className="text-gray-900 dark:text-white">{day.snacks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {day.specialDiet && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        <Bell className="w-3 h-3 inline mr-1" />
                        Special Diet: {day.specialDiet}
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Visitation Tab */}
        {activeTab === 'visitation' && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visiting Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Days:</span>
                    <span>Sundays & Public Holidays</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Hours:</span>
                    <span>10:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Location:</span>
                    <span>Main Hall (Ground Floor)</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Important Rules</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>Valid ID required for all visitors</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>No outside food or beverages</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>No electronic devices without permission</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>Visits must be supervised by dorm staff</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Available Slots */}
            {visitationSlots.length > 0 && (
              <Card title="Available Visitation Slots">
                <div className="space-y-2">
                  {visitationSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(slot.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{slot.timeSlot}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowVisitationModal(true);
                        }}
                        disabled={!slot.available}
                      >
                        Book Slot
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === 'leave' && !loading && (
          <div className="space-y-6">
            {!showLeaveForm && (
              <Button onClick={() => setShowLeaveForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Request Leave
              </Button>
            )}

            {showLeaveForm && (
              <Card title="Request Leave">
                <form onSubmit={handleRequestLeave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From Date *
                      </label>
                      <input
                        type="date"
                        value={leaveForm.fromDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        To Date *
                      </label>
                      <input
                        type="date"
                        value={leaveForm.toDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason *
                    </label>
                    <select
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="family-event">Family Event</option>
                      <option value="medical">Medical</option>
                      <option value="emergency">Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {leaveForm.reason === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={leaveForm.reasonDescription}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reasonDescription: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Please provide details..."
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="submit">Submit Request</Button>
                    <Button type="button" variant="outline" onClick={() => setShowLeaveForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <Card title="Leave Request History">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No leave requests yet
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          Reason: {request.reason.replace('-', ' ')}
                        </p>
                        {request.reasonDescription && (
                          <p className="text-sm text-gray-500 mt-1">{request.reasonDescription}</p>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-0">
                        {getStatusBadge(request.status)}
                        {request.notes && (
                          <p className="text-xs text-gray-500 mt-1 max-w-sm">{request.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Visitation Booking Modal */}
      <Modal
        isOpen={showVisitationModal}
        onClose={() => setShowVisitationModal(false)}
        title="Book Visitation Slot"
      >
        {selectedSlot && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(selectedSlot.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSlot.timeSlot}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please arrive on time for your scheduled visitation. Late arrivals may not be accommodated.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleBookVisitation}>Confirm Booking</Button>
              <Button variant="outline" onClick={() => setShowVisitationModal(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentBoarding;