import React from 'react';
import { Link } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

interface FeatureBoundaryProps {
  children: React.ReactNode;
  name: string;
}

export default function FeatureBoundary({ children, name }: FeatureBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(onRetry) => (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="text-center space-y-4 max-w-md">
            <span className="material-symbols-outlined text-5xl text-danger">error</span>
            <h3 className="font-heading-section text-base text-on-surface">
              Galat di modul {name}
            </h3>
            <p className="text-sm text-secondary">
              Terjadi kesalahan yang tidak terduga pada halaman ini. Silakan coba lagi atau kembali ke dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 text-sm rounded-lg hover:bg-primary-light transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Coba Lagi
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 bg-surface text-on-surface border border-border px-4 py-2 text-sm rounded-lg hover:bg-surface-container transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
