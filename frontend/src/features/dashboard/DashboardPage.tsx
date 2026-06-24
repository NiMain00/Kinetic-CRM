import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDashboard, usePendingApprovals, useApproachingDeadline } from '@/hooks/queries/useDashboard';
import PageSkeleton from '@/components/layout/PageSkeleton';
import EmptyState from '@/components/shared/EmptyState';

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDateString, setCurrentDateString] = useState('');

  const { data: summaryRes, isLoading: summaryLoading, isError: summaryError } = useDashboard();
  const { data: pendingRes, isLoading: pendingLoading } = usePendingApprovals();
  const { data: deadlineRes, isLoading: deadlineLoading } = useApproachingDeadline();

  useEffect(() => {
    const today = new Date();
    setCurrentDateString(today.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
  }, []);

  if (summaryLoading || pendingLoading || deadlineLoading) {
    return <PageSkeleton />;
  }

  const summary = (summaryRes as any)?.data?.data;
  const pendingApprovals = (pendingRes as any)?.data?.data ?? [];
  const approachingDeadline = (deadlineRes as any)?.data?.data ?? [];

  if (summaryError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          icon="error"
          title="Gagal Memuat Data"
          description="Terjadi kesalahan saat memuat dashboard. Silakan coba lagi."
          actionLabel="Muat Ulang"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Pusat Monitoring</h2>
          <p className="text-secondary font-body-main mt-1" id="current-date">
            {currentDateString}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/prospects')}
            leftIcon={<span className="material-symbols-outlined text-[18px]">group</span>}
          >
            Daftar Prospek
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/projects/new')}
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            Proyek Baru
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md" className="sm:padding-lg hover:border-primary transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 sm:p-3 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </span>
            <span className="text-success font-label-sm flex items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> {summary?.totalProjects || 0}
            </span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Total Proyek Aktif</p>
            <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{formatCurrency(summary?.totalValue || 0)}</h3>
          </div>
        </Card>

        <Card padding="md" className="sm:padding-lg hover:border-status-orange transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 sm:p-3 rounded-lg bg-status-orange/10 text-status-orange">
              <span className="material-symbols-outlined">fact_check</span>
            </span>
            <span className="text-status-orange font-label-sm text-xs">Prioritas Tinggi</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Approval Pending</p>
            <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{summary?.pendingApprovals || 0} Items</h3>
          </div>
        </Card>

        <Card padding="md" className="sm:padding-lg hover:border-danger transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 sm:p-3 rounded-lg bg-danger/10 text-danger">
              <span className="material-symbols-outlined">alarm</span>
            </span>
            <span className="text-danger font-label-sm text-xs">Tenggat &lt; 7 Hari</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Mendekati Deadline</p>
            <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{String(summary?.approachingDeadline || 0).padStart(2, '0')} Proyek</h3>
          </div>
        </Card>

        <Card padding="md" className="sm:padding-lg hover:border-status-indigo transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 sm:p-3 rounded-lg bg-status-indigo/10 text-status-indigo">
              <span className="material-symbols-outlined">military_tech</span>
            </span>
            <span className="text-status-indigo font-label-sm text-xs">Kinerja YTD</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Win Rate</p>
            <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{summary?.winRate || 0}%</h3>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Trend Win/Loss */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <div>
              <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Trend Win/Loss</h4>
              <p className="text-secondary font-caption-xs text-xs">Performa 6 bulan terakhir</p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-primary"></span>
                <span className="text-secondary font-caption-xs text-xs">Win</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-outline-variant"></span>
                <span className="text-secondary font-caption-xs text-xs">Loss</span>
              </div>
            </div>
          </div>
          <div className={`flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 pb-4 ${isMobile ? 'h-40' : 'h-64'}`}>
            {[
              { m: 'JAN', win: 40, lose: 20 },
              { m: 'FEB', win: 60, lose: 30 },
              { m: 'MAR', win: 55, lose: 25 },
              { m: 'APR', win: 80, lose: 15 },
              { m: 'MEI', win: 70, lose: 40 },
              { m: 'JUN', win: 90, lose: 10 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex gap-1 sm:gap-1.5 items-end h-full">
                  <div
                    className="flex-1 bg-primary rounded-t-sm transition-all duration-1000 group-hover:brightness-110"
                    style={{ height: `${d.win}%` }}
                    title={`Win: ${d.win}`}
                  ></div>
                  <div
                    className="flex-1 bg-outline-variant rounded-t-sm transition-all duration-1000 group-hover:brightness-95"
                    style={{ height: `${d.lose}%` }}
                    title={`Loss: ${d.lose}`}
                  ></div>
                </div>
                <span className="font-caption-xs text-secondary text-xs">{d.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Widget */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6 flex flex-col justify-between">
          <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Proyek per Status</h4>

          <div className="relative flex justify-center items-center py-6 sm:py-8">
            <svg
              className={`${isMobile ? 'w-40 h-40' : 'w-48 h-48'} -rotate-90`}
              viewBox="0 0 160 160"
              aria-label="Project status distribution"
            >
              <circle
                className="text-secondary-container"
                cx="80" cy="80" r="68"
                fill="transparent" stroke="currentColor" strokeWidth="14"
              />
              <circle
                className="text-success"
                cx="80" cy="80" r="68"
                fill="transparent" stroke="currentColor"
                strokeDasharray="427.2" strokeDashoffset="116"
                strokeWidth="14" strokeLinecap="round"
              />
              <circle
                className="text-primary"
                cx="80" cy="80" r="68"
                fill="transparent" stroke="currentColor"
                strokeDasharray="427.2" strokeDashoffset="240"
                strokeWidth="14" strokeLinecap="round"
              />
            </svg>

            <div className="absolute text-center flex flex-col items-center justify-center">
              <p className="font-display-title text-2xl sm:text-3xl font-bold text-on-surface leading-none">{summary?.totalProjects || 0}</p>
              <p className="text-secondary font-caption-xs uppercase tracking-wider text-[10px] sm:text-xs mt-1">Total</p>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-secondary font-label-sm">Dalam Progres</span>
              </div>
              <span className="font-mono-data font-bold">{summary?.totalProjects || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span className="text-secondary font-label-sm">Selesai</span>
              </div>
              <span className="font-mono-data font-bold">0</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="text-secondary font-label-sm">Ditunda</span>
              </div>
              <span className="font-mono-data font-bold">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Approval Pending */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Approval Pending</h4>
            <button
              onClick={() => navigate('/approvals')}
              className="text-primary font-label-sm hover:underline text-xs sm:text-sm font-semibold touch-min-h flex items-center"
            >
              Lihat Semua
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-6 text-center text-secondary text-sm">
              Tidak ada approval pending.
            </div>
          ) : isMobile ? (
            <div className="p-3 space-y-3">
              {pendingApprovals.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/approvals')}
                  className="bg-surface-container-low rounded-xl p-4 border border-border active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-label-sm text-on-surface text-sm font-medium truncate">{item.name || `Approval #${item.id?.slice(0, 8)}`}</p>
                      <p className="text-xs text-secondary font-mono">{item.resourceType || '-'}</p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded font-mono-data text-xs bg-secondary-container text-on-secondary-container">
                      {item.slaStatus || 'Normal'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">{item.assignee?.name || '-'}</span>
                    <span className="text-primary touch-min flex items-center justify-center" aria-label="Open review">
                      <span className="material-symbols-outlined text-xl">fact_check</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-secondary font-caption-xs uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-xs">Prospek/Proyek</th>
                    <th className="px-6 py-3 font-semibold text-xs">Tipe</th>
                    <th className="px-6 py-3 font-semibold text-xs">Status</th>
                    <th className="px-6 py-3 font-semibold text-right text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingApprovals.slice(0, 5).map((item: any) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-label-sm text-on-surface text-sm font-medium truncate max-w-[200px]">{item.name || `Approval #${item.id?.slice(0, 8)}`}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary text-xs">{item.resourceType || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded font-mono-data text-xs bg-secondary-container text-on-secondary-container">
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/approvals')}
                          className="text-primary p-2 hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center touch-min"
                          title="Buka Lembar Review"
                          aria-label="Open review"
                        >
                          <span className="material-symbols-outlined text-xl">fact_check</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Critical Deadlines */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Deadline Kritis</h4>
            <span className="material-symbols-outlined text-danger text-xl sm:text-2xl" aria-label="Warning">warning</span>
          </div>
          {approachingDeadline.length === 0 ? (
            <div className="text-center text-secondary text-sm py-8">
              Tidak ada proyek mendekati deadline.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {approachingDeadline.slice(0, 5).map((item: any) => {
                const daysLeft = item.deadlineTender
                  ? Math.ceil((new Date(item.deadlineTender).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;
                const urgencyClass = daysLeft <= 2 ? 'border-danger' : daysLeft <= 4 ? 'border-status-orange' : 'border-warning';
                const urgencyText = daysLeft <= 2 ? 'text-danger' : daysLeft <= 4 ? 'text-status-orange' : 'text-warning';

                return (
                  <div key={item.id} className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-surface-container-low border-l-4 ${urgencyClass}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-sm text-on-surface text-xs sm:text-sm font-medium truncate">{item.name}</p>
                      <p className="text-secondary font-caption-xs text-xs">{item.customer || item.branch || ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-label-sm text-xs sm:text-sm ${urgencyText}`}>
                        {daysLeft <= 0 ? 'Hari Ini' : `${daysLeft} Hari Lagi`}
                      </p>
                      <p className="text-secondary font-caption-xs text-xs">
                        {item.deadlineTender ? new Date(item.deadlineTender).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 border border-border rounded-lg font-label-sm text-secondary hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold touch-min-h">
            Lihat Semua Jadwal Kritis
          </button>
        </div>
      </div>
    </div>
  );
}
