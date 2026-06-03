import React, { useEffect, useState } from 'react';
import { RefreshCcw, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

export default function BursarFinancialReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bursarService.reports.getReportTemplates();
      setReports(data.data || []);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const generateReport = async (type: string) => {
    try {
      const res: any = await bursarService.reports.generateReport(type, {});
      // If the API returned a report id or a file blob, handle both cases
      if (res && res.data && (res.data.id || res.data.reportId)) {
        const reportId = res.data.id || res.data.reportId;
        const blob = await bursarService.reports.exportReport(reportId, 'excel');
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${type}-report.xlsx`; a.click(); URL.revokeObjectURL(url);
      } else if (res instanceof Blob) {
        const url = URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url; a.download = `${type}-report.xlsx`; a.click(); URL.revokeObjectURL(url);
      } else if (res && res.data && res.data.fileUrl) {
        window.open(res.data.fileUrl, '_blank');
      } else {
        toast.error('Unexpected report response');
      }
      toast.success(`${type} report generated`);
    } catch { toast.error('Failed to generate'); }
  };

  return (
    <div className="bursar-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16} /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Income Statement', 'Balance Sheet', 'Cash Flow', 'Fee Collection', 'Expense Analysis', 'Payroll Summary'].map(type => (
          <div key={type} className="bg-white border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">{type}</h3>
            <button onClick={() => generateReport(type.toLowerCase().replace(/\s+/g, '-'))} className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Download size={16} /> Generate & Export
            </button>
          </div>
        ))}
      </div>
      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600}`}</style>
    </div>
  );
}
