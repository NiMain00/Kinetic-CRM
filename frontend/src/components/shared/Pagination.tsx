import React from 'react';
import { Button } from '@/components/ui';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-border">
      <span className="text-xs text-outline">Halaman {currentPage} dari {totalPages}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          leftIcon={<span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_left</span>}
          aria-label="Halaman sebelumnya"
        >
          Sebelumnya
        </Button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
              page === currentPage
                ? 'bg-primary text-on-primary'
                : 'text-secondary hover:bg-surface-container-high'
            }`}
            aria-label={`Halaman ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          rightIcon={<span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>}
          aria-label="Halaman selanjutnya"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
