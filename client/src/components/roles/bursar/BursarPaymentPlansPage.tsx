import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bursarService } from '../../../services/bursarService';

export default function BursarPaymentPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaymentPlans = async () => {
    setLoading(true);
    try {
      const response = await bursarService.paymentPlans.getPaymentPlans();
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to load payment plans', error);
      toast.error('Unable to load payment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPaymentPlans();
  }, []);

  return (
    <div className="bursar-page min-h-screen p-6 bg-slate-50">
      <div className="page-header mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Activity size={24} />
            Payment Plans
          </div>
          <p className="mt-2 text-sm text-slate-600">Manage installment plans and payment agreements for students.</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={loadPaymentPlans}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="loader mx-auto mb-4" />
            <p className="text-slate-700">Loading payment plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700">No payment plans are available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Total Due</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Next Payment</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id ?? plan.planId ?? JSON.stringify(plan)}>
                    <td>{plan.studentName || plan.studentId || 'Unknown'}</td>
                    <td>{plan.status || 'Unknown'}</td>
                    <td>{plan.totalAmount != null ? plan.totalAmount : '-'}</td>
                    <td>{plan.paidAmount != null ? plan.paidAmount : '-'}</td>
                    <td>{plan.remainingAmount != null ? plan.remainingAmount : '-'}</td>
                    <td>{plan.nextPaymentDate ? new Date(plan.nextPaymentDate).toLocaleDateString() : '-'}</td>
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
