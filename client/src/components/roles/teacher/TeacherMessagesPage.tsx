import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, Search, Filter, MessageSquare, User, Clock, Paperclip, ChevronRight,
  Image, File, Video, Mic, X, Smile, Bold, Italic, Underline, Link as LinkIcon,
  Download, Reply, Forward, Archive, Trash2, Star, MoreVertical, Phone,
  Video as VideoIcon, Users, Check, CheckCheck, AlertCircle, RefreshCw,
  Eye, EyeOff, Flag, Printer, Copy, Quote, AtSign, Hash, Plus
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

// Rich text editor component
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { TeacherMessage as BaseTeacherMessage } from '../../../types/teacher';
import { downloadFromServiceData } from '../../../utils/fileDownload';

type TeacherMessage = BaseTeacherMessage & {
  senderAvatar?: string;
  messageHtml: string;
  attachments: MessageAttachment[];
  isStarred: boolean;
  isArchived: boolean;
  parentMessageId: string | null;
  replyToId: string | null;
  conversationId: string;
  readAt: string | null;
};

interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'video' | 'audio' | 'other';
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping?: boolean;
}

interface MessageBulkSend {
  recipientType: 'class' | 'grade' | 'selected';
  recipientIds: string[];
  subject: string;
  message: string;
  attachments: File[];
}

const TeacherMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<TeacherMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showBulkCompose, setShowBulkCompose] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'starred' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<TeacherMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const [formData, setFormData] = useState({
    recipientId: '',
    recipientRole: 'parent' as 'parent' | 'teacher' | 'admin',
    subject: '',
    message: '',
    messageHtml: '',
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const confirmation = useConfirmationDialog();

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await teacherService.messages.getConversations();
      if (response.success) {
        setConversations(response.data || []);
        if (response.data?.length && !selectedConversation) {
          setSelectedConversation(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await teacherService.messages.getConversationMessages(conversationId);
      if (response.success) {
        setMessages(response.data || []);
        // Mark as read
        await teacherService.messages.markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.message.trim() && attachments.length === 0) {
      toast.error('Please enter a message or add attachments');
      return;
    }

    setSending(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('recipientId', formData.recipientId);
      formDataToSend.append('recipientRole', formData.recipientRole);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('messageHtml', formData.messageHtml);
      if (replyToMessage) {
        formDataToSend.append('replyToId', replyToMessage.id);
      }
      
      attachments.forEach((file, index) => {
        formDataToSend.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.messages.sendMessage(formDataToSend);
      
      if (response.success) {
        toast.success('Message sent successfully!');
        setShowCompose(false);
        setReplyToMessage(null);
        resetForm();
        loadConversations();
        if (selectedConversation) {
          loadMessages(selectedConversation.id);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    setSending(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('subject', bulkFormData.subject);
      formDataToSend.append('message', bulkFormData.message);
      formDataToSend.append('recipientType', bulkFormData.recipientType);
      formDataToSend.append('recipientIds', JSON.stringify(bulkFormData.recipientIds));
      
      attachments.forEach((file, index) => {
        formDataToSend.append(`attachments[${index}]`, file);
      });
      
      const response = await teacherService.messages.sendBulkMessage(formDataToSend);
      
      if (response.success) {
        toast.success(`Message sent to ${response.data.count} recipients`);
        setShowBulkCompose(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to send bulk message:', error);
      toast.error('Failed to send bulk message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message: TeacherMessage) => {
    setReplyToMessage(message);
    setFormData({
      ...formData,
      recipientId: message.senderId,
      recipientRole: message.senderRole as any,
      subject: `Re: ${message.subject}`,
      message: '',
      messageHtml: '',
    });
    setShowCompose(true);
  };

  const handleForward = (message: TeacherMessage) => {
    setReplyToMessage(null);
    setFormData({
      ...formData,
      subject: `Fwd: ${message.subject}`,
      message: `\n\n--- Forwarded message from ${message.senderName} ---\n\n${message.message}`,
      messageHtml: `<br><br>--- Forwarded message from ${message.senderName} ---<br><br>${message.messageHtml}`,
    });
    setShowCompose(true);
  };

  const handleStarMessage = async (messageId: string, isStarred: boolean) => {
    try {
      await teacherService.messages.toggleStarMessage(messageId, !isStarred);
      loadMessages(selectedConversation!.id);
      toast.success(isStarred ? 'Removed from starred' : 'Added to starred');
    } catch (error) {
      console.error('Failed to star message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleArchiveMessage = async (messageId: string, isArchived: boolean) => {
    try {
      await teacherService.messages.archiveMessage(messageId, !isArchived);
      loadMessages(selectedConversation!.id);
      toast.success(isArchived ? 'Unarchived' : 'Archived');
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error('Failed to archive message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Message?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    
    try {
      await teacherService.messages.deleteMessage(messageId);
      toast.success('Message deleted');
      loadMessages(selectedConversation!.id);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete message');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, audioFile]);
        setAttachmentPreviews(prev => [...prev, URL.createObjectURL(audioBlob)]);
        toast.success('Voice note recorded');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingDuration(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video`);
        return false;
      }
      if (type === 'audio' && !file.type.startsWith('audio/')) {
        toast.error(`${file.name} is not an audio file`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setAttachmentPreviews(prev => [...prev, URL.createObjectURL(file)]);
      } else if (file.type.startsWith('audio/')) {
        setAttachmentPreviews(prev => [...prev, URL.createObjectURL(file)]);
      } else {
        setAttachmentPreviews(prev => [...prev, '']);
      }
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachmentPreviews[index]) {
      URL.revokeObjectURL(attachmentPreviews[index]);
    }
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const downloadAttachment = async (attachment: MessageAttachment, messageId?: string) => {
    try {
      const response = await teacherService.messages.downloadAttachment(
        messageId || selectedMessage?.id || attachment.id,
        attachment.id
      );
      downloadFromServiceData(response.data, attachment.fileName, attachment.mimeType);
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download file');
    }
  };

  const resetForm = () => {
    setFormData({
      recipientId: '',
      recipientRole: 'parent',
      subject: '',
      message: '',
      messageHtml: '',
    });
    setAttachments([]);
    setAttachmentPreviews([]);
    setReplyToMessage(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-KE', { weekday: 'short' });
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio': return <Mic className="w-5 h-5 text-green-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const [bulkFormData, setBulkFormData] = useState({
    recipientType: 'class' as 'class' | 'grade' | 'selected',
    recipientIds: [] as string[],
    subject: '',
    message: '',
  });

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await teacherService.classes.getMyClasses();
      if (response.success) setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  if (loading && !conversations.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Messages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Communicate with parents, teachers, and send bulk announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadConversations}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkCompose(true)}>
            <Users className="w-4 h-4 mr-1" />
            Bulk Message
          </Button>
          <Button size="sm" onClick={() => setShowCompose(true)}>
            <Send className="w-4 h-4 mr-1" />
            New Message
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'received', 'sent', 'starred'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg transition',
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={clsx(
                  'p-3 rounded-lg cursor-pointer transition',
                  selectedConversation?.id === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.participantName}</p>
                      <p className="text-xs text-gray-400">{formatTime(conv.lastMessageTime)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{conv.participantRole}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowCompose(true)}>
                  Start a conversation
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedConversation.participantName}</p>
                    <p className="text-xs text-gray-500">{selectedConversation.participantRole}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Video Call">
                    <VideoIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Voice Call">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      'flex',
                      message.senderId === 'current-user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className={clsx(
                      'max-w-[70%] rounded-lg p-3',
                      message.senderId === 'current-user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {/* Reply indicator */}
                      {message.replyToId && (
                        <div className="text-xs opacity-70 mb-1 pb-1 border-b border-opacity-30">
                          Replying to previous message
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div className="whitespace-pre-wrap break-words">
                        {message.messageHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: message.messageHtml }} />
                        ) : (
                          message.message
                        )}
                      </div>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded cursor-pointer"
                              onClick={() => {
                                setSelectedAttachment(att);
                                setShowAttachmentModal(true);
                              }}
                            >
                              {getFileIcon(att.fileType)}
                              <span className="text-sm flex-1 truncate">{att.fileName}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadAttachment(att, message.id);
                                }}
                                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Timestamp and status */}
                      <div className={clsx(
                        'text-xs mt-1 flex items-center gap-1',
                        message.senderId === 'current-user'
                          ? 'text-blue-200'
                          : 'text-gray-500'
                      )}>
                        <span>{formatTime(message.createdAt)}</span>
                        {message.senderId === 'current-user' && (
                          message.isRead ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition ml-2 flex items-start gap-1">
                      <button
                        onClick={() => handleReply(message)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleForward(message)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Forward"
                      >
                        <Forward className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStarMessage(message.id, message.isStarred)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={message.isStarred ? 'Unstar' : 'Star'}
                      >
                        <Star className={clsx('w-3 h-3', message.isStarred && 'fill-yellow-500 text-yellow-500')} />
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t dark:border-gray-700">
                {replyToMessage && (
                  <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center text-sm">
                    <span>Replying to: {replyToMessage.subject}</span>
                    <button onClick={() => setReplyToMessage(null)} className="text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <ReactQuill
                      theme="snow"
                      value={formData.messageHtml}
                      onChange={(value) => setFormData({ ...formData, messageHtml: value, message: value.replace(/<[^>]*>/g, '') })}
                      placeholder="Type your message..."
                      className="bg-white dark:bg-gray-800 rounded-lg"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'blockquote', 'code-block'],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'image')}
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Attach Image"
                    >
                      <Image className="w-5 h-5 text-blue-500" />
                    </button>
                    
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'video')}
                    />
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Attach Video"
                    >
                      <Video className="w-5 h-5 text-purple-500" />
                    </button>
                    
                    <input
                      type="file"
                      ref={audioInputRef}
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'audio')}
                    />
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Attach Audio"
                    >
                      <File className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={clsx(
                        'p-2 rounded-lg transition',
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'hover:bg-gray-100'
                      )}
                      title="Voice Note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    
                    {isRecording && (
                      <div className="flex items-center gap-2 px-2 bg-red-50 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-red-500">{formatDuration(recordingDuration)}</span>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSend} disabled={sending || (!formData.message.trim() && attachments.length === 0)}>
                    {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                
                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="relative p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm flex items-center gap-2">
                        {file.type.startsWith('image/') && attachmentPreviews[idx] && (
                          <img src={attachmentPreviews[idx]} alt="preview" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => removeAttachment(idx)} className="text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title={replyToMessage ? 'Reply to Message' : 'New Message'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Role</label>
              <select
                value={formData.recipientRole}
                onChange={(e) => setFormData({ ...formData, recipientRole: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <input
                type="text"
                placeholder="Search or enter recipient name/ID"
                value={formData.recipientId}
                onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Message subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <ReactQuill
              theme="snow"
              value={formData.messageHtml}
              onChange={(value) => setFormData({ ...formData, messageHtml: value, message: value.replace(/<[^>]*>/g, '') })}
              className="bg-white dark:bg-gray-800 rounded-lg"
              style={{ height: '200px' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link', 'blockquote', 'code-block'],
                  ['clean']
                ],
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4 mr-1" />
                Add Files
              </Button>
              <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
                <Image className="w-4 h-4 mr-1" />
                Add Images
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'all')}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4 mr-1" />}
              Send Message
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Message Modal */}
      <Modal isOpen={showBulkCompose} onClose={() => setShowBulkCompose(false)} title="Bulk Message" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Send To</label>
            <select
              value={bulkFormData.recipientType}
              onChange={(e) => setBulkFormData({ ...bulkFormData, recipientType: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="class">Entire Class</option>
              <option value="grade">Entire Grade</option>
              <option value="selected">Selected Students/Parents</option>
            </select>
          </div>
          
          {bulkFormData.recipientType === 'class' && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Class</label>
              <select
                value={bulkFormData.recipientIds[0] || ''}
                onChange={(e) => setBulkFormData({ ...bulkFormData, recipientIds: [e.target.value] })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={bulkFormData.subject}
              onChange={(e) => setBulkFormData({ ...bulkFormData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="Announcement subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <ReactQuill
              theme="snow"
              value={bulkFormData.message}
              onChange={(value) => setBulkFormData({ ...bulkFormData, message: value })}
              className="bg-white dark:bg-gray-800 rounded-lg"
              style={{ height: '200px' }}
            />
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              This message will be sent to {bulkFormData.recipientType === 'class' ? 'all parents/students in the class' : 'selected recipients'}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBulkCompose(false)}>Cancel</Button>
            <Button onClick={handleBulkSend} disabled={sending}>
              {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4 mr-1" />}
              Send to All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Attachment Viewer Modal */}
      <Modal isOpen={showAttachmentModal} onClose={() => setShowAttachmentModal(false)} title="Attachment Preview" size="lg">
        {selectedAttachment && (
          <div className="space-y-4">
            {selectedAttachment.fileType === 'image' && (
              <img src={selectedAttachment.fileUrl} alt={selectedAttachment.fileName} className="max-w-full rounded" />
            )}
            {selectedAttachment.fileType === 'video' && (
              <video controls className="max-w-full rounded">
                <source src={selectedAttachment.fileUrl} type={selectedAttachment.mimeType} />
              </video>
            )}
            {selectedAttachment.fileType === 'audio' && (
              <audio controls className="w-full">
                <source src={selectedAttachment.fileUrl} type={selectedAttachment.mimeType} />
              </audio>
            )}
            {selectedAttachment.fileType === 'document' && (
              <div className="text-center p-8">
                <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">{selectedAttachment.fileName}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {(selectedAttachment.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button onClick={() => downloadAttachment(selectedAttachment)}>
                  <Download className="w-4 h-4 mr-1" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherMessagesPage;