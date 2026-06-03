import React, { useEffect, useState } from 'react';
import { RefreshCcw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

interface MpesaTransaction {
  id: string;
  date: string;
  reference: string;
  amount: number;
  studentName?: string;
  status: string;
}

export default function BursarMPESAPage() {
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bursarService.mpesa.getMPesaTransactions();
      setTransactions(data.data || []);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const reconcile = async () => {
    try {
      await bursarService.mpesa.bulkMatchMPesa([]);
      toast.success('Reconciliation complete (real)');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="bursar-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">MPESA & Banking</h1>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16} /> Refresh</button>
          <button onClick={reconcile} className="btn btn-primary">Reconcile Now</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow">
        <table className="w-full">
          <thead><tr className="bg-gray-50"><th className="p-4">Date</th><th>Reference</th><th>Amount</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-4">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-4">{t.reference}</td>
                <td className="p-4">KES {t.amount}</td>
                <td className="p-4">{t.studentName || 'Unmatched'}</td>
                <td className="p-4">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600}`}</style>
    </div>
  );
}
