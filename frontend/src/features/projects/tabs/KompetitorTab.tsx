import { useState, useEffect } from 'react';
import type { Project, CompetitorEntry } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function KompetitorTab({ project, onShowNotification }: TabProps) {
  const addProjectCompetitor = useProjectStore((s) => s.addProjectCompetitor);
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>(project?.competitors || []);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('');
  const [newCompAdv, setNewCompAdv] = useState('');
  const [newCompNote, setNewCompNote] = useState('');

  useEffect(() => {
    setCompetitors(project?.competitors || []);
  }, [project?.id]);

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
    setCompetitors([...competitors, newItem]);
    setNewCompName('');
    setNewCompPrice('');
    setNewCompAdv('');
    setNewCompNote('');
    onShowNotification?.(`Kompetitor ${newItem.name} berhasil ditambahkan ke proyek.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {competitors.map((row) => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 font-semibold">{row.name}</td>
                  <td className="px-6 py-4 font-mono">{row.estPrice.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className="bg-status-indigo/10 text-status-indigo px-2.5 py-0.5 rounded text-xs font-semibold badge-compact">
                      {row.advantages.join(', ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary text-xs">{row.notes}</td>
                </tr>
              ))}

              {/* Inline competitor adder form */}
              <tr className="bg-surface-container-low/40">
                <td className="px-6 py-3">
                  <input
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="Cari / Ketik Nama kompetitor..."
                    className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                    type="text"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    value={newCompPrice}
                    onChange={(e) => setNewCompPrice(e.target.value)}
                    placeholder="Contoh: 142500000000"
                    className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm font-mono outline-none"
                    type="number"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    value={newCompAdv}
                    onChange={(e) => setNewCompAdv(e.target.value)}
                    placeholder="Kelebihan (pisahkan koma)"
                    className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                    type="text"
                  />
                </td>
                <td className="px-6 py-3 flex gap-2 justify-between items-center">
                  <input
                    value={newCompNote}
                    onChange={(e) => setNewCompNote(e.target.value)}
                    placeholder="Catatan..."
                    className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary text-sm flex-1 outline-none"
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
    </div>
  );
}
