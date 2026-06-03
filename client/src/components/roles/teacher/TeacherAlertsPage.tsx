import { useEffect, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService } from '../../../services/teacherService';

export default function TeacherAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await teacherService.dashboard.getAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Failed to load teacher alerts', error);
      toast.error('Unable to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  return (
    <div className="teacher-page min-h-screen p-6 bg-slate-50">
      <div className="page-header mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Bell size={24} />
            Teacher Alerts
          </div>
          <p className="mt-2 text-sm text-slate-600">Monitor important alerts from your teacher dashboard.</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={loadAlerts}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="loader mx-auto mb-4" />
            <p className="text-slate-700">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700">No alerts available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id ?? JSON.stringify(alert)} className="rounded-xl border border-slate-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{alert.title || alert.message || 'Alert'}</p>
                    <p className="text-sm text-slate-700">{alert.message || alert.detail || 'No alert details available.'}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {alert.severity && <span className="badge badge-secondary">{alert.severity}</span>}
                    {alert.timestamp && <span className="ml-3">{new Date(alert.timestamp).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
