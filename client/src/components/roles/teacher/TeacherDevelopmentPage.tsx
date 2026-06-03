// client/src/components/roles/teacher/TeacherDevelopmentPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase, GraduationCap, Clock, Star, Award, Calendar,
  FileText, Download, Eye, Upload, Plus, Search, Filter,
  RefreshCw, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Target, BookOpen, Video, Users, MapPin, Link, ExternalLink,
  ChevronDown, ChevronUp, MoreVertical, Edit, Trash2,
  MessageCircle, Mail, Phone, UserCheck, Shield, Gift, Sparkles
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { teacherService } from '../../../services/teacherService';

interface TrainingOpportunity {
  id: string;
  title: string;
  provider: string;
  type: 'workshop' | 'seminar' | 'conference' | 'webinar' | 'course';
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  mode: 'online' | 'in-person' | 'hybrid';
  cost: number;
  capacity: number;
  registeredCount: number;
  deadline: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  certificateProvided: boolean;
  cpdHours: number;
  tags: string[];
  instructor: string;
  requirements: string[];
}

interface CPDRecord {
  id: string;
  activityId: string;
  activityTitle: string;
  date: string;
  hours: number;
  category: string;
  provider: string;
  certificateUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  verifiedBy?: string;
}

interface PerformanceReview {
  id: string;
  period: string;
  reviewer: string;
  reviewerRole: string;
  date: string;
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
  goals: string[];
  comments: string;
  status: 'pending' | 'completed' | 'cancelled';
  nextReviewDate: string;
}

interface SelfAssessment {
  id: string;
  period: string;
  selfRating: number;
  achievements: string[];
  challenges: string[];
  professionalGoals: string[];
  trainingNeeds: string[];
  submittedAt: string;
  status: 'draft' | 'submitted';
}

interface ProfessionalGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  category: 'teaching' | 'leadership' | 'technology' | 'research' | 'personal';
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl: string;
  thumbnailUrl?: string;
  cpdPoints: number;
}

const trainingTypeConfig = {
  workshop: { label: 'Workshop', color: 'bg-blue-100 text-blue-800', icon: <Users className="w-3 h-3" /> },
  seminar: { label: 'Seminar', color: 'bg-green-100 text-green-800', icon: <Users className="w-3 h-3" /> },
  conference: { label: 'Conference', color: 'bg-purple-100 text-purple-800', icon: <Users className="w-3 h-3" /> },
  webinar: { label: 'Webinar', color: 'bg-orange-100 text-orange-800', icon: <Video className="w-3 h-3" /> },
  course: { label: 'Course', color: 'bg-indigo-100 text-indigo-800', icon: <BookOpen className="w-3 h-3" /> },
};

const modeConfig = {
  online: { label: 'Online', color: 'bg-cyan-100 text-cyan-800', icon: <Video className="w-3 h-3" /> },
  'in-person': { label: 'In-Person', color: 'bg-emerald-100 text-emerald-800', icon: <Users className="w-3 h-3" /> },
  hybrid: { label: 'Hybrid', color: 'bg-amber-100 text-amber-800', icon: <Users className="w-3 h-3" /> },
};

