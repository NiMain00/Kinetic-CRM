import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCustomerStore } from '@/stores/customerStore';
import { PageContainer, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useProspectLight } from '@/hooks/queries/useProspects';
import { usePromoteProspect } from '@/hooks/mutations/useProspectMutations';
import TenderDrawer from './TenderDrawer';
import type { Prospect } from '@/types/domain';

// ── Types ──

type CustomerLevel = 'hot' | 'medium' | 'low';

interface LevelColumn {
  level: CustomerLevel;
  label: string;
  dotColor: string;
  headerBg: string;
  columnBg: string;
  badgeBg: string;
  textColor: string;
  emptyIcon: string;
}

// ── Constants ──

const COLUMNS: LevelColumn[] = [
  {
    level: 'low',
    label: 'Low',
    dotColor: 'bg-outline',
    headerBg: 'bg-surface-container-high',
    columnBg: 'bg-surface-container',
    badgeBg: 'bg-surface/90',
    textColor: 'text-secondary',
    emptyIcon: 'trending_flat',
  },
  {
    level: 'medium',
    label: 'Medium',
    dotColor: 'bg-warning',
    headerBg: 'bg-warning-container',
    columnBg: 'bg-warning-container',
    badgeBg: 'bg-surface/90',
    textColor: 'text-warning',
    emptyIcon: 'trending_up',
  },
  {
    level: 'hot',
    label: 'Hot',
    dotColor: 'bg-danger',
    headerBg: 'bg-danger-container',
    columnBg: 'bg-danger-container',
    badgeBg: 'bg-surface/90',
    textColor: 'text-danger',
    emptyIcon: 'local_fire_department',
  },
];

const LEVEL_LABEL: Record<CustomerLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  hot: 'Hot',
};

// ── Helpers ──

function relativeDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return date.toLocaleDateString('id-ID');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Skeleton ──

function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-border/60 p-4 space-y-3 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="h-4 w-3/4 bg-surface-container-high rounded" />
            <div className="h-5 w-12 bg-surface-container-high rounded-full" />
          </div>
          <div className="h-3 w-1/2 bg-surface-container-high rounded" />
          <div className="flex gap-3">
            <div className="h-3 w-16 bg-surface-container-high rounded" />
            <div className="h-3 w-12 bg-surface-container-high rounded" />
            <div className="h-3 w-14 bg-surface-container-high rounded" />
          </div>
          <div className="h-9 w-full bg-surface-container-high rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Card ──

interface CardProps {
  prospect: Prospect;
  onPromote: (prospect: Prospect, targetLevel: CustomerLevel) => void;
  isPromoting: boolean;
  onNavigate: (id: string) => void;
  onOpenDrawer: (id: string) => void;
}

