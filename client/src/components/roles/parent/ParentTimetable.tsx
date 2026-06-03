import React, { useEffect, useMemo, useState } from 'react';
import parentService from '../../../services/parentService';
import type { ParentChild, WeeklyTimetable, TimetableEntry } from '../../../types/parent';

type Tab = 'weekly' | 'exam';

const ParentTimetable: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const [tab, setTab] = useState<Tab>('weekly');
  const [termId, setTermId] = useState<string>('');

  const [weekly, setWeekly] = useState<WeeklyTimetable | null>(null);
  const [exam, setExam] = useState<WeeklyTimetable | null>(null);

  const [downloading, setDownloading] = useState(false);

  const loadChildren = async () => {
    const res = await parentService.children.getMyChildren();
    if (res?.success && res.data) {
      setChildren(res.data);
      if (res.data[0]) setSelectedChildId(res.data[0].id);
    }
  };

  const loadWeekly = async (childId: string) => {
    const res = await parentService.timetable.getTimetable(childId);
    if (res?.success) setWeekly(res.data ?? null);
  };

  const loadExam = async (childId: string, term?: string) => {
    const res = await parentService.timetable.getExamTimetable(childId, term || undefined);
    if (res?.success) setExam(res.data ?? null);
  };

  const refresh = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      if (tab === 'weekly') await loadWeekly(selectedChildId);
      else await loadExam(selectedChildId, termId || undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadChildren();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initial + whenever child/tab changes
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId, tab, termId]);

  const downloadPrintable = async () => {
    if (!selectedChildId) return;
    setDownloading(true);
    try {
      const blob = await parentService.timetable.downloadTimetable(selectedChildId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${selectedChildId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Timetable download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const renderTable = (data: WeeklyTimetable | null) => {
    if (!data?.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
      return (
        <div style={{ padding: 12, color: '#64748b' }}>
          No timetable available.
        </div>
      );
    }

    // Group by day
    const days: TimetableEntry['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const byDay: Record<string, TimetableEntry[]> = {};
    for (const d of days) byDay[d] = [];
    for (const e of data.entries) {
      if (!byDay[e.day]) byDay[e.day] = [];
      byDay[e.day].push(e);
    }
    for (const d of days) {
      byDay[d].sort((a, b) => a.period - b.period);
    }

    return (
      <div className="timetable-grid">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const entries = byDay[day] ?? [];
                if (entries.length === 0) {
                  return (
                    <tr key={day}>
                      <td style={{ textTransform: 'capitalize' }}>{day}</td>
                      <td colSpan={4} style={{ color: '#94a3b8' }}>—</td>
                    </tr>
                  );
                }
                return entries.map((e, idx) => (
                  <tr key={`${day}_${e.id}`}>
                    {idx === 0 ? (
                      <td rowSpan={entries.length} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                        {day}
                      </td>
                    ) : null}
                    <td>{e.period}</td>
                    <td>{e.startTime} - {e.endTime}</td>
                    <td>{e.subjectName}</td>
                    <td>{e.teacherName}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={downloadPrintable} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download Printable Timetable'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="parent-timetable">
      <h1>Timetable</h1>

      {loading ? (
        <div className="loading-inline">
          <div className="loading-spinner" />
          <p>Loading timetable...</p>
        </div>
      ) : (
        <>
          <div className="filters-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="child-selector">
              <label>Child</label>
              <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.admissionNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="tab-selector">
              <label>View</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`pill ${tab === 'weekly' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setTab('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`pill ${tab === 'exam' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setTab('exam')}
                >
                  Exam
                </button>
              </div>
            </div>

            {tab === 'exam' && (
              <div className="term-selector">
                <label>Term ID</label>
                <input
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  placeholder="Optional (e.g. 1)"
                />
              </div>
            )}

            {selectedChild && (
              <div className="child-meta">
                <div>
                  <b>Class:</b> {selectedChild.className}{selectedChild.streamName ? ` - ${selectedChild.streamName}` : ''}
                </div>
              </div>
            )}
          </div>

          {tab === 'weekly' ? renderTable(weekly) : renderTable(exam)}
        </>
      )}
    </div>
  );
};

export default ParentTimetable;
