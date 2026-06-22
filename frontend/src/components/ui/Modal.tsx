import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 id="modal-title" className="font-heading-section text-base text-on-surface">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors" aria-label="Close modal">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border bg-surface-container-low flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
