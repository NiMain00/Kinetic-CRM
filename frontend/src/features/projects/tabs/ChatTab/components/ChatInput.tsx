import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, AtSign } from 'lucide-react';
import type { ChatUser } from '@/types/chat';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => void;
  users: ChatUser[];
  currentUserId: string;
}

export default function ChatInput({ onSendMessage, onTyping, onFileUpload, users, currentUserId }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = useCallback((value: string) => {
    setText(value);

    // Typing indicator
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);

    // Detect @mention trigger
    const cursorPos = value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show if there's no space before cursor after @ (or just started typing after @)
      if (!textAfterAt.includes('\n') && lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ' || textBeforeCursor[lastAtIndex - 1] === '\n') {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, [onTyping]);

  const insertMention = useCallback((user: ChatUser) => {
    const lastAtIndex = text.lastIndexOf('@');
    const beforeAt = text.slice(0, lastAtIndex);
    const newText = `${beforeAt}@${user.name} `;
    setText(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  }, [text]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [showMentions, filteredUsers, mentionIndex, insertMention]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
    onTyping(false);
  }, [text, onSendMessage, onTyping]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  }, [onFileUpload]);

  return (
    <div className="relative border-t border-outline-variant bg-surface px-4 py-3">
      {/* Mention autocomplete popup */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 text-[10px] font-semibold text-outline uppercase tracking-wider border-b border-outline-variant">
            Mention pengguna
          </div>
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${index === mentionIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant'}
              `}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setMentionIndex(index)}
            >
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                <p className="text-[11px] text-outline">{user.role}</p>
              </div>
              {user.isOnline && (
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors"
          title="Upload file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          onChange={handleFileSelect}
        />

        {/* Mention button */}
        <button
          onClick={() => {
            setText((prev) => prev + '@');
            setShowMentions(true);
            setMentionQuery('');
            textareaRef.current?.focus();
          }}
          className="flex-shrink-0 p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors"
          title="Mention pengguna"
        >
          <AtSign className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
            rows={1}
            className="w-full resize-none rounded-xl border border-outline-variant bg-surface-variant px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all
            ${text.trim()
              ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm'
              : 'bg-surface-variant text-outline cursor-not-allowed'
            }
          `}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
