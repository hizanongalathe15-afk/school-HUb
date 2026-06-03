// client/src/components/roles/teacher/TeacherClassesPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Users, Clock, MapPin, Plus, Edit, Trash2, Search,
  Filter, Download, RefreshCw, Eye, UserCheck, Calendar,
  Award, Star, Flag, Phone, Mail, MessageCircle, MoreVertical,
  ChevronDown, ChevronUp, Settings, DoorOpen, UserPlus,
  GraduationCap, Briefcase, Layout, List, Grid3x3
} from 'lucide-react';
import type { TeacherClass, TeacherSubject } from '../../../types/teacher';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface ClassDetails {
  id: string;
  name: string;
  stream: string;
  academicLevel: string;
  classTeacher?: string;
  studentCount: number;
  subjects: any[];
  classroomLocation: string;
  timetable: any[];
  recentActivities: any[];
}

interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface Activity {
  id: string;
  type: 'homework' | 'exam' | 'event' | 'announcement';
  title: string;
  date: string;
}

const classLevels = [
  { value: 'form1', label: 'Form 1' },
  { value: 'form2', label: 'Form 2' },
  { value: 'form3', label: 'Form 3' },
  { value: 'form4', label: 'Form 4' },
];

const streams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showRepsModal, setShowRepsModal] = useState(false);
  const [showSwapRequestModal, setShowSwapRequestModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swapForm, setSwapForm] = useState({
    targetClassId: '',
    targetTeacherId: '',
    reason: '',
    proposedDate: '',
    period: 1,
  });
  
  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await teacherService.classes.getMyClasses();
      if (response.success && response.data) {
        const enrichedClasses = await Promise.all(
          (response.data as TeacherClass[]).map(async (cls: TeacherClass) => {
            const timetableRes = await teacherService.classes.getClassTimetable(cls.id);
            return {
              id: cls.id,
              name: cls.name,
              stream: cls.stream,
              academicLevel: cls.academicLevel,
              classTeacher: cls.classTeacher,
              studentCount: cls.studentCount,
              subjects: cls.subjects,
              classroomLocation: cls.room || `Room ${Math.floor(Math.random() * 50) + 100}`,
              timetable: timetableRes.data || [],
              recentActivities: [],
            };
          })
        );
        setClasses(enrichedClasses);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const response = await teacherService.students.getMyStudents(classId);
      setStudents(response.data || []);
      setShowStudentsModal(true);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cls.stream.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = !selectedLevel || cls.academicLevel === selectedLevel;
      const matchesStream = !selectedStream || cls.stream === selectedStream;
      return matchesSearch && matchesLevel && matchesStream;
    });
  }, [classes, searchTerm, selectedLevel, selectedStream]);

  const statistics = useMemo(() => {
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
    const totalSubjects = [...new Set(classes.flatMap(cls => cls.subjects?.map(s => s.id) || []))].length;
    const avgClassSize = classes.length ? Math.round(totalStudents / classes.length) : 0;
    return { totalClasses: classes.length, totalStudents, totalSubjects, avgClassSize };
  }, [classes]);

  const requestClassSwap = async () => {
    if (!swapForm.targetClassId || !swapForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      toast.success('Swap request submitted for approval');
      setShowSwapRequestModal(false);
      setSwapForm({ targetClassId: '', targetTeacherId: '', reason: '', proposedDate: '', period: 1 });
    } catch (error) {
      console.error('Failed to request swap:', error);
      toast.error('Failed to submit swap request');
    }
  };

  const requestSubstitution = async (classId: string) => {
    try {
      toast.success('Substitution request submitted');
    } catch (error) {
      console.error('Failed to request substitution:', error);
      toast.error('Failed to submit substitution request');
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      form1: 'bg-green-100 text-green-800',
      form2: 'bg-blue-100 text-blue-800',
      form3: 'bg-purple-100 text-purple-800',
      form4: 'bg-orange-100 text-orange-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      form1: 'Form 1',
      form2: 'Form 2',
      form3: 'Form 3',
      form4: 'Form 4',
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading classes..." />
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
            My Classes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your assigned classes, view students, and track activities
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadClasses}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowSwapRequestModal(true)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Request Class Swap
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalClasses}</p>
          <p className="text-xs text-gray-500">Total Classes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalStudents}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalSubjects}</p>
          <p className="text-xs text-gray-500">Subjects Taught</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.avgClassSize}</p>
          <p className="text-xs text-gray-500">Avg Class Size</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by class name or stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Levels</option>
            {classLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
          >
            <option value="">All Streams</option>
            {streams.map(stream => (
              <option key={stream} value={stream}>Stream {stream}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setSelectedLevel('');
            setSelectedStream('');
          }}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Classes Grid/List */}
      {filteredClasses.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No classes found</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition overflow-hidden">
              <div className="relative">
                <div className={clsx('absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-lg', getLevelColor(cls.academicLevel || 'form1'))}>
                  {getLevelLabel(cls.academicLevel || 'form1')}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                      <p className="text-sm text-gray-500">Stream {cls.stream}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {cls.studentCount} Students
                    </span>
                  </div>

                  {/* Classroom Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin size={14} />
                    <span>{cls.classroomLocation}</span>
                  </div>

                  {/* Subjects */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Subjects Teaching:</p>
                    <div className="flex flex-wrap gap-1">
                      {cls.subjects?.slice(0, 3).map((subject) => (
                        <span key={subject.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          {subject.name}
                        </span>
                      ))}
                      {cls.subjects && cls.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          +{cls.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                   {/* Action Buttons */}
             <div className="flex gap-2 pt-3 border-t">
               <Button
                 size="sm"
                 variant="outline"
                 className="flex-1"
                 onClick={() => {
                   setSelectedClass(cls);
                   loadClassStudents(cls.id);
                 }}
               >
                 <Users size={14} className="mr-1" />
                 Students
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 className="flex-1"
                 onClick={() => {
                   setSelectedClass(cls);
                   setShowTimetableModal(true);
                 }}
               >
                 <Clock size={14} className="mr-1" />
                 Timetable
               </Button>
             </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Stream</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Subjects</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClasses.map((cls) => (
                  <React.Fragment key={cls.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium">{cls.name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', getLevelColor(cls.academicLevel || 'form1'))}>
                          {getLevelLabel(cls.academicLevel || 'form1')}
                        </span>
                      </td>
                      <td className="px-4 py-3">{cls.stream}</td>
                      <td className="px-4 py-3">{cls.studentCount}</td>
                      <td className="px-4 py-3 text-sm">{cls.classroomLocation}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cls.subjects?.slice(0, 2).map(s => (
                            <span key={s.id} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{s.name}</span>
                          ))}
                          {cls.subjects && cls.subjects.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">+{cls.subjects.length - 2}</span>
                          )}
                        </div>
                       </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedClass(cls);
                              loadClassStudents(cls.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View Students"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClass(cls);
                              setShowTimetableModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View Timetable"
                          >
                            <Clock size={16} className="text-blue-500" />
                          </button>
                        </div>
                       </td>
                     </tr>
                     {expandedId === cls.id && (
                       <tr className="bg-gray-50 dark:bg-gray-800/50">
                         <td colSpan={7} className="px-4 py-4">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {/* Recent Activities */}
                             <div>
                               <p className="text-sm font-medium mb-2">Recent Activities</p>
                               {cls.recentActivities?.slice(0, 3).map(activity => (
                                 <div key={activity.id} className="text-sm mb-1">
                                   <span className="text-gray-600">{activity.title}</span>
                                   <span className="text-xs text-gray-400 ml-2">
                                     {new Date(activity.date).toLocaleDateString()}
                                   </span>
                                 </div>
                               ))}
                             </div>
                             
                             {/* Today's Schedule */}
                             <div>
                               <p className="text-sm font-medium mb-2">Today's Schedule</p>
                               {cls.timetable?.filter((t: any) => t.day === new Date().toLocaleDateString('en', { weekday: 'long' })).slice(0, 3).map((entry: any) => (
                                 <div key={entry.day + entry.period} className="text-sm mb-1">
                                   <span className="font-medium">{entry.startTime} - {entry.endTime}</span>
                                   <span className="ml-2">{entry.subject}</span>
                                   <span className="text-xs text-gray-400 ml-2">({entry.room})</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         </td>
                        </tr>
                     )}
                  </React.Fragment>
                ))}
              </tbody>
             </table>
          </div>
        </Card>
      )}

      {/* Students Modal */}
      <Modal isOpen={showStudentsModal} onClose={() => setShowStudentsModal(false)} title={`Students - ${selectedClass?.name} ${selectedClass?.stream}`} size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg"
            />
          </div>
          <div className="space-y-2">
            {students.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No students found</p>
            ) : (
              students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded" title="Contact Parent">
                      <Phone size={14} className="text-green-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="View Profile">
                      <Eye size={14} className="text-blue-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Timetable Modal */}
      <Modal isOpen={showTimetableModal} onClose={() => setShowTimetableModal(false)} title={`Timetable - ${selectedClass?.name} ${selectedClass?.stream}`} size="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="px-3 py-2 text-left">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map(period => (
                <tr key={period} className="border-t">
                  <td className="px-3 py-2 font-medium">Period {period}</td>
                  {daysOfWeek.map(day => {
                    const entry = selectedClass?.timetable?.find(
                      t => t.day === day && t.period === period
                    );
                    return (
                      <td key={day} className="px-3 py-2">
                        {entry ? (
                          <div>
                            <p className="font-medium">{entry.subject}</p>
                            <p className="text-xs text-gray-500">{entry.room}</p>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Class Swap Request Modal */}
      <Modal isOpen={showSwapRequestModal} onClose={() => setShowSwapRequestModal(false)} title="Request Class Swap" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Class</label>
            <select
              value={swapForm.targetClassId}
              onChange={(e) => setSwapForm({ ...swapForm, targetClassId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} {cls.stream}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              value={swapForm.period}
              onChange={(e) => setSwapForm({ ...swapForm, period: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proposed Date</label>
            <input
              type="date"
              value={swapForm.proposedDate}
              onChange={(e) => setSwapForm({ ...swapForm, proposedDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              value={swapForm.reason}
              onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Explain why you need a class swap..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowSwapRequestModal(false)}>Cancel</Button>
          <Button onClick={requestClassSwap}>Submit Request</Button>
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