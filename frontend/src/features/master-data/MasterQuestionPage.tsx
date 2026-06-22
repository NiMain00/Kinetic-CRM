import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';

interface Question {
  id: string;
  question_text: string;
  type: 'text' | 'select' | 'boolean';
  category: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}

const QUESTION_CATEGORIES = ['Data Pribadi', 'Lokasi', 'Verifikasi Fisik', 'Keuangan', 'Legalitas', 'Lainnya'];
const QUESTION_TYPES = [
  { value: 'text', label: 'Teks' },
  { value: 'select', label: 'Pilihan' },
  { value: 'boolean', label: 'Ya/Tidak' },
];

const INITIAL_QUESTIONS: Question[] = [
  { id: 'Q-001', question_text: 'Nama Lengkap Sesuai KTP', type: 'text', category: 'Data Pribadi', is_required: true, sort_order: 1, is_active: true },
  { id: 'Q-002', question_text: 'Apakah domisili sesuai dengan domisili usaha?', type: 'boolean', category: 'Lokasi', is_required: true, sort_order: 2, is_active: true },
  { id: 'Q-003', question_text: 'Jenis badan usaha', type: 'select', category: 'Legalitas', is_required: true, sort_order: 3, is_active: true },
  { id: 'Q-004', question_text: 'Estimasi omzet bulanan', type: 'text', category: 'Keuangan', is_required: false, sort_order: 4, is_active: true },
  { id: 'Q-005', question_text: 'Upload foto tempat usaha', type: 'boolean', category: 'Verifikasi Fisik', is_required: true, sort_order: 5, is_active: false },
];

export default function MasterQuestionPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<Partial<Question>>({});

  const filtered = questions.filter(q => q.question_text.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ type: 'text', category: 'Data Pribadi', is_required: false, sort_order: questions.length + 1, is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setForm({ ...q });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question_text) { toast.error('Teks pertanyaan wajib diisi'); return; }
    if (editing) {
      setQuestions(questions.map(q => q.id === editing.id ? { ...q, ...form } as Question : q));
      toast.success('Pertanyaan berhasil diperbarui');
    } else {
      const id = `Q-${String(questions.length + 1).padStart(3, '0')}`;
      setQuestions([{ ...form, id } as Question, ...questions]);
      toast.success('Pertanyaan berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, is_active: !q.is_active } : q));
    toast.success('Status pertanyaan diubah');
  };

  const typeBadge = (type: string) => {
    const map: Record<string, 'default' | 'info' | 'warning'> = { text: 'default', select: 'info', boolean: 'warning' };
    return <Badge variant={map[type] || 'default'}>{QUESTION_TYPES.find(t => t.value === type)?.label || type}</Badge>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Pertanyaan</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Pertanyaan
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{questions.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola daftar pertanyaan untuk kuesioner prospek.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Pertanyaan</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Cari pertanyaan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari pertanyaan" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" role="table" aria-label="Daftar Pertanyaan">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Pertanyaan</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5 text-center">Wajib</th>
                    <th className="px-6 py-3.5 text-center">Urutan</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada pertanyaan ditemukan.</td></tr>
                  ) : (
                    filtered.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 max-w-[300px]">{q.question_text}</td>
                        <td className="px-6 py-4">{typeBadge(q.type)}</td>
                        <td className="px-6 py-4 text-slate-500">{q.category}</td>
                        <td className="px-6 py-4 text-center"><Badge variant={q.is_required ? 'success' : 'default'}>{q.is_required ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4 text-center text-slate-500">{q.sort_order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(q.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${q.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Toggle status ${q.id}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${q.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editing ? `ID: ${editing.id}` : 'Buat pertanyaan untuk kuesioner prospek'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Teks Pertanyaan *</label>
                <textarea value={form.question_text || ''} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Masukkan teks pertanyaan" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Tipe Jawaban</label>
                  <select value={form.type || 'text'} onChange={e => setForm({ ...form, type: e.target.value as Question['type'] })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Kategori</label>
                  <select value={form.category || 'Data Pribadi'} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {QUESTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Urutan</label>
                  <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Wajib Diisi</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === true} onChange={() => setForm({ ...form, is_required: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === false} onChange={() => setForm({ ...form, is_required: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="qStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="qStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editing ? 'Simpan' : 'Tambah'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
