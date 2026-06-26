import React from 'react';
import { Table, type Column, Button } from '@/components/ui';

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
}

export default function DataTable<T extends Record<string, unknown>>({
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
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex items-center justify-end">
          <Button variant="primary" size="sm" onClick={onAdd} leftIcon={<span className="material-symbols-outlined text-sm">add</span>}>
            {addLabel}
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        onRowClick={onRowClick}
        emptyState={emptyState}
        isLoading={isLoading}
        mobileCardRenderer={mobileCardRenderer}
        pageSize={pageSize}
        showPagination={showPagination}
      />
    </div>
  );
}
