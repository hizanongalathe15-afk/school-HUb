import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, Check, X, Download, Upload, Eye, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

interface BudgetAllocationForm {
  department: string;
  category: string;
  allocatedAmount: number;
}

interface BudgetForm {
  name: string;
  academicYear: string;
  totalAmount: number;
  allocations: BudgetAllocationForm[];
}

const defaultForm: BudgetForm = {
  name: '',
  academicYear: new Date().getFullYear().toString(),
  totalAmount: 0,
  allocations: [{ department: 'Administration', category: 'General', allocatedAmount: 0 }],
};

export default function BursarBudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BudgetForm>(defaultForm);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await bursarService.budgets.getBudgets();
      setBudgets(response.data || []);
    } catch { toast.error('Failed to load budgets'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = async (budget: any) => {
    setEditing(budget);
    setForm({
      name: budget.name,
      academicYear: budget.academicYear?.toString() || new Date().getFullYear().toString(),
      totalAmount: budget.totalAmount || 0,
      allocations: budget.allocations?.length
        ? budget.allocations.map((a: any) => ({ department: a.department, category: a.category, allocatedAmount: a.allocatedAmount || 0 }))
        : [{ department: 'Administration', category: 'General', allocatedAmount: 0 }],
    });
    setShowModal(true);
  };

  const openDetail = async (budget: any) => {
    try {
      const response = await bursarService.budgets.getBudget(budget.id);
      setSelectedBudget(response.data);
      setShowDetailModal(true);
    } catch { toast.error('Failed to load budget details'); }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Budget name is required');
      return;
    }
    if (!form.totalAmount || form.totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        academicYear: Number(form.academicYear),
        totalAmount: Number(form.totalAmount),
        allocations: form.allocations.map(a => ({
          department: a.department,
          category: a.category,
          allocatedAmount: Number(a.allocatedAmount)
        })),
      };

      if (editing) {
        await bursarService.budgets.updateBudget(editing.id, payload);
        toast.success('Budget updated');
      } else {
        await bursarService.budgets.createBudget(payload);
        toast.success('Budget created');
      }
      fetchData();
      setShowModal(false);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id: string) => {
    if (!confirm('Approve this budget? Once approved it becomes active.')) return;
    try {
      await bursarService.budgets.approveBudget(id);
      toast.success('Budget approved');
      fetchData();
    } catch { toast.error('Approval failed'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Archive this budget? It will be marked as closed.')) return;
    try {
      await bursarService.budgets.updateBudget(id, { status: 'CLOSED' });
      toast.success('Budget archived');
      fetchData();
    } catch { toast.error('Archive failed'); }
  };

  const exportCSV = () => {
    const header = 'Name,Academic Year,Status,Total Amount\n';
    const rows = filtered.map(b => `${b.name},${b.academicYear},${b.status},${b.totalAmount}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgets-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      toast.success(`Attached ${file.name} (evidence upload ready for upload URL)`);
    }
  };

  const filtered = budgets.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.academicYear?.toString().includes(searchTerm))
  );

  const statusColor = (s: string) => {
    const map: any = { DRAFT: 'bg-gray-100 text-gray-800', APPROVED: 'bg-green-100 text-green-800', ACTIVE: 'bg-blue-100 text-blue-800', CLOSED: 'bg-red-100 text-red-800' };
    return map[s] || 'bg-gray-100 text-gray-800';
  };

  const totalAllBudgets = budgets.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="store-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 size={28} /> Budget Management</h1>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> Create Budget</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow border">
          <div className="text-sm text-gray-500">Total Budgets</div>
          <div className="text-2xl font-bold">{budgets.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow border">
          <div className="text-sm text-gray-500">Total Allocation</div>
          <div className="text-2xl font-bold">KES {totalAllBudgets.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow border">
          <div className="text-sm text-gray-500">Draft</div>
          <div className="text-2xl font-bold">{budgets.filter((b: any) => b.status === 'DRAFT').length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow border">
          <div className="text-sm text-gray-500">Approved / Active</div>
          <div className="text-2xl font-bold">{budgets.filter((b: any) => b.status === 'APPROVED' || b.status === 'ACTIVE').length}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search budgets by name or year..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 border p-3 rounded-xl"
        />
        <button onClick={exportCSV} className="btn btn-secondary"><Download size={16} /> Export CSV</button>
      </div>

      <div className="bg-white rounded-2xl shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Budget Name</th>
              <th>Year</th>
              <th>Total (KES)</th>
              <th>Status</th>
              <th>Allocations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} className="border-t">
                <td className="p-4 font-medium">{b.name}</td>
                <td className="p-4">{b.academicYear}</td>
                <td className="p-4">KES {Number(b.totalAmount).toLocaleString()}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span></td>
                <td className="p-4">{b.allocations?.length || 0} departments</td>
                <td className="p-4 flex gap-2 flex-wrap">
                  <button onClick={() => openDetail(b)} className="btn btn-sm btn-secondary"><Eye size={14} /> View</button>
                  {(b.status === 'DRAFT') && (
                    <>
                      <button onClick={() => openEdit(b)} className="btn btn-sm btn-secondary"><Edit size={14} /> Edit</button>
                      <button onClick={() => approve(b.id)} className="btn btn-sm btn-primary"><Check size={14} /> Approve</button>
                    </>
                  )}
                  <button onClick={() => remove(b.id)} className="btn btn-sm btn-secondary" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No budgets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Budget' : 'Create Budget'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name *</label>
              <input
                placeholder="e.g. 2026 Annual Budget"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <input
                type="number"
                placeholder="2026"
                value={form.academicYear}
                onChange={e => setForm({ ...form, academicYear: e.target.value })}
                className="w-full border p-3 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget Amount (KES) *</label>
            <input
              type="number"
              placeholder="0.00"
              value={form.totalAmount}
              onChange={e => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
              className="w-full border p-3 rounded-lg"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Department Allocations</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, allocations: [...f.allocations, { department: '', category: '', allocatedAmount: 0 }] }))}
                className="text-sm text-amber-600 font-medium"
              >
                + Add Allocation
              </button>
            </div>
            {form.allocations.map((alloc, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                <input
                  value={alloc.department}
                  onChange={e => {
                    const n = [...form.allocations];
                    n[idx].department = e.target.value;
                    setForm({ ...form, allocations: n });
                  }}
                  className="col-span-4 border p-2 rounded"
                  placeholder="Department"
                />
                <input
                  value={alloc.category}
                  onChange={e => {
                    const n = [...form.allocations];
                    n[idx].category = e.target.value;
                    setForm({ ...form, allocations: n });
                  }}
                  className="col-span-3 border p-2 rounded"
                  placeholder="Category"
                />
                <input
                  type="number"
                  value={alloc.allocatedAmount}
                  onChange={e => {
                    const n = [...form.allocations];
                    n[idx].allocatedAmount = parseFloat(e.target.value) || 0;
                    setForm({ ...form, allocations: n });
                  }}
                  className="col-span-3 border p-2 rounded"
                  placeholder="Amount"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...form, allocations: f.allocations.filter((_, i) => i !== idx) }))}
                  className="col-span-2 btn btn-secondary"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer transition-colors ${dragOver ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-gray-50'}`}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Drop budget justification/supporting documents here (PDF/Excel)</p>
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={() => toast.success('File attached')} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 btn btn-primary">{saving ? 'Saving...' : 'Save Budget'}</button>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedBudget?.name || 'Budget Details'} size="lg">
        {selectedBudget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Academic Year</div>
                <div className="font-semibold">{selectedBudget.academicYear}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(selectedBudget.status)}`}>{selectedBudget.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Total Allocation</div>
                <div className="text-lg font-bold">KES {Number(selectedBudget.totalAmount).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Total Spent</div>
                <div className="text-lg font-bold text-red-600">KES {Number(selectedBudget.totalSpent || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="text-lg font-bold text-green-600">KES {Number(selectedBudget.remaining || 0).toLocaleString()}</div>
              </div>
            </div>

            {selectedBudget.utilizationPercentage >= 80 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">
                  {selectedBudget.utilizationPercentage >= 95 ? 'Critical: 95%+ utilized' : 'Warning: 80%+ utilized'}
                </span>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Department / Category Breakdown</h4>
              <div className="space-y-2">
                {selectedBudget.allocations?.map((alloc: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{alloc.department}</span>
                        <span className="text-sm text-gray-500 ml-2">{alloc.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">KES {Number(alloc.allocatedAmount).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          Spent: KES {Number(alloc.spent || 0).toLocaleString()} | Remaining: KES {Number(alloc.remaining || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, alloc.utilizationPercentage || 0)}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{alloc.utilizationPercentage || 0}% utilized</div>
                  </div>
                ))}
                {(!selectedBudget.allocations || selectedBudget.allocations.length === 0) && (
                  <div className="text-center text-gray-500 py-4">No allocations defined</div>
                )}
              </div>
            </div>

            {selectedBudget.notes && (
              <div>
                <h4 className="font-semibold mb-1">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedBudget.notes}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowDetailModal(false)} className="flex-1 btn btn-secondary">Close</button>
          {(selectedBudget?.status === 'DRAFT' || selectedBudget?.status === 'APPROVED') && (
            <button onClick={() => { setShowDetailModal(false); openEdit(selectedBudget); }} className="flex-1 btn btn-primary">Edit Budget</button>
          )}
        </div>
      </Modal>
    </div>
  );
}
