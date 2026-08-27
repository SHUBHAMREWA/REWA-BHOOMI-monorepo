import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export interface Conversation {
  id: string;
  type?: 'SUPPORT' | 'DIRECT';
  initiator_id?: string;
  recipient_id?: string;
  is_approved_for_recipient?: boolean;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  user_name?: string;
  user_email?: string;
  initiator_name?: string;
  initiator_email?: string;
  initiator_avatar?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_avatar?: string;
  other_user_name?: string;
  other_user_email?: string;
  other_user_avatar?: string;
  unread_count?: string;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  actual_sender_id?: string;
  is_admin_override?: boolean;
  sender_name?: string;
  sender_avatar?: string;
  message_type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_message_id?: string;
  replied_message_content?: string;
  replied_message_sender_id?: string;
  reactions?: Reaction[];
}

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      return await apiGet<Conversation[]>('/chat');
    },
  });
};

export const useMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await apiGet<Message[]>(`/chat/${conversationId}/messages`);
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, reply_to_message_id, impersonate_as }: { content: string; reply_to_message_id?: string; impersonate_as?: string }) => {
      // apiPost returns { success, data, message }
      const res = await apiPost<Message>(`/chat/${conversationId}/messages`, { content, reply_to_message_id, impersonate_as });
      return res.data;
    },
    onSuccess: (newMessage) => {
      // Optimistically append message
      queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
        if (!old) return [newMessage];
        const exists = old.find((m) => m.id === newMessage.id);
        if (exists) return old;
        return [newMessage, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useGetOrCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId?: string) => {
      const res = await apiPost<{ id: string }>('/chat', targetUserId ? { targetUserId } : {});
      return res.data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useToggleReaction = (conversationId: string) => {
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      await apiPost(`/chat/${conversationId}/messages/${messageId}/reaction`, { emoji });
    }
  });
};

export const useMarkAsRead = (conversationId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      await apiPost(`/chat/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
};

export const useToggleConversationApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, is_approved }: { conversationId: string; is_approved?: boolean }) => {
      const res = await apiPost<{ id: string; is_approved_for_recipient: boolean }>(`/chat/${conversationId}/approval`, { is_approved });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
};

export const useChatSettings = () => {
  return useQuery({
    queryKey: ['chat-settings'],
    queryFn: async () => {
      return await apiGet<{ auto_approve_p2p_chat: boolean }>('/chat/settings');
    },
  });
};

export const useUpdateChatSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { auto_approve_p2p_chat: boolean }) => {
      const res = await apiPost<{ auto_approve_p2p_chat: boolean }>('/chat/settings', settings);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
    }
  });
};
