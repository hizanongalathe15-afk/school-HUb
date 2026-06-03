import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  Paperclip,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Send,
  MessageCircle,
  Star,
  TrendingUp,
  Eye
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { HomeworkAssignment, ParentChild } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Input } from '../../ui/Input';
import { clsx } from 'clsx';

const ParentHomework: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'overdue' | ''>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [filteredHomework, setFilteredHomework] = useState<HomeworkAssignment[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
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
      setError('Failed to load children data');
    }
  }, [selectedChildId]);

  const loadHomework = useCallback(async (showRefresh = false) => {
    if (!selectedChildId) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const status = statusFilter || undefined;
      const res = await parentService.homework.getHomework(selectedChildId, status);
      if (res?.success && res.data) {
        setHomework(res.data);
      } else {
        setHomework([]);
      }
    } catch (err) {
      console.error('Failed to load homework:', err);
      setError('Failed to load homework assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChildId, statusFilter]);

  // Apply filters
  useEffect(() => {
    let filtered = [...homework];
    
    if (subjectFilter) {
      filtered = filtered.filter(h => h.subjectName.toLowerCase().includes(subjectFilter.toLowerCase()));
    }
    
    // Sort by due date (soonest first)
    filtered.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    setFilteredHomework(filtered);
  }, [homework, subjectFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadChildren();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadHomework();
    }
  }, [selectedChildId, statusFilter, loadHomework]);

  const handleRefresh = useCallback(() => {
    if (selectedChildId) {
      loadHomework(true);
    }
  }, [selectedChildId, loadHomework]);

  const downloadAttachment = useCallback(async (assignment: HomeworkAssignment, attachmentName: string) => {
    if (!selectedChildId) return;

    setDownloadingId(assignment.id);
    try {
      const blob = await parentService.homework.downloadHomeworkAttachment(
        selectedChildId,
        assignment.id,
        attachmentName
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachmentName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      setSuccess('File downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download attachment');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  }, [selectedChildId]);

  const markAsCompleted = useCallback(async (assignmentId: string) => {
    try {
      const res = await parentService.homework.markAsCompleted(selectedChildId, assignmentId);
      if (res?.success) {
        setSuccess('Homework marked as completed!');
        loadHomework(true);
      } else {
        setError('Failed to mark as completed');
      }
    } catch (err) {
      console.error('Failed to mark as completed:', err);
      setError('Failed to update status');
    }
  }, [selectedChildId, loadHomework]);

  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      submitted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    
    const icons = {
      active: <Clock className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      overdue: <AlertCircle className="w-3 h-3" />,
      submitted: <Send className="w-3 h-3" />
    };
    
    const labels = {
      active: 'Pending',
      completed: 'Completed',
      overdue: 'Overdue',
      submitted: 'Submitted'
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  }, []);

  const getDaysRemaining = useCallback((dueDate: string, status: string) => {
    if (status === 'completed') return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 text-xs">Overdue by {Math.abs(diffDays)} days</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 text-xs">Due today!</span>;
    } else if (diffDays === 1) {
      return <span className="text-yellow-600 text-xs">Due tomorrow</span>;
    } else {
      return <span className="text-gray-500 text-xs">{diffDays} days remaining</span>;
    }
  }, []);

  const getUniqueSubjects = useMemo(() => {
    const subjects = new Set(homework.map(h => h.subjectName));
    return Array.from(subjects);
  }, [homework]);

  const stats = useMemo(() => {
    const total = homework.length;
    const active = homework.filter(h => h.status === 'active').length;
    const completed = homework.filter(h => h.status === 'completed').length;
    const overdue = homework.filter(h => h.status === 'overdue').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, active, completed, overdue, completionRate };
  }, [homework]);

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading homework..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Homework & Assignments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track assignments, download materials, and monitor progress
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

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Completion</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {getUniqueSubjects.length > 0 && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {getUniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          )}

          {selectedChild && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                Class: {selectedChild.className}
                {selectedChild.streamName && ` - ${selectedChild.streamName}`}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Homework List */}
      {filteredHomework.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter || subjectFilter
                ? 'No homework matches your filters'
                : 'No homework assignments found'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((assignment) => (
            <Card
              key={assignment.id}
              className={clsx(
                'transition-all cursor-pointer hover:shadow-lg',
                assignment.status === 'overdue' && 'border-l-4 border-l-red-500',
                assignment.status === 'completed' && 'opacity-75',
                expandedId === assignment.id && 'shadow-lg'
              )}
              onClick={() => setExpandedId(expandedId === assignment.id ? null : assignment.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Subject Icon */}
                <div className="flex-shrink-0">
                  <div className={clsx(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    assignment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  )}>
                    <BookOpen className={clsx(
                      'w-6 h-6',
                      assignment.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                    )} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {assignment.subjectName} • {assignment.teacherName}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getDaysRemaining(assignment.dueDate, assignment.status)}
                    </div>
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {assignment.attachments.length} attachment(s)
                      </div>
                    )}
                  </div>

                  <p className={clsx(
                    'text-gray-600 dark:text-gray-400',
                    expandedId !== assignment.id && 'line-clamp-2'
                  )}>
                    {assignment.description || 'No description provided'}
                  </p>

                  {/* Expanded Content */}
                  {expandedId === assignment.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {/* Full Description */}
                      {assignment.description && assignment.description.length > 100 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.description}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments:</p>
                          <div className="space-y-2">
                            {assignment.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{attachment}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadAttachment(assignment, attachment);
                                  }}
                                  isLoading={downloadingId === assignment.id}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teacher's Feedback */}
                      {assignment.feedback && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            Teacher's Feedback:
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{assignment.feedback}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {assignment.status === 'active' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsCompleted(assignment.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0">
                  {expandedId === assignment.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentHomework;