import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCustomerStore } from '@/stores/customerStore';
import { PageContainer, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useProspectLight } from '@/hooks/queries/useProspects';
import { usePromoteProspect } from '@/hooks/mutations/useProspectMutations';
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
    color: 'bg-outline',
    bgColor: 'bg-surface-container',
    headerBg: 'bg-surface-container-high',
    textColor: 'text-secondary',
  },
  {
    level: 'medium',
    label: 'MEDIUM',
    color: 'bg-warning',
    bgColor: 'bg-warning-container',
    headerBg: 'bg-warning-container',
    textColor: 'text-warning',
  },
  {
    level: 'hot',
    label: 'HOT',
    color: 'bg-danger',
    bgColor: 'bg-danger-container',
    headerBg: 'bg-danger-container',
    textColor: 'text-danger',
  },
];

const LEVEL_LABELS: Record<CustomerLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  hot: 'Hot',
};

export default function ProspectQualificationPage() {
  const navigate = useNavigate();
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const queryClient = useQueryClient();

  const { data: raw, isLoading, isRefetching } = useProspectLight({ perPage: 100, page: 1 });
  const promoteMutation = usePromoteProspect();

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
    try {
      await promoteMutation.mutateAsync({ id: prospect.id, level: targetLevel });
      await updateCustomer(prospect.customerId, { level: targetLevel });
      toast.success(`Level ${prospect.customerData?.name || prospect.client} dinaikkan ke ${LEVEL_LABELS[targetLevel]}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal promote level';
      toast.error(msg);
    }
  };

  const renderCard = (prospect: Prospect) => {
    const currentLevel = prospect.customerData?.level as CustomerLevel | undefined;
    const nextLevel: CustomerLevel | null =
      currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'hot' : null;

    return (
      <div
        key={prospect.id}
        className="bg-surface rounded-xl border border-border/60 p-4 shadow-card hover:shadow-card-hover transition-all space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-on-surface truncate">
              {prospect.customerData?.name || prospect.name}
            </h4>
            <p className="text-xs text-secondary truncate">{prospect.client}</p>
          </div>
          {currentLevel && (
            <span
              className={`shrink-0 text-caption-xs font-bold px-2 py-0.5 rounded-full ${
                currentLevel === 'hot'
                  ? 'bg-danger-container text-danger'
                  : currentLevel === 'medium'
                  ? 'bg-warning-container text-warning'
                  : 'bg-surface-container-high text-secondary'
              }`}
            >
              {LEVEL_LABELS[currentLevel]}
            </span>
          )}
        </div>

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

        <div className="pt-1">
          {currentLevel === 'hot' ? (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => navigate(`/prospects/${prospect.id}`)}
            >
              Kelola di CRM
            </Button>
          ) : nextLevel ? (
            <Button
              variant={nextLevel === 'medium' ? 'warning' : 'danger'}
              size="sm"
              fullWidth
              onClick={() => handlePromote(prospect, nextLevel)}
              isLoading={promoteMutation.isPending && promoteMutation.variables?.id === prospect.id}
            >
              {promoteMutation.isPending && promoteMutation.variables?.id === prospect.id ? 'Memproses...' : `Naikkan ke ${LEVEL_LABELS[nextLevel]}`}
            </Button>
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
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.headerBg} border-b border-border/60`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <h3 className={`font-bold text-sm ${col.textColor}`}>{col.label}</h3>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-surface/90 ${col.textColor}`}>
            {items.length}
          </span>
        </div>

        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <span className="material-symbols-outlined text-5xl text-outline mb-2">inbox</span>
              <p className="text-xs font-medium">Tidak ada prospek</p>
            </div>
          ) : (
            items.map(renderCard)
          )}
        </div>
      </div>
    );
  };

  const unqualifiedCount = prospects.filter((p) => !p.customerData?.level).length;

  if (isLoading) {
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['prospects', 'light'] })}
              disabled={isRefetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface border border-border/60 rounded-lg hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {COLUMNS.map(renderColumn)}
      </div>
    </PageContainer>
  );
}
