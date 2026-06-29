import { useEffect, useCallback, useRef } from 'react';

interface ShortcutMap {
  /** Navigate to a path */
  navigate?: (path: string) => void;
  /** Trigger create action on current page */
  onCreate?: () => void;
  /** Focus the search input */
  onSearchFocus?: () => void;
  /** Toggle the help modal */
  onToggleHelp?: () => void;
  /** Close current modal/drawer */
  onClose?: () => void;
}

export default function useKeyboardShortcuts({
  navigate,
  onCreate,
  onSearchFocus,
  onToggleHelp,
  onClose,
}: ShortcutMap) {
  const bufferRef = useRef<string>('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Escape — always works
      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        onClose?.();
        bufferRef.current = '';
        return;
      }

      // Shift + ? — toggle help
      if (e.key === '?' && e.shiftKey && !isInput) {
        e.preventDefault();
        onToggleHelp?.();
        bufferRef.current = '';
        return;
      }

      // Single-key shortcuts — only when not in input
      if (!isInput) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          onCreate?.();
          bufferRef.current = '';
          return;
        }

        if (e.key === '/') {
          e.preventDefault();
          onSearchFocus?.();
          bufferRef.current = '';
          return;
        }
      }

      // Multi-key sequence buffer (G + X)
      if (!isInput) {
        bufferRef.current += e.key.toLowerCase();

        // Check for complete sequences
        const seq = bufferRef.current;

        if (seq === 'gd') {
          e.preventDefault();
          navigate?.('/dashboard');
          bufferRef.current = '';
          return;
        }
        if (seq === 'gp') {
          e.preventDefault();
          navigate?.('/projects');
          bufferRef.current = '';
          return;
        }
        if (seq === 'gs') {
          e.preventDefault();
          navigate?.('/prospects');
          bufferRef.current = '';
          return;
        }
        if (seq === 'gm') {
          e.preventDefault();
          navigate?.('/master-data');
          bufferRef.current = '';
          return;
        }
        if (seq === 'ga') {
          e.preventDefault();
          navigate?.('/approvals');
          bufferRef.current = '';
          return;
        }

        // Reset buffer after a reasonable timeout (handled by useEffect)
      }
    },
    [navigate, onCreate, onSearchFocus, onToggleHelp, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
