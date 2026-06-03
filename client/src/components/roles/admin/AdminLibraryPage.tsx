// client/src/components/roles/admin/AdminLibraryPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, BookOpen, Users, TrendingUp, AlertCircle,
  Clock, CheckCircle, Filter, Eye, Send, MessageCircle, Star,
  Award, Calendar, BarChart3, PieChart, Activity, Zap,
  Mail, Bell, FileText, Image, Camera, Printer, Share2,
  Copy, Archive, Unlock, Lock, UserCheck, UserX, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { libraryService, notificationService } from '../../../services/adminService';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  totalCopies: number;
  copiesAvailable: number;
  copiesBorrowed: number;
  category: string;
  location: string;
  publisher: string;
  publishYear: number;
  pages: number;
  language: string;
  description: string;
  coverImage?: string;
  tags: string[];
  status: 'available' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
}

interface Borrowing {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'borrowed' | 'overdue' | 'returned';
  fine: number;
  renewed: boolean;
}

interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

interface StockAlert {
  bookId: string;
  title: string;
  copiesLeft: number;
  threshold: number;
}

export default function AdminLibraryPage() {
  // State Management
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stats'>('list');
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [dueDays, setDueDays] = useState(14);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [form, setForm] = useState<Partial<Book>>({ 
    title: '', author: '', isbn: '', totalCopies: 1, category: '',
    location: '', publisher: '', publishYear: new Date().getFullYear(),
    pages: 0, language: 'English', description: '', tags: []
  });

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksData, borrowingsData, reviewsData] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getBorrowings?.() || [],
        libraryService.getReviews?.() || []
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
      setReviews(reviewsData);
      checkStockAlerts(booksData);
    } catch (error) {
      toast.error('Failed to load library data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkStockAlerts = (booksList: Book[]) => {
    const alerts = booksList
      .filter(book => book.copiesAvailable <= 2 && book.copiesAvailable > 0)
      .map(book => ({
        bookId: book.id,
        title: book.title,
        copiesLeft: book.copiesAvailable,
        threshold: 2
      }));
    setStockAlerts(alerts);
    if (alerts.length > 0) {
      toast.error(`${alerts.length} book(s) have low stock!`);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Book CRUD operations
  const saveBook = async () => {
    if (!form.title || !form.author) {
      toast.error('Title and author are required');
      return;
    }
    try {
      if (editing) {
        await libraryService.updateBook(editing.id, form);
        toast.success('Book updated successfully');
      } else {
        await libraryService.createBook(form);
        toast.success('Book added to library');
        
        // Notify subscribers about new book
        await notificationService.notifyNewBook(form.title);
      }
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save book');
    }
  };

  const deleteBook = async (id: string) => {
    const book = books.find(b => b.id === id);
    if (book?.copiesBorrowed && book.copiesBorrowed > 0) {
      toast.error(`Cannot delete: ${book.copiesBorrowed} copy(s) currently borrowed`);
      return;
    }
    if (!confirm(`Delete "${book?.title}" permanently?`)) return;
    
    try {
      await libraryService.deleteBook(id);
      toast.success('Book deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  // Borrowing operations
  const borrowBook = async () => {
    if (!selectedBook || !borrowerEmail) {
      toast.error('Please select a book and enter borrower email');
      return;
    }
    
    if (selectedBook.copiesAvailable === 0) {
      toast.error('No copies available for borrowing');
      return;
    }

    try {
      await libraryService.borrowBook({
        bookId: selectedBook.id,
        userEmail: borrowerEmail,
        dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000)
      });
      toast.success(`Book borrowed until ${new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
      fetchData();
      setShowBorrowModal(false);
      setBorrowerEmail('');
      setDueDays(14);
    } catch (error: any) {
      toast.error(error.message || 'Failed to borrow book');
    }
  };

  const returnBook = async (borrowingId: string) => {
    try {
      const result = await libraryService.returnBook(borrowingId);
      toast.success(`Book returned${result.fine > 0 ? `, Fine: $${result.fine}` : ''}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to return book');
    }
  };

  const renewBook = async (borrowingId: string) => {
    try {
      await libraryService.renewBook(borrowingId);
      toast.success('Book renewed for another 14 days');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to renew');
    }
  };

  // Reviews
  const addReview = async () => {
    if (!selectedBook || !reviewComment) {
      toast.error('Please enter a review comment');
      return;
    }
    
    try {
      await libraryService.addReview({
        bookId: selectedBook.id,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review added successfully');
      fetchData();
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add review');
    }
  };

  // Bulk operations
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} books?`)) return;
    
    const booksWithBorrowings = books.filter(b => selected.includes(b.id) && b.copiesBorrowed > 0);
    if (booksWithBorrowings.length > 0) {
      toast.error(`${booksWithBorrowings.length} book(s) have active borrowings`);
      return;
    }
    
    try {
      await libraryService.bulkDeleteBooks(selected);
      toast.success(`${selected.length} books deleted`);
      setSelected([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Bulk delete failed');
    }
  };

  const bulkExport = async () => {
    try {
      const blob = await libraryService.exportBooksData({
        ids: selected.length > 0 ? selected : undefined,
        format: 'excel'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library_export_${new Date().toISOString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // Import with drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      dragCounter.current++;
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      dragCounter.current--;
      if (dragCounter.current === 0) setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.csv') || f.name.endsWith('.xls')
    );
    
    if (validFiles.length === 0) {
      toast.error('Please drop Excel or CSV files only');
      return;
    }
    
    setUploadProgress(0);
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const result = await libraryService.importBooks(validFiles[i]);
        setUploadProgress(((i + 1) / validFiles.length) * 100);
        toast.success(`Imported ${result.imported} books from ${validFiles[i].name}`);
      }
      fetchData();
      setShowImport(false);
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setUploadProgress(0);
    }
  }, []);

  // Statistics calculations
  const getStatistics = () => {
    const totalBooks = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.copiesAvailable, 0);
    const borrowedCopies = books.reduce((sum, b) => sum + b.copiesBorrowed, 0);
    const activeBorrowings = borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue').length;
    const overdueBorrowings = borrowings.filter(b => b.status === 'overdue').length;
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    const mostBorrowed = [...books].sort((a, b) => b.copiesBorrowed - a.copiesBorrowed)[0];
    
    return { totalBooks, totalCopies, availableCopies, borrowedCopies, activeBorrowings, overdueBorrowings, totalReviews, avgRating, mostBorrowed };
  };

  const stats = getStatistics();

  // Filter books
  const filtered = books.filter(b => {
    const matchesSearch = (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (b.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (b.isbn || '').includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'available' && b.copiesAvailable > 0) ||
                         (statusFilter === 'low_stock' && b.copiesAvailable <= 2 && b.copiesAvailable > 0) ||
                         (statusFilter === 'out_of_stock' && b.copiesAvailable === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(books.map(b => b.category).filter(c => c))];
  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(b => b.id));
  const resetForm = () => setForm({ title: '', author: '', isbn: '', totalCopies: 1, category: '', location: '', publisher: '', publishYear: new Date().getFullYear(), pages: 0, language: 'English', description: '', tags: [] });

  // Render star rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'none'} stroke={i < rating ? '#f59e0b' : '#cbd5e1'} />
    ));
  };

  return (
    <div className="library-page">
      {/* Header */}
      <div className="page-header">
        <div><h2><BookOpen size={24} /> Library Management</h2><p>Manage books, track borrowings, and monitor inventory</p></div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📋 List</button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>🎴 Grid</button>
            <button className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`} onClick={() => setViewMode('stats')}>📊 Stats</button>
          </div>
          <button className="btn btn-secondary" onClick={fetchData}><RefreshCcw size={16} /> Refresh</button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}><Upload size={16} /> Import</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Book</button>
        </div>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <div className="alert-banner">
          <AlertCircle size={20} />
          <span><strong>Low Stock Alert:</strong> {stockAlerts.length} book(s) running low</span>
          <button onClick={() => setShowStockAlert(true)}>View Details</button>
        </div>
      )}

      {/* Statistics Cards */}
      {viewMode === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon"><BookOpen size={24} /></div><div><div className="stat-value">{stats.totalBooks}</div><div className="stat-label">Total Books</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Copy size={24} /></div><div><div className="stat-value">{stats.totalCopies}</div><div className="stat-label">Total Copies</div></div></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle size={24} /></div><div><div className="stat-value">{stats.availableCopies}</div><div className="stat-label">Available</div></div></div>
          <div className="stat-card"><div className="stat-icon orange"><Clock size={24} /></div><div><div className="stat-value">{stats.borrowedCopies}</div><div className="stat-label">Borrowed</div></div></div>
          <div className="stat-card"><div className="stat-icon red"><AlertCircle size={24} /></div><div><div className="stat-value">{stats.overdueBorrowings}</div><div className="stat-label">Overdue</div></div></div>
          <div className="stat-card"><div className="stat-icon purple"><Star size={24} /></div><div><div className="stat-value">{stats.avgRating.toFixed(1)}</div><div className="stat-label">Avg Rating</div></div></div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search by title, author, ISBN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">All Categories ({categories.length})</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="available">Available</option><option value="low_stock">Low Stock (&lt;3)</option><option value="out_of_stock">Out of Stock</option></select>
        {selected.length > 0 && (<div className="bulk-actions"><button className="btn btn-danger" onClick={bulkDelete}><Trash2 size={16} /> Delete ({selected.length})</button><button className="btn btn-secondary" onClick={bulkExport}><Download size={16} /> Export</button></div>)}
      </div>

      {/* Drag & Drop Zone */}
      <div className={`drag-drop-zone ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        <Upload size={32} /><p>Drag & drop Excel/CSV files here for bulk import</p><small>Supports: .xlsx, .xls, .csv files</small>
      </div>

      {/* Content Views */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading library...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th><button onClick={toggleAll}>{selected.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th><th>Title</th><th>Author</th><th>ISBN</th><th>Copies</th><th>Available</th><th>Borrowed</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(book => (<tr key={book.id}><td><button onClick={() => toggleSelect(book.id)}>{selected.includes(book.id) ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}</button></td>
              <td><div className="book-title"><strong>{book.title}</strong><small className="book-category">{book.category}</small></div></td>
              <td>{book.author}</td><td>{book.isbn || '-'}</td><td>{book.totalCopies}</td><td className="available-copies">{book.copiesAvailable}</td><td>{book.copiesBorrowed}</td>
              <td>{book.copiesAvailable === 0 ? <span className="status-badge out"><X size={12} /> Out</span> : book.copiesAvailable <= 2 ? <span className="status-badge low"><AlertCircle size={12} /> Low</span> : <span className="status-badge ok"><CheckCircle size={12} /> Good</span>}</td>
              <td><div className="action-buttons"><button title="Borrow" onClick={() => { setSelectedBook(book); setShowBorrowModal(true); }}><BookOpen size={14} /></button><button title="Review" onClick={() => { setSelectedBook(book); setShowReviewModal(true); }}><Star size={14} /></button><button title="Edit" onClick={() => { setEditing(book); setForm(book); setShowModal(true); }}><Edit size={14} /></button><button title="Delete" className="danger" onClick={() => deleteBook(book.id)}><Trash2 size={14} /></button></div></td></tr>))}</tbody>
          </table>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-view">{filtered.map(book => (<div key={book.id} className="book-card"><div className="book-cover"><BookOpen size={32} /></div><div className="book-details"><h4>{book.title}</h4><p>{book.author}</p><div className="book-stats"><span>📚 {book.totalCopies} total</span><span>✅ {book.copiesAvailable} available</span></div><div className="book-actions"><button onClick={() => { setSelectedBook(book); setShowBorrowModal(true); }}>Borrow</button><button onClick={() => { setEditing(book); setForm(book); setShowModal(true); }}>Edit</button></div></div></div>))}</div>
      ) : (
        <div className="stats-view">{/* Detailed statistics view */}</div>
      )}

      {/* Book Form Modal */}
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal modal-large" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>{editing ? 'Edit Book' : 'Add New Book'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div><div className="modal-body"><div className="form-grid"><input placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /><input placeholder="Author *" value={form.author} onChange={e => setForm({...form, author: e.target.value})} /><input placeholder="ISBN" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} /><input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /><input type="number" placeholder="Total Copies" value={form.totalCopies} onChange={e => setForm({...form, totalCopies: parseInt(e.target.value)})} /><input placeholder="Location (Shelf/Room)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /><input placeholder="Publisher" value={form.publisher} onChange={e => setForm({...form, publisher: e.target.value})} /><input type="number" placeholder="Publish Year" value={form.publishYear} onChange={e => setForm({...form, publishYear: parseInt(e.target.value)})} /><input placeholder="Language" value={form.language} onChange={e => setForm({...form, language: e.target.value})} /><textarea placeholder="Description" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveBook}>Save Book</button></div></div></div></div>)}

      {/* Borrow Modal */}
      {showBorrowModal && selectedBook && (<div className="modal-overlay" onClick={() => setShowBorrowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Borrow Book: {selectedBook.title}</h3><button className="modal-close" onClick={() => setShowBorrowModal(false)}><X size={20} /></button></div><div className="modal-body"><div className="form-group"><label>Borrower Email *</label><input type="email" placeholder="student@school.com" value={borrowerEmail} onChange={e => setBorrowerEmail(e.target.value)} /></div><div className="form-group"><label>Due Days</label><input type="number" value={dueDays} onChange={e => setDueDays(parseInt(e.target.value))} min="1" max="60" /></div><div className="book-info"><strong>Available Copies:</strong> {selectedBook.copiesAvailable} / {selectedBook.totalCopies}</div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowBorrowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={borrowBook}>Confirm Borrow</button></div></div></div></div>)}

      {/* Review Modal */}
      {showReviewModal && selectedBook && (<div className="modal-overlay" onClick={() => setShowReviewModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Review: {selectedBook.title}</h3><button className="modal-close" onClick={() => setShowReviewModal(false)}><X size={20} /></button></div><div className="modal-body"><div className="form-group"><label>Rating</label><div className="rating-select">{Array(5).fill(0).map((_, i) => (<button key={i} className={`star-btn ${i < reviewRating ? 'active' : ''}`} onClick={() => setReviewRating(i + 1)}>★</button>))}</div></div><div className="form-group"><label>Your Review</label><textarea rows={4} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your thoughts about this book..." /></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button><button className="btn btn-primary" onClick={addReview}>Submit Review</button></div></div></div></div>)}

      {/* Stock Alert Modal */}
      {showStockAlert && (<div className="modal-overlay" onClick={() => setShowStockAlert(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><AlertCircle size={20} /> Low Stock Alerts</h3><button className="modal-close" onClick={() => setShowStockAlert(false)}><X size={20} /></button></div><div className="modal-body">{stockAlerts.map(alert => (<div key={alert.bookId} className="alert-item"><strong>{alert.title}</strong><span>Only {alert.copiesLeft} copy(s) left</span><button onClick={() => { const book = books.find(b => b.id === alert.bookId); if(book) { setEditing(book); setForm(book); setShowModal(true); setShowStockAlert(false); } }}>Order More</button></div>))}</div></div></div>)}

      <style>{`
        .library-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .alert-banner { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; }
        .stat-icon.green { background: #d1fae5; color: #10b981; }
        .stat-icon.orange { background: #fed7aa; color: #f59e0b; }
        .stat-icon.red { background: #fee2e2; color: #ef4444; }
        .stat-icon.purple { background: #e0e7ff; color: #7c3aed; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 13px; color: #6b7280; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .drag-drop-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px; background: white; transition: all 0.2s; }
        .drag-drop-zone.drag-active { border-color: #1d8a8a; background: #f0fdf4; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr:hover { background: #fafbff; }
        .book-title { display: flex; flex-direction: column; }
        .book-category { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .available-copies { font-weight: 600; color: #10b981; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.ok { background: #d1fae5; color: #10b981; }
        .status-badge.low { background: #fed7aa; color: #f59e0b; }
        .status-badge.out { background: #fee2e2; color: #ef4444; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .book-card { background: white; border-radius: 12px; padding: 16px; display: flex; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .book-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .book-cover { width: 80px; height: 100px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .book-details { flex: 1; }
        .book-details h4 { margin: 0 0 4px; font-size: 16px; }
        .book-details p { margin: 0 0 8px; font-size: 13px; color: #6b7280; }
        .book-stats { display: flex; gap: 12px; font-size: 12px; color: #64748b; margin-bottom: 12px; }
        .book-actions { display: flex; gap: 8px; }
        .book-actions button { flex: 1; padding: 6px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .book-actions button:hover { background: #f1f5f9; border-color: #1d8a8a; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-grid input, .form-grid textarea, .form-grid select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .rating-select { display: flex; gap: 8px; }
        .star-btn { font-size: 24px; background: none; border: none; cursor: pointer; color: #cbd5e1; transition: color 0.2s; }
        .star-btn.active { color: #f59e0b; }
        .alert-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .alert-item button { padding: 4px 12px; background: #1d8a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        .loading-state { text-align: center; padding: 60px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}