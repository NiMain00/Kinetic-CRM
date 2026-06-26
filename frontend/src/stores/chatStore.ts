import { create } from 'zustand';
import type { ChatMessage, ChatUser, ChatState } from '@/types/chat';

// Demo users
const DEMO_USERS: ChatUser[] = [
  { id: '1', name: 'Budi Santoso', role: 'PM', avatar: undefined, isOnline: true },
  { id: '2', name: 'Andi Cahyadi', role: 'Branch Manager', avatar: undefined, isOnline: true },
  { id: '3', name: 'Siti Rahmawati', role: 'Procurement', avatar: undefined, isOnline: false },
  { id: '4', name: 'Rudi Hartono', role: 'Staff', avatar: undefined, isOnline: false },
  { id: '5', name: 'Dewi Lestari', role: 'Admin', avatar: undefined, isOnline: true },
];

// Demo messages for project 1
const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'msg-1',
      projectId: '1',
      senderId: '1',
      senderName: 'Budi Santoso',
      senderRole: 'PM',
      content: 'Halo tim, project Pemasangan AC Central sudah masuk fase Review RKS. Mohon dicek dokumen RKS-nya.',
      messageType: 'text',
      mentions: [],
      readBy: ['1', '2', '3'],
      createdAt: new Date('2026-06-25T09:00:00'),
      updatedAt: new Date('2026-06-25T09:00:00'),
    },
    {
      id: 'msg-2',
      projectId: '1',
      senderId: '2',
      senderName: 'Andi Cahyadi',
      senderRole: 'Branch Manager',
      content: 'Baik Pak Budi, saya sudah cek. Ada beberapa catatan untuk item material AC.',
      messageType: 'text',
      mentions: [],
      readBy: ['1', '2'],
      createdAt: new Date('2026-06-25T09:15:00'),
      updatedAt: new Date('2026-06-25T09:15:00'),
    },
    {
      id: 'msg-3',
      projectId: '1',
      senderId: '3',
      senderName: 'Siti Rahmawati',
      senderRole: 'Procurement',
      content: '@Budi Santoso @Andi Cahyadi Untuk harga material, saya sudah dapat 3 penawaran dari vendor. Nanti saya share ya.',
      messageType: 'text',
      mentions: ['1', '2'],
      readBy: ['1', '2', '3'],
      createdAt: new Date('2026-06-25T09:30:00'),
      updatedAt: new Date('2026-06-25T09:30:00'),
    },
    {
      id: 'msg-4',
      projectId: '1',
      senderId: '3',
      senderName: 'Siti Rahmawati',
      senderRole: 'Procurement',
      content: 'Ini file penawaran dari vendor',
      messageType: 'file',
      fileUrl: '#',
      fileName: 'Penawaran_Vendor_AC_2026.pdf',
      fileSize: 245000,
      mentions: [],
      readBy: ['1', '3'],
      createdAt: new Date('2026-06-25T09:32:00'),
      updatedAt: new Date('2026-06-25T09:32:00'),
    },
    {
      id: 'msg-5',
      projectId: '1',
      senderId: '1',
      senderName: 'Budi Santoso',
      senderRole: 'PM',
      content: 'Terima kasih Siti. @Rudi Hartono tolong bantu review spesifikasi teknisnya ya.',
      messageType: 'text',
      mentions: ['4'],
      readBy: ['1', '2', '3'],
      createdAt: new Date('2026-06-25T10:00:00'),
      updatedAt: new Date('2026-06-25T10:00:00'),
    },
  ],
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: DEMO_MESSAGES,
  users: DEMO_USERS,
  typingUsers: {},

  addMessage: (projectId, message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      readBy: [message.senderId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
}));
