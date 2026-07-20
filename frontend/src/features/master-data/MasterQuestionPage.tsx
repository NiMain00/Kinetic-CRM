import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMasterDataStore, type MasterQuestion } from '@/stores/masterDataStore';
import { masterDataService } from '@/services/master-data';

// API field mapping
function toApiQuestion(form: Partial<MasterQuestion>) {
  const data: Record<string, unknown> = {
    questionText: form.question_text,
    questionTypeId: form.question_type_id,
    context: form.context,
    category: form.category,
    isRequired: form.is_required,
    sortOrder: form.sort_order,
    placeholderText: form.placeholder_text || '',
    helpText: form.help_text || '',
    isActive: form.is_active ?? true,
  };
  if (form.options && form.options.length > 0) {
    data.questionOptions = {
      create: form.options.map((opt, i) => ({ optionLabel: opt, sortOrder: i })),
    };
  }
  return data;
}

function fromApiQuestion(apiData: Record<string, unknown>): MasterQuestion {
  return {
    id: apiData.id as string,
    question_text: (apiData.questionText as string) || '',
    question_type_id: (apiData.questionTypeId as string) || '',
    context: (apiData.context || 'prospect') as MasterQuestion['context'],
    category: (apiData.category as string) || '',
    is_required: Boolean(apiData.isRequired),
    sort_order: Number(apiData.sortOrder) || 0,
    placeholder_text: (apiData.placeholderText as string) || '',
    help_text: (apiData.helpText as string) || '',
    is_active: apiData.isActive !== false,
    options: ((apiData.questionOptions as Array<{ optionLabel: string }>) || []).map(o => o.optionLabel),
  };
}

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
      <label className="font-semibold text-on-surface block">Pilihan Jawaban</label>
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
        <p className="text-[10px] text-outline">Belum ada pilihan. Tambahkan minimal 1 pilihan.</p>
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
  const fetchQuestions = useMasterDataStore((s) => s.fetchQuestions);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterQuestion | null>(null);
  const [form, setForm] = useState<Partial<MasterQuestion>>({});
  const [contextFilter, setContextFilter] = useState<'all' | 'prospect' | 'rks' | 'both'>('all');

  const filtered = useMemo(() => questions.filter(q => {
    const qSearch = debouncedSearch.toLowerCase();
    const matchesSearch = !qSearch || q.question_text.toLowerCase().includes(qSearch);
    const matchesContext = contextFilter === 'all' || q.context === contextFilter;
    return matchesSearch && matchesContext;
  }), [questions, debouncedSearch, contextFilter]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question_text) { toast.error('Teks pertanyaan wajib diisi'); return; }
    try {
      if (editing) {
        await masterDataService.update('questions', editing.id, toApiQuestion(form));
        updateData<MasterQuestion>('questions', editing.id, form);
        toast.success('Pertanyaan berhasil diperbarui');
      } else {
        const res = await masterDataService.create('questions', toApiQuestion(form) as any);
        const created = (res.data?.data || res.data) as any;
        addData<MasterQuestion>('questions', created?.id ? fromApiQuestion(created) : { ...form, id: `Q-${String(questions.length + 1).padStart(3, '0')}` } as MasterQuestion);
        toast.success('Pertanyaan berhasil ditambahkan');
      }
      setDrawerOpen(false);
    } catch {
      toast.error('Gagal menyimpan pertanyaan');
    }
  };

  const toggleStatus = async (id: string) => {
    const current = questions.find(q => q.id === id);
    if (!current) return;
    try {
      await masterDataService.update('questions', id, { isActive: !current.is_active });
      updateData<MasterQuestion>('questions', id, { is_active: !current.is_active });
      toast.success('Status pertanyaan diubah');
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    const target = questions.find(q => q.id === id);
    try {
      await masterDataService.delete('questions', id);
      deleteData('questions', id);
      toast.success(`Pertanyaan ${target?.question_text} dihapus`);
    } catch {
      toast.error('Gagal menghapus pertanyaan');
    }
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
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface-container-lowest border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Master Pertanyaan
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{questions.length}</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Kelola daftar pertanyaan untuk kuesioner prospek.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Pertanyaan</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex gap-2 p-1 bg-surface-container rounded-lg border border-border overflow-x-auto scrollbar-none w-full sm:w-auto">
                {(['all', 'prospect', 'rks', 'both'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setContextFilter(tab)}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      contextFilter === tab
                        ? 'bg-surface-container-lowest text-primary shadow-sm border border-border'
                        : 'text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {tab === 'all' ? 'Semua' : tab === 'prospect' ? 'Prospek' : tab === 'rks' ? 'RKS' : 'Keduanya'}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input type="text" placeholder="Cari pertanyaan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari pertanyaan" />
              </div>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Pertanyaan">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
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
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-outline italic">Tidak ada pertanyaan ditemukan.</td></tr>
                  ) : (
                    filtered.map(q => (
                      <tr key={q.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface max-w-[300px]">{q.question_text}</td>
                        <td className="px-6 py-4">{typeBadge(q.question_type_id)}</td>
                        <td className="px-6 py-4">{contextBadge(q.context)}</td>
                        <td className="px-6 py-4 text-secondary">{q.category}</td>
                        <td className="px-6 py-4 text-center"><Badge variant={q.is_required ? 'success' : 'default'}>{q.is_required ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4 text-center text-secondary">{q.sort_order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(q.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${q.is_active ? 'bg-success' : 'bg-surface-container-highest'}`} aria-label={`Alihkan status ${q.id}`}>
                            <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${q.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer" title="Sunting"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editing ? 'Sunting Pertanyaan' : 'Tambah Pertanyaan Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">{editing ? `ID: ${editing.id}` : 'Buat pertanyaan untuk kuesioner prospek'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Teks Pertanyaan *</label>
                <textarea value={form.question_text || ''} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Masukkan teks pertanyaan" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Tipe Jawaban</label>
                  <select value={form.question_type_id || 'QT-01'} onChange={e => setForm({ ...form, question_type_id: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                    {questionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Konteks</label>
                  <select value={form.context || 'prospect'} onChange={e => setForm({ ...form, context: e.target.value as MasterQuestion['context'] })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                    {QUESTION_CONTEXTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const selectedType = questionTypes.find(t => t.id === form.question_type_id);
                const qt = selectedType as any;
                const show = qt?.hasOptions ?? qt?.has_options ?? false;
                return show ? (
                  <OptionsInput
                    options={form.options || []}
                    onChange={(options) => setForm({ ...form, options })}
                  />
                ) : null;
              })()}


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Kategori</label>
                  <select value={form.category || 'Data Pribadi'} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                    {QUESTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Urutan</label>
                  <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Teks Petunjuk</label>
                  <input type="text" value={form.placeholder_text || ''} onChange={e => setForm({ ...form, placeholder_text: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs" placeholder="Teks petunjuk input" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Teks Bantuan</label>
                  <input type="text" value={form.help_text || ''} onChange={e => setForm({ ...form, help_text: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs" placeholder="Teks bantuan" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Wajib Diisi</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === true} onChange={() => setForm({ ...form, is_required: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="required" checked={form.is_required === false} onChange={() => setForm({ ...form, is_required: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="qStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="qStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editing ? 'Simpan' : 'Tambah'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
