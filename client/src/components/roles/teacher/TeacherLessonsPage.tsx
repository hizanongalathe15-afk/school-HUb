import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Edit, Trash, BookOpen, Share2, Eye, Calendar, 
  Clock, Target, Package, FileText, Upload, Download, 
  Copy, CheckCircle, XCircle, AlertCircle, Printer,
  Filter, Search, RefreshCw, Save, Send, Bell, Star,
  ChevronDown, ChevronUp, MessageSquare, Users, Zap,
  Link, ExternalLink, Archive, Repeat, Settings
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import type { LessonPlan, LessonActivity, TeacherClass } from '../../../types/teacher';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import EditableSelect from '../../ui/EditableSelect';

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
}

const TeacherLessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: 40,
    objectives: [''],
    materials: [''],
    activities: [{ name: '', duration: 15, description: '' }],
    assessment: '',
    resources: [''],
  });

  // Helper to transform activities for API (add order)
  const getApiActivities = () => 
    formData.activities.filter(a => a.name.trim()).map((a, idx) => ({
      ...a,
      order: idx,
    }));

  // Helper to transform resources for API (filter empty strings)
  const getApiResources = () => 
    formData.resources.filter(r => r.trim());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load lessons when filters change
  useEffect(() => {
    loadLessons();
  }, [selectedClass, selectedSubject, filterStatus]);

  const loadData = async () => {
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
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    setLoading(true);
    try {
      const response = await teacherService.lessonPlans.getLessonPlans(
        selectedSubject || undefined,
        selectedClass || undefined,
      );
      if (response.success) {
        let lessons = response.data || [];
        // Apply status filter client-side since API doesn't support it
        if (filterStatus !== 'all') {
          lessons = lessons.filter(l => l.status === filterStatus);
        }
        setLessons(lessons);
      }
    } catch (error) {
      console.error('Failed to load lessons:', error);
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await teacherService.lessonPlans.createLessonPlan({
        classId: formData.classId,
        subjectId: formData.subjectId,
        title: formData.title,
        date: formData.date,
        duration: formData.duration,
        objectives: formData.objectives.filter(o => o.trim()),
        materials: formData.materials.filter(m => m.trim()),
        activities: getApiActivities(),
        assessment: formData.assessment,
        resources: getApiResources(),
      });
      
      if (response.success) {
        toast.success('Lesson plan created successfully');
        setShowForm(false);
        resetForm();
        loadLessons();
      }
    } catch (error) {
      console.error('Failed to create lesson:', error);
      toast.error('Failed to create lesson plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLesson) return;
    setSaving(true);
    
    try {
      const response = await teacherService.lessonPlans.updateLessonPlan(selectedLesson.id, {
        title: selectedLesson.title,
        objectives: selectedLesson.objectives,
        materials: selectedLesson.materials,
        activities: selectedLesson.activities,
        assessment: selectedLesson.assessment,
        resources: selectedLesson.resources,
        duration: selectedLesson.duration,
      });
      
      if (response.success) {
        toast.success('Lesson plan updated');
        setShowViewModal(false);
        loadLessons();
      }
    } catch (error) {
      console.error('Failed to update lesson:', error);
      toast.error('Failed to update lesson plan');
    } finally {
      setSaving(false);
    }
  };

  const publishLesson = async (lessonId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Publish Lesson Plan?',
      message: 'This will make the lesson plan visible to students and your HOD.',
      confirmText: 'Publish',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.lessonPlans.publishLessonPlan(lessonId);
      toast.success('Lesson plan published');
      loadLessons();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish lesson plan');
    }
  };

  const completeLesson = async (lessonId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Mark as Completed?',
      message: 'This lesson will be marked as completed and archived.',
      confirmText: 'Complete',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.lessonPlans.completeLessonPlan(lessonId, { reflection: '' });
      toast.success('Lesson marked as completed');
      loadLessons();
    } catch (error) {
      console.error('Failed to complete:', error);
      toast.error('Failed to complete lesson');
    }
  };

  const deleteLesson = async (lessonId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Lesson Plan?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.lessonPlans.deleteLessonPlan(lessonId);
      toast.success('Lesson plan deleted');
      loadLessons();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete lesson plan');
    }
  };

  const shareWithHOD = async (lessonId: string) => {
    try {
      await teacherService.lessonPlans.shareWithHOD(lessonId);
      toast.success('Shared with HOD for review');
      loadLessons();
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share with HOD');
    }
  };

  const shareWithStudents = async (lessonId: string) => {
    try {
      await teacherService.lessonPlans.shareWithStudents(lessonId);
      toast.success('Shared with students');
      loadLessons();
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share with students');
    }
  };

  const saveReflection = async () => {
    if (!selectedLesson) return;
    
    try {
      await teacherService.lessonPlans.addReflection(selectedLesson.id, { reflection: reflectionText });
      toast.success('Reflection saved');
      setShowReflectionModal(false);
      setReflectionText('');
      loadLessons();
    } catch (error) {
      console.error('Failed to save reflection:', error);
      toast.error('Failed to save reflection');
    }
  };

  const copyLesson = async (lesson: LessonPlan) => {
    try {
      const response = await teacherService.lessonPlans.copyLessonPlan(lesson.id, { date: new Date().toISOString().split('T')[0] });
      if (response.success) {
        toast.success('Lesson plan copied. Edit as needed.');
        loadLessons();
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy lesson plan');
    }
  };

  const exportLesson = async (lessonId: string, format: 'pdf' | 'docx') => {
    try {
      const response = await teacherService.lessonPlans.exportLessonPlan(lessonId, format);
      const url = typeof response.data === 'string' ? response.data : (response.data as { url?: string })?.url;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson_plan_${lessonId}.${format}`;
        a.click();
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export lesson plan');
    }
  };

  const resetForm = () => {
    setFormData({
      classId: selectedClass,
      subjectId: selectedSubject,
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      duration: 40,
      objectives: [''],
      materials: [''],
      activities: [{ name: '', duration: 15, description: '' }],
      assessment: '',
      resources: [''],
    });
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, ''],
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj),
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, ''],
    }));
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { name: '', duration: 15, description: '' }],
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, ''],
    }));
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lessons, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'published': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'archived': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !lessons.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading lesson plans..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Lesson Plans
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and share lesson plans with students and HOD
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              List View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadLessons}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Lesson Plan
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
                placeholder="Search lesson plans..."
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
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lessons Display */}
      {filteredLessons.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No lesson plans found</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Your First Lesson Plan
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {lesson.className} • {lesson.subjectName}
                    </p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getStatusBadge(lesson.status))}>
                    {lesson.status}
                  </span>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(lesson.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{lesson.duration} min</span>
                  </div>
                </div>

                {/* Objectives Preview */}
                {lesson.objectives.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Objectives:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                      {lesson.objectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx} className="line-clamp-1">{obj}</li>
                      ))}
                      {lesson.objectives.length > 2 && (
                        <li className="text-gray-400">+{lesson.objectives.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Share Status */}
                <div className="flex gap-2 mb-3">
                  {lesson.sharedWithHOD && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Shared with HOD</span>
                  )}
                  {lesson.sharedWithStudents && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Shared with Students</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  {lesson.status === 'draft' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => publishLesson(lesson.id)}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Publish
                    </Button>
                  )}
                  {lesson.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => completeLesson(lesson.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                  )}
                  <button
                    onClick={() => copyLesson(lesson)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteLesson(lesson.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Duration</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Shared</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium">{lesson.title}</td>
                    <td className="px-4 py-3">{lesson.className}</td>
                    <td className="px-4 py-3">{lesson.subjectName}</td>
                    <td className="px-4 py-3 text-center">{formatDate(lesson.date)}</td>
                    <td className="px-4 py-3 text-center">{lesson.duration} min</td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getStatusBadge(lesson.status))}>
                        {lesson.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {lesson.sharedWithHOD && <Share2 className="w-3 h-3 text-purple-500" />}
                        {lesson.sharedWithStudents && <Users className="w-3 h-3 text-green-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setShowViewModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => copyLesson(lesson)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Lesson Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Lesson Plan" size="xl">
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
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

          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Introduction to Algebra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Brief overview of the lesson..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Learning Objectives
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                <Plus className="w-3 h-3 mr-1" />
                Add Objective
              </Button>
            </label>
            {formData.objectives.map((obj, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => updateObjective(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  placeholder={`Objective ${idx + 1}`}
                />
                {formData.objectives.length > 1 && (
                  <button type="button" onClick={() => removeObjective(idx)} className="text-red-500">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Materials Needed */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Materials Needed
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="w-3 h-3 mr-1" />
                Add Material
              </Button>
            </label>
            {formData.materials.map((material, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={material}
                  onChange={(e) => {
                    const newMaterials = [...formData.materials];
                    newMaterials[idx] = e.target.value;
                    setFormData({ ...formData, materials: newMaterials });
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  placeholder={`Material ${idx + 1}`}
                />
                {formData.materials.length > 1 && (
                  <button type="button" onClick={() => {
                    setFormData({ ...formData, materials: formData.materials.filter((_, i) => i !== idx) });
                  }} className="text-red-500">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Lesson Activities */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Lesson Activities
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                <Plus className="w-3 h-3 mr-1" />
                Add Activity
              </Button>
            </label>
            {formData.activities.map((activity, idx) => (
              <div key={idx} className="border rounded-lg p-3 mb-3">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={activity.name}
                    onChange={(e) => {
                      const newActivities = [...formData.activities];
                      newActivities[idx].name = e.target.value;
                      setFormData({ ...formData, activities: newActivities });
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Activity title"
                  />
                  <input
                    type="number"
                    value={activity.duration}
                    onChange={(e) => {
                      const newActivities = [...formData.activities];
                      newActivities[idx].duration = parseInt(e.target.value);
                      setFormData({ ...formData, activities: newActivities });
                    }}
                    className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Mins"
                  />
                  {formData.activities.length > 1 && (
                    <button type="button" onClick={() => {
                      setFormData({ ...formData, activities: formData.activities.filter((_, i) => i !== idx) });
                    }} className="text-red-500">
                      <Trash className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <textarea
                  value={activity.description}
                  onChange={(e) => {
                    const newActivities = [...formData.activities];
                    newActivities[idx].description = e.target.value;
                    setFormData({ ...formData, activities: newActivities });
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  rows={2}
                  placeholder="Activity description..."
                />
              </div>
            ))}
          </div>

          {/* Assessment */}
          <div>
            <label className="block text-sm font-medium mb-1">Assessment Method</label>
            <textarea
              rows={3}
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="How will you assess student understanding?"
            />
          </div>

          {/* Resources */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Resources & Links
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addResource}>
                <Plus className="w-3 h-3 mr-1" />
                Add Resource
              </Button>
            </label>
            {formData.resources.map((resource, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={resource}
                  onChange={(e) => {
                    const newResources = [...formData.resources];
                    newResources[idx] = e.target.value;
                    setFormData({ ...formData, resources: newResources });
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  placeholder="Resource URL"
                />
                {formData.resources.length > 1 && (
                  <button type="button" onClick={() => {
                    setFormData({ ...formData, resources: formData.resources.filter((_, i) => i !== idx) });
                  }} className="text-red-500">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
              Save as Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Lesson Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Lesson Plan Details" size="xl">
        {selectedLesson && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Header Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedLesson.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLesson.className} • {selectedLesson.subjectName} • {selectedLesson.createdByName}
                  </p>
                </div>
                <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getStatusBadge(selectedLesson.status))}>
                  {selectedLesson.status}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(selectedLesson.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedLesson.duration} minutes</span>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Learning Objectives
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {selectedLesson.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Materials */}
            {selectedLesson.materials.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  Materials Needed
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {selectedLesson.materials.map((material, idx) => (
                    <li key={idx}>{material}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Activities */}
            {selectedLesson.activities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  Lesson Activities
                </h4>
                <div className="space-y-3">
                  {selectedLesson.activities.map((activity, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-3">
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium">{activity.name}</h5>
                        <span className="text-xs text-gray-500">{activity.duration} min</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment */}
            {selectedLesson.assessment && (
              <div>
                <h4 className="font-semibold mb-2">Assessment Method</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedLesson.assessment}</p>
              </div>
            )}

            {/* Resources */}
            {selectedLesson.resources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4 text-purple-600" />
                  Resources
                </h4>
                <div className="space-y-2">
                  {selectedLesson.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {resource}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection */}
            {selectedLesson.reflections && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-yellow-600" />
                  Teacher's Reflection
                </h4>
                <p className="text-gray-700">{selectedLesson.reflections}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {selectedLesson.status === 'draft' && (
                <Button onClick={() => publishLesson(selectedLesson.id)}>
                  <Send className="w-4 h-4 mr-1" />
                  Publish
                </Button>
              )}
              {selectedLesson.status === 'published' && (
                <Button onClick={() => completeLesson(selectedLesson.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setSelectedLesson(selectedLesson);
                setReflectionText(selectedLesson.reflections || '');
                setShowReflectionModal(true);
              }}>
                <MessageSquare className="w-4 h-4 mr-1" />
                Add Reflection
              </Button>
              <Button variant="outline" onClick={() => shareWithHOD(selectedLesson.id)}>
                <Share2 className="w-4 h-4 mr-1" />
                Share with HOD
              </Button>
              <Button variant="outline" onClick={() => shareWithStudents(selectedLesson.id)}>
                <Users className="w-4 h-4 mr-1" />
                Share with Students
              </Button>
              <Button variant="outline" onClick={() => exportLesson(selectedLesson.id, 'pdf')}>
                <Download className="w-4 h-4 mr-1" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => copyLesson(selectedLesson)}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reflection Modal */}
      <Modal isOpen={showReflectionModal} onClose={() => setShowReflectionModal(false)} title="Lesson Reflection" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reflect on what worked well, what could be improved, and any observations about student learning.
          </p>
          <textarea
            rows={6}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            placeholder="What went well? What could be improved? Any student insights?..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowReflectionModal(false)}>Cancel</Button>
          <Button onClick={saveReflection}>Save Reflection</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmation.isOpen}
        onCancel={confirmation.cancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.config?.title || ''}
        message={confirmation.config?.message || ''}
        confirmLabel={confirmation.config?.confirmText}
        cancelLabel={confirmation.config?.cancelText}
        type={confirmation.config?.type}
      />
    </div>
  );
};

export default TeacherLessonsPage;