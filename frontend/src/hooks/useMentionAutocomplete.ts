import { useState, useEffect, useRef, useCallback } from 'react';

export interface MentionUser {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface UseMentionAutocompleteReturn {
  showMentions: boolean;
  mentionQuery: string;
  mentionIndex: number;
  filteredUsers: MentionUser[];
  setMentionIndex: (index: number) => void;
  setShowMentions: (show: boolean) => void;
  detectMention: (value: string) => void;
  insertMention: (value: string, user: MentionUser) => string;
  handleKeyDown: (
    e: React.KeyboardEvent,
    currentText: string,
    onInsert: (newText: string) => void,
  ) => boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useMentionAutocomplete(
  users: MentionUser[],
  currentUserId: string,
): UseMentionAutocompleteReturn {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  useEffect(() => {
    if (showMentions && filteredUsers.length === 0) {
      setShowMentions(false);
    }
  }, [filteredUsers.length, showMentions]);

  const detectMention = useCallback((value: string) => {
    const cursorPos = value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const isTrigger =
        lastAtIndex === 0 ||
        textBeforeCursor[lastAtIndex - 1] === ' ' ||
        textBeforeCursor[lastAtIndex - 1] === '\n';

      if (isTrigger && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, []);

  const insertMention = useCallback((value: string, user: MentionUser) => {
    const lastAtIndex = value.lastIndexOf('@');
    const beforeAt = value.slice(0, lastAtIndex);
    const newText = `${beforeAt}@${user.name} `;
    setShowMentions(false);
    return newText;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentText: string, onInsert: (newText: string) => void) => {
      if (showMentions && filteredUsers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
          return true;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex(
            (prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length,
          );
          return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const newText = insertMention(currentText, filteredUsers[mentionIndex]);
          onInsert(newText);
          return true;
        }
        if (e.key === 'Escape') {
          setShowMentions(false);
          return true;
        }
      }
      return false;
    },
    [showMentions, filteredUsers, mentionIndex, insertMention],
  );

  return {
    showMentions,
    mentionQuery,
    mentionIndex,
    filteredUsers,
    setMentionIndex,
    setShowMentions,
    detectMention,
    insertMention,
    handleKeyDown,
    textareaRef,
  };
}
