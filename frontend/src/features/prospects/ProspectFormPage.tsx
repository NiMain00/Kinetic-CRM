import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
import type { Prospect } from '@/types/domain';

const questionnaireQuestions = [
  {
    key: 'upsCapacity',
    label: '1. Apakah sudah ada kepastian spesifikasi UPS di lokasi Cabang?',
    options: ['UPS 2x3KVA', 'UPS Lainnya / Belum Ada'],
  },
  {
    key: 'isFiberOpticReady',
    label: '2. Apakah sudah ada jalur FO (Fiber Optic) aktif dari ISP di gedung tersebut?',
    options: ['Ya, Terjadwal', 'Tidak / Belum Ada'],
  },
  {
    key: 'groundingCableOption',
    label: '3. Kebutuhan Proteksi Kelistrikan Ruang Server',
    isText: true,
    placeholder: 'Contoh: Wajib menggunakan grounding tersendiri',
  },
];

export default function ProspectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existingProspect = isEdit ? INITIAL_PROSPECTS.find((p) => p.id === id) : null;

  const [formName, setFormName] = useState(existingProspect?.name || '');
  const [formClient, setFormClient] = useState(existingProspect?.client || 'PT. Telkom Indonesia Tbk.');
  const [formValue, setFormValue] = useState(existingProspect?.estimatedValue ? String(existingProspect.estimatedValue) : '');
  const [formDate, setFormDate] = useState(existingProspect?.date || '');
  const [formDesc, setFormDesc] = useState(existingProspect?.description || '');
  const [answers, setAnswers] = useState<Record<string, string>>({
    upsCapacity: 'UPS 2x3KVA',
    isFiberOpticReady: 'Ya, Terjadwal',
    groundingCableOption: 'Wajib menggunakan grounding tersendiri',
  });

  const saveProspect = (status: string) => {
    if (!formName) {
      toast.error('Nama Prospek harus diisi!');
      return false;
    }
    const payload: Prospect = {
      id: existingProspect?.id || String(Date.now()),
      name: formName,
      client: formClient,
      status: status as Prospect['status'],
      author: existingProspect?.author || 'Ahmad Faisal',
      date: formDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      estimatedValue: Number(formValue) || undefined,
      description: formDesc,
      answers,
    };
    toast.success(status === 'Prospecting' ? 'Draf prospek berhasil disimpan.' : 'Prospek berhasil diajukan ke PM untuk review.');
    navigate('/prospects');
    return true;
  };

  const handleSaveDraft = () => saveProspect('Prospecting');
  const handleSubmitReview = () => saveProspect('Waiting PM');

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/prospects')} className="hover:text-primary transition-colors">Prospek</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">{isEdit ? 'Edit Prospek' : 'Buat Prospek Baru'}</span>
        </nav>

        <div>
          <h1 className="text-xl font-extrabold text-on-surface">{isEdit ? 'Edit Prospek' : 'Buat Prospek Baru'}</h1>
          <p className="text-sm text-secondary mt-1">Lengkapi informasi dasar prospek dan kuesioner kelayakan teknis di bawah ini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Basic Info */}
          <div className="lg:col-span-6 bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">assignment</span>
              Informasi Prospek Utama
            </h3>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Nama Prospek *</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" placeholder="Contoh: Modernization of Data Center - Jakarta" type="text" aria-label="Nama Prospek" />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Customer / Client *</label>
              <select value={formClient} onChange={(e) => setFormClient(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm" aria-label="Client">
                <option>PT. Telkom Indonesia Tbk.</option>
                <option>PT. Telekom Nusantara</option>
                <option>Energi Bangsa Corp</option>
                <option>Secure City Group</option>
                <option>Bank Artha Graha</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Estimasi Nilai Proyek (Rp)</label>
              <input value={formValue} onChange={(e) => setFormValue(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Contoh: 1500000000" type="number" aria-label="Estimasi Nilai" />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Estimasi Tanggal Closing</label>
              <input value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" type="date" aria-label="Tanggal Closing" />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Deskripsi</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." aria-label="Deskripsi" />
            </div>
          </div>

          {/* Right: Questionnaire */}
          <div className="lg:col-span-6 bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-status-teal border-b border-border pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">quiz</span>
              Evaluasi & Ketentuan Teknis
            </h3>

            {questionnaireQuestions.map((q) => (
              <div key={q.key} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-3">
                <p className="font-semibold text-sm text-on-surface">{q.label}</p>
                {q.isText ? (
                  <input value={answers[q.key]} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} placeholder={q.placeholder} className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none" type="text" />
                ) : (
                  <div className="flex gap-4 flex-wrap">
                    {q.options?.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name={q.key} value={opt} checked={answers[q.key] === opt} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} className="text-primary focus:ring-primary h-4 w-4 border-outline" />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center bg-white border border-border p-4 rounded-xl shadow-sm">
          <button onClick={() => navigate('/prospects')} className="px-6 py-2.5 bg-white border border-border text-on-surface font-semibold rounded-lg hover:bg-surface-container-low transition-all text-sm">
            Kembali ke Daftar
          </button>
          <div className="flex gap-3">
            <button onClick={handleSaveDraft} className="px-6 py-2.5 bg-white border border-border text-primary font-bold rounded-lg hover:bg-surface-container-low transition-all text-sm" aria-label="Simpan Draft">
              Simpan Draft
            </button>
            <button onClick={handleSubmitReview} className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-110 transition-all text-sm flex items-center gap-2" aria-label="Kirim ke Review">
              Kirim ke Review
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
