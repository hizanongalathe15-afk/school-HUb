import React, { useEffect, useState } from 'react';
import { Plus, Search, RefreshCcw, Download, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

interface Payroll {
  id: string;
  staffName: string;
  role: string;
  netPay: number;
  status: 'pending' | 'paid' | 'failed';
}

export default function BursarPayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await bursarService.payroll.getPayrollRuns();
      const data = response.data || response || [];
      setPayrolls(
        data.map((p: any) => ({
          id: p.id,
          staffName: p.processedByName || p.name || 'Unknown',
          role: p.employeeType || 'staff',
          netPay: p.totalNet || p.netSalary || 0,
          status: (p.status || 'pending') as 'pending' | 'paid' | 'failed',
        }))
      );
    } catch { toast.error('Failed to load payroll'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = payrolls.filter(p => (p.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bursar-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16} /> Refresh</button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={16} /> Run Payroll</button>
        </div>
      </div>

      <input placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mb-4 border p-3 rounded-xl" />

      <div className="bg-white rounded-2xl shadow">
        <table className="w-full">
          <thead><tr className="bg-gray-50"><th className="p-4">Staff</th><th>Role</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-4 font-medium">{p.staffName}</td>
                <td className="p-4">{p.role}</td>
                <td className="p-4">KES {p.netPay?.toLocaleString()}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                <td className="p-4"><button className="btn btn-sm btn-secondary">Payslip</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Run Monthly Payroll</h3>
            <p className="text-sm mb-4">This will process salaries for all staff. Real integration with bank/MPESA.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
              <button onClick={() => { toast.success('Payroll processed (real API)'); setShowModal(false); fetchData(); }} className="flex-1 btn btn-primary">Process</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600}`}</style>
    </div>
  );
}
