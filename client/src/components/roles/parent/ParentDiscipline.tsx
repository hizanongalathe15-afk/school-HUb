import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Calendar,
  User,
  BookOpen,
  Activity,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Filter
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentChild, DisciplineRecord, Streak } from '../../../types/parent';
import { Spinner } from '../../ui/Spinner';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { clsx } from 'clsx';

const ParentDiscipline: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative'>('all');
  const [error, setError] = useState<string | null>(null);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const filteredRecords = useMemo(() => {
    if (filterType === 'all') return records;
    return records.filter(record => record.type === filterType);
  }, [records, filterType]);

  const statistics = useMemo(() => {
    const positive = records.filter(r => r.type === 'positive').length;
    const negative = records.filter(r => r.type === 'negative').length;
    const totalPoints = records.reduce((sum, r) => sum + (r.type === 'positive' ? r.points : -r.points), 0);
    const recentRecords = [...records].sort((a, b) => 
      new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
    ).slice(0, 5);
    
    return { positive, negative, totalPoints, recentRecords };
  }, [records]);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentService.children.getMyChildren();
      if (res?.success && res.data) {
        setChildren(res.data);
        if (res.data[0]) setSelectedChildId(res.data[0].id);
      } else {
        setError('Failed to load children data');
      }
    } catch (err) {
      setError('An error occurred while loading children');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, sRes] = await Promise.all([
        parentService.discipline.getDisciplineRecords(childId),
        parentService.discipline.getStreaks(childId),
      ]);

      if (rRes?.success && rRes.data) setRecords(rRes.data);
      if (sRes?.success && sRes.data) setStreaks(sRes.data);
    } catch (err) {
      setError('Failed to load discipline data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) loadAll(selectedChildId);
  }, [selectedChildId, loadAll]);

  const getStreakIcon = (type: Streak['type']) => {
    const icons = {
      attendance: <Calendar className="w-4 h-4" />,
      academic: <BookOpen className="w-4 h-4" />,
      cleanliness: <Sparkles className="w-4 h-4" />,
      behavior: <Activity className="w-4 h-4" />,
    };
    return icons[type] || <Trophy className="w-4 h-4" />;
  };

  const getStreakLabel = (type: Streak['type']): string => {
    const labels = {
      attendance: 'Attendance',
      academic: 'Academic',
      cleanliness: 'Cleanliness',
      behavior: 'Behavior',
    };
    return labels[type] || type;
  };

  const renderStreakCard = (s: Streak) => {
    const progressPercent = s.bestStreak > 0 ? (s.currentStreak / s.bestStreak) * 100 : 0;
    
    return (
      <div key={s.type} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-blue-600 dark:text-blue-400">
              {getStreakIcon(s.type)}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getStreakLabel(s.type)}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="w-3 h-3 text-yellow-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Best: {s.bestStreak}
            </span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {s.currentStreak}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              current streak
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 rounded-full h-2 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {s.lastUpdated && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              Updated: {new Date(s.lastUpdated).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getRecordIcon = (type: string) => {
    if (type === 'positive') return <ThumbsUp className="w-4 h-4 text-green-600" />;
    return <ThumbsDown className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    
    return clsx(
      'px-2 py-0.5 rounded-full text-xs font-medium',
      variants[status as keyof typeof variants] || variants.pending
    );
  };

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading discipline data..." />
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadChildren} variant="primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discipline Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your child's behavior, achievements, and progress
          </p>
        </div>
      </div>

      {/* Child Selector */}
      <Card padding>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          {selectedChild && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Class: {selectedChild.className}</span>
              </div>
              {selectedChild.streamName && (
                <div className="text-gray-400">• {selectedChild.streamName}</div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
              <p className={clsx(
                'text-2xl font-bold',
                statistics.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {statistics.totalPoints > 0 ? `+${statistics.totalPoints}` : statistics.totalPoints}
              </p>
            </div>
            <TrendingUp className={clsx(
              'w-8 h-8',
              statistics.totalPoints >= 0 ? 'text-green-500' : 'text-red-500'
            )} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Merits (Positive)</p>
              <p className="text-2xl font-bold text-green-600">{statistics.positive}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Demerits (Negative)</p>
              <p className="text-2xl font-bold text-red-600">{statistics.negative}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Streaks Section */}
      <Card title="Streaks & Achievements" className="overflow-hidden">
        {streaks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No streak data available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {streaks.map(renderStreakCard)}
          </div>
        )}
      </Card>

      {/* Discipline Records Section */}
      <Card 
        title="Discipline Records"
        header={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'primary' : 'ghost'}
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterType === 'positive' ? 'primary' : 'ghost'}
              onClick={() => setFilterType('positive')}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Merits
            </Button>
            <Button
              size="sm"
              variant={filterType === 'negative' ? 'primary' : 'ghost'}
              onClick={() => setFilterType('negative')}
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              Demerits
            </Button>
          </div>
        }
      >
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filterType === 'all' 
              ? 'No discipline records found'
              : `No ${filterType} records found`
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Points</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRecordIcon(rec.type)}
                        <span className="capitalize text-gray-900 dark:text-white">
                          {rec.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {rec.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'font-semibold',
                        rec.type === 'positive' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {rec.type === 'positive' ? `+${rec.points}` : `-${rec.points}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {rec.issuedDate ? new Date(rec.issuedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(rec.status)}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredRecords.length} record(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default ParentDiscipline;