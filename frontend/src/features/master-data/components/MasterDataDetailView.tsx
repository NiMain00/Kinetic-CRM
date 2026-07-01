import React, { useState, useMemo } from 'react';
import DataTable from '@/components/shared/DataTable';
import type { MasterDataEntry } from './masterDataConfig';

interface DetailViewProps {
  config: MasterDataEntry;
  data: Record<string, unknown>[];
}

export default function MasterDataDetailView({ config, data }: DetailViewProps) {
  const [search, setSearch] = useState('');

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const sample = data[0];
    return Object.keys(sample)
      .filter((key) => !['id', 'roleColor', 'avatarColor', 'actionColor', 'userInitials'].includes(key))
      .slice(0, 8)
      .map((key) => ({
        key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sortable: typeof sample[key] !== 'object',
        render: (row: Record<string, unknown>) => {
          const val = row[key];
          if (val === null || val === undefined) return <span className="text-outline/40">-</span>;
          if (typeof val === 'boolean') {
            return (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${val ? 'text-success' : 'text-outline'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-success' : 'bg-outline'}`} />
                {val ? 'Aktif' : 'Nonaktif'}
              </span>
            );
          }
          if (typeof val === 'object') {
            return <span className="text-outline text-[10px]">{JSON.stringify(val).slice(0, 40)}</span>;
          }
          const str = String(val);
          if (str.startsWith('#') && str.length === 7) {
            return (
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded border" style={{ backgroundColor: str }} />
                <span className="text-[10px] font-mono text-outline">{str}</span>
              </span>
            );
          }
          return <span className="text-on-surface text-xs">{str}</span>;
        },
      }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div className="bg-surface-container-lowest border border-border/50 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-60">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Cari data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-surface-container-low border border-border/60 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <span className="text-[11px] text-outline font-medium">{filtered.length} data</span>
        </div>
      </div>
      <div>
        {columns.length > 0 ? (
          <DataTable
            columns={columns as any}
            data={filtered as any}
            keyExtractor={(row: any) => row.id}
            pageSize={10}
            showPagination
            exportable
            exportFilename={`master-${config.id}`}
          />
        ) : (
          <div className="text-center py-12 text-outline text-xs italic">Tidak ada data untuk ditampilkan.</div>
        )}
      </div>
    </div>
  );
}
