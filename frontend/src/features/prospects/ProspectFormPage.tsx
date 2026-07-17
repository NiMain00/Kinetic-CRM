import React, { useState, useMemo, useEffect } from 'react';
import { prospectSchema } from '@/utils/validators';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Prospect, Customer, TimelineEvent } from '@/types/domain';
import { useActiveOptions } from '@/hooks/useInputConfig';
import { useProspectStore } from '@/stores/prospectStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useApprovalStore } from '@/stores/approvalStore';
import CurrencyInput from '@/components/ui/CurrencyInput';

// Resolve question_type_id ke kode render (radio/checkbox/textarea/select/text)
function resolveTypeCode(questionTypes: Array<{ id: string; code: string }>, typeId: string): string {
  const qt = questionTypes.find(t => t.id === typeId);
  return qt?.code || 'text';
}

export default function ProspectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Stores ---
  const { prospects, createProspect, updateProspect, fetchProspect } = useProspectStore();
  const { createCustomer } = useCustomerStore();
  const authUser = useAuthStore((s) => s.user);
  const industries = useMasterDataStore((s) => s.industries);
  const competitors = useMasterDataStore((s) => s.competitors);
  const addApproval = useApprovalStore((s) => s.addApproval);
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const customerTypeOptions = useActiveOptions('customer_types');

  // Ambil pertanyaan aktif dari master data dengan context 'prospect' atau 'both'
  const prospectQuestions = useMemo(() => {
    return questions
      .filter(q => (q.context === 'prospect' || q.context === 'both') && q.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [questions]);

  const existingProspect = isEdit ? prospects.find((p) => p.id === id) : null;

  // Fetch fresh data when editing (list endpoint doesn't include answers)
  useEffect(() => {
    if (isEdit && id) fetchProspect(id);
  }, [id, isEdit, fetchProspect]);

  // Sync form answers when existingProspect loads after fetch
  useEffect(() => {
    if (existingProspect?.answers) {
      setAnswers(existingProspect.answers);
    }
  }, [existingProspect?.answers]);

  // --- Branch readonly dari user login ---
  const userBranch = authUser?.branchName || 'Jakarta Pusat';

  // Customer selection: 'existing' | 'new'
  // Kalau customer sudah verified, otomatis pindah ke 'existing' meskipun dulu dibuat dengan 'new'
  const existingCustomersCheck = useCustomerStore.getState().customers;
  const isCustomerVerified = !!(existingProspect?.customerId && existingCustomersCheck.some(
    c => c.id === existingProspect.customerId && c.verifiedAt
  ));
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    isCustomerVerified ? 'existing' : (existingProspect?.customerType || 'existing')
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
  const [newCustParentId, setNewCustParentId] = useState(existingProspect?.customerData?.parentId || '');
  const [newCustLevel, setNewCustLevel] = useState(existingProspect?.customerData?.level || '');
  const [newCustRequirements, setNewCustRequirements] = useState(existingProspect?.customerData?.requirements || '');
  const [newCustUnitLevel, setNewCustUnitLevel] = useState(existingProspect?.customerData?.unitLevel || '');
  const [newCustCanonicalName, setNewCustCanonicalName] = useState(existingProspect?.customerData?.canonicalName || '');

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
  const [formValue, setFormValue] = useState<number | undefined>(existingProspect?.estimatedValue);
  const [formDate, setFormDate] = useState(existingProspect?.date ? existingProspect.date.slice(0, 10) : '');
  const [formDesc, setFormDesc] = useState(existingProspect?.description || '');

  // Source (untuk Lead dari HO)
  const [formSource, setFormSource] = useState<'ho' | 'branch'>(
    (existingProspect?.source as 'ho' | 'branch') || 'branch'
  );

  // Tipe Proyek — dari input config
  const projectTypeOptions = useActiveOptions('project_types');
  const [projectType, setProjectType] = useState<string>(
    existingProspect?.projectType || projectTypeOptions[0]?.value || 'Tender'
  );

  // Potensi Penambahan Unit
  const [potensiUnit, setPotensiUnit] = useState(
    existingProspect?.potensiUnit !== undefined ? String(existingProspect.potensiUnit) : '0'
  );

  // Answers / questionnaire — initialize from existing prospect or empty
  const [answers, setAnswers] = useState<Record<string, string>>(
    existingProspect?.answers || {}
  );

  // --- Existing customer auto-fill logic ---
  const customers = useCustomerStore((s) => s.customers);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Fetch customers for dropdowns
  React.useEffect(() => {
    if (customers.length === 0) fetchCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // --- Access gate: non-hot customers can't be edited ---
  const customerLevel = customerMode === 'existing'
    ? selectedCustomer?.level
    : (newCustLevel as 'hot' | 'medium' | 'low' | '' | undefined) || (existingProspect?.customerData?.level);
  const isEditableForm = !isEdit || !customerLevel || customerLevel === 'hot';

  const getClientName = (): string => {
    if (customerMode === 'existing' && selectedCustomer) {
      return selectedCustomer.name;
    }
    if (customerMode === 'new' && newCustName) {
      return newCustName;
    }
    return '';
  };

  const saveProspect = async (status: 'Lead' | 'Potensial' | 'Waiting Supervisor') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const clientName = getClientName();

    const authorName = authUser?.name || authUser?.fullName || 'Unknown';
    const potensi = Number(potensiUnit) || 0;
    const result = prospectSchema.safeParse({
      name: formName,
      client: clientName,
      author: authorName,
      customerId: customerMode === 'existing' ? selectedCustomerId : undefined,
      customerType: customerMode,
      estimatedValue: formValue ?? undefined,
      description: formDesc,
      branch: existingProspect?.branch || userBranch,
      potensiUnit: potensi,
      projectType,
    });

    if (!result.success) {
      const messages = result.error.issues.map((i: { message: string }) => i.message).join(', ');
      toast.error(messages);
      setIsSubmitting(false);
      return false;
    }

    // Build customerData untuk new customer
    let customerData: Customer | undefined;
    let customerId: string | undefined;
    if (customerMode === 'new') {
      const existingCustomerId = existingProspect?.customerData?.id;
      const payload: Customer = {
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
        parentId: newCustParentId || undefined,
        level: (newCustLevel as 'hot' | 'medium' | 'low') || undefined,
        requirements: newCustRequirements || undefined,
        unitLevel: newCustUnitLevel || undefined,
        canonicalName: newCustCanonicalName || undefined,
        isNew: true,
        needsVerification: true,
      };

      if (isEdit && existingCustomerId) {
        await useCustomerStore.getState().updateCustomer(existingCustomerId, payload);
        customerId = existingCustomerId;
      } else {
        const created = await createCustomer(payload);
        customerId = created.id;
        customerData = created;
      }
    } else {
      customerId = selectedCustomerId;
      customerData = undefined;
    }

    const prospectId = existingProspect?.id || String(Date.now());
    const currentTime = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const events: TimelineEvent[] = [];
    if (!isEdit) {
      const title = status === 'Lead' ? 'Lead Dibuat' : 'Prospek Dibuat';
      events.push({
        id: `evt-${prospectId}-created-${Date.now()}`,
        title,
        actor: authorName,
        role: 'Staff',
        time: currentTime,
        type: 'status_change',
        description: `Prospek "${formName}" dibuat untuk klien ${clientName}.`,
      });
    }
    if (status === 'Waiting Supervisor') {
      events.push({
        id: `evt-${prospectId}-submitted-${Date.now()}`,
        title: 'Diajukan ke Supervisor',
        actor: authorName,
        role: 'Staff',
        time: currentTime,
        type: 'submit',
        description: `Prospek "${formName}" diajukan ke Supervisor Marketing.`,
      });
    }

    const prospectType = (status === 'Potensial' || status === 'Waiting Supervisor') && potensi > 0 ? 'potensial' : undefined;

    const payload: Prospect = {
      id: prospectId,
      name: formName,
      client: clientName,
      customerId,
      customerType: customerMode,
      customerData,
      status,
      prospectType,
      potensiUnit: potensi,
      author: existingProspect?.author || authorName,
      date: formDate || currentTime,
      estimatedValue: formValue ?? undefined,
      description: formDesc,
      branch: userBranch,
      answers,
      industryId: customerMode === 'existing' ? industryId : (newCustIndustryId || undefined),
      providerExisting: providerExisting || undefined,
      projectType: projectType,
      source: formSource,
      createdByUserId: existingProspect?.createdByUserId || authUser?.id,
      timeline: [...(existingProspect?.timeline || []), ...events],
    };

    try {
      let savedId = prospectId;
      if (isEdit && existingProspect) {
        await updateProspect(existingProspect.id, payload);
      } else {
        const created = await createProspect(payload);
        savedId = created?.id || prospectId;
      }

      // Auto-create approval item when submitting to PM
      if (status === 'Waiting Supervisor') {
        addApproval({
          id: `app-prospect-${savedId}-${Date.now()}`,
          ref: `PR-${new Date().getFullYear()}-${String(prospects.length + 1).padStart(3, '0')}`,
          name: formName,
          branch: userBranch,
          waitingSince: new Date().toISOString(),
          slaStatus: 'Normal',
          type: 'Prospek',
          resourceType: 'prospect',
          resourceId: savedId,
          client: clientName,
          entityId: savedId,
          entityType: 'prospect',
          assigneeUserId: authUser?.id,
        });
      }

      toast.success(status === 'Waiting Supervisor' ? 'Prospek berhasil diajukan ke Supervisor untuk review.' : 'Draf prospek berhasil disimpan.');
      navigate('/prospects');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan prospek. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
    return true;
  };

  const handleSaveDraft = () => {
    // Saat edit, jangan regresi status — pertahankan status yang sudah ada
    if (isEdit && existingProspect) {
      return saveProspect(existingProspect.status as 'Lead' | 'Potensial' | 'Waiting Supervisor');
    }
    return saveProspect('Lead');
  };
  const handleSubmitReview = () => saveProspect('Waiting Supervisor');

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
        <div>
          <h1 className="text-xl font-extrabold text-on-surface">{isEdit ? 'Edit Prospek' : 'Buat Prospek Baru'}</h1>
          <p className="text-sm text-secondary mt-1">Lengkapi informasi prospek, data customer, dan pertanyaan standar di bawah ini.</p>
        </div>

        {!isEditableForm && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px]">lock</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Customer masih level <span className="uppercase">{customerLevel}</span></p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Hanya customer level <strong>Hot</strong> yang bisa diedit detailnya. Silakan naikkan level terlebih dahulu di halaman Kualifikasi.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* LEFT COLUMN: Customer Info */}
          <div className="lg:col-span-6 bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
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
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Customer baru — badge kuning "Perlu Verifikasi" akan tampil</span>
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
                  <select value={newCustType} onChange={(e) => setNewCustType(e.target.value as 'swasta' | 'bumn' | 'pemerintah' | 'asing')} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm">
                    {customerTypeOptions.map(t => (
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

                {/* Hierarchy fields */}
                <div className="border-t border-border pt-3 space-y-3">
                  <h4 className="font-semibold text-xs text-status-teal uppercase tracking-wider">Hierarki & Level</h4>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Sub Company / Perusahaan Induk</label>
                    <select value={newCustParentId} onChange={(e) => setNewCustParentId(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm">
                      <option value="">Tidak ada (Root)</option>
                      {customers.filter(c => !c.parentId).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Nama Perusahaan Induk (Canonical)</label>
                    <input value={newCustCanonicalName} onChange={(e) => setNewCustCanonicalName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Nama perusahaan induk untuk standarisasi" type="text" />
                    <p className="text-[10px] text-secondary">Gunakan nama yang sama untuk perusahaan induk agar project tergabung di 1 root.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Level Customer</label>
                    <select value={newCustLevel} onChange={(e) => setNewCustLevel(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm">
                      <option value="">Pilih Level</option>
                      <option value="hot">Hot</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Kebutuhan (Requirements)</label>
                    <textarea value={newCustRequirements} onChange={(e) => setNewCustRequirements(e.target.value)} rows={3} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Catat kebutuhan utama customer..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-sm text-on-surface-variant">Unit Level (Instansi Pemerintah)</label>
                    <select value={newCustUnitLevel} onChange={(e) => setNewCustUnitLevel(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm">
                      <option value="">Pilih Level</option>
                      <option value="Kementerian/Lembaga">Kementerian / Lembaga</option>
                      <option value="Direktorat">Direktorat</option>
                      <option value="Bidang">Bidang</option>
                      <option value="Sub Bidang">Sub Bidang</option>
                    </select>
                    <p className="text-[10px] text-secondary">Khusus untuk customer tipe Pemerintah.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bidang Customer / Industri (Fase 1 item 1.6) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Bidang Customer / Industri</label>
              {customerMode === 'existing' && selectedCustomer ? (
                <div className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-sm text-on-surface">
                  {(() => {
                    const ind = industries.find(i => i.id === industryId);
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
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Pilih Industri</option>
                  {industries.map(ind => (
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
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Tidak Ada</option>
                  {competitors.map(prov => (
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
            <div className="bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
              <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">assignment</span>
                Informasi Prospek
              </h3>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Nama Prospek *</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" placeholder="Contoh: Modernization of Data Center - Jakarta" type="text" aria-label="Nama Prospek" />
              </div>

              {/* Tipe Proyek — dari input config */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm"
                  aria-label="Tipe Proyek"
                >
                  {projectTypeOptions.length === 0 && (
                    <option value="Tender">Tender</option>
                  )}
                  {projectTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-secondary">Pilih sesuai kategori proyek. Opsi dikelola di Konfigurasi Input.</p>
              </div>

              {/* Estimasi Nilai Proyek — non-mandatory (Fase 1 item 1.7) */}
              <CurrencyInput
                label="Estimasi Nilai Proyek"
                value={formValue}
                onChange={setFormValue}
                placeholder="Rp 0"
              />

              {/* Estimasi Tanggal Closing — non-mandatory (Fase 1 item 1.7) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Estimasi Tanggal Closing</label>
                <input value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" type="date" aria-label="Tanggal Closing" />
              </div>

              {/* Potensi Penambahan Unit */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Potensi Penambahan Unit</label>
                <input value={potensiUnit} onChange={(e) => setPotensiUnit(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="0" type="number" min="0" aria-label="Potensi Penambahan Unit" />
                <p className="text-[10px] text-secondary">Jumlah unit yang diprediksi. Promosi Lead → Prospek membutuhkan nilai &gt; 0.</p>
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

              {/* Sumber Lead (untuk Lead dari HO) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Sumber Lead</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as 'ho' | 'branch')}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary text-sm"
                  aria-label="Sumber Lead"
                >
                  <option value="branch">Branch / Kantor Cabang</option>
                  <option value="ho">Head Office (HO)</option>
                </select>
                <p className="text-[10px] text-secondary">Pilih asal lead. HO untuk prospek dari kantor pusat.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Deskripsi</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." aria-label="Deskripsi" />
              </div>
            </div>

            {/* Questionnaire - "Pertanyaan Standar" dari Master Data */}
            <div className="bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
              <h3 className="font-bold text-sm text-status-teal border-b border-border pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">quiz</span>
                Pertanyaan Standar
              </h3>

              {prospectQuestions.length === 0 ? (
                <p className="text-sm text-secondary italic">Belum ada pertanyaan standar yang aktif.</p>
              ) : (
                prospectQuestions.map((q) => {
                  const typeCode = resolveTypeCode(questionTypes, q.question_type_id);

                  return (
                    <div key={q.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-3">
                      <p className="font-semibold text-sm text-on-surface">
                        {q.question_text}
                        {q.is_required && <span className="text-danger ml-1">*</span>}
                      </p>
                      {q.help_text && <p className="text-[10px] text-secondary">{q.help_text}</p>}

                      {(typeCode === 'text' || typeCode === 'textarea') && (
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          placeholder={q.placeholder_text || 'Masukkan jawaban...'}
                          rows={typeCode === 'textarea' ? 4 : 2}
                          className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none resize-none"
                        />
                      )}
                      {typeCode === 'number' && (
                        <input
                          type="number"
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          placeholder={q.placeholder_text || 'Masukkan angka...'}
                          className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none"
                        />
                      )}
                      {typeCode === 'date' && (
                        <input
                          type="date"
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none"
                        />
                      )}
                      {typeCode === 'checkbox' && (
                        <div className="flex gap-4 flex-wrap">
                          {q.options?.map((opt) => {
                            const selectedValues = answers[q.id] ? answers[q.id].split(', ') : [];
                            const isChecked = selectedValues.includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const newValues = isChecked
                                      ? selectedValues.filter(v => v !== opt)
                                      : [...selectedValues, opt];
                                    setAnswers({ ...answers, [q.id]: newValues.join(', ') });
                                  }}
                                  className="text-primary focus:ring-primary h-4 w-4 border-outline rounded"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {typeCode === 'select' && (
                        <select
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Pilih jawaban...</option>
                          {q.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {(typeCode === 'radio' || !['text', 'textarea', 'number', 'date', 'checkbox', 'select'].includes(typeCode)) && (
                        <div className="flex gap-4 flex-wrap">
                          {(q.options || ['Ya', 'Tidak']).map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                className="text-primary focus:ring-primary h-4 w-4 border-outline"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center bg-surface border border-border/60 p-4 rounded-2xl shadow-card">
          <button onClick={() => navigate('/prospects')} className="px-6 py-2.5 bg-surface border border-border/60 text-on-surface font-semibold rounded-xl hover:bg-surface-container transition-all text-sm">
            Kembali ke Daftar
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting || !isEditableForm}
              className="px-6 py-2.5 bg-surface border border-border/60 text-primary font-bold rounded-xl hover:bg-surface-container transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Simpan Draft"
            >
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Draft' : 'Simpan sebagai Lead')}
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting || !isEditableForm}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary-light transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Kirim ke Review"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim ke Review
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
