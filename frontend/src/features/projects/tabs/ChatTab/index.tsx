import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Users, Hash, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '@/types/domain';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import ChatMessageItem from './components/ChatMessageItem';
import ChatInput from './components/ChatInput';
import ChatMembersPanel from './components/ChatMembersPanel';

interface ChatTabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ChatTab({ project }: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const authUser = useAuthStore((s) => s.user);

  const currentUser = {
    id: authUser?.id || '2',
    name: authUser?.fullName || authUser?.name || 'User',
    role: authUser?.roleName || 'Staff',
  };

  const projectId = project?.id || '1';

  const messages = useChatStore((s) => s.getMessages(projectId));
  const users = useChatStore((s) => s.getUsers());
  const addMessage = useChatStore((s) => s.addMessage);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const typingUsers = useChatStore((s) => s.typingUsers[projectId] || []);

  const typingUserNames = useMemo(
    () => typingUsers.filter((id) => id !== currentUser.id).map((id) => users.find((u) => u.id === id)?.name || ''),
    [typingUsers, users]
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isInitialLoad) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      const timer = setTimeout(() => setIsInitialLoad(false), 500);
      return () => clearTimeout(timer);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isInitialLoad]);

  // Mark messages as read on mount / when messages change
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id)) {
        markAsRead(projectId, msg.id, currentUser.id);
      }
    });
  }, [messages, projectId, markAsRead]);

  const handleSendMessage = useCallback((content: string) => {
    addMessage(projectId, {
      projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content,
      messageType: 'text',
      mentions: [],
    });
  }, [projectId, addMessage]);

  const handleFileUpload = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const maxSizeMB = 10;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    addMessage(projectId, {
      projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: `Mengirim file: ${file.name}`,
      messageType: isImage ? 'image' : 'file',
      fileUrl: '#',
      fileName: file.name,
      fileSize: file.size,
      mentions: [],
    });

    toast.success(`File "${file.name}" berhasil dikirim`);
  }, [projectId, addMessage]);

  const handleTyping = useCallback((_isTyping: boolean) => {
    // In production, this would broadcast typing status via WebSocket
  }, []);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  }, [messages]);

  return (
    <div className="flex h-full min-h-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Channel Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                Diskusi Project
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {messages.length} pesan
                </span>
              </h3>
              <p className="text-[11px] text-outline truncate max-w-md">
                {project?.code} — {project?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Online count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-variant text-[11px] text-outline mr-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/300" />
              {users.filter((u) => u.isOnline).length} online
            </div>
            <button
              onClick={() => setShowMembers((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers
                  ? 'bg-primary/10 text-primary'
                  : 'text-outline hover:text-on-surface hover:bg-surface-variant'
              }`}
              title="Toggle anggota"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 py-4 bg-background"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
              <h4 className="font-semibold text-on-surface mb-1">Belum ada pesan</h4>
              <p className="text-sm text-outline max-w-xs">
                Mulai diskusi tentang project ini dengan mengirim pesan pertama di bawah.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-0">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-outline-variant" />
                    <span className="text-[10px] font-semibold text-outline uppercase tracking-wider bg-background px-2 py-0.5 rounded-full border border-outline-variant">
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-outline-variant" />
                  </div>

                  {/* Messages */}
                  {group.messages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                    const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                    return (
                      <ChatMessageItem
                        key={msg.id}
                        message={msg}
                        isOwnMessage={msg.senderId === currentUser.id}
                        showSender={showSender}
                        currentUserId={currentUser.id}
                      />
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onFileUpload={handleFileUpload}
          users={users}
          currentUserId={currentUser.id}
        />
      </div>

      {/* Members Panel */}
      <ChatMembersPanel
        users={users}
        currentUserId={currentUser.id}
        typingUserNames={typingUserNames}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
