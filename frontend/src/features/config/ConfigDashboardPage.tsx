import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import { configNavItems } from '@/routes/nav-items';

const ICON_CATEGORY_MAP: Record<string, string> = {
  Organisasi: 'account_tree',
  'Status Proyek': 'settings',
  Notifikasi: 'notifications_active',
  SLA: 'alarm',
  Role: 'badge',
  Target: 'track_changes',
  Workflow: 'alt_route',
  Integrasi: 'api',
  Upload: 'cloud_upload',
  Periode: 'calendar_month',
  'Tipe Pertanyaan': 'help_outline',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Organisasi: 'Atur struktur hierarki organisasi dan cabang',
  'Status Proyek': 'Kelola status siklus hidup proyek',
  Notifikasi: 'Konfigurasi template notifikasi dan event',
  SLA: 'Atur batas waktu layanan dan eskalasi',
  Role: 'Kelola peran dan hak akses pengguna',
  Target: 'Konfigurasi target KPI dan approval',
  Workflow: 'Atur alur kerja untuk setiap entitas',
  Integrasi: 'Kelola konektor integrasi sistem',
  Upload: 'Atur pengaturan upload file',
  Periode: 'Kelola periode fiskal',
  'Tipe Pertanyaan': 'Atur tipe pertanyaan kuesioner',
};

export default function ConfigDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = configNavItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 shadow-sm">
        <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
          <span className="font-semibold uppercase tracking-wider">Configuration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold uppercase tracking-wider">Dashboard</span>
        </nav>
        <h2 className="font-display-title text-base font-extrabold text-slate-900">Konfigurasi Sistem</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Pusat pengaturan dan konfigurasi seluruh modul sistem Kinetic CRM.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Cari konfigurasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              aria-label="Cari kategori konfigurasi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); toast.success(`Membuka ${item.label}`); }}
                className="bg-white border border-border rounded-xl p-5 text-left hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                aria-label={`Buka konfigurasi ${item.label}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">{ICON_CATEGORY_MAP[item.label] || 'settings'}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-800">{item.label}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{CATEGORY_DESCRIPTIONS[item.label] || ''}</p>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 italic">
                Tidak ada kategori konfigurasi ditemukan untuk "{search}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
