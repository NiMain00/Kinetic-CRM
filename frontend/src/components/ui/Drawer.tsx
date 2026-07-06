import React, { useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const focusTrapRef = useFocusTrap(isOpen);

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
        ref={focusTrapRef}
        onClick={(e) => e.stopPropagation()}
        className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-full sm:w-auto ${width} bg-surface shadow-elevated flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
      >
        {title && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/60 flex items-center justify-between bg-surface">
            <div className="min-w-0">
              <h3 className="font-heading-section text-sm sm:text-base text-on-surface truncate">{title}</h3>
              {subtitle && <p className="text-xs text-outline mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors touch-min shrink-0 ml-2" aria-label="Tutup panel">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/60 bg-surface-container-low flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
