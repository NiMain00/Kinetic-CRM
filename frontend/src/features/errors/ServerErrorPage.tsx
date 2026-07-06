import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-warning/20">500</div>
        <div className="space-y-2">
          <h2 className="font-display-title text-display-title text-on-surface">Kesalahan Server</h2>
          <p className="text-secondary font-body-main">
            Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa saat.
            Jika masalah berlanjut, hubungi tim IT.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 border border-border/60 rounded-xl font-label-sm text-sm text-secondary hover:bg-surface-container-high transition-all"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-sm text-sm hover:bg-primary-container transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
