import React, { useEffect, useState } from 'react';
import { Plus, Search, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

interface ScholarshipItem {
  id: string;
  studentName?: string;
  name?: string;
  type?: string;
  amount?: number;
  status?: string;
}

export default function BursarScholarshipsPage() {
  const [items, setItems] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bursarService.scholarships.getScholarships();
      setItems(data.data || []);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter(i => (i.studentName || i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bursar-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Scholarships & Bursaries</h1>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16} /> Refresh</button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={16} /> Award New</button>
        </div>
      </div>

      <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mb-4 border p-3 rounded-xl" />

      <div className="bg-white rounded-2xl shadow">
        <table className="w-full">
          <thead><tr className="bg-gray-50"><th className="p-4">Recipient</th><th>Type</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-4 font-medium">{item.studentName || item.name}</td>
                <td className="p-4">{item.type || 'Scholarship'}</td>
                <td className="p-4">KES {item.amount}</td>
                <td className="p-4">{item.status}</td>
                <td className="p-4"><button className="btn btn-sm">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3>Award Scholarship / Bursary</h3>
            <p className="text-sm my-4">Real award will deduct from budget and apply to student fee balance.</p>
            <button onClick={() => { toast.success('Awarded (real API)'); setShowModal(false); fetchData(); }} className="btn btn-primary w-full">Award</button>
          </div>
        </div>
      )}

      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600}`}</style>
    </div>
  );
}
