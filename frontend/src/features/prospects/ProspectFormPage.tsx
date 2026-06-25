import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProspectStore } from '@/stores/prospectStore';
import type { Prospect, Customer } from '@/types/domain';
import { BRANCHES, CUSTOMER_TYPES } from '@/types/domain';

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
  // Fase 1 item 8: 2 new questions
  {
    key: 'jenisPengadaan',
    label: '4. Apakah jenis pengadaan customer beli putus?',
    options: ['Ya', 'Tidak'],
  },
  {
    key: 'detailKebutuhanUnit',
    label: '5. Sebutkan detail kebutuhan pengadaan unit',
    isText: true,
    placeholder: 'Contoh: Membutuhkan 10 unit UPS 3KVA, 5 unit AC, dan 2 unit rack server',
  },
];

const defaultAnswers: Record<string, string> = {
  upsCapacity: 'UPS 2x3KVA',
  isFiberOpticReady: 'Ya, Terjadwal',
  groundingCableOption: 'Wajib menggunakan grounding tersendiri',
  jenisPengadaan: 'Ya',
  detailKebutuhanUnit: 'Membutuhkan 10 unit UPS 3KVA',
};

export default function ProspectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const getProspect = useProspectStore((s) => s.getProspect);
  const addProspect = useProspectStore((s) => s.addProspect);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const customers = useProspectStore((s) => s.customers);

  const existingProspect = isEdit ? getProspect(id!) : null;

  // Customer selection: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    existingProspect?.customerType || 'existing'
  );

  // Existing customer fields
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    existingProspect?.customerId || ''
  );
  const [customerSearch, setCustomerSearch] = useState('');

  // New customer fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustType, setNewCustType] = useState('swasta');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustNpwp, setNewCustNpwp] = useState('');

  // PIC Customer fields (Fase 1 item 4)
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picPhone, setPicPhone] = useState('');

  // Prospect fields
  const [formName, setFormName] = useState(existingProspect?.name || '');
  const [formValue, setFormValue] = useState(existingProspect?.estimatedValue ? String(existingProspect.estimatedValue) : '');
  const [formDate, setFormDate] = useState(existingProspect?.date || '');
  const [formDesc, setFormDesc] = useState(existingProspect?.description || '');

  // Potensi Penambahan Unit (Fase 1 item 5)
  const [potensiUnit, setPotensiUnit] = useState(
    existingProspect?.potensiUnit !== undefined ? String(existingProspect.potensiUnit) : '0'
  );

  // Branch dropdown (Fase 1 item 6)
  const [branch, setBranch] = useState(existingProspect?.branch || 'Jakarta Pusat');

  // Answers / questionnaire
  const [answers, setAnswers] = useState<Record<string, string>>({
    ...defaultAnswers,
    ...(existingProspect?.answers || {}),
  });

  // Filter customers by search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const getClientName = (): string => {
    if (customerMode === 'existing' && selectedCustomer) {
      return selectedCustomer.name;
    }
    if (customerMode === 'new' && newCustName) {
      return newCustName;
    }
    return '';
  };

  const saveProspect = (status: 'Non Potensial' | 'Potensial' | 'Waiting PM') => {
    const clientName = getClientName();
    if (!formName) {
      toast.error('Nama Prospek harus diisi!');
      return false;
    }
    if (!clientName && customerMode === 'existing' && !selectedCustomerId) {
      toast.error('Pilih Customer terlebih dahulu!');
      return false;
    }
    if (!clientName && customerMode === 'new' && !newCustName) {
      toast.error('Nama Customer harus diisi!');
      return false;
    }

    // Determine potensi status
    const potensi = Number(potensiUnit) || 0;
    const autoStatus = status === 'Waiting PM' ? 'Waiting PM' : (potensi > 0 ? 'Potensial' : 'Non Potensial');
    const prospectType = potensi > 0 ? 'potensial' : 'non_potensial';

    // Build customerData for new customer
    let customerData: Customer | undefined;
    if (customerMode === 'new') {
      customerData = {
        id: `new-${Date.now()}`,
        name: newCustName,
        code: newCustCode || newCustName.substring(0, 3).toUpperCase(),
        type: newCustType as 'swasta' | 'bumn' | 'pemerintah' | 'asing',
        city: newCustCity,
        npwp: newCustNpwp || undefined,
        picName: picName,
        picPosition: picPosition,
        picPhone: picPhone,
        isNew: true,
        needsVerification: true,
      };
    }

    const payload: Prospect = {
      id: existingProspect?.id || String(Date.now()),
      name: formName,
      client: clientName,
      customerId: customerMode === 'existing' ? selectedCustomerId : customerData?.id,
      customerType: customerMode,
      customerData: customerMode === 'new' ? customerData : undefined,
      status: autoStatus,
      prospectType,
      potensiUnit: potensi,
      author: existingProspect?.author || 'Ahmad Faisal',
      date: formDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      estimatedValue: Number(formValue) || undefined,
      description: formDesc,
      branch,
      answers,
    };

    // Simpan ke store
    if (isEdit && existingProspect) {
      updateProspect(existingProspect.id, payload);
      toast.success('Prospek berhasil diperbarui.');
    } else {
      addProspect(payload);
      toast.success(status === 'Waiting PM' ? 'Prospek berhasil diajukan ke PM untuk review.' : 'Draf prospek berhasil disimpan.');
    }
    navigate('/prospects');
    return true;
  };

  const handleSaveDraft = () => saveProspect('Potensial');
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
          <p className="text-sm text-secondary mt-1">Lengkapi informasi prospek, data customer, dan pertanyaan standar di bawah ini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Customer Info */}
          <div className="lg:col-span-6 bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">business</span>
              Data Customer
            </h3>

            {/* Toggle Existing / New Customer (Fase 1 item 2) */}
            <div className="flex gap-3 pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="customerMode"
                  value="existing"
                  checked={customerMode === 'existing'}
                  onChange={() => setCustomerMode('existing')}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                Existing Customer
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="customerMode"
                  value="new"
                  checked={customerMode === 'new'}
                  onChange={() => setCustomerMode('new')}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                New Customer
              </label>
            </div>

            {customerMode === 'existing' ? (
              <>
                {/* Autocomplete / Search Existing Customer (Fase 1 item 1 - left column) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">Cari Customer Existing</label>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                    placeholder="Ketik nama atau kode customer..."
                    type="text"
                  />
                </div>

                {customerSearch && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-secondary">Customer tidak ditemukan</div>
                    ) : (
                      filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch('');
                          }}
                          className={`w-full text-left p-3 text-sm hover:bg-surface-container-low transition-colors ${
                            selectedCustomerId === c.id ? 'bg-primary/5 font-semibold' : ''
                          }`}
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-secondary">{c.code} · {c.type} · {c.city}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
                    <div className="font-semibold text-sm">{selectedCustomer.name}</div>
                    <div className="text-xs text-secondary">Kode: {selectedCustomer.code} | Tipe: {selectedCustomer.type} | Kota: {selectedCustomer.city}</div>
                    {selectedCustomer.npwp && <div className="text-xs text-secondary">NPWP: {selectedCustomer.npwp}</div>}
                    <div className="text-xs text-secondary">PIC: {selectedCustomer.picName} ({selectedCustomer.picPosition}) - {selectedCustomer.picPhone}</div>
                  </div>
                )}
              </>
            ) : (
              /* New Customer form (Fase 1 item 1 - right column, Fase 1 item 3) */
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs text-amber-700 font-semibold">Customer baru — badge kuning "Perlu Verifikasi" akan tampil</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">Nama Customer *</label>
                  <input value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Contoh: PT. Maju Bersama" type="text" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">Kode Customer</label>
                  <input value={newCustCode} onChange={(e) => setNewCustCode(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Contoh: MB" type="text" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">Tipe Customer</label>
                  <select value={newCustType} onChange={(e) => setNewCustType(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm">
                    {CUSTOMER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">Kota</label>
                  <input value={newCustCity} onChange={(e) => setNewCustCity(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Kota" type="text" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-sm text-on-surface-variant">NPWP (opsional)</label>
                  <input value={newCustNpwp} onChange={(e) => setNewCustNpwp(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Contoh: 01.234.567.8-091.000" type="text" />
                </div>
              </div>
            )}

            {/* PIC Customer (Fase 1 item 4) - always visible */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-semibold text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                PIC Customer
              </h4>
              {customerMode === 'existing' && selectedCustomer ? (
                <div className="p-3 bg-surface-container-low rounded-lg space-y-1 text-sm">
                  <div className="font-medium">{selectedCustomer.picName}</div>
                  <div className="text-xs text-secondary">{selectedCustomer.picPosition}</div>
                  <div className="text-xs text-secondary">{selectedCustomer.picPhone}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Nama PIC</label>
                    <input value={picName} onChange={(e) => setPicName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Nama lengkap PIC" type="text" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Jabatan PIC</label>
                    <input value={picPosition} onChange={(e) => setPicPosition(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Contoh: Procurement Manager" type="text" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">No HP PIC</label>
                    <input value={picPhone} onChange={(e) => setPicPhone(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Contoh: 0812-3456-7890" type="text" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Prospect Info + Questionnaire */}
          <div className="lg:col-span-6 space-y-6">
            {/* Basic Prospect Info */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">assignment</span>
                Informasi Prospek
              </h3>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Nama Prospek *</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" placeholder="Contoh: Modernization of Data Center - Jakarta" type="text" aria-label="Nama Prospek" />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Estimasi Nilai Proyek (Rp)</label>
                <input value={formValue} onChange={(e) => setFormValue(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Contoh: 1500000000" type="number" aria-label="Estimasi Nilai" />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Estimasi Tanggal Closing</label>
                <input value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" type="date" aria-label="Tanggal Closing" />
              </div>

              {/* Potensi Penambahan Unit (Fase 1 item 5) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Potensi Penambahan Unit</label>
                <input value={potensiUnit} onChange={(e) => setPotensiUnit(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="0" type="number" min="0" aria-label="Potensi Penambahan Unit" />
                <p className="text-[10px] text-secondary">Jika 0 = status "Non Potensial". Jika di atas 0 = status "Potensial".</p>
              </div>

              {/* Cabang / Branch (Fase 1 item 6) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Cabang (Branch)</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm">
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <p className="text-[10px] text-secondary">Default dari user login. Tidak wajib diisi.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Deskripsi</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." aria-label="Deskripsi" />
              </div>
            </div>

            {/* Questionnaire - "Pertanyaan Standar" (Fase 1 item 7 - renamed from "Evaluasi & Ketentuan Teknis") */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-status-teal border-b border-border pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">quiz</span>
                Pertanyaan Standar
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