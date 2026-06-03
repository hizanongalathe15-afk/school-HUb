import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Trophy, Users, Calendar, Clock, MapPin, Plus, Edit, Trash2,
  Eye, RefreshCw, Search, Filter, Download, Printer, CheckCircle,
  XCircle, AlertCircle, Star, Award, TrendingUp, TrendingDown,
  Medal, Target, Zap, Bell, Send, MessageSquare, FileText,
  Upload, Copy, Repeat, Settings, Music, Bike, Microscope,
  Activity, Heart, Dumbbell, Palette, Globe, Gamepad, Book, Minus
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

interface Team {
  id: string;
  name: string;
  sport: string;
  category: 'boys' | 'girls' | 'mixed';
  ageGroup: string;
  coachId: string;
  coachName: string;
  students: TeamMember[];
  fixtures: Fixture[];
  stats: TeamStats;
  achievements: Achievement[];
}

interface TeamMember {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  position: string;
  role: 'captain' | 'vice_captain' | 'member';
  joinedAt: string;
}

interface Fixture {
  id: string;
  title: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  type: 'friendly' | 'league' | 'tournament' | 'cup';
  result?: {
    score: string;
    outcome: 'win' | 'loss' | 'draw';
  };
  lineup: string[];
  report: string;
}

interface TeamStats {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
  awardType: 'medal' | 'trophy' | 'certificate' | 'recognition';
}

interface Club {
  id: string;
  name: string;
  patronId: string;
  patronName: string;
  description: string;
  meetingDay: string;
  meetingTime: string;
  meetingLocation: string;
  members: ClubMember[];
  activities: ClubActivity[];
}

interface ClubMember {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  role: 'patron' | 'chairperson' | 'secretary' | 'treasurer' | 'member';
  joinedAt: string;
}

interface ClubActivity {
  id: string;
  title: string;
  date: string;
  description: string;
  achievements: string;
}

