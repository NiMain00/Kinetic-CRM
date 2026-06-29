export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | undefined | null;
}

export function exportCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        const str = val == null ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
