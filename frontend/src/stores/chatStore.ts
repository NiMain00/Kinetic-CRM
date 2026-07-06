import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterDataService } from '@/services/master-data';
import type { ChatMessage, ChatUser, ChatState } from '@/types/chat';

interface ChatStore extends Omit<ChatState, 'addMessage'> {
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt' | 'readBy'>) => Promise<void>;
  loading: boolean;
  fetchMessages: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: {},
      users: [],
      typingUsers: {},
      loading: false,

      fetchMessages: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('chatMessages');
          if (res.data?.data) {
            const messages = res.data.data as unknown as Record<string, ChatMessage[]>;
            set({ messages, loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      addMessage: async (projectId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}`,
          readBy: [message.senderId],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await masterDataService.create('chatMessages', newMessage as unknown as Record<string, unknown>);
        } catch {
          // non-blocking
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [projectId]: [...(state.messages[projectId] || []), newMessage],
          },
        }));
      },

      getMessages: (projectId) => {
        return get().messages[projectId] || [];
      },

      markAsRead: (projectId, messageId, userId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [projectId]: (state.messages[projectId] || []).map((msg) =>
              msg.id === messageId && !msg.readBy.includes(userId)
                ? { ...msg, readBy: [...msg.readBy, userId] }
                : msg
            ),
          },
        }));
      },

      getUnreadCount: (projectId, userId) => {
        const messages = get().messages[projectId] || [];
        return messages.filter((msg) => msg.senderId !== userId && !msg.readBy.includes(userId)).length;
      },

      setTyping: (projectId, userId, isTyping) => {
        set((state) => {
          const currentTyping = state.typingUsers[projectId] || [];
          const newTyping = isTyping
            ? [...new Set([...currentTyping, userId])]
            : currentTyping.filter((id) => id !== userId);
          return {
            typingUsers: {
              ...state.typingUsers,
              [projectId]: newTyping,
            },
          };
        });
      },

      getUsers: () => {
        return get().users;
      },
    }),
    {
      name: 'kinetic-chat',
      version: 2,
      partialize: (state) => ({
        messages: state.messages,
        users: state.users,
        typingUsers: state.typingUsers,
      }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { messages: current.messages || {}, users: current.users || [], typingUsers: current.typingUsers || {} };
      },
    },
  ),
);
