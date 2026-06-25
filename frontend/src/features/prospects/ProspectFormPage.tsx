import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Prospect, Customer } from '@/types/domain';
import { CUSTOMER_TYPES } from '@/types/domain';
import { useProspectStore } from '@/stores/prospectStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useAuthStore } from '@/stores/authStore';

// Industri options (Master Industri)
const INDUSTRIES = [
  { id: 'ind-1', name: 'Perbankan & Keuangan' },
  { id: 'ind-2', name: 'Telekomunikasi' },
  { id: 'ind-3', name: 'Pemerintahan & BUMN' },
  { id: 'ind-4', name: 'Minyak & Gas' },
  { id: 'ind-5', name: 'Manufaktur' },
  { id: 'ind-6', name: 'Kesehatan' },
  { id: 'ind-7', name: 'Pendidikan' },
  { id: 'ind-8', name: 'Pertambangan' },
  { id: 'ind-9', name: 'Transportasi & Logistik' },
  { id: 'ind-10', name: 'Teknologi Informasi' },
  { id: 'ind-11', name: 'Lainnya' },
];

// Provider Existing options (dari Master Kompetitor)
const PROVIDER_EXISTING = [
  { id: 'prov-1', name: 'Infrastructure Alpha' },
  { id: 'prov-2', name: 'BuildCore Systems' },
  { id: 'prov-3', name: 'TechData Solutions' },
  { id: 'prov-4', name: 'NetPrime Services' },
  { id: 'prov-5', name: 'Lainnya' },
];

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

  // --- Stores ---
  const { prospects, addProspect, updateProspect } = useProspectStore();
  const { addCustomer } = useCustomerStore();
  const authUser = useAuthStore((s) => s.user);

  const existingProspect = isEdit ? prospects.find((p) => p.id === id) : null;

  // --- Branch readonly dari user login ---
  const userBranch = authUser?.branchName || 'Jakarta Pusat';

  // Customer selection: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    existingProspect?.customerType || 'existing'
  );

  // Existing customer fields
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    existingProspect?.customerId || ''
  );
  const [customerSearch, setCustomerSearch] = useState('');

  // New customer fields — populated from existingProspect?.customerData saat edit
  const [newCustName, setNewCustName] = useState(existingProspect?.customerData?.name || '');
  const [newCustCode, setNewCustCode] = useState(existingProspect?.customerData?.code || '');
  const [newCustType, setNewCustType] = useState(existingProspect?.customerData?.type || 'swasta');
  const [newCustCity, setNewCustCity] = useState(existingProspect?.customerData?.city || '');
  const [newCustNpwp, setNewCustNpwp] = useState(existingProspect?.customerData?.npwp || '');
  const [newCustIndustryId, setNewCustIndustryId] = useState(existingProspect?.customerData?.industryId || '');

  // PIC Customer fields
  const [picName, setPicName] = useState(existingProspect?.customerData?.picName || '');
  const [picPosition, setPicPosition] = useState(existingProspect?.customerData?.picPosition || '');
  const [picPhone, setPicPhone] = useState(existingProspect?.customerData?.picPhone || '');

  // Bidang Customer / Industry
  const [industryId, setIndustryId] = useState(existingProspect?.industryId || '');

  // Provider Existing
  const [providerExisting, setProviderExisting] = useState(existingProspect?.providerExisting || '');

  // Prospect fields
  const [formName, setFormName] = useState(existingProspect?.name || '');
  const [formValue, setFormValue] = useState(existingProspect?.estimatedValue ? String(existingProspect.estimatedValue) : '');
  const [formDate, setFormDate] = useState(existingProspect?.date || '');
  const [formDesc, setFormDesc] = useState(existingProspect?.description || '');

  // Tipe Proyek
  const [projectType, setProjectType] = useState<'Tender' | 'Prospecting'>(
    // ProspectFormPage payload uses projectType on Prospect
    existingProspect?.projectType || 'Tender'
  );

  // Potensi Penambahan Unit
  const [potensiUnit, setPotensiUnit] = useState(
    existingProspect?.potensiUnit !== undefined ? String(existingProspect.potensiUnit) : '0'
  );

  // Answers / questionnaire
  const [answers, setAnswers] = useState<Record<string, string>>({
    ...defaultAnswers,
    ...(existingProspect?.answers || {}),
  });

  // --- Existing customer auto-fill logic ---
  const customers = useCustomerStore((s) => s.customers);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Saat selectedCustomerId berubah, auto-fill PIC, industry, provider
  React.useEffect(() => {
    if (customerMode === 'existing' && selectedCustomer) {
      // Auto-fill PIC fields (readonly display)
      setPicName(selectedCustomer.picName);
      setPicPosition(selectedCustomer.picPosition);
      setPicPhone(selectedCustomer.picPhone);
      // Auto-fill industry & provider
      setIndustryId(selectedCustomer.industryId || '');
      setProviderExisting(selectedCustomer.providerExisting || '');
    }
  }, [selectedCustomerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter customers by search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(customerSearch.toLowerCase())
  );

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

    // Build customerData untuk new customer
    let customerData: Customer | undefined;
    if (customerMode === 'new') {
      // Saat edit, reuse ID yang sudah ada agar tidak duplikat
      const existingCustomerId = existingProspect?.customerData?.id;
      customerData = {
        id: existingCustomerId || `new-${Date.now()}`,
        name: newCustName,
        code: newCustCode || newCustName.substring(0, 3).toUpperCase(),
        type: newCustType as 'swasta' | 'bumn' | 'pemerintah' | 'asing',
        city: newCustCity,
        npwp: newCustNpwp || undefined,
        picName: picName,
        picPosition: picPosition,
        picPhone: picPhone,
        industryId: newCustIndustryId || undefined,
        providerExisting: providerExisting || undefined,
        isNew: true,
        needsVerification: true,
      };

      if (isEdit && existingCustomerId) {
        // Update existing customer di store, jangan duplikat
        useCustomerStore.getState().updateCustomer(existingCustomerId, customerData);
      } else {
        // Auto-save new customer ke customerStore (Fase 1 item 1.4)
        addCustomer(customerData);
      }
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
      branch: userBranch,
      answers,
      industryId: customerMode === 'existing' ? industryId : (newCustIndustryId || undefined),
      providerExisting: providerExisting || undefined,
      projectType: projectType,
    };

    if (isEdit && existingProspect) {
      updateProspect(existingProspect.id, payload);
    } else {
      addProspect(payload);
    }

    toast.success(status === 'Waiting PM' ? 'Prospek berhasil diajukan ke PM untuk review.' : 'Draf prospek berhasil disimpan.');
    navigate('/prospects');
    return true;
  };

  const handleSaveDraft = () => saveProspect('Potensial');
  const handleSubmitReview = () => saveProspect('Waiting PM');

  // Reset auto-fill ketika ganti customer
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerSearch('');
    setPicName(c.picName);
    setPicPosition(c.picPosition);
    setPicPhone(c.picPhone);
    setIndustryId(c.industryId || '');
    setProviderExisting(c.providerExisting || '');
  };

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

            {/* Toggle Existing / New Customer */}
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
                  onChange={() => {
                    setCustomerMode('new');
                    setPicName('');
                    setPicPosition('');
                    setPicPhone('');
                    setIndustryId('');
                    setProviderExisting('');
                  }}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                New Customer
              </label>
            </div>

            {customerMode === 'existing' ? (
              <>
                {/* Autocomplete / Search Existing Customer */}
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
                          onClick={() => handleSelectCustomer(c)}
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
              /* New Customer form */
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

            {/* Bidang Customer / Industri (Fase 1 item 1.6) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Bidang Customer / Industri</label>
              {customerMode === 'existing' && selectedCustomer ? (
                <div className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-sm text-on-surface">
                  {(() => {
                    const ind = INDUSTRIES.find(i => i.id === industryId);
                    return ind ? ind.name : 'Tidak diisi';
                  })()}
                </div>
              ) : (
                <select
                  value={customerMode === 'new' ? newCustIndustryId : industryId}
                  onChange={(e) => {
                    if (customerMode === 'new') setNewCustIndustryId(e.target.value);
                    else setIndustryId(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Pilih Industri</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Provider Existing (Fase 1 item 1.5) — non-mandatory */}
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Provider Existing</label>
              {customerMode === 'existing' && selectedCustomer ? (
                <div className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-sm text-on-surface">
                  {providerExisting || 'Tidak diisi'}
                </div>
              ) : (
                <select
                  value={providerExisting}
                  onChange={(e) => setProviderExisting(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Tidak Ada</option>
                  {PROVIDER_EXISTING.map(prov => (
                    <option key={prov.id} value={prov.name}>{prov.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* PIC Customer — always visible */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-semibold text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                PIC Customer
              </h4>
              {customerMode === 'existing' && selectedCustomer ? (
                <div className="p-3 bg-surface-container-low rounded-lg space-y-1 text-sm">
                  <div className="font-medium">{picName}</div>
                  <div className="text-xs text-secondary">{picPosition}</div>
                  <div className="text-xs text-secondary">{picPhone}</div>
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

              {/* Tipe Proyek — menentukan apakah proyek Tender atau Prospecting */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as 'Tender' | 'Prospecting')}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm"
                  aria-label="Tipe Proyek"
                >
                  <option value="Tender">Tender</option>
                  <option value="Prospecting">Prospecting</option>
                </select>
                <p className="text-[10px] text-secondary">Pilih "Tender" jika proyek melalui proses tender, atau "Prospecting" jika penawaran langsung.</p>
              </div>

              {/* Estimasi Nilai Proyek — non-mandatory (Fase 1 item 1.7) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Estimasi Nilai Proyek (Rp)</label>
                <input value={formValue} onChange={(e) => setFormValue(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Contoh: 1500000000" type="number" aria-label="Estimasi Nilai" />
              </div>

              {/* Estimasi Tanggal Closing — non-mandatory (Fase 1 item 1.7) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Estimasi Tanggal Closing</label>
                <input value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" type="date" aria-label="Tanggal Closing" />
              </div>

              {/* Potensi Penambahan Unit */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Potensi Penambahan Unit</label>
                <input value={potensiUnit} onChange={(e) => setPotensiUnit(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="0" type="number" min="0" aria-label="Potensi Penambahan Unit" />
                <p className="text-[10px] text-secondary">Jika 0 = status "Non Potensial". Jika di atas 0 = status "Potensial".</p>
              </div>

              {/* Branch — READONLY dari user login (Fase 1 item 1.1) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Cabang (Branch)</label>
                <div className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">business</span>
                  {userBranch}
                </div>
                <p className="text-[10px] text-secondary">Cabang diambil dari data user login. Tidak dapat diubah.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Deskripsi</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." aria-label="Deskripsi" />
              </div>
            </div>

            {/* Questionnaire - "Pertanyaan Standar" */}
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
