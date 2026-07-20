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
import { Button } from '@/components/ui';
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
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    () => (existingProspect?.customerType as 'existing' | 'new') || 'existing'
  );

  // Bersihkan state antar mode untuk mencegah data tercampur
  const switchToExisting = () => {
    setCustomerMode('existing');
    setCustomerSearch('');
    setPicName('');
    setPicPosition('');
    setPicPhone('');
    setIndustryId('');
    setProviderExisting('');
  };
  const switchToNew = () => {
    setCustomerMode('new');
    setSelectedCustomerId('');
    setPicName('');
    setPicPosition('');
    setPicPhone('');
    setIndustryId('');
    setProviderExisting('');
  };

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

  // Reset unitLevel jika tipe bukan pemerintah
  React.useEffect(() => {
    if (newCustType !== 'pemerintah' && newCustUnitLevel) {
      setNewCustUnitLevel('');
    }
  }, [newCustType]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Simplified mode: only show basic fields initially
  const [showDetail, setShowDetail] = useState(
    existingProspect?.customerData?.level === 'hot' || existingProspect?.customerData?.level === 'medium'
  );

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
  const customersLoading = useCustomerStore((s) => s.loading);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Fetch customers for dropdowns
  React.useEffect(() => {
    if (customers.length === 0) fetchCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Koreksi customerMode saat edit — jika customer sudah diverifikasi, paksa ke 'existing'
  React.useEffect(() => {
    if (isEdit && existingProspect?.customerId) {
      const cust = customers.find(c => c.id === existingProspect.customerId);
      if (cust?.verifiedAt && customerMode === 'new') {
        setCustomerMode('existing');
      }
    }
  }, [isEdit, existingProspect?.id, customers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Saat selectedCustomerId berubah, auto-fill PIC, industry, provider
  React.useEffect(() => {
    if (customerMode === 'existing' && selectedCustomer) {
      setPicName(selectedCustomer.picName);
      setPicPosition(selectedCustomer.picPosition);
      setPicPhone(selectedCustomer.picPhone);
      setIndustryId(selectedCustomer.industryId || '');
      setProviderExisting(selectedCustomer.providerExisting || '');
      setNewCustLevel(selectedCustomer.level || '');
      if (selectedCustomer.level === 'hot' || selectedCustomer.level === 'medium') {
        setShowDetail(true);
      }
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

    // Validasi new customer fields sebelum submit
    if (customerMode === 'new') {
      const errors: string[] = [];
      if (!newCustName.trim()) errors.push('Nama Customer baru wajib diisi');
      if (errors.length > 0) {
        toast.error(errors.join(', '));
        setIsSubmitting(false);
        return false;
      }
    }

    // Build customerData untuk new customer
    let customerData: Customer | undefined;
    let customerId: string | undefined;
    if (customerMode === 'new') {
      const existingCustomerId = existingProspect?.customerData?.id;
      const payload: Partial<Customer> = {
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
    setNewCustLevel(c.level || '');
    if (c.level === 'hot' || c.level === 'medium') setShowDetail(true);
  };

  const handleLevelChange = (level: string) => {
    setNewCustLevel(level);
    if (level === 'hot' || level === 'medium') {
      setShowDetail(true);
    } else {
      setShowDetail(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="font-display-title text-display-title text-on-surface">{isEdit ? 'Edit Prospek' : 'Buat Prospek Baru'}</h1>
            <p className="text-sm text-secondary mt-1">{showDetail ? 'Lengkapi detail prospek di bawah untuk prospek level ini.' : 'Isi informasi dasar prospek terlebih dahulu.'}</p>
          </div>

        {/* SIMPLIFIED BASIC FORM */}
        <div className="bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
          <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">business</span>
            Informasi Dasar Prospek
          </h3>

          {/* Toggle Existing / New Customer */}
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-border/60 w-fit">
            <button
              type="button"
              onClick={switchToExisting}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${customerMode === 'existing' ? 'bg-surface text-primary shadow-sm border border-border/60' : 'text-secondary hover:text-on-surface'}`}
            >
              Customer Existing
            </button>
            <button
              type="button"
              onClick={switchToNew}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${customerMode === 'new' ? 'bg-surface text-primary shadow-sm border border-border/60' : 'text-secondary hover:text-on-surface'}`}
            >
              + Customer Baru
            </button>
          </div>

          {customerMode === 'existing' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Cari Customer Existing</label>
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                    placeholder="Ketik nama atau kode customer..."
                    type="text"
                  />
                </div>

                {/* Loading state — tampilkan selama fetch awal */}
                {customersLoading && (
                  <div className="p-4 border border-border rounded-lg flex items-center gap-2 text-sm text-secondary">
                    <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-5 h-5" />
                    Memuat data customer...
                  </div>
                )}

                {!customersLoading && customerSearch && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-secondary">Customer tidak ditemukan</div>
                    ) : (
                      filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className={`w-full text-left p-3 text-sm hover:bg-surface-container-low transition-colors ${selectedCustomerId === c.id ? 'bg-primary/5 font-semibold' : ''}`}
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-secondary">{c.code} · {c.type}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Empty state — customers loaded, no search yet */}
                {!customersLoading && !customerSearch && customers.length === 0 && (
                  <div className="p-3 border border-border rounded-lg text-sm text-secondary">
                    Belum ada data customer. Ketik untuk mencari.
                  </div>
                )}

                {selectedCustomer && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
                    <div className="font-semibold text-sm">{selectedCustomer.name}</div>
                    <div className="text-xs text-secondary">Kode: {selectedCustomer.code} | Tipe: {selectedCustomer.type}</div>
                  </div>
                )}
              </div>
          ) : (
            <div className="space-y-4">
              {/* Badge peringatan untuk customer baru */}
              <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning font-semibold">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Customer baru — badge kuning "Perlu Verifikasi" akan tampil
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama Customer <span className="text-danger">*</span></label>
                <input value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all" placeholder="Contoh: PT. Maju Bersama" type="text" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Kode Customer</label>
                  <input value={newCustCode} onChange={(e) => setNewCustCode(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: MB" type="text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Tipe Customer</label>
                  <select value={newCustType} onChange={(e) => setNewCustType(e.target.value as 'swasta' | 'bumn' | 'pemerintah' | 'asing')} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    {customerTypeOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Kota</label>
                  <input value={newCustCity} onChange={(e) => setNewCustCity(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Kota" type="text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">NPWP (opsional)</label>
                  <input value={newCustNpwp} onChange={(e) => setNewCustNpwp(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: 01.234.567.8-091.000" type="text" />
                </div>
              </div>

              {/* Hierarki & Level */}
              <div className="border border-border/60 rounded-xl p-4 space-y-4 bg-surface-container-low/30">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  Hierarki & Level
                </h4>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Sub Company / Perusahaan Induk</label>
                  <select value={newCustParentId} onChange={(e) => setNewCustParentId(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Tidak ada (Root)</option>
                    {customers.filter(c => c.id !== selectedCustomerId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama Perusahaan Induk (Canonical)</label>
                  <input value={newCustCanonicalName} onChange={(e) => setNewCustCanonicalName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Nama perusahaan induk untuk standarisasi" type="text" />
                  <p className="text-caption-xs text-secondary">Gunakan nama yang sama untuk perusahaan induk agar project tergabung di 1 root.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Level Customer</label>
                  <select value={newCustLevel} onChange={(e) => handleLevelChange(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Pilih Level</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Kebutuhan (Requirements)</label>
                <textarea value={newCustRequirements} onChange={(e) => setNewCustRequirements(e.target.value)} rows={3} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none resize-none" placeholder="Catat kebutuhan utama customer..." />
              </div>

              {newCustType === 'pemerintah' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Unit Level (Instansi Pemerintah)</label>
                  <select value={newCustUnitLevel} onChange={(e) => setNewCustUnitLevel(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Pilih Level</option>
                    <option value="kementerian">Kementerian</option>
                    <option value="provinsi">Provinsi</option>
                    <option value="kabupaten">Kabupaten/Kota</option>
                    <option value="kecamatan">Kecamatan</option>
                    <option value="desa">Desa</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Bidang Customer / Industri</label>
                  <select value={newCustIndustryId} onChange={(e) => setNewCustIndustryId(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Pilih Industri</option>
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Provider Existing</label>
                  <select value={providerExisting} onChange={(e) => setProviderExisting(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Tidak Ada</option>
                    {competitors.map(prov => (
                      <option key={prov.id} value={prov.name}>{prov.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PIC Customer */}
              <div className="border border-border/60 rounded-xl p-4 space-y-4 bg-surface-container-low/30">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                  PIC Customer
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama PIC</label>
                    <input value={picName} onChange={(e) => setPicName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Nama lengkap PIC" type="text" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Jabatan PIC</label>
                    <input value={picPosition} onChange={(e) => setPicPosition(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: Procurement Manager" type="text" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">No HP PIC</label>
                    <input value={picPhone} onChange={(e) => setPicPhone(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: 0812-3456-7890" type="text" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <hr className="border-border" />

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama Aset / Prospek <span className="text-danger">*</span></label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all" placeholder="Contoh: Pengadaan Server - Jakarta" type="text" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Kategori Customer <span className="text-danger">*</span></label>
            <div className="flex gap-3">
              {(['low', 'medium', 'hot'] as const).map(level => {
                const isActive = customerMode === 'existing'
                  ? selectedCustomer?.level === level
                  : newCustLevel === level;
                return (
                  <label key={level} className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all text-sm font-semibold ${
                    isActive
                      ? level === 'hot' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700'
                        : level === 'medium' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700'
                        : 'border-slate-500 bg-slate-50 dark:bg-slate-900/50 text-slate-700'
                      : 'border-border text-outline hover:border-outline'
                  }`}>
                    <input
                      type="radio"
                      name="level"
                      value={level}
                      checked={isActive}
                      onChange={() => handleLevelChange(level)}
                      className="sr-only"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      level === 'hot' ? 'bg-rose-500' : level === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    {level === 'hot' ? 'Hot' : level === 'medium' ? 'Medium' : 'Low'}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Branch — READONLY */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Cabang</label>
            <div className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-sm text-on-surface">
              {userBranch}
            </div>
          </div>
        </div>

        {/* CONDITIONAL DETAIL FORM — hanya muncul jika Hot atau Medium */}
        {showDetail && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-4 flex items-start gap-3 ${
              newCustLevel === 'hot'
                ? 'bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-700'
                : 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/20'
            }`}>
              <span className={`material-symbols-outlined mt-0.5 ${newCustLevel === 'hot' ? 'text-rose-500' : 'text-primary'}`}>
                {newCustLevel === 'hot' ? 'local_fire_department' : 'expand_content'}
              </span>
              <div>
                <p className={`text-sm font-semibold ${newCustLevel === 'hot' ? 'text-rose-700 dark:text-rose-300' : 'text-on-surface'}`}>
                  Level <strong className="uppercase">{customerMode === 'existing' ? selectedCustomer?.level || newCustLevel : newCustLevel}</strong>
                </p>
                <p className={`text-xs mt-1 ${newCustLevel === 'hot' ? 'text-rose-600 dark:text-rose-400' : 'text-secondary'}`}>
                  {newCustLevel === 'hot'
                    ? 'Prospek prioritas! Silakan isi semua data detail di bawah agar prospek dapat diproses.'
                    : 'Silakan lengkapi detail prospek di bawah ini.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-6 bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
                <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">badge</span>
                  Detail Customer
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Bidang Customer / Industri</label>
                  <select value={customerMode === 'new' ? newCustIndustryId : industryId} onChange={(e) => { if (customerMode === 'new') setNewCustIndustryId(e.target.value); else setIndustryId(e.target.value); }} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Pilih Industri</option>
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Provider Existing</label>
                  <select value={providerExisting} onChange={(e) => setProviderExisting(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                    <option value="">Tidak Ada</option>
                    {competitors.map(prov => (
                      <option key={prov.id} value={prov.name}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                {/* PIC Customer */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                    PIC Customer
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama PIC</label>
                      <input value={picName} onChange={(e) => setPicName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Nama lengkap PIC" type="text" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Jabatan PIC</label>
                      <input value={picPosition} onChange={(e) => setPicPosition(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: Procurement Manager" type="text" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">No HP PIC</label>
                      <input value={picPhone} onChange={(e) => setPicPhone(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none text-sm" placeholder="Contoh: 0812-3456-7890" type="text" />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-surface border border-border/60 rounded-2xl p-6 shadow-card space-y-5">
                  <h3 className="font-bold text-sm text-primary border-b border-border pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">assignment</span>
                    Detail Prospek
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Tipe Proyek</label>
                    <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                      {projectTypeOptions.length === 0 && <option value="Tender">Tender</option>}
                      {projectTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <CurrencyInput label="Estimasi Nilai Proyek" value={formValue} onChange={setFormValue} placeholder="Rp 0" />

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Estimasi Tanggal Closing</label>
                    <input value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none" type="date" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Potensi Penambahan Unit</label>
                    <input value={potensiUnit} onChange={(e) => setPotensiUnit(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none" placeholder="0" type="number" min="0" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Sumber Lead</label>
                    <select value={formSource} onChange={(e) => setFormSource(e.target.value as 'ho' | 'branch')} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest outline-none text-sm">
                      <option value="branch">Branch / Kantor Cabang</option>
                      <option value="ho">Head Office (HO)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Deskripsi</label>
                    <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." />
                  </div>
                </div>

                {/* Questionnaire */}
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
                          {q.help_text && <p className="text-caption-xs text-secondary">{q.help_text}</p>}

                          {(typeCode === 'text' || typeCode === 'textarea') && (
                            <textarea value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={q.placeholder_text || 'Masukkan jawaban...'} rows={typeCode === 'textarea' ? 4 : 2} className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest outline-none resize-none" />
                          )}
                          {typeCode === 'number' && (
                            <input type="number" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={q.placeholder_text || 'Masukkan angka...'} className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest outline-none" />
                          )}
                          {typeCode === 'date' && (
                            <input type="date" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest outline-none" />
                          )}
                          {typeCode === 'checkbox' && (
                            <div className="flex gap-4 flex-wrap">
                              {q.options?.map((opt) => {
                                const selectedValues = answers[q.id] ? answers[q.id].split(', ') : [];
                                const isChecked = selectedValues.includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input type="checkbox" checked={isChecked} onChange={() => { const newValues = isChecked ? selectedValues.filter(v => v !== opt) : [...selectedValues, opt]; setAnswers({ ...answers, [q.id]: newValues.join(', ') }); }} className="text-primary h-4 w-4 border-outline rounded" />
                                    {opt}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {typeCode === 'select' && (
                            <select value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-lowest text-sm outline-none">
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
                                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="text-primary h-4 w-4 border-outline" />
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
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center bg-surface border border-border/60 p-4 rounded-2xl shadow-card">
          <Button variant="ghost" size="md" onClick={() => navigate('/prospects')}>
            Kembali ke Daftar
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={handleSaveDraft} isLoading={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Draft' : 'Simpan sebagai Lead')}
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmitReview} isLoading={isSubmitting} rightIcon={!isSubmitting ? <span className="material-symbols-outlined text-[18px]">send</span> : undefined}>
              {isSubmitting ? 'Mengirim...' : 'Kirim ke Review'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
