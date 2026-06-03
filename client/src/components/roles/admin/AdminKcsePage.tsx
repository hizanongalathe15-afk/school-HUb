// client/src/components/roles/admin/AdminKcsePage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, Search, Filter, Calendar, 
  TrendingUp, TrendingDown, Users, Award, 
  BarChart3, PieChart, LineChart, FileText,
  Eye, Printer, Share2, Star, Medal, Trophy,
  ChevronDown, ChevronRight, Clock, AlertCircle,
  CheckCircle, XCircle, Plus, Trash2, Edit3,
  RefreshCw, Settings, DownloadCloud, Mail,
  MessageCircle, Globe, BookOpen, GraduationCap,
  Target, Zap, Brain, Activity, Percent, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsService } from '../../../services/adminService';

interface ExamResult {
  id: string;
  studentName: string;
  admissionNumber: string;
  gender: 'M' | 'F';
  subjectGrades: Record<string, string>;
  totalPoints: number;
  meanGrade: string;
  rank?: number;
}

interface ExamYearData {
  year: number;
  examType: string;
  totalCandidates: number;
  meanScore: number;
  meanGrade: string;
  topStudent: string;
  topScore: number;
  universityQualification: number;
  distinctions: number;
  credits: number;
  passes: number;
  failures: number;
  subjectPerformance: Record<string, { mean: number; grade: string }>;
  genderBreakdown: { male: number; female: number };
  gradeDistribution: Record<string, number>;
}

interface ExamType {
  id: string;
  name: string;
  code: string;
  description: string;
  gradeSystem: 'A-E' | 'A-F' | 'A*-G' | '1-12' | '1-7' | 'Percentage';
  maxPoints: number;
}

