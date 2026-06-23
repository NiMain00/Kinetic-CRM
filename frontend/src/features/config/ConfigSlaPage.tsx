import React, { useState } from 'react';
import type { SlaConfig } from '../../types/domain/users';

interface ConfigSlaViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const INITIAL_SLA_CONFIGS: SlaConfig[] = [
  { id: 'SLA-001', name: 'Prospek Review SLA', entityType: 'prospek', warningThreshold: 24, criticalThreshold: 48, unit: 'hours', escalationRole: 'Branch Manager', active: true },
  { id: 'SLA-002', name: 'RKS Approval SLA', entityType: 'rks', warningThreshold: 48, criticalThreshold: 72, unit: 'hours', escalationRole: 'PM', active: true },
  { id: 'SLA-003', name: 'LPHS Review SLA', entityType: 'lphs', warningThreshold: 3, criticalThreshold: 5, unit: 'days', escalationRole: 'Dept Head', active: true },
  { id: 'SLA-004', name: 'General Approval SLA', entityType: 'approval', warningThreshold: 24, criticalThreshold: 48, unit: 'hours', escalationRole: 'Admin', active: false },
];

const ENTITY_LABELS: Record<string, string> = { prospek: 'Prospek Review', rks: 'RKS Approval', lphs: 'LPHS Review', approval: 'General Approval' };

export default function ConfigSlaView({ onShowNotification }: ConfigSlaViewProps) {
  const [configs, setConfigs] = useState<SlaConfig[]>(INITIAL_SLA_CONFIGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfig | null>(null);

  const [formName, setFormName] = useState('');
  const [formEntityType, setFormEntityType] = useState<SlaConfig['entityType']>('approval');
  const [formWarning, setFormWarning] = useState('24');
  const [formCritical, setFormCritical] = useState('48');
  const [formUnit, setFormUnit] = useState<'hours' | 'days'>('hours');
  const [formEscalation, setFormEscalation] = useState('Admin');
  const [formActive, setFormActive] = useState(true);

  const handleOpenEdit = (config: SlaConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormEntityType(config.entityType);
    setFormWarning(String(config.warningThreshold));
    setFormCritical(String(config.criticalThreshold));
    setFormUnit(config.unit);
    setFormEscalation(config.escalationRole);
    setFormActive(config.active);
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formWarning || !formCritical) {
      onShowNotification('Nama dan threshold wajib diisi.', 'error');
      return;
    }
    if (editingConfig) {
      setConfigs(configs.map(c => c.id === editingConfig.id ? { ...c, name: formName, entityType: formEntityType, warningThreshold: Number(formWarning), criticalThreshold: Number(formCritical), unit: formUnit, escalationRole: formEscalation, active: formActive } : c));
      onShowNotification(`SLA ${formName} berhasil diperbarui.`, 'success');
    } else {
      const newConfig: SlaConfig = { id: `SLA-${String(configs.length + 1).padStart(3, '0')}`, name: formName, entityType: formEntityType, warningThreshold: Number(formWarning), criticalThreshold: Number(formCritical), unit: formUnit, escalationRole: formEscalation, active: formActive };
      setConfigs([...configs, newConfig]);
      onShowNotification(`SLA ${formName} berhasil ditambahkan.`, 'success');
    }
    setDrawerOpen(false);
  };

  const handleToggle = (id: string) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, active: !c.active } : c));
    const target = configs.find(c => c.id === id);
    onShowNotification(`SLA ${target?.name} sekarang ${target?.active ? 'NON-AKTIF' : 'AKTIF'}.`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">SLA Management</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">SLA & Escalation Configuration</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Atur batas waktu layanan (SLA) dan aturan eskalasi untuk setiap jenis persetujuan.</p>
        </div>
        <button onClick={() => { setEditingConfig(null); setFormName(''); setFormEntityType('approval'); setFormWarning('24'); setFormCritical('48'); setFormUnit('hours'); setFormEscalation('Admin'); setFormActive(true); setDrawerOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold text-xs cursor-pointer shadow-sm">
          <span className="material-symbols-outlined text-[16px]">add</span> Tambah SLA
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-xs"><p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total SLA Rules</p><p className="text-xl font-extrabold text-slate-800 mt-1">{configs.length}</p></div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-xs"><p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Active Rules</p><p className="text-xl font-extrabold text-success mt-1">{configs.filter(c => c.active).length}</p></div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-xs"><p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Avg Warning Threshold</p><p className="text-xl font-extrabold text-warning mt-1">{Math.round(configs.reduce((s, c) => s + c.warningThreshold, 0) / configs.length)} {configs[0]?.unit}</p></div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-xs"><p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Avg Critical Threshold</p><p className="text-xl font-extrabold text-danger mt-1">{Math.round(configs.reduce((s, c) => s + c.criticalThreshold, 0) / configs.length)} {configs[0]?.unit}</p></div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama SLA</th>
                    <th className="px-6 py-3.5">Entity Type</th>
                    <th className="px-6 py-3.5 text-right">Warning</th>
                    <th className="px-6 py-3.5 text-right">Critical</th>
                    <th className="px-6 py-3.5">Escalation Role</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {configs.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600 badge-compact">{ENTITY_LABELS[c.entityType] || c.entityType}</span></td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-warning">{c.warningThreshold} {c.unit === 'hours' ? 'h' : 'd'}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-danger">{c.criticalThreshold} {c.unit === 'hours' ? 'h' : 'd'}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold badge-compact">{c.escalationRole}</span></td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggle(c.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${c.active ? 'bg-success' : 'bg-slate-300'}`}>
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${c.active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer btn-compact" title="Sunting"><span className="material-symbols-outlined text-[18px] icon-compact">edit</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editingConfig ? 'Edit SLA Rule' : 'Tambah SLA Rule'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editingConfig ? `ID: ${editingConfig.id}` : 'Buat aturan SLA baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Nama SLA *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Prospek Review SLA" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Entity Type</label>
                <select value={formEntityType} onChange={e => setFormEntityType(e.target.value as SlaConfig['entityType'])} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                  <option value="prospek">Prospek Review</option>
                  <option value="rks">RKS Approval</option>
                  <option value="lphs">LPHS Review</option>
                  <option value="approval">General Approval</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Warning Threshold *</label>
                  <input type="number" value={formWarning} onChange={e => setFormWarning(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required min={1} />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Critical Threshold *</label>
                  <input type="number" value={formCritical} onChange={e => setFormCritical(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required min={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Unit Waktu</label>
                  <select value={formUnit} onChange={e => setFormUnit(e.target.value as 'hours' | 'days')} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Escalation Role</label>
                  <select value={formEscalation} onChange={e => setFormEscalation(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    <option>Admin</option>
                    <option>PM</option>
                    <option>Branch Manager</option>
                    <option>Dept Head</option>
                    <option>Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="slaStatus" checked={formActive} onChange={() => setFormActive(true)} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="slaStatus" checked={!formActive} onChange={() => setFormActive(false)} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editingConfig ? 'Simpan Perubahan' : 'Buat SLA'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
