import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import EmptyState from '@/components/shared/EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
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
  pageSize?: number;
  showPagination?: boolean;
  ariaLabel?: string;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  stickyHeader?: boolean;
}

export default function Table<T = Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  isLoading,
  mobileCardRenderer,
  pageSize = 0,
  showPagination = false,
  ariaLabel = 'Tabel data',
  selectedRows,
  onSelectionChange,
  stickyHeader = false,
}: TableProps<T>) {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(String(bVal)) : Number(aVal) - Number(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const isSelectionMode = !!onSelectionChange;
  const allSelected = sortedData.length > 0 && selectedRows && sortedData.every((row) => selectedRows.has(keyExtractor(row)));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const all = new Set(sortedData.map((row) => keyExtractor(row)));
      onSelectionChange(all);
    }
  };

  const toggleRow = (row: T) => {
    if (!onSelectionChange || !selectedRows) return;
    const key = keyExtractor(row);
    const next = new Set(selectedRows);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const selectionColumn: Column<T> = {
    key: '_selection',
    header: '',
    className: 'w-10',
    render: (row: T) => (
      <input
        type="checkbox"
        checked={selectedRows?.has(keyExtractor(row)) || false}
        onChange={() => toggleRow(row)}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        aria-label={`Pilih ${keyExtractor(row)}`}
      />
    ),
  };

  const displayColumns = isSelectionMode ? [selectionColumn, ...columns] : columns;

  const totalPages = showPagination && pageSize > 0 ? Math.ceil(sortedData.length / pageSize) : 1;
  const pagedData = showPagination && pageSize > 0 ? sortedData.slice(page * pageSize, (page + 1) * pageSize) : sortedData;

  const handleSort = (col: Column<T>) => {
    const key = col.sortKey || col.key;
    if (!col.sortable) return;
    setSortKey((prev) => (prev === key && sortDir === 'asc' ? null : key));
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(0);
  };

  const getSortIcon = (col: Column<T>) => {
    const key = col.sortKey || col.key;
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'expand_less' : 'expand_more';
  };

  const getSortLabel = (col: Column<T>) => {
    const key = col.sortKey || col.key;
    if (sortKey !== key) return `Urutkan ${col.header}`;
    return `Urut ${sortDir === 'asc' ? 'menaik' : 'menurun'} untuk ${col.header}`;
  };

  if (isLoading) {
    return isMobile ? (
      <div className="space-y-3" role="status" aria-label="Memuat data">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-border/60 rounded-2xl p-4 space-y-3 shadow-card">
            {columns.filter(c => !c.hideOnMobile).map((col) => (
              <div key={col.key}>
                <div className="h-3 w-20 bg-surface-container-high rounded-lg skeleton mb-1.5"></div>
                <div className="h-4 w-3/4 bg-surface-container-high rounded-lg skeleton"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label={ariaLabel} role="table">
          <thead>
            <tr className="bg-surface-container-low border-b border-border/60">
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded-lg skeleton w-3/4"></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (pagedData.length === 0) {
    return (
      <div className="py-8">
        {emptyState || (
          <EmptyState
            icon="search_off"
            title="Tidak ada data"
            description="Belum ada data untuk ditampilkan."
          />
        )}
      </div>
    );
  }

  if (isMobile && mobileCardRenderer) {
    return (
      <div className="space-y-3" role="list" aria-label={ariaLabel}>
        {pagedData.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={`bg-white border border-border/60 rounded-2xl overflow-hidden shadow-card ${onRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
            role="listitem"
          >
            {mobileCardRenderer(row)}
          </div>
        ))}
        {showPagination && totalPages > 1 && renderPagination()}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label={ariaLabel} role="table">
          <thead>
            <tr className={`bg-surface-container-low border-b border-border/60 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key === '_selection' ? toggleSelectAll() : handleSort(col)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (col.key === '_selection') toggleSelectAll(); else handleSort(col); } }}
                  tabIndex={col.key === '_selection' ? 0 : col.sortable ? 0 : undefined}
                  role={col.key === '_selection' ? 'checkbox' : (col.sortable ? 'columnheader button' : 'columnheader')}
                  aria-checked={col.key === '_selection' ? allSelected : undefined}
                  aria-sort={col.key !== '_selection' && sortKey === (col.sortKey || col.key) ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={col.key === '_selection' ? 'Pilih semua' : getSortLabel(col)}
                  className={`px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider ${col.key === '_selection' ? 'cursor-pointer' : col.sortable ? 'cursor-pointer hover:text-primary select-none' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.key === '_selection' ? (
                      <input
                        type="checkbox"
                        checked={allSelected || false}
                        onChange={toggleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        aria-label="Pilih semua"
                      />
                    ) : (
                      <>
                        {col.header}
                        {col.sortable && (
                          <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon(col)}</span>
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pagedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-surface-container-low'} transition-colors`}
              >
                {displayColumns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && totalPages > 1 && renderPagination()}
    </div>
  );

  function renderPagination() {
    return (
      <nav className="flex items-center justify-between px-2 py-3 border-t border-border/60" aria-label="Navigasi halaman">
        <span className="text-xs text-secondary">
          {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} dari {sortedData.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-xl hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-secondary transition-colors"
            aria-label="Halaman sebelumnya"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 2, totalPages - 5));
            const p = start + i;
            if (p >= totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-xl text-xs font-semibold transition-colors ${p === page ? 'bg-primary text-white' : 'text-secondary hover:bg-surface-container'}`}
                aria-label={`Halaman ${p + 1}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-xl hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-secondary transition-colors"
            aria-label="Halaman selanjutnya"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </nav>
    );
  }
}
