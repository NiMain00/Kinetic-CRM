import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { configNavItems, filterNavItems } from '@/routes/nav-items';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Organisasi: 'Atur struktur hierarki organisasi dan cabang',
  'Status Proyek': 'Kelola status siklus hidup proyek',
  Notifikasi: 'Konfigurasi template notifikasi dan event',
  SLA: 'Atur batas waktu layanan dan eskalasi',
  Target: 'Konfigurasi target KPI dan approval',
  'Alur Kerja': 'Atur alur kerja untuk setiap entitas',
  'Stage Rules': 'Konfigurasi aturan transisi stage proyek',
  Integrasi: 'Kelola konektor integrasi sistem',
  Upload: 'Atur pengaturan upload file',
  Periode: 'Kelola periode fiskal',
  'Tipe Pertanyaan': 'Atur tipe pertanyaan kuesioner',
  'Access Control': 'Kelola hak akses berdasarkan peran dan departemen',
  'Konfigurasi Input': 'Atur opsi input dan validasi formulir',
};

const ICON_MAP: Record<string, string> = {
  Organisasi: 'account_tree',
  'Status Proyek': 'settings',
  Notifikasi: 'notifications_active',
  SLA: 'alarm',
  Target: 'track_changes',
  'Alur Kerja': 'alt_route',
  'Stage Rules': 'rule',
  Integrasi: 'api',
  Upload: 'cloud_upload',
  Periode: 'calendar_month',
  'Tipe Pertanyaan': 'help_outline',
  'Access Control': 'security',
  'Konfigurasi Input': 'checklist',
};

export default function ConfigDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const userRole = (user as { roleName?: string })?.roleName || '';
  const roles = useMasterDataStore((s) => s.roles);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => { fetchEntity('roles'); }, [fetchEntity]);
  const roleConfig = roles.find((r) => r.name === userRole);
  const oldPermissions = roleConfig?.permissions || [];
  const userId = (user as { id?: string })?.id;
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  const newRbacPerms = userId
    ? ['config:access'].filter((p) => authz.hasPermission(userId, p, { departmentId: activeDeptId }))
    : [];
  const userPermissions = [...new Set([...oldPermissions, ...newRbacPerms])];
  const visibleItems = filterNavItems(configNavItems, userRole, userPermissions);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-on-surface">Konfigurasi Sistem</h2>
        <p className="text-sm text-secondary mt-1">Pilih menu konfigurasi di bawah untuk mengubah pengaturan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="bg-surface-container-lowest border border-border rounded-xl p-6 text-left hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-4 flex-wrap">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
