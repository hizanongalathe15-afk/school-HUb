import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, RefreshCcw, Upload, Download, X, Save, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  recordedBy: string;
}

export default function BursarExpenseManagementPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: '', description: '', amount: 0, date: '' });
  const [files, setFiles] = useState<File[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bursarService.expenses.getExpenses();
      setExpenses(data.data || data || []);

    } catch {
      toast.error('Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (exp?: Expense) => {
    if (exp) {
      setEditing(exp);
      setForm({ category: exp.category, description: exp.description, amount: exp.amount, date: exp.date });
    } else {
      setEditing(null);
      setForm({ category: 'Utilities', description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    }
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await bursarService.expenses.updateExpense(editing.id, form);
      } else {
        const formData = new FormData();
        formData.append('category', form.category);
        formData.append('description', form.description);
        formData.append('amount', String(form.amount));
        formData.append('date', form.date);
        if (files[0]) {
          formData.append('receipt', files[0]);
        }
        await bursarService.expenses.recordExpense(formData as any);
      }
      toast.success('Expense saved');
      fetchData();
      setShowModal(false);
      setFiles([]);
    } catch {
      toast.error('Save failed');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete expense?')) return;
    await bursarService.expenses.deleteExpense(id);
    toast.success('Deleted');
    fetchData();
  };

  const exportData = async () => {
    const blob = await bursarService.expenses.exportExpenses();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bursar-page p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Receipt size={28} /> Expense Management</h1>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-secondary"><RefreshCcw size={16} /> Refresh</button>
          <button onClick={exportData} className="btn btn-secondary"><Download size={16} /> Export</button>
          <button onClick={() => openModal()} className="btn btn-primary"><Plus size={16} /> Record Expense</button>
        </div>
      </div>

      <input placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mb-4 border p-3 rounded-xl" />

      <div className="bg-white rounded-2xl shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(exp => (
              <tr key={exp.id} className="border-t">
                <td className="p-4">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="p-4">{exp.category}</td>
                <td className="p-4">{exp.description}</td>
                <td className="p-4 font-medium">KES {exp.amount.toLocaleString()}</td>
                <td className="p-4">
                  <button onClick={() => openModal(exp)} className="p-2"><Edit size={16} /></button>
                  <button onClick={() => del(exp.id)} className="p-2 text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-4">{editing ? 'Edit' : 'Record'} Expense</h3>
            <div className="space-y-4">
              <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-xl" />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border p-3 rounded-xl" />
              <div className="border-2 border-dashed p-4 text-center rounded-xl">Drop receipt here or <label className="text-blue-600 cursor-pointer">browse<input type="file" className="hidden" onChange={e => e.target.files && setFiles(Array.from(e.target.files))} /></label></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
              <button onClick={save} className="flex-1 btn btn-primary flex items-center justify-center gap-2"><Save size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.btn{padding:8px 14px;border-radius:8px;font-weight:600}`}</style>
    </div>
  );
}