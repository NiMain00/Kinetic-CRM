import React, { useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  width = 'max-w-lg',
}: DrawerProps) {
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

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-full ${width} bg-surface-container-lowest shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-container-lowest">
            <div>
              <h3 className="font-heading-section text-base text-on-surface">{title}</h3>
              {subtitle && <p className="text-xs text-outline mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors" aria-label="Close drawer">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
