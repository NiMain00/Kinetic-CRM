import React, { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import toast from 'react-hot-toast';
import type { Connector } from '@/types/domain/config';
import { useConfigStore } from '@/stores/configStore';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  connected: 'success',
  disconnected: 'warning',
  error: 'danger',
};

const TYPE_ICONS: Record<string, string> = {
  API: 'api',
  Webhook: 'webhook',
  Email: 'alternate_email',
  Database: 'storage',
  'Cloud Storage': 'cloud',
  LDAP: 'fingerprint',
};

export default function ConfigIntegrationPage() {
  const connectors = useConfigStore((s) => s.connectors);
  const updateConfigData = useConfigStore((s) => s.updateConfigData);

  const handleToggle = (id: string) => {
    const target = connectors.find(c => c.id === id);
    if (target) {
      updateConfigData('connectors', id, { active: !target.active });
      toast.success(`Konektor ${target.name} sekarang ${target.active ? 'NON-AKTIF' : 'AKTIF'}`);
    }
  };

  const handleTestConnection = (id: string) => {
    const target = connectors.find(c => c.id === id);
    if (!target) return;
    updateConfigData('connectors', id, { status: 'connected', lastTested: new Date().toLocaleString('id-ID') });
    toast.success(`Test koneksi ${target.name} berhasil!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 shadow-sm">
        <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
          <span className="font-semibold uppercase tracking-wider">Configuration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold uppercase tracking-wider">Integrasi</span>
        </nav>
        <h2 className="font-display-title text-base font-extrabold text-slate-900">Konfigurasi Integrasi</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Kelola konektor integrasi dengan sistem eksternal dan layanan pihak ketiga.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Konektor</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{connectors.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Aktif</p>
              <p className="text-xl font-extrabold text-success mt-1">{connectors.filter(c => c.active).length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tidak Aktif</p>
              <p className="text-xl font-extrabold text-warning mt-1">{connectors.filter(c => !c.active).length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Error</p>
              <p className="text-xl font-extrabold text-danger mt-1">{connectors.filter(c => c.status === 'error').length}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Konektor</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Aktif</th>
                    <th className="px-6 py-3.5">Terakhir Tes</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {connectors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg icon-compact">{TYPE_ICONS[c.type] || 'api'}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold badge-compact">{c.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_BADGE[c.status]} size="sm">{c.status === 'connected' ? 'Terhubung' : c.status === 'disconnected' ? 'Terputus' : 'Error'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggle(c.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${c.active ? 'bg-success' : 'bg-slate-300'}`}>
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${c.active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[10px] font-mono">{c.lastTested || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleTestConnection(c.id)} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors cursor-pointer btn-compact">
                          Test Koneksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center text-[10px] text-slate-400">
              <span>{connectors.length} konektor terdaftar</span>
              <span>Sandbox environment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
