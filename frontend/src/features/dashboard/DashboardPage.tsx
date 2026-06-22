import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import type { ApprovalItem } from '../../types/domain';
import { INITIAL_APPROVALS } from '../../services/mock-data';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    const today = new Date();
    setCurrentDateString(today.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
  }, []);

  const pendingApprovals = INITIAL_APPROVALS.slice(0, 5);

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="lg" className="hover:border-primary transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </span>
            <span className="text-success font-label-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> +12%
            </span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-sm">Total Proyek Aktif</p>
            <h3 className="font-display-title text-xl text-on-surface">Rp 42.8B</h3>
          </div>
        </Card>

        <Card padding="lg" className="hover:border-status-orange transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 rounded-lg bg-status-orange/10 text-status-orange">
              <span className="material-symbols-outlined">fact_check</span>
            </span>
            <span className="text-status-orange font-label-sm text-xs">Prioritas Tinggi</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-sm">Approval Pending</p>
            <h3 className="font-display-title text-xl text-on-surface">24 Items</h3>
          </div>
        </Card>

        <Card padding="lg" className="hover:border-danger transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 rounded-lg bg-danger/10 text-danger">
              <span className="material-symbols-outlined">alarm</span>
            </span>
            <span className="text-danger font-label-sm text-xs">Tenggat &lt; 7 Hari</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-sm">Mendekati Deadline</p>
            <h3 className="font-display-title text-xl text-on-surface">08 Proyek</h3>
          </div>
        </Card>

        <Card padding="lg" className="hover:border-status-indigo transition-all duration-300" hover>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 rounded-lg bg-status-indigo/10 text-status-indigo">
              <span className="material-symbols-outlined">military_tech</span>
            </span>
            <span className="text-status-indigo font-label-sm text-xs">Kinerja YTD</span>
          </div>
          <div>
            <p className="text-secondary font-label-sm mb-1 text-sm">Win Rate</p>
            <h3 className="font-display-title text-xl text-on-surface">68.4%</h3>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Trend Win/Loss */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-heading-section text-heading-section">Trend Win/Loss</h4>
              <p className="text-secondary font-caption-xs text-xs">Performa 6 bulan terakhir</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-secondary font-caption-xs text-xs">Win</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
                <span className="text-secondary font-caption-xs text-xs">Loss</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4 pb-4">
            {[
              { m: 'JAN', win: 40, lose: 20 },
              { m: 'FEB', win: 60, lose: 30 },
              { m: 'MAR', win: 55, lose: 25 },
              { m: 'APR', win: 80, lose: 15 },
              { m: 'MEI', win: 70, lose: 40 },
              { m: 'JUN', win: 90, lose: 10 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex gap-1.5 items-end h-full">
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
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
          <h4 className="font-heading-section text-heading-section">Proyek per Status</h4>
          <div className="relative flex justify-center items-center py-6">
            <svg className="w-44 h-44 -rotate-90" aria-label="Project status distribution">
              <circle className="text-secondary-container" cx="88" cy="88" fill="transparent" r="70" stroke="currentColor" strokeWidth="16"></circle>
              <circle className="text-success" cx="88" cy="88" fill="transparent" r="70" stroke="currentColor" strokeDasharray="439.8" strokeDashoffset="120" strokeWidth="16"></circle>
              <circle className="text-primary" cx="88" cy="88" fill="transparent" r="70" stroke="currentColor" strokeDasharray="439.8" strokeDashoffset="280" strokeWidth="16"></circle>
            </svg>
            <div className="absolute text-center">
              <p className="font-display-title text-xl text-on-surface">142</p>
              <p className="text-secondary font-caption-xs uppercase tracking-wider text-xs">Total</p>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-secondary font-label-sm">Dalam Progres</span>
              </div>
              <span className="font-mono-data font-bold">72</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span className="text-secondary font-label-sm">Selesai</span>
              </div>
              <span className="font-mono-data font-bold">45</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="text-secondary font-label-sm">Ditunda</span>
              </div>
              <span className="font-mono-data font-bold">25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Approval Pending */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-heading-section text-heading-section">Approval Pending</h4>
            <button
              onClick={() => navigate('/approvals')}
              className="text-primary font-label-sm hover:underline text-sm font-semibold"
            >
              Lihat Semua
            </button>
          </div>
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
                      <span className={`px-2 py-0.5 rounded font-mono-data text-xs ${
                        item.slaStatus === 'Overdue'
                          ? 'bg-error-container text-error'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {item.waitingSince}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate('/approvals')}
                        className="text-primary p-2 hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center"
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
        </div>

        {/* Critical Deadlines */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-heading-section text-heading-section">Deadline Kritis</h4>
            <span className="material-symbols-outlined text-danger text-2xl" aria-label="Warning">warning</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-danger">
              <div className="flex-1">
                <p className="font-label-sm text-on-surface text-sm font-medium">Infrastructure Maintenance</p>
                <p className="text-secondary font-caption-xs text-xs">PT Telkom Indonesia</p>
              </div>
              <div className="text-right">
                <p className="text-danger font-bold text-label-sm text-sm">2 Hari Lagi</p>
                <p className="text-secondary font-caption-xs text-xs">25 Oct</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-status-orange">
              <div className="flex-1">
                <p className="font-label-sm text-on-surface text-sm font-medium">Smart City Cloud Integration</p>
                <p className="text-secondary font-caption-xs text-xs">DKI Jakarta Smart System</p>
              </div>
              <div className="text-right">
                <p className="text-status-orange font-bold text-label-sm text-sm">4 Hari Lagi</p>
                <p className="text-secondary font-caption-xs text-xs">27 Oct</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-warning">
              <div className="flex-1">
                <p className="font-label-sm text-on-surface text-sm font-medium">Mobile App Deployment</p>
                <p className="text-secondary font-caption-xs text-xs">Telkomsel Digital</p>
              </div>
              <div className="text-right">
                <p className="text-warning font-bold text-label-sm text-sm">5 Hari Lagi</p>
                <p className="text-secondary font-caption-xs text-xs">28 Oct</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 border border-border rounded-lg font-label-sm text-secondary hover:bg-surface-container-high transition-colors text-sm font-semibold">
            Lihat Semua Jadwal Kritis
          </button>
        </div>
      </div>
    </div>
  );
}
