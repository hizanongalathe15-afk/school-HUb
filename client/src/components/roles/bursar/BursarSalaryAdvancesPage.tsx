import { useEffect, useState } from 'react';
import { DollarSign, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { bursarService } from '../../../services/bursarService';

export default function BursarSalaryAdvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadAdvances = async () => {
    setLoading(true);
    try {
      const response = await bursarService.payroll.getSalaryAdvances();
      setAdvances(response.data || []);
    } catch (error) {
      console.error('Failed to load salary advances', error);
      toast.error('Unable to load salary advances');
    } finally {
      setLoading(false);
    }
  };

  const approveAdvance = async (advanceId: string) => {
    setProcessing(advanceId);
    try {
      await bursarService.payroll.approveSalaryAdvance(advanceId, 0);
      toast.success('Salary advance approved');
      await loadAdvances();
    } catch (error) {
      console.error('Failed to approve advance', error);
      toast.error('Unable to approve advance');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    void loadAdvances();
  }, []);

  return (
    <div className="bursar-page min-h-screen p-6 bg-slate-50">
      <div className="page-header mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <DollarSign size={24} />
            Salary Advances
          </div>
          <p className="mt-2 text-sm text-slate-600">Review and approve employee salary advance requests.</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={loadAdvances}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="loader mx-auto mb-4" />
            <p className="text-slate-700">Loading salary advances...</p>
          </div>
        ) : advances.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700">No salary advance requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((advance) => (
                  <tr key={advance.id ?? JSON.stringify(advance)}>
                    <td>{advance.employeeName || advance.employeeId || 'Unknown'}</td>
                    <td>{advance.requestedAmount ?? '-'}</td>
                    <td>{advance.approvedAmount ?? '-'}</td>
                    <td>{advance.status || 'Unknown'}</td>
                    <td>{advance.requestDate ? new Date(advance.requestDate).toLocaleDateString() : '-'}</td>
                    <td>
                      {advance.status === 'pending' ? (
                        <button
                          disabled={processing === advance.id}
                          className="btn btn-sm btn-success"
                          onClick={() => void approveAdvance(advance.id)}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      ) : (
                        <span className="text-slate-500">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
