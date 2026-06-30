import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import StatusBadge from '@/components/shared/StatusBadge';
import { INITIAL_TIMELINE_EVENTS } from '@/services/mock-data';
import type { TimelineEvent } from '@/types/domain';
import { useProspectStore } from '@/stores/prospectStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useNotificationStore } from '@/stores/notificationStore';

const defaultAnswers: Record<string, string> = {
  'Q-001': 'Pembelian Baru',
  'Q-002': '',
  'Q-003': '',
};

// Labels resolved from master data at render time (fallback for old data)
const legacyLabels: Record<string, string> = {
  tipePengadaanUnit: 'Tipe Pengadaan Unit',
  jenisUnitDibutuhkan: 'Jenis Unit yang Dibutuhkan',
  spesifikasiPengadaanUnit: 'Spesifikasi & Detail Kebutuhan Pengadaan Unit',
  upsCapacity: 'Spesifikasi UPS di lokasi Cabang',
  isFiberOpticReady: 'Jalur FO (Fiber Optic) aktif dari ISP',
  groundingCableOption: 'Kebutuhan Proteksi Kelistrikan Ruang Server',
  jenisPengadaan: 'Apakah jenis pengadaan customer beli putus?',
  detailKebutuhanUnit: 'Detail kebutuhan pengadaan unit',
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- Stores ---
  const getProspectById = useProspectStore((s) => s.getProspectById);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const verifyCustomer = useCustomerStore((s) => s.verifyCustomer);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const addProject = useProjectStore((s) => s.addProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const projects = useProjectStore((s) => s.projects);
  const { approvals, approveItem, addApproval } = useApprovalStore();

  const authUser = useAuthStore((s) => s.user);
  const industries = useMasterDataStore((s) => s.industries);
  const questions = useMasterDataStore((s) => s.questions);
  const industryMap = useMemo(
    () => Object.fromEntries(industries.map(i => [i.id, i.name])),
    [industries]
  );
  const addNotification = useNotificationStore((s) => s.addNotification);
  const userRole = authUser?.roleName;
  const isSuperAdmin = userRole === 'Super Admin';

  const prospect = getProspectById(id || '');
  const events = useMemo(() => {
    if (!prospect) return INITIAL_TIMELINE_EVENTS;
    const derived: TimelineEvent[] = [
      {
        id: `evt-${prospect.id}-created`,
        title: 'Prospek Dibuat',
        actor: prospect.author,
        role: 'Staff',
        time: prospect.date,
        type: 'status_change',
        description: `Prospek "${prospect.name}" dibuat untuk klien ${prospect.client}.`,
      },
    ];
    if (prospect.isConverted && prospect.projectId) {
      derived.push({
        id: `evt-${prospect.id}-converted`,
        title: 'Dikonversi ke Proyek',
        actor: 'System',
        role: 'System',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'approve',
        description: `Prospek dikonversi menjadi proyek ${prospect.projectId}.`,
      });
    }
    return derived.length > 1 ? derived : INITIAL_TIMELINE_EVENTS;
  }, [prospect]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Cari customer terkait (untuk data verifikasi & auto-fill)
  const customer = prospect?.customerId
    ? getCustomerById(prospect.customerId) || prospect.customerData
    : prospect?.customerData;

  if (!prospect) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
          <h2 className="text-xl font-bold text-on-surface">Prospek Tidak Ditemukan</h2>
          <p className="text-secondary text-sm">Prospek dengan ID {id} tidak tersedia.</p>
          <button onClick={() => navigate('/prospects')} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:brightness-110 transition-all">
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  const isNonPotensial = prospect.status === 'Non Potensial' || prospect.prospectType === 'non_potensial';
  const isPotensial = prospect.status === 'Potensial' || prospect.prospectType === 'potensial';
  const needsVerification = customer?.needsVerification;

  // Cek apakah prospect sudah dikonversi ke proyek
  const isConverted = prospect.isConverted && prospect.projectId;


  const actionIcon = (type: string) => {
    const map: Record<string, string> = {
      approve: 'check_circle',
      submit: 'send',
      revision: 'edit_note',
      upload: 'upload_file',
      status_change: 'swap_horiz',
      comment: 'chat',
    };
    return map[type] || 'circle';
  };

  const actionColor = (type: string) => {
    const map: Record<string, string> = {
      approve: 'text-success',
      submit: 'text-primary',
      revision: 'text-warning',
      upload: 'text-status-purple',
      status_change: 'text-info',
      comment: 'text-secondary',
    };
    return map[type] || 'text-secondary';
  };

  const handleApprove = () => {
    // Remove any pending approval for this prospect
    const pendingApproval = approvals.find(a => a.entityId === prospect.id && a.entityType === 'prospect');
    if (pendingApproval) {
      approveItem(pendingApproval.id);
    }
    updateProspect(prospect.id, { status: 'Approved' });
    toast.success('Prospek berhasil disetujui.');
    addNotification({
      title: 'Prospek Disetujui',
      message: `Prospek "${prospect.name}" telah disetujui.`,
      type: 'approval',
      entityId: prospect.id,
      entityType: 'prospect',
    });
  };

  const handleRequestRevision = () => {
    // Remove any pending approval for this prospect
    const pendingApproval = approvals.find(a => a.entityId === prospect.id && a.entityType === 'prospect');
    if (pendingApproval) {
      approveItem(pendingApproval.id);
    }
    updateProspect(prospect.id, { status: 'Revision' });
    toast.success('Permintaan revisi telah dikirim.');
    addNotification({
      title: 'Revisi Prospek',
      message: `Revisi diminta untuk prospek "${prospect.name}". Silakan periksa dan perbaiki.`,
      type: 'revision',
      entityId: prospect.id,
      entityType: 'prospect',
    });
  };

  const handleResubmit = () => {
    updateProspect(prospect.id, { status: 'Waiting PM' });
    addApproval({
      id: `app-prospect-${prospect.id}`,
      ref: `PR-${new Date().getFullYear()}-${String(prospect.id).slice(-3).padStart(3, '0')}`,
      name: prospect.name,
      branch: prospect.branch || 'Jakarta Pusat',
      waitingSince: new Date().toISOString(),
      slaStatus: 'Normal',
      type: 'Prospek',
      client: prospect.client,
      entityId: prospect.id,
      entityType: 'prospect',
    });
    toast.success('Prospek berhasil dikirim ke review.');
    addNotification({
      title: 'Prospek Disubmit',
      message: `Prospek "${prospect.name}" telah disubmit untuk direview oleh PM.`,
      type: 'approval',
      entityId: prospect.id,
      entityType: 'prospect',
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProspect = () => {
    // Jika prospek sudah dikonversi ke proyek, hapus juga proyeknya
    if (prospect.isConverted && prospect.projectId) {
      deleteProject(prospect.projectId);
    }
    deleteProspect(prospect.id);
    toast.success('Prospek berhasil dihapus.');
    setShowDeleteModal(false);
    navigate('/prospects');
  };

  // --- KONVERSI KE PROYEK (Fase 3 item 3.3) ---
  const handleBuatProyek = () => {
    const newProject = {
      id: `PRJ-${Date.now()}`,
      code: `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(4, '0')}`,
      name: prospect.name,
      client: prospect.client,
      status: 'Prospecting',
      phase: 'Overview',
      location: prospect.branch || '-',
      author: prospect.author,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: 0,
      estimatedValue: prospect.estimatedValue || 0,
      type: prospect.projectType || 'Prospecting' as const,
      sourceProspectId: prospect.id,
      providerExisting: prospect.providerExisting,
    };

    addProject(newProject);
    updateProspect(prospect.id, {
      isConverted: true,
      projectId: newProject.id,
    });

    toast.success('Prospek berhasil dikonversi ke proyek!');
    navigate(`/project/${newProject.id}/overview`);
  };

  // --- VERIFIKASI CUSTOMER (Fase 3 item 3.5) — hanya Super Admin ---
  const handleVerifikasi = () => {
    if (!customer?.id) {
      toast.error('Data customer tidak ditemukan.');
      return;
    }
    verifyCustomer(customer.id, authUser?.fullName || authUser?.name || 'Super Admin');
    toast.success('Customer berhasil diverifikasi!');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface">{prospect.name}</h1>
                <StatusBadge status={needsVerification ? 'Perlu Verifikasi' : prospect.status} />
              </div>
              <p className="text-sm text-secondary">{prospect.client}</p>
              <div className="flex items-center gap-4 text-xs text-outline mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {prospect.author}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {prospect.date}
                </span>
                {prospect.estimatedValue && (
                  <span className="flex items-center gap-1 font-mono font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    Rp {prospect.estimatedValue.toLocaleString('id-ID')}
                  </span>
                )}
                {prospect.branch && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">business</span>
                    {prospect.branch}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => navigate(`/prospects/${prospect.id}/edit`)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>

              {/* Tombol "Kirim ke Review" — ketika customer sudah diverifikasi & status masih draft (Potensial/Non Potensial) */}
              {!needsVerification && customer?.verifiedAt && !isConverted &&
               (prospect.status === 'Potensial' || prospect.status === 'Non Potensial') && (
                <button onClick={handleResubmit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Kirim ke Review
                </button>
              )}

              {/* Kondisional: "Buat Proyek" untuk Approved + Potensial saja */}
              {prospect.status === 'Approved' && !isConverted && isPotensial && (
                <button onClick={handleBuatProyek} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">add_business</span>
                  Buat Proyek
                </button>
              )}

              {/* Non-potensial approved: info bahwa tidak bisa convert */}
              {prospect.status === 'Approved' && !isConverted && isNonPotensial && (
                <div className="px-4 py-2 bg-surface-container-low border border-border rounded-lg text-xs text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Prospek non-potensial tidak dapat dikonversi ke proyek
                </div>
              )}

              {/* Sudah dikonversi → "Lihat Proyek" (Fase 3 item 3.4) */}
              {isConverted && (
                <button
                  onClick={() => navigate(`/project/${prospect.projectId}/overview`)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Lihat Proyek
                </button>
              )}

              {prospect.status === 'Waiting PM' && (
                <>
                  <button onClick={handleApprove} className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5" aria-label="Setujui prospek">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Setujui
                  </button>
                  <button onClick={handleRequestRevision} className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5" aria-label="Minta revisi">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    Revisi
                  </button>
                </>
              )}

              {prospect.status === 'Revision' && (
                <button onClick={handleResubmit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5" aria-label="Kirim ulang ke PM">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Kirim Ulang ke PM
                </button>
              )}

              <button onClick={handleDelete} className="px-4 py-2 border border-danger text-danger rounded-lg text-sm font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5" aria-label="Hapus prospek">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Detail */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview Section */}
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">overview</span>
                Overview Prospek
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-secondary">Potensi Penambahan Unit</p>
                  <p className="font-semibold text-on-surface">{prospect.potensiUnit} unit</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Tipe Prospek</p>
                  <p className="font-semibold text-on-surface">
                    {isNonPotensial ? 'Non Potensial' : isPotensial ? 'Potensial' : prospect.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Tipe Proyek</p>
                  <p className="font-semibold text-on-surface">
                    {prospect.projectType || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Customer</p>
                  <p className="font-semibold text-on-surface">{prospect.client}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Cabang</p>
                  <p className="font-semibold text-on-surface">{prospect.branch || '-'}</p>
                </div>
                {/* Provider Existing — tampilkan jika ada */}
                {prospect.providerExisting && (
                  <div className="col-span-2">
                    <p className="text-xs text-secondary">Provider Existing</p>
                    <p className="font-semibold text-on-surface">{prospect.providerExisting}</p>
                  </div>
                )}
                {/* Bidang Customer / Industri — tampilkan jika ada */}
                {prospect.industryId && industryMap[prospect.industryId] && (
                  <div>
                    <p className="text-xs text-secondary">Bidang Customer</p>
                    <p className="font-semibold text-on-surface">{industryMap[prospect.industryId]}</p>
                  </div>
                )}
                {/* Status konversi */}
                {isConverted && (
                  <div>
                    <p className="text-xs text-secondary">Sudah dikonversi</p>
                    <p className="font-semibold text-success flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Ya — {prospect.projectId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">business</span>
                Informasi Customer
                {customer?.needsVerification && customer?.id && (
                  <button
                    onClick={handleVerifikasi}
                    disabled={!isSuperAdmin}
                    className={`ml-2 px-3 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                      isSuperAdmin
                        ? 'bg-primary text-white hover:brightness-110 cursor-pointer'
                        : 'bg-surface-container-low text-outline cursor-not-allowed'
                    }`}
                    title={!isSuperAdmin ? 'Hanya Super Admin yang bisa verifikasi' : 'Klik untuk verifikasi customer'}
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    {isSuperAdmin ? 'Verifikasi Customer' : 'Tidak bisa verifikasi'}
                  </button>
                )}
              </h3>

              {/* Verification badge info */}
              {customer?.verifiedAt && customer?.verifiedBy && (
                <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Terverifikasi oleh {customer.verifiedBy} pada {new Date(customer.verifiedAt).toLocaleDateString('id-ID')}
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-secondary">Nama Customer</p>
                  <p className="font-semibold text-on-surface">{prospect.client}</p>
                </div>
                {customer && (
                  <>
                    <div>
                      <p className="text-xs text-secondary">Kode</p>
                      <p className="font-semibold text-on-surface">{customer.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Tipe</p>
                      <p className="font-semibold text-on-surface capitalize">{customer.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Kota</p>
                      <p className="font-semibold text-on-surface">{customer.city}</p>
                    </div>
                    {customer.npwp && (
                      <div>
                        <p className="text-xs text-secondary">NPWP</p>
                        <p className="font-semibold text-on-surface">{customer.npwp}</p>
                      </div>
                    )}
                    {/* Bidang customer (industri) */}
                    {customer.industryId && industryMap[customer.industryId] && (
                      <div>
                        <p className="text-xs text-secondary">Bidang / Industri</p>
                        <p className="font-semibold text-on-surface">{industryMap[customer.industryId]}</p>
                      </div>
                    )}
                    {/* Provider Existing */}
                    {customer.providerExisting && (
                      <div>
                        <p className="text-xs text-secondary">Provider Existing</p>
                        <p className="font-semibold text-on-surface">{customer.providerExisting}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="col-span-2 border-t border-border pt-3 mt-1">
                  <p className="text-xs text-secondary mb-1">PIC Customer</p>
                  <div className="bg-surface-container-low p-3 rounded-lg space-y-1">
                    <p className="font-medium text-on-surface">
                      {customer?.picName || '-'}
                    </p>
                    <p className="text-xs text-secondary">{customer?.picPosition || '-'}</p>
                    <p className="text-xs text-secondary">{customer?.picPhone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                Deskripsi
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {prospect.description || 'Tidak ada deskripsi.'}
              </p>
            </div>

            {/* Dynamic Questionnaire Answers */}
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
                Jawaban Pertanyaan Standar
              </h3>
              <div className="space-y-4">
                {(prospect.answers || defaultAnswers) && Object.entries(prospect.answers || defaultAnswers).map(([key, value]) => {
                  // Resolve label dari master data pertanyaan
                  const masterQ = questions.find(q => q.id === key);
                  const label = masterQ?.question_text || legacyLabels[key] || key;
                  return (
                    <div key={key} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                      <p className="text-xs text-outline font-semibold mb-1">{label}</p>
                      <p className="text-sm font-semibold text-on-surface">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Status Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                Riwayat Status
              </h3>
              <div className="space-y-0">
                {events.map((event, idx) => (
                  <div key={event.id} className="relative pb-6 pl-8 last:pb-0">
                    {idx < events.length - 1 && (
                      <div className="absolute left-3.5 top-6 w-0.5 h-full bg-border" />
                    )}
                    <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center ${actionColor(event.type)} bg-surface-container-lowest border-2 border-current`}>
                      <span className="material-symbols-outlined text-[14px]">{actionIcon(event.type)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{event.title}</p>
                      <p className="text-xs text-outline mt-0.5">{event.actor} · {event.role}</p>
                      {event.description && (
                        <p className="text-xs text-secondary mt-1 italic">{event.description}</p>
                      )}
                      {(event.prevVal || event.newVal) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {event.prevVal && <span className="line-through text-outline">{event.prevVal}</span>}
                          {event.newVal && <span className="font-semibold text-on-surface">{event.newVal}</span>}
                        </div>
                      )}
                      {event.fileName && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                          <span className="material-symbols-outlined text-[14px]">attach_file</span>
                          {event.fileName} {event.fileSize && `(${event.fileSize})`}
                        </div>
                      )}
                      <p className="text-[10px] text-outline mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDeleteProspect}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus prospek ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
