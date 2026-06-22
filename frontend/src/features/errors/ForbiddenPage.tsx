import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-danger/20">403</div>
        <div className="space-y-2">
          <h2 className="font-display-title text-display-title text-on-surface">Akses Ditolak</h2>
          <p className="text-secondary font-body-main">
            Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.
            Silakan hubungi administrator jika Anda memerlukan akses.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-border rounded-lg font-label-sm text-sm text-secondary hover:bg-surface-container-high transition-all"
          >
            Kembali
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-sm text-sm hover:bg-primary-container transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
