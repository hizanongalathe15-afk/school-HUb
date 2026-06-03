// Parent Components Index
// Export all parent role components for easy imports

export { default as ParentAcademic } from './ParentAcademic';
export { default as ParentAnnouncements } from './ParentAnnouncements';
export { default as ParentAttendance } from './ParentAttendance';
export { default as ParentBoarding } from './ParentBoarding';
export { default as ParentChildren } from './ParentChildren';
export { default as ParentComplaints } from './ParentComplaints';
export { default as ParentDashboard } from './ParentDashboard';
export { default as ParentDiscipline } from './ParentDiscipline';
export { default as ParentDownloads } from './ParentDownloads';
export { default as ParentEvents } from './ParentEvents';
export { default as ParentExaminations } from './ParentExaminations';
export { default as ParentExtraCurricular } from './ParentExtraCurricular';
export { default as ParentFees } from './ParentFees';
export { default as ParentHealth } from './ParentHealth';
export { default as ParentHomework } from './ParentHomework';
export { default as ParentLinkStudentForm } from './ParentLinkStudentForm';
export { default as ParentMeetings } from './ParentMeetings';
export { default as ParentMessages } from './ParentMessages';
export { default as ParentNotifications } from './ParentNotifications';
export { default as ParentProfile } from './ParentProfile';
export { default as ParentSchoolInfo } from './ParentSchoolInfo';
export { default as ParentSidebar } from './ParentSidebar';
export { default as ParentSupport } from './ParentSupport';
export { default as ParentTimetable } from './ParentTimetable';
export { default as ParentTransport } from './ParentTransport';

// Re-export types for convenience
export type {
  ParentChild,
  ParentMeeting,
  MeetingSlot,
  HomeworkAssignment,
  SchoolEvent,
  DisciplineRecord,
  Streak,
  FeeBalance,
  FeePayment,
  Notification,
  NotificationPreferences,
  CommunicationPreferences,
  Complaint,
  Message,
  WeeklyTimetable,
  TimetableEntry,
  ExtraCurricularActivity,
  MedicalRecord,
  BoardingInfo,
  TransportRoute,
  SupportTicket,
  ParentProfile as ParentProfileType
} from '../../../types/parent';