function QualificationCard({ prospect, onPromote, isPromoting, onNavigate, onOpenDrawer }: CardProps) {
  const currentLevel = prospect.customerData?.level as CustomerLevel | undefined;
  const nextLevel: CustomerLevel | null =
    currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'hot' : null;

  const levelBadgeClass = !currentLevel
    ? 'bg-surface-container-high text-secondary'
    : currentLevel === 'hot'
    ? 'bg-danger-container text-danger'
    : currentLevel === 'medium'
    ? 'bg-warning-container text-warning'
    : 'bg-surface-container-high text-secondary';

  const levelLabel = currentLevel ? LEVEL_LABEL[currentLevel] : '-';

  return (
    <div
      className="bg-surface rounded-xl border border-border/60 p-4 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-3 group cursor-pointer animate-[fadeSlideUp_0.3s_ease-out_both]"
      onClick={() => onNavigate(prospect.id)}
      role="article"
      style={{ animationDelay: `${Math.random() * 0.1}s` }}
    >
      {/* Name + level badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-on-surface truncate leading-snug">
            {prospect.customerData?.name || prospect.name}
          </h4>
        </div>
        <span className={`shrink-0 text-caption-xs font-bold px-2 py-0.5 rounded-full ${levelBadgeClass}`}>
          {levelLabel}
        </span>
      </div>

      {/* Client + potensi unit */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-secondary truncate">{prospect.client}</span>
        {prospect.potensiUnit > 0 && (
          <span className="text-caption-xs font-semibold text-on-surface shrink-0 tabular-nums">
            {prospect.potensiUnit.toLocaleString('id-ID')} unit
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-caption-xs text-secondary">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">source</span>
          {prospect.source || 'Manual'}
        </span>
        <span className="flex items-center gap-1" title={formatDate(prospect.date)}>
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {relativeDate(prospect.date)}
        </span>
        <span className="flex items-center gap-1 truncate min-w-0">
          <span className="material-symbols-outlined text-[12px]">person</span>
          <span className="truncate">{prospect.author || '-'}</span>
        </span>
      </div>

      {/* Action */}
      <div onClick={(e) => e.stopPropagation()}>
        {currentLevel === 'hot' ? (
          <Button variant="primary" size="sm" fullWidth onClick={() => onOpenDrawer(prospect.id)}>
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Detail Tender
          </Button>
        ) : nextLevel ? (
          <Button
            variant={nextLevel === 'medium' ? 'warning' : 'danger'}
            size="sm"
            fullWidth
            onClick={() => onPromote(prospect, nextLevel)}
            isLoading={isPromoting}
          >
            ↑ {LEVEL_LABEL[nextLevel]}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── Main ──

export default function ProspectQualificationPage() {
  const navigate = useNavigate();
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const queryClient = useQueryClient();

  const { data: raw, isLoading, isRefetching, isError, refetch } = useProspectLight({ perPage: 100, page: 1 });
  const promoteMutation = usePromoteProspect();

  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [drawerProspectId, setDrawerProspectId] = useState<string | null>(null);

  const prospects: Prospect[] = useMemo(() => {
    const arr: any[] = Array.isArray(raw) ? raw : [];
    return arr.map((item: any) => ({
      id: item.id,
      name: item.name,
      client: item.client,
      customerId: item.customerId,
      customerData: item.customer
        ? { id: item.customer.id, name: item.customer.name, level: item.customer.level } as any
        : undefined,
      source: item.source,
      potensiUnit: item.potensiUnit ?? 0,
      date: item.createdAt || '',
      author: item.ownerUser?.fullName || '',
      status: 'Lead' as const,
    }));
  }, [raw]);

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

  const unqualifiedCount = prospects.filter((p) => !p.customerData?.level).length;

  const handlePromote = useCallback(
    async (prospect: Prospect, targetLevel: CustomerLevel) => {
      if (!prospect.customerId) {
        toast.error('Prospek ini tidak memiliki data customer');
        return;
      }
      setPromotingId(prospect.id);
      try {
        await promoteMutation.mutateAsync({ id: prospect.id, level: targetLevel });
        await updateCustomer(prospect.customerId, { level: targetLevel });
        await queryClient.invalidateQueries({ queryKey: ['prospects', 'light'] });
        toast.success(`${prospect.customerData?.name || prospect.client} dipromosikan ke ${LEVEL_LABEL[targetLevel]}`);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Gagal mempromosikan';
        toast.error(msg);
      } finally {
        setPromotingId(null);
      }
    },
    [promoteMutation, updateCustomer, queryClient],
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['prospects', 'light'] });
  }, [queryClient]);

  const handleNavigate = useCallback((id: string) => {
    navigate(`/prospects/${id}`);
  }, [navigate]);

  const handleOpenDrawer = useCallback((id: string) => {
    setDrawerProspectId(id);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerProspectId(null);
  }, []);

  const renderColumn = (col: LevelColumn) => {
    const items = grouped[col.level];

    return (
      <div
        key={col.level}
        className={`flex flex-col rounded-2xl border border-border/60 ${col.columnBg} min-h-[400px]`}
      >
        {/* Sticky header */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.headerBg} border-b border-border/60 sticky top-0 z-10`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
            <h3 className={`font-bold text-sm ${col.textColor}`}>{col.label}</h3>
          </div>
          <span className={`text-caption-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.textColor}`}>
            {items.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)] scrollbar-none">
          {isLoading ? (
            <SkeletonCards count={3} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <span className="material-symbols-outlined text-4xl text-outline/50 mb-2">
                {col.emptyIcon}
              </span>
              <p className="text-xs font-medium">Belum ada prospek {col.label.toLowerCase()}</p>
              <p className="text-caption-xs text-outline mt-1 px-4 text-center">
                Prospek akan muncul di sini setelah diberi level
              </p>
            </div>
          ) : (
            items.map((prospect) => (
              <QualificationCard
                key={prospect.id}
                prospect={prospect}
                onPromote={handlePromote}
                isPromoting={promotingId === prospect.id}
                onNavigate={handleNavigate}
                onOpenDrawer={handleOpenDrawer}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // ── Full-page loading skeleton ──

  if (isLoading && prospects.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Kualifikasi Prospek"
          description="Kelola level customer dan promosikan prospek berdasarkan kualifikasi"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {COLUMNS.map((col) => (
            <div key={col.level} className="flex flex-col rounded-2xl border border-border/60 bg-surface-container min-h-[400px]">
              <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl bg-surface-container-high border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-outline/40" />
                  <div className="h-4 w-16 bg-surface-container-highest rounded animate-pulse" />
                </div>
                <div className="h-5 w-6 bg-surface-container-highest rounded-full animate-pulse" />
              </div>
              <div className="flex-1 p-3">
                <SkeletonCards count={3} />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  // ── Rendered page ──

  return (
    <PageContainer>
      <PageHeader
        title="Kualifikasi Prospek"
        description="Kelola level customer dan promosikan prospek berdasarkan kualifikasi"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="touch-min flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface border border-border/60 rounded-lg hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefetching ? (
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              )}
              {isRefetching ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-container border border-danger/30 text-danger text-sm">
          <span className="material-symbols-outlined text-[18px] shrink-0">error_outline</span>
          <span className="flex-1 text-xs font-medium">Gagal memuat data. Periksa koneksi Anda.</span>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold underline hover:no-underline shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-surface rounded-xl border border-border/60 flex-wrap">
        {COLUMNS.map((col) => (
          <div key={col.level} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
            <span className="text-xs text-secondary whitespace-nowrap">
              <span className="font-semibold text-on-surface">{grouped[col.level].length}</span>{' '}
              {col.label}
            </span>
          </div>
        ))}
        {unqualifiedCount > 0 && (
          <>
            <span className="text-outline text-xs">·</span>
            <span className="text-caption-xs text-outline">{unqualifiedCount} tanpa level</span>
          </>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex md:grid md:grid-cols-3 gap-4 mt-6 overflow-x-auto snap-x snap-mandatory scrollbar-none md:overflow-visible pb-2 md:pb-0">
        {COLUMNS.map((col) => (
          <div key={col.level} className="snap-start shrink-0 w-[80vw] md:w-auto min-w-0">
            {renderColumn(col)}
          </div>
        ))}
      </div>

      <TenderDrawer
        prospectId={drawerProspectId}
        isOpen={drawerProspectId !== null}
        onClose={handleCloseDrawer}
      />
    </PageContainer>
  );
}
