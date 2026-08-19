'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, IconButton, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress, Fade
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ReplyIcon from '@mui/icons-material/Reply';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Badge from '@mui/material/Badge';
import { useSocket } from '@/lib/SocketProvider';
import { useConversations, useMessages, useSendMessage, useToggleReaction, useMarkAsRead, useGetOrCreateConversation, Message } from '@/features/chat/chat-api';
import { useAuth } from '@/features/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  const { data: conversations = [], isLoading: loadingConvs } = useConversations();
  const { data: messages = [], isLoading: loadingMsgs } = useMessages(activeConvId || undefined);
  const sendMessageMutation = useSendMessage(activeConvId || '');
  const toggleReactionMutation = useToggleReaction(activeConvId || '');
  const markAsReadMutation = useMarkAsRead(activeConvId || undefined);
  const getOrCreateMutation = useGetOrCreateConversation();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-create/open conversation if userId is passed in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('userId');
    if (targetUserId) {
      getOrCreateMutation.mutate(targetUserId, {
        onSuccess: (id) => {
          setActiveConvId(id);
          // Optional: clear the query param so it doesn't stay in URL forever
          window.history.replaceState(null, '', '/admin/chat');
        }
      });
    }
  }, []);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      conv.user_name?.toLowerCase().includes(lowerQuery) ||
      conv.user_email?.toLowerCase().includes(lowerQuery)
    );
  });

  // Global admin socket listener for sidebar updates
  useEffect(() => {
    if (!socket) return;
    const handleAdminNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('admin_new_message', handleAdminNewMessage);
    return () => {
      socket.off('admin_new_message', handleAdminNewMessage);
    };
  }, [socket, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !replyTo) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, replyTo]);

  // Socket setup
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
    sendMessageMutation.mutate({ content: text.trim(), reply_to_message_id: replyTo?.id });
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

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: { xs: 0, md: 2 } }}>
      {/* Conversations List (Left Pane) */}
      <Paper 
        sx={{ 
          width: { xs: '100%', md: 320 }, 
          display: { xs: activeConvId ? 'none' : 'flex', md: 'flex' }, 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Conversations</Typography>
        </Box>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {loadingConvs ? (
            <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>
          ) : filteredConversations.length === 0 ? (
            <Box p={2} textAlign="center"><Typography variant="body2" color="text.secondary">No conversations found.</Typography></Box>
          ) : (
            filteredConversations.map((conv) => (
              <React.Fragment key={conv.id}>
                <ListItem 
                  button 
                  selected={activeConvId === conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setReplyTo(null);
                  }}
                >
                  <ListItemAvatar>
                    <Badge badgeContent={parseInt(conv.unread_count || '0', 10)} color="error">
                      <Avatar><PersonIcon /></Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={conv.user_name || `User ${conv.id.substring(0,6)}...`} 
                    secondary={conv.last_message || 'No messages'}
                    secondaryTypographyProps={{ noWrap: true, fontWeight: parseInt(conv.unread_count || '0', 10) > 0 ? 600 : 400, color: parseInt(conv.unread_count || '0', 10) > 0 ? 'text.primary' : 'text.secondary' }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Chat History (Right Pane) */}
      <Paper 
        sx={{ 
          flex: 1, 
          display: { xs: activeConvId ? 'flex' : 'none', md: 'flex' }, 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}
      >
        {activeConvId ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                sx={{ display: { xs: 'inline-flex', md: 'none' } }} 
                onClick={() => setActiveConvId(null)}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">Chat Details</Typography>
            </Box>
            
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', bgcolor: '#f9f9f9' }}>
              <div ref={messagesEndRef} />
              {loadingMsgs ? (
                <Box textAlign="center" p={2}><CircularProgress size={24} /></Box>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <Box 
                      key={msg.id} 
                      id={`admin-msg-${msg.id}`}
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

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {msg.reactions.map((r, i) => (
                                <Box key={i} title={r.user_name} sx={{ bgcolor: 'rgba(0,0,0,0.1)', px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.85rem' }}>
                                  {r.emoji}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Paper>

                        {/* Action Buttons */}
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
                    </Box>
                  );
                })
              )}
            </Box>

            <Divider />
            
            {replyTo && (
              <Box sx={{ p: 1.5, bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="caption" color="text.secondary">Replying to</Typography>
                  <Typography variant="body2" noWrap>{replyTo.content}</Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyTo(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Box component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />
              <IconButton color="primary" type="submit" disabled={!text.trim() || sendMessageMutation.isPending}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">Select a conversation to start chatting</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
