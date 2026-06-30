import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, CompetitorEntry, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function KompetitorTab({ project, onShowNotification }: TabProps) {
  const navigate = useNavigate();
  const addProjectCompetitor = useProjectStore((s) => s.addProjectCompetitor);
  const removeProjectCompetitor = useProjectStore((s) => s.removeProjectCompetitor);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  // Use project?.competitors directly as source of truth (no local state)
  const competitors = project?.competitors || [];
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('');
  const [newCompAdv, setNewCompAdv] = useState('');
  const [newCompNote, setNewCompNote] = useState('');

  const handleAddCompetitor = () => {
    if (!project?.id) return;
    if (!newCompName) {
      onShowNotification?.('Nama kompetitor harus diisi.', 'error');
      return;
    }
    const newItem: CompetitorEntry = {
      id: `comp-${Date.now()}`,
      name: newCompName,
      estPrice: Number(newCompPrice) || 0,
      advantages: newCompAdv ? newCompAdv.split(',').map((s) => s.trim()) : [],
      notes: newCompNote || '-',
    };
    addProjectCompetitor(project.id, newItem);
    setNewCompName('');
    setNewCompPrice('');
    setNewCompAdv('');
    setNewCompNote('');
    onShowNotification?.(`Kompetitor ${newItem.name} berhasil ditambahkan ke proyek.`, 'success');
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    if (!project?.id) return;
    removeProjectCompetitor(project.id, competitorId);
    onShowNotification?.('Kompetitor berhasil dihapus.', 'success');
  };

  // Compute lowest competitor price for badge
  const competitorPrices = competitors.filter((c) => c.estPrice > 0).map((c) => c.estPrice);
  const lowestCompetitorPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
  const isLowestCompetitor = (row: CompetitorEntry) =>
    lowestCompetitorPrice > 0 && row.estPrice === lowestCompetitorPrice;

  const handleConfirmCompetitor = () => {
    if (!project?.id) return;
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Analisis Kompetitor Selesai',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'submit',
      description: `${competitors.length} kompetitor tercatat dalam analisis.`,
    };
    addTimelineEvent(project.id, event);
    navigate(`/project/${project.id}/pemenang`);
    onShowNotification?.('Analisis kompetitor selesai. Lanjut ke penentuan hasil tender.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-heading-section text-heading-section mb-4">Competitor Breakdown &amp; Market Position</h3>
        {competitors.length === 0 && (
          <p className="text-sm text-secondary mb-4">Belum ada data kompetitor. Tambahkan kompetitor di bawah.</p>
        )}
        <div className="overflow-x-auto table-mobile-compact">
          <table className="w-full text-left text-sm border-collapse table-auto">
            <thead className="bg-surface-container-low text-on-surface border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold">Nama Kompetitor</th>
                <th className="px-6 py-3 font-semibold">Estimasi Harga (IDR)</th>
                <th className="px-6 py-3 font-semibold">Kelebihan</th>
                <th className="px-6 py-3 font-semibold">Keterangan / Notes</th>
                <th className="px-6 py-3 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...competitors].sort((a, b) => {
                if (a.estPrice === 0) return 1;
                if (b.estPrice === 0) return -1;
                return a.estPrice - b.estPrice;
              }).map((row) => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.name}</span>
                      {isLowestCompetitor(row) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider whitespace-nowrap">
                          Harga Terendah
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-mono font-semibold ${isLowestCompetitor(row) ? 'text-warning' : ''}`}>
                    {row.estPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {row.advantages.map((adv, i) => (
                        <span key={i} className="bg-status-indigo/10 text-status-indigo px-2.5 py-0.5 rounded text-xs font-semibold badge-compact flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check_box</span>
                          {adv}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary text-xs">{row.notes}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRemoveCompetitor(row.id)}
                      className="text-outline hover:text-danger hover:bg-danger/10 rounded-lg p-1.5 transition-all"
                      title="Hapus kompetitor"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}

              {/* Inline competitor adder form */}
              <tr className="bg-surface-container-low/40">
                <td className="px-6 py-3">
                  <input
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="Cari / Ketik Nama kompetitor..."
                    className="bg-surface-container-lowest border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                    type="text"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    value={newCompPrice}
                    onChange={(e) => setNewCompPrice(e.target.value)}
                    placeholder="Contoh: 142500000000"
                    className="bg-surface-container-lowest border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm font-mono outline-none"
                    type="number"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    value={newCompAdv}
                    onChange={(e) => setNewCompAdv(e.target.value)}
                    placeholder="Kelebihan (pisahkan koma)"
                    className="bg-surface-container-lowest border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                    type="text"
                  />
                </td>
                <td className="px-6 py-3 flex gap-2 justify-between items-center">
                  <input
                    value={newCompNote}
                    onChange={(e) => setNewCompNote(e.target.value)}
                    placeholder="Catatan..."
                    className="bg-surface-container-lowest border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary text-sm flex-1 outline-none"
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompetitor}
                    className="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow hover:bg-primary-container shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Simpan
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Button */}
      {competitors.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleConfirmCompetitor}
            className="px-5 py-2.5 bg-success text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 shadow-sm"
          >
            Konfirmasi & Lanjut ke Pemenang
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
