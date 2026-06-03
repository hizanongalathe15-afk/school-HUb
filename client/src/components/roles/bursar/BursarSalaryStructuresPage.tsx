import { useEffect, useState } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bursarService } from '../../../services/bursarService';

export default function BursarSalaryStructuresPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const response = await bursarService.payroll.getSalaryStructures();
      setStructures(response.data || []);
    } catch (error) {
      console.error('Failed to load salary structures', error);
      toast.error('Unable to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStructures();
  }, []);

  return (
    <div className="bursar-page min-h-screen p-6 bg-slate-50">
      <div className="page-header mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Layers size={24} />
            Salary Structures
          </div>
          <p className="mt-2 text-sm text-slate-600">View and manage the salary structure definitions used in payroll.</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={loadStructures}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="loader mx-auto mb-4" />
            <p className="text-slate-700">Loading salary structures...</p>
          </div>
        ) : structures.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700">No salary structures are configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((structure) => (
                  <tr key={structure.id ?? JSON.stringify(structure)}>
                    <td>{structure.name || 'Unnamed structure'}</td>
                    <td>{structure.basicSalary != null ? structure.basicSalary : '-'}</td>
                    <td>{structure.allowances != null ? structure.allowances : '-'}</td>
                    <td>{structure.deductions != null ? structure.deductions : '-'}</td>
                    <td>{structure.total != null ? structure.total : '-'}</td>
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
