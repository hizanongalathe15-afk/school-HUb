import React, { useState, useEffect } from 'react';
import { Trophy, Users, Zap, Backpack, MapPin, Calendar, Loader2, AlertCircle, FileText, Download } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import parentService from '../../../services/parentService';

interface Sport {
  id: string;
  name: string;
  team: string;
  position: string;
  coachName: string;
  trainingDays: string;
  achievements: string[];
}

interface Club {
  id: string;
  name: string;
  meetingDay: string;
  meetingTime: string;
  moderatorName: string;
  role: string;
  activities: string[];
}

interface Competition {
  id: string;
  name: string;
  date: string;
  category: string;
  status: 'upcoming' | 'completed';
  result?: string;
  award?: string;
}

interface FieldTrip {
  id: string;
  destination: string;
  date: string;
  duration: string;
  cost: number;
  status: 'planning' | 'approved' | 'completed';
  itinerary: string;
  consentRequired: boolean;
  consentProvided: boolean;
}

const ParentExtraCurricular: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sports' | 'clubs' | 'competitions' | 'fieldtrips'>('sports');
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null);

  // Load children
  useEffect(() => {
    const loadChildren = async () => {
      try {
        const response = await parentService.getMyChildren();
        setChildren(response);
        if (response.length > 0) {
          setSelectedChild(response[0].id);
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      }
    };
    loadChildren();
  }, []);

  // Load activity data
  useEffect(() => {
    if (!selectedChild) return;
    
    const loadActivityData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'sports') {
          const data = await parentService.getChildSports(selectedChild);
          setSports(data);
        } else if (activeTab === 'clubs') {
          const data = await parentService.getChildClubs(selectedChild);
          setClubs(data);
        } else if (activeTab === 'competitions') {
          const data = await parentService.getChildCompetitions(selectedChild);
          setCompetitions(data);
        } else if (activeTab === 'fieldtrips') {
          const data = await parentService.getChildFieldTrips(selectedChild);
          setFieldTrips(data);
        }
      } catch (err) {
        setError(`Failed to load ${activeTab} data`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, [selectedChild, activeTab]);

  const handleConsentFieldTrip = async (tripId: string) => {
    try {
      await parentService.consentFieldTrip(selectedChild, tripId);
      setFieldTrips(fieldTrips.map(trip =>
        trip.id === tripId ? { ...trip, consentProvided: true } : trip
      ));
      alert('Consent provided successfully');
    } catch (err) {
      setError('Failed to provide consent');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Extra-Curricular Activities</h1>
          <p className="text-gray-600 dark:text-gray-400">View sports, clubs, competitions, and field trips</p>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Child
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.class}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sports')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'sports'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Trophy className="inline mr-2 w-4 h-4" />
            Sports
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'clubs'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Users className="inline mr-2 w-4 h-4" />
            Clubs
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'competitions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Zap className="inline mr-2 w-4 h-4" />
            Competitions
          </button>
          <button
            onClick={() => setActiveTab('fieldtrips')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'fieldtrips'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <MapPin className="inline mr-2 w-4 h-4" />
            Field Trips
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Sports Tab */}
        {activeTab === 'sports' && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sports.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No sports participation recorded
              </div>
            ) : (
              sports.map((sport) => (
                <div key={sport.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {sport.name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Team:</span> {sport.team}</p>
                    <p><span className="font-medium">Position:</span> {sport.position}</p>
                    <p><span className="font-medium">Coach:</span> {sport.coachName}</p>
                    <p><span className="font-medium">Training Days:</span> {sport.trainingDays}</p>
                    {sport.achievements.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Achievements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {sport.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-400">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Clubs Tab */}
        {activeTab === 'clubs' && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                Not a member of any clubs
              </div>
            ) : (
              clubs.map((club) => (
                <div key={club.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    {club.name}
                  </h3>
                  <div className="space-y-2 text-sm mb-4">
                    <p><span className="font-medium">Role:</span> {club.role}</p>
                    <p><span className="font-medium">Moderator:</span> {club.moderatorName}</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {club.meetingDay} at {club.meetingTime}
                    </p>
                  </div>
                  {club.activities.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Activities:</p>
                      <div className="flex flex-wrap gap-2">
                        {club.activities.map((activity, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Competitions Tab */}
        {activeTab === 'competitions' && !loading && (
          <div className="space-y-4">
            {competitions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No competitions found
              </div>
            ) : (
              competitions.map((comp) => (
                <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{comp.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{comp.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      comp.status === 'upcoming'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    }`}>
                      {comp.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Calendar className="inline mr-2 w-4 h-4" />
                    {new Date(comp.date).toLocaleDateString()}
                  </p>
                  {comp.status === 'completed' && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      {comp.award && (
                        <p><span className="font-medium">Award:</span> {comp.award}</p>
                      )}
                      {comp.result && (
                        <p><span className="font-medium">Result:</span> {comp.result}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Field Trips Tab */}
        {activeTab === 'fieldtrips' && !loading && (
          <div className="space-y-4">
            {fieldTrips.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No field trips scheduled
              </div>
            ) : (
              fieldTrips.map((trip) => (
                <div key={trip.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-500" />
                        {trip.destination}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(trip.date).toLocaleDateString()}
                        </p>
                        <p><span className="font-medium">Duration:</span> {trip.duration}</p>
                        <p><span className="font-medium">Cost:</span> KES {trip.cost.toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Itinerary:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{trip.itinerary}</p>
                    </div>
                  </div>

                  {trip.consentRequired && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      {trip.consentProvided ? (
                        <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Consent provided
                        </p>
                      ) : (
                        <div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">Parental consent required</p>
                          <button
                            onClick={() => handleConsentFieldTrip(trip.id)}
                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                          >
                            Provide Consent
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentExtraCurricular;
