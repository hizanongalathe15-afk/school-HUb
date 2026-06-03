import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Download, GraduationCap, MessageCircle, PackageSearch, RefreshCcw, Wand2 } from 'lucide-react';
import { automationManagementService, schoolManagementService } from '../../../services/adminService';

type AdminStats = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
};

export default function AdminAutomationsPage() {
  const [schoolId, setSchoolId] = useState('');
  const [term, setTerm] = useState(String(new Date().getMonth() >= 8 ? 3 : new Date().getMonth() >= 4 ? 2 : 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [classId, setClassId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const numericTerm = useMemo(() => Number(term || 1), [term]);
  const numericYear = useMemo(() => Number(year || new Date().getFullYear()), [year]);

  const loadSchool = async () => {
    try {
      const school = await schoolManagementService.getProfile();
      if (school?.id) setSchoolId(school.id);
    } catch {
      // School ID can still be entered manually.
    }
  };

  const refreshOverview = async () => {
    if (!schoolId) return;
    setWorking('overview');
    try {
      const [nextStats, lowStock, teachers] = await Promise.all([
        automationManagementService.getAdminStats(schoolId),
        automationManagementService.getLowStockItems(),
        automationManagementService.getTeachers({ schoolId, subject: subjectFilter || undefined }),
      ]);
      setStats(nextStats);
      setLowStockCount(lowStock.length);
      setTeacherCount(teachers.length);
    } catch {
      toast.error('Unable to refresh automation overview');
    } finally {
      setWorking(null);
    }
  };

  useEffect(() => {
    void loadSchool();
  }, []);

  useEffect(() => {
    if (schoolId) void refreshOverview();
  }, [schoolId]);

  const runEndTerm = async () => {
    if (!schoolId || !numericTerm || !numericYear) {
      toast.error('School, term, and year are required');
      return;
    }
    setWorking('term');
    try {
      await automationManagementService.processEndOfTerm({
        schoolId,
        term: numericTerm,
        year: numericYear,
        options: { generateReportCards: true, promoteStudents: true, sendNotifications: true },
      });
      await refreshOverview();
    } finally {
      setWorking(null);
    }
  };

  const downloadReports = async () => {
    if (!classId || !numericTerm || !numericYear) {
      toast.error('Class, term, and year are required');
      return;
    }
    setWorking('reports');
    try {
      const blob = await automationManagementService.generateBulkReportCards({ classId, term: numericTerm, year: numericYear });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-cards-${classId}-term-${numericTerm}-${numericYear}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setWorking(null);
    }
  };

  const syncWhatsApp = async () => {
    if (!classId || !groupId) {
      toast.error('Class and WhatsApp group IDs are required');
      return;
    }
    setWorking('whatsapp');
    try {
      await automationManagementService.syncWhatsAppGroup({ classId, groupId });
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Automation Control</h2>
          <p>Run connected school workflows for admissions, reports, WhatsApp groups, inventory, teachers, and term close from one place.</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshOverview} disabled={!schoolId || working === 'overview'}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="quick-stats-bar">
        <div className="stat-card"><Bot size={22} /><div><span>Students</span><strong>{stats?.totalStudents ?? '-'}</strong></div></div>
        <div className="stat-card"><GraduationCap size={22} /><div><span>Teachers</span><strong>{teacherCount ?? stats?.totalTeachers ?? '-'}</strong></div></div>
        <div className="stat-card"><Wand2 size={22} /><div><span>Classes</span><strong>{stats?.totalClasses ?? '-'}</strong></div></div>
        <div className="stat-card"><PackageSearch size={22} /><div><span>Low stock</span><strong>{lowStockCount ?? '-'}</strong></div></div>
      </div>

      <div className="admin-automation-grid">
        <section className="admin-automation-panel">
          <h3>Automation Context</h3>
          <label>School ID<input value={schoolId} onChange={(e) => setSchoolId(e.target.value)} placeholder="Loaded from school profile when available" /></label>
          <label>Term<input type="number" min="1" max="3" value={term} onChange={(e) => setTerm(e.target.value)} /></label>
          <label>Year<input type="number" min="2000" value={year} onChange={(e) => setYear(e.target.value)} /></label>
          <label>Teacher subject filter<input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="Optional subject name" /></label>
        </section>

        <section className="admin-automation-panel">
          <h3>One-Click Term Close</h3>
          <p>Generates report cards, notifies parents, and promotes eligible students using the backend automation service.</p>
          <button className="btn btn-primary" onClick={runEndTerm} disabled={working === 'term'}>
            <Wand2 size={16} /> Start New Term
          </button>
        </section>

        <section className="admin-automation-panel">
          <h3>Reports & Groups</h3>
          <label>Class ID<input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Class record ID" /></label>
          <label>WhatsApp Group ID<input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Provider group ID" /></label>
          <div className="table-actions">
            <button className="btn btn-secondary" onClick={downloadReports} disabled={working === 'reports'}>
              <Download size={16} /> Bulk Reports
            </button>
            <button className="btn btn-primary" onClick={syncWhatsApp} disabled={working === 'whatsapp'}>
              <MessageCircle size={16} /> Sync WhatsApp
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
