'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, IconButton, Paper, Typography, TextField, 
  Divider, Fade, Fab, CircularProgress, ClickAwayListener
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Badge from '@mui/material/Badge';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from '@/lib/SocketProvider';
import { useMessages, useSendMessage, useGetOrCreateConversation, useToggleReaction, useConversations, useMarkAsRead, Message } from '../chat-api';
import { useQueryClient } from '@tanstack/react-query';

export default function UserChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const queryClient = useQueryClient();
  const getOrCreateMutation = useGetOrCreateConversation();
  const { data: conversations = [] } = useConversations();
  const { data: messages = [], isLoading } = useMessages(conversationId || undefined);
  const sendMessageMutation = useSendMessage(conversationId || '');
  const toggleReactionMutation = useToggleReaction(conversationId || '');
  const markAsReadMutation = useMarkAsRead(conversationId || undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial conversationId if it exists
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  // Initialize conversation when chat opens, and listen to external open events
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      // Prevent immediate clickaway listener interception
      e.stopPropagation();
      setTimeout(() => {
        setIsOpen(true);
      }, 0);
    };
    window.addEventListener('open-chat', handleOpenChat);

    if (isOpen && !conversationId && conversations.length === 0 && isAuthenticated) {
      getOrCreateMutation.mutate(undefined, {
        onSuccess: (id) => setConversationId(id)
      });
    }

    if (isOpen && conversationId) {
      markAsReadMutation.mutate();
    }

    return () => {
      window.removeEventListener('open-chat', handleOpenChat);
    };
  }, [isOpen, conversationId, isAuthenticated, conversations.length]);

  // Handle Socket Events
  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('join_conversation', conversationId);

      const handleNewMessage = (message: Message) => {
        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
          if (!old) return [message];
          if (old.find(m => m.id === message.id)) return old;
          return [message, ...old];
        });
        if (isOpen) {
          markAsReadMutation.mutate();
        } else {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      };

      const handleMessagesRead = () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

      return () => {
        socket.emit('leave_conversation', conversationId);
        socket.off('new_message', handleNewMessage);
        socket.off('reaction_toggled', handleReaction);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket, conversationId, queryClient, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !replyTo) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, replyTo]);

  if (!isAuthenticated || user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) {
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

  return (
    <>
      <Fade in={!isOpen}>
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: { xs: 80, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1000 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <ChatIcon />
          </Badge>
        </Fab>
      </Fade>

      <ClickAwayListener onClickAway={() => { if(isOpen) setIsOpen(false); }}>
        <Fade in={isOpen}>
          <Paper
            elevation={6}
            sx={{
              position: 'fixed', 
              bottom: isExpanded ? { xs: 70, md: '5vh' } : { xs: 80, sm: 24 }, 
              right: isExpanded ? { xs: 0, md: 'auto' } : { xs: 16, sm: 24 }, 
              left: isExpanded ? { xs: 0, md: '50%' } : 'auto',
              transform: isExpanded ? { xs: 'none', md: 'translateX(-50%)' } : 'none',
              width: isExpanded ? { xs: '100vw', md: '40vw' } : { xs: '90vw', sm: 360 }, 
              maxWidth: isExpanded ? { xs: '100vw', md: '600px' } : 'none',
              height: isExpanded ? { xs: 'calc(100dvh - 130px)', md: '82vh' } : { xs: '60vh', sm: 500 }, 
              zIndex: 1300,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', borderRadius: isExpanded ? { xs: 0, md: 3 } : 3,
              transition: 'all 0.3s ease'
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Chat with Support</Typography>
              <Box>
                <IconButton size="small" sx={{ color: 'inherit', mr: 1 }} onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setIsOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', bgcolor: '#f5f5f5' }}>
              <div ref={messagesEndRef} />
              {isLoading || getOrCreateMutation.isPending ? (
                <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
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
                            bgcolor: isMine ? 'primary.main' : 'white', 
                            color: isMine ? 'white' : 'text.primary', 
                            borderRadius: 2,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                          }}
                        >
                          {/* Reply Preview */}
                          {msg.reply_to_message_id && (
                            <Box 
                              onClick={() => scrollToMessage(msg.reply_to_message_id!)}
                              sx={{ 
                                p: 1, mb: 1, borderRadius: 1, bgcolor: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', 
                                borderLeft: '4px solid', borderColor: isMine ? 'white' : 'primary.main',
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

                        {/* Reactions and Reply Actions (Always in DOM to avoid layout jumps, toggle opacity on hover) */}
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
            <Box component="form" onSubmit={handleSend} sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
              {replyTo && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
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
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                />
                <IconButton type="submit" color="primary" disabled={!text.trim() || sendMessageMutation.isPending}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </ClickAwayListener>
    </>
  );
}
