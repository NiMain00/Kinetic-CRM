import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrencyShort as formatCurrency } from '@/utils/formatters';

export default function ReportsIndexPage() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const won = projects.filter((p) => p.winnerDetails?.outcome === 'menang').length;
    const lost = projects.filter((p) => p.winnerDetails?.outcome === 'kalah').length;
    const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
    const totalValue = projects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const wonCount = won;

    // Year-over-year comparison
    const thisYear = projects.filter((p) => new Date(p.date).getFullYear() === 2025).length;
    const lastYear = projects.filter((p) => new Date(p.date).getFullYear() === 2024).length;
    const growthPct = lastYear > 0 ? Math.round(((thisYear - lastYear) / lastYear) * 100) : 0;
    const growthLabel = growthPct >= 0 ? `↑ ${growthPct}% vs last year` : `↓ ${Math.abs(growthPct)}% vs last year`;
    const growthColor = growthPct >= 0 ? 'text-success' : 'text-danger';

    // Count on-track projects (Executing or Target Delivery)
    const onTrack = projects.filter((p) => p.status === 'Executing' || p.status === 'Target Delivery').length;

    return { totalProjects, winRate, wonCount, totalValue, growthLabel, growthColor, onTrack };
  }, [projects]);

  const reportCards = [
    {
      title: 'Win/Loss Report',
      description: 'Analisis performa tender, rasio kemenangan, dan perbandingan proyek dimenangkan vs dikalahkan.',
      icon: 'query_stats',
      path: '/reports/win-loss',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      stats: [
        { label: 'Win Rate', value: `${stats.winRate}%` },
        { label: 'Total Won', value: `${stats.wonCount}` },
      ],
    },
    {
      title: 'Pipeline Report',
      description: 'Visualisasi tahapan pipeline dari RKS hingga Final Kontrak, nilai dan jumlah proyek per stage.',
      icon: 'filter_center_focus',
      path: '/reports/pipeline',
      color: 'text-status-teal',
      bgColor: 'bg-status-teal/10',
      stats: [
        { label: 'Total Pipeline', value: formatCurrency(stats.totalValue) },
        { label: 'Active Projects', value: `${stats.totalProjects}` },
      ],
    },
    {
      title: 'KPI',
      description: 'Key Performance Indicators, dashboard monitoring, target setting, dan progress scoring.',
      icon: 'monitoring',
      path: '/reports/kpi',
      color: 'text-status-purple',
      bgColor: 'bg-status-purple/10',
      stats: [
        { label: 'Metrik', value: '6' },
        { label: 'On Track', value: `${stats.onTrack}` },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface">Laporan & Analisis</h1>
          <p className="text-sm text-secondary mt-1">Tiga jenis laporan: Win/Loss, Pipeline, dan KPI — pilih untuk melihat detail.</p>
        </div>

        {/* Quick Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Projects</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalProjects}</p>
            <span className={`text-xs ${stats.growthColor} font-semibold`}>{stats.growthLabel}</span>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Win Rate</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">{stats.winRate}%</p>
            <span className="text-xs text-success font-semibold">{stats.wonCount} project{stats.wonCount !== 1 ? 's' : ''} won</span>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Pipeline Value</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">{formatCurrency(stats.totalValue)}</p>
            <span className="text-xs text-secondary font-semibold">{stats.totalProjects} active project{stats.totalProjects !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-surface border border-border/60 rounded-2xl p-6 shadow-card hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer group"
              aria-label={`Buka ${card.title}`}
            >
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center ${card.color} mb-4`}>
                <span className="material-symbols-outlined text-2xl">{card.icon}</span>
              </div>
              <h3 className="font-bold text-base text-on-surface mb-2 flex items-center gap-2">
                {card.title}
                <span className="material-symbols-outlined text-[18px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-sm text-secondary leading-relaxed mb-4">{card.description}</p>
              <div className="flex gap-4 pt-3 border-t border-border">
                {card.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[10px] text-outline uppercase font-semibold tracking-wider">{stat.label}</p>
                    <p className="text-sm font-extrabold text-on-surface">{stat.value}</p>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
