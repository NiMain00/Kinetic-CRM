import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useMasterDataStore, type MasterQuestion } from '@/stores/masterDataStore';

const QUESTION_CATEGORIES = ['Data Pribadi', 'Lokasi', 'Verifikasi Fisik', 'Keuangan', 'Legalitas', 'Teknis', 'Jadwal', 'Dokumen', 'Lainnya'];
const QUESTION_CONTEXTS = [
  { value: 'prospect', label: 'Prospek' },
  { value: 'rks', label: 'RKS' },
  { value: 'both', label: 'Keduanya' },
];

function OptionsInput({ options, onChange }: { options: string[]; onChange: (options: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (!val) return;
    if (options.includes(val)) return;
    onChange([...options, val]);
    setInput('');
  };

  const remove = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };
  

  return (
    <div className="space-y-3">
      <label className="font-semibold text-slate-700 block">Pilihan Jawaban</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className="flex-1 rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
          placeholder="Ketik pilihan lalu tekan Enter..."
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-colors cursor-pointer shrink-0"
        >
          Tambah
        </button>
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20"
            >
              {opt}
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
      {options.length === 0 && (
        <p className="text-[10px] text-slate-400">Belum ada pilihan. Tambahkan minimal 1 pilihan.</p>
      )}
    </div>
  );
}

export default function MasterQuestionPage() {
  const navigate = useNavigate();
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterQuestion | null>(null);
  const [form, setForm] = useState<Partial<MasterQuestion>>({});
  const [contextFilter, setContextFilter] = useState<'all' | 'prospect' | 'rks' | 'both'>('all');

  const filtered = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
    const matchesContext = contextFilter === 'all' || q.context === contextFilter;
    return matchesSearch && matchesContext;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ question_type_id: 'QT-01', context: 'prospect', category: 'Data Pribadi', is_required: false, sort_order: questions.length + 1, placeholder_text: '', help_text: '', is_active: true, options: [] });
    setDrawerOpen(true);
  };

  const openEdit = (q: MasterQuestion) => {
    setEditing(q);
    setForm({ ...q });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question_text) { toast.error('Teks pertanyaan wajib diisi'); return; }
    if (editing) {
      updateData<MasterQuestion>('questions', editing.id, form);
      toast.success('Pertanyaan berhasil diperbarui');
    } else {
      const id = `Q-${String(questions.length + 1).padStart(3, '0')}`;
      addData<MasterQuestion>('questions', { ...form, id } as MasterQuestion);
      toast.success('Pertanyaan berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    const current = questions.find(q => q.id === id);
    if (current) {
      updateData<MasterQuestion>('questions', id, { is_active: !current.is_active });
      toast.success('Status pertanyaan diubah');
    }
  };

  const handleDelete = (id: string) => {
    const target = questions.find(q => q.id === id);
    deleteData('questions', id);
    toast.success(`Pertanyaan ${target?.question_text} dihapus`);
  };

  const typeBadge = (typeId: string) => {
    const qt = questionTypes.find(t => t.id === typeId);
    const name = qt?.name || typeId;
    const map: Record<string, 'default' | 'info' | 'warning'> = { Teks: 'default', Pilihan: 'info', 'Ya/Tidak': 'warning' };
    return <Badge variant={map[name] || 'default'}>{name}</Badge>;
  };

  const contextBadge = (ctx: string) => {
    const map: Record<string, 'default' | 'info' | 'warning'> = { prospect: 'info', rks: 'warning', both: 'default' };
    return <Badge variant={map[ctx] || 'default'}>{ctx}</Badge>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Data Master</span>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
                {(['all', 'prospect', 'rks', 'both'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setContextFilter(tab)}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      contextFilter === tab
                        ? 'bg-white text-primary shadow-sm border border-border'
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'all' ? 'Semua' : tab === 'prospect' ? 'Prospek' : tab === 'rks' ? 'RKS' : 'Keduanya'}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input type="text" placeholder="Cari pertanyaan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari pertanyaan" />
              </div>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Pertanyaan">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Pertanyaan</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">Konteks</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5 text-center">Wajib</th>
                    <th className="px-6 py-3.5 text-center">Urutan</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada pertanyaan ditemukan.</td></tr>
                  ) : (
                    filtered.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 max-w-[300px]">{q.question_text}</td>
                        <td className="px-6 py-4">{typeBadge(q.question_type_id)}</td>
                        <td className="px-6 py-4">{contextBadge(q.context)}</td>
                        <td className="px-6 py-4 text-slate-500">{q.category}</td>
                        <td className="px-6 py-4 text-center"><Badge variant={q.is_required ? 'success' : 'default'}>{q.is_required ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4 text-center text-slate-500">{q.sort_order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(q.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${q.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Alihkan status ${q.id}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${q.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Sunting"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
                          </div>
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
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Sunting Pertanyaan' : 'Tambah Pertanyaan Baru'}</h3>
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
                  <select value={form.question_type_id || 'QT-01'} onChange={e => setForm({ ...form, question_type_id: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {questionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Konteks</label>
                  <select value={form.context || 'prospect'} onChange={e => setForm({ ...form, context: e.target.value as MasterQuestion['context'] })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {QUESTION_CONTEXTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const selectedType = questionTypes.find(t => t.id === form.question_type_id);
                const shouldShowOptions = Boolean(selectedType?.has_options);

                return shouldShowOptions ? (
                  <OptionsInput
                    options={form.options || []}
                    onChange={(options) => setForm({ ...form, options })}
                  />
                ) : null;
              })()}


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Kategori</label>
                  <select value={form.category || 'Data Pribadi'} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {QUESTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Urutan</label>
                  <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Teks Petunjuk</label>
                  <input type="text" value={form.placeholder_text || ''} onChange={e => setForm({ ...form, placeholder_text: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs" placeholder="Teks petunjuk input" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Teks Bantuan</label>
                  <input type="text" value={form.help_text || ''} onChange={e => setForm({ ...form, help_text: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs" placeholder="Teks bantuan" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Wajib Diisi</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === true} onChange={() => setForm({ ...form, is_required: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === false} onChange={() => setForm({ ...form, is_required: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
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
