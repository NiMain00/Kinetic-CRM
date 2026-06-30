import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, CompetitorEntry, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency } from '@/utils/formatters';
import { Button, Input, Table, CurrencyInput } from '@/components/ui';
import type { Column } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function HargaTab({ project, onShowNotification }: TabProps) {
  const navigate = useNavigate();
  const updateProjectPricing = useProjectStore((s) => s.updateProjectPricing);
  const addProjectCompetitor = useProjectStore((s) => s.addProjectCompetitor);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);

  const [hargaPenawaran, setHargaPenawaran] = useState(project?.pricing?.value || 0);
  const [marginPercentage, setMarginPercentage] = useState(project?.pricing?.margin || 0);
  const [pricingNotes, setPricingNotes] = useState(project?.pricing?.note || '');
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('');
  const [newCompAdv, setNewCompAdv] = useState('');
  const [newCompNote, setNewCompNote] = useState('');

  // Use project?.competitors directly as source of truth (no local state needed)
  const competitors = project?.competitors || [];

  // Sync from project when switching projects
  useEffect(() => {
    setHargaPenawaran(project?.pricing?.value || 0);
    setMarginPercentage(project?.pricing?.margin || 0);
    setPricingNotes(project?.pricing?.note || '');
  }, [project?.id]);

  // Auto-save pricing data to store whenever form fields change
  // Uses a ref to avoid saving on initial mount (only save on user edits)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!project?.id) return;
    updateProjectPricing(project.id, {
      value: hargaPenawaran,
      margin: marginPercentage,
      note: pricingNotes,
    });
  }, [hargaPenawaran, marginPercentage, pricingNotes]);

  const handleSavePricing = () => {
    // Pricing auto-saves on change, this is now a no-op but kept for button compatibility
  };

  const handleConfirmPricing = () => {
    if (!project?.id) return;
    // Add timeline event
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Harga Penawaran Dikonfirmasi',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: `Harga penawaran ${formatCurrency(hargaPenawaran)} dengan margin ${marginPercentage}% telah dikonfirmasi.`,
    };
    addTimelineEvent(project.id, event);
    // Navigate to kompetitor tab
    navigate(`/project/${project.id}/kompetitor`);
    onShowNotification?.('Harga berhasil dikonfirmasi. Lanjut ke analisis kompetitor.', 'success');
  };

  const handleAddCompetitor = () => {
    if (!project?.id) return;
    if (!newCompName) return;
    const newItem: CompetitorEntry = {
      id: `comp-${Date.now()}`,
      name: newCompName,
      estPrice: Number(newCompPrice) || 0,
      advantages: newCompAdv ? newCompAdv.split(',').map(s => s.trim()) : [],
      notes: newCompNote || '-',
    };
    addProjectCompetitor(project.id, newItem);
    setNewCompName(''); setNewCompPrice(''); setNewCompAdv(''); setNewCompNote('');
  };

  const grossMargin = (hargaPenawaran * marginPercentage) / 100;
  const cogs = hargaPenawaran - grossMargin;

  const competitorColumns: Column<CompetitorEntry>[] = [
    { key: 'name', header: 'Nama Kompetitor', render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: 'estPrice', header: 'Estimasi Harga', align: 'right', render: (row) => <span className="font-mono">{formatCurrency(row.estPrice)}</span> },
    { key: 'advantages', header: 'Kelebihan', render: (row) => (
      <span className="bg-status-indigo/10 text-status-indigo px-2.5 py-0.5 rounded text-xs font-semibold">{row.advantages.join(', ')}</span>
    )},
    { key: 'notes', header: 'Keterangan', render: (row) => <span className="text-secondary text-xs">{row.notes}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h3 className="font-heading-section text-heading-section">Rincian Nilai Penawaran</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <CurrencyInput
                label="Harga Penawaran"
                value={hargaPenawaran}
                onChange={(val) => setHargaPenawaran(val ?? 0)}
                placeholder="Rp 0"
                required
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="font-semibold text-on-surface-variant block">Margin (%)*</label>
              <div className="relative">
                <input
                  value={marginPercentage}
                  onChange={e => setMarginPercentage(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-4 py-3 font-mono"
                  type="number"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-mono">%</span>
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="font-semibold text-on-surface-variant block">Catatan Harga</label>
              <textarea
                value={pricingNotes}
                onChange={e => setPricingNotes(e.target.value)}
                rows={3}
                className="w-full border border-border rounded-lg p-3 outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
          <div className="border-t border-border pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleSavePricing} leftIcon={<span className="material-symbols-outlined text-sm">save</span>}>
              Simpan Draft
            </Button>
            <button
              onClick={handleConfirmPricing}
              className="px-5 py-2.5 bg-success text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 shadow-sm"
            >
              Konfirmasi Harga & Lanjut
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="bg-primary-container p-6 text-on-primary-container">
            <h4 className="font-semibold uppercase tracking-widest text-xs opacity-80 mb-2">Ringkasan Finansial</h4>
            <div className="text-3xl font-display-title font-bold text-white">{formatCurrency(hargaPenawaran)}</div>
            <p className="text-xs mt-1 italic text-white/80">*Belum termasuk pajak PPN</p>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-secondary font-semibold">Gross Margin ({marginPercentage}%)</span>
              <span className="text-on-surface font-semibold text-success">{formatCurrency(grossMargin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-semibold">Estimasi COGS</span>
              <span className="text-on-surface font-semibold">{formatCurrency(cogs)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-heading-section text-heading-section mb-4">Perbandingan Harga Kompetitor</h3>
        <Table
          columns={competitorColumns}
          data={competitors}
          keyExtractor={(row) => (row as CompetitorEntry).id}
          emptyState={<p className="text-sm text-secondary">Belum ada data kompetitor</p>}
        />
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 sm:col-span-3">
            <Input label="Nama Kompetitor" value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="Nama kompetitor..." />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <Input label="Estimasi Harga" value={newCompPrice} onChange={e => setNewCompPrice(e.target.value)} placeholder="Contoh: 142500000000" type="number" />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <Input label="Kelebihan" value={newCompAdv} onChange={e => setNewCompAdv(e.target.value)} placeholder="Pisahkan dengan koma" />
          </div>
          <div className="col-span-12 sm:col-span-2">
            <Input label="Catatan" value={newCompNote} onChange={e => setNewCompNote(e.target.value)} placeholder="Catatan..." />
          </div>
          <div className="col-span-12 sm:col-span-1">
            <Button onClick={handleAddCompetitor} size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>}>
              Tambah
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
