import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button, Stepper, Tabs } from '@/components/ui';
import type { StepperStep, Tab } from '@/components/ui';
import StatusBadge from '@/components/shared/StatusBadge';
import type { TimelineEvent } from '@/types/domain';
import { useProspectStore } from '@/stores/prospectStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useRbacStore } from '@/stores/rbacStore';
import { useInputConfigStore } from '@/stores/inputConfigStore';
import { useRelationStore } from '@/stores/relationStore';
import { eventBus } from '@/services/eventBridge';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/utils/formatters';

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

const STATUS_LABELS: Record<string, string> = {
  'Waiting Supervisor': 'Menunggu Supervisor',
  'Non Potensial': 'Non Potensial',
  'Potensial': 'Potensial',
  'Revision': 'Revisi',
  'Approved': 'Disetujui',
};

const workflowSteps: StepperStep[] = [
  { label: 'Dibuat' },
  { label: 'Review Supervisor' },
  { label: 'Approval' },
  { label: 'Proyek' },
];

const detailTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'documents', label: 'Dokumen', icon: 'description' },
  { id: 'contacts', label: 'Kontak', icon: 'contacts' },
  { id: 'approval', label: 'Approval', icon: 'approval' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
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

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-outline">{label}</p>
      <p className="text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

type PillColor = 'green' | 'teal' | 'blue' | 'purple' | 'gold';

const pillStyles: Record<PillColor, string> = {
  green: 'bg-primary/10 text-primary border-primary/20',
  teal: 'bg-status-teal/10 text-status-teal border-status-teal/20',
  blue: 'bg-info/10 text-info border-info/20',
  purple: 'bg-status-purple/10 text-status-purple border-status-purple/20',
  gold: 'bg-gold/10 text-gold-dark border-gold/20',
};

const pillIconStyles: Record<PillColor, string> = {
  green: 'text-primary',
  teal: 'text-status-teal',
  blue: 'text-info',
  purple: 'text-status-purple',
  gold: 'text-gold-dark',
};

function InfoPill({ icon, label, color = 'green' }: { icon: string; label: string; color?: PillColor }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${pillStyles[color]}`}>
      <span className={`material-symbols-outlined text-[14px] ${pillIconStyles[color]}`}>{icon}</span>
      {label}
    </span>
  );
}

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const updateProspect = useProspectStore((s) => s.updateProspect);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const addProspectTimelineEvent = useProspectStore((s) => s.addTimelineEvent);
  const fetchProspect = useProspectStore((s) => s.fetchProspect);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const verifyCustomer = useCustomerStore((s) => s.verifyCustomer);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getProjectById = useProjectStore((s) => s.getProjectById);

  useEffect(() => {
    if (id) { fetchProspect(id); fetchCustomers(); }
  }, [id, fetchProspect, fetchCustomers]);
  const { approvals, approveItem, addApproval } = useApprovalStore();

  const authUser = useAuthStore((s) => s.user);
  const { can, stageAccess } = useAuthz();
  const questions = useMasterDataStore((s) => s.questions);
  const industries = useMasterDataStore((s) => s.industries);
  const industryMap = useMemo(
    () => Object.fromEntries(industries.map(i => [i.id, i.name])),
    [industries]
  );
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const userRole = authUser?.roleName;
  const isSuperAdmin = userRole === 'Super Admin';

  const prospect = useProspectStore((s) => id ? s.entities[id] : undefined);
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
    if (prospect?.status === 'Waiting Supervisor' || prospect?.status === 'Revision') return 1;
    return 0;
  }, [prospect]);

  const events = useMemo(() => {
    return (prospect?.timeline || []).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [prospect?.timeline]);

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

  const relatedProjectId = useRelationStore((s) => s.getProjectByProspect(prospect?.id || ''));
  const relatedProject = useMemo(() => {
    if (prospect?.isConverted && relatedProjectId) {
      return getProjectById(relatedProjectId);
    }
    return null;
  }, [getProjectById, prospect, relatedProjectId]);

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
  const tipeProspek = isNonPotensial ? 'Non Potensial' : isPotensial ? 'Potensial' : (STATUS_LABELS[prospect.status] || prospect.status);

  const handleApprove = () => {
    const pendingApproval = approvals.find(a => a.entityId === prospect.id && a.entityType === 'prospect');
    if (pendingApproval) {
      approveItem(pendingApproval.id);
    }
    updateProspect(prospect.id, { status: 'Approved' });
    addProspectTimelineEvent(prospect.id, {
      id: `evt-${prospect.id}-approved-${Date.now()}`,
      title: 'Prospek Disetujui',
      actor: authUser?.fullName || authUser?.name || 'Supervisor Marketing',
      role: userRole || 'Waiting Supervisor',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'approve',
      description: `Prospek "${prospect.name}" telah disetujui.`,
    });
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
    addProspectTimelineEvent(prospect.id, {
      id: `evt-${prospect.id}-revised-${Date.now()}`,
      title: 'Revisi Diminta',
      actor: authUser?.fullName || authUser?.name || 'Supervisor Marketing',
      role: userRole || 'Waiting Supervisor',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'revision',
      description: `Supervisor Marketing meminta revisi untuk prospek "${prospect.name}".`,
    });
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
    updateProspect(prospect.id, { status: 'Waiting Supervisor', currentStageId: 'stage-supervisor-review' });
    addProspectTimelineEvent(prospect.id, {
      id: `evt-${prospect.id}-resubmitted-${Date.now()}`,
      title: 'Diajukan Ulang ke Supervisor',
      actor: authUser?.fullName || authUser?.name || prospect.author,
      role: userRole || 'Staff',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'submit',
      description: `Prospek "${prospect.name}" diajukan ulang setelah revisi.`,
    });
    addApproval({
      id: `app-prospect-${prospect.id}-${Date.now()}`,
      ref: `PR-${new Date().getFullYear()}-${String(prospect.id).slice(-3).padStart(3, '0')}`,
      name: prospect.name,
      branch: prospect.branch || 'Jakarta Pusat',
      waitingSince: new Date().toISOString(),
      slaStatus: 'Normal',
      type: 'Prospek',
      resourceType: 'prospect',
      resourceId: prospect.id,
      client: prospect.client,
      entityId: prospect.id,
      entityType: 'prospect',
      assigneeUserId: authUser?.id,
    });
    toast.success('Prospek berhasil dikirim ke review.');
    addNotification({
      title: 'Prospek Disubmit',
      message: `Prospek "${prospect.name}" telah disubmit untuk direview oleh Supervisor.`,
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
    // Emit event — handler will clean up approvals, relations, and optionally cascade project
    eventBus.emit({
      type: 'PROSPECT_DELETED',
      prospectId: prospect.id,
      cascadeProjectId: prospect.isConverted && prospect.projectId
        ? prospect.projectId
        : undefined,
      timestamp: new Date().toISOString(),
    });
    // Store action just removes local data
    deleteProspect(prospect.id);
    toast.success('Prospek berhasil dihapus.');
    setShowDeleteModal(false);
    navigate('/prospects');
  };

  const handleBuatProyek = () => {
    navigate('/projects/new', { state: { fromProspect: prospect } });
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
    // Determine current workflow stage code from the stage ID
    const stageCode = useRbacStore.getState().workflowStages.find(
      (s) => s.id === prospect.currentStageId
    )?.code || 'prospecting';
    const access = stageAccess(stageCode, prospect.departmentId || '');

    return (
      <div className="flex gap-2 flex-wrap justify-end">
        {!isConverted && (prospect.status === 'Potensial' || prospect.status === 'Non Potensial') && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">send</span>} onClick={handleResubmit} isLoading={resubmitting} disabled={resubmitting}>
            {resubmitting ? 'Mengirim...' : 'Kirim ke Review'}
          </Button>
        )}

        {prospect.status === 'Approved' && !isConverted && isPotensial && can('project:create') && (
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

        {prospect.status === 'Waiting Supervisor' && access === 'write' && can('prospect:approve:transition') && (
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
            {resubmitting ? 'Mengirim...' : 'Kirim Ulang ke Supervisor'}
          </Button>
        )}

        {/* Edit & Delete: hanya jika user punya akses write di stage ini */}
        {access === 'write' && (
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>} onClick={() => navigate(`/prospects/${prospect.id}/edit`)}>
            Edit
          </Button>
        )}

        {access === 'write' && (
          <button onClick={handleDelete} className="px-3 py-1.5 border border-danger/30 text-danger rounded-xl text-sm font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5" aria-label="Hapus prospek">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>
    );
  };

  const renderTimeline = () => (
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
  );

  const renderActivityFeed = () => (
    <>
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

      <div className="space-y-2 max-h-80 overflow-y-auto">
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
    </>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══════════════════════════════════════════
            HERO SECTION — merged header + stepper
           ═══════════════════════════════════════════ */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
            {/* Left: Identity + Pills */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface truncate">{prospect.name}</h1>
                <StatusBadge status={needsVerification ? 'Perlu Verifikasi' : (STATUS_LABELS[prospect.status] || prospect.status)} />
              </div>
              <p className="text-sm text-secondary">{prospect.client}</p>
              <div className="flex flex-wrap gap-2">
                <InfoPill icon="category" color="green" label={prospect.projectType || 'Prospecting'} />
                <InfoPill icon="inventory_2" color="teal" label={`${prospect.potensiUnit} Unit`} />
                <InfoPill icon="location_on" color="blue" label={prospect.branch || '-'} />
                <InfoPill icon="person" color="purple" label={prospect.author} />
                <InfoPill icon="calendar_today" color="gold" label={prospect.date} />
              </div>
            </div>

            {/* Right: Value + Actions */}
            <div className="flex flex-col items-end gap-3 shrink-0 w-full lg:w-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 w-full lg:min-w-[210px] text-right">
                <p className="text-xs text-secondary mb-1">Nilai Prospek</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrencyShort(prospect.estimatedValue || 0)}</p>
                {prospect.estimatedValue !== undefined && (
                  <p className="text-[10px] text-outline mt-0.5">{formatCurrency(prospect.estimatedValue)}</p>
                )}
              </div>
              {renderActionButtons()}
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
              <h3 className="font-bold text-sm text-on-surface">Progress Prospek</h3>
            </div>
            <Stepper steps={workflowSteps} currentStep={currentStep} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            TABS + CONTENT CARD
           ═══════════════════════════════════════════ */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card">
          <div className="px-5 pt-5">
            <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
          </div>
          <div className="p-5">

            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Row 1: Data Customer + Detail Prospek (2-col) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Card: Data Customer */}
                  <div className="bg-surface border border-border/60 border-l-4 border-l-primary rounded-xl p-5 space-y-3 shadow-card">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">business</span>
                      Data Customer
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      <DataField label="Nama Customer" value={prospect.client} />
                      <DataField label="Tipe Customer" value={customer?.type ? customer.type.charAt(0).toUpperCase() + customer.type.slice(1) : '-'} />
                      <DataField label="Kota" value={customer?.city || '-'} />
                      {customer?.npwp && <DataField label="NPWP" value={customer.npwp} />}
                      <DataField label="Bidang" value={industryMap[prospect.industryId || ''] || '-'} />
                      {prospect.providerExisting && <DataField label="Provider Existing" value={prospect.providerExisting} />}
                    </div>

                    {/* PIC Customer */}
                    {customer && (customer.picName || customer.picPhone) && (
                      <div className="pt-3 border-t border-border mt-2">
                        <p className="text-xs text-outline mb-2 font-semibold">PIC Customer</p>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {(customer.picName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{customer.picName || '-'}</p>
                            {customer.picPosition && <p className="text-xs text-secondary">{customer.picPosition}</p>}
                            {customer.picPhone && (
                              <div className="flex items-center gap-1 text-xs text-secondary mt-0.5">
                                <span className="material-symbols-outlined text-[12px]">phone</span>
                                {customer.picPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification status */}
                    {needsVerification && customer?.id && (
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
                  </div>

                  {/* Card: Detail Prospek */}
                  <div className="bg-surface border border-border/60 border-l-4 border-l-status-teal rounded-xl p-5 space-y-3 shadow-card">
                    <h4 className="font-bold text-xs text-status-teal uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">assignment</span>
                      Detail Prospek
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      <DataField label="Status" value={STATUS_LABELS[prospect.status] || prospect.status} />
                      <DataField label="Tipe Prospek" value={tipeProspek} />
                      <DataField label="Tipe Proyek" value={
                        useInputConfigStore.getState().getGroup('project_types')
                          ?.options.find(o => o.value === prospect.projectType)?.label || prospect.projectType || '-'
                      } />
                      <DataField label="Potensi Unit" value={`${prospect.potensiUnit} Unit`} />
                      <DataField label="Cabang" value={prospect.branch || '-'} />
                      <DataField label="PIC" value={prospect.author} />
                      <DataField label="Tanggal" value={prospect.date} />
                      <DataField label="Nilai Estimasi" value={formatCurrency(prospect.estimatedValue || 0)} />
                    </div>
                  </div>
                </div>

                {/* Row 2: Deskripsi (full width) */}
                {prospect.description && (
                  <div className="bg-surface border border-border/60 border-l-4 border-l-gold rounded-xl p-5 shadow-card">
                    <h4 className="font-bold text-xs text-gold-dark uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <span className="material-symbols-outlined text-[16px] text-gold-dark">description</span>
                      Deskripsi & Kebutuhan
                    </h4>
                    <p className="text-sm text-secondary leading-relaxed">{prospect.description}</p>
                  </div>
                )}

                {/* Row 3: Jawaban Pertanyaan Standar + Activity (side by side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Left: Jawaban Pertanyaan Standar */}
                  {prospect.answers && Object.keys(prospect.answers).length > 0 ? (
                    <div>
                      <h4 className="font-bold text-xs text-status-indigo uppercase tracking-wider flex items-center gap-1.5 mb-3">
                        <span className="material-symbols-outlined text-[16px] text-status-indigo">quiz</span>
                        Jawaban Pertanyaan Standar
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(prospect.answers).map(([key, value]) => {
                          const masterQ = questions.find(q => q.id === key);
                          const label = masterQ?.question_text || legacyLabels[key] || key;
                          return (
                            <div key={key} className="p-4 bg-surface border border-border/60 border-l-2 border-l-status-indigo/50 rounded-lg shadow-card">
                              <p className="text-xs text-outline font-semibold mb-1">{label}</p>
                              <p className="text-sm font-semibold text-on-surface">{value || '-'}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !prospect.description && (
                      <div className="text-center py-8 text-outline bg-surface border border-border/60 border-l-4 border-l-outline rounded-xl shadow-card">
                        <span className="material-symbols-outlined text-4xl text-outline/50">overview</span>
                        <p className="text-sm font-medium mt-2">Tidak ada deskripsi atau pertanyaan tambahan</p>
                      </div>
                    )
                  )}

                  {/* Right: Activity Feed */}
                  <div className="bg-surface border border-border/60 border-l-4 border-l-status-orange rounded-xl p-5 shadow-card">
                    <h4 className="font-bold text-xs text-status-orange uppercase tracking-wider flex items-center gap-1.5 mb-4">
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                      Aktivitas
                    </h4>
                    {renderActivityFeed()}
                  </div>

                </div>

              </div>
            )}

            {/* ─── DOKUMEN TAB ─── */}
            {activeTab === 'documents' && (
              <div className="text-center py-12 text-outline">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-outline/50">description</span>
                </div>
                <p className="text-sm font-medium">Belum ada dokumen</p>
                <p className="text-xs mt-1">Dokumen terkait prospek akan muncul di sini.</p>
              </div>
            )}

            {/* ─── KONTAK TAB ─── */}
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

                {needsVerification && customer?.id && (
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

            {/* ─── APPROVAL TAB ─── */}
            {activeTab === 'approval' && (
              <div className="space-y-4">
                {prospect.status === 'Waiting Supervisor' && (
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-warning text-[24px]">hourglass_top</span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Menunggu Persetujuan Supervisor</p>
                      <p className="text-xs text-secondary">Prospek sedang dalam antrian review Supervisor Marketing.</p>
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
                      <p className="text-xs text-secondary">Supervisor Marketing meminta revisi sebelum menyetujui prospek.</p>
                    </div>
                  </div>
                )}
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-xs text-secondary">Status Approval</p>
                  <p className="text-sm font-semibold text-on-surface mt-1">{STATUS_LABELS[prospect.status] || prospect.status}</p>
                </div>
              </div>
            )}

            {/* ─── TIMELINE TAB ─── */}
            {activeTab === 'timeline' && (
              <div>
                <div className="bg-surface border border-border/60 border-l-4 border-l-status-purple rounded-xl p-5 shadow-card">
                  <h3 className="font-bold text-sm text-status-purple mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">timeline</span>
                    Timeline Audit Trail
                  </h3>
                  {renderTimeline()}
                </div>

                {/* Activity Feed */}
                <div className="bg-surface border border-border/60 border-l-4 border-l-status-orange rounded-xl p-5 shadow-card mt-4">
                  <h3 className="font-bold text-sm text-status-orange mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">forum</span>
                    Aktivitas
                  </h3>
                  {renderActivityFeed()}
                </div>
              </div>
            )}

            {/* ─── PROYEK TERKAIT TAB ─── */}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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