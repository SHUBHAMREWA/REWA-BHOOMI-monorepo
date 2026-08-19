import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export interface Conversation {
  id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  user_name?: string;
  user_email?: string;
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
    mutationFn: async ({ content, reply_to_message_id }: { content: string; reply_to_message_id?: string }) => {
      // apiPost returns { success, data, message }
      const res = await apiPost<Message>(`/chat/${conversationId}/messages`, { content, reply_to_message_id });
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
