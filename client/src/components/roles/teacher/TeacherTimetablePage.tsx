import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar, Clock, MapPin, RefreshCw, AlertCircle, ChevronLeft,
  ChevronRight, BookOpen, Users, Bell, Edit, Save, X,
  CheckCircle, XCircle, Clock as ClockIcon, Plus, Trash2,
  Copy, Repeat, Filter, Search, Download, Printer,
  Menu, Move, Eye, EyeOff, MessageSquare, Star, Settings
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TeacherTimetable as BaseTeacherTimetable } from '../../../types/teacher';
import { downloadFromServiceData } from '../../../utils/fileDownload';

interface TimetableSlotView {
  id: string;
  day: string;
  dayIndex: number;
  period: number;
  periodStart: string;
  periodEnd: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  room: string;
  teacherId: string;
  teacherName: string;
  isSubstitution: boolean;
  originalTeacherId?: string;
  substituteRequestId?: string;
  notes?: string;
  color?: string;
}

type TeacherTimetable = BaseTeacherTimetable & {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  slots: TimetableSlotView[];
  substitutions: Substitution[];
  swaps: SwapRequest[];
};

interface Substitution {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  slotId: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestedAt: string;
  approvedAt?: string;
}

interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetTeacherId: string;
  targetTeacherName: string;
  requesterSlotId: string;
  targetSlotId: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestedAt: string;
  respondedAt?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  stream: string;
  room: string;
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAYS_INDEX = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

const PERIODS = [
  { number: 1, start: '8:00', end: '8:40' },
  { number: 2, start: '8:40', end: '9:20' },
  { number: 3, start: '9:40', end: '10:20' },
  { number: 4, start: '10:20', end: '11:00' },
  { number: 5, start: '11:00', end: '11:40' },
  { number: 6, start: '12:40', end: '13:20' },
  { number: 7, start: '13:20', end: '14:00' },
  { number: 8, start: '14:00', end: '14:40' },
];

const periodColors = [
  'bg-blue-100 border-blue-300 dark:bg-blue-900/30',
  'bg-green-100 border-green-300 dark:bg-green-900/30',
  'bg-purple-100 border-purple-300 dark:bg-purple-900/30',
  'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30',
  'bg-pink-100 border-pink-300 dark:bg-pink-900/30',
  'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30',
  'bg-red-100 border-red-300 dark:bg-red-900/30',
  'bg-teal-100 border-teal-300 dark:bg-teal-900/30',
];

const TeacherTimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TeacherTimetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'calendar'>('table');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlotView | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotView | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [swapTargetSlot, setSwapTargetSlot] = useState<TimetableSlotView | null>(null);
  
  const [requestFormData, setRequestFormData] = useState({
    type: 'swap' as 'swap' | 'substitution',
    reason: '',
    preferredDate: '',
    notes: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    subjectId: '',
    classId: '',
    room: '',
    notes: '',
  });
  
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);

  const confirmation = useConfirmationDialog();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load initial data
  useEffect(() => {
    loadTimetable();
    loadClassesAndSubjects();
  }, [currentWeekOffset]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const response = await teacherService.timetable.getMyTimetable({ weekOffset: currentWeekOffset });
      if (response.success && response.data) {
        setTimetable(response.data);
      }
    } catch (error) {
      console.error('Failed to load timetable:', error);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const loadClassesAndSubjects = async () => {
    try {
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        teacherService.classes.getAllClasses(),
        teacherService.subjects.getAllSubjects(),
        teacherService.users.getTeachers(),
      ]);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (teachersRes.success) setTeachers(teachersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getSlot = (day: string, periodNumber: number): TimetableSlotView | undefined => {
    return timetable?.slots.find(s => s.day === day && s.period === periodNumber);
  };

  const requestSwap = async (targetSlotId: string) => {
    if (!selectedSlot) return;
    
    try {
      const response = await teacherService.timetable.requestSwap({
        requesterSlotId: selectedSlot.id,
        targetSlotId,
        reason: requestFormData.reason,
        preferredDate: requestFormData.preferredDate,
      });
      
      if (response.success) {
        toast.success('Swap request sent');
        setShowSwapModal(false);
        setSelectedSlot(null);
        setSwapTargetSlot(null);
        loadTimetable();
      }
    } catch (error) {
      console.error('Failed to request swap:', error);
      toast.error('Failed to request swap');
    }
  };

  const requestSubstitution = async () => {
    if (!selectedSlot) return;
    
    try {
      const response = await teacherService.timetable.requestSubstitution({
        slotId: selectedSlot.id,
        date: requestFormData.preferredDate,
        reason: requestFormData.reason,
        notes: requestFormData.notes,
      });
      
      if (response.success) {
        toast.success('Substitution request submitted');
        setShowSubstituteModal(false);
        setSelectedSlot(null);
        loadTimetable();
      }
    } catch (error) {
      console.error('Failed to request substitution:', error);
      toast.error('Failed to request substitution');
    }
  };

  const updateSlot = async () => {
    if (!editingSlot) return;
    
    setSaving(true);
    try {
      const response = await teacherService.timetable.updateSlot(editingSlot.id, editFormData);
      if (response.success) {
        toast.success('Schedule updated');
        setShowEditModal(false);
        setEditingSlot(null);
        loadTimetable();
      }
    } catch (error) {
      console.error('Failed to update slot:', error);
      toast.error('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (!over || active.id === over.id) return;
    
    const activeSlot = timetable?.slots.find(s => s.id === active.id);
    const overSlot = timetable?.slots.find(s => s.id === over.id);
    
    if (!activeSlot || !overSlot) return;
    
    // Check if swapping with another teacher's slot
    if (activeSlot.teacherId !== overSlot.teacherId) {
      setSelectedSlot(activeSlot);
      setSwapTargetSlot(overSlot);
      setShowSwapModal(true);
      return;
    }
    
    // Swap within same teacher's schedule
    try {
      await teacherService.timetable.swapSlots(activeSlot.id, overSlot.id);
      toast.success('Schedule updated');
      loadTimetable();
    } catch (error) {
      console.error('Failed to swap slots:', error);
      toast.error('Failed to swap slots');
    }
  };

  const exportTimetable = async (format: 'pdf' | 'excel') => {
    try {
      const response = await teacherService.timetable.exportTimetable({ format, weekOffset: currentWeekOffset });
      downloadFromServiceData(response.data, `timetable_week_${currentWeekOffset}.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export timetable');
    }
  };

  const getWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (currentWeekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      formatted: `${startOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}`
    };
  };

  const weekRange = getWeekRange();

  const SortableSlot = ({ slot, day, period }: { slot?: TimetableSlotView; day: string; period: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: slot?.id || `${day}-${period}`,
      disabled: !slot,
    });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    
    if (!slot) {
      return (
        <td className="p-2" ref={setNodeRef} style={style}>
          <div className="p-3 text-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-[100px]">
            Free Period
          </div>
        </td>
      );
    }
    
    return (
      <td className="p-2" ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div
          className={clsx(
            'p-3 rounded-lg border-l-4 cursor-move transition-all hover:shadow-md',
            periodColors[period % periodColors.length],
            slot.isSubstitution && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
          )}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSlot(slot);
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">{slot.subjectName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{slot.className}</p>
              {slot.room && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={10} />
                  {slot.room}
                </p>
              )}
            </div>
            {slot.isSubstitution && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Sub</span>
            )}
          </div>
          {slot.notes && (
            <p className="text-xs text-gray-500 mt-2 truncate">{slot.notes}</p>
          )}
        </div>
      </td>
    );
  };

  if (loading && !timetable) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading timetable..." />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              My Timetable
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage your weekly teaching schedule
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'calendar' && 'bg-white dark:bg-gray-700 shadow')}
              >
                Calendar
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportTimetable('pdf')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadTimetable}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowRequestModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Request Change
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <Card>
          <div className="p-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Week
            </Button>
            <div className="text-center">
              <p className="font-semibold">{weekRange.formatted}</p>
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                Current Week
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            >
              Next Week
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>

        {/* Timetable Grid */}
        {viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left font-semibold w-24">Time</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 text-left font-semibold min-w-[180px]">
                        {day}
                        <p className="text-xs font-normal text-gray-500 mt-1">
                          {weekRange.start.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {PERIODS.map((period) => (
                    <tr key={period.number}>
                      <td className="p-2 align-top">
                        <div className="p-2">
                          <p className="font-medium">Period {period.number}</p>
                          <p className="text-xs text-gray-500">{period.start} - {period.end}</p>
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const slot = getSlot(day, period.number);
                        return (
                          <SortableSlot key={`${day}-${period.number}`} slot={slot} day={day} period={period.number - 1} />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {DAYS.map(day => {
              const daySlots = timetable?.slots.filter(s => s.day === day).sort((a, b) => a.period - b.period);
              if (!daySlots?.length) return null;
              
              return (
                <Card key={day}>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-3">{day}</h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={clsx(
                            'flex items-center justify-between p-3 rounded-lg cursor-pointer hover:shadow-md transition',
                            periodColors[slot.period % periodColors.length]
                          )}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-20">
                              <p className="font-medium">Period {slot.period}</p>
                              <p className="text-xs text-gray-500">
                                {PERIODS[slot.period - 1].start} - {PERIODS[slot.period - 1].end}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold">{slot.subjectName}</p>
                              <p className="text-sm text-gray-600">{slot.className}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {slot.room && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin size={14} />
                                {slot.room}
                              </span>
                            )}
                            {slot.isSubstitution && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                                Substitution
                              </span>
                            )}
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlot(slot);
                              setEditFormData({
                                subjectId: slot.subjectId,
                                classId: slot.classId,
                                room: slot.room,
                                notes: slot.notes || '',
                              });
                              setShowEditModal(true);
                            }}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {DAYS.map(day => {
              const daySlots = timetable?.slots.filter(s => s.day === day).sort((a, b) => a.period - b.period);
              return (
                <Card key={day}>
                  <div className="p-4">
                    <h3 className="font-semibold text-center mb-3">{day}</h3>
                    <div className="space-y-2">
                      {daySlots?.length ? (
                        daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={clsx(
                              'p-2 rounded-lg cursor-pointer hover:shadow-md transition text-sm',
                              periodColors[slot.period % periodColors.length]
                            )}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <p className="font-medium">{slot.period}: {slot.subjectName}</p>
                            <p className="text-xs text-gray-600">{slot.className}</p>
                            {slot.room && <p className="text-xs text-gray-500">{slot.room}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 text-sm py-4">No classes</div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded border-l-4 border-blue-300"></div>
                <span>Scheduled Class</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 rounded border-l-4 border-yellow-500"></div>
                <span>Substitution Class</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span>Free Period</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon size={14} className="text-gray-500" />
                <span>Drag to swap classes</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Slot Details Modal */}
        <Modal isOpen={!!selectedSlot && !showSwapModal && !showSubstituteModal} onClose={() => setSelectedSlot(null)} title="Class Details" size="md">
          {selectedSlot && (
            <div className="space-y-4">
              <div className={clsx('p-4 rounded-lg', periodColors[selectedSlot.period % periodColors.length])}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{selectedSlot.subjectName}</h3>
                    <p className="text-gray-600">{selectedSlot.subjectCode}</p>
                  </div>
                  {selectedSlot.isSubstitution && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">Substitution</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium">{selectedSlot.className}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium">Period {selectedSlot.period}</p>
                  <p className="text-sm text-gray-500">
                    {PERIODS[selectedSlot.period - 1].start} - {PERIODS[selectedSlot.period - 1].end}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="font-medium">{selectedSlot.room || 'Not assigned'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Day</p>
                  <p className="font-medium">{selectedSlot.day}</p>
                </div>
              </div>

              {selectedSlot.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm">{selectedSlot.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setEditingSlot(selectedSlot);
                  setEditFormData({
                    subjectId: selectedSlot.subjectId,
                    classId: selectedSlot.classId,
                    room: selectedSlot.room,
                    notes: selectedSlot.notes || '',
                  });
                  setShowEditModal(true);
                  setSelectedSlot(null);
                }}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Class
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowSubstituteModal(true);
                }}>
                  <Users className="w-4 h-4 mr-1" />
                  Request Substitution
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowSwapModal(true);
                }}>
                  <Repeat className="w-4 h-4 mr-1" />
                  Swap with Another Class
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Swap Request Modal */}
        <Modal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} title="Request Class Swap" size="md">
          <div className="space-y-4">
            {selectedSlot && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">Your Class</p>
                  <p>{selectedSlot.subjectName} - {selectedSlot.className}</p>
                  <p className="text-xs text-gray-500">{selectedSlot.day}, Period {selectedSlot.period}</p>
                </div>
                
                {swapTargetSlot && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm font-medium">Target Class</p>
                    <p>{swapTargetSlot.subjectName} - {swapTargetSlot.className}</p>
                    <p className="text-xs text-gray-500">{swapTargetSlot.day}, Period {swapTargetSlot.period}</p>
                    <p className="text-xs text-gray-500 mt-1">Teacher: {swapTargetSlot.teacherName}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Swap</label>
                  <textarea
                    rows={3}
                    value={requestFormData.reason}
                    onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Explain why you want to swap..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={requestFormData.preferredDate}
                    onChange={(e) => setRequestFormData({ ...requestFormData, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSwapModal(false)}>Cancel</Button>
              <Button onClick={() => swapTargetSlot && requestSwap(swapTargetSlot.id)}>
                Send Swap Request
              </Button>
            </div>
          </div>
        </Modal>

        {/* Substitution Request Modal */}
        <Modal isOpen={showSubstituteModal} onClose={() => setShowSubstituteModal(false)} title="Request Substitution" size="md">
          <div className="space-y-4">
            {selectedSlot && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">Class Details</p>
                  <p>{selectedSlot.subjectName} - {selectedSlot.className}</p>
                  <p>{selectedSlot.day}, Period {selectedSlot.period}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Absence</label>
                  <input
                    type="date"
                    value={requestFormData.preferredDate}
                    onChange={(e) => setRequestFormData({ ...requestFormData, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <textarea
                    rows={3}
                    value={requestFormData.reason}
                    onChange={(e) => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Sick leave, training, emergency, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes</label>
                  <textarea
                    rows={2}
                    value={requestFormData.notes}
                    onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Any specific instructions for the substitute..."
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSubstituteModal(false)}>Cancel</Button>
              <Button onClick={requestSubstitution}>Submit Request</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Slot Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Schedule" size="md">
          <div className="space-y-4">
            {editingSlot && (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p>{editingSlot.day}, Period {editingSlot.period}</p>
                  <p className="text-sm text-gray-500">
                    {PERIODS[editingSlot.period - 1].start} - {PERIODS[editingSlot.period - 1].end}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    value={editFormData.subjectId}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Class</label>
                  <select
                    value={editFormData.classId}
                    onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.stream}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Room</label>
                  <input
                    type="text"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="e.g., Room 201, Science Lab"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={updateSlot} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.cancel}
          onConfirm={confirmation.handleConfirm}
          title={confirmation.config.title}
          message={confirmation.config.message}
          confirmText={confirmation.config.confirmText}
          cancelText={confirmation.config.cancelText}
          type={confirmation.config.type}
        />
      </div>
    </DndContext>
  );
};

export default TeacherTimetablePage;