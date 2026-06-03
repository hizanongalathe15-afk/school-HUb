import React, { useEffect, useState } from 'react';
import { RefreshCcw, Download, Upload, CheckSquare, Square, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../../services/adminService';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showBulkMark, setShowBulkMark] = useState(false);

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
    <div className="admin-page p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-500">Daily attendance with bulk actions and imports</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 rounded" />
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16}/> Refresh</button>
          <button onClick={exportAttendance} className="btn btn-secondary"><Download size={16}/> Export</button>
          <button onClick={() => setShowBulkMark(true)} disabled={selected.length===0} className="btn btn-primary">Bulk Mark</button>
        </div>
      </div>

      {selected.length > 0 && <div className="mb-3 text-sm text-blue-700">{selected.length} students selected</div>}

      <div 
        onDragOver={e=>e.preventDefault()} 
        onDrop={handleDrop}
        className="mb-4 border-2 border-dashed p-6 text-center rounded-xl text-gray-500"
      >
        Drag &amp; drop Excel/CSV attendance file here for bulk import (supports hundreds of rows)
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 w-10"><button onClick={toggleAll}>{selected.length === records.length ? <CheckSquare/> : <Square/>}</button></th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4">Class</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time In</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-4"><button onClick={() => toggleSelect(r.id)}>{selected.includes(r.id) ? <CheckSquare className="text-blue-600"/> : <Square/>}</button></td>
                  <td className="p-4">{r.studentName}</td>
                  <td className="p-4">{r.className}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded text-xs ${r.status==='present'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                  <td className="p-4">{r.timeIn || '-'}</td>
                  <td className="p-4">
                    <button onClick={() => {/* quick edit single */}} className="text-blue-600">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBulkMark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xs">
            <h3 className="font-semibold mb-4">Mark {selected.length} students as:</h3>
            <div className="flex gap-3">
              <button onClick={() => markBulk('present')} className="flex-1 btn btn-primary">Present</button>
              <button onClick={() => markBulk('absent')} className="flex-1 btn btn-danger">Absent</button>
            </div>
            <button onClick={() => setShowBulkMark(false)} className="w-full mt-3 btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600} .btn-primary{background:#1d8a8a;color:white} .btn-secondary{background:#f1f5f9} .btn-danger{background:#dc2626;color:white}`}</style>
    </div>
  );
}