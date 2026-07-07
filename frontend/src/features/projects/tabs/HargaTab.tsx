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
  const removeProjectCompetitor = useProjectStore((s) => s.removeProjectCompetitor);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);

  const [hargaPenawaran, setHargaPenawaran] = useState(project?.pricing?.value || 0);
  const [marginPercentage, setMarginPercentage] = useState(project?.pricing?.margin || 0);
  const [pricingNotes, setPricingNotes] = useState(project?.pricing?.note || '');
  const [bottomPrice, setBottomPrice] = useState(project?.pricing?.bottomPrice || 0);
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
    setBottomPrice(project?.pricing?.bottomPrice || 0);
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
      bottomPrice,
    });
  }, [hargaPenawaran, marginPercentage, pricingNotes, bottomPrice]);

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
    navigate(`/projects/${project.id}/kompetitor`);
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

  const handleRemoveCompetitor = (competitorId: string) => {
    if (!project?.id) return;
    removeProjectCompetitor(project.id, competitorId);
    onShowNotification?.('Kompetitor berhasil dihapus.', 'success');
  };

  const grossMargin = (hargaPenawaran * marginPercentage) / 100;
  const cogs = hargaPenawaran - grossMargin;

  // Compute lowest competitor price (only entries with estPrice > 0)
  const competitorPrices = competitors
    .filter((c) => c.estPrice > 0)
    .map((c) => c.estPrice);
  const lowestCompetitorPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;

  // Effective bottom price: takes the HIGHER of manual bottomPrice vs lowest competitor price
  // This means if a competitor's price is higher than our manual floor, our floor rises to match
  const effectiveBottomPrice = Math.max(bottomPrice, lowestCompetitorPrice);
  const isCompetitorPushed = lowestCompetitorPrice > bottomPrice;

  // Validation
  const isBelowBottomPrice = effectiveBottomPrice > 0 && hargaPenawaran < effectiveBottomPrice;
  const isAtBottomPrice = effectiveBottomPrice > 0 && hargaPenawaran === effectiveBottomPrice;

  // Helper: check if a competitor row is the lowest priced one
  const isLowestCompetitor = (row: CompetitorEntry) =>
    lowestCompetitorPrice > 0 && row.estPrice === lowestCompetitorPrice;

  const competitorColumns: Column<CompetitorEntry>[] = [
    { key: 'name', header: 'Nama Kompetitor', render: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{row.name}</span>
        {isLowestCompetitor(row) && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider whitespace-nowrap">
            Harga Terendah
          </span>
        )}
      </div>
    )},
    { key: 'estPrice', header: 'Estimasi Harga', align: 'right', render: (row) => (
      <span className={`font-mono font-semibold ${isLowestCompetitor(row) ? 'text-warning' : ''}`}>
        {formatCurrency(row.estPrice)}
      </span>
    )},
    { key: 'advantages', header: 'Kelebihan', render: (row) => (
      <div className="flex flex-col gap-1">
        {row.advantages.map((adv, i) => (
          <span key={i} className="bg-status-indigo/10 text-status-indigo px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check_box</span>
            {adv}
          </span>
        ))}
      </div>
    )},
    { key: 'notes', header: 'Keterangan', render: (row) => <span className="text-secondary text-xs">{row.notes}</span> },
    { key: 'id', header: '', render: (row) => (
      <button
        onClick={() => handleRemoveCompetitor(row.id)}
        className="text-danger hover:text-danger hover:bg-danger/10 rounded-lg p-1.5 transition-all"
        title="Hapus kompetitor"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h3 className="font-heading-section text-heading-section">Rincian Nilai Penawaran</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
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
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <CurrencyInput
                label="Harga Minimum (Bottom Price)"
                value={bottomPrice}
                onChange={(val) => setBottomPrice(val ?? 0)}
                placeholder="Rp 0"
              />
              <p className="text-[10px] text-secondary">Harga terendah yang boleh ditawarkan. Jika harga penawaran di bawah harga minimum, akan muncul peringatan.</p>
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
          {/* Bottom Price Warning */}
          {isBelowBottomPrice && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 dark:text-red-400 mt-0.5">warning</span>
              <div className="text-xs space-y-1">
                <span className="font-semibold text-red-700 dark:text-red-400 block">
                  Harga penawaran ({formatCurrency(hargaPenawaran)}) berada di bawah harga minimum ({formatCurrency(effectiveBottomPrice)}). Silakan naikkan harga penawaran.
                </span>
                {isCompetitorPushed && (
                  <span className="text-red-500 dark:text-red-300 block">
                    ⬆ Harga minimum dinaikkan dari {formatCurrency(bottomPrice)} → {formatCurrency(lowestCompetitorPrice)} berdasarkan harga termurah kompetitor.
                  </span>
                )}
              </div>
            </div>
          )}
          {isAtBottomPrice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 mt-0.5">info</span>
              <div className="text-xs space-y-1">
                <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                  Harga penawaran sama dengan harga minimum ({formatCurrency(effectiveBottomPrice)}).
                </span>
                {isCompetitorPushed && (
                  <span className="text-amber-600 dark:text-amber-300 block">
                    ⬆ Harga minimum dinaikkan dari {formatCurrency(bottomPrice)} → {formatCurrency(lowestCompetitorPrice)} berdasarkan harga termurah kompetitor.
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Info: bottom price pushed by competitor (no warning, just FYI) */}
          {isCompetitorPushed && !isBelowBottomPrice && !isAtBottomPrice && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400 mt-0.5">trending_up</span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Harga minimum dinaikkan dari {formatCurrency(bottomPrice)} → {formatCurrency(lowestCompetitorPrice)} berdasarkan harga termurah kompetitor. Harga penawaran masih aman.
              </span>
            </div>
          )}
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
          <div className="bg-gradient-to-br from-emerald-600 to-green-800 p-6 text-white">
            <h4 className="font-semibold uppercase tracking-widest text-xs text-white/90 mb-2">Ringkasan Finansial</h4>
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
            {effectiveBottomPrice > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-secondary font-semibold">Harga Minimum</span>
                <div className="flex items-center gap-2">
                  {isCompetitorPushed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">DARI KOMPETITOR</span>
                  )}
                  <span className={`font-semibold font-mono ${isBelowBottomPrice ? 'text-danger' : 'text-on-surface'}`}>{formatCurrency(effectiveBottomPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-heading-section text-heading-section mb-4">Perbandingan Harga Kompetitor</h3>
        <Table
          columns={competitorColumns}
          data={[...competitors].sort((a, b) => {
            if (a.estPrice === 0) return 1;
            if (b.estPrice === 0) return -1;
            return a.estPrice - b.estPrice;
          })}
          keyExtractor={(row) => (row as CompetitorEntry).id}
          emptyState={<p className="text-sm text-secondary">Belum ada data kompetitor</p>}
        />
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="col-span-12 sm:col-span-3">
            <Input label="Nama Kompetitor" value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="Nama kompetitor..." />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <CurrencyInput label="Estimasi Harga" value={Number(newCompPrice) || 0} onChange={(val) => setNewCompPrice(String(val ?? ''))} placeholder="Rp 0" />
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
