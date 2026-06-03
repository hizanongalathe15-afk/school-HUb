// client/src/components/roles/admin/AdminAcademicReportsPage.tsx
import React, { useState } from 'react';
import { 
  FileText, Download, Upload, Search, Filter, Calendar, 
  TrendingUp, Users, BookOpen, Award, Printer, Eye,
  ChevronDown, ChevronRight, BarChart3, PieChart,
  FileSpreadsheet, FileJson, Mail, Share2, Star,
  Loader2, CheckCircle, AlertCircle, X
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lastGenerated?: string;
}

export default function AdminAcademicReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string>('academic');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const [showDragOverlay, setShowDragOverlay] = useState(false);

  const reportCategories = [
    {
      id: 'academic',
      title: 'Academic Reports',
      icon: <BookOpen size={20} />,
      reports: [
        { id: 'termly-results', name: 'Termly Results', description: 'Complete term results for all students with grade analysis', icon: <FileText size={18} />, color: 'blue' },
        { id: 'student-transcripts', name: 'Student Transcripts', description: 'Individual student academic history across all terms', icon: <FileText size={18} />, color: 'green' },
        { id: 'class-performance', name: 'Class Performance', description: 'Performance analysis by class with subject breakdown', icon: <TrendingUp size={18} />, color: 'purple' },
        { id: 'subject-analysis', name: 'Subject Analysis', description: 'Subject-wise performance with teacher rankings', icon: <BarChart3 size={18} />, color: 'orange' },
        { id: 'grade-distribution', name: 'Grade Distribution', description: 'Statistical distribution of grades across classes', icon: <PieChart size={18} />, color: 'pink' },
      ]
    },
    {
      id: 'exams',
      title: 'Examination Reports',
      icon: <Award size={20} />,
      reports: [
        { id: 'kcse-prediction', name: 'KCSE Prediction', description: 'AI-powered KCSE performance prediction', icon: <Star size={18} />, color: 'yellow' },
        { id: 'exam-analysis', name: 'Exam Analysis', description: 'Detailed exam performance with question-level analysis', icon: <BarChart3 size={18} />, color: 'indigo' },
        { id: 'comparative-analysis', name: 'Comparative Analysis', description: 'Term-to-term and year-to-year comparison', icon: <TrendingUp size={18} />, color: 'cyan' },
      ]
    },
    {
      id: 'progress',
      title: 'Progress Reports',
      icon: <TrendingUp size={20} />,
      reports: [
        { id: 'student-progress', name: 'Student Progress', description: 'Individual student progress tracking over time', icon: <TrendingUp size={18} />, color: 'teal' },
        { id: 'teacher-performance', name: 'Teacher Performance', description: 'Teacher effectiveness based on student results', icon: <Users size={18} />, color: 'rose' },
        { id: 'remedial-report', name: 'Remedial Report', description: 'Students needing intervention and support', icon: <AlertCircle size={18} />, color: 'red' },
      ]
    }
  ];

  const classes = ['Form 1', 'Form 1A', 'Form 1B', 'Form 1C', 'Form 2', 'Form 2A', 'Form 2B', 'Form 3', 'Form 3A', 'Form 3B', 'Form 4', 'Form 4A', 'Form 4B'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = ['2024', '2023', '2022', '2021', '2020'];

  const handleGenerate = async (reportId: string, reportName: string) => {
    setLoading(true);
    setSelectedReport(reportId);
    
    // Simulate report generation
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage(`${reportName} generated successfully!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast(`Exporting as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    toast('Share link copied to clipboard!');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDragOverlay(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDragOverlay(false);
  };

  const handleDrop = (e: React.DragEvent, reportId: string, reportName: string) => {
    e.preventDefault();
    setShowDragOverlay(false);
    const files = Array.from(e.dataTransfer.files);
    setDraggedFiles(files);
    toast(`${files.length} file(s) dropped for ${reportName}`);
    
    // Process files (CSV/Excel for bulk data)
    files.forEach(file => {
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        toast(`Processing ${file.name}...`);
      }
    });
  };

  const toast = (message: string) => {
    // Simple toast implementation
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      yellow: 'from-yellow-500 to-yellow-600',
      indigo: 'from-indigo-500 to-indigo-600',
      cyan: 'from-cyan-500 to-cyan-600',
      teal: 'from-teal-500 to-teal-600',
      rose: 'from-rose-500 to-rose-600',
      red: 'from-red-500 to-red-600',
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Drag Overlay */}
      {showDragOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center border-4 border-dashed border-teal-500">
            <Upload size={48} className="mx-auto text-teal-500 mb-4" />
            <p className="text-lg font-semibold">Drop files here</p>
            <p className="text-sm text-gray-500">CSV, Excel, or Image files accepted</p>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Academic Reports</h1>
          <p className="text-gray-500">Generate, export, and analyze academic performance reports</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Terms</option>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="From"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="space-y-6">
          {reportCategories.map(category => {
            const filteredReports = category.reports.filter(r => 
              r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.description.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredReports.length === 0) return null;

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? '' : category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-teal-600">{category.icon}</div>
                    <h2 className="text-lg font-semibold text-gray-800">{category.title}</h2>
                    <span className="text-sm text-gray-400">({filteredReports.length})</span>
                  </div>
                  {expandedCategory === category.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {expandedCategory === category.id && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredReports.map((report) => (
                        <div
                          key={report.id}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, report.id, report.name)}
                          className="group relative bg-white border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-lg transition-all duration-300"
                        >
                          {/* Report Icon */}
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getColorClasses(report.color)} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                            {report.icon}
                          </div>
                          
                          {/* Report Info */}
                          <h3 className="font-semibold text-gray-800 mb-1">{report.name}</h3>
                          <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                          
                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleGenerate(report.id, report.name)}
                              disabled={loading && selectedReport === report.id}
                              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {loading && selectedReport === report.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                              Generate
                            </button>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleExport('pdf')}
                                className="p-2 text-gray-500 hover:text-teal-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Export as PDF"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={() => handleExport('excel')}
                                className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Export as Excel"
                              >
                                <FileSpreadsheet size={16} />
                              </button>
                              <button
                                onClick={handlePrint}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Print"
                              >
                                <Printer size={16} />
                              </button>
                              <button
                                onClick={handleShare}
                                className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Share"
                              >
                                <Share2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Drag hint */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={14} className="text-gray-400" />
                          </div>
                          
                          {/* Last generated */}
                          {report.lastGenerated && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                              <Eye size={12} />
                              Last generated: {report.lastGenerated}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Email Reports</p>
                <p className="text-xs text-blue-500">Send reports to parents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Schedule Reports</p>
                <p className="text-xs text-green-500">Auto-generate on dates</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <FileJson size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">API Access</p>
                <p className="text-xs text-purple-500">Integrate with external systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}