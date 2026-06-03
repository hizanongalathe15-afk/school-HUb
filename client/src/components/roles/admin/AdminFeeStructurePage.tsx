// client/src/components/roles/admin/AdminFeeStructurePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, Save, 
  CheckSquare, Square, FileSpreadsheet, Eye, Printer, Share2,
  Calendar, DollarSign, Users, BookOpen, AlertCircle, CheckCircle,
  Clock, TrendingUp, TrendingDown, BarChart3, PieChart,
  Settings, Globe, Copy, Archive, Bell, Mail, Send,
  ChevronLeft, ChevronRight, Filter, Grid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import { financeService, schoolSettingsService } from '../../../services/adminService';
import type { FeeStructure, SchoolSettings, FeePayment } from '../../../types/bursar';

interface ExtendedFeeStructure extends FeeStructure {
  lateFee: number;
  discountPercentage: number;
  discountDeadline?: Date;
  paymentMethods: string[];
  bankAccount: string;
  mpesaPaybill: string;
  academicYear: string;
  isPublished: boolean;
}

export default function AdminFeeStructurePage() {
  // State Management
  const [fees, setFees] = useState<ExtendedFeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editing, setEditing] = useState<ExtendedFeeStructure | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'public'>('list');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  
  const [form, setForm] = useState<Partial<ExtendedFeeStructure>>({
    className: '', termName: '', amount: 0, dueDate: '', description: '',
    lateFee: 0, discountPercentage: 0, paymentMethods: ['mpesa', 'bank'],
    bankAccount: '', mpesaPaybill: '', academicYear: new Date().getFullYear().toString(),
    isPublished: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feesData, settings] = await Promise.all([
        financeService.getFeeStructures({
          classId: classFilter !== 'all' ? classFilter : undefined,
          term: termFilter !== 'all' ? termFilter : undefined,
          year: yearFilter !== 'all' ? yearFilter : undefined,
          search: searchTerm || undefined
        }),
        schoolSettingsService.getSettings()
      ]);
      setFees(feesData);
      setSchoolSettings(settings);
    } catch (error) { 
      toast.error('Failed to load fee structures'); 
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [classFilter, termFilter, yearFilter, searchTerm]);

  // Auto-calculate totals and discounts
  const calculateTotal = useCallback(() => {
    if (!autoCalculate) return form.amount;
    const amount = form.amount || 0;
    const discount = (amount * (form.discountPercentage || 0)) / 100;
    const late = form.lateFee || 0;
    const afterDiscount = amount - discount;
    return { amount, discount, late, total: afterDiscount + late };
  }, [form.amount, form.discountPercentage, form.lateFee, autoCalculate]);

  const handleSave = async () => {
    if (!form.className || !form.termName || !form.amount) {
      toast.error('Class, Term, and Amount are required');
      return;
    }
    
    try {
      if (editing) {
        await financeService.updateFeeStructure(editing.id, form);
        toast.success('Fee structure updated');
      } else {
        await financeService.createFeeStructure(form);
        toast.success('Fee structure created');
      }
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error: any) { 
      toast.error(error.message || 'Save failed'); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee structure? This will affect all payment records.')) return;
    try { 
      await financeService.deleteFeeStructure(id); 
      toast.success('Deleted'); 
      fetchData(); 
    } catch (error) { 
      toast.error('Failed to delete'); 
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      await financeService.publishFeeStructure(id, publish);
      toast.success(publish ? 'Published to public portal' : 'Unpublished');
      fetchData();
    } catch (error) {
      toast.error('Failed to update publication status');
    }
  };

  const generatePublicPDF = async () => {
    setGeneratingPDF(true);
    try {
      const publishedFees = fees.filter(f => f.isPublished);
      const blob = await financeService.generateFeeStructurePDF({
        fees: publishedFees,
        schoolSettings,
        year: yearFilter !== 'all' ? yearFilter : new Date().getFullYear().toString()
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee_structure_${schoolSettings?.schoolName || 'school'}_${new Date().getFullYear()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generatePublicHTML = () => {
    const publishedFees = fees.filter(f => f.isPublished);
    const groupedByClass: Record<string, ExtendedFeeStructure[]> = {};
    publishedFees.forEach(fee => {
      if (!groupedByClass[fee.className]) groupedByClass[fee.className] = [];
      groupedByClass[fee.className].push(fee);
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${schoolSettings?.schoolName || 'School'} Fee Structure ${new Date().getFullYear()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
          .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1d8a8a; padding-bottom: 20px; }
          .logo { max-width: 150px; margin-bottom: 20px; }
          .school-name { font-size: 28px; color: #1d8a8a; margin: 0; }
          .school-motto { color: #666; margin-top: 5px; }
          .fee-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .fee-table th, .fee-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .fee-table th { background: #1d8a8a; color: white; }
          .class-section { margin-bottom: 40px; }
          .class-title { background: #e8f4f4; padding: 10px; border-left: 4px solid #1d8a8a; margin-bottom: 15px; }
          .total-row { font-weight: bold; background: #f0fdf4; }
          .payment-info { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          @media print { body { background: white; } .container { box-shadow: none; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${schoolSettings?.logoUrl ? `<img src="${schoolSettings.logoUrl}" class="logo" alt="School Logo">` : ''}
            <h1 class="school-name">${schoolSettings?.schoolName || 'School Name'}</h1>
            <p class="school-motto">${schoolSettings?.motto || 'Excellence in Education'}</p>
            <h2>Fee Structure - ${yearFilter !== 'all' ? yearFilter : new Date().getFullYear()} Academic Year</h2>
          </div>
          
          ${Object.entries(groupedByClass).map(([className, classFees]) => `
            <div class="class-section">
              <div class="class-title"><h3>${className}</h3></div>
              <table class="fee-table">
                <thead><tr><th>Term</th><th>Amount (KES)</th><th>Due Date</th><th>Late Fee</th><th>Early Discount</th><th>Description</th></tr></thead>
                <tbody>
                  ${classFees.map(fee => `
                    <tr>
                      <td>${fee.termName}</td>
                      <td>${fee.amount.toLocaleString()}</td>
                      <td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'TBD'}</td>
                      <td>${fee.lateFee ? fee.lateFee.toLocaleString() : '-'}</td>
                      <td>${fee.discountPercentage ? `${fee.discountPercentage}%` : '-'}</td>
                      <td>${fee.description || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="payment-info">
            <h3>Payment Information</h3>
            <p><strong>Bank Account:</strong> ${schoolSettings?.bankAccount || 'To be advised'}</p>
            <p><strong>MPESA Paybill:</strong> ${schoolSettings?.mpesaPaybill || 'To be advised'} (Account Number: Student ID)</p>
            <p><strong>Payment Methods:</strong> MPESA, Bank Transfer, Cheque, Cash</p>
            <p><strong>Late Payment Penalty:</strong> 5% of fee amount per month after due date</p>
          </div>
          
          <div class="footer">
            <p>${schoolSettings?.address || ''} | Phone: ${schoolSettings?.phone || ''} | Email: ${schoolSettings?.email || ''}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #1d8a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">Print / Save as PDF</button>
        </div>
      </body>
      </html>
    `;
  };

  const openPublicView = () => {
    const html = generatePublicHTML();
    const newWindow = window.open();
    newWindow?.document.write(html);
    newWindow?.document.close();
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} fee structures?`)) return;
    try {
      await Promise.all(selectedIds.map(id => financeService.deleteFeeStructure(id)));
      toast.success('Deleted');
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast.error('Bulk delete failed');
    }
  };

  const exportData = async () => {
    try {
      const blob = await financeService.exportFeeStructures({
        ids: selectedIds.length > 0 ? selectedIds : undefined,
        format: 'excel'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee_structures_${new Date().toISOString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImportFiles(files);
    setShowImport(true);
  };

  const doImport = async () => {
    if (importFiles.length === 0) return;
    try {
      for (const file of importFiles) {
        await financeService.importFeeStructures(file);
      }
      toast.success(`${importFiles.length} file(s) imported`);
      setShowImport(false);
      setImportFiles([]);
      fetchData();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.id));
    }
  };

  const resetForm = () => {
    setForm({
      className: '', termName: '', amount: 0, dueDate: '', description: '',
      lateFee: 0, discountPercentage: 0, paymentMethods: ['mpesa', 'bank'],
      bankAccount: '', mpesaPaybill: '', academicYear: new Date().getFullYear().toString(),
      isPublished: false
    });
  };

  const filtered = fees.filter(f => 
    (f.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.termName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueClasses = [...new Set(fees.map(f => f.className))];
  const uniqueTerms = [...new Set(fees.map(f => f.termName))];
  const uniqueYears = [...new Set(fees.map(f => f.academicYear))];
  const publishedCount = fees.filter(f => f.isPublished).length;

  const totals = calculateTotal();

  return (
    <div className="fee-structure-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><DollarSign size={24} /> Fee Structure Management</h2>
          <p>Manage school fees, publish to public portal, and generate PDF statements</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /> List</button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={16} /> Grid</button>
            <button className={`view-btn ${viewMode === 'public' ? 'active' : ''}`} onClick={() => setViewMode('public')}><Globe size={16} /> Public View</button>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowSettingsModal(true)}><Settings size={16} /> School Settings</button>
          <button className="btn btn-secondary" onClick={generatePublicPDF} disabled={generatingPDF}><Download size={16} /> {generatingPDF ? 'Generating...' : 'Download PDF'}</button>
          <button className="btn btn-secondary" onClick={openPublicView}><Eye size={16} /> Preview Public</button>
          <button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Fee</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card"><DollarSign size={20} /><div><span>KES {fees.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</span><label>Total Fees</label></div></div>
        <div className="stat-card"><BookOpen size={20} /><div><span>{uniqueClasses.length}</span><label>Classes</label></div></div>
        <div className="stat-card"><Globe size={20} /><div><span>{publishedCount}</span><label>Published</label></div></div>
        <div className="stat-card"><Calendar size={20} /><div><span>{uniqueYears.length}</span><label>Academic Years</label></div></div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search by class or term..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="all">All Classes</option>{uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={termFilter} onChange={e => setTermFilter(e.target.value)}><option value="all">All Terms</option>{uniqueTerms.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}><option value="all">All Years</option>{uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
        {selectedIds.length > 0 && (<div className="bulk-actions"><button className="btn btn-danger" onClick={bulkDelete}><Trash2 size={16} /> Delete ({selectedIds.length})</button><button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export Selected</button></div>)}
      </div>

      {/* Drag & Drop Import */}
      <div className="drag-zone" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={24} /> Drag & drop Excel/CSV files here for bulk import
      </div>

      {/* Content Views */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading fee structures...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th><button onClick={toggleAll}>{selectedIds.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th><th>Class</th><th>Term</th><th>Amount (KES)</th><th>Due Date</th><th>Discount</th><th>Late Fee</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td><button onClick={() => toggleSelect(f.id)}>{selectedIds.includes(f.id) ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}</button></td>
                  <td><strong>{f.className}</strong></td><td>{f.termName}</td>
                  <td className="amount">KES {f.amount.toLocaleString()}</td>
                  <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</td>
                  <td>{f.discountPercentage ? `${f.discountPercentage}%` : '-'}</td>
                  <td>{f.lateFee ? `KES ${f.lateFee.toLocaleString()}` : '-'}</td>
                  <td>{f.isPublished ? <span className="published-badge"><Globe size={12} /> Published</span> : <span className="draft-badge">Draft</span>}</td>
                  <td><div className="action-buttons"><button onClick={() => { setEditing(f); setForm(f); setShowModal(true); }}><Edit size={14} /></button><button onClick={() => handlePublish(f.id, !f.isPublished)}><Globe size={14} /></button><button className="danger" onClick={() => handleDelete(f.id)}><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-view">
          {filtered.map(f => (
            <div key={f.id} className="fee-card">
              <div className="fee-card-header"><h4>{f.className}</h4><span className="term-badge">{f.termName}</span></div>
              <div className="fee-amount">KES {f.amount.toLocaleString()}</div>
              <div className="fee-details"><div>📅 Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'TBD'}</div>{f.discountPercentage > 0 && <div>🎉 {f.discountPercentage}% early discount</div>}{f.lateFee > 0 && <div>⚠️ Late fee: KES {f.lateFee}</div>}</div>
              <div className="fee-card-actions"><button onClick={() => { setEditing(f); setForm(f); setShowModal(true); }}><Edit size={14} /> Edit</button><button onClick={() => handlePublish(f.id, !f.isPublished)}>{f.isPublished ? 'Unpublish' : 'Publish'}</button></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="public-view-preview">
          <div dangerouslySetInnerHTML={{ __html: generatePublicHTML() }} />
        </div>
      )}

      {/* Fee Structure Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="auto-calc-toggle"><label><input type="checkbox" checked={autoCalculate} onChange={e => setAutoCalculate(e.target.checked)} /> Auto-calculate totals with discounts</label></div>
              <div className="form-grid">
                <div className="form-group"><label>Class Name *</label><input value={form.className} onChange={e => setForm({...form, className: e.target.value})} placeholder="e.g., Form 1" /></div>
                <div className="form-group"><label>Term Name *</label><input value={form.termName} onChange={e => setForm({...form, termName: e.target.value})} placeholder="e.g., Term 1" /></div>
                <div className="form-group"><label>Amount (KES) *</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate?.toString().split('T')[0]} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
                <div className="form-group"><label>Early Discount (%)</label><input type="number" value={form.discountPercentage} onChange={e => setForm({...form, discountPercentage: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Late Fee (KES)</label><input type="number" value={form.lateFee} onChange={e => setForm({...form, lateFee: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Academic Year</label><input value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} placeholder="2024" /></div>
                <div className="form-group full"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Additional information..." /></div>
              </div>
              {autoCalculate && form.amount > 0 && (
                <div className="calculation-preview">
                  <h4>Fee Breakdown</h4>
                  <div>Base Amount: KES {totals.amount?.toLocaleString()}</div>
                  {totals.discount > 0 && <div className="discount">Early Discount: -KES {totals.discount.toLocaleString()}</div>}
                  {totals.late > 0 && <div className="late">Late Fee: +KES {totals.late.toLocaleString()}</div>}
                  <div className="total"><strong>Total Payable: KES {totals.total.toLocaleString()}</strong></div>
                </div>
              )}
              <div className="form-group checkbox"><label><input type="checkbox" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} /> Publish to Public Portal</label></div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Fee Structure</button></div>
            </div>
          </div>
        </div>
      )}

      {/* School Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>School Settings for Fee Structure</h3><button className="modal-close" onClick={() => setShowSettingsModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label>School Name</label><input value={schoolSettings?.schoolName || ''} onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value} as any)} placeholder="School Name" /></div>
                <div className="form-group"><label>School Motto</label><input value={schoolSettings?.motto || ''} onChange={e => setSchoolSettings({...schoolSettings, motto: e.target.value} as any)} /></div>
                <div className="form-group"><label>Phone</label><input value={schoolSettings?.phone || ''} onChange={e => setSchoolSettings({...schoolSettings, phone: e.target.value} as any)} /></div>
                <div className="form-group"><label>Email</label><input value={schoolSettings?.email || ''} onChange={e => setSchoolSettings({...schoolSettings, email: e.target.value} as any)} /></div>
                <div className="form-group full"><label>Address</label><input value={schoolSettings?.address || ''} onChange={e => setSchoolSettings({...schoolSettings, address: e.target.value} as any)} /></div>
                <div className="form-group"><label>Bank Account</label><input value={schoolSettings?.bankAccount || ''} onChange={e => setSchoolSettings({...schoolSettings, bankAccount: e.target.value} as any)} placeholder="Bank Name, Account Number" /></div>
                <div className="form-group"><label>MPESA Paybill</label><input value={schoolSettings?.mpesaPaybill || ''} onChange={e => setSchoolSettings({...schoolSettings, mpesaPaybill: e.target.value} as any)} placeholder="Paybill Number" /></div>
                <div className="form-group"><label>Logo URL</label><input value={schoolSettings?.logoUrl || ''} onChange={e => setSchoolSettings({...schoolSettings, logoUrl: e.target.value} as any)} placeholder="https://..." /></div>
              </div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button><button className="btn btn-primary" onClick={async () => { await schoolSettingsService.updateSettings(schoolSettings!); toast.success('Settings saved'); setShowSettingsModal(false); fetchData(); }}>Save Settings</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Fee Structures</h3><button className="modal-close" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body"><input type="file" multiple onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} accept=".xlsx,.csv" /><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn btn-primary" onClick={doImport}>Import {importFiles.length} File(s)</button></div></div>
          </div>
        </div>
      )}

      <style>{`
        .fee-structure-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card span { font-size: 24px; font-weight: 700; display: block; }
        .stat-card label { font-size: 12px; color: #6b7280; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .drag-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; background: white; cursor: pointer; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .amount { font-weight: 600; color: #1d8a8a; }
        .published-badge { display: inline-flex; align-items: center; gap: 4px; background: #d1fae5; color: #10b981; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
        .draft-badge { background: #f1f5f9; color: #64748b; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .fee-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .fee-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .fee-card-header h4 { margin: 0; font-size: 16px; }
        .term-badge { background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
        .fee-amount { font-size: 24px; font-weight: 700; color: #1d8a8a; margin: 8px 0; }
        .fee-details { font-size: 12px; color: #6b7280; margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
        .fee-card-actions { display: flex; gap: 8px; margin-top: 12px; }
        .fee-card-actions button { flex: 1; padding: 6px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .public-view-preview { background: white; border-radius: 12px; overflow: hidden; max-height: 80vh; overflow-y: auto; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .auto-calc-toggle { margin-bottom: 16px; padding: 8px; background: #f0fdf4; border-radius: 8px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group.checkbox { flex-direction: row; align-items: center; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .calculation-preview { margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1d8a8a; }
        .calculation-preview h4 { margin: 0 0 8px; font-size: 14px; }
        .calculation-preview .discount { color: #10b981; }
        .calculation-preview .late { color: #f59e0b; }
        .calculation-preview .total { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } .stats-row { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}