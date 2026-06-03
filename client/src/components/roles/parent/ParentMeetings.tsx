import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  Users,
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  BookOpen,
  Award,
  Send,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Video as VideoIcon,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentChild, ParentMeeting, MeetingSlot } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

const ParentMeetings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<MeetingSlot[]>([]);
  const [myMeetings, setMyMeetings] = useState<ParentMeeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<ParentMeeting[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [meetingFilter, setMeetingFilter] = useState<'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | ''>('');
  const [teacherIdFilter, setTeacherIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState<string>('');
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(true);

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

  const loadSlots = useCallback(async () => {
    if (!startDate && !endDate && !teacherIdFilter) {
      setSlotsError('Please select a date range or teacher to find available slots');
      return;
    }
    
    setSlotsError(null);
    setSlotsLoading(true);
    try {
      const res = await parentService.meetings.getAvailableSlots(
        teacherIdFilter || undefined,
        startDate || undefined,
        endDate || undefined
      );
      if (res?.success && res.data) {
        setAvailableSlots(res.data);
        if (res.data.length === 0) {
          setSlotsError('No available slots found for the selected criteria');
        }
      } else {
        setAvailableSlots([]);
        setSlotsError('Failed to load available slots');
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setSlotsError('Failed to load available slots');
    } finally {
      setSlotsLoading(false);
    }
  }, [teacherIdFilter, startDate, endDate]);

  const loadMyMeetings = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    }
    try {
      const res = await parentService.meetings.getMyMeetings(meetingFilter || undefined);
      if (res?.success && res.data) {
        setMyMeetings(res.data);
      } else {
        setMyMeetings([]);
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setError('Failed to load your meetings');
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [meetingFilter]);

  // Filter and sort meetings
  useEffect(() => {
    let filtered = [...myMeetings];
    
    // Sort by date (soonest first for scheduled, newest first for completed)
    filtered.sort((a, b) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setFilteredMeetings(filtered);
  }, [myMeetings]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadChildren();
        await loadMyMeetings();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadChildren, loadMyMeetings]);

  const bookMeeting = useCallback(async () => {
    if (!selectedChildId) {
      setError('Please select a child');
      return;
    }
    if (!bookingSlotId) {
      setError('Please select a time slot');
      return;
    }

    try {
      const res = await parentService.meetings.bookMeeting(
        bookingSlotId,
        selectedChildId,
        bookNotes || undefined
      );
      if (res?.success) {
        setSuccess('Meeting booked successfully!');
        setBookNotes('');
        setBookingSlotId('');
        setAvailableSlots([]);
        await loadMyMeetings(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Failed to book meeting');
    }
  }, [selectedChildId, bookingSlotId, bookNotes, loadMyMeetings]);

  const cancelMeeting = useCallback(async (meetingId: string) => {
    const reason = prompt('Please provide a reason for canceling the meeting:');
    if (!reason?.trim()) {
      setError('Cancel reason is required');
      return;
    }
    
    try {
      const res = await parentService.meetings.cancelMeeting(meetingId, reason.trim());
      if (res?.success) {
        setSuccess('Meeting cancelled successfully');
        await loadMyMeetings(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.message || 'Failed to cancel meeting');
      }
    } catch (err) {
      console.error('Cancel failed:', err);
      setError('Failed to cancel meeting');
    }
  }, [loadMyMeetings]);

  const rescheduleMeeting = useCallback(async (meetingId: string) => {
    if (!bookingSlotId) {
      setError('Please select a new time slot from available slots');
      return;
    }
    
    try {
      const res = await parentService.meetings.rescheduleMeeting(meetingId, bookingSlotId);
      if (res?.success) {
        setSuccess('Meeting rescheduled successfully');
        setBookingSlotId('');
        setBookNotes('');
        await loadMyMeetings(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.message || 'Failed to reschedule meeting');
      }
    } catch (err) {
      console.error('Reschedule failed:', err);
      setError('Failed to reschedule meeting');
    }
  }, [bookingSlotId, loadMyMeetings]);

  const joinMeeting = useCallback(async (meeting: ParentMeeting) => {
    try {
      const res = await parentService.meetings.joinVideoMeeting(meeting.id);
      if (res?.success && res.data?.meetingUrl) {
        window.open(res.data.meetingUrl, '_blank');
      } else {
        // Fallback - could open a modal with meeting details
        alert(`Meeting Link: ${meeting.meetingLink || 'Link will be provided by teacher'}`);
      }
    } catch (err) {
      console.error('Join failed:', err);
      setError('Failed to join meeting');
    }
  }, []);

  const rateMeeting = useCallback(async (meetingId: string) => {
    const ratingStr = prompt('Please rate the meeting from 1 to 5 stars:');
    const rating = Number(ratingStr);
    if (!rating || rating < 1 || rating > 5) {
      setError('Please enter a valid rating between 1 and 5');
      return;
    }

    const feedback = prompt('Optional feedback for the teacher:') || '';
    try {
      const res = await parentService.meetings.rateMeeting(meetingId, rating, feedback || undefined);
      if (res?.success) {
        setSuccess('Thank you for your feedback!');
        await loadMyMeetings(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating failed:', err);
      setError('Failed to submit rating');
    }
  }, [loadMyMeetings]);

  const getMeetingStatusBadge = useCallback((status: string) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      rescheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    
    const icons = {
      scheduled: <Clock className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
      rescheduled: <RefreshCw className="w-3 h-3" />
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }, []);

  const getMeetingTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in_person': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  }, []);

  const formatDateTime = useCallback((date: string, startTime?: string, endTime?: string) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (startTime && endTime) {
      return `${formattedDate} • ${startTime} - ${endTime}`;
    }
    return formattedDate;
  }, []);

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading meetings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Parent-Teacher Meetings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Schedule, manage, and join virtual or in-person meetings with teachers
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadMyMeetings(true)}
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
            <Button size="sm" onClick={() => setError(null)} className="ml-auto">Dismiss</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Panel */}
        <div>
          <Card className="sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Book a Meeting
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBookingForm(!showBookingForm)}
              >
                {showBookingForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showBookingForm && (
              <div className="space-y-4">
                {/* Child Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Child *
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

                {/* Filters */}
                <div className="space-y-3">
                  <Input
                    label="Teacher ID (Optional)"
                    value={teacherIdFilter}
                    onChange={(e) => setTeacherIdFilter(e.target.value)}
                    placeholder="Enter teacher ID"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {slotsError && (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {slotsError}
                  </div>
                )}

                <Button
                  onClick={loadSlots}
                  isLoading={slotsLoading}
                  fullWidth
                >
                  <Search className="w-4 h-4 mr-1" />
                  Find Available Slots
                </Button>

                {/* Available Slots */}
                {availableSlots.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Slots ({availableSlots.length})
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={clsx(
                            'border rounded-lg p-3 cursor-pointer transition-all',
                            bookingSlotId === slot.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          )}
                          onClick={() => setBookingSlotId(slot.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getMeetingTypeIcon(slot.type)}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {slot.teacherName}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {new Date(slot.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3" />
                                  {slot.location}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Type: {slot.type.replace('_', ' ')}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className={clsx(
                                'w-4 h-4 rounded-full border-2',
                                bookingSlotId === slot.id
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              )}>
                                {bookingSlotId === slot.id && (
                                  <CheckCircle className="w-3 h-3 text-white m-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes for Teacher (Optional)
                  </label>
                  <textarea
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Any specific topics you'd like to discuss..."
                  />
                </div>

                <Button
                  onClick={bookMeeting}
                  disabled={!bookingSlotId}
                  fullWidth
                  variant="primary"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Book Meeting
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* My Meetings Panel */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Meetings
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={meetingFilter}
                  onChange={(e) => setMeetingFilter(e.target.value as any)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {myMeetings.length === 0 
                    ? 'No meetings scheduled yet'
                    : 'No meetings match your filter'}
                </p>
                {myMeetings.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Use the booking panel to schedule a meeting with a teacher
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className={clsx(
                      'border rounded-lg p-4 transition-all cursor-pointer',
                      expandedMeetingId === meeting.id
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                    )}
                    onClick={() => setExpandedMeetingId(expandedMeetingId === meeting.id ? null : meeting.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getMeetingTypeIcon(meeting.type)}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {meeting.teacherName}
                          </span>
                          {getMeetingStatusBadge(meeting.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDateTime(meeting.date, meeting.startTime, meeting.endTime)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-3 h-3" />
                            {meeting.location}
                          </div>
                          {meeting.childName && (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              Child: {meeting.childName}
                            </div>
                          )}
                        </div>

                        {meeting.notes && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {meeting.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {expandedMeetingId === meeting.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Actions */}
                    {expandedMeetingId === meeting.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {(meeting.status === 'scheduled' || meeting.status === 'rescheduled') && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  joinMeeting(meeting);
                                }}
                              >
                                <VideoIcon className="w-4 h-4 mr-1" />
                                Join Meeting
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelMeeting(meeting.id);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!bookingSlotId) {
                                    alert('Please select a new time slot from the booking panel first');
                                    return;
                                  }
                                  rescheduleMeeting(meeting.id);
                                }}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Reschedule
                              </Button>
                            </>
                          )}

                          {meeting.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                rateMeeting(meeting.id);
                              }}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Rate Meeting
                            </Button>
                          )}

                          {meeting.feedback && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Teacher's Feedback:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{meeting.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentMeetings;