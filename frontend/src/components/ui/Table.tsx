import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  mobileCardRenderer?: (row: T) => React.ReactNode;
}

export default function Table<T = Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  isLoading,
  mobileCardRenderer,
}: TableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return isMobile ? (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest border border-border rounded-xl p-4 space-y-3">
            {columns.filter(c => !c.hideOnMobile).map((col) => (
              <div key={col.key}>
                <div className="h-3 w-20 bg-surface-container-high rounded skeleton mb-1.5"></div>
                <div className="h-4 w-3/4 bg-surface-container-high rounded skeleton"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low border-b border-border">
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded skeleton w-3/4"></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-outline">
        {emptyState || (
          <div className="space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">info</span>
            <p className="text-sm">Tidak ada data</p>
          </div>
        )}
      </div>
    );
  }

  if (isMobile && mobileCardRenderer) {
    return (
      <div className="space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={`bg-surface-container-lowest border border-border rounded-xl overflow-hidden ${onRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
          >
            {mobileCardRenderer(row)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-surface-container-low border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className={`px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <span className="material-symbols-outlined text-[14px] text-outline">unfold_more</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-surface-container-low'} transition-colors`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
