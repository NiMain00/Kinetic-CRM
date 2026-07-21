import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button, Stepper, Tabs } from '@/components/ui';
import type { StepperStep, Tab } from '@/components/ui';
import StatusBadge from '@/components/shared/StatusBadge';
import type { TimelineEvent, Visit, FollowUpTask, Project } from '@/types/domain';
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
import { useVisitStore } from '@/stores/visitStore';
import { useFollowUpStore } from '@/stores/followUpStore';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/utils/formatters';
import apiClient, { unwrap } from '@/services/api-client';
import { projectService } from '@/services/projects';

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
  'Lead': 'Lead',
  'Waiting Supervisor': 'Menunggu Supervisor',
  'Non Potensial': 'Non Potensial',
  'Potensial': 'Potensial',
  'Revision': 'Revisi',
  'Approved': 'Disetujui',
};

const workflowSteps: StepperStep[] = [
  { label: 'Lead' },
  { label: 'Prospek' },
  { label: 'Review Supervisor' },
  { label: 'Approval' },
  { label: 'Proyek' },
];

const detailTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'visits', label: 'Kunjungan', icon: 'event_note' },
  { id: 'follow-up', label: 'Tindak Lanjut', icon: 'assignment' },
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
  const customersData = useCustomerStore((s) => s.customers);
  const getCustomerById = useCallback((id: string) => customersData.find(c => c.id === id), [customersData]);
  const getProjectById = useProjectStore((s) => s.getProjectById);

  useEffect(() => {
    if (id) {
      setLoadingDetail(true);
      fetchProspect(id).finally(() => setLoadingDetail(false));
      fetchCustomers();
    }
  }, [id, fetchProspect, fetchCustomers]);
  const { approvals, approveItem, addApproval } = useApprovalStore();

  const authUser = useAuthStore((s) => s.user);
  const { can, stageAccess } = useAuthz();
  const questions = useMasterDataStore((s) => s.questions);
  const questionsLoading = useMasterDataStore((s) => s.loading?.['questions']);
  const questionsMap = useMemo(() => new Map(questions.map(q => [q.id, q])), [questions]);
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
  const [loadingDetail, setLoadingDetail] = useState(!prospect);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  // ── Link to Existing Project ─────────────────────────────────────────────
  const [showLinkProjectModal, setShowLinkProjectModal] = useState(false);
  const [linkStep, setLinkStep] = useState<'select' | 'confirm'>('select');
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [conflicts, setConflicts] = useState<Record<string, { prospectVal: any; projectVal: any }>>({});
  const [syncChoices, setSyncChoices] = useState<Record<string, 'prospect' | 'project'>>({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [linking, setLinking] = useState(false);

  // ── /Link to Existing Project ─────────────────────────────────────────────
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ date: '', notes: '', picName: '' });
  const visits = useVisitStore((s) => id ? s.visits[id] || [] : []);
  const fetchVisits = useVisitStore((s) => s.fetchVisits);
  const createVisit = useVisitStore((s) => s.createVisit);
  const updateVisit = useVisitStore((s) => s.updateVisit);
  const deleteVisit = useVisitStore((s) => s.deleteVisit);

  // Visit filter
  const [visitFilter, setVisitFilter] = useState<string>('all');

  const filteredVisits = useMemo(() => {
    if (visitFilter === 'all') return visits;
    return visits.filter(v => v.status === visitFilter);
  }, [visits, visitFilter]);

  // Follow-up Task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', toUserId: '', priority: 'medium' as const, notes: '', deadline: '' });
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const tasks = useFollowUpStore((s) => id ? s.tasks[id] || [] : []);
  const fetchTasks = useFollowUpStore((s) => s.fetchTasks);
  const createTask = useFollowUpStore((s) => s.createTask);
  const updateTask = useFollowUpStore((s) => s.updateTask);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'pending') return tasks.filter(t => t.status === 'pending');
    if (taskFilter === 'in_progress') return tasks.filter(t => t.status === 'in_progress');
    if (taskFilter === 'completed') return tasks.filter(t => t.status === 'completed');
    return tasks;
  }, [tasks, taskFilter]);

  // User list for task assignment
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);

  useEffect(() => {
    if (id) {
      fetchVisits(id);
      fetchTasks(id);
      // Fetch users for task assignment
      apiClient.get('/master/users').then((res: any) => {
        const data = unwrap<any[]>(res) || res.data?.data || [];
        setUsers(Array.isArray(data) ? data.map((u: any) => ({ id: u.id, fullName: u.fullName || u.username || '' })) : []);
      }).catch(() => {});
    }
  }, [id, fetchVisits, fetchTasks]);

  const customer = prospect?.customerId
    ? getCustomerById(prospect.customerId) || prospect.customerData
    : prospect?.customerData;

  const currentStep = useMemo(() => {
    if (prospect?.isConverted) return 4;
    if (prospect?.status === 'Approved') return 3;
    if (prospect?.status === 'Waiting Supervisor' || prospect?.status === 'Revision') return 2;
    if (prospect?.status === 'Potensial' || prospect?.status === 'Non Potensial') return 1;
    return 0;
  }, [prospect]);

  const events = useMemo(() => {
    return (prospect?.timeline || []).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [prospect?.timeline]);

  const allActivities = useMemo(() => {
    const comments = (prospect?.timeline || [])
      .filter(e => e.type === 'comment')
      .map(e => ({ ...e, type: 'comment' as const }));
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
    return [...comments, ...notifs].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [notifications, prospect]);

  const relatedProjectId = useRelationStore((s) => s.getProjectByProspect(prospect?.id || ''));
  const relatedProject = useMemo(() => {
    if (prospect?.isConverted && relatedProjectId) {
      return getProjectById(relatedProjectId);
    }
    return null;
  }, [getProjectById, prospect, relatedProjectId]);

  if (!prospect) {
    if (loadingDetail) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="bg-surface border-b border-border/60 px-4 sm:px-8 py-3 shadow-sm">
            <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-surface-container-high rounded-full animate-pulse" />
              <div className="h-6 w-40 bg-surface-container-high rounded animate-pulse" />
              <div className="h-5 w-16 bg-surface-container-high rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-surface-container-high rounded-xl animate-pulse" />
                  ))}
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-surface-container-high rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
          <h2 className="text-xl font-bold text-on-surface">Prospek Tidak Ditemukan</h2>
          <p className="text-secondary text-sm">Prospek dengan ID {id} tidak tersedia.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/prospects')}>
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const isNonPotensial = prospect.status === 'Non Potensial' || prospect.prospectType === 'non_potensial';
  const isPotensial = prospect.status === 'Potensial' || prospect.prospectType === 'potensial';
  const needsVerification = customer?.needsVerification;
  const isConverted = prospect.isConverted && prospect.projectId;
  const tipeProspek = isNonPotensial ? 'Non Potensial' : isPotensial ? 'Potensial' : (STATUS_LABELS[prospect.status] || prospect.status);

  const handleApprove = async () => {
    try {
      const pendingApproval = approvals.find(a => a.entityId === prospect.id && a.entityType === 'prospect');
      if (pendingApproval) {
        await approveItem(pendingApproval.id);
      }
      await updateProspect(prospect.id, { status: 'Approved' });
      await addProspectTimelineEvent(prospect.id, {
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyetujui prospek.');
    }
  };

  const handleRequestRevision = async () => {
    try {
      const pendingApproval = approvals.find(a => a.entityId === prospect.id && a.entityType === 'prospect');
      if (pendingApproval) {
        await approveItem(pendingApproval.id);
      }
      await updateProspect(prospect.id, { status: 'Revision' });
      await addProspectTimelineEvent(prospect.id, {
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim permintaan revisi.');
    }
  };

  const handlePromoteToProspek = async () => {
    if (actionLoading) return;
    const potensi = prospect?.potensiUnit || 0;
    if (customer?.needsVerification) {
      toast.error('Customer harus diverifikasi dahulu sebelum Lead bisa naik ke Prospek.');
      return;
    }
    if (potensi <= 0) {
      toast.error('Lead harus memiliki potensi unit > 0 untuk naik ke Prospek.');
      return;
    }
    // Phase 2: minimal 1 kunjungan (Visit) completed
    const completedVisits = visits.filter((v) => v.status === 'completed').length;
    if (completedVisits < 1) {
      toast.error('Lead harus memiliki minimal 1 kunjungan (Visit) untuk naik ke Prospek.');
      return;
    }
    setActionLoading('promote');
    try {
      await updateProspect(prospect.id, { status: 'Potensial', prospectType: 'potensial' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menaikkan Lead ke Prospek.');
      setActionLoading(null);
      return;
    }
    addProspectTimelineEvent(prospect.id, {
      id: `evt-${prospect.id}-promoted-${Date.now()}`,
      title: 'Lead Naik ke Prospek',
      actor: authUser?.fullName || authUser?.name || 'System',
      role: userRole || 'Staff',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'status_change',
      description: `Lead "${prospect.name}" telah dinaikkan menjadi Prospek Potensial.`,
    });
    toast.success('Lead berhasil dinaikkan ke Prospek.');
    addNotification({
      title: 'Lead Menjadi Prospek',
      message: `Lead "${prospect.name}" telah dinaikkan menjadi Prospek Potensial.`,
      type: 'status_change',
      entityId: prospect.id,
      entityType: 'prospect',
    });
    setActionLoading(null);
  };

  const handleResubmit = async () => {
    if (resubmitting) return;
    setResubmitting(true);
    try {
      await updateProspect(prospect.id, { status: 'Waiting Supervisor', currentStageId: 'stage-supervisor-review' });
      await addProspectTimelineEvent(prospect.id, {
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim prospek ke review.');
    } finally {
      setResubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProspect = async () => {
    try {
      // deleteProspect() already emits PROSPECT_DELETED internally
      await deleteProspect(prospect.id);
      toast.success('Prospek berhasil dihapus.');
      setShowDeleteModal(false);
      navigate('/prospects');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus prospek.');
    }
  };

  const handleBuatProyek = () => {
    navigate('/projects/new', { state: { fromProspect: prospect } });
  };

  // ── Link ke Project Existing ────────────────────────────────────────────
  const conflictingFields = ['name', 'client', 'estimatedValue'];

  const handleOpenLinkProjectModal = async () => {
    setShowLinkProjectModal(true);
    setLinkStep('select');
    setLoadingProjects(true);
    setSelectedProject(null);
    setConflicts({});
    setSyncChoices({});
    try {
      const res = await projectService.list({
        perPage: 100,
        excludeResult: 'Selesai,Kalah',
      });
      const data = (res as any).data?.data || (res as any).data || [];
      const list: Project[] = Array.isArray(data) ? data : [];
      // Filter out projects that already have a prospect linked
      const unlinked = list.filter((p: any) => !p.sourceProspectId);
      setProjectList(unlinked);
    } catch (e) {
      toast.error('Gagal memuat daftar project');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    const project = projectList.find((p) => p.id === projectId);
    if (!project) return;
    setSelectedProject(project);

    // Compare conflicting fields
    const diffs: Record<string, { prospectVal: any; projectVal: any }> = {};
    for (const field of conflictingFields) {
      const pVal = (prospect as any)[field];
      const prjVal = (project as any)[field];
      if (pVal !== undefined && prjVal !== undefined && pVal !== prjVal) {
        diffs[field] = { prospectVal: pVal, projectVal: prjVal };
      }
    }
    setConflicts(diffs);

    // Default: pilih data project (lebih akurat)
    const defaults: Record<string, 'prospect' | 'project'> = {};
    for (const field of Object.keys(diffs)) {
      defaults[field] = 'project';
    }
    setSyncChoices(defaults);
    setLinkStep('confirm');
  };

  const handleChoiceChange = (field: string, choice: 'prospect' | 'project') => {
    setSyncChoices((prev) => ({ ...prev, [field]: choice }));
  };

  const handleConfirmLink = async () => {
    if (!selectedProject || !prospect?.id) return;
    setLinking(true);
    try {
      // 1. Link both directions
      await projectService.update(selectedProject.id, { sourceProspectId: prospect.id });
      await updateProspect(prospect.id, { projectId: selectedProject.id });

      // 2. Sync data sesuai pilihan user
      const prospectSync: Record<string, any> = {};
      const projectSync: Record<string, any> = {};
      for (const [field, choice] of Object.entries(syncChoices)) {
        if (choice === 'project') {
          prospectSync[field] = (selectedProject as any)[field];
        } else {
          projectSync[field] = (prospect as any)[field];
        }
      }
      if (Object.keys(prospectSync).length > 0) {
        await updateProspect(prospect.id, prospectSync);
      }
      if (Object.keys(projectSync).length > 0) {
        await projectService.update(selectedProject.id, projectSync);
      }

      toast.success('Prospek berhasil di-link ke project');
      setShowLinkProjectModal(false);
      if (prospect?.id) fetchProspect(prospect.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal link ke project');
    } finally {
      setLinking(false);
    }
  };
  // ── /Link ke Project Existing ────────────────────────────────────────────
  const handleVerifikasi = async () => {
    if (!customer?.id) {
      toast.error('Data customer tidak ditemukan.');
      return;
    }
    try {
      await verifyCustomer(customer.id, authUser?.fullName || authUser?.name || 'Super Admin');
      // Update prospect customerData agar UI reaktif tanpa perlu refresh
      const now = new Date().toISOString();
      const verifiedBy = authUser?.fullName || authUser?.name || 'Super Admin';
      if (prospect?.id) {
        updateProspect(prospect.id, {
          customerData: {
            ...(prospect.customerData || customer),
            needsVerification: false,
            verifiedAt: now,
            verifiedBy,
          },
        } as any);
      }
      await addProspectTimelineEvent(prospect.id, {
        id: `evt-${prospect.id}-verified-${Date.now()}`,
        title: 'Customer Diverifikasi',
        actor: authUser?.fullName || authUser?.name || 'Super Admin',
        role: userRole || 'Super Admin',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'approve',
        description: `Customer "${customer.name}" telah diverifikasi.`,
      });
      toast.success('Customer berhasil diverifikasi!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal verifikasi customer.');
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addProspectTimelineEvent(prospect.id, {
        id: `comment-${Date.now()}`,
        title: 'Komentar',
        actor: authUser?.fullName || authUser?.name || 'User',
        role: userRole || 'Staff',
        time: new Date().toISOString(),
        type: 'comment',
        description: commentText.trim(),
      });
      setCommentText('');
      toast.success('Komentar ditambahkan.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan komentar.');
    }
  };

  const renderActionButtons = () => {
    // Determine current workflow stage code from the stage ID
    const stageCode = useRbacStore.getState().workflowStages.find(
      (s) => s.id === prospect.currentStageId
    )?.code || 'prospecting';
    const access = stageAccess(stageCode, prospect.departmentId || '');

    return (
      <div className="flex gap-2 flex-wrap justify-end">
        {/* ─── LEAD: Promosi ke Prospek ─── */}
        {!isConverted && prospect.status === 'Lead' && (
          <div className="w-full flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-caption-xs text-secondary bg-surface-container-low px-3 py-1.5 rounded-lg flex-wrap">
              <span className={customer?.needsVerification ? 'text-danger' : 'text-success'}>
                <span className="material-symbols-outlined text-[14px]">{customer?.needsVerification ? 'cancel' : 'check_circle'}</span>
              </span>
              Customer terverifikasi
              <span className={prospect.potensiUnit > 0 ? 'text-success' : 'text-danger'}>
                <span className="material-symbols-outlined text-[14px]">{prospect.potensiUnit > 0 ? 'check_circle' : 'cancel'}</span>
              </span>
              Potensi unit &gt; 0
              <span className={visits.some(v => v.status === 'completed') ? 'text-success' : 'text-danger'}>
                <span className="material-symbols-outlined text-[14px]">{visits.some(v => v.status === 'completed') ? 'check_circle' : 'cancel'}</span>
              </span>
              Kunjungan
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">trending_up</span>}
              onClick={handlePromoteToProspek}
              isLoading={actionLoading === 'promote'}
              disabled={actionLoading !== null || !!customer?.needsVerification || (prospect.potensiUnit || 0) <= 0 || !visits.some(v => v.status === 'completed')}
            >
              {actionLoading === 'promote' ? 'Memproses...' : 'Naikkan ke Prospek'}
            </Button>
          </div>
        )}

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

        {prospect.status === 'Approved' && !isConverted && (
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">link</span>} onClick={handleOpenLinkProjectModal}>
            Link ke Project Existing
          </Button>
        )}

        {prospect.status === 'Approved' && !isConverted && isNonPotensial && (
          <div className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Non-potensial tidak bisa dikonversi
          </div>
        )}

        {isConverted && (
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">visibility</span>} onClick={() => navigate(`/projects/${prospect.projectId}/overview`)}>
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

        {/* Edit: hanya jika user punya akses write DAN customer level Hot */}
        {access === 'write' && (!customer?.level || customer.level === 'hot') && (
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>} onClick={() => navigate(`/prospects/${prospect.id}/edit`)}>
            Edit
          </Button>
        )}
        {access === 'write' && customer?.level && customer.level !== 'hot' && (
          <div className="px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg text-caption-xs text-warning flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Customer level {customer.level} — hanya Hot yang bisa edit
          </div>
        )}

        {access === 'write' && (
          <Button variant="outline" size="sm" onClick={handleDelete} leftIcon={<span className="material-symbols-outlined text-[18px]">delete</span>} aria-label="Hapus prospek">
            Hapus
          </Button>
        )}

        {access === 'read' && (
          <div className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-caption-xs text-outline flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            Mode read-only — department kamu hanya bisa melihat prospek ini
          </div>
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
              <p className="text-caption-xs text-outline mt-1">{event.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderActivityFeed = () => (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSendComment(); }} className="flex gap-2 mb-4">
        <label htmlFor="comment-input" className="sr-only">Tulis komentar</label>
        <input
          id="comment-input"
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Tulis komentar..."
          className="flex-1 border border-border rounded-lg text-sm p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-low transition-all"
        />
        <Button variant="primary" size="sm" type="submit" disabled={!commentText.trim()}>
          <span className="material-symbols-outlined text-[18px]">send</span>
        </Button>
      </form>

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
                    <span className="text-caption-xs text-outline whitespace-nowrap">{act.time}</span>
                  </div>
                  {act.description && (
                    <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">{act.description}</p>
                  )}
                  <p className="text-caption-xs text-outline mt-0.5">{act.actor} &middot; {act.role}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* ═══════════════════════════════════════════
            HERO SECTION — merged header + stepper
           ═══════════════════════════════════════════ */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
            {/* Left: Identity + Pills */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display-title text-display-title text-on-surface truncate">{prospect.name}</h1>
                <StatusBadge status={needsVerification ? 'Perlu Verifikasi' : (STATUS_LABELS[prospect.status] || prospect.status)} />
              </div>
              <p className="text-sm text-secondary">{prospect.client}</p>
              <div className="flex flex-wrap gap-2">
                <InfoPill icon="category" color="green" label={prospect.projectType || 'Prospecting'} />
                <InfoPill icon="inventory_2" color="teal" label={`${prospect.potensiUnit} Unit`} />
                <InfoPill icon="location_on" color="blue" label={prospect.branch || '-'} />
                <InfoPill icon="person" color="purple" label={prospect.author} />
                <InfoPill icon="calendar_today" color="gold" label={formatDate(prospect.date)} />
              </div>
            </div>

            {/* Right: Value + Actions */}
            <div className="flex flex-col items-end gap-3 shrink-0 w-full lg:w-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 w-full lg:min-w-[210px] text-center">
                <p className="text-xs text-secondary mb-1">Nilai Prospek</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrencyShort(prospect.estimatedValue || 0)}</p>
                {prospect.estimatedValue !== undefined && (
                  <p className="text-caption-xs text-outline mt-0.5">{formatCurrency(prospect.estimatedValue)}</p>
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
                      <DataField label="Level Customer" value={customer?.level ? customer.level.charAt(0).toUpperCase() + customer.level.slice(1) : '-'} />
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
                                <span className="material-symbols-outlined text-xs">phone</span>
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
                  <div>
                    <h4 className="font-bold text-xs text-status-indigo uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <span className="material-symbols-outlined text-[16px] text-status-indigo">quiz</span>
                      Jawaban Pertanyaan Standar
                    </h4>

                    {questionsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="p-4 bg-surface border border-border/60 rounded-lg animate-pulse">
                            <div className="h-3 w-3/4 bg-surface-container-high rounded mb-2" />
                            <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                          </div>
                        ))}
                      </div>
                    ) : prospect.answers && Object.keys(prospect.answers).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(prospect.answers).map(([key, value]) => {
                          const masterQ = questionsMap.get(key);
                          const label = masterQ?.question_text || legacyLabels[key] || key;
                          return (
                            <div key={key} className="p-4 bg-surface border border-border/60 border-l-2 border-l-status-indigo/50 rounded-lg shadow-card">
                              <p className="text-xs text-outline font-semibold mb-1">{label}</p>
                              <p className="text-sm font-semibold text-on-surface">{value || '-'}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-outline bg-surface border border-border/60 border-l-4 border-l-outline rounded-xl shadow-card">
                        <span className="material-symbols-outlined text-4xl text-outline/50">quiz</span>
                        <p className="text-sm font-medium mt-2">Tidak ada pertanyaan standar</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Activity Feed + Timeline */}
                  <div className="bg-surface border border-border/60 border-l-4 border-l-status-orange rounded-xl p-5 shadow-card">
                    <h4 className="font-bold text-xs text-status-orange uppercase tracking-wider flex items-center gap-1.5 mb-4">
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                      Aktivitas
                    </h4>
                    {renderActivityFeed()}

                    {events.length > 0 && (
                      <>
                        <div className="border-t border-border my-4" />
                        <h5 className="text-xs font-bold text-outline mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">timeline</span>
                          Riwayat Timeline
                        </h5>
                        <div className="max-h-60 overflow-y-auto">
                          {renderTimeline()}
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* ─── ROW 4: Dihapus — Visit pindah ke tab sendiri, Follow-up pindah ke tab sendiri ─── */}

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

            {/* ─── KUNJUNGAN TAB ─── */}
            {activeTab === 'visits' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-info flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">event_note</span>
                    Daftar Kunjungan
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
                    onClick={() => setShowVisitModal(true)}
                  >
                    Tambah Kunjungan
                  </Button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-border/60 w-fit">
                  {[
                    { value: 'all', label: 'Semua' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'completed', label: 'Selesai' },
                    { value: 'cancelled', label: 'Dibatalkan' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setVisitFilter(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        visitFilter === f.value
                          ? 'bg-surface text-primary shadow-sm border border-border/60'
                          : 'text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {f.label}
                      <span className="ml-1.5 text-caption-xs font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high">
                        {visits.filter(v => f.value === 'all' || v.status === f.value).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Visit cards */}
                {filteredVisits.length === 0 ? (
                  <div className="text-center py-12 text-outline">
                    <span className="material-symbols-outlined text-4xl text-outline/50 mb-2">event_busy</span>
                    <p className="text-sm font-medium">Belum ada kunjungan</p>
                    <p className="text-xs mt-1">Kunjungan pertama diperlukan sebelum Lead bisa naik ke Prospek.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredVisits.slice().reverse().map((v) => (
                      <div key={v.id} className="flex items-start gap-4 p-4 bg-surface border border-border/60 rounded-xl shadow-card">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          v.status === 'completed' ? 'bg-success/20 text-success' :
                          v.status === 'cancelled' ? 'bg-danger/20 text-danger' :
                          'bg-warning/20 text-warning'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {v.status === 'completed' ? 'check' : v.status === 'cancelled' ? 'close' : 'schedule'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-on-surface">Kunjungan #{v.visitNumber}</span>
                            <span className={`text-caption-xs font-semibold px-2 py-0.5 rounded-full ${
                              v.status === 'completed' ? 'bg-success/10 text-success' :
                              v.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                              'bg-warning/10 text-warning'
                            }`}>
                              {v.status === 'completed' ? 'Selesai' : v.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              {formatDate(v.date)}
                            </span>
                            {v.picName && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">person</span>
                                {v.picName}
                              </span>
                            )}
                          </div>
                          {v.notes && (
                            <p className="text-xs text-secondary mt-2 bg-surface-container-low p-2 rounded-lg">{v.notes}</p>
                          )}
                          {v.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="success" size="sm" onClick={async () => {
                                try { await updateVisit(v.id, { status: 'completed' }); toast.success('Kunjungan selesai.'); }
                                catch { toast.error('Gagal menyelesaikan kunjungan.'); }
                              }}>
                                Selesaikan
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={async () => {
                                  try { await updateVisit(v.id, { status: 'cancelled' }); toast.success('Kunjungan dibatalkan.'); }
                                  catch { toast.error('Gagal membatalkan kunjungan.'); }
                                }}
                              >
                                Batalkan
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TINDAK LANJUT TAB ─── */}
            {activeTab === 'follow-up' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-status-purple flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                    Daftar Tugas Tindak Lanjut
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
                    onClick={() => setShowTaskModal(true)}
                  >
                    Buat Tugas Baru
                  </Button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-border/60 w-fit">
                  {[
                    { value: 'all', label: 'Semua' },
                    { value: 'pending', label: 'Belum' },
                    { value: 'in_progress', label: 'Sedang Dikerjakan' },
                    { value: 'completed', label: 'Selesai' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setTaskFilter(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        taskFilter === f.value
                          ? 'bg-surface text-primary shadow-sm border border-border/60'
                          : 'text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {f.label}
                      <span className="ml-1.5 text-caption-xs font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high">
                        {tasks.filter(t => f.value === 'all' || t.status === f.value).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Task cards */}
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-outline">
                    <span className="material-symbols-outlined text-4xl text-outline/50 mb-2">assignment</span>
                    <p className="text-sm font-medium">Belum ada tugas tindak lanjut</p>
                    <p className="text-xs mt-1">Buat tugas untuk menugaskan follow-up ke tim.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredTasks.map((t) => {
                      const pColor = t.priority === 'high' ? 'text-danger bg-danger/10 border-danger/20' :
                        t.priority === 'medium' ? 'text-warning bg-warning/10 border-warning/20' :
                        'text-secondary bg-surface-container-high border-border/40';
                      const progressColor = t.progress >= 100 ? 'bg-success' : t.progress >= 50 ? 'bg-warning' : 'bg-info';
                      return (
                        <div key={t.id} className="p-4 bg-surface border border-border/60 rounded-xl shadow-card space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-caption-xs font-bold px-2 py-0.5 rounded-full border ${pColor}`}>
                                  {t.priority === 'high' ? 'Tinggi' : t.priority === 'medium' ? 'Sedang' : 'Rendah'}
                                </span>
                                <span className={`text-caption-xs font-semibold px-2 py-0.5 rounded-full ${
                                  t.status === 'completed' ? 'bg-success/10 text-success' :
                                  t.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                                  'bg-info/10 text-info'
                                }`}>
                                  {t.status === 'pending' ? 'Belum' : t.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Selesai'}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-on-surface mt-1">{t.title}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption-xs text-secondary">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">person_outline</span>
                              Dari: {users.find(u => u.id === t.fromUserId)?.fullName || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">person</span>
                              Untuk: {users.find(u => u.id === t.toUserId)?.fullName || '-'}
                            </span>
                            {t.deadline && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">calendar_today</span>
                                Deadline: {formatDate(t.deadline)}
                              </span>
                            )}
                          </div>

                          {t.notes && (
                            <p className="text-xs text-secondary bg-surface-container-low p-2 rounded-lg">{t.notes}</p>
                          )}

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${t.progress}%` }} />
                            </div>
                            <span className="text-caption-xs text-outline font-mono-data min-w-[32px] text-right">{t.progress}%</span>
                          </div>

                          {t.status !== 'completed' && (
                            <div className="flex gap-2 pt-1">
                              {t.status === 'pending' && (
                                <Button variant="primary" size="sm" onClick={async () => {
                                  try { await updateTask(t.id, { status: 'in_progress', progress: 25 }); toast.success('Tugas dimulai.'); }
                                  catch { toast.error('Gagal mengupdate tugas.'); }
                                }}>
                                  Mulai
                                </Button>
                              )}
                              {t.status === 'in_progress' && (
                                <Button variant="success" size="sm" onClick={async () => {
                                  try { await updateTask(t.id, { status: 'completed', progress: 100 }); toast.success('Tugas selesai!'); }
                                  catch { toast.error('Gagal mengupdate tugas.'); }
                                }}>
                                  Selesaikan
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">open_in_new</span>} onClick={() => navigate(`/projects/${relatedProject.id}/overview`)}>
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

      {/* ─── VISIT MODAL ─── */}
      <Modal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        title="Tambah Kunjungan"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowVisitModal(false)}>Batal</Button>
            <Button variant="primary" size="md" form="visit-form" type="submit">
              Simpan
            </Button>
          </>
        }
      >
        <form id="visit-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!id) return;
          if (!visitForm.date) { toast.error('Tanggal kunjungan wajib diisi.'); return; }
          try {
            await createVisit({
              prospectId: id,
              date: visitForm.date,
              notes: visitForm.notes || undefined,
              picName: visitForm.picName || undefined,
            });
            setVisitForm({ date: '', notes: '', picName: '' });
            setShowVisitModal(false);
            toast.success('Kunjungan berhasil ditambahkan.');
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menambahkan kunjungan.');
          }
        }} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="visit-date" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Tanggal Kunjungan *</label>
            <input
              id="visit-date"
              type="date"
              value={visitForm.date}
              onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="visit-pic-name" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Nama PIC</label>
            <input
              id="visit-pic-name"
              value={visitForm.picName}
              onChange={(e) => setVisitForm({ ...visitForm, picName: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Nama petugas kunjungan"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="visit-notes" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Catatan</label>
            <textarea
              id="visit-notes"
              value={visitForm.notes}
              onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
              placeholder="Hasil kunjungan..."
            />
          </div>
        </form>
      </Modal>

      {/* ─── TASK MODAL ─── */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Buat Tugas Tindak Lanjut"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowTaskModal(false)}>Batal</Button>
            <Button variant="primary" size="md" form="task-form" type="submit">
              Simpan
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!id) return;
          if (!taskForm.title) { toast.error('Judul tugas wajib diisi.'); return; }
          if (!taskForm.toUserId) { toast.error('Pilih PIC tujuan.'); return; }
          try {
            await createTask({
              title: taskForm.title,
              prospectId: id,
              fromUserId: authUser?.id || '',
              toUserId: taskForm.toUserId,
              priority: taskForm.priority,
              notes: taskForm.notes || undefined,
              deadline: taskForm.deadline || undefined,
            });
            setTaskForm({ title: '', toUserId: '', priority: 'medium', notes: '', deadline: '' });
            setShowTaskModal(false);
            toast.success('Tugas berhasil dibuat.');
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal membuat tugas.');
          }
        }} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Judul *</label>
            <input
              id="task-title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Contoh: Follow-up proposal ke customer"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="task-pic" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">PIC Tujuan *</label>
            <select
              id="task-pic"
              value={taskForm.toUserId}
              onChange={(e) => setTaskForm({ ...taskForm, toUserId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Pilih PIC</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="task-priority" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Prioritas</label>
            <select
              id="task-priority"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="task-deadline" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Deadline</label>
            <input
              id="task-deadline"
              type="date"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="task-notes" className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Catatan</label>
            <textarea
              id="task-notes"
              value={taskForm.notes}
              onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
              placeholder="Deskripsi tugas..."
            />
          </div>
        </form>
      </Modal>

      {/* Link to Existing Project Modal */}
      <Modal
        isOpen={showLinkProjectModal}
        onClose={() => setShowLinkProjectModal(false)}
        title={linkStep === 'select' ? 'Link ke Project Existing' : 'Konfirmasi Data'}
        size="lg"
        footer={
          linkStep === 'select' ? (
            <Button variant="secondary" size="md" onClick={() => setShowLinkProjectModal(false)}>
              Tutup
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setLinkStep('select')} disabled={linking}>
                Kembali
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmLink} isLoading={linking} leftIcon={<span className="material-symbols-outlined text-[18px]">link</span>}>
                {linking ? 'Me-link...' : 'Konfirmasi Link'}
              </Button>
            </div>
          )
        }
      >
        {linkStep === 'select' ? (
          loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
                <p className="text-sm text-secondary">Memuat daftar project...</p>
              </div>
            </div>
          ) : projectList.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">search_off</span>
              <p className="text-sm text-secondary">Tidak ada project tersedia</p>
              <p className="text-xs text-outline mt-1">Semua project yang sudah ada dan belum memiliki prospek akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projectList.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => handleSelectProject(project.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-on-surface truncate">{project.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                      <span>Kode: {project.code || '-'}</span>
                      <span>Client: {project.client || '-'}</span>
                      {project.estimatedValue != null && (
                        <span>Nilai: Rp {Number(project.estimatedValue).toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Confirm step — show field comparison */
          <div className="space-y-4">
            <p className="text-sm text-secondary">
              Terdapat perbedaan data antara prospek dan project. Pilih sumber data yang ingin digunakan untuk setiap field.
            </p>

            {conflictingFields.map((field) => {
              const conflict = conflicts[field];
              if (!conflict) return null;
              const isProjectSelected = syncChoices[field] === 'project';
              const prospectVal = conflict.prospectVal;
              const projectVal = conflict.projectVal;

              return (
                <div key={field} className="border border-border/60 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-on-surface capitalize">{field.replace(/([A-Z])/g, ' $1')}</p>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${!isProjectSelected ? 'bg-primary/5 border border-primary/30' : 'bg-surface-container-low border border-transparent'}`}>
                      <input
                        type="radio"
                        name={`field-${field}`}
                        checked={!isProjectSelected}
                        onChange={() => handleChoiceChange(field, 'prospect')}
                        className="accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-secondary">Data Prospek</p>
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {field === 'estimatedValue'
                            ? `Rp ${Number(prospectVal).toLocaleString('id-ID')}`
                            : String(prospectVal ?? '-')}
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isProjectSelected ? 'bg-primary/5 border border-primary/30' : 'bg-surface-container-low border border-transparent'}`}>
                      <input
                        type="radio"
                        name={`field-${field}`}
                        checked={isProjectSelected}
                        onChange={() => handleChoiceChange(field, 'project')}
                        className="accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-secondary">Data Project <span className="text-primary font-semibold">(default)</span></p>
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {field === 'estimatedValue'
                            ? `Rp ${Number(projectVal).toLocaleString('id-ID')}`
                            : String(projectVal ?? '-')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}

            {Object.keys(conflicts).length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-success mb-2">check_circle</span>
                <p className="text-sm text-secondary">Tidak ada perbedaan data. Langsung link tanpa konflik.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

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
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus prospek ini?</p>
        <p className="text-sm text-danger mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Semua proyek yang berasal dari prospek ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}