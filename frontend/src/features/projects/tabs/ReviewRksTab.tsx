import type { Project } from '@/types/domain';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ReviewRksTab({ onShowNotification }: TabProps) {
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
      <h3 className="font-heading-section text-heading-section flex items-center gap-2 pb-3 border-b border-border">
        <span className="material-symbols-outlined text-primary">quiz</span>
        Review RKS Komparatif
      </h3>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border-l-4 border-success bg-surface-container-low">
          <h5 className="font-semibold text-sm">Q1: Apakah spesifikasi server di lokasi Cabang Jakarta sudah sesuai standar redundansi tier-2?</h5>
          <p className="text-xs text-secondary mt-1">Jawaban: Ya, UPS 2x3KVA dengan modul SNMP akan dipasang sesuai spesifikasi RKS Halaman 12.</p>
        </div>
        <div className="p-4 rounded-lg border-l-4 border-success bg-surface-container-low">
          <h5 className="font-semibold text-sm">Q2: Verifikasi ketersediaan bandwidth fiber optic ISP di area Menteng.</h5>
          <p className="text-xs text-secondary mt-1">Jawaban: Provider Biznet sudah konsisten mengonfirmasi ketersediaan FO di lokasi dengan SLA 99.7%.</p>
        </div>
        <div className="p-4 rounded-lg border-l-4 border-warning bg-surface-container border border-border">
          <h5 className="font-semibold text-sm text-warning">Q3: Detail instalasi kelistrikan untuk rak server utama.</h5>
          <p className="text-xs text-secondary mt-1 italic">Menunggu tanggapan atau analisis penambahan kabel grounding dari tim lapangan.</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => onShowNotification?.('Review RKS berhasil disimpan.', 'success')}
          className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg hover:opacity-90 transition-all"
        >
          Simpan Review
        </button>
      </div>
    </div>
  );
}
