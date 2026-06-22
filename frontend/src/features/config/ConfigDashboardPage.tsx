import React from 'react';
import { useNavigate } from 'react-router-dom';
import { configNavItems } from '@/routes/nav-items';

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

const ICON_MAP: Record<string, string> = {
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

export default function ConfigDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-on-surface">Konfigurasi Sistem</h2>
        <p className="text-sm text-secondary mt-1">Pilih menu konfigurasi di bawah untuk mengubah pengaturan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {configNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white border border-border rounded-xl p-6 text-left hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">{ICON_MAP[item.label] || 'settings'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{item.label}</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{CATEGORY_DESCRIPTIONS[item.label] || ''}</p>
                <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
