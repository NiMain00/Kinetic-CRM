import { Users, Circle, MessageSquare, X } from 'lucide-react';
import type { ChatUser } from '@/types/chat';

interface ChatMembersPanelProps {
  users: ChatUser[];
  currentUserId: string;
  typingUserNames: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatMembersPanel({ users, currentUserId, typingUserNames, isOpen, onClose }: ChatMembersPanelProps) {
  if (!isOpen) return null;

  const onlineUsers = users.filter((u) => u.isOnline);
  const offlineUsers = users.filter((u) => !u.isOnline);

  const roleColors: Record<string, string> = {
    'PM': 'text-blue-600 dark:text-blue-400',
    'Branch Manager': 'text-emerald-600 dark:text-emerald-400',
    'Procurement': 'text-amber-600 dark:text-amber-400',
    'Admin': 'text-purple-600 dark:text-purple-400',
    'Staff': 'text-gray-600 dark:text-gray-400',
    'Management': 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="w-64 border-l border-outline-variant bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">Anggota</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant transition-colors lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Online */}
        <div>
          <p className="text-[10px] font-semibold text-outline uppercase tracking-wider mb-2 px-1">
            Online — {onlineUsers.length}
          </p>
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors
                ${user.id === currentUserId ? 'bg-primary/5' : 'hover:bg-surface-variant'}
              `}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {user.name.charAt(0)}
                </div>
                <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-emerald-500 text-emerald-500 bg-surface rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-on-surface truncate">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="text-outline"> (Anda)</span>
                  )}
                </p>
                <p className={`text-[10px] ${roleColors[user.role] || 'text-outline'}`}>{user.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Offline */}
        {offlineUsers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-outline uppercase tracking-wider mb-2 px-1">
              Offline — {offlineUsers.length}
            </p>
            {offlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg opacity-60"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-semibold text-outline">
                    {user.name.charAt(0)}
                  </div>
                  <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-gray-400 text-gray-400 bg-surface rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-on-surface truncate">{user.name}</p>
                  <p className="text-[10px] text-outline">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {typingUserNames.length > 0 && (
        <div className="px-4 py-2.5 border-t border-outline-variant bg-surface-variant/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-primary animate-pulse" />
            <p className="text-[11px] text-outline truncate">
              {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'sedang mengetik...' : 'sedang mengetik...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
