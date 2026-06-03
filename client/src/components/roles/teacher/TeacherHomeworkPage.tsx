import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Calendar, FileText, Users, Clock, CheckCircle, XCircle, 
  Eye, Edit, Trash2, Download, Upload, Mail, MessageSquare, 
  TrendingUp, AlertCircle, Filter, Search, RefreshCw, Save,
  File, Image, Link, Send, Award, BarChart3, Printer,
  ChevronDown, ChevronUp, Star, Target, Zap, Bell, Settings
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import EditableSelect from '../../ui/EditableSelect';

interface HomeworkAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface HomeworkSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  submissionDate: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  score: number | null;
  feedback: string | null;
  attachments: HomeworkAttachment[];
  gradedBy: string | null;
  gradedAt: string | null;
  comments: string | null;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  classStream: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  dueTime: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'archived';
  attachments: HomeworkAttachment[];
  submissions: HomeworkSubmission[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  notificationSent: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  stream: string;
  students: Array<{ id: string; name: string; admissionNumber: string }>;
}

const TeacherHomeworkPage: React.FC = () => {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    dueDate: '',
    dueTime: '23:59',
    maxMarks: 20,
    attachments: [] as File[],
  });
  
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load assignments when filters change
  useEffect(() => {
    loadAssignments();
  }, [selectedClass, selectedSubject, filterStatus]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
      ]);
      
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      
      // Set default selections
      if (classesRes.data?.length) setSelectedClass(classesRes.data[0].id);
      if (subjectsRes.data?.length) setSelectedSubject(subjectsRes.data[0].id);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await teacherService.homework.getAssignments({
        classId: selectedClass || undefined,
        subjectId: selectedSubject || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      if (response.success) setAssignments(response.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('classId', formData.classId);
      formDataToSend.append('subjectId', formData.subjectId);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('dueTime', formData.dueTime);
      formDataToSend.append('maxMarks', formData.maxMarks.toString());
      
      formData.attachments.forEach((file, index) => {
        formDataToSend.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.homework.createAssignment(formDataToSend);
      
      if (response.success) {
        toast.success('Assignment created successfully');
        setShowCreateForm(false);
        resetForm();
        loadAssignments();
        
        // Ask if user wants to send notifications
        const sendNotifications = await confirmation.confirm({
          title: 'Send Notifications?',
          message: 'Would you like to notify parents and students about this assignment?',
          confirmText: 'Yes, Notify',
          cancelText: 'Later',
        });
        
        if (sendNotifications) {
          await teacherService.homework.sendAssignmentNotifications(response.data.id);
          toast.success('Notifications sent');
        }
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const publishAssignment = async (assignmentId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Publish Assignment?',
      message: 'This will make the assignment visible to students and send notifications to parents.',
      confirmText: 'Publish',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.homework.publishAssignment(assignmentId);
      toast.success('Assignment published');
      loadAssignments();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish assignment');
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Assignment?',
      message: 'This action cannot be undone. All submissions will be lost.',
      confirmText: 'Delete',
      type: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.homework.deleteAssignment(assignmentId);
      toast.success('Assignment deleted');
      loadAssignments();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const gradeSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      await teacherService.homework.gradeSubmission(
        selectedSubmission.id,
        gradeData.score,
        gradeData.feedback
      );
      toast.success('Submission graded');
      setShowGradeModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Failed to grade:', error);
      toast.error('Failed to grade submission');
    }
  };

  const downloadSubmission = async (submissionId: string, attachmentId: string, fileName: string) => {
    try {
      const response = await teacherService.homework.downloadSubmission(submissionId, attachmentId);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download file');
    }
  };

  const downloadAllSubmissions = async (assignmentId: string) => {
    try {
      const response = await teacherService.homework.downloadAllSubmissions(assignmentId);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions_${assignmentId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Failed to download all:', error);
      toast.error('Failed to download submissions');
    }
  };

  const sendReminder = async (assignmentId: string) => {
    try {
      await teacherService.homework.sendReminder(assignmentId);
      toast.success('Reminders sent to students who haven\'t submitted');
    } catch (error) {
      console.error('Failed to send reminders:', error);
      toast.error('Failed to send reminders');
    }
  };

  const getSubmissionStats = useCallback((assignment: HomeworkAssignment) => {
    const total = assignment.submissions?.length || 0;
    const graded = assignment.submissions?.filter(s => s.status === 'graded').length || 0;
    const submitted = assignment.submissions?.filter(s => s.status === 'submitted').length || 0;
    const late = assignment.submissions?.filter(s => s.status === 'late').length || 0;
    const missing = (assignment.classId ? classes.find(c => c.id === assignment.classId)?.students.length || 0 : 0) - total;
    
    return { total, graded, submitted, late, missing, pending: submitted - graded };
  }, [classes]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignments, searchTerm]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classId: selectedClass,
      subjectId: selectedSubject,
      dueDate: '',
      dueTime: '23:59',
      maxMarks: 20,
      attachments: [],
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, dueTime: string) => {
    const dueDateTime = new Date(`${dueDate}T${dueTime}`);
    return dueDateTime < new Date();
  };

  if (loading && !assignments.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading assignments..." />
      </div>
    );
  }

  const selectedClassObj = classes.find(c => c.id === selectedClass);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Homework Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and grade homework assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAssignments}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Assign Homework
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No homework assignments found</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create First Assignment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const stats = getSubmissionStats(assignment);
            const overdue = isOverdue(assignment.dueDate, assignment.dueTime);
            
            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {assignment.className} • {assignment.subjectName}
                      </p>
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-semibold',
                      assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    )}>
                      {assignment.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {assignment.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={clsx(overdue && assignment.status === 'published' ? 'text-red-600' : 'text-gray-600')}>
                        Due: {formatDate(assignment.dueDate)} at {assignment.dueTime}
                      </span>
                      {overdue && assignment.status === 'published' && (
                        <span className="text-xs text-red-600">(Overdue)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span>Max Marks: {assignment.maxMarks}</span>
                    </div>
                  </div>

                  {/* Submission Stats */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-xl font-bold text-blue-600">{stats.total}</p>
                        <p className="text-xs text-gray-500">Submitted</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-600">{stats.graded}</p>
                        <p className="text-xs text-gray-500">Graded</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-orange-600">{stats.missing}</p>
                        <p className="text-xs text-gray-500">Missing</p>
                      </div>
                    </div>
                    {stats.pending > 0 && (
                      <div className="mt-2 text-center">
                        <p className="text-xs text-yellow-600">{stats.pending} pending grading</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Submissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadAllSubmissions(assignment.id)}
                      disabled={stats.total === 0}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All
                    </Button>
                    {assignment.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => publishAssignment(assignment.id)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <button
                      onClick={() => sendReminder(assignment.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Send Reminder"
                    >
                      <Bell className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Create New Assignment" size="lg">
        <form onSubmit={createAssignment} className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Algebra Exercise 1"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Detailed description of the assignment..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Class *</label>
              <EditableSelect
                options={classes.map(c => `${c.name} - ${c.stream}`)}
                placeholder="Type or select class"
                value={formData.classId ? classes.find(c => c.id === formData.classId)?.name : ''}
                onChange={(value) => {
                  const selected = classes.find(c => `${c.name} - ${c.stream}` === value);
                  if (selected) setFormData({ ...formData, classId: selected.id });
                }}
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <select
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Due Time</label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Max Marks</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
              className="w-32 px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" />
              Select Files
            </Button>
            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
              Create Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={`Submissions: ${selectedAssignment?.title}`}
        size="xl"
      >
        {selectedAssignment && (
          <div className="space-y-4">
            {/* Assignment Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAssignment.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>Due: {formatDate(selectedAssignment.dueDate)} at {selectedAssignment.dueTime}</span>
                <span>Max Marks: {selectedAssignment.maxMarks}</span>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Admission</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Submitted</th>
                    <th className="px-3 py-2 text-center">Score</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedAssignment.submissions?.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 font-medium">{submission.studentName}</td>
                      <td className="px-3 py-2 text-gray-500">{submission.admissionNumber}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-semibold',
                          submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                          submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          submission.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {submission.submissionDate ? formatDate(submission.submissionDate) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {submission.score !== null ? `${submission.score}/${selectedAssignment.maxMarks}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {submission.attachments?.length > 0 && (
                            <button
                              onClick={() => submission.attachments.forEach(att => 
                                downloadSubmission(submission.id, att.id, att.fileName)
                              )}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {submission.status !== 'graded' && (
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setGradeData({ score: 0, feedback: '' });
                                setShowGradeModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Grade"
                            >
                              <Edit className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowSubmissionModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedAssignment.submissions?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No submissions yet</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title="Grade Submission" size="md">
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="font-medium">{selectedSubmission.studentName}</p>
              <p className="text-sm text-gray-600">Admission: {selectedSubmission.admissionNumber}</p>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Score (out of {selectedAssignment?.maxMarks})</label>
              <input
                type="number"
                min="0"
                max={selectedAssignment?.maxMarks}
                value={gradeData.score}
                onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Feedback</label>
              <textarea
                rows={4}
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="Provide constructive feedback..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowGradeModal(false)}>Cancel</Button>
              <Button onClick={gradeSubmission}>Submit Grade</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Submission Details Modal */}
      <Modal isOpen={showSubmissionModal} onClose={() => setShowSubmissionModal(false)} title="Submission Details" size="md">
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="font-medium">{selectedSubmission.studentName}</p>
              <p className="text-sm text-gray-600">Submitted: {formatDate(selectedSubmission.submissionDate)}</p>
              <p className="text-sm text-gray-600">Status: {selectedSubmission.status}</p>
            </div>

            {selectedSubmission.attachments?.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Attachments</label>
                <div className="space-y-2">
                  {selectedSubmission.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{att.fileName}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSubmission(selectedSubmission.id, att.id, att.fileName)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSubmission.feedback && (
              <div>
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm">{selectedSubmission.feedback}</p>
                </div>
              </div>
            )}

            {selectedSubmission.score !== null && selectedAssignment && (
              <div>
                <label className="block text-sm font-medium mb-2">Score</label>
                <div className="text-2xl font-bold text-green-600">
                  {selectedSubmission.score}/{selectedAssignment.maxMarks}
                </div>
                <div className="text-sm text-gray-600">
                  {((selectedSubmission.score / selectedAssignment.maxMarks) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.confirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherHomeworkPage