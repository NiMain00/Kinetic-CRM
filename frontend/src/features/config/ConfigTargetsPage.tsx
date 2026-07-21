import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select } from '@/components/ui';
import toast from 'react-hot-toast';
import type { KpiTarget } from '@/types/domain/config';
import { useConfigStore } from '@/stores/configStore';

const PERIODS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027'];

export default function ConfigTargetsPage() {
  const targets = useConfigStore((s) => s.kpiTargets);
  const addConfigData = useConfigStore((s) => s.addConfigData);
  const updateConfigData = useConfigStore((s) => s.updateConfigData);
  const fetchKpiTargets = useConfigStore((s) => s.fetchKpiTargets);
  const [selectedPeriod, setSelectedPeriod] = useState('Q2 2026');

  useEffect(() => {
    fetchKpiTargets();
  }, [fetchKpiTargets]);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<KpiTarget | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('KPI');
  const [formTargetValue, setFormTargetValue] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const filtered = targets.filter(t => t.period === selectedPeriod);

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormName('');
    setFormCategory('KPI');
    setFormTargetValue('');
    setFormUnit('');
    setFormDescription('');
    setShowForm(true);
  };

  const handleOpenEdit = (t: KpiTarget) => {
    setEditingTarget(t);
    setFormName(t.name);
    setFormCategory(t.category);
    setFormTargetValue(String(t.targetValue));
    setFormUnit(t.unit);
    setFormDescription(t.description);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formTargetValue) {
      toast.error('Nama dan nilai target wajib diisi.');
      return;
    }
    try {
      if (editingTarget) {
        await updateConfigData('kpiTargets', editingTarget.id, { name: formName, category: formCategory as KpiTarget['category'], targetValue: Number(formTargetValue), unit: formUnit, description: formDescription });
        toast.success(`Target ${formName} berhasil diperbarui.`);
      } else {
        const newTarget: KpiTarget = {
          id: crypto.randomUUID?.() || `TGT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: formName,
          category: formCategory as KpiTarget['category'],
          targetValue: Number(formTargetValue),
          actualValue: 0,
          unit: formUnit,
          period: selectedPeriod,
          description: formDescription,
        };
        await addConfigData('kpiTargets', newTarget);
        toast.success(`Target ${formName} berhasil ditambahkan.`);
      }
      setShowForm(false);
    } catch {
      toast.error('Gagal menyimpan target. Silakan coba lagi.');
    }
  };

  const formatValue = (t: KpiTarget) => {
    if (t.unit === 'Rp') return `Rp ${(t.targetValue / 1e9).toFixed(1)}B`;
    if (t.unit === '%') return `${t.targetValue}%`;
    if (t.unit === 'skor') return t.targetValue.toFixed(1);
    return `${t.targetValue} ${t.unit}`;
  };

  const formatActual = (t: KpiTarget) => {
    if (t.unit === 'Rp') return `Rp ${(t.actualValue / 1e9).toFixed(1)}B`;
    if (t.unit === '%') return `${t.actualValue}%`;
    if (t.unit === 'skor') return t.actualValue.toFixed(1);
    return `${t.actualValue} ${t.unit}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Target</h2>
          <p className="text-[11px] text-outline mt-0.5">Atur target KPI dan approval untuk setiap periode.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={handleOpenCreate}>
          Tambah Target
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Select
              label="Periode"
              options={PERIODS.map(p => ({ value: p, label: p }))}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Target</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{filtered.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Tercapai</p>
              <p className="text-xl font-extrabold text-success mt-1">{filtered.filter(t => t.actualValue >= t.targetValue).length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Belum Tercapai</p>
              <p className="text-xl font-extrabold text-warning mt-1">{filtered.filter(t => t.actualValue < t.targetValue).length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Avg Achievement</p>
              <p className="text-xl font-extrabold text-primary mt-1">
                {filtered.length > 0 ? Math.round(filtered.reduce((s, t) => s + (t.actualValue / t.targetValue) * 100, 0) / filtered.length) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-outline uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Target</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5 text-right">Nilai Target</th>
                    <th className="px-6 py-3.5 text-right">Realisasi</th>
                    <th className="px-6 py-3.5 text-center">Capaian</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((t) => {
                    const pct = Math.round((t.actualValue / t.targetValue) * 100);
                    return (
                      <tr key={t.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-on-surface text-xs">{t.name}</p>
                          <p className="text-[10px] text-outline">{t.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${t.category === 'KPI' ? 'bg-primary/10 text-primary' : 'bg-status-purple/10 text-status-purple'}`}>{t.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatValue(t)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-on-surface-variant">{t.actualValue > 0 ? formatActual(t) : '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-20 bg-surface-container rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? 'bg-success' : pct >= 75 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                            <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-success' : pct >= 75 ? 'text-warning' : 'text-danger'}`}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleOpenEdit(t)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer btn-compact" title="Edit">
                            <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-border flex justify-between items-center text-[10px] text-outline">
              <span>{filtered.length} target untuk {selectedPeriod}</span>
              <span>Sandbox environment</span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editingTarget ? 'Edit Target' : 'Tambah Target Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">Periode: {selectedPeriod}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              <div className="space-y-2">
                <label htmlFor="target-name" className="font-semibold text-on-surface block">Nama Target *</label>
                <input id="target-name" type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Win Rate" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="target-category" className="font-semibold text-on-surface block">Kategori</label>
                <select id="target-category" value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                  <option value="KPI">KPI</option>
                  <option value="Approval">Approval</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="target-value" className="font-semibold text-on-surface block">Nilai Target *</label>
                  <input id="target-value" type="number" value={formTargetValue} onChange={e => setFormTargetValue(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" step="any" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="target-unit" className="font-semibold text-on-surface block">Satuan</label>
                  <select id="target-unit" value={formUnit} onChange={e => setFormUnit(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                    <option value="%">%</option>
                    <option value="Rp">Rupiah</option>
                    <option value="unit">Unit</option>
                    <option value="jam">Jam</option>
                    <option value="skor">Skor</option>
                    <option value="hari">Hari</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="target-description" className="font-semibold text-on-surface block">Deskripsi</label>
                <textarea id="target-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" rows={3} placeholder="Deskripsi target" />
              </div>
            </form>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editingTarget ? 'Simpan Perubahan' : 'Buat Target'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
