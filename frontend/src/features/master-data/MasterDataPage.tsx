import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { masterDataConfig, masterDataCategories, MasterDataGrid, SearchMasterData, MasterDataDetailView } from './components';
import type { MasterDataEntry } from './components';

interface MasterDataViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

function getActiveCount(store: any, entry: MasterDataEntry): number | undefined {
  const data = (store as any)[entry.storeKey];
  if (!Array.isArray(data) || data.length === 0) return undefined;
  const sample = data[0];
  if ('is_active' in sample) {
    return data.filter((d: any) => d.is_active === true).length;
  }
  if ('active' in sample) {
    return data.filter((d: any) => d.active === true).length;
  }
  if ('status' in sample) {
    return data.filter((d: any) => d.status === true).length;
  }
  return undefined;
}

function StatChip({ icon, value, label, color = 'text-primary' }: { icon: string; value: number; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
      <span className={`material-symbols-outlined text-[13px] leading-none ${color}`}>{icon}</span>
      <span className="text-[11px] font-bold tabular-nums text-on-surface leading-tight">{value}</span>
      <span className="text-[9px] text-on-surface/60 font-medium leading-tight">{label}</span>
    </div>
  );
}

export default function MasterDataView(_props: MasterDataViewProps) {
  const navigate = useNavigate();
  const { entity } = useParams();
  const store = useMasterDataStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const getCount = useCallback((entry: MasterDataEntry) => {
    const data = (store as any)[entry.storeKey];
    return Array.isArray(data) ? data.length : 0;
  }, [store]);

  const totalRecords = useMemo(() => {
    return masterDataConfig.reduce((sum, e) => sum + getCount(e), 0);
  }, [getCount]);

  const filteredConfig = useMemo(() => {
    if (!debouncedSearch) return masterDataConfig;
    const q = debouncedSearch.toLowerCase();
    return masterDataConfig.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [debouncedSearch]);

  const handleCardClick = useCallback((entry: MasterDataEntry) => {
    if (entry.path) {
      navigate(entry.path);
    } else {
      navigate(`/master-data/${entry.id}`);
    }
  }, [navigate]);

  const handleResetSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (entity) {
    const entry = masterDataConfig.find((e) => e.id === entity);
    if (!entry || entry.path) {
      navigate('/master-data', { replace: true });
      return null;
    }
    const data = ((store as any)[entry.storeKey] || []) as Record<string, unknown>[];
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-xl border border-border/50 shadow-sm px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/master-data')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
            </button>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: entry.bgColor }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: entry.color }}>
                {entry.icon}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                {entry.name}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{data.length}</span>
              </h2>
            </div>
          </div>
        </div>
        <MasterDataDetailView config={entry} data={data} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border/50 shadow-sm px-5 py-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">layers</span>
          </div>
          <h2 className="text-sm font-bold text-on-surface">Master Data</h2>
          {searchQuery && (
            <span className="text-[9px] text-outline font-medium ml-auto">
              {filteredConfig.length} hasil
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchMasterData value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatChip icon="database" value={masterDataConfig.length} label="Master" />
            <StatChip icon="category" value={masterDataCategories.length} label="Ktg" />
            <StatChip icon="fact_check" value={totalRecords} label="Rec" />
          </div>
        </div>
      </div>
      <MasterDataGrid
        entries={filteredConfig}
        getCount={getCount}
        getActiveCount={(e) => getActiveCount(store, e) ?? 0}
        onCardClick={handleCardClick}
        onResetSearch={handleResetSearch}
        searchQuery={searchQuery}
      />
    </div>
  );
}