const goalStatusConfig = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export default function TeacherDevelopmentPage() {
  const [trainingOpportunities, setTrainingOpportunities] = useState<TrainingOpportunity[]>([]);
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [selfAssessments, setSelfAssessments] = useState<SelfAssessment[]>([]);
  const [professionalGoals, setProfessionalGoals] = useState<ProfessionalGoal[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'training' | 'cpd' | 'goals' | 'reviews' | 'assessment' | 'certificates'>('training');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingOpportunity | null>(null);
  const [editingGoal, setEditingGoal] = useState<ProfessionalGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: 'teaching' as ProfessionalGoal['category'],
  });
  const [assessmentForm, setAssessmentForm] = useState({
    selfRating: 3,
    achievements: [''],
    challenges: [''],
    professionalGoals: [''],
    trainingNeeds: [''],
  });
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  
  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trainingRes, cpdRes, reviewsRes, goalsRes, certificatesRes, assessmentsRes] = await Promise.all([
        teacherService.development.getTrainingOpportunities(),
        teacherService.development.getCPDRecords(),
        teacherService.development.getPerformanceReviews(),
        teacherService.development.getProfessionalGoals(),
        teacherService.development.getCertificates(),
        teacherService.development.getSelfAssessments(),
      ]);
      
      if (trainingRes.success) setTrainingOpportunities(trainingRes.data || []);
      if (cpdRes.success) setCpdRecords(cpdRes.data || []);
      if (reviewsRes.success) setPerformanceReviews(reviewsRes.data || []);
      if (goalsRes.success) setProfessionalGoals(goalsRes.data || []);
      if (certificatesRes.success) setCertificates(certificatesRes.data || []);
      if (assessmentsRes.success) setSelfAssessments(assessmentsRes.data || []);
    } catch (error) {
      console.error('Failed to load development data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const registerForTraining = async () => {
    if (!selectedTraining) return;
    try {
      await teacherService.development.registerForTraining(selectedTraining.id);
      toast.success(`Registered for ${selectedTraining.title}`);
      setShowRegisterModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to register:', error);
      toast.error('Failed to register');
    }
  };

  const createGoal = async () => {
    if (!goalForm.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    try {
      if (editingGoal) {
        await teacherService.development.updateGoal(editingGoal.id, goalForm);
        toast.success('Goal updated');
      } else {
        await teacherService.development.createGoal(goalForm);
        toast.success('Goal created');
      }
      setShowGoalModal(false);
      setEditingGoal(null);
      setGoalForm({ title: '', description: '', targetDate: '', category: 'teaching' });
      loadData();
    } catch (error) {
      console.error('Failed to save goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    try {
      await teacherService.development.updateGoalProgress(goalId, progress);
      toast.success('Progress updated');
      loadData();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const submitSelfAssessment = async () => {
    try {
      await teacherService.development.submitSelfAssessment(assessmentForm);
      toast.success('Self-assessment submitted');
      setShowAssessmentModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };

  const uploadCertificate = async (file: File) => {
    setUploadingCertificate(true);
    try {
      await teacherService.development.uploadCertificate(file);
      toast.success('Certificate uploaded');
      loadData();
    } catch (error) {
      console.error('Failed to upload certificate:', error);
      toast.error('Failed to upload certificate');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const totalCPDHours = useMemo(() => {
    return cpdRecords.filter(r => r.status === 'verified').reduce((sum, r) => sum + r.hours, 0);
  }, [cpdRecords]);

  const filteredTrainings = useMemo(() => {
    return trainingOpportunities.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesMode = !modeFilter || t.mode === modeFilter;
      return matchesSearch && matchesType && matchesMode;
    });
  }, [trainingOpportunities, searchTerm, typeFilter, modeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading development data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Professional Development
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your professional growth, CPD hours, and career development
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{trainingOpportunities.length}</p>
          <p className="text-xs text-gray-500">Available Trainings</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <Clock className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCPDHours}</p>
          <p className="text-xs text-gray-500">Total CPD Hours</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{professionalGoals.length}</p>
          <p className="text-xs text-gray-500">Active Goals</p>
        </Card>
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <Award className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates.length}</p>
          <p className="text-xs text-gray-500">Certificates Earned</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('training')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'training' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            Training Opportunities
          </button>
          <button
            onClick={() => setActiveTab('cpd')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'cpd' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            CPD Records
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'goals' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            Professional Goals
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'reviews' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            Performance Reviews
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'assessment' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            Self Assessment
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={clsx('px-4 py-2 text-sm font-medium transition', activeTab === 'certificates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500')}
          >
            Certificates
          </button>
        </nav>
      </div>

      {/* Training Opportunities Tab */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Types</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="conference">Conference</option>
                <option value="webinar">Webinar</option>
                <option value="course">Course</option>
              </select>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setTypeFilter(''); setModeFilter(''); }}>
                Clear
              </Button>
            </div>
          </Card>

          {/* Training List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredTrainings.length === 0 ? (
              <Card className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No training opportunities found</p>
              </Card>
            ) : (
              filteredTrainings.map(training => {
                const type = trainingTypeConfig[training.type as keyof typeof trainingTypeConfig] || trainingTypeConfig.workshop;
                const mode = modeConfig[training.mode as keyof typeof modeConfig] || modeConfig.online;
                const isOpen = training.status === 'open';
                const spotsLeft = training.capacity - training.registeredCount;
                
                return (
                  <Card key={training.id} className="hover:shadow-md transition">
                    <div className="p-5">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', type.color)}>
                              {type.icon}
                              {type.label}
                            </span>
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', mode.color)}>
                              {mode.icon}
                              {mode.label}
                            </span>
                            {training.certificateProvided && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Award className="w-3 h-3" />
                                Certificate
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{training.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{training.provider}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{training.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <MapPin className="w-4 h-4" />
                              <span>{training.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{training.cpdHours} CPD Hours</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Spots left:</span>
                              <span className={clsx('ml-1 font-medium', spotsLeft < 10 ? 'text-red-500' : 'text-green-500')}>
                                {spotsLeft} / {training.capacity}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Cost:</span>
                              <span className="ml-1 font-medium">KES {training.cost.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedTraining(training);
                            setShowRegisterModal(true);
                          }}
                          disabled={!isOpen || spotsLeft === 0}
                          className="whitespace-nowrap"
                        >
                          {!isOpen ? 'Registration Closed' : spotsLeft === 0 ? 'Fully Booked' : 'Register Now'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CPD Records Tab */}
      {activeTab === 'cpd' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Continuing Professional Development</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">Total CPD Hours: </span>
              <span className="text-xl font-bold text-blue-600">{totalCPDHours}</span>
            </div>
          </div>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-semibold">Activity</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Hours</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cpdRecords.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No CPD records found</td></tr>
                  ) : (
                    cpdRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{record.activityTitle}</td>
                        <td className="px-4 py-3">{record.provider}</td>
                        <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{record.hours}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('px-2 py-1 rounded-full text-xs font-medium',
                            record.status === 'verified' ? 'bg-green-100 text-green-800' :
                            record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          )}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {record.certificateUrl && (
                            <a href={record.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Professional Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingGoal(null);
              setGoalForm({ title: '', description: '', targetDate: '', category: 'teaching' });
              setShowGoalModal(true);
            }}>
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionalGoals.length === 0 ? (
              <Card className="col-span-2 text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No professional goals set</p>
              </Card>
            ) : (
              professionalGoals.map(goal => {
                const status = goalStatusConfig[goal.status as keyof typeof goalStatusConfig] || goalStatusConfig.not_started;
                return (
                  <Card key={goal.id} className="hover:shadow-md transition">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                        </div>
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="text-gray-500">Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <select
                            value={goal.progress}
                            onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            <option value={0}>0%</option>
                            <option value={25}>25%</option>
                            <option value={50}>50%</option>
                            <option value={75}>75%</option>
                            <option value={100}>100%</option>
                          </select>
                          <button
                            onClick={() => {
                              setEditingGoal(goal);
                              setGoalForm({
                                title: goal.title,
                                description: goal.description,
                                targetDate: goal.targetDate,
                                category: goal.category,
                              });
                              setShowGoalModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Performance Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 font-semibold">Reviewer</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Rating</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceReviews.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No performance reviews found</td></tr>
                  ) : (
                    performanceReviews.map(review => (
                      <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3">{review.period}</td>
                        <td className="px-4 py-3">{review.reviewer}</td>
                        <td className="px-4 py-3">{new Date(review.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span>{review.overallRating}/5</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('px-2 py-1 rounded-full text-xs font-medium',
                            review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          )}>
                            {review.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-blue-500 hover:underline text-sm">View Details</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Self Assessment Tab */}
      {activeTab === 'assessment' && (
        <div className="space-y-4">
          <Card>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Self Assessment</h3>
                <Button onClick={() => setShowAssessmentModal(true)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Complete Assessment
                </Button>
              </div>
              
              {selfAssessments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No self assessments submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {selfAssessments.map(assessment => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">Submitted: {new Date(assessment.submittedAt).toLocaleDateString()}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="font-medium">Self Rating:</span>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={clsx('w-4 h-4', i < assessment.selfRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                            ))}
                          </div>
                        </div>
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium',
                          assessment.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}>
                          {assessment.status}
                        </span>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium">Achievements</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {assessment.achievements.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Professional Goals</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {assessment.professionalGoals.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => e.target.files && uploadCertificate(e.target.files[0])}
                className="hidden"
              />
              <Button as="span" disabled={uploadingCertificate}>
                {uploadingCertificate ? <Spinner size="sm" /> : <Upload className="w-4 h-4 mr-1" />}
                Upload Certificate
              </Button>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.length === 0 ? (
              <Card className="col-span-3 text-center py-12">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No certificates uploaded yet</p>
              </Card>
            ) : (
              certificates.map(cert => (
                <Card key={cert.id} className="hover:shadow-md transition">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cert.title}</h3>
                        <p className="text-xs text-gray-500">{cert.issuer}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                      {cert.expiryDate && <p>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>}
                      <p>CPD Points: {cert.cpdPoints}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn btn-outline btn-sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </a>
                      <a href={cert.certificateUrl} download className="flex-1 btn btn-outline btn-sm">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Register Training Modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register for Training" size="md">
        {selectedTraining && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold">{selectedTraining.title}</h4>
              <p className="text-sm text-gray-500">{selectedTraining.provider}</p>
              <p className="text-sm mt-2">{selectedTraining.cpdHours} CPD Hours | KES {selectedTraining.cost.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p><strong>Start Date:</strong> {new Date(selectedTraining.startDate).toLocaleDateString()}</p>
              <p><strong>Venue:</strong> {selectedTraining.venue}</p>
              {selectedTraining.requirements.length > 0 && (
                <div>
                  <strong>Requirements:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {selectedTraining.requirements.map((req, i) => <li key={i}>{req}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-600" />
              By registering, you confirm your availability for the entire training period.
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
          <Button onClick={registerForTraining}>Confirm Registration</Button>
        </div>
      </Modal>

      {/* Goal Modal */}
      <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title={editingGoal ? 'Edit Goal' : 'Add Professional Goal'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Complete ICT Integration Training"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Describe what you want to achieve..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Date</label>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={goalForm.category}
                onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="teaching">Teaching</option>
                <option value="leadership">Leadership</option>
                <option value="technology">Technology</option>
                <option value="research">Research</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowGoalModal(false)}>Cancel</Button>
          <Button onClick={createGoal}>{editingGoal ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      {/* Self Assessment Modal */}
      <Modal isOpen={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} title="Self Assessment" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Self Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setAssessmentForm({ ...assessmentForm, selfRating: rating })}
                  className="p-2 focus:outline-none"
                >
                  <Star className={clsx('w-8 h-8', rating <= assessmentForm.selfRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Key Achievements</label>
            {assessmentForm.achievements.map((achievement, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => {
                    const newAchievements = [...assessmentForm.achievements];
                    newAchievements[idx] = e.target.value;
                    setAssessmentForm({ ...assessmentForm, achievements: newAchievements });
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Describe your achievement..."
                />
                {idx === assessmentForm.achievements.length - 1 && (
                  <button
                    onClick={() => setAssessmentForm({ ...assessmentForm, achievements: [...assessmentForm.achievements, ''] })}
                    className="p-2 text-blue-500"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Professional Goals</label>
            {assessmentForm.professionalGoals.map((goal, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...assessmentForm.professionalGoals];
                    newGoals[idx] = e.target.value;
                    setAssessmentForm({ ...assessmentForm, professionalGoals: newGoals });
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Your professional goal..."
                />
                {idx === assessmentForm.professionalGoals.length - 1 && (
                  <button
                    onClick={() => setAssessmentForm({ ...assessmentForm, professionalGoals: [...assessmentForm.professionalGoals, ''] })}
                    className="p-2 text-blue-500"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Training Needs</label>
            {assessmentForm.trainingNeeds.map((need, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={need}
                  onChange={(e) => {
                    const newNeeds = [...assessmentForm.trainingNeeds];
                    newNeeds[idx] = e.target.value;
                    setAssessmentForm({ ...assessmentForm, trainingNeeds: newNeeds });
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Training you need..."
                />
                {idx === assessmentForm.trainingNeeds.length - 1 && (
                  <button
                    onClick={() => setAssessmentForm({ ...assessmentForm, trainingNeeds: [...assessmentForm.trainingNeeds, ''] })}
                    className="p-2 text-blue-500"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowAssessmentModal(false)}>Cancel</Button>
          <Button onClick={submitSelfAssessment}>Submit Assessment</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}