'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, IconButton, Paper, Typography, TextField, 
  Divider, Fade, Fab, CircularProgress, ClickAwayListener,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Tooltip, InputAdornment,
  Snackbar, Alert, Button
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SearchIcon from '@mui/icons-material/Search';
import Badge from '@mui/material/Badge';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from '@/lib/SocketProvider';
import { useMessages, useSendMessage, useGetOrCreateConversation, useToggleReaction, useConversations, useMarkAsRead, Message } from '../chat-api';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function UserChatWidget() {
  const { user, isAuthenticated, accessToken } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'LIST' | 'CHAT'>('CHAT');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  // usePushNotifications controller
  const { isSupported, isSubscribed, enableNotifications, disableNotifications } = usePushNotifications();

  const queryClient = useQueryClient();
  const getOrCreateMutation = useGetOrCreateConversation();
  // Only fetch conversations when we have a real in-memory access token.
  // isAuthenticated alone is not enough — it becomes true from localStorage before the token is restored.
  const { data: conversations = [], isLoading: loadingConvs } = useConversations(!!accessToken);
  const { data: messages = [], isLoading } = useMessages(conversationId || undefined);
  const sendMessageMutation = useSendMessage(conversationId || '');
  const toggleReactionMutation = useToggleReaction(conversationId || '');
  const markAsReadMutation = useMarkAsRead(conversationId || undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === conversationId);

  // Set initial conversationId if none selected
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  // When auth token is refreshed (e.g. after page reload), invalidate conversations
  // so the list re-fetches with the valid token
  useEffect(() => {
    const handleAuthRefreshed = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    window.addEventListener('auth:refreshed', handleAuthRefreshed);
    return () => window.removeEventListener('auth:refreshed', handleAuthRefreshed);
  }, [queryClient]);

  // Refetch conversations whenever the widget opens (catches missed updates while closed)
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [isOpen, isAuthenticated, queryClient]);

  // Show notification permission banner once per session when chat first opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const bannerDismissed = sessionStorage.getItem('notif_banner_dismissed');
    if (Notification.permission === 'default' && !bannerDismissed) {
      // Small delay so chat animation settles first
      const t = setTimeout(() => setShowNotifBanner(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isOpen, isAuthenticated]);

  // Handle URL openChat parameter (e.g. from push notification click)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const openChatId = params.get('openChat');
      if (openChatId) {
        setConversationId(openChatId);
        setActiveView('CHAT');
        setIsOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Handle external 'open-chat' custom event (can target specific userId or conversationId)
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();

      if (!isAuthenticated) {
        toast('Please sign in to start chatting', { icon: '🔒' });
        window.location.href = '/auth/login';
        return;
      }

      const targetUserId = e?.detail?.userId;
      const targetConvId = e?.detail?.conversationId;

      if (targetConvId) {
        setConversationId(targetConvId);
        setActiveView('CHAT');
      } else if (targetUserId && isAuthenticated) {
        getOrCreateMutation.mutate(targetUserId, {
          onSuccess: (id) => {
            setConversationId(id);
            setActiveView('CHAT');
          }
        });
      } else if (!conversationId && conversations.length > 0) {
        setConversationId(conversations[0].id);
        setActiveView('CHAT');
      }

      setIsOpen(true);
    };

    window.addEventListener('open-chat', handleOpenChat as EventListener);

    if (isOpen && !conversationId && conversations.length === 0 && isAuthenticated) {
      getOrCreateMutation.mutate(undefined, {
        onSuccess: (id) => setConversationId(id)
      });
    }

    if (isOpen && conversationId) {
      markAsReadMutation.mutate();
    }

    return () => {
      window.removeEventListener('open-chat', handleOpenChat as EventListener);
    };
  }, [isOpen, conversationId, isAuthenticated, conversations.length]);

  // Handle Socket Events for active conversation
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
        if (!old) return [message];
        if (old.find(m => m.id === message.id)) return old;
        return [message, ...old];
      });
      if (isOpen && activeView === 'CHAT') {
        markAsReadMutation.mutate();
      } else {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    };

    const handleMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleApprovalChanged = (payload: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    };

    const handleReaction = (payload: { messageId: string, emoji: string, userId: string, user_name: string, added: boolean }) => {
      queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
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
    socket.on('approval_status_changed', handleApprovalChanged);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('reaction_toggled', handleReaction);
      socket.off('messages_read', handleMessagesRead);
      socket.off('approval_status_changed', handleApprovalChanged);
    };
  }, [socket, conversationId, queryClient, isOpen, activeView]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !replyTo && (activeView === 'CHAT' || isExpanded)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, replyTo, activeView, isExpanded]);

  if (user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) {
    return null;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    sendMessageMutation.mutate({ content: text.trim(), reply_to_message_id: replyTo?.id });
    setText('');
    setReplyTo(null);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!conversationId) return;
    toggleReactionMutation.mutate({ messageId, emoji });
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const unreadCount = conversations.reduce((acc, conv) => acc + parseInt(conv.unread_count || '0', 10), 0);

  const titleText = activeConv?.type === 'DIRECT' 
    ? (activeConv.other_user_name || 'Direct Chat')
    : 'Rewa Bhoomi Support';

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = conv.type === 'SUPPORT' ? 'rewa bhoomi support' : (conv.other_user_name || '');
    return name.toLowerCase().includes(q) || (conv.other_user_email || '').toLowerCase().includes(q);
  });

  const renderConversationsList = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
      {/* Search and New Support Chat Button */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: 'white' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' }, mb: 1 }}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" fontWeight={700} color="#64748B">
            Active Chats ({conversations.length})
          </Typography>
          <Chip
            size="small"
            icon={<SupportAgentIcon sx={{ fontSize: 15 }} />}
            label="Support Desk"
            clickable
            color="primary"
            variant="outlined"
            onClick={() => {
              getOrCreateMutation.mutate(undefined, {
                onSuccess: (id) => {
                  setConversationId(id);
                  setActiveView('CHAT');
                }
              });
            }}
            sx={{ fontSize: '0.72rem', fontWeight: 600, height: 24 }}
          />
        </Box>
      </Box>

      {/* Conversations Items */}
      <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
        {loadingConvs ? (
          <Box p={3} textAlign="center"><CircularProgress size={24} /></Box>
        ) : filteredConversations.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">No conversations found.</Typography>
          </Box>
        ) : (
          filteredConversations.map((conv) => {
            const isSupport = conv.type === 'SUPPORT';
            const name = isSupport ? 'Rewa Bhoomi Support' : (conv.other_user_name || 'User');
            const isSelected = conversationId === conv.id;

            return (
              <React.Fragment key={conv.id}>
                <ListItem 
                  button 
                  selected={isSelected}
                  onClick={() => {
                    setConversationId(conv.id);
                    setActiveView('CHAT');
                  }}
                  sx={{ 
                    bgcolor: isSelected ? '#EFF6FF' : 'white', 
                    py: 1.2,
                    borderLeft: isSelected ? '4px solid #1B4FD8' : '4px solid transparent',
                    '&:hover': { bgcolor: '#F1F5F9' }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 46 }}>
                    <Badge badgeContent={parseInt(conv.unread_count || '0', 10)} color="error">
                      <Avatar 
                        src={conv.other_user_avatar || undefined} 
                        sx={{ width: 36, height: 36, bgcolor: isSupport ? '#1B4FD8' : '#7C3AED', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        {isSupport ? <SupportAgentIcon sx={{ fontSize: 20 }} /> : name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" fontWeight={700} color="#0F172A" noWrap sx={{ maxWidth: 140 }}>
                          {name}
                        </Typography>
                        <Chip 
                          label={isSupport ? 'Support' : 'Direct'} 
                          size="small" 
                          color={isSupport ? 'primary' : 'secondary'} 
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} 
                        />
                      </Box>
                    } 
                    secondary={conv.last_message || 'No messages yet'}
                    secondaryTypographyProps={{ 
                      noWrap: true, 
                      fontWeight: parseInt(conv.unread_count || '0', 10) > 0 ? 700 : 400,
                      color: parseInt(conv.unread_count || '0', 10) > 0 ? '#0F172A' : '#64748B',
                      fontSize: '0.78rem'
                    }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })
        )}
      </List>
    </Box>
  );

  const renderActiveChatMessages = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
      {/* Enable Notification Banner if not subscribed */}
      {!isSubscribed && isSupported && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: '#FEF3C7', borderBottom: '1px solid #FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" fontWeight={600} color="#92400E" sx={{ fontSize: '0.72rem' }}>
            🔔 Enable notifications to get alerts when you receive a message
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={enableNotifications}
            sx={{ fontSize: '0.68rem', fontWeight: 700, height: 22, textTransform: 'none', px: 1, minWidth: 0 }}
          >
            Enable
          </Button>
        </Box>
      )}
      {/* Messages Scroll Area */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        <div ref={messagesEndRef} />
        {isLoading || getOrCreateMutation.isPending ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
        ) : messages.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4} sx={{ my: 'auto' }}>
            <ChatIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Start a conversation with {titleText}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Messages are secure and encrypted.
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;

            return (
              <Box 
                key={msg.id} 
                id={`msg-${msg.id}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 2, position: 'relative' }}
              >
                <Box sx={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'center', gap: 0.75, maxWidth: '85%' }}>
                  <Paper 
                    sx={{ 
                      p: 1.5, 
                      minWidth: 70,
                      maxWidth: '100%',
                      width: 'fit-content',
                      bgcolor: isMine ? '#1B4FD8' : 'white', 
                      color: isMine ? 'white' : '#0F172A', 
                      borderRadius: 2,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      border: isMine ? 'none' : '1px solid #E2E8F0'
                    }}
                  >
                    {/* Reply Preview */}
                    {msg.reply_to_message_id && (
                      <Box 
                        onClick={() => scrollToMessage(msg.reply_to_message_id!)}
                        sx={{ 
                          p: 1, mb: 1, borderRadius: 1, bgcolor: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', 
                          borderLeft: '4px solid', borderColor: isMine ? 'white' : '#1B4FD8',
                          cursor: 'pointer', fontSize: '0.8rem', opacity: 0.9
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
                  </Paper>

                  {/* Reactions and Reply Actions */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: isMine ? 'row-reverse' : 'row', 
                      gap: 0.25,
                      opacity: hoveredMessageId === msg.id ? 1 : 0,
                      pointerEvents: hoveredMessageId === msg.id ? 'auto' : 'none',
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

                {/* Display Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <Box sx={{ position: 'absolute', bottom: -10, [isMine ? 'right' : 'left']: 10, bgcolor: 'white', borderRadius: 10, px: 0.75, py: 0.2, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', border: '1px solid #eee', display: 'flex', gap: 0.5, zIndex: 1 }}>
                    {msg.reactions.map((r, i) => (
                      <Typography key={i} variant="caption" sx={{ fontSize: '0.75rem' }} title={r.user_name}>{r.emoji}</Typography>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Input Area */}
      <Box component="form" onSubmit={handleSend} sx={{ p: 1.5, bgcolor: 'white', borderTop: '1px solid #E2E8F0' }}>
        {replyTo && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: '#F1F5F9', borderRadius: 1 }}>
            <Typography variant="caption" noWrap sx={{ flex: 1, opacity: 0.8 }}>
              Replying to: {replyTo.content}
            </Typography>
            <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={`Message ${titleText}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: '0.88rem' } }}
          />
          <IconButton type="submit" color="primary" disabled={!text.trim() || sendMessageMutation.isPending}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Notification Permission Banner */}
      <Snackbar
        open={showNotifBanner}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 150, sm: 100 }, zIndex: 1500 }}
      >
        <Alert
          severity="info"
          icon={<NotificationsNoneIcon />}
          onClose={() => {
            setShowNotifBanner(false);
            sessionStorage.setItem('notif_banner_dismissed', '1');
          }}
          action={
            <Button
              color="inherit"
              size="small"
              sx={{ fontWeight: 700 }}
              onClick={async () => {
                setShowNotifBanner(false);
                sessionStorage.setItem('notif_banner_dismissed', '1');
                await enableNotifications();
              }}
            >
              Enable
            </Button>
          }
          sx={{ fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 2 }}
        >
          Get notified when you receive a reply — even when the app is closed.
        </Alert>
      </Snackbar>
      <Fade in={!isOpen}>
        <Fab
          className="chat-fab-trigger"
          data-chat-trigger="true"
          color="primary"
          sx={{ position: 'fixed', bottom: { xs: 80, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1000 }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!isAuthenticated) {
              toast('Please sign in to chat', { icon: '🔒' });
              window.location.href = '/auth/login';
              return;
            }
            setIsOpen(true);
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <ChatIcon />
          </Badge>
        </Fab>
      </Fade>

      {isOpen && (
        <ClickAwayListener 
          mouseEvent="onMouseDown"
          touchEvent="onTouchStart"
          onClickAway={(e) => {
            const target = e.target as HTMLElement;
            if (target?.closest?.('.chat-fab-trigger') || target?.closest?.('[data-chat-trigger]')) {
              return;
            }
            setIsOpen(false);
          }}
        >
          <Paper
            elevation={8}
            sx={{
              position: 'fixed', 
              bottom: isExpanded ? { xs: 0, md: '5vh' } : { xs: 76, sm: 24 }, 
              top: isExpanded ? { xs: 0, md: 'auto' } : 'auto',
              right: isExpanded ? { xs: 0, md: 'auto' } : { xs: 8, sm: 24 }, 
              left: isExpanded ? { xs: 0, md: '50%' } : 'auto',
              transform: isExpanded ? { xs: 'none', md: 'translateX(-50%)' } : 'none',
              width: isExpanded ? { xs: '100vw', md: '60vw' } : { xs: 'calc(100vw - 16px)', sm: 390 }, 
              maxWidth: isExpanded ? { xs: '100vw', md: '860px' } : { xs: '450px', sm: '390px' },
              height: isExpanded ? { xs: '100dvh', md: '82vh' } : { xs: '68vh', sm: 540 }, 
              zIndex: 1400,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', 
              borderRadius: isExpanded ? { xs: 0, md: 3 } : 3,
              transition: 'all 0.25s ease',
              border: { xs: 'none', md: '1px solid #E2E8F0' },
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            {/* Main Widget Header */}
            <Box sx={{ p: 1.5, px: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56 }}>
              <Box display="flex" alignItems="center" gap={1} sx={{ overflow: 'hidden' }}>
                {/* Back to list button (shown on mobile always when in CHAT, or desktop compact CHAT) */}
                {activeView === 'CHAT' && (
                  <Tooltip title="View all conversations">
                    <IconButton 
                      size="small" 
                      sx={{ 
                        color: 'inherit', p: 0.6, bgcolor: 'rgba(255,255,255,0.18)', mr: 0.5,
                        display: isExpanded ? { xs: 'inline-flex', md: 'none' } : 'inline-flex',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
                      }} 
                      onClick={() => setActiveView('LIST')}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="subtitle1" fontWeight={700} fontSize="0.95rem" noWrap lineHeight={1.2}>
                    {isExpanded 
                      ? (activeView === 'LIST' ? 'Conversations' : titleText)
                      : (activeView === 'LIST' ? 'Your Conversations' : titleText)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.72rem', display: 'block' }} noWrap>
                    {activeView === 'LIST' 
                      ? `${conversations.length} active channels` 
                      : (activeConv?.type === 'DIRECT' ? 'Direct User Chat' : 'Official Support')}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
                {/* Enable / Disable Push Notifications Button */}
                {isSupported && (
                  <Tooltip title={isSubscribed ? "Notifications Active (Click to disable)" : "Click to Enable Push Notifications"}>
                    <IconButton
                      size="small"
                      onClick={isSubscribed ? disableNotifications : enableNotifications}
                      sx={{
                        color: 'white',
                        bgcolor: isSubscribed ? 'rgba(255,255,255,0.2)' : '#F59E0B',
                        mr: 0.5,
                        '&:hover': { bgcolor: isSubscribed ? 'rgba(255,255,255,0.3)' : '#D97706' }
                      }}
                    >
                      {isSubscribed ? <NotificationsActiveIcon fontSize="small" /> : <NotificationsOffIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}

                {/* Mobile / Compact List toggle chip */}
                <Box sx={{ display: isExpanded ? { xs: 'block', md: 'none' } : 'block' }}>
                  <Chip 
                    label={activeView === 'CHAT' ? 'All Chats' : 'Back to Chat'} 
                    size="small" 
                    onClick={() => setActiveView(activeView === 'CHAT' ? 'LIST' : 'CHAT')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, cursor: 'pointer', height: 24, fontSize: '0.72rem', mr: 0.5 }}
                  />
                </Box>

                <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setIsOpen(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Content Body */}
            {isExpanded ? (
              <>
                {/* Desktop Split-Pane View */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ width: 290, borderRight: '1px solid #E2E8F0', height: '100%' }}>
                    {renderConversationsList()}
                  </Box>
                  <Box sx={{ flex: 1, height: '100%' }}>
                    {conversationId ? renderActiveChatMessages() : (
                      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" p={4}>
                        <ChatIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">Select a conversation to start chatting</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Mobile Expanded View: Clean Single View (List or Chat) */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
                  {activeView === 'LIST' ? renderConversationsList() : renderActiveChatMessages()}
                </Box>
              </>
            ) : (
              /* Compact View: Clean Single View (List or Chat) */
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeView === 'LIST' ? renderConversationsList() : renderActiveChatMessages()}
              </Box>
            )}
          </Paper>
        </ClickAwayListener>
      )}
    </>
  );
}
