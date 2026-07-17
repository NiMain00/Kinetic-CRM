import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProspectStore } from '@/stores/prospectStore';
import { useCustomerStore } from '@/stores/customerStore';
import { PageContainer, PageHeader } from '@/components/shared';
import { prospectService } from '@/services/prospects';
import type { Prospect } from '@/types/domain';

type CustomerLevel = 'hot' | 'medium' | 'low';

interface LevelColumn {
  level: CustomerLevel;
  label: string;
  color: string;
  bgColor: string;
  headerBg: string;
  textColor: string;
}

const COLUMNS: LevelColumn[] = [
  {
    level: 'low',
    label: 'LOW',
    color: 'bg-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-900/50',
    headerBg: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
  },
  {
    level: 'medium',
    label: 'MEDIUM',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/50',
    headerBg: 'bg-amber-100 dark:bg-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    level: 'hot',
    label: 'HOT',
    color: 'bg-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/50',
    headerBg: 'bg-rose-100 dark:bg-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
];

const LEVEL_LABELS: Record<CustomerLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  hot: 'Hot',
};

const LEVEL_ORDER: Record<CustomerLevel, number> = { low: 0, medium: 1, hot: 2 };

export default function ProspectQualificationPage() {
  const navigate = useNavigate();
  const prospects = useProspectStore((s) => s.prospects);
  const loading = useProspectStore((s) => s.loading);
  const fetchProspects = useProspectStore((s) => s.fetchProspects);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      fetchProspects({ perPage: 100, page: 1 }).finally(() => setDataLoaded(true));
    }
  }, [dataLoaded, fetchProspects]);

  // Group prospects by customer level
  const grouped = useMemo(() => {
    const groups: Record<CustomerLevel, Prospect[]> = { low: [], medium: [], hot: [] };
    for (const p of prospects) {
      const level = p.customerData?.level as CustomerLevel | undefined;
      if (level && level in groups) {
        groups[level].push(p);
      }
    }
    return groups;
  }, [prospects]);

  const handlePromote = async (prospect: Prospect, targetLevel: CustomerLevel) => {
    if (!prospect.customerId) {
      toast.error('Prospek ini tidak memiliki data customer');
      return;
    }
    setPromoting(prospect.id);
    try {
      await prospectService.promote(prospect.id, targetLevel);
      await updateCustomer(prospect.customerId, { level: targetLevel });
      toast.success(`Level ${prospect.customerData?.name || prospect.client} dinaikkan ke ${LEVEL_LABELS[targetLevel]}`);
      // Refresh data
      await fetchProspects({ perPage: 100, page: 1 });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal promote level';
      toast.error(msg);
    } finally {
      setPromoting(null);
    }
  };

  const renderCard = (prospect: Prospect) => {
    const currentLevel = prospect.customerData?.level as CustomerLevel | undefined;
    const nextLevel: CustomerLevel | null =
      currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'hot' : null;

    return (
      <div
        key={prospect.id}
        className="bg-white dark:bg-surface rounded-xl border border-border/60 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
      >
        {/* Header: name + level badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-on-surface truncate">
              {prospect.customerData?.name || prospect.name}
            </h4>
            <p className="text-xs text-secondary truncate">{prospect.client}</p>
          </div>
          {currentLevel && (
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentLevel === 'hot'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                  : currentLevel === 'medium'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {LEVEL_LABELS[currentLevel]}
            </span>
          )}
        </div>

        {/* Info rows */}
        <div className="space-y-1 text-xs text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">source</span>
            {prospect.source || 'Manual'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            {prospect.date ? new Date(prospect.date).toLocaleDateString('id-ID') : '-'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">person</span>
            {prospect.author || '-'}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-1">
          {currentLevel === 'hot' ? (
            <button
              onClick={() => navigate(`/prospects/${prospect.id}`)}
              className="w-full px-3 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary-light transition-colors"
            >
              Kelola di CRM
            </button>
          ) : nextLevel ? (
            <button
              onClick={() => handlePromote(prospect, nextLevel)}
              disabled={promoting === prospect.id}
              className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                nextLevel === 'medium'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {promoting === prospect.id ? 'Memproses...' : `Naikkan ke ${LEVEL_LABELS[nextLevel]}`}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderColumn = (col: LevelColumn) => {
    const items = grouped[col.level];
    return (
      <div
        key={col.level}
        className={`flex flex-col rounded-2xl border border-border/60 ${col.bgColor} min-h-[400px]`}
      >
        {/* Column header */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.headerBg} border-b border-border/60`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <h3 className={`font-bold text-sm ${col.textColor}`}>{col.label}</h3>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-surface/80 ${col.textColor}`}>
            {items.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <span className="material-symbols-outlined text-[40px] text-outline mb-2">inbox</span>
              <p className="text-xs font-medium">Tidak ada prospek</p>
            </div>
          ) : (
            items.map(renderCard)
          )}
        </div>
      </div>
    );
  };

  // Count prospects without level
  const unqualifiedCount = prospects.filter((p) => !p.customerData?.level).length;

  if (loading && !dataLoaded) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Kualifikasi Prospek"
        description="Kelola level customer dan promote prospek berdasarkan kualifikasi. Hanya customer level Hot yang bisa diedit penuh di CRM."
        actions={
          <div className="flex items-center gap-3">
            {unqualifiedCount > 0 && (
              <span className="text-xs text-secondary bg-surface-container-low px-3 py-1.5 rounded-lg border border-border/60">
                {unqualifiedCount} prospek tanpa level
              </span>
            )}
            <button
              onClick={() => fetchProspects({ perPage: 100, page: 1 })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface border border-border/60 rounded-lg hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {COLUMNS.map(renderColumn)}
      </div>
    </PageContainer>
  );
}
