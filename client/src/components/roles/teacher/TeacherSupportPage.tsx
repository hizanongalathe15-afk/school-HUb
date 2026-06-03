import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HelpCircle, MessageSquare, Mail, Phone, Video, Headphones,
  BookOpen, FileText, Search, Filter, Plus, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, Clock, Calendar, User,
  Upload, Download, Printer, Send, Star, Award, TrendingUp,
  BarChart3, PieChart, Activity, Zap, Shield, Lock, Unlock,
  ChevronDown, ChevronUp, RefreshCw, Settings, Globe, Link,
  Copy, Share2, MessageCircle, Users, ThumbsUp, ThumbsDown,
  Flag, Archive, ExternalLink, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'academic' | 'administrative' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdBy: string;
  createdByName: string;
  rating: number | null;
  feedback: string | null;
}

interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

interface TicketMessage {
  id: string;
  message: string;
  isFromAdmin: boolean;
  senderId: string;
  senderName: string;
  attachments: TicketAttachment[];
  createdAt: string;
  isRead: boolean;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  featured: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  views: number;
  helpful: number;
}

interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  thumbnail: string;
  category: string;
  views: number;
}

interface SystemStatus {
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  lastChecked: string;
  components: SystemComponent[];
  incidents: SystemIncident[];
}

interface SystemComponent {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastUpdate: string;
}

interface SystemIncident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  resolvedAt: string | null;
}

const ticketCategoryColors: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-800',
  academic: 'bg-green-100 text-green-800',
  administrative: 'bg-purple-100 text-purple-800',
  billing: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

const ticketPriorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800 animate-pulse',
};

const ticketStatusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const TeacherSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge' | 'faq' | 'videos' | 'status'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [ticketFormData, setTicketFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
    attachments: [] as File[],
  });
  
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    feedback: '',
  });
  
  const [searchArticleTerm, setSearchArticleTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  
  const confirmation = useConfirmationDialog();

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tickets') {
        const response = await teacherService.support.getTickets();
        if (response.success) setTickets(response.data || []);
      } else if (activeTab === 'knowledge') {
        const [articlesRes, faqsRes, videosRes] = await Promise.all([
          teacherService.support.getKnowledgeArticles(),
          teacherService.support.getFAQs(),
          teacherService.support.getTrainingVideos(),
        ]);
        if (articlesRes.success) setArticles(articlesRes.data || []);
        if (faqsRes.success) setFaqs(faqsRes.data || []);
        if (videosRes.success) setVideos(videosRes.data || []);
      } else if (activeTab === 'status') {
        const response = await teacherService.support.getSystemStatus();
        if (response.success) setSystemStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load support data:', error);
      toast.error('Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!ticketFormData.title.trim() || !ticketFormData.description.trim()) {
      toast.error('Please provide both title and description');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', ticketFormData.title);
      formData.append('description', ticketFormData.description);
      formData.append('category', ticketFormData.category);
      formData.append('priority', ticketFormData.priority);
      
      ticketFormData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.support.createTicket(formData);
      if (response.success) {
        toast.success('Support ticket created successfully');
        setShowTicketModal(false);
        resetTicketForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  const addReply = async () => {
    if (!replyMessage.trim() && replyAttachments.length === 0) {
      toast.error('Please enter a message or add attachments');
      return;
    }

    if (!selectedTicket) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('ticketId', selectedTicket.id);
      formData.append('message', replyMessage);
      
      replyAttachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.support.addTicketReply(formData);
      if (response.success) {
        toast.success('Reply added');
        setShowReplyModal(false);
        setReplyMessage('');
        setReplyAttachments([]);
        loadData();
        if (selectedTicket) {
          const updatedTicket = await teacherService.support.getTicket(selectedTicket.id);
          if (updatedTicket.success) setSelectedTicket(updatedTicket.data);
        }
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const closeTicket = async (ticketId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Close Ticket?',
      message: 'Are you sure you want to close this ticket? You can reopen it later if needed.',
      confirmText: 'Close Ticket',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.support.closeTicket(ticketId);
      toast.success('Ticket closed');
      loadData();
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const submitFeedback = async () => {
    if (!selectedTicket) return;
    
    try {
      await teacherService.support.submitTicketFeedback(selectedTicket.id, feedbackData);
      toast.success('Thank you for your feedback');
      setShowFeedbackModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const markArticleHelpful = async (articleId: string, helpful: boolean) => {
    try {
      await teacherService.support.markArticleHelpful(articleId, helpful);
      setArticles(prev => prev.map(a => 
        a.id === articleId 
          ? { ...a, helpful: a.helpful + (helpful ? 1 : 0), notHelpful: a.notHelpful + (helpful ? 0 : 1) }
          : a
      ));
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  const resetTicketForm = () => {
    setTicketFormData({
      title: '',
      description: '',
      category: 'technical',
      priority: 'medium',
      attachments: [],
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast.error('Some files exceed 10MB limit and were skipped');
    }
    
    setTicketFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles],
    }));
  };

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    setReplyAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number, isReply: boolean = false) => {
    if (isReply) {
      setReplyAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setTicketFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tickets, searchTerm, filterCategory, filterStatus]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchArticleTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchArticleTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchArticleTerm.toLowerCase()))
    );
  }, [articles, searchArticleTerm]);

  if (loading && !tickets.length && !articles.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading support center..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Support Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get help, access resources, and track your support tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowTicketModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('knowledge')}>
          <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-semibold">Knowledge Base</p>
          <p className="text-xs text-gray-500">Browse articles & guides</p>
        </Card>
        <Card className="text-center hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('faq')}>
          <HelpCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold">FAQs</p>
          <p className="text-xs text-gray-500">Frequently asked questions</p>
        </Card>
        <Card className="text-center hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('videos')}>
          <Video className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="font-semibold">Video Tutorials</p>
          <p className="text-xs text-gray-500">Watch training videos</p>
        </Card>
        <Card className="text-center hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('status')}>
          <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="font-semibold">System Status</p>
          <p className="text-xs text-gray-500">Check platform health</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tickets')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'tickets'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <MessageSquare className="w-4 h-4 inline mr-1" />
          My Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'knowledge'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <BookOpen className="w-4 h-4 inline mr-1" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'faq'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <HelpCircle className="w-4 h-4 inline mr-1" />
          FAQs
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'videos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Video className="w-4 h-4 inline mr-1" />
          Video Tutorials
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'status'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Activity className="w-4 h-4 inline mr-1" />
          System Status
        </button>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
                <option value="billing">Billing</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </Card>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No support tickets found</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowTicketModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create New Ticket
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition">
                  <div className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', ticketCategoryColors[ticket.category])}>
                            {ticket.category}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', ticketPriorityColors[ticket.priority])}>
                            {ticket.priority}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', ticketStatusColors[ticket.status])}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Ticket #{ticket.id.slice(0, 8)}</span>
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                          {ticket.assignedToName && <span>Assigned to: {ticket.assignedToName}</span>}
                          <span>{ticket.messages?.length || 0} messages</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowReplyModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Reply"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        </button>
                        {ticket.status !== 'closed' && (
                          <button
                            onClick={() => closeTicket(ticket.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Close Ticket"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                        {ticket.status === 'resolved' && !ticket.rating && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowFeedbackModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Rate Support"
                          >
                            <Star className="w-4 h-4 text-yellow-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <>
          <Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search knowledge base..."
                value={searchArticleTerm}
                onChange={(e) => setSearchArticleTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </Card>

          {filteredArticles.length === 0 ? (
            <Card className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No articles found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition cursor-pointer" onClick={() => setSelectedArticle(article)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <FileText className="w-8 h-8 text-blue-500" />
                      {article.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <h3 className="font-semibold mt-3">{article.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {article.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>{article.views} views</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {article.helpful}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" /> {article.notHelpful}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <div className="p-4">
                <h3 className="font-semibold flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-7">
                  {faq.answer}
                </p>
                <div className="flex items-center gap-4 mt-3 pl-7">
                  <button
                    onClick={() => markArticleHelpful(faq.id, true)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Helpful
                  </button>
                  <button
                    onClick={() => markArticleHelpful(faq.id, false)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    Not Helpful
                  </button>
                  <span className="text-xs text-gray-400">{faq.views} views</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Video Tutorials Tab */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center cursor-pointer hover:bg-white transition">
                    <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{video.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span>{video.views} views</span>
                  <span>•</span>
                  <span>{video.category}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* System Status Tab */}
      {activeTab === 'status' && systemStatus && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <div className="p-4 flex items-center gap-4">
              <div className={clsx(
                'w-4 h-4 rounded-full',
                systemStatus.status === 'operational' ? 'bg-green-500' :
                systemStatus.status === 'degraded' ? 'bg-yellow-500' :
                systemStatus.status === 'partial_outage' ? 'bg-orange-500' :
                'bg-red-500'
              )} />
              <div>
                <p className="font-semibold">
                  {systemStatus.status === 'operational' ? 'All Systems Operational' :
                   systemStatus.status === 'degraded' ? 'System Degraded' :
                   systemStatus.status === 'partial_outage' ? 'Partial Outage' :
                   'Major Outage'}
                </p>
                <p className="text-sm text-gray-500">Last checked: {formatDate(systemStatus.lastChecked)}</p>
              </div>
            </div>
          </Card>

          {/* Components */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold mb-3">System Components</h3>
              <div className="space-y-2">
                {systemStatus.components.map((component) => (
                  <div key={component.name} className="flex items-center justify-between py-2 border-b">
                    <span>{component.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'w-2 h-2 rounded-full',
                        component.status === 'operational' ? 'bg-green-500' :
                        component.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm capitalize">{component.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Incidents */}
          {systemStatus.incidents.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold mb-3">Recent Incidents</h3>
                <div className="space-y-3">
                  {systemStatus.incidents.map((incident) => (
                    <div key={incident.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{incident.title}</p>
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-xs',
                          incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          incident.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(incident.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title="Create Support Ticket" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={ticketFormData.title}
              onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Brief summary of the issue"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={5}
              value={ticketFormData.description}
              onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Detailed description of the issue..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={ticketFormData.category}
                onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="technical">Technical Issue</option>
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={ticketFormData.priority}
                onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" />
              Add Files
            </Button>
            {ticketFormData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {ticketFormData.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{file.name} ({formatFileSize(file.size)})</span>
                    <button onClick={() => removeAttachment(idx)} className="text-red-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowTicketModal(false)}>Cancel</Button>
            <Button onClick={createTicket}>Create Ticket</Button>
          </div>
        </div>
      </Modal>

      {/* Reply Modal */}
      <Modal isOpen={showReplyModal} onClose={() => setShowReplyModal(false)} title="Reply to Ticket" size="lg">
        <div className="space-y-4">
          {selectedTicket && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedTicket.title}</p>
                <p className="text-xs text-gray-500">Status: {selectedTicket.status}</p>
              </div>
              
              {/* Previous Messages */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {selectedTicket.messages.map((msg) => (
                    <div key={msg.id} className={clsx(
                      'p-3 rounded-lg',
                      msg.isFromAdmin ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
                    )}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{msg.senderName}</p>
                        <p className="text-xs text-gray-500">{formatDate(msg.createdAt)}</p>
                      </div>
                      <p className="text-sm mt-1">{msg.message}</p>
                      {msg.attachments?.map((att) => (
                        <div key={att.id} className="mt-2 text-xs text-blue-500">
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                            📎 {att.fileName}
                          </a>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Your Message</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                  placeholder="Type your reply here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <input
                  type="file"
                  ref={replyFileInputRef}
                  onChange={handleReplyFileSelect}
                  multiple
                  className="hidden"
                />
                <Button variant="outline" onClick={() => replyFileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Files
                </Button>
                {replyAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {replyAttachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{file.name} ({formatFileSize(file.size)})</span>
                        <button onClick={() => removeAttachment(idx, true)} className="text-red-500">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReplyModal(false)}>Cancel</Button>
            <Button onClick={addReply}>Send Reply</Button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Rate Support" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">How would you rate the support you received?</p>
          
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                className="text-2xl focus:outline-none"
              >
                <Star className={clsx(
                  'w-8 h-8 transition',
                  star <= feedbackData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                )} />
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Additional Feedback</label>
            <textarea
              rows={4}
              value={feedbackData.feedback}
              onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Any additional comments..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Skip</Button>
            <Button onClick={submitFeedback}>Submit Feedback</Button>
          </div>
        </div>
      </Modal>

      {/* Article Viewer Modal */}
      <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle?.title || ''} size="lg">
        {selectedArticle && (
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Was this article helpful?</p>
              <button
                onClick={() => markArticleHelpful(selectedArticle.id, true)}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-lg"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => markArticleHelpful(selectedArticle.id, false)}
                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.confirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherSupportPage;