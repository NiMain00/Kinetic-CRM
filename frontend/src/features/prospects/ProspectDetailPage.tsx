import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button, Stepper, Tabs } from '@/components/ui';
import type { StepperStep, Tab } from '@/components/ui';
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
import { formatCurrency, formatCurrencyShort, formatDate } from '@/utils/formatters';

const defaultAnswers: Record<string, string> = {
  'Q-001': 'Pembelian Baru',
  'Q-002': '',
  'Q-003': '',
};

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

const workflowSteps: StepperStep[] = [
  { label: 'Dibuat' },
  { label: 'Review PM' },
  { label: 'Approval' },
  { label: 'Proyek' },
];

const detailTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'documents', label: 'Dokumen', icon: 'description' },
  { id: 'contacts', label: 'Kontak', icon: 'contacts' },
  { id: 'approval', label: 'Approval', icon: 'approval' },
  { id: 'related-project', label: 'Proyek Terkait', icon: 'business' },
];

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

const timelineBg: Record<string, string> = {
  approve: 'bg-success/20 text-success',
  submit: 'bg-primary/20 text-primary',
  revision: 'bg-warning/20 text-warning',
  upload: 'bg-status-purple/20 text-status-purple',
  status_change: 'bg-info/20 text-info',
  comment: 'bg-secondary/20 text-secondary',
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const userRole = authUser?.roleName;
  const isSuperAdmin = userRole === 'Super Admin';

  const prospect = getProspectById(id || '');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localActivities, setLocalActivities] = useState<TimelineEvent[]>([]);

  const customer = prospect?.customerId
    ? getCustomerById(prospect.customerId) || prospect.customerData
    : prospect?.customerData;

  const currentStep = useMemo(() => {
    if (prospect?.isConverted) return 3;
    if (prospect?.status === 'Approved') return 2;
    if (prospect?.status === 'Waiting PM' || prospect?.status === 'Revision') return 1;
    return 0;
  }, [prospect]);

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
    if (prospect.status === 'Waiting PM' || prospect.status === 'Revision' || prospect.status === 'Approved') {
      derived.push({
        id: `evt-${prospect.id}-submitted`,
        title: 'Diajukan untuk Review PM',
        actor: prospect.author,
        role: 'Staff',
        time: prospect.date,
        type: 'submit',
        description: `Prospek "${prospect.name}" diajukan ke Project Manager.`,
      });
    }
    if (prospect.status === 'Revision') {
      derived.push({
        id: `evt-${prospect.id}-revised`,
        title: 'Revisi Diminta',
        actor: 'Project Manager',
        role: 'PM',
        time: prospect.date,
        type: 'revision',
        description: `PM meminta revisi untuk prospek "${prospect.name}".`,
      });
    }
    if (prospect.status === 'Approved') {
      derived.push({
        id: `evt-${prospect.id}-approved`,
        title: 'Prospek Disetujui',
        actor: 'Project Manager',
        role: 'PM',
        time: prospect.date,
        type: 'approve',
        description: `Prospek "${prospect.name}" telah disetujui.`,
      });
    }
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
    return derived;
  }, [prospect]);

  const allActivities = useMemo(() => {
    const notifs = notifications
      .filter(n => n.entityId === prospect?.id)
      .map(n => ({
        id: `notif-${n.id}`,
        title: n.title,
        actor: 'System',
        role: 'System',
        time: n.createdAt || new Date().toISOString(),
        type: 'comment' as const,
        description: n.message,
      }));
    return [...localActivities, ...notifs].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [notifications, prospect, localActivities]);

  const relatedProject = useMemo(() => {
    if (prospect?.isConverted && prospect?.projectId) {
      return projects.find(p => p.id === prospect.projectId);
    }
    return null;
  }, [projects, prospect]);

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
  const isConverted = prospect.isConverted && prospect.projectId;

  const handleApprove = () => {
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

  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmit = () => {
    if (resubmitting) return;
    setResubmitting(true);
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
      assigneeUserId: authUser?.id,
    });
    toast.success('Prospek berhasil dikirim ke review.');
    addNotification({
      title: 'Prospek Disubmit',
      message: `Prospek "${prospect.name}" telah disubmit untuk direview oleh PM.`,
      type: 'approval',
      entityId: prospect.id,
      entityType: 'prospect',
    });
    setResubmitting(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProspect = () => {
    if (prospect.isConverted && prospect.projectId) {
      deleteProject(prospect.projectId);
    }
    deleteProspect(prospect.id);
    toast.success('Prospek berhasil dihapus.');
    setShowDeleteModal(false);
    navigate('/prospects');
  };

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

  const handleVerifikasi = () => {
    if (!customer?.id) {
      toast.error('Data customer tidak ditemukan.');
      return;
    }
    verifyCustomer(customer.id, authUser?.fullName || authUser?.name || 'Super Admin');
    toast.success('Customer berhasil diverifikasi!');
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    const newEvent: TimelineEvent = {
      id: `comment-${Date.now()}`,
      title: 'Komentar',
      actor: authUser?.fullName || authUser?.name || 'User',
      role: userRole || 'Staff',
      time: new Date().toISOString(),
      type: 'comment',
      description: commentText.trim(),
    };
    setLocalActivities(prev => [newEvent, ...prev]);
    setCommentText('');
    toast.success('Komentar ditambahkan.');
  };

  const renderActionButtons = () => {
    const secondaryBtnClass = 'rounded-xl';
    return (
      <div className="flex gap-2 flex-wrap justify-end">
        {!isConverted && (prospect.status === 'Potensial' || prospect.status === 'Non Potensial') && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">send</span>} onClick={handleResubmit} isLoading={resubmitting} disabled={resubmitting}>
            {resubmitting ? 'Mengirim...' : 'Kirim ke Review'}
          </Button>
        )}

        {prospect.status === 'Approved' && !isConverted && isPotensial && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">add_business</span>} onClick={handleBuatProyek}>
            Buat Proyek
          </Button>
        )}

        {prospect.status === 'Approved' && !isConverted && isNonPotensial && (
          <div className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Non-potensial tidak bisa dikonversi
          </div>
        )}

        {isConverted && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">visibility</span>} onClick={() => navigate(`/project/${prospect.projectId}/overview`)}>
            Lihat Proyek
          </Button>
        )}

        {prospect.status === 'Waiting PM' && (
          <>
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">check_circle</span>} onClick={handleApprove}>
              Setujui
            </Button>
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">edit_note</span>} onClick={handleRequestRevision}>
              Revisi
            </Button>
          </>
        )}

        {prospect.status === 'Revision' && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>} onClick={handleResubmit} isLoading={resubmitting} disabled={resubmitting}>
            {resubmitting ? 'Mengirim...' : 'Kirim Ulang ke PM'}
          </Button>
        )}

        <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>} onClick={() => navigate(`/prospects/${prospect.id}/edit`)}>
          Edit
        </Button>

        <button onClick={handleDelete} className="px-3 py-1.5 border border-danger/30 text-danger rounded-xl text-sm font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5" aria-label="Hapus prospek">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ─── HEADER CARD ─── */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface truncate">{prospect.name}</h1>
                <StatusBadge status={needsVerification ? 'Perlu Verifikasi' : prospect.status} />
              </div>
              <p className="text-sm text-secondary">{prospect.client}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                <div>
                  <span className="text-outline text-xs">Status</span>
                  <p className="font-semibold text-on-surface">{prospect.status}</p>
                </div>
                <div>
                  <span className="text-outline text-xs">PIC</span>
                  <p className="font-semibold text-on-surface">{prospect.author}</p>
                </div>
                <div>
                  <span className="text-outline text-xs">Cabang</span>
                  <p className="font-semibold text-on-surface">{prospect.branch || '-'}</p>
                </div>
                <div>
                  <span className="text-outline text-xs">Nilai</span>
                  <p className="font-semibold text-on-surface">{formatCurrencyShort(prospect.estimatedValue || 0)}</p>
                </div>
                <div>
                  <span className="text-outline text-xs">Deadline</span>
                  <p className="font-semibold text-on-surface">-</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 min-w-[200px] text-right w-full">
                <p className="text-xs text-secondary mb-1">Nilai Prospek</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrencyShort(prospect.estimatedValue || 0)}</p>
                {prospect.estimatedValue !== undefined && (
                  <p className="text-[10px] text-outline mt-0.5">{formatCurrency(prospect.estimatedValue)}</p>
                )}
              </div>
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {/* ─── WORKFLOW STEPPER ─── */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
            <h3 className="font-bold text-sm text-on-surface">Progress Prospek</h3>
          </div>
          <Stepper steps={workflowSteps} currentStep={currentStep} />
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: 'inventory_2', label: 'Potensi Unit', value: `${prospect.potensiUnit} Unit` },
            { icon: 'category', label: 'Tipe Prospek', value: isNonPotensial ? 'Non Potensial' : isPotensial ? 'Potensial' : prospect.status },
            { icon: 'work', label: 'Tipe Proyek', value: prospect.projectType || '-' },
            { icon: 'location_on', label: 'Cabang', value: prospect.branch || '-' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-xl border border-border/60 shadow-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-secondary">{stat.label}</p>
                <p className="text-sm font-bold text-on-surface truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── MAIN 2-COLUMN CONTENT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Tabs Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface rounded-2xl border border-border/60 shadow-card">
              <div className="px-5 pt-5">
                <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
              </div>
              <div className="p-5">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {prospect.description && (
                      <div>
                        <h4 className="font-bold text-xs text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          Deskripsi
                        </h4>
                        <p className="text-sm text-secondary leading-relaxed">{prospect.description}</p>
                      </div>
                    )}
                    {prospect.providerExisting && (
                      <div>
                        <h4 className="font-bold text-xs text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">provider</span>
                          Provider Existing
                        </h4>
                        <p className="text-sm font-semibold text-on-surface">{prospect.providerExisting}</p>
                      </div>
                    )}
                    {prospect.industryId && industryMap[prospect.industryId] && (
                      <div>
                        <h4 className="font-bold text-xs text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">business</span>
                          Bidang Customer
                        </h4>
                        <p className="text-sm font-semibold text-on-surface">{industryMap[prospect.industryId]}</p>
                      </div>
                    )}
                    {prospect.answers && Object.keys(prospect.answers).length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-outline uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">quiz</span>
                          Jawaban Pertanyaan Standar
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(prospect.answers).map(([key, value]) => {
                            const masterQ = questions.find(q => q.id === key);
                            const label = masterQ?.question_text || legacyLabels[key] || key;
                            return (
                              <div key={key} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                                <p className="text-xs text-outline font-semibold mb-1">{label}</p>
                                <p className="text-sm font-semibold text-on-surface">{value || '-'}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {!prospect.description && (!prospect.answers || Object.keys(prospect.answers).length === 0) && (
                      <div className="text-center py-12 text-outline">
                        <span className="material-symbols-outlined text-4xl">overview</span>
                        <p className="text-sm font-medium mt-2">Tidak ada data tambahan</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DOKUMEN TAB ── */}
                {activeTab === 'documents' && (
                  <div className="text-center py-12 text-outline">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl text-outline/50">description</span>
                    </div>
                    <p className="text-sm font-medium">Belum ada dokumen</p>
                    <p className="text-xs mt-1">Dokumen terkait prospek akan muncul di sini.</p>
                  </div>
                )}

                {/* ── KONTAK TAB ── */}
                {activeTab === 'contacts' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-secondary">Nama Customer</p>
                        <p className="font-semibold text-on-surface">{prospect.client}</p>
                      </div>
                      {customer && (
                        <>
                          <div>
                            <p className="text-xs text-secondary">Kode Customer</p>
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
                        </>
                      )}
                    </div>

                    {customer?.needsVerification && customer?.id && (
                      <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-warning">
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          <span>Customer perlu diverifikasi</span>
                        </div>
                        <Button
                          variant={isSuperAdmin ? 'warning' : 'secondary'}
                          size="sm"
                          disabled={!isSuperAdmin}
                          onClick={handleVerifikasi}
                        >
                          {isSuperAdmin ? 'Verifikasi' : 'Tidak bisa'}
                        </Button>
                      </div>
                    )}

                    {customer?.verifiedAt && customer?.verifiedBy && (
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2 text-xs text-success">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Terverifikasi oleh {customer.verifiedBy} pada {formatDate(customer.verifiedAt)}
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-secondary mb-2">PIC Customer</p>
                      <div className="bg-surface-container-low p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {(customer?.picName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{customer?.picName || '-'}</p>
                            <p className="text-xs text-secondary">{customer?.picPosition || '-'}</p>
                          </div>
                        </div>
                        {customer?.picPhone && (
                          <div className="flex items-center gap-2 text-sm text-secondary">
                            <span className="material-symbols-outlined text-[16px]">phone</span>
                            {customer.picPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── APPROVAL TAB ── */}
                {activeTab === 'approval' && (
                  <div className="space-y-4">
                    {prospect.status === 'Waiting PM' && (
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
                        <span className="material-symbols-outlined text-warning text-[24px]">hourglass_top</span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">Menunggu Persetujuan PM</p>
                          <p className="text-xs text-secondary">Prospek sedang dalam antrian review Project Manager.</p>
                        </div>
                      </div>
                    )}
                    {prospect.status === 'Approved' && (
                      <div className="p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3">
                        <span className="material-symbols-outlined text-success text-[24px]">check_circle</span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">Prospek Disetujui</p>
                          <p className="text-xs text-secondary">Prospek telah mendapatkan persetujuan.</p>
                        </div>
                      </div>
                    )}
                    {prospect.status === 'Revision' && (
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
                        <span className="material-symbols-outlined text-warning text-[24px]">edit_note</span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">Revisi Diminta</p>
                          <p className="text-xs text-secondary">PM meminta revisi sebelum menyetujui prospek.</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-surface-container-low p-4 rounded-lg">
                      <p className="text-xs text-secondary">Status Approval</p>
                      <p className="text-sm font-semibold text-on-surface mt-1">{prospect.status}</p>
                    </div>
                  </div>
                )}

                {/* ── PROYEK TERKAIT TAB ── */}
                {activeTab === 'related-project' && (
                  <div>
                    {relatedProject ? (
                      <div className="space-y-4">
                        <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-secondary">Kode Proyek</p>
                              <p className="text-sm font-bold text-on-surface">{relatedProject.code}</p>
                            </div>
                            <StatusBadge status={relatedProject.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-secondary">Nama Proyek</p>
                              <p className="font-semibold text-on-surface">{relatedProject.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary">Lokasi</p>
                              <p className="font-semibold text-on-surface">{relatedProject.location}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary">Nilai</p>
                              <p className="font-semibold text-on-surface">{formatCurrencyShort(relatedProject.estimatedValue || 0)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary">Progress</p>
                              <p className="font-semibold text-on-surface">{relatedProject.progress}%</p>
                            </div>
                          </div>
                          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">open_in_new</span>} onClick={() => navigate(`/project/${relatedProject.id}/overview`)}>
                            Buka Detail Proyek
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-outline">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-3xl text-outline/50">business</span>
                        </div>
                        <p className="text-sm font-medium">Belum ada proyek terkait</p>
                        <p className="text-xs mt-1">Prospek ini belum dikonversi menjadi proyek.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT: Timeline + Activity */}
          <div className="lg:col-span-4 space-y-6">

            {/* Timeline Card */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                Riwayat Status
              </h3>
              <div className="space-y-0">
                {events.map((event, idx) => {
                  const bgColor = timelineBg[event.type] || 'text-secondary bg-surface-container-lowest';
                  return (
                    <div key={event.id} className="relative pb-5 pl-9 last:pb-0">
                      {idx < events.length - 1 && (
                        <div className="absolute left-4 top-6 w-0.5 h-full bg-border/60" />
                      )}
                      <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${bgColor} border-0`}>
                        <span className="material-symbols-outlined text-[15px]">{actionIcon(event.type)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{event.title}</p>
                        <p className="text-[11px] text-outline mt-0.5">{event.actor} &middot; {event.role}</p>
                        {event.description && (
                          <p className="text-xs text-secondary mt-1 leading-relaxed">{event.description}</p>
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
                  );
                })}
              </div>
            </div>

            {/* Activity Feed Card */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                Aktivitas
              </h3>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
                  placeholder="Tulis komentar..."
                  className="flex-1 border border-border rounded-lg text-sm p-2.5 outline-none focus:ring-1 focus:ring-primary bg-surface-container-low"
                />
                <Button variant="primary" size="sm" onClick={handleSendComment} disabled={!commentText.trim()}>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {allActivities.length === 0 ? (
                  <div className="text-center py-8 text-outline">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-2xl text-outline/50">chat</span>
                    </div>
                    <p className="text-sm font-medium">Belum ada aktivitas</p>
                    <p className="text-xs">Komentar dan notifikasi akan muncul di sini.</p>
                  </div>
                ) : (
                  allActivities.map((act) => {
                    const bgColor = timelineBg[act.type] || 'text-secondary bg-surface-container-lowest';
                    return (
                      <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
                          <span className="material-symbols-outlined text-[14px]">{actionIcon(act.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-on-surface truncate">{act.title}</p>
                            <span className="text-[10px] text-outline whitespace-nowrap">{act.time}</span>
                          </div>
                          {act.description && (
                            <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">{act.description}</p>
                          )}
                          <p className="text-[10px] text-outline mt-0.5">{act.actor} &middot; {act.role}</p>
                        </div>
                      </div>
                    );
                  })
                )}
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
        {isConverted && (
          <p className="text-sm text-danger mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Proyek terkait ({prospect.projectId}) juga akan dihapus.
          </p>
        )}
      </Modal>
    </div>
  );
}
