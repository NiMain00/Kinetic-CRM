import { useEffect } from 'react';
import { useMentionAutocomplete, type MentionUser } from '@/hooks/useMentionAutocomplete';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AtSign } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionUser[];
  currentUserId: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function MentionTextarea({
  value,
  onChange,
  users,
  currentUserId,
  placeholder,
  rows = 3,
  className = '',
  disabled,
  'aria-label': ariaLabel,
}: MentionTextareaProps) {
  const {
    showMentions,
    mentionIndex,
    filteredUsers,
    setMentionIndex,
    setShowMentions,
    detectMention,
    insertMention,
    handleKeyDown,
    textareaRef,
  } = useMentionAutocomplete(users, currentUserId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const debouncedValue = useDebouncedValue(value, 300);

  useEffect(() => {
    detectMention(debouncedValue);
  }, [debouncedValue, detectMention]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const consumed = handleKeyDown(e, value, (newText) => {
      onChange(newText);
      textareaRef.current?.focus();
    });
    if (consumed) return;
  };

  const onInsert = (user: MentionUser) => {
    const newText = insertMention(value, user);
    onChange(newText);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full border border-border rounded-lg text-sm p-3 outline-none focus:ring-1 focus:ring-primary resize-none ${className}`}
      />
      <button
        type="button"
        onClick={() => {
          const newValue = value + '@';
          onChange(newValue);
          setShowMentions(true);
          textareaRef.current?.focus();
        }}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors"
        title="Mention pengguna"
        tabIndex={-1}
      >
        <AtSign className="w-4 h-4" />
      </button>

      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-outline uppercase tracking-wider border-b border-outline-variant">
            Mention pengguna
          </div>
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${index === mentionIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant'}
              `}
              onClick={() => onInsert(user)}
              onMouseEnter={() => setMentionIndex(index)}
            >
              <div className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                {user.role && (
                  <p className="text-[11px] text-outline">{user.role}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