interface Event {
  id: string;
  title: string;
  type: 'sports' | 'club' | 'field_trip' | 'competition';
  date: string;
  location: string;
  supervisorId: string;
  supervisorName: string;
  participants: EventParticipant[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  report: string | null;
}

interface EventParticipant {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
}

const sportIcons: Record<string, any> = {
  football: Activity,
  basketball: Activity,
  volleyball: Activity,
  athletics: Activity,
  swimming: Activity,
  rugby: Activity,
  hockey: Activity,
  tennis: Activity,
  table_tennis: Activity,
  chess: Gamepad,
  scouting: Users,
  default: Trophy,
};

const clubIcons: Record<string, any> = {
  drama: Music,
  music: Music,
  art: Palette,
  science: Microscope,
  computer: Globe,
  journalism: Book,
  debate: MessageSquare,
  environment: Heart,
  red_cross: Heart,
  default: Users,
};

const TeacherCocurricularPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sports' | 'clubs' | 'events'>('sports');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    sport: '',
    category: 'mixed' as 'boys' | 'girls' | 'mixed',
    ageGroup: '',
  });
  
  const [fixtureFormData, setFixtureFormData] = useState({
    opponent: '',
    date: '',
    time: '',
    location: '',
    type: 'friendly' as 'friendly' | 'league' | 'tournament' | 'cup',
  });
  
  const [clubFormData, setClubFormData] = useState({
    name: '',
    description: '',
    meetingDay: 'Monday',
    meetingTime: '15:00',
    meetingLocation: '',
  });
  
  const [eventFormData, setEventFormData] = useState({
    title: '',
    type: 'competition' as 'sports' | 'club' | 'field_trip' | 'competition',
    date: '',
    location: '',
    description: '',
  });

  const confirmation = useConfirmationDialog();

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sports') {
        const response = await teacherService.cocurricular.getMyTeams();
        if (response.success) setTeams(response.data || []);
      } else if (activeTab === 'clubs') {
        const response = await teacherService.cocurricular.getMyClubs();
        if (response.success) setClubs(response.data || []);
      } else {
        const response = await teacherService.cocurricular.getEvents();
        if (response.success) setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    setLoading(true);
    try {
      const response = await teacherService.cocurricular.createTeam(teamFormData);
      if (response.success) {
        toast.success('Team created successfully');
        setShowTeamModal(false);
        resetTeamForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const createClub = async () => {
    setLoading(true);
    try {
      const response = await teacherService.cocurricular.createClub(clubFormData);
      if (response.success) {
        toast.success('Club created successfully');
        setShowClubModal(false);
        resetClubForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to create club:', error);
      toast.error('Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    setLoading(true);
    try {
      const response = await teacherService.cocurricular.createEvent(eventFormData);
      if (response.success) {
        toast.success('Event scheduled successfully');
        setShowEventModal(false);
        resetEventForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to schedule event');
    } finally {
      setLoading(false);
    }
  };

  const addFixture = async (teamId: string) => {
    setLoading(true);
    try {
      const response = await teacherService.cocurricular.addFixture(teamId, fixtureFormData);
      if (response.success) {
        toast.success('Fixture added');
        setShowFixtureModal(false);
        resetFixtureForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to add fixture:', error);
      toast.error('Failed to add fixture');
    } finally {
      setLoading(false);
    }
  };

  const addClubActivity = async (clubId: string) => {
    setLoading(true);
    try {
      const response = await teacherService.cocurricular.addClubActivity(clubId, {
        title: activityFormData.title,
        date: activityFormData.date,
        description: activityFormData.description,
      });
      if (response.success) {
        toast.success('Activity added');
        setShowActivityModal(false);
        resetActivityForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to add activity:', error);
      toast.error('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const recordFixtureResult = async (teamId: string, fixtureId: string, result: any) => {
    try {
      await teacherService.cocurricular.recordFixtureResult(teamId, fixtureId, result);
      toast.success('Result recorded');
      loadData();
    } catch (error) {
      console.error('Failed to record result:', error);
      toast.error('Failed to record result');
    }
  };

  const registerStudent = async (teamId: string, studentId: string) => {
    try {
      await teacherService.cocurricular.registerForTeam(teamId, studentId);
      toast.success('Student registered');
      loadData();
    } catch (error) {
      console.error('Failed to register student:', error);
      toast.error('Failed to register student');
    }
  };

  const deleteTeam = async (teamId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Team?',
      message: 'This will remove the team and all associated data.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.cocurricular.deleteTeam(teamId);
      toast.success('Team deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Failed to delete team');
    }
  };

  const generateReport = async (type: string, id: string) => {
    try {
      const response = await teacherService.cocurricular.generateReport(type, id);
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    }
  };

  const resetTeamForm = () => {
    setTeamFormData({
      name: '',
      sport: '',
      category: 'mixed',
      ageGroup: '',
    });
  };

  const resetClubForm = () => {
    setClubFormData({
      name: '',
      description: '',
      meetingDay: 'Monday',
      meetingTime: '15:00',
      meetingLocation: '',
    });
  };

  const resetEventForm = () => {
    setEventFormData({
      title: '',
      type: 'competition',
      date: '',
      location: '',
      description: '',
    });
  };

  const resetFixtureForm = () => {
    setFixtureFormData({
      opponent: '',
      date: '',
      time: '',
      location: '',
      type: 'friendly',
    });
  };

  const resetActivityForm = () => {
    setActivityFormData({
      title: '',
      date: '',
      description: '',
    });
  };

  const [activityFormData, setActivityFormData] = useState({
    title: '',
    date: '',
    description: '',
  });

  const filteredTeams = useMemo(() => {
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.sport.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const filteredClubs = useMemo(() => {
    return clubs.filter(club =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clubs, searchTerm]);

  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'win': return <Trophy className="w-4 h-4 text-green-600" />;
      case 'loss': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'draw': return <Minus className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getEventStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ongoing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !teams.length && !clubs.length && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading co-curricular activities..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600" />
            Co-Curricular Activities
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage sports teams, clubs, and events you supervise
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          {activeTab === 'sports' && (
            <Button size="sm" onClick={() => setShowTeamModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Team
            </Button>
          )}
          {activeTab === 'clubs' && (
            <Button size="sm" onClick={() => setShowClubModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Club
            </Button>
          )}
          {activeTab === 'events' && (
            <Button size="sm" onClick={() => setShowEventModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Schedule Event
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('sports')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'sports'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Sports Teams
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'clubs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Clubs & Societies
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'events'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Events & Trips
        </button>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Sports Teams Section */}
      {activeTab === 'sports' && (
        filteredTeams.length === 0 ? (
          <Card className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No sports teams found</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowTeamModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Team
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.sport} • {team.category} • {team.ageGroup}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => generateReport('team', team.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Generate Report"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-xl font-bold text-blue-600">{team.stats.played}</p>
                      <p className="text-xs text-gray-500">Played</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">{team.stats.won}</p>
                      <p className="text-xs text-gray-500">Won</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-yellow-600">{team.stats.drawn}</p>
                      <p className="text-xs text-gray-500">Draws</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-purple-600">{team.stats.points}</p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Team Members ({team.students.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {team.students.slice(0, 5).map((member) => (
                        <span key={member.id} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {member.studentName}
                          {member.role === 'captain' && ' (C)'}
                        </span>
                      ))}
                      {team.students.length > 5 && (
                        <span className="text-xs text-gray-500">+{team.students.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Fixtures */}
                  {team.fixtures.filter(f => new Date(f.date) > new Date()).slice(0, 2).length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Upcoming Fixtures</p>
                      {team.fixtures.filter(f => new Date(f.date) > new Date()).slice(0, 2).map((fixture) => (
                        <div key={fixture.id} className="text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded mb-1">
                          <p className="font-medium">{fixture.opponent}</p>
                          <p className="text-xs text-gray-500">{formatDate(fixture.date)} • {fixture.location}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowFixtureModal(true);
                      }}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Add Fixture
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Clubs Section */}
      {activeTab === 'clubs' && (
        filteredClubs.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No clubs found</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowClubModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Club
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <Card key={club.id} className="hover:shadow-lg transition">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{club.name}</h3>
                      <p className="text-sm text-gray-500">Patron: {club.patronName}</p>
                    </div>
                    <button
                      onClick={() => generateReport('club', club.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Generate Report"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{club.description}</p>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {club.meetingDay}s at {club.meetingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {club.meetingLocation}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Members ({club.members.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {club.members.slice(0, 5).map((member) => (
                        <span key={member.id} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {member.studentName}
                        </span>
                      ))}
                      {club.members.length > 5 && (
                        <span className="text-xs text-gray-500">+{club.members.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedClub(club)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedClub(club);
                        setShowActivityModal(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Activity
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Events Section */}
      {activeTab === 'events' && (
        filteredEvents.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No events scheduled</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowEventModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Schedule Event
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getEventStatusBadge(event.status))}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Supervisor: {event.supervisorName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateReport('event', event.id)}>
                        <Printer className="w-3 h-3 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Create Team Modal */}
      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Create Sports Team" size="md">
        <form onSubmit={(e) => { e.preventDefault(); createTeam(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={teamFormData.name}
              onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Eagles FC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sport *</label>
            <input
              type="text"
              required
              value={teamFormData.sport}
              onChange={(e) => setTeamFormData({ ...teamFormData, sport: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Football, Basketball"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={teamFormData.category}
                onChange={(e) => setTeamFormData({ ...teamFormData, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age Group</label>
              <input
                type="text"
                value={teamFormData.ageGroup}
                onChange={(e) => setTeamFormData({ ...teamFormData, ageGroup: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="e.g., U15, U18"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowTeamModal(false)}>Cancel</Button>
            <Button type="submit">Create Team</Button>
          </div>
        </form>
      </Modal>

      {/* Create Club Modal */}
      <Modal isOpen={showClubModal} onClose={() => setShowClubModal(false)} title="Create Club" size="md">
        <form onSubmit={(e) => { e.preventDefault(); createClub(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Club Name *</label>
            <input
              type="text"
              required
              value={clubFormData.name}
              onChange={(e) => setClubFormData({ ...clubFormData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., Science Club"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={clubFormData.description}
              onChange={(e) => setClubFormData({ ...clubFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Club mission and activities..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Day</label>
              <select
                value={clubFormData.meetingDay}
                onChange={(e) => setClubFormData({ ...clubFormData, meetingDay: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
                <option>Thursday</option><option>Friday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Time</label>
              <input
                type="time"
                value={clubFormData.meetingTime}
                onChange={(e) => setClubFormData({ ...clubFormData, meetingTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meeting Location</label>
            <input
              type="text"
              value={clubFormData.meetingLocation}
              onChange={(e) => setClubFormData({ ...clubFormData, meetingLocation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Room 101, Science Lab, etc."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowClubModal(false)}>Cancel</Button>
            <Button type="submit">Create Club</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Event Modal */}
      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Schedule Event" size="md">
        <form onSubmit={(e) => { e.preventDefault(); createEvent(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={eventFormData.title}
              onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventFormData.type}
              onChange={(e) => setEventFormData({ ...eventFormData, type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="sports">Sports Event</option>
              <option value="club">Club Event</option>
              <option value="field_trip">Field Trip</option>
              <option value="competition">Competition</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={eventFormData.date}
                onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={eventFormData.location}
                onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button type="submit">Schedule Event</Button>
          </div>
        </form>
      </Modal>

      {/* Add Fixture Modal */}
      <Modal isOpen={showFixtureModal} onClose={() => setShowFixtureModal(false)} title="Add Fixture" size="md">
        <form onSubmit={(e) => { e.preventDefault(); if (selectedTeam) addFixture(selectedTeam.id); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Opponent *</label>
            <input
              type="text"
              required
              value={fixtureFormData.opponent}
              onChange={(e) => setFixtureFormData({ ...fixtureFormData, opponent: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={fixtureFormData.date}
                onChange={(e) => setFixtureFormData({ ...fixtureFormData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                value={fixtureFormData.time}
                onChange={(e) => setFixtureFormData({ ...fixtureFormData, time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={fixtureFormData.location}
              onChange={(e) => setFixtureFormData({ ...fixtureFormData, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixture Type</label>
            <select
              value={fixtureFormData.type}
              onChange={(e) => setFixtureFormData({ ...fixtureFormData, type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="friendly">Friendly</option>
              <option value="league">League</option>
              <option value="tournament">Tournament</option>
              <option value="cup">Cup</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowFixtureModal(false)}>Cancel</Button>
            <Button type="submit">Add Fixture</Button>
          </div>
        </form>
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
};

export default TeacherCocurricularPage;