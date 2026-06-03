import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Paperclip,
  Mic,
  Image,
  File,
  Video,
  X,
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  Copy,
  Pin,
  Smile,
  Phone,
  Video as VideoIcon,
  User,
  Users,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';
import parentService from '../../../services/parentService';
import type { Message, ParentChild, Conversation, TypingStatus } from '../../../types/parent';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';

// WebSocket or Polling for real-time
import io from 'socket.io-client';

// Video Call Component
import { VideoCall } from './VideoCall';

const ParentMessages: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [socket, setSocket] = useState<any>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Socket.IO connection
  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || (import.meta.env.REACT_APP_WS_URL as string) || 'http://localhost:3001';
    const newSocket = io(wsUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message: Message) => {
      if (message.conversationId === selectedConversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      // Update conversation list
      updateConversations();
    });

    socket.on('message_deleted', ({ messageId, conversationId }) => {
      if (conversationId === selectedConversationId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });

    socket.on('message_edited', (updatedMessage: Message) => {
      if (updatedMessage.conversationId === selectedConversationId) {
        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
      }
    });

    socket.on('typing_start', ({ userId, conversationId }) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      }
    });

    socket.on('typing_stop', ({ userId, conversationId }) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers(prev => ({ ...prev, [userId]: false }));
      }
    });

    socket.on('call_incoming', ({ from, type, callId }) => {
      if (confirm(`${from} is calling you. Accept?`)) {
        setShowVideoCall(true);
        setCallType(type);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('message_deleted');
      socket.off('message_edited');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('call_incoming');
    };
  }, [socket, selectedConversationId]);

  const loadChildren = useCallback(async () => {
    const res = await parentService.children.getMyChildren();
    if (res?.success && res.data) {
      setChildren(res.data);
      if (res.data[0]) setSelectedChildId(res.data[0].id);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await parentService.communication.getConversations();
    if (res?.success && res.data) {
      setConversations(res.data);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await parentService.communication.getMessages(conversationId);
    if (res?.success && res.data) {
      setMessages(res.data);
      scrollToBottom();
    }
  }, []);

  const updateConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadChildren();
        await loadConversations();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadChildren, loadConversations]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markConversationAsRead = async (conversationId: string) => {
    await parentService.communication.markConversationAsRead(conversationId);
  };

  const handleTyping = useCallback(() => {
    if (!socket || !selectedConversationId) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing_start', { conversationId: selectedConversationId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedConversationId) {
        socket.emit('typing_stop', { conversationId: selectedConversationId });
        setTyping(false);
      }
    }, 1000);
  }, [socket, selectedConversationId, typing]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversationId) return;

    setSending(true);
    try {
      // Upload attachments first
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        setUploading(true);
        attachmentUrls = await parentService.communication.uploadAttachments(attachments);
        setUploading(false);
      }

      const messageData = {
        conversationId: selectedConversationId,
        content: newMessage.trim(),
        replyToId: replyTo?.id,
        attachments: attachmentUrls,
        editMode: editingMessage ? true : false,
        messageId: editingMessage?.id
      };

      const res = await parentService.communication.sendMessage(messageData);
      if (res?.success) {
        setNewMessage('');
        setAttachments([]);
        setReplyTo(null);
        setEditingMessage(null);
        await loadMessages(selectedConversationId);
        updateConversations();
        
        // Emit via socket
        socket?.emit('new_message', res.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const res = await parentService.communication.editMessage(messageId, newContent);
      if (res?.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, isEdited: true } : m));
        socket?.emit('message_edited', res.data);
        setEditingMessage(null);
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      const res = await parentService.communication.deleteMessage(messageId);
      if (res?.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        socket?.emit('message_deleted', { messageId, conversationId: selectedConversationId });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, audioFile]);
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
    }
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setShowVideoCall(true);
    socket?.emit('initiate_call', { 
      conversationId: selectedConversationId, 
      type,
      to: conversations.find(c => c.id === selectedConversationId)?.participantId 
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <Check className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString();
    }
  };

  const canEditDelete = (messageDate: string) => {
    const diff = (new Date().getTime() - new Date(messageDate).getTime()) / (1000 * 60);
    return diff < 15; // Within 15 minutes
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading messages..." />
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const isTyping = Object.values(typingUsers).some(Boolean);

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={clsx(
                  'p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  selectedConversationId === conv.id && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {conv.participantName?.[0] || 'T'}
                    </div>
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.participantName}
                      </p>
                      {conv.lastMessageTime && (
                        <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">{conv.unreadCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {!selectedConversationId ? (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Chat Header */}
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {selectedConversation?.participantName?.[0] || 'T'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedConversation?.participantName}
                </h3>
                {isTyping && (
                  <p className="text-xs text-blue-500">Typing...</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startCall('audio')}>
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => startCall('video')}>
                <VideoIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, idx) => {
              const isOwn = message.senderId === 'parent'; // Adjust based on your auth
              const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== message.senderId;
              const canEdit = isOwn && canEditDelete(message.createdAt) && message.status !== 'deleted';
              
              return (
                <div key={message.id} className={clsx('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={clsx('max-w-[70%]', !isOwn && showAvatar && 'ml-12')}>
                    {!isOwn && showAvatar && (
                      <div className="text-xs text-gray-500 mb-1 ml-2">
                        {selectedConversation?.participantName}
                      </div>
                    )}
                    
                    {/* Reply Indicator */}
                    {message.replyTo && (
                      <div className={clsx(
                        'text-xs p-2 rounded-t-lg border-l-4',
                        isOwn ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' : 'bg-gray-100 dark:bg-gray-700 border-gray-500'
                      )}>
                        <p className="text-gray-600 dark:text-gray-400">↳ {message.replyTo.content.substring(0, 50)}</p>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={clsx(
                      'p-3 rounded-lg',
                      isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    )}>
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {att.type === 'image' && <Image className="w-4 h-4" />}
                              {att.type === 'audio' && <Volume2 className="w-4 h-4" />}
                              {att.type === 'video' && <Video className="w-4 h-4" />}
                              {att.type === 'document' && <File className="w-4 h-4" />}
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline">
                                {att.name}
                              </a>
                              <Button size="sm" variant="ghost" onClick={() => window.open(att.url)}>
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Edited Indicator */}
                      {message.isEdited && (
                        <div className="text-xs opacity-70 mt-1">(edited)</div>
                      )}
                    </div>
                    
                    {/* Message Footer */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && getMessageStatusIcon(message.status)}
                      {canEdit && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingMessage(message)}
                            className="hover:text-blue-600"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setReplyTo(message)}
                        className="hover:text-blue-600"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {uploading && (
              <div className="text-center text-gray-500">
                <Spinner size="sm" /> Uploading attachments...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Indicator */}
          {replyTo && (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Replying to:</span> {replyTo.content.substring(0, 50)}
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Edit Message Indicator */}
          {editingMessage && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-600 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Editing message</span>
              </div>
              <button onClick={() => setEditingMessage(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t dark:border-gray-700 flex gap-2 overflow-x-auto">
              {attachments.map((file, idx) => (
                <div key={idx} className="relative p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <div className="text-xs">{file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t dark:border-gray-700">
            {editingMessage ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={editingMessage.content}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEditMessage(editingMessage.id, (e.target as HTMLInputElement).value);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
                <Button onClick={() => {
                  const input = document.querySelector('#edit-input') as HTMLInputElement;
                  handleEditMessage(editingMessage.id, input.value);
                }}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? <VolumeX className="w-4 h-4 text-red-500 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
                
                <Button
                  onClick={handleSendMessage}
                  isLoading={sending}
                  disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && selectedConversation && (
        <VideoCall
          callType={callType}
          calleeName={selectedConversation.participantName}
          onClose={() => setShowVideoCall(false)}
          socket={socket}
          conversationId={selectedConversationId}
        />
      )}
    </div>
  );
};

export default ParentMessages;