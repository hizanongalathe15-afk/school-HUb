import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Heart,
  AlertCircle,
  Pill,
  Droplets,
  Activity,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
  Calendar,
  FileText,
  Upload,
  Download,
  Printer,
  RefreshCw,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Shield,
  Syringe,
  Stethoscope,
  Ambulance,
  Briefcase,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { Modal } from '../../ui/Modal';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface MedicalRecord {
  id: string;
  childId: string;
  bloodGroup: string;
  genotype?: string;
  allergies: Array<{
    id: string;
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction?: string;
    diagnosedDate?: string;
  }>;
  chronicConditions: Array<{
    id: string;
    name: string;
    diagnosedDate: string;
    status: 'active' | 'managed' | 'resolved';
    notes?: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy: string;
  }>;
  emergencyContacts: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
  }>;
  nhifNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  familyDoctor?: {
    name: string;
    phone: string;
    clinic: string;
  };
  immunizationRecords?: Array<{
    vaccine: string;
    date: string;
    administeredBy: string;
    nextDue?: string;
  }>;
}

interface SickBayVisit {
  id: string;
  date: string;
  time: string;
  reason: string;
  symptoms: string[];
  temperature?: number;
  bloodPressure?: string;
  treatment: string;
  medicationGiven: string;
  outcome: 'resolved' | 'referred' | 'monitoring' | 'discharged';
  followUpRequired: boolean;
  followUpDate?: string;
  notes: string;
  treatedBy: string;
  parentNotified: boolean;
}

interface MedicalDocument {
  id: string;
  title: string;
  type: 'prescription' | 'report' | 'consent' | 'certificate' | 'other';
  date: string;
  url: string;
  fileSize: number;
}

const ParentHealth: React.FC = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'medical' | 'sickbay' | 'emergency' | 'documents'>('medical');
  
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [sickBayVisits, setSickBayVisits] = useState<SickBayVisit[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<SickBayVisit | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Form states for adding items
  const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'mild' as const, reaction: '' });
  const [newCondition, setNewCondition] = useState({ name: '', notes: '' });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', prescribedBy: '' });
  const [newEmergency, setNewEmergency] = useState({ name: '', relationship: '', phone: '', isPrimary: false });

  const selectedChild = useMemo(() => 
    children.find(c => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const loadChildren = useCallback(async () => {
    try {
      const response = await parentService.getMyChildren();
      setChildren(response);
      if (response.length > 0 && !selectedChildId) {
        setSelectedChildId(response[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
      toast.error('Failed to load children data');
    }
  }, [selectedChildId]);

  const loadHealthData = useCallback(async (showRefresh = false) => {
    if (!selectedChildId) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (activeTab === 'medical') {
        const data = await parentService.getChildMedicalRecord(selectedChildId);
        setMedicalRecord(data);
      } else if (activeTab === 'sickbay') {
        const data = await parentService.getChildSickBayVisits(selectedChildId);
        setSickBayVisits(data);
      } else if (activeTab === 'documents') {
        const data = await parentService.getChildMedicalDocuments(selectedChildId);
        setDocuments(data);
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
      loadHealthData();
    }
  }, [selectedChildId, activeTab, loadHealthData]);

  const handleRefresh = () => {
    loadHealthData(true);
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.name.trim()) {
      toast.error('Please enter allergy name');
      return;
    }

    try {
      const updatedRecord = await parentService.addChildAllergy(selectedChildId, newAllergy);
      setMedicalRecord(updatedRecord);
      setNewAllergy({ name: '', severity: 'mild', reaction: '' });
      toast.success('Allergy added successfully');
    } catch (err) {
      console.error('Failed to add allergy:', err);
      toast.error('Failed to add allergy');
    }
  };

  const handleRemoveAllergy = async (allergyId: string) => {
    try {
      const updatedRecord = await parentService.removeChildAllergy(selectedChildId, allergyId);
      setMedicalRecord(updatedRecord);
      toast.success('Allergy removed successfully');
    } catch (err) {
      console.error('Failed to remove allergy:', err);
      toast.error('Failed to remove allergy');
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.name.trim()) {
      toast.error('Please enter condition name');
      return;
    }

    try {
      const updatedRecord = await parentService.addChildCondition(selectedChildId, newCondition);
      setMedicalRecord(updatedRecord);
      setNewCondition({ name: '', notes: '' });
      toast.success('Condition added successfully');
    } catch (err) {
      console.error('Failed to add condition:', err);
      toast.error('Failed to add condition');
    }
  };

  const handleRemoveCondition = async (conditionId: string) => {
    try {
      const updatedRecord = await parentService.removeChildCondition(selectedChildId, conditionId);
      setMedicalRecord(updatedRecord);
      toast.success('Condition removed successfully');
    } catch (err) {
      console.error('Failed to remove condition:', err);
      toast.error('Failed to remove condition');
    }
  };

  const handleAddEmergencyContact = async () => {
    if (!newEmergency.name || !newEmergency.relationship || !newEmergency.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const updatedRecord = await parentService.addEmergencyContact(selectedChildId, newEmergency);
      setMedicalRecord(updatedRecord);
      setNewEmergency({ name: '', relationship: '', phone: '', isPrimary: false });
      toast.success('Emergency contact added successfully');
    } catch (err) {
      console.error('Failed to add contact:', err);
      toast.error('Failed to add emergency contact');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      mild: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[severity] || colors.mild;
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      referred: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      discharged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[outcome] || colors.resolved;
  };

  if (children.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Children Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please link a child to view health records.
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
              <Heart className="w-6 h-6 text-red-500" />
              Health & Medical
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage medical records, allergies, and health information
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
            { id: 'medical', label: 'Medical Records', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'sickbay', label: 'Sick Bay Visits', icon: <Activity className="w-4 h-4" /> },
            { id: 'emergency', label: 'Emergency Contacts', icon: <Phone className="w-4 h-4" /> },
            { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
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

        {/* Medical Records Tab */}
        {activeTab === 'medical' && !loading && medicalRecord && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Blood Group</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{medicalRecord.bloodGroup || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Genotype</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{medicalRecord.genotype || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">NHIF Number</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{medicalRecord.nhifNumber || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Insurance Provider</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{medicalRecord.insuranceProvider || 'Not set'}</p>
                </div>
              </div>
            </Card>

            {/* Allergies */}
            <Card title="Allergies">
              <div className="space-y-3">
                {medicalRecord.allergies.map((allergy) => (
                  <div key={allergy.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{allergy.name}</span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getSeverityColor(allergy.severity))}>
                          {allergy.severity}
                        </span>
                      </div>
                      {allergy.reaction && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reaction: {allergy.reaction}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveAllergy(allergy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Input
                  placeholder="Allergy name"
                  value={newAllergy.name}
                  onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
                  size="sm"
                />
                <div className="flex gap-2">
                  <select
                    value={newAllergy.severity}
                    onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <Button size="sm" onClick={handleAddAllergy}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>

            {/* Chronic Conditions */}
            <Card title="Chronic Conditions">
              <div className="space-y-3">
                {medicalRecord.chronicConditions.map((condition) => (
                  <div key={condition.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{condition.name}</span>
                      {condition.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{condition.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCondition(condition.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Condition name"
                  value={newCondition.name}
                  onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                  size="sm"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddCondition}>
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Sick Bay Visits Tab */}
        {activeTab === 'sickbay' && !loading && (
          <div className="space-y-4">
            {sickBayVisits.length === 0 ? (
              <Card className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No sick bay visits recorded</p>
              </Card>
            ) : (
              sickBayVisits.map((visit) => (
                <Card 
                  key={visit.id} 
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => {
                    setSelectedVisit(visit);
                    setShowVisitModal(true);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(visit.date).toLocaleDateString()} at {visit.time}
                        </span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getOutcomeColor(visit.outcome))}>
                          {visit.outcome}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">{visit.reason}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Treated by: {visit.treatedBy}</p>
                    </div>
                    {visit.followUpRequired && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        Follow-up required: {visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString() : 'Schedule pending'}
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === 'emergency' && !loading && medicalRecord && (
          <Card title="Emergency Contacts">
            <div className="space-y-4">
              {medicalRecord.emergencyContacts.map((contact) => (
                <div key={contact.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{contact.name}</p>
                        {contact.isPrimary && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Primary</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.relationship}</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">{contact.phone}</p>
                      {contact.alternatePhone && (
                        <p className="text-sm text-gray-500">Alt: {contact.alternatePhone}</p>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Full Name"
                  value={newEmergency.name}
                  onChange={(e) => setNewEmergency({ ...newEmergency, name: e.target.value })}
                  size="sm"
                />
                <Input
                  placeholder="Relationship"
                  value={newEmergency.relationship}
                  onChange={(e) => setNewEmergency({ ...newEmergency, relationship: e.target.value })}
                  size="sm"
                />
                <Input
                  placeholder="Phone Number"
                  value={newEmergency.phone}
                  onChange={(e) => setNewEmergency({ ...newEmergency, phone: e.target.value })}
                  size="sm"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEmergency.isPrimary}
                    onChange={(e) => setNewEmergency({ ...newEmergency, isPrimary: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Set as primary contact</span>
                </label>
              </div>
              <Button className="mt-3" size="sm" onClick={handleAddEmergencyContact}>
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>
            </div>
          </Card>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && !loading && (
          <Card title="Medical Documents">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No medical documents uploaded</p>
                <Button variant="outline" className="mt-4">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.date} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Sick Bay Visit Details Modal */}
      <Modal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        title="Sick Bay Visit Details"
      >
        {selectedVisit && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{new Date(selectedVisit.date).toLocaleDateString()} at {selectedVisit.time}</span>
              </div>
              <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', getOutcomeColor(selectedVisit.outcome))}>
                {selectedVisit.outcome}
              </span>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Reason for Visit</h4>
              <p className="text-gray-600 dark:text-gray-400">{selectedVisit.reason}</p>
            </div>

            {selectedVisit.symptoms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Symptoms</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedVisit.symptoms.map((symptom, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedVisit.temperature && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Temperature</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedVisit.temperature}°C</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Treatment Given</h4>
              <p className="text-gray-600 dark:text-gray-400">{selectedVisit.treatment}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Medication Given</h4>
              <p className="text-gray-600 dark:text-gray-400">{selectedVisit.medicationGiven}</p>
            </div>

            {selectedVisit.followUpRequired && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-400">Follow-up Required</p>
                {selectedVisit.followUpDate && (
                  <p className="text-sm">Date: {new Date(selectedVisit.followUpDate).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {selectedVisit.notes && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Additional Notes</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedVisit.notes}</p>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Treated by: {selectedVisit.treatedBy}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentHealth;