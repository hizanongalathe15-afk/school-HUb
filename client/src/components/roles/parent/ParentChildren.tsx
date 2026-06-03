import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  BookOpen, 
  Award, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  RefreshCw,
  ChevronRight,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentChild } from '../../../types/parent';
import ParentLinkStudentForm from './ParentLinkStudentForm';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const ParentChildren: React.FC = () => {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation('parent');

  const loadChildren = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const response = await parentService.children.getMyChildren();
      if (response.success && response.data) {
        setChildren(response.data);
        if (response.data.length > 0) {
          if (selectedChild) {
            const stillExists = response.data.find(c => c.id === selectedChild.id);
            if (stillExists) {
              setSelectedChild(stillExists);
            } else {
              setSelectedChild(response.data[0]);
            }
          } else {
            setSelectedChild(response.data[0]);
          }
        } else {
          setSelectedChild(null);
        }
      } else {
        setError(t('parent.children.failedToLoad'));
      }
    } catch (error) {
      console.error('Error loading children:', error);
      setError(t('parent.children.failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChild, t]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const handleChildLinked = useCallback(() => {
    loadChildren(true);
  }, [loadChildren]);

  const stats = useMemo(() => {
    if (children.length === 0) return null;
    
    const totalMerits = children.reduce((sum, child) => sum + child.currentTermStats.meritsCount, 0);
    const totalDemerits = children.reduce((sum, child) => sum + child.currentTermStats.demeritsCount, 0);
    const avgAttendance = children.reduce((sum, child) => sum + child.currentTermStats.attendancePercentage, 0) / children.length;
    
    return {
      totalMerits,
      totalDemerits,
      avgAttendance: Math.round(avgAttendance),
      totalChildren: children.length
    };
  }, [children]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label={t('parent.common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {t('parent.children.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('parent.children.subtitle')}
          </p>
        </div>
        {children.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadChildren(true)}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('parent.common.refresh')}
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button size="sm" onClick={() => loadChildren()} className="ml-auto">
              {t('parent.common.tryAgain')}
            </Button>
          </div>
        </Card>
      )}

      {/* No Children - Show Link Form */}
      {children.length === 0 && !error && (
        <Card>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('parent.children.noChildren')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('parent.children.noChildrenDesc')}
            </p>
            <ParentLinkStudentForm onLinked={handleChildLinked} />
          </div>
        </Card>
      )}

      {/* Children Grid */}
      {children.length > 0 && stats && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalChildren}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('parent.children.totalChildren')}</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalMerits}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('parent.children.totalMerits')}</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.totalDemerits}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('parent.children.totalDemerits')}</p>
            </Card>
          </div>

          {/* Children Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {children.map((child) => (
              <Card
                key={child.id}
                className={clsx(
                  'cursor-pointer transition-all duration-200 hover:shadow-lg',
                  selectedChild?.id === child.id && 'ring-2 ring-blue-500 shadow-lg'
                )}
                onClick={() => setSelectedChild(child)}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {child.photo ? (
                      <img
                        src={child.photo}
                        alt={`${child.firstName} ${child.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {child.firstName[0]}{child.lastName[0]}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('parent.children.admission')}: {child.admissionNumber}
                        </p>
                      </div>
                      <ChevronRight className={clsx(
                        'w-5 h-5 text-gray-400 transition-transform',
                        selectedChild?.id === child.id && 'transform translate-x-1'
                      )} />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {child.className}{child.streamName ? ` - ${child.streamName}` : ''}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center">
                        <p className={clsx('text-lg font-bold', getAttendanceColor(child.currentTermStats.attendancePercentage))}>
                          {child.currentTermStats.attendancePercentage}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.attendancePercent')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {child.currentTermStats.meritsCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.merits')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">
                          {child.currentTermStats.demeritsCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.demerits')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Link Another Child */}
          <div className="flex justify-center">
            <ParentLinkStudentForm onLinked={handleChildLinked} />
          </div>

          {/* Detailed Child Panel */}
          {selectedChild && (
            <Card title={`${selectedChild.firstName} ${selectedChild.lastName}`} className="overflow-hidden">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    {t('parent.children.personalInfo' || 'Personal Information')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{t('parent.children.admission')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedChild.admissionNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{t('parent.common.class')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedChild.className}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{t('parent.children.dateOfBirth')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedChild.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{t('parent.children.gender')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedChild.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {selectedChild.medicalInfo && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-red-500" />
                      {t('parent.children.medicalInfo')}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedChild.medicalInfo.bloodGroup && (
                        <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.bloodGroup')}:</strong> {selectedChild.medicalInfo.bloodGroup}</p>
                      )}
                      {selectedChild.medicalInfo.allergies && selectedChild.medicalInfo.allergies.length > 0 && (
                        <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.allergies')}:</strong> {selectedChild.medicalInfo.allergies.join(', ')}</p>
                      )}
                      {selectedChild.medicalInfo.conditions && selectedChild.medicalInfo.conditions.length > 0 && (
                        <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.conditions')}:</strong> {selectedChild.medicalInfo.conditions.join(', ')}</p>
                      )}
                      {selectedChild.medicalInfo.medications && selectedChild.medicalInfo.medications.length > 0 && (
                        <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.medications')}:</strong> {selectedChild.medicalInfo.medications.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Term Statistics */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    {t('parent.children.currentTermStats')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className={clsx('text-xl font-bold', getAttendanceColor(selectedChild.currentTermStats.attendancePercentage))}>
                        {selectedChild.currentTermStats.attendancePercentage}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.attendancePercent')}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xl font-bold text-green-600">
                        {selectedChild.currentTermStats.meritsCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.merits')}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xl font-bold text-red-600">
                        {selectedChild.currentTermStats.demeritsCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.demerits')}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        {selectedChild.currentTermStats.averageGrade || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('parent.children.averageGrade')}</p>
                    </div>
                  </div>
                  {selectedChild.currentTermStats.classPosition && (
                    <div className="mt-3 text-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('parent.children.classPosition')}: </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedChild.currentTermStats.classPosition} / {selectedChild.currentTermStats.totalStudents}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {selectedChild.emergencyContact && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {t('parent.children.emergencyContact')}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.name')}:</strong> {selectedChild.emergencyContact.name}</p>
                      <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.phone')}:</strong> {selectedChild.emergencyContact.phone}</p>
                      <p><strong className="text-gray-700 dark:text-gray-300">{t('parent.children.relation')}:</strong> {selectedChild.emergencyContact.relation}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentChildren;
