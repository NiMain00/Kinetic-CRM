import type { ChatMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Download, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showSender: boolean;
  currentUserId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseContent(content: string): { type: 'text' | 'mention'; value: string }[] {
  const parts: { type: 'text' | 'mention'; value: string }[] = [];
  const mentionRegex = /@([A-Za-z\s]+?)(?=\s|$|[.,!?])/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: content }];
}

export default function ChatMessageItem({ message, isOwnMessage, showSender, currentUserId }: ChatMessageItemProps) {
  const hasBeenRead = message.readBy.length > 1;
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: id });

  const roleColors: Record<string, string> = {
    'PM': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Branch Manager': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Procurement': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Staff': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'Management': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  // Check if current user is mentioned in this message
  const isMentioned = message.content.includes(`@`) && !isOwnMessage;

  return (
    <div className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''} ${!showSender ? 'mt-0.5' : 'mt-4'}`}>
      {/* Avatar */}
      {showSender ? (
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
          ${isOwnMessage
            ? 'bg-primary text-on-primary'
            : 'bg-surface-variant text-on-surface-variant'
          }`}>
          {message.senderName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-9 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
        {/* Sender name + role badge */}
        {showSender && (
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-semibold text-on-surface">{message.senderName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[message.senderRole] || roleColors['Staff']}`}>
              {message.senderRole}
            </span>
            <span className="text-[10px] text-outline">{timeAgo}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
            ${isOwnMessage
              ? 'bg-primary text-on-primary rounded-tr-sm'
              : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'
            }
            ${isMentioned && !isOwnMessage ? 'ring-2 ring-primary/30' : ''}
          `}
        >
          {/* File attachment */}
          {message.messageType === 'file' && (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl mb-2
              ${isOwnMessage ? 'bg-primary/20' : 'bg-surface dark:bg-gray-700'}
            `}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                ${isOwnMessage ? 'bg-on-primary/20' : 'bg-primary/10'}
              `}>
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{message.fileName}</p>
                <p className="text-[10px] opacity-70">{formatFileSize(message.fileSize || 0)}</p>
              </div>
              <button className={`p-1.5 rounded-full hover:bg-primary/20 transition-colors`}>
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Image attachment */}
          {message.messageType === 'image' && (
            <div className="mb-2">
              <div className={`w-48 h-32 rounded-lg flex items-center justify-center
                ${isOwnMessage ? 'bg-on-primary/20' : 'bg-surface dark:bg-gray-700'}
              `}>
                <ImageIcon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )}

          {/* Text content with mentions highlighted */}
          <div className="whitespace-pre-wrap">
            {parseContent(message.content).map((part, i) =>
              part.type === 'mention' ? (
                <span key={i} className="font-semibold text-primary dark:text-primary-light bg-primary/10 px-1 rounded">
                  @{part.value}
                </span>
              ) : (
                <span key={i}>{part.value}</span>
              )
            )}
          </div>
        </div>

        {/* Time + read indicator (for own messages) */}
        {isOwnMessage && (
          <div className="flex items-center gap-1 mt-0.5">
            {!showSender && (
              <span className="text-[10px] text-outline">{timeAgo}</span>
            )}
            {hasBeenRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Check className="w-3.5 h-3.5 text-outline" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
