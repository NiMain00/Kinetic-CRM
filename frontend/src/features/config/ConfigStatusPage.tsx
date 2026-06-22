import React, { useState } from 'react';

interface ConfigStatusViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ConfigStatusView({ onShowNotification }: ConfigStatusViewProps) {
  const [statuses, setStatuses] = useState([
    { id: '1', code: 'INIT_DRAFT', label: 'Drafting', color: '#585F6C', order: 10, enabled: true },
    { id: '2', code: 'PENDING_APR', label: 'Waiting Approval', color: '#D97706', order: 20, enabled: true },
    { id: '3', code: 'IN_PROGRESS', label: 'Executing', color: '#004B8B', order: 30, enabled: true },
    { id: '4', code: 'COMPLETED', label: 'Closed - Won', color: '#16A34A', order: 100, enabled: true },
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#7C3AED');
  const [newOrder, setNewOrder] = useState('40');

  const handleOpenDrawer = () => {
    setNewCode('');
    setNewLabel('');
    setNewColor('#7C3AED');
    setNewOrder('40');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newLabel) {
      onShowNotification('Kode status dan label wajib diisi.', 'error');
      return;
    }
    const newItem = {
      id: String(statuses.length + 1),
      code: newCode.toUpperCase().replace(/\s+/g, '_'),
      label: newLabel,
      color: newColor,
      order: Number(newOrder) || 10,
      enabled: true,
    };
    setStatuses([...statuses, newItem]);
    onShowNotification(`Status baru ${newItem.code} berhasil ditambahkan!`, 'success');
    handleCloseDrawer();
  };

  return (
    <div className="p-8 space-y-6 flex-1 overflow-y-auto relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-caption-xs font-caption-xs text-secondary text-xs mb-2">
            <span>Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Project Status Master</span>
          </nav>
          <h2 className="font-display-title text-display-title text-on-surface">Konfigurasi Status Proyek</h2>
          <p className="text-secondary text-body-main text-sm">
            Manage the lifecycle states of enterprise projects (GAP-04 &amp; CFG-03).
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <p className="text-secondary font-label-sm text-label-sm mb-1 uppercase tracking-wider text-xs">Total Status</p>
            <h3 className="font-display-title text-display-title text-primary text-2xl">{statuses.length}</h3>
            <div className="mt-4 flex items-center gap-2 text-success text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>System Synchronized</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl border border-border text-sm">
            <p className="text-secondary font-label-sm font-semibold mb-4 text-xs uppercase tracking-widest text-[#727782]">
              Lifecycle Overview
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Active Pipelines</span>
                <span className="font-mono-data text-mono-data bg-white px-2 py-0.5 rounded border font-bold">
                  {statuses.length}
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full mt-4 overflow-hidden flex">
                <div className="bg-primary w-3/4 h-full"></div>
                <div className="bg-secondary w-1/4 h-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-bright">
            <h4 className="font-heading-section text-heading-section text-on-surface text-base">Daftar Status</h4>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">No</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Status Code</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Display Label</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs">Badge Color</th>
                  <th className="px-6 py-4 font-label-sm text-secondary uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statuses.map((row, index) => (
                  <tr key={row.id} className="hover:bg-primary-fixed/20 transition-colors">
                    <td className="px-6 py-4 font-mono-data text-mono-data text-xs">{index + 1}</td>
                    <td className="px-6 py-4 font-label-sm font-bold text-on-surface font-mono">{row.code}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{ backgroundColor: `${row.color}15`, color: row.color, borderColor: `${row.color}35` }}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-secondary font-mono">
                        <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: row.color }}></div>
                        <span>{row.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => onShowNotification('Aksi modifikasi status ini ditangguhkan.', 'success')}
                          className="p-1 text-primary hover:bg-slate-100 rounded-lg text-lg"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer Overlay for Add Status screen */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseDrawer}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300"
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">add_box</span>
              <h3 className="font-heading-section text-heading-section text-on-surface">Tambah Status Proyek</h3>
            </div>
            <button className="p-2 hover:bg-surface-container rounded-full text-outline transition-all" onClick={handleCloseDrawer}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleCreateStatus} className="p-8 flex flex-col gap-6 flex-grow overflow-y-auto">
            <div className="space-y-1.5 text-sm">
              <label className="font-semibold text-on-surface-variant block">Status Code *</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg outline-none uppercase font-mono"
                placeholder="E.g. PROJECT_HALTED"
                type="text"
              />
              <p className="font-caption-xs text-xs text-secondary italic">System-level identifier. Use underscores, no spaces.</p>
            </div>

            <div className="space-y-1.5 text-sm">
              <label className="font-semibold text-on-surface-variant block">Display Label *</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg outline-none"
                placeholder="E.g. On Hold"
                type="text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Sort Order</label>
                <input
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg font-mono outline-none"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Active State</label>
                <div className="flex items-center gap-3 h-[40px]">
                  <span className="text-xs text-on-surface font-semibold bg-success/10 text-success p-1 px-3 rounded-full border border-success/20">
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="font-semibold text-on-surface-variant text-sm block">Badge Color (Visual Mapping)</label>
              <div className="p-4 border border-border rounded-xl bg-surface-bright flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
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
                    Preview Badge
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
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container shadow-md transition-all">
                Save Status
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
