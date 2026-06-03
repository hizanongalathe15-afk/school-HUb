// client/src/components/roles/admin/AdminResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, Save, BarChart3, Filter, Eye, Printer,
  TrendingUp, TrendingDown, Award, Users, BookOpen, Calendar,
  FileSpreadsheet, FileText, Mail, MessageCircle, PieChart,
  LineChart, AlertCircle, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, Copy, Share2, Star, Medal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService } from '../../../services/adminService';
import EditableSelect from '../../ui/EditableSelect';

interface Result {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  year: number;
  score: number;
  grade: string;
  points: number;
  remark: string;
  enteredBy: string;
  enteredAt: string;
  updatedAt: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Class {
  id: string;
  name: string;
  stream: string;
}

interface Term {
  id: string;
  name: string;
  year: number;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Result | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkAdjustment, setBulkAdjustment] = useState({ type: 'add', value: 0 });
  const [showResultCard, setShowResultCard] = useState<any>(null);

  const [form, setForm] = useState({
    studentId: '',
    subjectId: '',
    score: 0,
    termId: '',
    year: new Date().getFullYear(),
    grade: '',
    points: 0,
    remark: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resultsData, subjectsData, classesData, termsData] = await Promise.all([
        academicManagementService.getResults(),
        academicManagementService.getSubjects(),
        academicManagementService.getClasses(),
        academicManagementService.getTerms()
      ]);
      setResults(resultsData || []);
      setSubjects(subjectsData || []);
      setClasses(classesData || []);
      setTerms(termsData || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const calculateGrade = (score: number): { grade: string; points: number; remark: string } => {
    if (score >= 80) return { grade: 'A', points: 12, remark: 'Excellent' };
    if (score >= 75) return { grade: 'A-', points: 11, remark: 'Very Good' };
    if (score >= 70) return { grade: 'B+', points: 10, remark: 'Good' };
    if (score >= 65) return { grade: 'B', points: 9, remark: 'Above Average' };
    if (score >= 60) return { grade: 'B-', points: 8, remark: 'Average' };
    if (score >= 55) return { grade: 'C+', points: 7, remark: 'Satisfactory' };
    if (score >= 50) return { grade: 'C', points: 6, remark: 'Fair' };
    if (score >= 45) return { grade: 'C-', points: 5, remark: 'Below Average' };
    if (score >= 40) return { grade: 'D+', points: 4, remark: 'Poor' };
    if (score >= 35) return { grade: 'D', points: 3, remark: 'Very Poor' };
    if (score >= 30) return { grade: 'D-', points: 2, remark: 'Weak' };
    return { grade: 'E', points: 1, remark: 'Fail' };
  };

  const updateFormWithGrade = (score: number) => {
    const { grade, points, remark } = calculateGrade(score);
    setForm({ ...form, score, grade, points, remark });
  };

  const openModal = (result?: Result) => {
    if (result) {
      setEditing(result);
      setForm({
        studentId: result.studentId,
        subjectId: result.subjectId,
        score: result.score,
        termId: result.termId,
        year: result.year,
        grade: result.grade,
        points: result.points,
        remark: result.remark
      });
    } else {
      setEditing(null);
      setForm({
        studentId: '',
        subjectId: '',
        score: 0,
        termId: '',
        year: new Date().getFullYear(),
        grade: '',
        points: 0,
        remark: ''
      });
    }
    setShowModal(true);
  };

  const save = async () => {
    if (!form.studentId || !form.subjectId || !form.score || !form.termId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editing) {
        await academicManagementService.updateResult(editing.id, form);
        toast.success('Result updated');
      } else {
        await academicManagementService.createResult(form);
        toast.success('Result added');
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error('Save failed');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this result? This cannot be undone.')) return;
    try {
      await academicManagementService.deleteResult(id);
      toast.success('Result deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(r => r.id));

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} results?`)) return;
    await Promise.all(selected.map(id => academicManagementService.deleteResult(id)));
    toast.success(`Deleted ${selected.length} results`);
    setSelected([]);
    fetchData();
  };

  const bulkAdjustScores = async () => {
    const adjustments = selected.map(id => ({
      id,
      score: bulkAdjustment.type === 'add' ? bulkAdjustment.value : -bulkAdjustment.value
    }));
    await academicManagementService.bulkAdjustScores(adjustments);
    toast.success(`Adjusted ${selected.length} results`);
    setShowBulkEdit(false);
    setSelected([]);
    fetchData();
  };

  const exportResults = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const blob = await academicManagementService.bulkExport({ 
        type: 'results', 
        ids: selected.length ? selected : undefined,
        format,
        filters: { classId: classFilter, termId: termFilter, year: yearFilter }
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selected.length || filtered.length} results`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      const data = await academicManagementService.getResultAnalytics({
        classId: classFilter !== 'all' ? classFilter : undefined,
        termId: termFilter !== 'all' ? termFilter : undefined,
        year: yearFilter
      });
      setAnalyticsData(data);
      setShowAnalytics(true);
    } catch (error) {
      toast.error('Failed to generate analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateReportCard = async (studentId: string) => {
    try {
      const data = await academicManagementService.getReportCard(studentId, termFilter, yearFilter);
      setShowResultCard(data);
    } catch (error) {
      toast.error('Failed to generate report card');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImportFiles(files);
    setShowImport(true);
  };

  const doImport = async () => {
    for (const file of importFiles) {
      await academicManagementService.bulkImport('results', file);
    }
    toast.success(`${importFiles.length} file(s) imported`);
    setShowImport(false);
    setImportFiles([]);
    fetchData();
  };

  const filtered = results.filter(r => {
    const matchesSearch = r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || r.classId === classFilter;
    const matchesSubject = subjectFilter === 'all' || r.subjectId === subjectFilter;
    const matchesTerm = termFilter === 'all' || r.termId === termFilter;
    const matchesYear = r.year === parseInt(yearFilter);
    return matchesSearch && matchesClass && matchesSubject && matchesTerm && matchesYear;
  });

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'text-green-600 bg-green-100',
      'A-': 'text-green-600 bg-green-100',
      'B+': 'text-blue-600 bg-blue-100',
      'B': 'text-blue-600 bg-blue-100',
      'B-': 'text-blue-600 bg-blue-100',
      'C+': 'text-yellow-600 bg-yellow-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'C-': 'text-orange-600 bg-orange-100',
      'D+': 'text-red-600 bg-red-100',
      'D': 'text-red-600 bg-red-100',
      'E': 'text-red-700 bg-red-200',
    };
    return colors[grade] || 'text-gray-600 bg-gray-100';
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="results-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Results Management</h1>
          <p>Manage student results, generate analytics, and export reports</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Import
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Result
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-row">
        <div className="stat-card">
          <BookOpen size={20} />
          <div><span className="stat-value">{filtered.length}</span><span className="stat-label">Total Results</span></div>
        </div>
        <div className="stat-card">
          <Users size={20} />
          <div><span className="stat-value">{new Set(filtered.map(r => r.studentId)).size}</span><span className="stat-label">Students</span></div>
        </div>
        <div className="stat-card">
          <Award size={20} />
          <div><span className="stat-value">{filtered.filter(r => r.grade === 'A' || r.grade === 'A-').length}</span><span className="stat-label">Distinctions</span></div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div><span className="stat-value">{(filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length || 0).toFixed(1)}%</span><span className="stat-label">Average Score</span></div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="bulk-actions">
          <span>{selected.length} results selected</span>
          <div className="bulk-buttons">
            <button onClick={() => setShowBulkEdit(true)} className="btn-sm">
              <Edit size={14} /> Adjust Scores
            </button>
            <button onClick={exportResults} className="btn-sm">
              <Download size={14} /> Export
            </button>
            <button onClick={bulkDelete} className="btn-sm danger">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by student name or admission number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="filter-select">
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
        </select>

        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="filter-select">
          <option value="all">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={termFilter} onChange={e => setTermFilter(e.target.value)} className="filter-select">
          <option value="all">All Terms</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.year}</option>)}
        </select>

        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="filter-select">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button className="btn-analytics" onClick={generateAnalytics}>
          <BarChart3 size={16} /> Analytics
        </button>
      </div>

      {/* Drag & Drop Import Area */}
      <div className="drag-drop-area" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={32} />
        <p>Drag & drop Excel/CSV files here for bulk import</p>
        <small>Supports .xlsx, .csv, .xls formats</small>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading results...</p></div>
      ) : (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th className="checkbox"><button onClick={toggleAll}>{selected.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Term</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(result => (
                <tr key={result.id}>
                  <td className="checkbox"><button onClick={() => toggle(result.id)}>{selected.includes(result.id) ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} />}</button></td>
                  <td>{result.admissionNumber}</td>
                  <td className="student-name">{result.studentName}</td>
                  <td>{result.className}</td>
                  <td>{result.subjectName}</td>
                  <td className="score-cell">{result.score}%</td>
                  <td><span className={`grade-badge ${getGradeColor(result.grade)}`}>{result.grade}</span></td>
                  <td>{result.points}</td>
                  <td>{result.termName} {result.year}</td>
                  <td className="actions">
                    <button onClick={() => openModal(result)} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => del(result.id)} title="Delete" className="danger"><Trash2 size={16} /></button>
                    <button onClick={() => generateReportCard(result.studentId)} title="Report Card"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="empty-state"><BookOpen size={48} /><p>No results found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Bar */}
      <div className="export-bar">
        <span>Export Results:</span>
        <button onClick={() => exportResults('excel')}><FileSpreadsheet size={16} /> Excel</button>
        <button onClick={() => exportResults('pdf')}><FileText size={16} /> PDF</button>
        <button onClick={() => exportResults('csv')}><Download size={16} /> CSV</button>
        <button onClick={() => exportResults('excel')}><Printer size={16} /> Print</button>
        <button onClick={() => exportResults('excel')}><Mail size={16} /> Email</button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Result' : 'Add New Result'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Student *</label>
                <EditableSelect
                  value={form.studentId}
                  onChange={(val) => setForm({ ...form, studentId: val })}
                  options={[]}
                  placeholder="Type to search student..."
                />
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Score (%) *</label>
                <input type="number" min="0" max="100" value={form.score} onChange={e => updateFormWithGrade(parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Term *</label>
                <select value={form.termId} onChange={e => setForm({ ...form, termId: e.target.value })}>
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.year}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="result-preview">
                <div className="preview-item"><span>Grade:</span><strong>{form.grade || '-'}</strong></div>
                <div className="preview-item"><span>Points:</span><strong>{form.points || '-'}</strong></div>
                <div className="preview-item"><span>Remark:</span><strong>{form.remark || '-'}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}><Save size={16} /> Save Result</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analyticsData && (
        <div className="modal-overlay" onClick={() => setShowAnalytics(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Performance Analytics</h3>
              <button className="close-btn" onClick={() => setShowAnalytics(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="analytics-summary">
                <div className="analytics-card"><span>Mean Score</span><strong>{analyticsData.meanScore}%</strong></div>
                <div className="analytics-card"><span>Mean Grade</span><strong>{analyticsData.meanGrade}</strong></div>
                <div className="analytics-card"><span>Top Student</span><strong>{analyticsData.topStudent}</strong></div>
                <div className="analytics-card"><span>Pass Rate</span><strong>{analyticsData.passRate}%</strong></div>
              </div>
              <div className="grade-distribution">
                <h4>Grade Distribution</h4>
                <div className="grade-bars">
                  {Object.entries(analyticsData.gradeDistribution || {}).map(([grade, count]) => (
                    <div key={grade} className="grade-bar-item">
                      <span>{grade}</span>
                      <div className="bar"><div style={{ width: `${(count as number / analyticsData.total) * 100}%` }} /></div>
                      <span>{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="subject-performance">
                <h4>Subject Performance</h4>
                {Object.entries(analyticsData.subjectPerformance || {}).map(([subject, data]: [string, any]) => (
                  <div key={subject} className="subject-row">
                    <span>{subject}</span>
                    <div className="score-bar"><div style={{ width: `${data.mean}%` }} /></div>
                    <span>{data.mean}%</span>
                    <span className="grade">{data.grade}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => exportResults('excel')}>Export Report</button>
              <button className="btn-secondary" onClick={() => setShowAnalytics(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="modal-overlay" onClick={() => setShowBulkEdit(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Score Adjustment</h3>
              <button className="close-btn" onClick={() => setShowBulkEdit(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="bulk-options">
                <label>
                  <input type="radio" value="add" checked={bulkAdjustment.type === 'add'} onChange={() => setBulkAdjustment({ ...bulkAdjustment, type: 'add' })} />
                  Add points
                </label>
                <label>
                  <input type="radio" value="subtract" checked={bulkAdjustment.type === 'subtract'} onChange={() => setBulkAdjustment({ ...bulkAdjustment, type: 'subtract' })} />
                  Subtract points
                </label>
                <input type="number" placeholder="Value" value={bulkAdjustment.value} onChange={e => setBulkAdjustment({ ...bulkAdjustment, value: parseInt(e.target.value) })} />
              </div>
              <p className="warning">This will affect {selected.length} selected results</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkEdit(false)}>Cancel</button>
              <button className="btn-primary" onClick={bulkAdjustScores}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Results</h3>
              <button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="import-area">
                <Upload size={48} />
                <p>Select Excel or CSV files</p>
                <input type="file" multiple accept=".xlsx,.csv,.xls" onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} />
                {importFiles.length > 0 && <div className="file-list">{importFiles.map((f, i) => <span key={i}>{f.name}</span>)}</div>}
              </div>
              <a href="/templates/results-template.xlsx" download className="template-link">Download template</a>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary" onClick={doImport} disabled={importFiles.length === 0}>Import {importFiles.length} Files</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .results-page { padding: 24px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-header h1 { font-size: 28px; margin: 0 0 8px 0; }
        .page-header p { margin: 0; color: #6b7280; }
        .page-actions { display: flex; gap: 12px; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid #e5e7eb; }
        .stat-value { font-size: 24px; font-weight: bold; display: block; }
        .stat-label { font-size: 12px; color: #6b7280; }
        .bulk-actions { background: #e0f2fe; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .bulk-buttons { display: flex; gap: 8px; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; background: white; padding: 16px; border-radius: 16px; border: 1px solid #e5e7eb; }
        .search-box { display: flex; align-items: center; gap: 8px; flex: 1; background: #f9fafb; padding: 8px 12px; border-radius: 10px; }
        .search-box input { flex: 1; border: none; outline: none; background: transparent; }
        .filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; }
        .btn-analytics { background: #1d8a8a; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px; background: #fafbfc; cursor: pointer; }
        .table-container { background: white; border-radius: 16px; overflow-x: auto; border: 1px solid #e5e7eb; }
        .results-table { width: 100%; border-collapse: collapse; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        .results-table th { background: #f9fafb; font-weight: 600; }
        .checkbox { width: 40px; text-align: center; }
        .student-name { font-weight: 500; }
        .score-cell { font-weight: 600; }
        .grade-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .actions { display: flex; gap: 8px; }
        .actions button { padding: 6px; border-radius: 6px; border: none; cursor: pointer; background: #f3f4f6; }
        .actions button.danger { color: #dc2626; }
        .export-bar { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding: 12px; background: white; border-radius: 12px; }
        .export-bar button { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 20px; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .result-preview { display: flex; gap: 16px; padding: 12px; background: #f9fafb; border-radius: 12px; margin-top: 16px; }
        .preview-item { flex: 1; text-align: center; }
        .preview-item span { display: block; font-size: 11px; color: #6b7280; }
        .preview-item strong { font-size: 16px; }
        .analytics-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .analytics-card { background: #f9fafb; border-radius: 12px; padding: 16px; text-align: center; }
        .analytics-card span { display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px; }
        .analytics-card strong { font-size: 24px; }
        .grade-distribution, .subject-performance { margin-top: 24px; }
        .grade-distribution h4, .subject-performance h4 { margin: 0 0 16px 0; }
        .grade-bar-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .grade-bar-item .bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .grade-bar-item .bar div { height: 100%; background: #1d8a8a; border-radius: 4px; }
        .subject-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .subject-row .score-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
        .subject-row .score-bar div { height: 100%; background: #3b82f6; }
        .btn-primary, .btn-secondary, .btn-sm { padding: 8px 16px; border-radius: 10px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .btn-sm.danger { background: #fee2e2; color: #dc2626; }
        .loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .empty-state { text-align: center; padding: 60px; color: #9ca3af; }
        @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .filters-bar { flex-direction: column; } }
      `}</style>
    </div>
  );
}