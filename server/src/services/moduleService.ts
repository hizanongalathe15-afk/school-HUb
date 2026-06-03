export interface SystemModuleRecord {
  id: string;
  title: string;
  owner: string;
  status: 'active' | 'attention' | 'pending' | 'archived';
  updatedAt: string;
}

export interface SystemModuleSummary {
  id: string;
  title: string;
  category: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  records: SystemModuleRecord[];
}

const now = new Date().toISOString();

const modules: Record<string, SystemModuleSummary> = {
  location: {
    id: 'location',
    title: 'Location Environment',
    category: 'School Operations',
    summary: 'School map, access roads, surroundings, climate notes, soil information, drone shots, and visitor directions.',
    metrics: [
      { label: 'Map pins', value: '14' },
      { label: 'Routes', value: '5' },
      { label: 'Risk notes', value: '2' }
    ],
    records: [
      { id: 'loc_001', title: 'Main gate and visitor reception pin', owner: 'Administration', status: 'active', updatedAt: now },
      { id: 'loc_002', title: 'Bus drop-off and pickup route', owner: 'Transport desk', status: 'active', updatedAt: now },
      { id: 'loc_003', title: 'Rain-season road access advisory', owner: 'Facilities', status: 'attention', updatedAt: now }
    ]
  },
  infrastructure: {
    id: 'infrastructure',
    title: 'Infrastructure Management',
    category: 'Facilities',
    summary: 'Classrooms, laboratories, library, sports facilities, dormitories, dining hall, chapel, admin block, and maintenance logs.',
    metrics: [
      { label: 'Facilities', value: '48' },
      { label: 'Open jobs', value: '11' },
      { label: 'Urgent', value: '2' }
    ],
    records: [
      { id: 'inf_001', title: 'Laboratory gas line inspection', owner: 'Science HOD', status: 'attention', updatedAt: now },
      { id: 'inf_002', title: 'Dormitory water pressure fix', owner: 'Maintenance', status: 'pending', updatedAt: now },
      { id: 'inf_003', title: 'Library reading bay upgrade', owner: 'Librarian', status: 'active', updatedAt: now }
    ]
  },
  media: {
    id: 'media',
    title: 'Media Management',
    category: 'Public Content',
    summary: 'Image gallery, video gallery, event media, memories, achievements media, and virtual tour assets.',
    metrics: [
      { label: 'Assets', value: '286' },
      { label: 'Published', value: '214' },
      { label: 'Review', value: '9' }
    ],
    records: [
      { id: 'med_001', title: 'Sports day gallery', owner: 'Media office', status: 'active', updatedAt: now },
      { id: 'med_002', title: 'Virtual tour drone sequence', owner: 'Developer', status: 'pending', updatedAt: now },
      { id: 'med_003', title: 'KCSE awards highlight video', owner: 'Academic office', status: 'active', updatedAt: now }
    ]
  },
  classes: {
    id: 'classes',
    title: 'Class Management',
    category: 'Academics',
    summary: 'Classes, streams, capacities, class teachers, subject allocation, timetable rules, and learner movement.',
    metrics: [
      { label: 'Classes', value: '24' },
      { label: 'Streams', value: '42' },
      { label: 'Capacity', value: '87%' }
    ],
    records: [
      { id: 'cls_001', title: 'Form 1 East capacity review', owner: 'Deputy principal', status: 'attention', updatedAt: now },
      { id: 'cls_002', title: 'Form 3 Science stream allocation', owner: 'Academic office', status: 'active', updatedAt: now },
      { id: 'cls_003', title: 'Class teacher allocation audit', owner: 'Principal', status: 'pending', updatedAt: now }
    ]
  },
  staff: {
    id: 'staff',
    title: 'Staff Management',
    category: 'Human Resources',
    summary: 'Staff biodata, roles, permissions, attendance, payroll readiness, leave, reports, and operational assignments.',
    metrics: [
      { label: 'Staff', value: '96' },
      { label: 'On duty', value: '92' },
      { label: 'Leave requests', value: '8' }
    ],
    records: [
      { id: 'stf_001', title: 'Kitchen team duty rota', owner: 'HR office', status: 'active', updatedAt: now },
      { id: 'stf_002', title: 'Security team attendance follow-up', owner: 'Deputy principal', status: 'attention', updatedAt: now },
      { id: 'stf_003', title: 'Payroll data verification', owner: 'Bursar', status: 'pending', updatedAt: now }
    ]
  },
  library: {
    id: 'library',
    title: 'Library Management',
    category: 'Resources',
    summary: 'Book catalog, borrowing, returns, overdue fines, ebooks, SMS requests, and library reports.',
    metrics: [
      { label: 'Books', value: '7,840' },
      { label: 'Borrowed', value: '612' },
      { label: 'Overdue', value: '48' }
    ],
    records: [
      { id: 'lib_001', title: 'Overdue Form 4 set books', owner: 'Librarian', status: 'attention', updatedAt: now },
      { id: 'lib_002', title: 'Digital biology revision pack', owner: 'Science HOD', status: 'active', updatedAt: now },
      { id: 'lib_003', title: 'New textbook accession batch', owner: 'Storekeeper', status: 'pending', updatedAt: now }
    ]
  },
  events: {
    id: 'events',
    title: 'Events Management',
    category: 'School Calendar',
    summary: 'School events, sports fixtures, academic clinics, chapel services, consent forms, reminders, and reports.',
    metrics: [
      { label: 'Upcoming', value: '12' },
      { label: 'Consent forms', value: '4' },
      { label: 'Reminders', value: '18' }
    ],
    records: [
      { id: 'evt_001', title: 'Academic clinic day', owner: 'Academic office', status: 'active', updatedAt: now },
      { id: 'evt_002', title: 'County sports fixture travel plan', owner: 'Games department', status: 'pending', updatedAt: now },
      { id: 'evt_003', title: 'Emergency drill communication', owner: 'Deputy principal', status: 'attention', updatedAt: now }
    ]
  }
};

export function listSystemModules() {
  return Object.values(modules);
}

export function getSystemModule(moduleId: string) {
  return modules[moduleId];
}

export function createSystemRecord(moduleId: string, payload: Partial<SystemModuleRecord>) {
  const module = getSystemModule(moduleId);
  if (!module) {
    return undefined;
  }

  const record: SystemModuleRecord = {
    id: `${moduleId}_${Date.now()}`,
    title: payload.title?.trim() || `New ${module.title} record`,
    owner: payload.owner?.trim() || 'System',
    status: payload.status || 'pending',
    updatedAt: new Date().toISOString()
  };

  module.records.unshift(record);
  return record;
}

export function runSystemModuleAction(moduleId: string, action: string) {
  const module = getSystemModule(moduleId);
  if (!module) {
    return undefined;
  }

  return {
    id: `audit_${Date.now()}`,
    moduleId,
    action,
    status: 'completed',
    message: `${action} completed for ${module.title}`,
    completedAt: new Date().toISOString()
  };
}
