import React from 'react';
import { useNavigate } from 'react-router-dom';

const reportCards = [
  {
    title: 'Win/Loss Report',
    description: 'Analisis performa tender, rasio kemenangan, dan perbandingan proyek dimenangkan vs dikalahkan.',
    icon: 'query_stats',
    path: '/reports/win-loss',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    stats: [{ label: 'Win Rate', value: '65.5%' }, { label: 'Total Won', value: '842' }],
  },
  {
    title: 'Pipeline Report',
    description: 'Visualisasi tahapan pipeline dari RKS hingga Final Kontrak, nilai dan jumlah proyek per stage.',
    icon: 'filter_center_focus',
    path: '/reports/pipeline',
    color: 'text-status-teal',
    bgColor: 'bg-status-teal/10',
    stats: [{ label: 'Total Pipeline', value: 'Rp 4.28T' }, { label: 'Active Projects', value: '1,248' }],
  },
  {
    title: 'KPI',
    description: 'Key Performance Indicators, dashboard monitoring, target setting, dan progress scoring.',
    icon: 'monitoring',
    path: '/reports/kpi',
    color: 'text-status-purple',
    bgColor: 'bg-status-purple/10',
    stats: [{ label: 'Metrik', value: '6' }, { label: 'On Track', value: '3' }],
  },
];

export default function ReportsIndexPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Laporan</span>
        </nav>

        <div>
          <h1 className="text-xl font-extrabold text-on-surface">Laporan & Analisis</h1>
          <p className="text-sm text-secondary mt-1">Tiga jenis laporan: Win/Loss, Pipeline, dan KPI — pilih untuk melihat detail.</p>
        </div>

        {/* Quick Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Projects</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">1,284</p>
            <span className="text-xs text-success font-semibold">↑ 12% vs last year</span>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Win Rate</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">65.5%</p>
            <span className="text-xs text-success font-semibold">↑ 8.4% improvement</span>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Pipeline Value</p>
            <p className="text-2xl font-extrabold text-on-surface mt-1">Rp 4.28T</p>
            <span className="text-xs text-warning font-semibold">42 days avg. aging</span>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer group"
              aria-label={`Buka ${card.title}`}
            >
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center ${card.color} mb-4`}>
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
