import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-outline/20">404</div>
        <div className="space-y-2">
          <h2 className="font-display-title text-display-title text-on-surface">Halaman Tidak Ditemukan</h2>
          <p className="text-secondary font-body-main">
            Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
            Periksa kembali URL atau navigasi melalui menu.
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
