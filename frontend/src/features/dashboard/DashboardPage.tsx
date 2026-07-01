import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { PageContainer, PageHeader, ActivityFeed } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useApprovalStore } from '@/stores/approvalStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useSlaConfigs } from '@/hooks/useConfigData';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import type { SlaConfig } from '@/types/domain';

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDateString, setCurrentDateString] = useState('');
  const { approvals } = useApprovalStore();
  const { projects } = useProjectStore();
  const user = useAuthStore((s) => s.user);

  const userApprovals = user?.id ? approvals.filter((a) => a.assigneeUserId === user.id) : [];

  useEffect(() => {
    const today = new Date();
    setCurrentDateString(today.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
  }, []);

  const slaConfigs = useSlaConfigs();

  const userName = user?.name || user?.fullName || 'User';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 10) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();

  const computeSlaStatus = (waitingSince: string, type: string): 'Overdue' | 'Near Deadline' | 'Normal' => {
    const entityMap: Record<string, string> = { Prospek: 'prospek', RKS: 'rks', LPHS: 'lphs' };
    const config = slaConfigs.find(s => s.entityType === entityMap[type] && s.active);
    if (!config) return 'Normal';
    const elapsedHours = (Date.now() - new Date(waitingSince).getTime()) / 3_600_000;
    const critH = config.unit === 'days' ? config.criticalThreshold * 24 : config.criticalThreshold;
    const warnH = config.unit === 'days' ? config.warningThreshold * 24 : config.warningThreshold;
    if (elapsedHours >= critH) return 'Overdue';
    if (elapsedHours >= warnH) return 'Near Deadline';
    return 'Normal';
  };

  const pendingApprovals = userApprovals.slice(0, 5);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'Selesai' && p.status !== 'Executing');
    const won = projects.filter((p) => p.winnerDetails?.outcome === 'menang');
    const totalValue = active.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    return {
      totalActiveProjects: active.length,
      totalActiveValue: totalValue,
      pendingApprovals: userApprovals.length,
      criticalDeadlines: projects.filter((p) => p.deadlineTender && new Date(p.deadlineTender) <= new Date(Date.now() + 7 * 86400000)).length,
      winRate: projects.length ? Math.round((won.length / projects.length) * 100 * 10) / 10 : 0,
    };
  }, [projects, userApprovals]);

  const chartData = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN'];
    const monthlyWin = [0, 0, 0, 0, 0, 0];
    const monthlyLose = [0, 0, 0, 0, 0, 0];

    projects.forEach((p) => {
      const dateStr = p.winnerDetails?.startDate || p.date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const month = d.getMonth();
      if (month < 0 || month > 5) return;
      if (p.winnerDetails?.outcome === 'menang') monthlyWin[month]++;
      else if (p.winnerDetails?.outcome === 'kalah') monthlyLose[month]++;
    });

    const maxVal = Math.max(...monthlyWin.map((v, i) => v + monthlyLose[i]), 1);

    return months.map((m, i) => ({
      m,
      win: Math.max(3, Math.round((monthlyWin[i] / maxVal) * 100)),
      lose: Math.max(3, Math.round((monthlyLose[i] / maxVal) * 100)),
    }));
  }, [projects]);

  const statusDistribution = useMemo(() => {
    const inProgress = projects.filter((p) => p.status !== 'Selesai' && p.winnerDetails?.outcome !== 'menang').length;
    const completed = projects.filter((p) => p.status === 'Selesai' || p.winnerDetails?.outcome === 'menang').length;
    const postponed = projects.filter((p) => p.status === 'Ditunda' || p.status === 'Non Potensial').length;
    return { inProgress, completed, postponed, total: projects.length };
  }, [projects]);

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting}, ${userName}`}
        description={`${currentDateString} · ${stats.pendingApprovals} approval menunggu · ${stats.criticalDeadlines} deadline kritis`}
      />

      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/prospects/new')}
          leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
        >
          Prospek Baru
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/projects/new')}
          leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
        >
          Proyek Baru
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/approvals')}
          leftIcon={<span className="material-symbols-outlined text-[16px]">fact_check</span>}
        >
          Approval
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reports/calendar')}
          leftIcon={<span className="material-symbols-outlined text-[16px]">calendar_month</span>}
        >
          Kalender
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md" hover>
          <button onClick={() => navigate('/projects')} className="w-full text-left cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2.5 sm:p-3 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </span>
              <span className="text-success font-label-sm flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> +12%
              </span>
            </div>
            <div>
              <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Total Proyek Aktif</p>
              <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{formatCurrency(stats.totalActiveValue)}</h3>
            </div>
          </button>
        </Card>

        <Card padding="md" hover>
          <button onClick={() => navigate('/approvals')} className="w-full text-left cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2.5 sm:p-3 rounded-lg bg-status-orange/10 text-status-orange">
                <span className="material-symbols-outlined">fact_check</span>
              </span>
              <span className="text-status-orange font-label-sm text-xs">Prioritas Tinggi</span>
            </div>
            <div>
              <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Persetujuan Tertunda</p>
              <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.pendingApprovals} Item</h3>
            </div>
          </button>
        </Card>

        <Card padding="md" hover>
          <button onClick={() => navigate('/projects')} className="w-full text-left cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2.5 sm:p-3 rounded-lg bg-danger/10 text-danger">
                <span className="material-symbols-outlined">alarm</span>
              </span>
              <span className="text-danger font-label-sm text-xs">Mendekati Deadline</span>
            </div>
            <div>
              <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Mendekati Deadline</p>
              <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.criticalDeadlines} Proyek</h3>
            </div>
          </button>
        </Card>

        <Card padding="md" hover>
          <button onClick={() => navigate('/reports/kpi')} className="w-full text-left cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2.5 sm:p-3 rounded-lg bg-status-indigo/10 text-status-indigo">
                <span className="material-symbols-outlined">military_tech</span>
              </span>
              <span className="text-status-indigo font-label-sm text-xs">Kinerja YTD</span>
            </div>
            <div>
              <p className="text-secondary font-label-sm mb-1 text-xs sm:text-sm">Rasio Kemenangan</p>
              <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.winRate}%</h3>
            </div>
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <div>
              <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Trend Win/Loss</h4>
              <p className="text-secondary font-caption-xs text-xs">Performa 6 bulan terakhir</p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-primary"></span>
                <span className="text-secondary font-caption-xs text-xs">Menang</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-outline-variant"></span>
                <span className="text-secondary font-caption-xs text-xs">Kalah</span>
              </div>
            </div>
          </div>
          <div className={`flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 pb-4 ${isMobile ? 'h-40' : 'h-64'}`}>
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex gap-1 sm:gap-1.5 items-end h-full">
                  <div
                    className="flex-1 bg-primary rounded-t-sm transition-all duration-1000 group-hover:brightness-110"
                    style={{ height: `${d.win}%` }}
                    title={`Menang: ${d.win}`}
                  ></div>
                  <div
                    className="flex-1 bg-outline-variant rounded-t-sm transition-all duration-1000 group-hover:brightness-95"
                    style={{ height: `${d.lose}%` }}
                    title={`Kalah: ${d.lose}`}
                  ></div>
                </div>
                <span className="font-caption-xs text-secondary text-xs">{d.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6 flex flex-col justify-between">
          <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Proyek per Status</h4>

          <div className="relative flex justify-center items-center py-6 sm:py-8">
            <svg className={`${isMobile ? 'w-40 h-40' : 'w-48 h-48'} -rotate-90`} viewBox="0 0 160 160" aria-label="Distribusi status proyek">
              <circle cx="80" cy="80" r="68" fill="transparent" stroke="currentColor" strokeWidth="14" className="text-secondary-container" />
              <circle cx="80" cy="80" r="68" fill="transparent" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-success"
                strokeDasharray="427.2" strokeDashoffset={427.2 - (427.2 * (statusDistribution.completed / Math.max(statusDistribution.total, 1)))} />
              <circle cx="80" cy="80" r="68" fill="transparent" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-primary"
                strokeDasharray="427.2" strokeDashoffset={427.2 - (427.2 * (statusDistribution.inProgress / Math.max(statusDistribution.total, 1))) - (427.2 * (statusDistribution.completed / Math.max(statusDistribution.total, 1)))} />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <p className="font-display-title text-2xl sm:text-3xl font-bold text-on-surface leading-none">{statusDistribution.total}</p>
              <p className="text-secondary font-caption-xs uppercase tracking-wider text-[10px] sm:text-xs mt-1">Total</p>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-secondary font-label-sm">Dalam Progres</span>
              </div>
              <span className="font-mono-data font-bold">{statusDistribution.inProgress}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span className="text-secondary font-label-sm">Selesai</span>
              </div>
              <span className="font-mono-data font-bold">{statusDistribution.completed}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="text-secondary font-label-sm">Ditunda</span>
              </div>
              <span className="font-mono-data font-bold">{statusDistribution.postponed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Persetujuan Tertunda</h4>
            <button
              onClick={() => navigate('/approvals')}
              className="text-primary font-label-sm hover:underline text-xs sm:text-sm font-semibold touch-min-h flex items-center"
            >
              Lihat Semua
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-secondary text-sm">Tidak ada approval pending.</div>
          ) : isMobile ? (
            <div className="p-3 space-y-3">
              {pendingApprovals.map((item) => (
                <div key={item.id} onClick={() => navigate('/approvals')} className="bg-surface-container-low rounded-xl p-4 border border-border active:scale-[0.99] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-label-sm text-on-surface text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-secondary font-mono">{item.ref}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded font-mono-data text-xs ${computeSlaStatus(item.waitingSince, item.type) === 'Overdue' ? 'bg-error-container text-error' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {formatRelativeTime(item.waitingSince)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">{item.branch}</span>
                    <span className="text-primary touch-min flex items-center justify-center" aria-label="Buka review">
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
                    <th className="px-6 py-3 font-semibold text-xs">Cabang</th>
                    <th className="px-6 py-3 font-semibold text-xs">Menunggu</th>
                    <th className="px-6 py-3 font-semibold text-right text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingApprovals.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-label-sm text-on-surface text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-secondary font-mono">{item.ref}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary text-xs">{item.branch}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-mono-data text-xs ${computeSlaStatus(item.waitingSince, item.type) === 'Overdue' ? 'bg-error-container text-error' : 'bg-secondary-container text-on-secondary-container'}`}>
                          {formatRelativeTime(item.waitingSince)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate('/approvals')} className="text-primary p-2 hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center touch-min" title="Buka Lembar Review" aria-label="Buka review">
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

        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4 sm:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Aktivitas Terbaru</h4>
            <button
              onClick={() => navigate('/notifications')}
              className="text-primary font-label-sm hover:underline text-xs sm:text-sm font-semibold touch-min-h flex items-center"
            >
              Lihat Semua
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px]">
            <ActivityFeed maxItems={10} showFilter={false} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
