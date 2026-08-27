'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, IconButton, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress,
  Switch, FormControlLabel, Chip, Button, Select, MenuItem, FormControl, InputLabel, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ReplyIcon from '@mui/icons-material/Reply';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Badge from '@mui/material/Badge';
import { useSocket } from '@/lib/SocketProvider';
import { 
  useConversations, 
  useMessages, 
  useSendMessage, 
  useToggleReaction, 
  useMarkAsRead, 
  useGetOrCreateConversation, 
  useToggleConversationApproval,
  useChatSettings,
  useUpdateChatSettings,
  Message 
} from '@/features/chat/chat-api';
import { useAuth } from '@/features/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminChatPage() {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'SUPPORT' | 'DIRECT' | 'PENDING'>('ALL');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [impersonateAs, setImpersonateAs] = useState<string>('ADMIN');
  
  const { data: conversations = [], isLoading: loadingConvs } = useConversations(isAuthenticated);
  const { data: messages = [], isLoading: loadingMsgs } = useMessages(activeConvId || undefined);
  const { data: settingsData } = useChatSettings();
  const updateSettingsMutation = useUpdateChatSettings();
  const toggleApprovalMutation = useToggleConversationApproval();
  const sendMessageMutation = useSendMessage(activeConvId || '');
  const toggleReactionMutation = useToggleReaction(activeConvId || '');
  const markAsReadMutation = useMarkAsRead(activeConvId || undefined);
  const getOrCreateMutation = useGetOrCreateConversation();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Set default impersonation persona when active conversation changes
  useEffect(() => {
    if (activeConv?.type === 'DIRECT') {
      // By default in P2P, admin replies to initiator as recipient
      setImpersonateAs(activeConv.recipient_id || 'ADMIN');
    } else {
      setImpersonateAs('ADMIN');
    }
  }, [activeConvId, activeConv?.type, activeConv?.recipient_id]);

  // Auto-create/open conversation if userId or conversationId is passed in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('userId');
    const targetConvId = params.get('conversationId');
    if (targetConvId) {
      setActiveConvId(targetConvId);
      window.history.replaceState(null, '', '/admin/chat');
    } else if (targetUserId) {
      getOrCreateMutation.mutate(targetUserId, {
        onSuccess: (id) => {
          setActiveConvId(id);
          window.history.replaceState(null, '', '/admin/chat');
        }
      });
    }
  }, []);

  const filteredConversations = conversations.filter(conv => {
    // Search query filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchName = conv.user_name?.toLowerCase().includes(lowerQuery) ||
                        conv.initiator_name?.toLowerCase().includes(lowerQuery) ||
                        conv.recipient_name?.toLowerCase().includes(lowerQuery);
      const matchEmail = conv.user_email?.toLowerCase().includes(lowerQuery) ||
                         conv.initiator_email?.toLowerCase().includes(lowerQuery) ||
                         conv.recipient_email?.toLowerCase().includes(lowerQuery);
      if (!matchName && !matchEmail) return false;
    }

    // Type filter
    if (filterType === 'SUPPORT') return conv.type === 'SUPPORT';
    if (filterType === 'DIRECT') return conv.type === 'DIRECT';
    if (filterType === 'PENDING') return conv.type === 'DIRECT' && !conv.is_approved_for_recipient;

    return true;
  });

  // Global admin socket listener for sidebar updates & approval changes
  useEffect(() => {
    if (!socket) return;
    const handleAdminNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const handleApprovalChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('admin_new_message', handleAdminNewMessage);
    socket.on('approval_status_changed', handleApprovalChanged);

    return () => {
      socket.off('admin_new_message', handleAdminNewMessage);
      socket.off('approval_status_changed', handleApprovalChanged);
    };
  }, [socket, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !replyTo) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, replyTo]);

  // Socket setup for active conversation
  useEffect(() => {
    if (!socket || !activeConvId) return;
    
    socket.emit('join_conversation', activeConvId);

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', activeConvId], (old: Message[] | undefined) => {
        if (!old) return [message];
        if (old.find(m => m.id === message.id)) return old;
        return [message, ...old];
      });
      markAsReadMutation.mutate();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleReaction = (payload: { messageId: string, emoji: string, userId: string, user_name: string, added: boolean }) => {
      queryClient.setQueryData(['messages', activeConvId], (old: Message[] | undefined) => {
        if (!old) return old;
        return old.map(m => {
          if (m.id !== payload.messageId) return m;
          let newReactions = [...(m.reactions || [])];
          if (payload.added) {
            if (!newReactions.find(r => r.user_id === payload.userId && r.emoji === payload.emoji)) {
              newReactions.push({ emoji: payload.emoji, user_id: payload.userId, user_name: payload.user_name });
            }
          } else {
            newReactions = newReactions.filter(r => !(r.user_id === payload.userId && r.emoji === payload.emoji));
          }
          return { ...m, reactions: newReactions };
        });
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('reaction_toggled', handleReaction);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.emit('leave_conversation', activeConvId);
      socket.off('new_message', handleNewMessage);
      socket.off('reaction_toggled', handleReaction);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConvId, queryClient]);

  useEffect(() => {
    if (activeConvId) {
      markAsReadMutation.mutate();
    }
  }, [activeConvId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;

    const impersonateParam = impersonateAs !== 'ADMIN' ? impersonateAs : undefined;

    sendMessageMutation.mutate({ 
      content: text.trim(), 
      reply_to_message_id: replyTo?.id,
      impersonate_as: impersonateParam
    });
    setText('');
    setReplyTo(null);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!activeConvId) return;
    toggleReactionMutation.mutate({ messageId, emoji });
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`admin-msg-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const isAutoApproveActive = settingsData?.auto_approve_p2p_chat ?? false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100dvh - 120px)', md: 'calc(100vh - 90px)' }, gap: 1.5, pb: 1 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, px: 2, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white', 
          display: { xs: activeConvId ? 'none' : 'flex', md: 'flex' }, 
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <SupportAgentIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#0F172A">
              Admin Chat Moderation Desk
            </Typography>
            <Typography variant="caption" color="#64748B">
              Control P2P message approvals, ghost-replies, and customer communications
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1} bgcolor="#F1F5F9" px={2} py={0.5} borderRadius={2}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isAutoApproveActive}
                disabled={updateSettingsMutation.isPending}
                onChange={(e) => updateSettingsMutation.mutate({ auto_approve_p2p_chat: e.target.checked })}
                color="success"
              />
            }
            label={
              <Typography variant="body2" fontWeight={600} color="#334155">
                Auto-Approve All User Chats: <span style={{ color: isAutoApproveActive ? '#16A34A' : '#DC2626' }}>{isAutoApproveActive ? 'ON' : 'OFF (Moderated)'}</span>
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, gap: { xs: 0, md: 2 }, overflow: 'hidden' }}>
        <Paper 
          sx={{ 
            width: { xs: '100%', md: 360 }, 
            display: { xs: activeConvId ? 'none' : 'flex', md: 'flex' }, 
            flexDirection: 'column', 
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid #E2E8F0'
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" fontWeight={700}>Conversations</Typography>
          </Box>
          
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {(['ALL', 'SUPPORT', 'DIRECT', 'PENDING'] as const).map((f) => (
                <Chip
                  key={f}
                  label={f === 'PENDING' ? 'Pending' : f === 'DIRECT' ? 'P2P Direct' : f.charAt(0) + f.slice(1).toLowerCase()}
                  size="small"
                  clickable
                  color={filterType === f ? 'primary' : 'default'}
                  variant={filterType === f ? 'filled' : 'outlined'}
                  onClick={() => setFilterType(f)}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
              ))}
            </Box>
          </Box>

          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {loadingConvs ? (
              <Box p={3} textAlign="center"><CircularProgress size={24} /></Box>
            ) : filteredConversations.length === 0 ? (
              <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">No conversations found.</Typography></Box>
            ) : (
              filteredConversations.map((conv) => {
                const isDirect = conv.type === 'DIRECT';
                const isApproved = conv.is_approved_for_recipient;

                return (
                  <React.Fragment key={conv.id}>
                    <ListItem 
                      button 
                      selected={activeConvId === conv.id}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setReplyTo(null);
                      }}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={parseInt(conv.unread_count || '0', 10)} color="error">
                          <Avatar sx={{ bgcolor: isDirect ? '#7C3AED' : '#1B4FD8' }}>
                            {isDirect ? <SwapHorizIcon /> : <PersonIcon />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                            <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 160 }}>
                              {isDirect 
                                ? `${conv.initiator_name || 'User 1'} ↔ ${conv.recipient_name || 'User 2'}`
                                : (conv.user_name || `User ${conv.id.substring(0,6)}...`)}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={isDirect ? (isApproved ? 'Approved' : 'Pending') : 'Support'} 
                              color={isDirect ? (isApproved ? 'success' : 'warning') : 'info'}
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          </Box>
                        } 
                        secondary={conv.last_message || 'No messages yet'}
                        secondaryTypographyProps={{ 
                          noWrap: true, 
                          fontWeight: parseInt(conv.unread_count || '0', 10) > 0 ? 600 : 400, 
                          color: parseInt(conv.unread_count || '0', 10) > 0 ? 'text.primary' : 'text.secondary',
                          fontSize: '0.8rem'
                        }}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Paper>

        <Paper 
          sx={{ 
            flex: 1, 
            display: { xs: activeConvId ? 'flex' : 'none', md: 'flex' }, 
            flexDirection: 'column', 
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid #E2E8F0'
          }}
        >
          {activeConv ? (
            <>
              <Box sx={{ p: 1.5, px: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', flexWrap: 'wrap', gap: 1 }}>
                <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                  <IconButton 
                    sx={{ display: { xs: 'inline-flex', md: 'none' }, p: 0.5, mr: 0.5 }} 
                    onClick={() => setActiveConvId(null)}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight={700} color="#0F172A" noWrap fontSize={{ xs: '0.95rem', md: '1.05rem' }}>
                        {activeConv.type === 'DIRECT' 
                          ? `${activeConv.initiator_name || 'Buyer'} ↔ ${activeConv.recipient_name || 'Owner'}`
                          : `Support with ${activeConv.user_name || 'User'}`}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={activeConv.type === 'DIRECT' ? 'P2P Direct' : 'Support'} 
                        color={activeConv.type === 'DIRECT' ? 'secondary' : 'primary'}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.72rem' }}>
                      {activeConv.type === 'DIRECT'
                        ? `From: ${activeConv.initiator_name} (${activeConv.initiator_email}) • To: ${activeConv.recipient_name} (${activeConv.recipient_email})`
                        : `${activeConv.user_email || 'No email provided'}`}
                    </Typography>
                  </Box>
                </Box>

                {activeConv.type === 'DIRECT' && (
                  <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                    {activeConv.is_approved_for_recipient ? (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<BlockIcon sx={{ fontSize: 16 }} />}
                        disabled={toggleApprovalMutation.isPending}
                        onClick={() => toggleApprovalMutation.mutate({ conversationId: activeConv.id, is_approved: false })}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem', py: 0.5 }}
                      >
                        Restrict
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        disabled={toggleApprovalMutation.isPending}
                        onClick={() => toggleApprovalMutation.mutate({ conversationId: activeConv.id, is_approved: true })}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem', py: 0.5 }}
                      >
                        Approve Direct Chat
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
              
              <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', bgcolor: '#F8FAFC' }}>
                <div ref={messagesEndRef} />
                {loadingMsgs ? (
                  <Box textAlign="center" p={3}><CircularProgress size={24} /></Box>
                ) : messages.length === 0 ? (
                  <Box textAlign="center" p={4}>
                    <Typography variant="body2" color="text.secondary">No messages in this channel yet.</Typography>
                  </Box>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id || msg.actual_sender_id === user?.id;
                    const isGhostAdmin = msg.is_admin_override;

                    return (
                      <Box 
                        key={msg.id} 
                        id={`admin-msg-${msg.id}`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 2, position: 'relative' }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'center', gap: 0.75, maxWidth: { xs: '90%', sm: '75%' } }}>
                          <Paper 
                            sx={{ 
                              p: 1.5, 
                              minWidth: 80,
                              maxWidth: '100%',
                              width: 'fit-content',
                              bgcolor: isMine ? '#1B4FD8' : 'white', 
                              color: isMine ? 'white' : 'text.primary', 
                              borderRadius: 2,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                              border: isMine ? 'none' : '1px solid #E2E8F0'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                                {msg.sender_name || 'User'}
                              </Typography>
                              {isGhostAdmin && (
                                <Chip 
                                  label="Admin Ghost" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} 
                                />
                              )}
                            </Box>

                            {msg.reply_to_message_id && (
                              <Box 
                                onClick={() => scrollToMessage(msg.reply_to_message_id!)}
                                sx={{ 
                                  p: 0.75, mb: 1, borderRadius: 1, 
                                  bgcolor: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', 
                                  borderLeft: '3px solid', borderColor: isMine ? 'white' : 'primary.main',
                                  cursor: 'pointer', fontSize: '0.75rem', opacity: 0.9
                                }}
                              >
                                <Typography variant="caption" noWrap display="block">
                                  {msg.replied_message_content || 'Message deleted'}
                                </Typography>
                              </Box>
                            )}

                            <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.45, fontSize: '0.875rem' }}>
                              {msg.content}
                            </Typography>
                            
                            <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', mt: 0.5, fontSize: '0.7rem', textAlign: isMine ? 'right' : 'left' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>

                            {msg.reactions && msg.reactions.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {msg.reactions.map((r, i) => (
                                  <Chip 
                                    key={i} 
                                    label={`${r.emoji} ${r.user_name || ''}`} 
                                    size="small" 
                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: isMine ? 'rgba(255,255,255,0.2)' : '#F1F5F9' }} 
                                  />
                                ))}
                              </Box>
                            )}
                          </Paper>

                          <Box 
                            sx={{ 
                              display: 'flex', 
                              flexDirection: isMine ? 'row-reverse' : 'row', 
                              gap: 0.25,
                              opacity: { xs: 0.7, sm: hoveredMessageId === msg.id ? 1 : 0 },
                              pointerEvents: 'auto',
                              transition: 'opacity 0.15s ease',
                              flexShrink: 0
                            }}
                          >
                            <IconButton size="small" onClick={() => setReplyTo(msg)} sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } }}>
                              <ReplyIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleToggleReaction(msg.id, '👍')} sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } }}>
                              <AddReactionIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>

              <Divider />
              
              {replyTo && (
                <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #1B4FD8' }}>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="caption" color="text.secondary">Replying to {replyTo.sender_name || 'User'}</Typography>
                    <Typography variant="body2" noWrap fontWeight={500}>{replyTo.content}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyTo(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Box component="form" onSubmit={handleSend} sx={{ p: 1.5, bgcolor: 'white', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {activeConv.type === 'DIRECT' && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    alignItems: { xs: 'stretch', sm: 'center' }, 
                    gap: 1, 
                    bgcolor: '#F8FAFC', 
                    p: 1, px: 1.5, 
                    borderRadius: 2, 
                    border: '1px solid #E2E8F0' 
                  }}>
                    <Typography variant="caption" fontWeight={700} color="#475569" sx={{ whiteSpace: 'nowrap' }}>
                      Send Message As:
                    </Typography>
                    <FormControl size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}>
                      <Select
                        value={impersonateAs}
                        onChange={(e) => setImpersonateAs(e.target.value)}
                        sx={{ fontSize: '0.82rem', height: 32, bgcolor: 'white' }}
                      >
                        <MenuItem value={activeConv.recipient_id || ''}>
                          🎭 {activeConv.recipient_name || 'Recipient (Owner)'} (Ghost Mode)
                        </MenuItem>
                        <MenuItem value={activeConv.initiator_id || ''}>
                          🎭 {activeConv.initiator_name || 'Initiator (Buyer)'} (Ghost Mode)
                        </MenuItem>
                        <MenuItem value="ADMIN">
                          🛡️ Admin / Support Team
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
                      {impersonateAs === 'ADMIN' 
                        ? 'Message displays from Admin' 
                        : 'The other user will see this message as coming from this person'}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder={
                      activeConv.type === 'DIRECT' && impersonateAs !== 'ADMIN'
                        ? `Type a ghost reply as ${impersonateAs === activeConv.recipient_id ? activeConv.recipient_name : activeConv.initiator_name}...`
                        : "Type a message..."
                    }
                    variant="outlined"
                    size="small"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <IconButton color="primary" type="submit" disabled={!text.trim() || sendMessageMutation.isPending}>
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <SupportAgentIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="#475569">Admin Chat Desk</Typography>
              <Typography variant="body2" color="text.secondary">Select a conversation from the left to moderate or ghost-reply</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
