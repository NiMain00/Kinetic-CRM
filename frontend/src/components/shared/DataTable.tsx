import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Table, type Column, Button } from '@/components/ui';
import BulkActions from '@/components/shared/BulkActions';

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  mobileCardRenderer?: (row: T) => React.ReactNode;
  pageSize?: number;
  showPagination?: boolean;
  // Row selection
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  // Bulk actions
  onBatchDelete?: () => void;
  onBatchUpdate?: () => void;
  onBatchExport?: () => void;
  // Sticky header
  stickyHeader?: boolean;
  // Column visibility
  hideableColumns?: boolean;
  // CSV export
  exportable?: boolean;
  exportFilename?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  isLoading,
  onAdd,
  addLabel = 'Tambah',
  mobileCardRenderer,
  pageSize = 0,
  showPagination = false,
  selectedRows,
  onSelectionChange,
  onBatchDelete,
  onBatchUpdate,
  onBatchExport,
  stickyHeader = false,
  hideableColumns = false,
  exportable = false,
  exportFilename = 'export-data',
}: DataTableProps<T>) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set(columns.map((c) => c.key)));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    if (showColumnMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnMenu]);

  const visibleColumns = useMemo(() => {
    if (!hideableColumns) return columns;
    return columns.filter((c) => visibleKeys.has(c.key));
  }, [columns, visibleKeys, hideableColumns]);

  const toggleColumn = (key: string) => {
    const next = new Set(visibleKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisibleKeys(next);
  };

  const exportCSV = () => {
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = col.render ? stripHtml(String(col.render(row) ?? '')) : String((row as Record<string, unknown>)[col.key] ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <BulkActions
        selectedCount={selectedRows?.size ?? 0}
        onClearSelection={() => onSelectionChange?.(new Set())}
        onBatchDelete={onBatchDelete}
        onBatchUpdate={onBatchUpdate}
        onBatchExport={onBatchExport}
      />
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          {exportable && data.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportCSV} leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}>
              Export CSV
            </Button>
          )}
          {hideableColumns && (
            <div className="relative" ref={menuRef}>
              <Button variant="ghost" size="sm" onClick={() => setShowColumnMenu(!showColumnMenu)} leftIcon={<span className="material-symbols-outlined text-[16px]">view_column</span>}>
                Kolom
              </Button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg p-2 min-w-45 z-20">
                  {columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-low rounded-lg cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={visibleKeys.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {onAdd && (
            <Button variant="primary" size="sm" onClick={onAdd} leftIcon={<span className="material-symbols-outlined text-sm">add</span>}>
              {addLabel}
            </Button>
          )}
        </div>
      </div>
      <Table
        columns={visibleColumns}
        data={data}
        keyExtractor={keyExtractor}
        onRowClick={onRowClick}
        emptyState={emptyState}
        isLoading={isLoading}
        mobileCardRenderer={mobileCardRenderer}
        pageSize={pageSize}
        showPagination={showPagination}
        selectedRows={selectedRows}
        onSelectionChange={onSelectionChange}
        stickyHeader={stickyHeader}
      />
    </div>
  );
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
