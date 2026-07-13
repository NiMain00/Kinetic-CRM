import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProcurementStore } from './procurementStore';
import { useProjectStore } from '@/stores/projectStore';
import { useRelationStore } from '@/stores/relationStore';
import { formatCurrency } from '@/utils/formatters';

export default function ProcurementFormPage() {
  const navigate = useNavigate();
  const addProcurement = useProcurementStore((s) => s.addProcurement);
  const projects = useProjectStore((s) => s.projects);

  const winningProjects = projects.filter(
    (p) =>
      p.winnerDetails?.outcome === 'menang' &&
      !useProcurementStore
        .getState()
        .procurements.some((pr) => pr.sourceProjectId === p.id),
  );

  const [client, setClient] = useState('');
  const [contractValue, setContractValue] = useState(0);
  const [location, setLocation] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [prNotes, setPrNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      toast.error('Nama klien wajib diisi');
      return;
    }

    const selectedProject = sourceProjectId
      ? projects.find((p) => p.id === sourceProjectId)
      : undefined;

    const procurement = addProcurement({
      sourceProjectId: sourceProjectId || undefined,
      sourceProjectCode: selectedProject?.code,
      sourceProjectName: selectedProject?.name,
      client,
      contractValue,
      location,
      prNumber: prNumber || undefined,
      prNotes: prNotes || undefined,
      createdBy: 'Admin',
      status: 'Draft',
      phase: 'Draft',
    });

    // Simpan relasi di relationStore biar PROJECT_WON dll tahu sudah ada procurement
    if (sourceProjectId) {
      useRelationStore.getState().linkProjectToProcurement(sourceProjectId, procurement.id);
    }
    toast.success(`Pengadaan ${procurement.code} berhasil dibuat`);
    navigate(`/procurement/${procurement.id}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="bg-surface border-b border-border/60 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/procurement')}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">
              arrow_back
            </span>
          </button>
          <h1 className="font-display-title text-xl font-bold text-on-surface">
            Pengadaan Baru
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Link to Project */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                link
              </span>
              Referensi Proyek (Opsional)
            </h3>
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                Hubungkan dengan Proyek yang Menang
              </label>
              <select
                value={sourceProjectId}
                onChange={(e) => {
                  const p = projects.find(
                    (proj) => proj.id === e.target.value,
                  );
                  setSourceProjectId(e.target.value);
                  if (p) {
                    setClient(p.client);
                    setContractValue(
                      p.winnerDetails?.contractValue ||
                        p.estimatedValue ||
                        0,
                    );
                    setLocation(p.location);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              >
                <option value="">Tidak ada (input manual)</option>
                {winningProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.client} (
                    {formatCurrency(
                      p.winnerDetails?.contractValue ||
                        p.estimatedValue ||
                        0,
                    )}
                    )
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-outline mt-1">
                Pilih proyek yang sudah MENANG untuk mengisi data otomatis
              </p>
            </div>
          </section>

          {/* Client Info */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface">
              Informasi Pengadaan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                  Nama Klien *
                </label>
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
                  placeholder="Nama perusahaan klien"
                  required
                />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                  Nilai Kontrak
                </label>
                <input
                  type="number"
                  value={contractValue || ''}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                  Lokasi
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
                  placeholder="Lokasi proyek"
                />
              </div>
            </div>
          </section>

          {/* PR Info */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                description
              </span>
              Purchase Request (Opsional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                  Nomor PR
                </label>
                <input
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
                  placeholder="PR-2026-001"
                />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                Catatan PR
              </label>
              <textarea
                value={prNotes}
                onChange={(e) => setPrNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none bg-surface text-on-surface"
                placeholder="Deskripsi kebutuhan pengadaan..."
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/procurement')}
              className="px-4 py-2 border border-border text-secondary rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Pengadaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
