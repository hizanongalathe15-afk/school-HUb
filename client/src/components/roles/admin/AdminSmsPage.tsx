// client/src/components/roles/admin/AdminSmsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Users, UserPlus, Paperclip, Image, File, Smile, 
  Mic, Phone, Video, Search, MoreVertical, Check, CheckCheck,
  Clock, AlertCircle, PhoneCall, Mail, MessageCircle,
  Camera as Instagram, Share2 as Facebook, Send as Twitter, Link2, X, Plus, Trash2,
  Edit2, Copy, Reply, Forward, Star, Archive, Flag,
  Volume2, VolumeX, Download, Share2, Printer, Grid,
  List, Filter, RefreshCw, Settings, Bell, BellOff,
  UserCheck, UserX, Crown, Shield, AtSign, Hash,
  Camera, MapPin, Calendar, Gift, Wallet, Cloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { communicationService } from '../../../services/adminService';
import type { Contact, Group, Message, Attachment } from '../../../types/communication';

export default function AdminSmsPage() {
  // State Management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ type: 'contact' | 'group'; id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email' | 'whatsapp' | 'telegram'>('sms');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  const [newContactData, setNewContactData] = useState({ name: '', phone: '', email: '', role: 'parent' as const });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load real data from API
  useEffect(() => {
    loadContacts();
    loadGroups();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      scrollToBottom();
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await communicationService.getContacts();
      setContacts(data);
    } catch (error) {
      toast.error('Failed to load contacts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await communicationService.getGroups();
      setGroups(data);
    } catch (error) {
      toast.error('Failed to load groups');
      console.error(error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const data = await communicationService.getMessages(chatId);
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages');
      console.error(error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await communicationService.getMessageTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedChat) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('text', newMessage);
    formData.append('chatId', selectedChat.id);
    formData.append('chatType', selectedChat.type);
    formData.append('channel', selectedChannel);
    if (scheduledTime) formData.append('scheduledFor', scheduledTime.toISOString());
    attachments.forEach(file => formData.append('attachments', file));
    if (replyingTo) formData.append('replyTo', replyingTo.id);

    try {
      const response = await communicationService.sendMessage(formData);
      
      // Add message to UI
      const newMsg: Message = {
        id: response.id,
        text: newMessage,
        sender: response.sender,
        timestamp: new Date(),
        status: 'sent',
        type: selectedChannel,
        attachments: response.attachments || [],
        replyTo: replyingTo || undefined
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);
      setScheduledTime(null);
      toast.success(`Message sent via ${selectedChannel.toUpperCase()}`);
      scrollToBottom();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      const newGroup = await communicationService.createGroup(newGroupData);
      setGroups([...groups, newGroup]);
      setShowNewGroupModal(false);
      setNewGroupData({ name: '', description: '' });
      toast.success('Group created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    if (!newContactData.name.trim() || !newContactData.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    
    setLoading(true);
    try {
      const newContact = await communicationService.createContact(newContactData);
      setContacts([...contacts, newContact]);
      setShowNewContactModal(false);
      setNewContactData({ name: '', phone: '', email: '', role: 'parent' });
      toast.success('Contact added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const addContactToGroup = async (groupId: string, contactId: string) => {
    try {
      await communicationService.addContactToGroup(groupId, contactId);
      const updatedGroups = groups.map(group => 
        group.id === groupId 
          ? { ...group, members: [...group.members, contacts.find(c => c.id === contactId)!] }
          : group
      );
      setGroups(updatedGroups);
      toast.success('Contact added to group');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    }
  };

  const removeContactFromGroup = async (groupId: string, contactId: string) => {
    try {
      await communicationService.removeContactFromGroup(groupId, contactId);
      const updatedGroups = groups.map(group =>
        group.id === groupId
          ? { ...group, members: group.members.filter(m => m.id !== contactId) }
          : group
      );
      setGroups(updatedGroups);
      toast.success('Contact removed from group');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove contact');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      await communicationService.deleteMessage(messageId);
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const starMessage = async (messageId: string) => {
    try {
      const updated = await communicationService.starMessage(messageId);
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isStarred: updated.isStarred } : m
      ));
      toast.success(updated.isStarred ? 'Message starred' : 'Message unstarred');
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const forwardMessage = async (message: Message, targetChatId: string) => {
    try {
      await communicationService.forwardMessage(message.id, targetChatId);
      toast.success('Message forwarded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to forward message');
    }
  };

  const bulkSend = async (contactIds: string[], messageText: string) => {
    setLoading(true);
    try {
      const result = await communicationService.bulkSend({ 
        contactIds, 
        message: messageText, 
        channel: selectedChannel 
      });
      toast.success(`Messages sent to ${result.sentCount} recipients`);
    } catch (error: any) {
      toast.error(error.message || 'Bulk send failed');
    } finally {
      setLoading(false);
    }
  };

  const exportChat = async () => {
    if (!selectedChat) return;
    
    try {
      const blob = await communicationService.exportChat(selectedChat.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_export_${selectedChat.id}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Chat exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export chat');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => file.size <= maxSize);
    
    if (validFiles.length !== files.length) {
      toast.error('Some files exceed 10MB limit');
    }
    setAttachments([...attachments, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: Message['status']) => {
    switch(status) {
      case 'sending': return <Clock size={12} className="text-gray-400" />;
      case 'sent': return <Check size={12} className="text-gray-400" />;
      case 'delivered': return <CheckCheck size={12} className="text-blue-500" />;
      case 'read': return <CheckCheck size={12} className="text-green-500" />;
      case 'failed': return <AlertCircle size={12} className="text-red-500" />;
      default: return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch(channel) {
      case 'sms': return <MessageCircle size={14} />;
      case 'email': return <Mail size={14} />;
      case 'whatsapp': return <MessageCircle size={14} />;
      case 'telegram': return <Send size={14} />;
      default: return <MessageCircle size={14} />;
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-communication-page">
      <div className="whatsapp-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="header-info">
              <h2>Communications</h2>
              <p>Admin Dashboard</p>
            </div>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => setShowNewGroupModal(true)}>
                <Users size={20} />
              </button>
              <button className="icon-btn" onClick={() => setShowNewContactModal(true)}>
                <UserPlus size={20} />
              </button>
              <button className="icon-btn" onClick={exportChat} disabled={!selectedChat}>
                <Download size={20} />
              </button>
              <button className="icon-btn" onClick={() => { loadContacts(); loadGroups(); }}>
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search contacts or groups..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="chats-list">
            {/* Groups Section */}
            {filteredGroups.length > 0 && (
              <div className="chats-section">
                <h3>Groups ({filteredGroups.length})</h3>
                {filteredGroups.map(group => (
                  <div 
                    key={group.id} 
                    className={`chat-item ${selectedChat?.type === 'group' && selectedChat.id === group.id ? 'active' : ''}`}
                    onClick={() => setSelectedChat({ type: 'group', id: group.id })}
                  >
                    <div className="chat-avatar group-avatar">
                      <div className="avatar-placeholder group">
                        <Users size={24} />
                      </div>
                    </div>
                    <div className="chat-info">
                      <h4>{group.name}</h4>
                      <p>{group.members?.length || 0} members</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contacts Section */}
            {filteredContacts.length > 0 && (
              <div className="chats-section">
                <h3>Contacts ({filteredContacts.length})</h3>
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`chat-item ${selectedChat?.type === 'contact' && selectedChat.id === contact.id ? 'active' : ''}`}
                    onClick={() => setSelectedChat({ type: 'contact', id: contact.id })}
                  >
                    <div className="chat-avatar">
                      <div className="avatar-placeholder" style={{ background: getColorFromName(contact.name) }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      {contact.isOnline && <span className="online-indicator"></span>}
                    </div>
                    <div className="chat-info">
                      <h4>{contact.name}</h4>
                      <p className="role-badge">{contact.role}</p>
                      {contact.lastSeen && !contact.isOnline && (
                        <p className="last-seen">last seen {formatTime(new Date(contact.lastSeen))}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredContacts.length === 0 && filteredGroups.length === 0 && (
              <div className="empty-state-small">
                <p>No contacts or groups found</p>
                <button onClick={() => setShowNewContactModal(true)} className="btn-secondary">
                  <UserPlus size={16} /> Add Contact
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <div className="chat-area">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                {selectedChat.type === 'group' ? (
                  <>
                    <div className="group-avatar-header">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3>{groups.find(g => g.id === selectedChat.id)?.name || 'Group'}</h3>
                      <p>{groups.find(g => g.id === selectedChat.id)?.members?.length || 0} members</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="contact-avatar-header">
                      {contacts.find(c => c.id === selectedChat.id)?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3>{contacts.find(c => c.id === selectedChat.id)?.name || 'Contact'}</h3>
                      <p>{contacts.find(c => c.id === selectedChat.id)?.phone || 'No phone'}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="chat-header-actions">
                {selectedChat.type === 'group' && (
                  <button className="icon-btn" onClick={() => setShowGroupInfo(!showGroupInfo)}>
                    <MoreVertical size={20} />
                  </button>
                )}
                <button className="icon-btn" onClick={() => setIsSelectionMode(!isSelectionMode)}>
                  <Check size={20} />
                </button>
                {selectedChat.type === 'contact' && (
                  <>
                    <button className="icon-btn" onClick={() => window.location.href = `tel:${contacts.find(c => c.id === selectedChat.id)?.phone}`}>
                      <Phone size={20} />
                    </button>
                    <button className="icon-btn" onClick={() => window.location.href = `mailto:${contacts.find(c => c.id === selectedChat.id)?.email}`}>
                      <Mail size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="messages-area" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <MessageCircle size={48} strokeWidth={1} />
                  <p>No messages yet</p>
                  <p className="subtitle">Send your first message!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message-wrapper ${message.sender?.id === 'admin' || message.sender?.role === 'admin' ? 'sent' : 'received'}`}
                  >
                    {message.replyTo && (
                      <div className="reply-preview">
                        <div className="reply-content">
                          <p>Replying to: {message.replyTo.text?.substring(0, 50)}</p>
                        </div>
                      </div>
                    )}
                    <div className="message-bubble">
                      {message.sender?.role !== 'admin' && message.sender?.name && (
                        <div className="message-sender">{message.sender.name}</div>
                      )}
                      <div className="message-text">{message.text}</div>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map(attachment => (
                            <div key={attachment.id} className="attachment-item">
                              {attachment.type === 'image' ? (
                                <img src={attachment.url} alt={attachment.name} />
                              ) : (
                                <div className="file-attachment">
                                  <File size={24} />
                                  <span>{attachment.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="message-meta">
                        <span className="time">{formatTime(new Date(message.timestamp))}</span>
                        {getStatusIcon(message.status)}
                        {getChannelIcon(message.type)}
                        {message.isStarred && <Star size={10} fill="gold" />}
                      </div>
                    </div>
                    
                    <div className="message-actions">
                      <button onClick={() => setReplyingTo(message)}><Reply size={14} /></button>
                      <button onClick={() => starMessage(message.id)}><Star size={14} /></button>
                      <button onClick={() => forwardMessage(message, selectedChat.id)}><Forward size={14} /></button>
                      <button onClick={() => deleteMessage(message.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Indicator */}
            {replyingTo && (
              <div className="reply-indicator">
                <div className="reply-info">
                  <span>Replying to: {replyingTo.text?.substring(0, 50)}</span>
                  <button onClick={() => setReplyingTo(null)}><X size={16} /></button>
                </div>
              </div>
            )}

            {/* Scheduled Message Indicator */}
            {scheduledTime && (
              <div className="schedule-indicator">
                <span>📅 Scheduled for: {scheduledTime.toLocaleString()}</span>
                <button onClick={() => setScheduledTime(null)}><X size={16} /></button>
              </div>
            )}

            {/* Input Area */}
            <div className="input-area">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="attachments-preview">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="attachment-preview">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                      ) : (
                        <File size={32} />
                      )}
                      <span>{file.name}</span>
                      <button onClick={() => removeAttachment(idx)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="input-container">
                {/* Channel Selector */}
                <select 
                  value={selectedChannel} 
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="channel-select"
                >
                  <option value="sms">📱 SMS</option>
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="telegram">📨 Telegram</option>
                </select>

                <button className="input-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile size={22} />
                </button>
                
                <button className="input-btn" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={22} />
                </button>
                
                <button className="input-btn" onClick={() => setShowTemplateModal(true)}>
                  <File size={22} />
                </button>

                <button className="input-btn" onClick={() => setScheduledTime(new Date())}>
                  <Calendar size={22} />
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />

                <button 
                  className={`send-btn ${loading ? 'loading' : ''}`}
                  onClick={sendMessage}
                  disabled={loading || (!newMessage.trim() && attachments.length === 0)}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <MessageCircle size={64} strokeWidth={1} />
            <h3>Select a chat</h3>
            <p>Choose a contact or group to start communicating</p>
            <div className="empty-actions">
              <button onClick={() => setShowNewContactModal(true)} className="btn-primary">
                <UserPlus size={16} /> Add Contact
              </button>
              <button onClick={() => setShowNewGroupModal(true)} className="btn-secondary">
                <Users size={16} /> Create Group
              </button>
            </div>
          </div>
        )}

        {/* Group Info Sidebar */}
        {showGroupInfo && selectedChat?.type === 'group' && (
          <div className="group-info-sidebar">
            <div className="group-info-header">
              <h3>Group Info</h3>
              <button onClick={() => setShowGroupInfo(false)}><X size={20} /></button>
            </div>
            
            <div className="group-info-content">
              <div className="group-avatar-large">
                <Users size={48} />
              </div>
              <h4>{groups.find(g => g.id === selectedChat.id)?.name}</h4>
              <p className="group-description">{groups.find(g => g.id === selectedChat.id)?.description || "No description"}</p>
              
              <div className="group-stats">
                <div className="stat">
                  <span>{groups.find(g => g.id === selectedChat.id)?.members?.length || 0}</span>
                  <label>Members</label>
                </div>
                <div className="stat">
                  <span>{groups.find(g => g.id === selectedChat.id)?.admins?.length || 1}</span>
                  <label>Admins</label>
                </div>
              </div>

              <div className="group-members">
                <h4>Members</h4>
                {groups.find(g => g.id === selectedChat.id)?.members?.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.name?.charAt(0) || '?'}
                    </div>
                    <div className="member-info">
                      <strong>{member.name}</strong>
                      <p>{member.phone}</p>
                      {member.role && <span className="member-role">{member.role}</span>}
                    </div>
                    <div className="member-actions">
                      <button onClick={() => removeContactFromGroup(selectedChat.id, member.id)}>
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button className="add-member-btn" onClick={() => {
                  const contactId = prompt('Enter contact ID to add:');
                  if (contactId) addContactToGroup(selectedChat.id, contactId);
                }}>
                  <UserPlus size={16} /> Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="modal-overlay" onClick={() => setShowNewGroupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create New Group</h3>
            <input 
              type="text" 
              placeholder="Group Name" 
              value={newGroupData.name}
              onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
            />
            <textarea 
              placeholder="Group Description (optional)" 
              value={newGroupData.description}
              onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewGroupModal(false)}>Cancel</button>
              <button onClick={createGroup} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContactModal && (
        <div className="modal-overlay" onClick={() => setShowNewContactModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Contact</h3>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={newContactData.name}
              onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={newContactData.phone}
              onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={newContactData.email}
              onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
            />
            <select 
              value={newContactData.role}
              onChange={(e) => setNewContactData({ ...newContactData, role: e.target.value as any })}
            >
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowNewContactModal(false)}>Cancel</button>
              <button onClick={createContact} disabled={loading}>
                {loading ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content template-modal" onClick={e => e.stopPropagation()}>
            <h3>Message Templates</h3>
            <div className="templates-list">
              {templates.length === 0 ? (
                <p className="empty-templates">No templates available</p>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="template-item" onClick={() => {
                    setNewMessage(template.message);
                    setShowTemplateModal(false);
                  }}>
                    <strong>{template.name}</strong>
                    <p>{template.message.substring(0, 100)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-communication-page {
          height: calc(100vh - 70px);
          background: #f0f2f5;
        }

        .whatsapp-container {
          display: flex;
          height: 100%;
          overflow: hidden;
          background: white;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 380px;
          background: white;
          border-right: 1px solid #e9edef;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 20px 16px;
          background: #f0f2f5;
          border-bottom: 1px solid #e9edef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #111b21;
        }

        .sidebar-header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #54656f;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.05);
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-bar {
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #e9edef;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          padding: 8px 0;
          background: transparent;
        }

        .chats-list {
          flex: 1;
          overflow-y: auto;
        }

        .chats-section {
          margin-bottom: 16px;
        }

        .chats-section h3 {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #54656f;
          margin: 0;
        }

        .chat-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .chat-item:hover {
          background: #f5f6f6;
        }

        .chat-item.active {
          background: #e9edef;
        }

        .chat-avatar {
          position: relative;
          width: 49px;
          height: 49px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .avatar-placeholder {
          width: 49px;
          height: 49px;
          border-radius: 50%;
          background: #1d8a8a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
        }

        .avatar-placeholder.group {
          background: #00a884;
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #25d366;
          border: 2px solid white;
        }

        .chat-info {
          flex: 1;
          min-width: 0;
        }

        .chat-info h4 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 500;
          color: #111b21;
        }

        .chat-info p {
          margin: 0;
          font-size: 13px;
          color: #667781;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-badge {
          display: inline-block;
          background: #e9edef;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          margin-top: 2px;
        }

        .last-seen {
          font-size: 11px;
          color: #8696a0;
        }

        .empty-state-small {
          text-align: center;
          padding: 40px 20px;
          color: #667781;
        }

        /* Chat Area Styles */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #efeae2;
          position: relative;
        }

        .chat-header {
          background: #f0f2f5;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 1px solid #e9edef;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .group-avatar-header, .contact-avatar-header {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #00a884;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .chat-header-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #111b21;
        }

        .chat-header-info p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #667781;
        }

        .chat-header-actions {
          display: flex;
          gap: 8px;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
        }

        .empty-messages {
          text-align: center;
          padding: 60px 20px;
          color: #667781;
        }

        .empty-messages .subtitle {
          font-size: 13px;
          margin-top: 8px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 65%;
          position: relative;
        }

        .message-wrapper.sent {
          align-self: flex-end;
        }

        .message-wrapper.received {
          align-self: flex-start;
        }

        .message-bubble {
          padding: 8px 12px;
          border-radius: 8px;
          position: relative;
          word-wrap: break-word;
        }

        .message-wrapper.sent .message-bubble {
          background: #d9fdd3;
          border-top-right-radius: 0;
        }

        .message-wrapper.received .message-bubble {
          background: white;
          border-top-left-radius: 0;
        }

        .message-sender {
          font-size: 12px;
          font-weight: 600;
          color: #1d8a8a;
          margin-bottom: 4px;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.4;
          color: #111b21;
        }

        .message-attachments {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .attachment-item {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
        }

        .attachment-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-attachment {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: #f0f2f5;
          border-radius: 8px;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #667781;
          margin-top: 4px;
          justify-content: flex-end;
        }

        .message-actions {
          position: absolute;
          top: -20px;
          right: 0;
          display: none;
          gap: 4px;
          background: white;
          padding: 4px 8px;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .message-wrapper:hover .message-actions {
          display: flex;
        }

        .message-actions button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-actions button:hover {
          background: #f0f2f5;
        }

        .reply-preview {
          margin-bottom: 4px;
          padding: 4px 8px;
          background: rgba(0,0,0,0.05);
          border-radius: 8px;
          font-size: 12px;
          border-left: 3px solid #1d8a8a;
        }

        .reply-content p {
          margin: 0;
          color: #667781;
        }

        .reply-indicator, .schedule-indicator {
          padding: 8px 16px;
          background: #f0f2f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .input-area {
          background: #f0f2f5;
          padding: 10px 16px;
          border-top: 1px solid #e9edef;
        }

        .attachments-preview {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .attachment-preview {
          position: relative;
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .attachment-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .attachment-preview button {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(0,0,0,0.5);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }

        .input-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border-radius: 24px;
          padding: 8px 16px;
        }

        .channel-select {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e9edef;
          background: white;
          font-size: 13px;
          cursor: pointer;
        }

        .input-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #54656f;
        }

        .input-btn:hover {
          background: #f0f2f5;
        }

        .input-container textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          font-size: 15px;
          padding: 8px 0;
          max-height: 100px;
          font-family: inherit;
        }

        .send-btn {
          background: #1d8a8a;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #166b6b;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn.loading {
          animation: pulse 1s infinite;
        }

        /* Empty State */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #667781;
        }

        .empty-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-primary {
          background: #1d8a8a;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary {
          background: white;
          border: 1px solid #cbd5e1;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* Group Info Sidebar */
        .group-info-sidebar {
          width: 320px;
          background: white;
          border-left: 1px solid #e9edef;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .group-info-header {
          padding: 20px;
          border-bottom: 1px solid #e9edef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .group-info-content {
          padding: 20px;
          text-align: center;
        }

        .group-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #00a884;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: white;
        }

        .group-description {
          color: #667781;
          font-size: 14px;
          margin: 8px 0;
        }

        .group-stats {
          display: flex;
          gap: 32px;
          justify-content: center;
          margin: 20px 0;
        }

        .stat {
          text-align: center;
        }

        .stat span {
          font-size: 24px;
          font-weight: bold;
          display: block;
        }

        .group-members {
          text-align: left;
          margin-top: 20px;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #e9edef;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1d8a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .member-info {
          flex: 1;
        }

        .member-info strong {
          display: block;
          font-size: 14px;
        }

        .member-info p {
          margin: 0;
          font-size: 12px;
          color: #667781;
        }

        .member-role {
          font-size: 10px;
          background: #e9edef;
          padding: 2px 6px;
          border-radius: 12px;
          display: inline-block;
          margin-top: 2px;
        }

        .add-member-btn {
          width: 100%;
          margin-top: 16px;
          padding: 8px;
          background: #1d8a8a;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Modal Styles */
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
          border-radius: 16px;
          padding: 24px;
          width: 400px;
          max-width: 90%;
        }

        .modal-content h3 {
          margin: 0 0 20px;
        }

        .modal-content input, .modal-content textarea, .modal-content select {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9edef;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .template-modal {
          width: 500px;
        }

        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .template-item {
          padding: 12px;
          border: 1px solid #e9edef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-item:hover {
          background: #f0f2f5;
          border-color: #1d8a8a;
        }

        .empty-templates {
          text-align: center;
          padding: 40px;
          color: #667781;
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-wrapper {
          animation: slideIn 0.2s ease-out;
        }

        /* Scrollbar Styles */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (hours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getColorFromName(name: string): string {
  const colors = ['#1d8a8a', '#00a884', '#25d366', '#128C7E', '#075E54', '#34B7F1'];
  const index = name.length % colors.length;
  return colors[index];
}
