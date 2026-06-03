import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  School,
  Calendar,
  FileText,
  Users,
  Phone,
  Mail,
  MapPin,
  Award,
  BookOpen,
  Clock,
  Bell,
  Info,
  ExternalLink,
  Download,
  Share2,
  Printer,
  ChevronRight,
  Star,
  Building,
  Globe,
  Clock as ClockIcon,
  UserCheck,
  Shield,
  Heart,
  Music,
  Trophy,
  Zap,
  Eye,
  MessageCircle
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { ParentApiResponse, ParentProfile } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface Staff {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photo?: string;
  department?: string;
  qualification?: string;
  experience?: number;
  bio?: string;
}

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  holidays?: Array<{ name: string; date: string }>;
}

interface Policy {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'disciplinary' | 'health' | 'general';
  lastUpdated: string;
}

interface SchoolProfile {
  id: string;
  name: string;
  motto?: string;
  vision?: string;
  mission?: string;
  description?: string;
  establishedYear?: number;
  registrationNo?: string;
  logo?: string;
  accreditation?: string;
  principal?: string;
  studentCount?: number;
  staffCount?: number;
}

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  workingHours?: string;
  emergencyContact?: string;
}

const ParentSchoolInfo: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'calendar' | 'policies'>('overview');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const [
        profileRes,
        calendarRes,
        termRes,
        policiesRes,
        staffRes,
        contactRes,
      ] = await Promise.all([
        parentService.schoolInfo.getSchoolProfile(),
        parentService.schoolInfo.getSchoolCalendar(),
        parentService.schoolInfo.getTermDates(),
        parentService.schoolInfo.getSchoolPolicies(),
        parentService.schoolInfo.getStaffDirectory(),
        parentService.schoolInfo.getContactInfo(),
      ]);

      if (profileRes?.success) setProfile(profileRes.data);
      if (calendarRes?.success) setCalendar(calendarRes.data);
      if (termRes?.success && Array.isArray(termRes.data)) setTerms(termRes.data);
      if (policiesRes?.success && Array.isArray(policiesRes.data)) setPolicies(policiesRes.data);
      if (staffRes?.success && Array.isArray(staffRes.data)) setStaff(staffRes.data);
      if (contactRes?.success) setContact(contactRes.data);
    } catch (err) {
      console.error('Failed to load school info:', err);
      setError('Failed to load school information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    loadAll(true);
  };

  const handleDownloadCalendar = () => {
    // Implementation for downloading calendar
    toast.success('Calendar download started');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: profile?.name || 'School Information',
        text: 'Check out our school information',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getCurrentTerm = () => {
    const now = new Date();
    return terms.find(term => 
      new Date(term.startDate) <= now && new Date(term.endDate) >= now
    ) || terms[0];
  };

  const currentTerm = getCurrentTerm();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading school information..." />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <School className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load School Info
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            School Information
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Learn about our school, staff, calendar, and policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* School Profile Header */}
      {profile && (
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            {profile.logo ? (
              <div className="flex-shrink-0">
                <img
                  src={profile.logo}
                  alt={profile.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <School className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              {profile.motto && (
                <p className="text-lg italic text-gray-600 dark:text-gray-400 mt-1">
                  "{profile.motto}"
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                {profile.establishedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Est. {profile.establishedYear}
                  </span>
                )}
                {profile.principal && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    Principal: {profile.principal}
                  </span>
                )}
                {profile.studentCount && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {profile.studentCount} Students
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {profile.vision && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  Our Vision
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.vision}</p>
              </div>
            )}
            {profile.mission && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Our Mission
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.mission}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
          { id: 'staff', label: 'Staff Directory', icon: <Users className="w-4 h-4" />, count: staff.length },
          { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
          { id: 'policies', label: 'Policies', icon: <FileText className="w-4 h-4" />, count: policies.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Description */}
          {profile?.description && (
            <Card title="About the School">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {profile.description}
              </p>
            </Card>
          )}

          {/* Contact Information */}
          {contact && (
            <Card title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Address</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.address}</p>
                    </div>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                    </div>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                )}
                {contact.emergencyContact && (
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Emergency Contact</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.emergencyContact}</p>
                    </div>
                  </div>
                )}
                {contact.workingHours && (
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Working Hours</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.workingHours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {contact.socialMedia && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">Follow Us</p>
                  <div className="flex gap-3">
                    {contact.socialMedia.facebook && (
                      <a href={contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        Facebook
                      </a>
                    )}
                    {contact.socialMedia.twitter && (
                      <a href={contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                        Twitter
                      </a>
                    )}
                    {contact.socialMedia.instagram && (
                      <a href={contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline text-sm">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Current Term */}
          {currentTerm && (
            <Card title="Current Term">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentTerm.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(currentTerm.startDate).toLocaleDateString()} - {new Date(currentTerm.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                  In Progress
                </div>
              </div>
              {currentTerm.holidays && currentTerm.holidays.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">Upcoming Holidays</p>
                  <div className="mt-2 space-y-1">
                    {currentTerm.holidays.map((holiday, idx) => (
                      <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                        • {holiday.name}: {new Date(holiday.date).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Staff Directory Tab */}
      {activeTab === 'staff' && (
        <Card title="Staff Directory">
          {staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No staff information available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedStaff(member)}
                >
                  <div className="flex items-center gap-3">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {member.name?.[0] || 'S'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.name}
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                        {member.role}
                      </p>
                      {member.department && (
                        <p className="text-xs text-gray-500 truncate">
                          {member.department}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {member.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <Card title="Academic Calendar">
            <div className="space-y-4">
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {term.name}
                    </h3>
                    {term.isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>Start: {new Date(term.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(term.endDate).toLocaleDateString()}</span>
                  </div>
                  {term.holidays && term.holidays.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        Holidays & Breaks
                      </p>
                      <div className="space-y-1">
                        {term.holidays.map((holiday, idx) => (
                          <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            • {holiday.name}: {new Date(holiday.date).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleDownloadCalendar}>
                <Download className="w-4 h-4 mr-1" />
                Download Calendar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <Card title="School Policies">
          {policies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No policies available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    className={clsx(
                      'flex items-center justify-between p-4 cursor-pointer transition-colors',
                      expandedPolicy === policy.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {policy.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {policy.category.charAt(0).toUpperCase() + policy.category.slice(1)}
                        </span>
                        {policy.lastUpdated && (
                          <span className="text-xs text-gray-500">
                            Updated: {new Date(policy.lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={clsx(
                        'w-5 h-5 text-gray-400 transition-transform',
                        expandedPolicy === policy.id && 'rotate-90'
                      )}
                    />
                  </div>
                  {expandedPolicy === policy.id && (
                    <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                      <div className="mt-4 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {policy.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Staff Modal */}
      {selectedStaff && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStaff(null)}
          title={selectedStaff.name}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {selectedStaff.photo ? (
                <img
                  src={selectedStaff.photo}
                  alt={selectedStaff.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {selectedStaff.name?.[0] || 'S'}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedStaff.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400">{selectedStaff.role}</p>
                {selectedStaff.department && (
                  <p className="text-sm text-gray-500">{selectedStaff.department}</p>
                )}
              </div>
            </div>
            
            {(selectedStaff.email || selectedStaff.phone) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h4>
                {selectedStaff.email && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedStaff.email}`} className="text-blue-600 hover:underline">
                      {selectedStaff.email}
                    </a>
                  </div>
                )}
                {selectedStaff.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedStaff.phone}`} className="text-blue-600 hover:underline">
                      {selectedStaff.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {selectedStaff.qualification && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Qualifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStaff.qualification}</p>
              </div>
            )}
            
            {selectedStaff.bio && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">About</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStaff.bio}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

import { RefreshCw } from 'lucide-react';
import { Modal } from '../../ui/Modal';

export default ParentSchoolInfo;