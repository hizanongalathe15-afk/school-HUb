import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  AlertCircle, 
  Send, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Flag,
  MessageCircle,
  User,
  Mail,
  Phone,
  X,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { Complaint, ParentApiResponse, ParentChild } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

const ParentComplaints: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  
  // Form state
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [attachment, setAttachment] = useState<File | null>(null);
  
  // UI state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const categories = useMemo(
    () => ['General', 'Fees', 'Academics', 'Attendance', 'Discipline', 'Health', 'Facilities', 'Transport', 'Other'],
    []
  );

  const loadChildren = useCallback(async () => {
    try {
      const res = await parentService.children.getMyChildren();
      if (res?.success && res.data) {
        setChildren(res.data);
        if (res.data[0] && !selectedChildId) {
          setSelectedChildId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  }, [selectedChildId]);

  const loadComplaints = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const res: ParentApiResponse<Complaint[]> = await parentService.complaints.getMyComplaints();
      if (res?.success && Array.isArray(res.data)) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...complaints];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setFilteredComplaints(filtered);
  }, [complaints, statusFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadChildren();
        await loadComplaints();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadChildren, loadComplaints]);

  const submitComplaint = useCallback(async () => {
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    
    try {
      const res: ParentApiResponse<Complaint> = await parentService.complaints.submitComplaint(
        category,
        subject.trim(),
        description.trim(),
        selectedChildId || undefined,
        priority,
        attachment || undefined
      );
      
      if (res?.success) {
        // Reset form
        setSubject('');
        setDescription('');
        setAttachment(null);
        setCategory('General');
        setPriority('medium');
        
        // Reload complaints
        await loadComplaints(true);
        
        // Show success message (you can integrate toast here)
        console.log('Complaint submitted successfully');
      } else {
        setError(res?.message || 'Complaint submission failed');
      }
    } catch (err) {
      console.error('Complaint submission failed:', err);
      setError('Complaint submission failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  }, [category, subject, description, selectedChildId, priority, attachment, loadComplaints]);

  const handleRefresh = useCallback(() => {
    loadComplaints(true);
  }, [loadComplaints]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    };
    
    const labels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      in_progress: <RefreshCw className="w-3 h-3" />,
      resolved: <CheckCircle className="w-3 h-3" />,
      closed: <X className="w-3 h-3" />
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    const variants: Record<string, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    const labels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[priority])}>
        <Flag className="w-3 h-3" />
        {labels[priority]}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString()}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString()}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const closed = complaints.filter(c => c.status === 'closed').length;
    
    return { total, pending, inProgress, resolved, closed };
  }, [complaints]);

  if (loading && complaints.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading complaints..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Complaints & Suggestions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Submit and track your complaints, suggestions, and feedback
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          isLoading={refreshing}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Resolved</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Closed</p>
        </Card>
      </div>

      {/* Error Display */}
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

      {/* Submit Complaint Form */}
      {showForm && (
        <Card 
          title="Submit a Complaint"
          className="overflow-hidden"
          header={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Related Child (Optional)
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Child (Optional) --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} - {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject *
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief title of your complaint"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about your complaint..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={submitComplaint}
                isLoading={submitLoading}
                icon={<Send className="w-4 h-4" />}
              >
                Submit Complaint
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubject('');
                  setDescription('');
                  setAttachment(null);
                  setCategory('General');
                  setPriority('medium');
                }}
                disabled={submitLoading}
              >
                Clear Form
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus className="w-4 h-4 mr-1" />
          New Complaint
        </Button>
      )}

      {/* Complaints History */}
      <Card 
        title="Complaints History"
        header={
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        }
      >
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {complaints.length === 0 
                ? 'No complaints submitted yet' 
                : 'No complaints match your filter'}
            </p>
            {complaints.length === 0 && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-1" />
                Submit Your First Complaint
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className={clsx(
                  'border rounded-lg p-4 transition-all cursor-pointer',
                  'hover:shadow-md dark:hover:shadow-lg',
                  expandedId === complaint.id 
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20' 
                    : 'border-gray-200 dark:border-gray-700',
                  complaint.status === 'pending' && 'border-l-4 border-l-yellow-500',
                  complaint.status === 'in_progress' && 'border-l-4 border-l-blue-500',
                  complaint.status === 'resolved' && 'border-l-4 border-l-green-500'
                )}
                onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {complaint.subject}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {complaint.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Category: {complaint.category}
                      </span>
                      {complaint.childName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Child: {complaint.childName}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {expandedId === complaint.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === complaint.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {complaint.description}
                        </p>
                      </div>
                      
                      {complaint.response && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Staff Response:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {complaint.response}
                          </p>
                          {complaint.respondedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Responded: {new Date(complaint.respondedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {complaint.attachmentUrl && (
                        <div>
                          <a
                            href={complaint.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Attachment
                          </a>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        Reference ID: {complaint.id}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ParentComplaints;