export default function AdminKcsePage() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedExamType, setSelectedExamType] = useState('KCSE');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<ExamYearData | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'points'>('rank');
  const [selectedStudent, setSelectedStudent] = useState<ExamResult | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [comparisonYears, setComparisonYears] = useState<string[]>(['2024', '2023']);
  const [historicalData, setHistoricalData] = useState<ExamYearData[]>([]);
  const [showUploadArea, setShowUploadArea] = useState(true);

  const examTypes: ExamType[] = [
    { id: 'kcse', name: 'KCSE', code: 'KCSE', description: 'Kenya Certificate of Secondary Education', gradeSystem: 'A-E', maxPoints: 84 },
    { id: 'kcpe', name: 'KCPE', code: 'KCPE', description: 'Kenya Certificate of Primary Education', gradeSystem: 'Percentage', maxPoints: 500 },
    { id: 'cbc', name: 'CBC', code: 'CBC', description: 'Competency Based Curriculum', gradeSystem: 'A-E', maxPoints: 100 },
    { id: 'igcse', name: 'IGCSE', code: 'IGCSE', description: 'International General Certificate', gradeSystem: 'A*-G', maxPoints: 100 },
    { id: 'ib', name: 'IB', code: 'IB', description: 'International Baccalaureate', gradeSystem: '1-7', maxPoints: 45 },
    { id: 'national', name: 'National Exams', code: 'NATIONAL', description: 'Other National Examinations', gradeSystem: 'Percentage', maxPoints: 100 },
  ];

  const years = ['2025', '2024', '2023', '2022', '2021', '2020'];

  const loadExamData = async (year: string, examType: string) => {
    setLoading(true);
    try {
      const response = await reportsService.getKcseExamSummary(year, examType);
      setExamData(response?.examData || null);
      setResults(Array.isArray(response?.results) ? response.results : []);
      if (!response?.examData) {
        toast('No exam records found for this year yet. Upload or enter results first.');
      }
    } catch {
      toast.error('Failed to load exam data');
      setExamData(null);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResults) {
      void loadExamData(selectedYear, selectedExamType);
    }
  }, [selectedYear, selectedExamType, showResults]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const blob = await reportsService.generateKcseAnalysis(selectedYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `${selectedExamType.toLowerCase()}-${selectedYear}-analysis.xlsx`; 
      a.click(); 
      URL.revokeObjectURL(url);
      toast.success(`${selectedExamType} analysis for ${selectedYear} generated`);
      setShowResults(true);
    } catch {
      toast.error('Failed to generate analysis');
      await loadExamData(selectedYear, selectedExamType);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    toast.success(`${droppedFiles.length} file(s) uploaded for processing`);
    // Process files logic here
  };

  const handleExportResults = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const blob = await reportsService.exportExamResults(selectedYear, selectedExamType, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExamType}-${selectedYear}-results.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const handleViewStudent = (student: ExamResult) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const filteredResults = results
    .filter(r => {
      if (searchTerm && !r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !r.admissionNumber.includes(searchTerm)) return false;
      if (filterGrade !== 'all' && r.meanGrade !== filterGrade) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rank') return (a.rank || 0) - (b.rank || 0);
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      return 0;
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

  return (
    <div className="kcse-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>National Examinations Analysis</h1>
          <p>Track performance across KCSE, KCPE, CBC, and other national exams</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => setShowUploadArea(!showUploadArea)}>
            <Upload size={16} /> Upload Results
          </button>
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Processing...' : 'Generate Analysis'}
          </button>
        </div>
      </div>

      {/* Exam Type Selector */}
      <div className="exam-types">
        {examTypes.map(type => (
          <button
            key={type.id}
            className={`exam-type-btn ${selectedExamType === type.code ? 'active' : ''}`}
            onClick={() => setSelectedExamType(type.code)}
          >
            <GraduationCap size={18} />
            <div>
              <strong>{type.name}</strong>
              <small>{type.description}</small>
            </div>
          </button>
        ))}
      </div>

      {/* Upload Area */}
      {showUploadArea && (
        <div 
          className="upload-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={40} />
          <h3>Upload Examination Data</h3>
          <p>Drag & drop Excel/CSV files or click to browse</p>
          <small>Supports .xlsx, .csv, .xls formats</small>
          <input type="file" multiple accept=".xlsx,.csv,.xls" onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files));
              toast.success(`${e.target.files.length} file(s) selected`);
            }
          }} />
          {files.length > 0 && (
            <div className="uploaded-files">
              {files.map((f, i) => (
                <span key={i} className="file-tag">{f.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Year Selector */}
      <div className="year-selector">
        <label>Select Year</label>
        <div className="year-buttons">
          {years.map(y => (
            <button
              key={y}
              className={`year-btn ${selectedYear === y ? 'active' : ''}`}
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {showResults && examData && (
        <>
          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon candidates">
                <Users size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.totalCandidates}</span>
                <span className="stat-label">Total Candidates</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon mean-score">
                <Target size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.meanScore}%</span>
                <span className="stat-label">Mean Score</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon mean-grade">
                <Award size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.meanGrade}</span>
                <span className="stat-label">Mean Grade</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon top-student">
                <Trophy size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.topStudent}</span>
                <span className="stat-label">Top Student</span>
                <small>{examData.topScore} points</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon university">
                <GraduationCap size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.universityQualification}</span>
                <span className="stat-label">University Qualifiers</span>
                <small>{Math.round((examData.universityQualification / examData.totalCandidates) * 100)}%</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gender">
                <Users size={24} />
              </div>
              <div>
                <span className="stat-value">{examData.genderBreakdown.male} / {examData.genderBreakdown.female}</span>
                <span className="stat-label">Male / Female</span>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="grade-distribution">
            <h3>Grade Distribution</h3>
            <div className="grade-bars">
              {Object.entries(examData.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="grade-bar-item">
                  <span className="grade-label">{grade}</span>
                  <div className="bar-container">
                    <div 
                      className={`bar bar-${grade.charAt(0)}`} 
                      style={{ width: `${(count / examData.totalCandidates) * 100}%` }}
                    />
                  </div>
                  <span className="grade-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="subject-performance">
            <h3>Subject Performance Analysis</h3>
            <div className="subjects-grid">
              {Object.entries(examData.subjectPerformance).map(([subject, data]) => (
                <div key={subject} className="subject-card">
                  <div className="subject-header">
                    <span className="subject-name">{subject}</span>
                    <span className={`subject-grade ${getGradeColor(data.grade)}`}>{data.grade}</span>
                  </div>
                  <div className="subject-score">
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${data.mean}%` }} />
                    </div>
                    <span className="score-value">{data.mean}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Trend */}
          <div className="performance-trend">
            <h3>Historical Performance</h3>
            <div className="trend-chart">
              {years.slice(0, 5).reverse().map((year, idx) => (
                <div key={year} className="trend-bar-item">
                  <div className="trend-bar-container">
                    <div 
                      className="trend-bar" 
                      style={{ height: `${(parseInt(year) === 2025 ? 72 : parseInt(year) === 2024 ? 68 : 65)}%` }}
                    />
                  </div>
                  <span>{year}</span>
                  <strong>{parseInt(year) === 2025 ? '7.2' : parseInt(year) === 2024 ? '6.8' : '6.5'}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="export-options">
            <h3>Export Reports</h3>
            <div className="export-buttons">
              <button onClick={() => handleExportResults('excel')}><FileText size={16} /> Excel</button>
              <button onClick={() => handleExportResults('pdf')}><Download size={16} /> PDF</button>
              <button onClick={() => handleExportResults('csv')}><DownloadCloud size={16} /> CSV</button>
              <button><Printer size={16} /> Print</button>
              <button><Mail size={16} /> Email Report</button>
            </div>
          </div>

          {/* Student Results Table */}
          <div className="results-table-container">
            <div className="table-header">
              <h3>Candidate Results</h3>
              <div className="table-controls">
                <div className="search-box">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name or admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
                  <option value="all">All Grades</option>
                  <option value="A">Grade A</option>
                  <option value="B+">Grade B+</option>
                  <option value="B">Grade B</option>
                  <option value="C+">Grade C+</option>
                  <option value="C">Grade C</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="rank">Sort by Rank</option>
                  <option value="name">Sort by Name</option>
                  <option value="points">Sort by Points</option>
                </select>
              </div>
            </div>
            
            <div className="results-table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Admission No.</th>
                    <th>Student Name</th>
                    <th>Gender</th>
                    <th>Total Points</th>
                    <th>Mean Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((student) => (
                    <tr key={student.id}>
                      <td className="rank-cell">#{student.rank}</td>
                      <td>{student.admissionNumber}</td>
                      <td className="student-name">{student.studentName}</td>
                      <td>{student.gender}</td>
                      <td className="points-cell">{student.totalPoints}</td>
                      <td>
                        <span className={`grade-badge ${getGradeColor(student.meanGrade)}`}>
                          {student.meanGrade}
                        </span>
                      </td>
                      <td>
                        <button className="view-btn" onClick={() => handleViewStudent(student)}>
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Performance Details</h3>
              <button className="close-btn" onClick={() => setShowStudentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="student-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedStudent.studentName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Admission No:</span>
                  <span className="value">{selectedStudent.admissionNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Gender:</span>
                  <span className="value">{selectedStudent.gender}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Points:</span>
                  <span className="value highlight">{selectedStudent.totalPoints}</span>
                </div>
                <div className="info-row">
                  <span className="label">Mean Grade:</span>
                  <span className={`value grade-badge ${getGradeColor(selectedStudent.meanGrade)}`}>
                    {selectedStudent.meanGrade}
                  </span>
                </div>
                {selectedStudent.rank && (
                  <div className="info-row">
                    <span className="label">Position:</span>
                    <span className="value">#{selectedStudent.rank} out of {examData?.totalCandidates}</span>
                  </div>
                )}
              </div>
              <div className="subject-breakdown">
                <h4>Subject Grades</h4>
                <div className="subjects-grid small">
                  {Object.entries(selectedStudent.subjectGrades).map(([subject, grade]) => (
                    <div key={subject} className="subject-grade-item">
                      <span>{subject}</span>
                      <span className={`grade-badge-small ${getGradeColor(grade)}`}>{grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowStudentModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                toast.success(`Certificate for ${selectedStudent.studentName} is being generated`);
              }}>
                <Download size={16} /> Generate Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kcse-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
        }

        .page-header p {
          margin: 0;
          color: #6b7280;
        }

        .page-actions {
          display: flex;
          gap: 12px;
        }

        .exam-types {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .exam-type-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .exam-type-btn.active {
          border-color: #1d8a8a;
          background: rgba(29,138,138,0.05);
          box-shadow: 0 2px 8px rgba(29,138,138,0.1);
        }

        .exam-type-btn strong {
          display: block;
          font-size: 14px;
        }

        .exam-type-btn small {
          font-size: 11px;
          color: #6b7280;
        }

        .upload-area {
          background: white;
          border: 2px dashed #cbd5e1;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin-bottom: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-area:hover {
          border-color: #1d8a8a;
          background: rgba(29,138,138,0.02);
        }

        .upload-area input {
          display: none;
        }

        .uploaded-files {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
          justify-content: center;
        }

        .file-tag {
          background: #f3f4f6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .year-selector {
          background: white;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .year-selector label {
          font-weight: 500;
          margin-right: 20px;
        }

        .year-buttons {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .year-btn {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
        }

        .year-btn.active {
          background: #1d8a8a;
          color: white;
          border-color: #1d8a8a;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.candidates { background: #e0e7ff; color: #4338ca; }
        .stat-icon.mean-score { background: #d1fae5; color: #059669; }
        .stat-icon.mean-grade { background: #fef3c7; color: #d97706; }
        .stat-icon.top-student { background: #fae8ff; color: #a855f7; }
        .stat-icon.university { background: #dbeafe; color: #2563eb; }
        .stat-icon.gender { background: #fed7aa; color: #c2410c; }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          display: block;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .stat-card small {
          font-size: 10px;
          color: #9ca3af;
          display: block;
        }

        .grade-distribution, .subject-performance, .performance-trend, .export-options, .results-table-container {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .grade-distribution h3, .subject-performance h3, .performance-trend h3, .export-options h3, .table-header h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
        }

        .grade-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .grade-bar-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .grade-label {
          width: 40px;
          font-weight: 600;
        }

        .bar-container {
          flex: 1;
          height: 24px;
          background: #f3f4f6;
          border-radius: 12px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          border-radius: 12px;
          transition: width 0.3s;
        }

        .bar-A { background: #10b981; }
        .bar-B { background: #3b82f6; }
        .bar-C { background: #f59e0b; }
        .bar-D { background: #ef4444; }
        .bar-E { background: #8b5cf6; }

        .grade-count {
          width: 40px;
          text-align: right;
          font-size: 14px;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .subject-card {
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .subject-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .subject-name {
          font-weight: 500;
        }

        .subject-grade {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .subject-score {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .score-bar {
          flex: 1;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: #1d8a8a;
          border-radius: 3px;
        }

        .score-value {
          font-size: 12px;
          font-weight: 600;
          min-width: 40px;
        }

        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 24px;
          justify-content: center;
          padding: 20px 0;
        }

        .trend-bar-item {
          text-align: center;
        }

        .trend-bar-container {
          width: 50px;
          height: 150px;
          background: #f3f4f6;
          border-radius: 25px;
          margin-bottom: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .trend-bar {
          background: #1d8a8a;
          width: 100%;
          border-radius: 25px;
          transition: height 0.3s;
        }

        .export-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .export-buttons button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .table-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 200px;
        }

        .table-controls select {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }

        .results-table-wrapper {
          overflow-x: auto;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th, .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
        }

        .results-table th {
          background: #f9fafb;
          font-weight: 600;
        }

        .rank-cell {
          font-weight: 600;
          color: #1d8a8a;
        }

        .points-cell {
          font-weight: 600;
        }

        .grade-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .view-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .student-info {
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-row .label {
          width: 120px;
          font-weight: 500;
          color: #6b7280;
        }

        .info-row .value {
          flex: 1;
        }

        .info-row .value.highlight {
          font-weight: 700;
          color: #1d8a8a;
          font-size: 18px;
        }

        .subject-breakdown h4 {
          margin: 0 0 12px 0;
        }

        .grade-badge-small {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .subject-grade-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-overview { grid-template-columns: repeat(2, 1fr); }
          .page-header { flex-direction: column; gap: 16px; }
          .exam-types { justify-content: center; }
        }
      `}</style>
    </div>
  );
}