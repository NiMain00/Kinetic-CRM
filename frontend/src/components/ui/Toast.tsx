import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error';
  open: boolean;
  onClose?: () => void;
}

const icons = {
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

const colors = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
};

export default function Toast({ message, type = 'success', open, onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-10 right-10 flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl bg-inverse-surface text-on-primary cursor-pointer select-none transition-all duration-300 z-[100] ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      role="alert"
      aria-live="polite"
    >
      <span className={`material-symbols-outlined text-2xl font-bold ${colors[type]}`}>{icons[type]}</span>
      <span className="font-label-sm text-sm font-medium">{message}</span>
    </div>
  );
}
