export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mentions: string[]; // user IDs that are mentioned
  readBy: string[]; // user IDs who have read this message
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
}

export interface ChatState {
  messages: Record<string, ChatMessage[]>; // projectId → messages
  users: ChatUser[];
  typingUsers: Record<string, string[]>; // projectId → user IDs typing

  // Actions
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt' | 'readBy'>) => void;
  getMessages: (projectId: string) => ChatMessage[];
  markAsRead: (projectId: string, messageId: string, userId: string) => void;
  getUnreadCount: (projectId: string, userId: string) => number;
  setTyping: (projectId: string, userId: string, isTyping: boolean) => void;
  getUsers: () => ChatUser[];
}
