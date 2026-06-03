import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  Gift,
  Music,
  Trophy,
  BookOpen,
  Briefcase,
  Home,
  UserCheck
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentChild, SchoolEvent } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

const ParentEvents: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SchoolEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const loadEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const res = await parentService.events.getEvents(
        typeFilter || undefined,
        startDate || undefined,
        endDate || undefined,
        selectedChildId || undefined
      );
      
      if (res?.success && res.data) {
        setEvents(res.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, startDate, endDate, selectedChildId]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...events];
    
    // Sort by date (upcoming first)
    filtered.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setFilteredEvents(filtered);
  }, [events]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadChildren();
        await loadEvents();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadChildren, loadEvents]);

  const handleRSVP = useCallback(async (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    setRsvpLoadingId(eventId);
    setError(null);
    
    try {
      const res = await parentService.events.rsvpToEvent(eventId, status, selectedChildId || undefined);
      if (res?.success) {
        await loadEvents(true);
        setSuccess(`RSVP updated to ${status} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.message || 'RSVP failed. Please try again.');
      }
    } catch (err) {
      console.error('RSVP failed:', err);
      setError('Failed to submit RSVP. Please try again.');
    } finally {
      setRsvpLoadingId(null);
    }
  }, [selectedChildId, loadEvents]);

  const handleRefresh = useCallback(() => {
    loadEvents(true);
  }, [loadEvents]);

  const getEventIcon = useCallback((type: string) => {
    const icons: Record<string, React.ReactNode> = {
      academic: <BookOpen className="w-5 h-5" />,
      sports: <Trophy className="w-5 h-5" />,
      cultural: <Music className="w-5 h-5" />,
      meeting: <Users className="w-5 h-5" />,
      holiday: <Gift className="w-5 h-5" />,
      workshop: <Briefcase className="w-5 h-5" />,
      parent_teacher: <UserCheck className="w-5 h-5" />
    };
    return icons[type] || <Calendar className="w-5 h-5" />;
  }, []);

  const getEventTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      sports: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      meeting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      holiday: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      workshop: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      parent_teacher: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }, []);

  const getRSVPStatusBadge = useCallback((status: string) => {
    const variants: Record<string, string> = {
      attending: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      maybe: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      not_attending: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    const labels: Record<string, string> = {
      attending: 'Attending',
      maybe: 'Maybe',
      not_attending: 'Not Attending'
    };
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[status])}>
        {status === 'attending' && <CheckCircle className="w-3 h-3" />}
        {status === 'maybe' && <AlertCircle className="w-3 h-3" />}
        {status === 'not_attending' && <XCircle className="w-3 h-3" />}
        {labels[status]}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }, []);

  const isUpcoming = useCallback((dateString: string) => {
    return new Date(dateString) >= new Date();
  }, []);

  const upcomingEvents = useMemo(() => 
    filteredEvents.filter(e => isUpcoming(e.date)),
    [filteredEvents, isUpcoming]
  );

  const pastEvents = useMemo(() => 
    filteredEvents.filter(e => !isUpcoming(e.date)),
    [filteredEvents, isUpcoming]
  );

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = upcomingEvents.length;
    const past = pastEvents.length;
    const rsvpConfirmed = events.filter(e => e.isRsvped && e.rsvpStatus === 'attending').length;
    
    return { total, upcoming, past, rsvpConfirmed };
  }, [events, upcomingEvents, pastEvents]);

  if (loading && events.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading events..." />
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
            School Events
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Stay informed about upcoming events, meetings, and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Events</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Upcoming</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.past}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Past</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.rsvpConfirmed}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">RSVP Confirmed</p>
        </Card>
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

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Child (Context)
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
              Event Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="academic">Academic</option>
              <option value="sports">Sports</option>
              <option value="cultural">Cultural</option>
              <option value="meeting">Meeting</option>
              <option value="holiday">Holiday</option>
              <option value="workshop">Workshop</option>
              <option value="parent_teacher">Parent-Teacher</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {typeFilter || startDate || endDate 
                ? 'No events match your filters' 
                : 'No events scheduled at this time'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Upcoming Events
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    expandedEventId={expandedEventId}
                    setExpandedEventId={setExpandedEventId}
                    rsvpLoadingId={rsvpLoadingId}
                    onRSVP={handleRSVP}
                    getEventIcon={getEventIcon}
                    getEventTypeColor={getEventTypeColor}
                    getRSVPStatusBadge={getRSVPStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                Past Events
              </h2>
              <div className="space-y-3 opacity-75">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    expandedEventId={expandedEventId}
                    setExpandedEventId={setExpandedEventId}
                    rsvpLoadingId={rsvpLoadingId}
                    onRSVP={handleRSVP}
                    getEventIcon={getEventIcon}
                    getEventTypeColor={getEventTypeColor}
                    getRSVPStatusBadge={getRSVPStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate component for event card to keep code organized
interface EventCardProps {
  event: SchoolEvent;
  expandedEventId: string | null;
  setExpandedEventId: (id: string | null) => void;
  rsvpLoadingId: string | null;
  onRSVP: (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => void;
  getEventIcon: (type: string) => React.ReactNode;
  getEventTypeColor: (type: string) => string;
  getRSVPStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  expandedEventId,
  setExpandedEventId,
  rsvpLoadingId,
  onRSVP,
  getEventIcon,
  getEventTypeColor,
  getRSVPStatusBadge,
  formatDate,
}) => {
  const isExpanded = expandedEventId === event.id;
  const isUpcoming = new Date(event.date) >= new Date();
  
  return (
    <Card
      className={clsx(
        'transition-all cursor-pointer',
        event.isRsvped && 'border-l-4 border-l-green-500',
        !isUpcoming && 'opacity-75'
      )}
      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 min-w-[80px]">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {new Date(event.date).getDate()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(event.date).toLocaleString('default', { month: 'short' })}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize', getEventTypeColor(event.type))}>
              {getEventIcon(event.type)}
              {event.type.replace('_', ' ')}
            </span>
            {event.isRsvped && getRSVPStatusBadge(event.rsvpStatus || 'attending')}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {event.title}
          </h3>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.startTime} - {event.endTime}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(event.date)}
            </div>
          </div>

          <p className={clsx(
            'text-gray-600 dark:text-gray-400',
            !isExpanded && 'line-clamp-2'
          )}>
            {event.description}
          </p>

          {isExpanded && event.rsvpDeadline && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm">
              <Bell className="w-4 h-4 inline mr-1 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-400">
                RSVP Deadline: {new Date(event.rsvpDeadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* RSVP Actions */}
        {isUpcoming && event.rsvpRequired && !event.isRsvped && (
          <div className="flex-shrink-0 flex flex-row lg:flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              onClick={() => onRSVP(event.id, 'attending')}
              isLoading={rsvpLoadingId === event.id}
              className="whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRSVP(event.id, 'maybe')}
              isLoading={rsvpLoadingId === event.id}
            >
              Maybe
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRSVP(event.id, 'not_attending')}
              isLoading={rsvpLoadingId === event.id}
            >
              <XCircle className="w-4 h-4 mr-1" />
              No
            </Button>
          </div>
        )}

        {isUpcoming && event.rsvpRequired && event.isRsvped && (
          <div className="flex-shrink-0 text-center">
            <div className="text-sm text-green-600 dark:text-green-400">
              ✓ RSVP Confirmed
            </div>
          </div>
        )}

        {isUpcoming && !event.rsvpRequired && (
          <div className="flex-shrink-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No RSVP required
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ParentEvents;