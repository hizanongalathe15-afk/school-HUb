import React, { useEffect, useState } from 'react';
import { RefreshCcw, Download, Upload, CheckSquare, Square, Calendar, Users, Clock, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../../services/adminService';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showBulkMark, setShowBulkMark] = useState(false);
  const presentCount = records.filter((record) => record.status === 'present' || record.status === 'late').length;
  const absentCount = records.filter((record) => record.status === 'absent').length;

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getAttendanceByDate(date);
      setRecords(data);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [date]);

  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === records.length ? [] : records.map((r:any) => r.id));

  const markBulk = async (status: 'present' | 'absent') => {
    try {
      await attendanceService.bulkMark(date, selected, status);
      toast.success(`Marked ${selected.length} as ${status}`);
      setSelected([]); setShowBulkMark(false); fetchData();
    } catch { toast.error('Bulk mark failed'); }
  };

  const exportAttendance = async () => {
    const blob = await attendanceService.exportAttendance(date);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance-${date}.xlsx`; a.click(); URL.revokeObjectURL(url);
  };

  // Drag & drop for bulk import (Excel with many rows)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        await attendanceService.importAttendance(date, file);
        toast.success('Attendance imported');
        fetchData();
      } catch { toast.error('Import failed'); }
    }
  };

  return (
    <div className="admin-page attendance-page">
      <div className="page-header attendance-header">
        <div>
          <h1><Calendar size={28} /> Attendance Management</h1>
          <p>Daily attendance with bulk actions, imports, and live class records.</p>
        </div>
        <div className="page-actions">
          <div className="date-field"><Calendar size={16} /><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16}/> Refresh</button>
          <button onClick={exportAttendance} className="btn btn-secondary"><Download size={16}/> Export</button>
          <button onClick={() => setShowBulkMark(true)} disabled={selected.length===0} className="btn btn-primary">Bulk Mark</button>
        </div>
      </div>

      <div className="attendance-stat-grid">
        <div className="attendance-stat-card"><Users size={20} /><div><strong>{records.length}</strong><span>Total students</span></div></div>
        <div className="attendance-stat-card present"><UserCheck size={20} /><div><strong>{presentCount}</strong><span>Present or late</span></div></div>
        <div className="attendance-stat-card absent"><UserX size={20} /><div><strong>{absentCount}</strong><span>Absent</span></div></div>
        <div className="attendance-stat-card"><Clock size={20} /><div><strong>{records.length ? Math.round((presentCount / records.length) * 100) : 0}%</strong><span>Attendance rate</span></div></div>
      </div>

      {selected.length > 0 && <div className="selection-banner">{selected.length} students selected</div>}

      <div 
        onDragOver={e=>e.preventDefault()} 
        onDrop={handleDrop}
        className="drag-zone attendance-import-zone"
      >
        <Upload size={24} />
        <strong>Drop attendance import here</strong>
        <span>Excel/CSV files are accepted for bulk processing.</span>
      </div>

      {loading ? <div className="loading-state"><div className="loader" /><p>Loading attendance...</p></div> : (
        <div className="table-container attendance-table">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-col"><button onClick={toggleAll}>{selected.length === records.length ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
                <th>Student</th>
                <th>Class</th>
                <th>Status</th>
                <th>Time In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any, idx: number) => (
                <tr key={r.studentId || idx}>
                  <td><button className="icon-only-btn" onClick={() => toggleSelect(r.id)}>{selected.includes(r.id) ? <CheckSquare className="checked" size={18}/> : <Square size={18}/>}</button></td>
                  <td><div className="student-cell"><strong>{r.studentName}</strong><span>{r.admissionNumber || r.studentId}</span></div></td>
                  <td>{r.className}</td>
                  <td><span className={`status-pill ${r.status}`}>{r.status}</span></td>
                  <td>{r.timeIn || '-'}</td>
                  <td>
                    <button onClick={() => {/* quick edit single */}} className="link-action">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBulkMark && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header"><h3>Bulk Mark Attendance</h3></div>
            <div className="modal-body">
              <p>Mark {selected.length} selected students as:</p>
              <div className="bulk-mark-actions">
                <button onClick={() => markBulk('present')} className="btn btn-primary">Present</button>
                <button onClick={() => markBulk('absent')} className="btn btn-danger">Absent</button>
              </div>
            </div>
            <div className="modal-footer"><button onClick={() => setShowBulkMark(false)} className="btn btn-secondary">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
