import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { PageContainer, ActivityFeed } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useApprovalStore } from '@/stores/approvalStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useSlaConfigs } from '@/hooks/useConfigData';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDateString, setCurrentDateString] = useState('');
  const { approvals } = useApprovalStore();
  const { projects } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const { stats: apiStats, chartData: apiChartData, statusDistribution: apiDist, loading: dashLoading, fetchAll } = useDashboardStore();

  const userApprovals = user?.id ? approvals.filter((a) => a.assigneeUserId === user.id) : [];

  useEffect(() => {
    fetchAll();
    const today = new Date();
    setCurrentDateString(today.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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

  const stats = useMemo(() => {
    if (apiStats) return apiStats;
    const active = projects.filter((p) => p.status !== 'Selesai' && p.status !== 'Kalah');
    const won = projects.filter((p) => p.winnerDetails?.outcome === 'menang');
    const totalValue = active.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    return {
      totalActiveProjects: active.length,
      totalActiveValue: totalValue,
      pendingApprovals: userApprovals.length,
      criticalDeadlines: projects.filter((p) => p.deadlineTender && new Date(p.deadlineTender) <= new Date(Date.now() + 7 * 86400000)).length,
      winRate: projects.length ? Math.round((won.length / projects.length) * 100 * 10) / 10 : 0,
      valueChangePercent: 12,
    };
  }, [apiStats, projects, userApprovals]);

  const chartData = useMemo(() => {
    if (apiChartData.length > 0) return apiChartData;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
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
      month: m,
      win: Math.max(5, Math.round((monthlyWin[i] / maxVal) * 100)),
      lose: Math.max(5, Math.round((monthlyLose[i] / maxVal) * 100)),
    }));
  }, [apiChartData, projects]);

  const statusDistribution = useMemo(() => {
    if (apiDist) {
      const { inProgress, completed, postponed, total } = apiDist;
      return { berjalan: inProgress, planning: 0, review: postponed, selesai: completed, total };
    }
    const berjalan = projects.filter((p) => !['Selesai', 'Dibatalkan'].includes(p.status) && !p.winnerDetails?.outcome).length;
    const planning = projects.filter((p) => ['Dibuat', 'Potensial'].includes(p.status)).length;
    const review = projects.filter((p) => ['Review Departemen', 'LPHS/SIOS', 'Revisi', 'Waiting Supervisor', 'Revision'].includes(p.status)).length;
    const selesai = projects.filter((p) => p.status === 'Selesai' || p.winnerDetails?.outcome === 'menang').length;
    const total = berjalan + planning + review + selesai;
    return { berjalan, planning, review, selesai, total };
  }, [apiDist, projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [projects]);

  const donutData = useMemo(() => {
    const total = Math.max(statusDistribution.total, 1);
    const circumference = 2 * Math.PI * 52;
    let offset = 0;

    const segments = [
      { label: 'Berjalan', count: statusDistribution.berjalan, color: 'var(--color-info)' },
      { label: 'Planning', count: statusDistribution.planning, color: 'var(--color-status-orange)' },
      { label: 'Review', count: statusDistribution.review, color: 'var(--color-status-purple)' },
      { label: 'Selesai', count: statusDistribution.selesai, color: 'var(--color-success)' },
    ];

    return segments.map((seg) => {
      const pct = seg.count / total;
      const dashLen = circumference * pct;
      const dashOffset = -offset;
      offset += dashLen;
      return { ...seg, pct, dashLen, dashOffset, circumference };
    });
  }, [statusDistribution]);

  if (dashLoading && !apiStats) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border/60 shadow-card p-4 sm:p-5">
        <h1 className="font-display-title text-display-title text-on-surface">
          {greeting}, <span className="text-primary">{userName}</span>
        </h1>
        <div className="w-12 h-0.5 bg-primary rounded-full mt-1 mb-2"></div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-secondary mb-3">
          <span>{currentDateString}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning"></span>
            {stats.pendingApprovals} approval menunggu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger"></span>
            {stats.criticalDeadlines} deadline kritis
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
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
            variant="outline"
            size="sm"
            onClick={() => navigate('/approvals')}
            leftIcon={<span className="material-symbols-outlined text-[16px]">fact_check</span>}
          >
            Approval
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports/calendar')}
            leftIcon={<span className="material-symbols-outlined text-[16px]">calendar_month</span>}
          >
            Kalender
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative bg-surface rounded-2xl border border-border/60 shadow-card p-4 overflow-hidden group hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </span>
            <span className="text-success font-label-sm flex items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +{stats.valueChangePercent || 12}%
            </span>
          </div>
          <p className="text-secondary font-caption-xs mb-0.5">Total Proyek Aktif</p>
          <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{formatCurrencyShort(stats.totalActiveValue)}</h3>
          <p className="text-success text-[11px] mt-1">dari bulan lalu</p>
          <div className="absolute right-0 bottom-0 w-28 h-20 opacity-40 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
              <path d="M0 80 Q20 50 45 55 Q70 60 90 35 Q110 10 120 0 L120 80 Z" fill="#16A34A" />
              <path d="M0 80 Q30 60 60 65 Q90 70 120 40 L120 80 Z" fill="#4CAF50" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="relative bg-surface rounded-2xl border border-border/60 shadow-card p-4 overflow-hidden group hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/approvals')}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-xl bg-warning-container text-warning">
              <span className="material-symbols-outlined">fact_check</span>
            </span>
            <span className="text-warning font-label-sm text-xs">Prioritas Tinggi</span>
          </div>
          <p className="text-secondary font-caption-xs mb-0.5">Persetujuan Tertunda</p>
          <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.pendingApprovals} Item</h3>
          <div className="absolute right-0 bottom-0 w-28 h-20 opacity-40 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
              <path d="M0 80 Q20 50 45 55 Q70 60 90 35 Q110 10 120 0 L120 80 Z" fill="#D97706" />
              <path d="M0 80 Q30 60 60 65 Q90 70 120 40 L120 80 Z" fill="#F59E0B" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="relative bg-surface rounded-2xl border border-border/60 shadow-card p-4 overflow-hidden group hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-xl bg-danger-container text-danger">
              <span className="material-symbols-outlined">alarm</span>
            </span>
            <span className="text-danger font-label-sm text-xs">Perlu perhatian</span>
          </div>
          <p className="text-secondary font-caption-xs mb-0.5">Mendekati Deadline</p>
          <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.criticalDeadlines} Proyek</h3>
          <div className="absolute right-0 bottom-0 w-28 h-20 opacity-40 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
              <path d="M0 80 Q20 50 45 55 Q70 60 90 35 Q110 10 120 0 L120 80 Z" fill="#DC2626" />
              <path d="M0 80 Q30 60 60 65 Q90 70 120 40 L120 80 Z" fill="#EF4444" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="relative bg-surface rounded-2xl border border-border/60 shadow-card p-4 overflow-hidden group hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/reports/kpi')}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined">military_tech</span>
            </span>
            <span className="text-primary font-label-sm text-xs">Kinerja YTD</span>
          </div>
          <p className="text-secondary font-caption-xs mb-0.5">Rasio Kemenangan</p>
          <h3 className="font-display-title text-lg sm:text-xl text-on-surface">{stats.winRate}%</h3>
          <div className="absolute right-0 bottom-0 w-28 h-20 opacity-40 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
              <path d="M0 80 Q20 50 45 55 Q70 60 90 35 Q110 10 120 0 L120 80 Z" fill="#16A34A" />
              <path d="M0 80 Q30 60 60 65 Q90 70 120 40 L120 80 Z" fill="#4CAF50" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        <div className="col-span-12 lg:col-span-8 bg-surface rounded-2xl border border-border/60 shadow-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Trend Win/Loss</h4>
              <p className="text-secondary font-caption-xs text-xs">Performa 6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-secondary font-caption-xs text-xs">Menang</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                <span className="text-secondary font-caption-xs text-xs">Kalah</span>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-secondary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                6 Bulan
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 px-2 sm:px-4 pb-4">
            <div className={`flex flex-col justify-between text-[10px] text-secondary font-mono-data ${isMobile ? 'h-40' : 'h-56'}`}>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            <div className={`flex-1 flex items-end justify-between gap-2 sm:gap-4 ${isMobile ? 'h-40' : 'h-56'}`}>
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex gap-1 sm:gap-1.5 items-end h-full">
                    <div
                      className="flex-1 bg-primary rounded-t-lg transition-all duration-1000 group-hover:brightness-110"
                      style={{ height: `${d.win}%` }}
                      title={`Menang: ${d.win}`}
                    ></div>
                    <div
                      className="flex-1 bg-gold rounded-t-lg transition-all duration-1000 group-hover:brightness-95"
                      style={{ height: `${d.lose}%` }}
                      title={`Kalah: ${d.lose}`}
                    ></div>
                  </div>
                  <span className="font-caption-xs text-secondary text-xs">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center border-t border-border/60 pt-2.5">
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1.5 text-primary font-label-sm text-xs hover:underline"
            >
              Lihat Selengkapnya
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface rounded-2xl border border-border/60 shadow-card p-4 sm:p-5 flex flex-col">
          <h4 className="font-heading-section text-heading-section text-sm sm:text-base mb-3">Proyek per Status</h4>

          <div className="flex flex-1 items-center gap-4 py-2">
            <div className="relative shrink-0">
              <svg className="w-36 h-36 sm:w-40 sm:h-40 -rotate-90" viewBox="0 0 120 120">
                {donutData.map((seg, i) => (
                  <circle
                    key={i}
                    cx="60"
                    cy="60"
                    r="52"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${seg.dashLen} ${seg.circumference - seg.dashLen}`}
                    strokeDashoffset={seg.dashOffset}
                    style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-3xl font-bold text-on-surface leading-none">{statusDistribution.total}</p>
                <p className="text-secondary text-[10px] uppercase tracking-wider mt-1">TOTAL</p>
              </div>
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              {donutData.map((seg, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                    <span className="text-secondary truncate">{seg.label}</span>
                  </div>
                  <span className="font-mono-data font-bold shrink-0 ml-2">{seg.count} ({Math.round(seg.pct * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center border-t border-border/60 pt-2.5 mt-1">
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1.5 text-primary font-label-sm text-xs hover:underline"
            >
              Lihat Detail
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        <div className="col-span-12 lg:col-span-7 bg-surface rounded-2xl border border-border/60 shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/60 flex justify-between items-center bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">folder</span>
              <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Proyek Terbaru</h4>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-primary font-label-sm hover:underline text-xs sm:text-sm font-semibold touch-min-h flex items-center"
            >
              Lihat Semua
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="p-6 text-center text-secondary text-sm">Belum ada proyek.</div>
          ) : isMobile ? (
            <div className="p-3 space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="bg-surface-container-low rounded-2xl p-4 border border-border/60 active:scale-[0.99] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-label-sm text-on-surface text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-secondary font-mono">{project.code}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg font-mono-data text-xs ${project.status === 'Selesai' ? 'bg-success-container text-success' : 'bg-primary/10 text-primary'}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">{project.client}</span>
                    <span className="text-xs text-secondary">{formatCurrency(project.estimatedValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-secondary font-caption-xs uppercase border-b border-border/60">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold text-xs">Nama Proyek</th>
                    <th className="px-5 py-2.5 font-semibold text-xs">Klien</th>
                    <th className="px-5 py-2.5 font-semibold text-xs">Status</th>
                    <th className="px-5 py-2.5 font-semibold text-right text-xs">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentProjects.map((project) => (
                    <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-5 py-3">
                        <p className="font-label-sm text-on-surface text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-secondary font-mono">{project.code}</p>
                      </td>
                      <td className="px-5 py-3 text-secondary text-xs">{project.client}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-lg font-mono-data text-xs ${project.status === 'Selesai' ? 'bg-success-container text-success' : 'bg-primary/10 text-primary'}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-mono-data">{formatCurrency(project.estimatedValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 bg-surface rounded-2xl border border-border/60 shadow-card p-4 sm:p-5 flex flex-col">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">history</span>
              <h4 className="font-heading-section text-heading-section text-sm sm:text-base">Aktivitas Terbaru</h4>
            </div>
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
