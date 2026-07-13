import React from 'react';
import MasterDataCard from './MasterDataCard';
import { masterDataCategories, frequentMasterData } from './masterDataConfig';
import type { MasterDataEntry } from './masterDataConfig';

interface MasterDataGridProps {
  entries: MasterDataEntry[];
  getCount: (entry: MasterDataEntry) => number;
  getActiveCount?: (entry: MasterDataEntry) => number;
  onResetSearch: () => void;
  searchQuery?: string;
}

function getEntryPath(entry: MasterDataEntry): string {
  return entry.path || `/master-data/${entry.id}`;
}

function SectionCard({ entry, getCount, getActiveCount }: {
  entry: MasterDataEntry;
  getCount: (e: MasterDataEntry) => number;
  getActiveCount?: (e: MasterDataEntry) => number;
}) {
  return (
    <MasterDataCard
      key={entry.id}
      config={entry}
      count={getCount(entry)}
      activeCount={getActiveCount ? getActiveCount(entry) : undefined}
      to={getEntryPath(entry)}
    />
  );
}

function SectionGroup({ label, entries, getCount, getActiveCount }: {
  label: string;
  entries: MasterDataEntry[];
  getCount: (e: MasterDataEntry) => number;
  getActiveCount?: (e: MasterDataEntry) => number;
}) {
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, e) => sum + getCount(e), 0);
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full shrink-0 bg-gray-300 dark:bg-gray-600" />
        <h3 className="text-xs font-bold text-outline tracking-wide">{label}</h3>
        <div className="flex-1 border-t border-border/30" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined text-[10px] leading-none">database</span>
          {total} Records
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <SectionCard key={entry.id} entry={entry} getCount={getCount} getActiveCount={getActiveCount} />
        ))}
      </div>
    </div>
  );
}

export default function MasterDataGrid({ entries, getCount, getActiveCount, onResetSearch, searchQuery }: MasterDataGridProps) {
  const isSearching = !!searchQuery;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-xl border border-border/50 shadow-sm">
        <span className="material-symbols-outlined text-5xl text-outline/20 mb-3">search_off</span>
        <p className="text-sm font-bold text-outline">Tidak ditemukan master data</p>
        <p className="text-[11px] text-outline/50 mt-1 mb-4">Coba gunakan kata kunci pencarian yang berbeda.</p>
        <button
          onClick={onResetSearch}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm leading-none">close</span>
          Reset Pencarian
        </button>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <SectionCard key={entry.id} entry={entry} getCount={getCount} getActiveCount={getActiveCount} />
        ))}
      </div>
    );
  }

  const frequent = frequentMasterData.filter((e) => getCount(e) > 0);
  const frequentTotal = frequent.reduce((sum, e) => sum + getCount(e), 0);

  return (
    <div className="space-y-6">
      {frequent.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-sm text-green-600 shrink-0">star</span>
            <h3 className="text-xs font-bold text-outline tracking-wide">Sering Digunakan</h3>
            <div className="flex-1 border-t border-border/30" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-[10px] leading-none">database</span>
              {frequentTotal} Records
            </span>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${frequent.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {frequent.map((entry) => (
              <SectionCard key={entry.id} entry={entry} getCount={getCount} getActiveCount={getActiveCount} />
            ))}
          </div>
        </div>
      )}

      {masterDataCategories.map((cat) => {
        const catEntries = cat.entries.filter((e) => !e.isFrequent || getCount(e) === 0);
        if (catEntries.length === 0) return null;
        return (
            <SectionGroup
              key={cat.key}
              label={cat.label}
              entries={catEntries}
              getCount={getCount}
              getActiveCount={getActiveCount}
            />
        );
      })}
    </div>
  );
}
