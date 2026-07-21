import React, { useState, useEffect } from 'react';
import { useMasterDataStore } from '@/stores/masterDataStore';
import type { MasterProjectStatus } from '@/stores/masterDataStore';

interface ConfigStatusViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ConfigStatusView({ onShowNotification }: ConfigStatusViewProps) {
  const statuses = useMasterDataStore((s) => s.projectStatuses);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => {
    fetchEntity('projectStatuses');
  }, [fetchEntity]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#7C3AED');
  const [newOrder, setNewOrder] = useState('40');
  const [editId, setEditId] = useState<string | null>(null);

  const handleOpenDrawer = () => {
    setEditId(null);
    setNewCode('');
    setNewLabel('');
    setNewColor('#7C3AED');
    setNewOrder('40');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (status: MasterProjectStatus) => {
    setEditId(status.id);
    setNewCode(status.code);
    setNewLabel(status.label);
    setNewColor(status.color_hex);
    setNewOrder(String(status.sort_order));
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newLabel) {
      onShowNotification('Kode status dan label wajib diisi.', 'error');
      return;
    }

    if (editId) {
      updateData('projectStatuses', editId, {
        code: newCode.toUpperCase().replace(/\s+/g, '_'),
        label: newLabel,
        color_hex: newColor,
        sort_order: Number(newOrder) || 10,
      });
      onShowNotification(`Status ${newCode} berhasil diperbarui!`, 'success');
    } else {
      const newItem: MasterProjectStatus = {
        id: crypto.randomUUID?.() || `PS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: newCode.toUpperCase().replace(/\s+/g, '_'),
        label: newLabel,
        description: newLabel,
        color_hex: newColor,
        text_color_hex: '#FFFFFF',
        sort_order: Number(newOrder) || 10,
        is_system: false,
        is_terminal: false,
        is_active: true,
        applicable_to: 'both',
      };
      addData('projectStatuses', newItem);
      onShowNotification(`Status baru ${newItem.code} berhasil ditambahkan!`, 'success');
    }
    handleCloseDrawer();
  };

  const handleToggle = (id: string) => {
    const target = statuses.find((s) => s.id === id);
    if (target) {
      updateData('projectStatuses', id, { is_active: !target.is_active });
      onShowNotification(
        `Status ${target.code} sekarang ${target.is_active ? 'NON-AKTIF' : 'AKTIF'}.`,
        'success',
      );
    }
  };

  const activeCount = statuses.filter((s) => s.is_active).length;
  const inactiveCount = statuses.filter((s) => !s.is_active).length;

  return (
    <div className="p-8 space-y-6 flex-1 overflow-y-auto relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Konfigurasi Status Proyek</h2>
          <p className="text-secondary text-body-main text-sm">
            Kelola status siklus hidup proyek perusahaan (GAP-04 &amp; CFG-03).
          </p>
        </div>
        <button
          onClick={handleOpenDrawer}
          className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-lg font-label-sm text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] font-semibold"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Status Baru
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-border shadow-sm">
            <p className="text-secondary font-label-sm text-label-sm mb-1 uppercase tracking-wider text-xs">Total Status</p>
            <h3 className="font-display-title text-display-title text-primary text-2xl">{statuses.length}</h3>
            <div className="mt-4 flex items-center gap-2 text-success text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Tersinkronisasi Sistem</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl border border-border text-sm">
            <p className="text-secondary font-label-sm font-semibold mb-4 text-xs uppercase tracking-widest text-[#727782]">
              Ikhtisar Siklus Hidup
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Aktif</span>
                <span className="font-mono-data text-mono-data bg-surface-container-lowest px-2 py-0.5 rounded border font-bold text-success">
                  {activeCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Tidak Aktif</span>
                <span className="font-mono-data text-mono-data bg-surface-container-lowest px-2 py-0.5 rounded border font-bold text-danger">
                  {inactiveCount}
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full mt-4 overflow-hidden flex">
                <div
                  className="bg-success h-full transition-all"
                  style={{ width: statuses.length > 0 ? `${(activeCount / statuses.length) * 100}%` : '0%' }}
                ></div>
                <div className="bg-surface-container-highest h-full" style={{ width: statuses.length > 0 ? `${(inactiveCount / statuses.length) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-bright">
            <h4 className="font-heading-section text-heading-section text-on-surface text-base">Daftar Status</h4>
          </div>

          <div className="overflow-x-auto scrollbar-none text-sm table-mobile-compact">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">No</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Kode Status</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Label Tampilan</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Warna Badge</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs text-center">Aktif</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statuses.map((row, index) => (
                  <tr key={row.id} className="hover:bg-primary-fixed/20 transition-colors">
                    <td className="px-6 py-4 font-mono-data text-mono-data text-xs">{index + 1}</td>
                    <td className="px-6 py-4 font-label-sm font-bold text-on-surface font-mono">{row.code}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold border badge-compact"
                        style={{ backgroundColor: `${row.color_hex}15`, color: row.color_hex, borderColor: `${row.color_hex}35` }}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-secondary font-mono">
                        <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: row.color_hex }}></div>
                        <span>{row.color_hex}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(row.id)}
                        className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${row.is_active ? 'bg-success' : 'bg-surface-container-highest'}`}
                      >
                        <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${row.is_active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1 text-primary hover:bg-surface-container rounded-lg text-lg btn-compact"
                      >
                        <span className="material-symbols-outlined icon-compact">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer Overlay for Add/Edit Status */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseDrawer}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-surface-container-lowest z-[70] shadow-2xl flex flex-col transition-transform duration-300"
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                {editId ? 'edit' : 'add_box'}
              </span>
              <h3 className="font-heading-section text-heading-section text-on-surface">
                {editId ? 'Sunting Status Proyek' : 'Tambah Status Proyek'}
              </h3>
            </div>
            <button className="p-2 hover:bg-surface-container rounded-full text-outline transition-all" onClick={handleCloseDrawer}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4 sm:gap-6 flex-grow overflow-y-auto">
            <div className="space-y-1.5 text-sm">
              <label htmlFor="statusCode" className="font-semibold text-on-surface-variant block">Kode Status *</label>
              <input
                id="statusCode"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg outline-none uppercase font-mono"
                placeholder="Contoh: PROJECT_HALTED"
                type="text"
              />
              <p className="font-caption-xs text-xs text-secondary italic">Identifier tingkat sistem. Gunakan underscore, tanpa spasi.</p>
            </div>

            <div className="space-y-1.5 text-sm">
              <label htmlFor="statusLabel" className="font-semibold text-on-surface-variant block">Label Tampilan *</label>
              <input
                id="statusLabel"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg outline-none"
                placeholder="Contoh: On Hold"
                type="text"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label htmlFor="statusOrder" className="font-semibold text-on-surface-variant block">Urutan</label>
                <input
                  id="statusOrder"
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg font-mono outline-none"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Status Aktif</label>
                <div className="flex items-center gap-3 h-[40px]">
                    <span className="text-xs text-on-surface font-semibold bg-success/10 text-success p-1 px-3 rounded-full border border-success/20">
                    Diaktifkan
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="statusColor" className="font-semibold text-on-surface-variant text-sm block">Warna Badge (Pemetaan Visual)</label>
              <div className="p-4 border border-border rounded-xl bg-surface-bright flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      id="statusColor"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                      type="color"
                    />
                    <span className="font-mono">{newColor}</span>
                  </div>
                  <div
                    className="px-4 py-1.5 rounded-full border text-xs font-semibold"
                    style={{ backgroundColor: `${newColor}15`, color: newColor, borderColor: `${newColor}35` }}
                  >
                    Pratinjau Badge
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-border flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 py-2.5 border border-border rounded-lg font-semibold text-secondary hover:bg-surface-container transition-all"
              >
                Batal
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container shadow-md transition-all">
                {editId ? 'Perbarui Status' : 'Simpan Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
