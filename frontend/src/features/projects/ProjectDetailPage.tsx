import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { StatusBadge } from '@/components/shared';
import PhaseStepper from '@/components/shared/PhaseStepper';
import type { Project } from '../../types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useStatusStepMap, useNextPhaseMap } from '@/hooks/useConfigData';
import { useAuthz } from '@/hooks/useAuthz';
import { useConfigStore } from '@/stores/configStore';
import { useRbacStore } from '@/stores/rbacStore';
import { prospectService } from '@/services/prospects';

// Tab components
import OverviewTab from './tabs/OverviewTab';
import RksTab from './tabs/RksTab';
import ReviewRksTab from './tabs/ReviewRksTab';
import LphsSiosTab from './tabs/LphsSiosTab';
import HargaTab from './tabs/HargaTab';
import KompetitorTab from './tabs/KompetitorTab';
import PemenangTab from './tabs/PemenangTab';
import TimelineTab from './tabs/TimelineTab';
import DokumenTab from './tabs/DokumenTab';
import TasksTab from './tabs/TasksTab';

interface ProjectDetailViewProps {
  key?: string;
  project?: Project;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

export default function ProjectDetailView({
  project: propProject,
  onShowNotification,
  onNavigatePage,
}: ProjectDetailViewProps) {
  const { projectId, tab: urlTab } = useParams<{ projectId: string; tab: string }>();
  const navigate = useNavigate();

  const getProjectById = useProjectStore((s) => s.getProjectById);
  const storeProject = useProjectStore((s) => projectId ? s.entities[projectId] : undefined);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const fetchProject = useProjectStore((s) => s.fetchProject);
  const getProspectById = useProspectStore((s) => s.getProspectById);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const { approvals, approveItem } = useApprovalStore();
  const { can, canWrite } = useAuthz();
  const STATUS_STEP_MAP = useStatusStepMap();
  const NEXT_PHASE_MAP = useNextPhaseMap();

  const project = propProject || storeProject;

  // Derive progress from current status
  const projectPhases = useConfigStore((s) => s.projectPhases);
  const fetchProjectPhases = useConfigStore((s) => s.fetchProjectPhases);

  useEffect(() => {
    fetchProjectPhases();
  }, [fetchProjectPhases]);
  const displayProgress = React.useMemo(() => {
    if (!project) return 0;
    if (project.status === 'Selesai' || project.status === 'Kalah') return 100;
    const active = projectPhases
      .filter((p) => p.isActive && p.status !== 'Kalah')
      .sort((a, b) => a.order - b.order);
    const idx = active.findIndex((p) => p.status === project.status);
    if (idx < 0) return project.progress ?? 0;
    return Math.round((idx / (active.length - 1)) * 100);
  }, [project?.status, projectPhases]);

  // Override project progress with derived value for display
  const displayProject = project ? { ...project, progress: displayProgress } : undefined;

  // Cek apakah project berasal dari prospek Non Potensial (Fase 4 item 4.2)
  const sourceProspect = project?.sourceProspectId ? getProspectById(project.sourceProspectId) : undefined;
  const isFromNonPotensial = sourceProspect?.prospectType === 'non_potensial' || sourceProspect?.status === 'Non Potensial';

  // Stage-based access: derive stage code from project's currentStageId
  const workflowStages = useRbacStore((s) => s.workflowStages);
  const canWriteProject = React.useMemo(() => {
    if (!project?.currentStageId || !project.departmentId) return can('project:write');
    const stage = workflowStages.find((s) => s.id === project.currentStageId);
    if (!stage?.code) return can('project:write');
    return canWrite('project:write', stage.code, project.departmentId);
  }, [project?.currentStageId, project?.departmentId, workflowStages, can, canWrite]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Single source of truth for tabs & stepper — MUST be before early return to keep hook count stable
  const tabs = React.useMemo(() => {
    // Non-potensial: hanya Overview, Timeline, Dokumen
    if (isFromNonPotensial) {
      return [
        { label: 'Overview', path: 'overview' },
        { label: 'Timeline', path: 'timeline' },
        { label: 'Dokumen', path: 'dokumen' },
      ];
    }
    const items: Array<{ label: string; path: string }> = [
      { label: 'Overview', path: 'overview' },
      { label: 'Tasks', path: 'tasks' },
      { label: 'RKS', path: 'rks' },
      { label: 'LPHS/SIOS', path: 'lphs' },
      { label: 'Harga', path: 'harga' },
      { label: 'Kompetitor', path: 'kompetitor' },
      { label: 'Pemenang', path: 'pemenang' },
      { label: 'Timeline', path: 'timeline' },
      { label: 'Dokumen', path: 'dokumen' },
    ];
    if (project?.type === 'tender') {
      items.splice(3, 0, { label: 'Review RKS', path: 'review-rks' });
    } else {
      items.splice(3, 1);
    }
    return items;
  }, [project?.type, isFromNonPotensial, project?.status, project?.winnerDetails?.outcome]);

  // Stepper steps: derived from project lifecycle phases, NOT from tabs
  const stepperSteps = React.useMemo(() => {
    const activePhases = projectPhases
      .filter(p => p.isActive && p.status !== 'Kalah')
      .sort((a, b) => a.order - b.order);
    const tabPathByLabel: Record<string, string> = {};
    tabs.forEach(t => { tabPathByLabel[t.label] = t.path; });
    tabPathByLabel['Draft'] = 'overview';
    tabPathByLabel['Selesai'] = 'overview';
    return activePhases.map(p => ({
      label: p.phase,
      path: tabPathByLabel[p.phase] || 'overview',
    }));
  }, [projectPhases, tabs]);

  // Auto-sync prospect data ke project jika ada sourceProspect — also before early return
  useEffect(() => {
    if (projectId && sourceProspect && project) {
      const updates: Partial<Project> = {};
      if (sourceProspect.estimatedValue && sourceProspect.estimatedValue !== project.estimatedValue) {
        updates.estimatedValue = sourceProspect.estimatedValue;
      }
      if (sourceProspect.client && sourceProspect.client !== project.client) {
        updates.client = sourceProspect.client;
      }
      if (Object.keys(updates).length > 0) {
        updateProject(projectId, updates);
      }
    }
  }, [sourceProspect?.estimatedValue, sourceProspect?.client]);

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
        <h3 className="font-heading-section text-base text-on-surface">Proyek tidak ditemukan</h3>
        <p className="text-sm text-outline">Proyek yang Anda cari tidak ditemukan atau telah dihapus.</p>
        <Button variant="primary" size="md" onClick={() => onNavigatePage('projects')}>
          Kembali ke Proyek
        </Button>
      </div>
    );
  }

  const activeTab = tabs.find(t => t.path === (urlTab || 'overview'))?.label || 'Overview';
  const isOverview = activeTab === 'Overview';

  // Tab restriction rules

  const phaseLabel = STATUS_STEP_MAP[project.status] || project.status || 'RKS';
  const tabIndex = tabs.findIndex(t => t.label === phaseLabel);
  const stepperIndex = stepperSteps.findIndex(t => t.label === phaseLabel);
  const isTerminal = project.status === 'Selesai' || project.status === 'Kalah';
  const accessibleUpToIndex = isTerminal ? tabs.length - 1 : (tabIndex >= 0 ? tabIndex : 0);
  const isTabLocked = (tabIndex: number) => {
    const tab = tabs[tabIndex];
    if (!tab) return true;

    // Terminal states (Selesai, Kalah): all tabs unlocked
    if (project.status === 'Selesai' || project.status === 'Kalah') return false;

    // Timeline, Dokumen, Tasks & RKS: always unlocked
    if (tab.label === 'Timeline' || tab.label === 'Dokumen' || tab.label === 'Tasks' || tab.label === 'RKS') return false;

    // Harga, Kompetitor, Pemenang: terkunci sampai project mencapai atau melewati fase LPHS/SIOS
    if (['Harga', 'Kompetitor', 'Pemenang'].includes(tab.label)) {
      if (project.type === 'prospecting') return false;
      const status = project.status;
      const isBeforeLphs = status === 'RKS' || status === 'Review RKS' || status === 'Draft' || status === 'Revision' || status === 'LPHS/SIOS';
      return isBeforeLphs;
    }

    // Default sequential locking (Overview, RKS, Review RKS, LPHS/SIOS, Harga, ...)
    return tabIndex > accessibleUpToIndex;
  };

  const activeTabIndex = tabs.findIndex(t => t.path === (urlTab || 'overview'));

  const handleDeleteProject = () => {
    if (!projectId) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectId || deleting) return;
    setDeleting(true);
    try {
      // Reset prospect langsung di store & backend
      if (project.sourceProspectId) {
        // 1. Store update — immediate UI feedback
        useProspectStore.setState((s) => {
          const entity = s.entities[project.sourceProspectId!];
          if (!entity) return s;
          return {
            entities: {
              ...s.entities,
              [project.sourceProspectId!]: { ...entity, isConverted: false, projectId: undefined },
            },
          };
        });
        // 2. Background API call — persist ke backend (fire-and-forget)
        prospectService.update(project.sourceProspectId!, {
          isConverted: false,
          projectId: null,
        }).catch(() => {});
      }
      await deleteProject(projectId);
      toast.success('Proyek berhasil dihapus.');
      setShowDeleteModal(false);
      onNavigatePage('projects');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus proyek');
    } finally {
      setDeleting(false);
    }
  };

  const handleTabChange = (path: string) => {
    navigate(`/projects/${projectId}/${path}`);
  };

  const handleApproveProject = () => {
    if (!projectId || !project) return;

    // Remove any pending approval for this project
    const pendingApproval = approvals.find(a => a.entityId === projectId && a.entityType === 'project');
    if (pendingApproval) {
      approveItem(pendingApproval.id);
    }

    // Advance project status — derives from WORKFLOW constant

    const next = NEXT_PHASE_MAP[project.status];
    if (next) {
      updateProject(projectId, next);
      addTimelineEvent(projectId, {
        id: `evt-${Date.now()}`,
        title: 'Proyek Disetujui',
        actor: 'System',
        role: 'Approval System',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'approve',
        description: `Proyek telah disetujui dan berpindah ke tahap ${next.phase}.`,
      });
      toast.success('Proyek berhasil disetujui!');
    } else {
      toast.success('Proyek sudah berada di tahap akhir.');
    }
  };

  const handleRevision = () => {
    if (!projectId || !project) return;
    const active = projectPhases.filter((p) => p.isActive).sort((a, b) => a.order - b.order);
    const currentIdx = active.findIndex((p) => p.status === project.status);
    if (currentIdx > 0) {
      const prev = active[currentIdx - 1];
      updateProject(projectId, { status: prev.status, phase: prev.phase });
      addTimelineEvent(projectId, {
        id: `evt-${Date.now()}`,
        title: 'Proyek Direvisi',
        actor: 'System',
        role: 'System',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'revision',
        description: `Proyek dikembalikan ke tahap ${prev.phase}.`,
      });
      toast.success(`Proyek dikembalikan ke tahap ${prev.phase}.`);
    } else {
      toast.error('Proyek sudah berada di tahap paling awal.');
    }
  };

  const handleShowNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    onShowNotification(message, type);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky Project Header with Dynamic Breadcrumbs */}
      <section className="bg-surface border-b border-border/60 px-4 sm:px-8 py-2 sm:py-3 shadow-sm z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => isOverview ? onNavigatePage('projects') : navigate(`/projects/${projectId}/overview`)}
              className="p-1 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border/60 bg-surface shrink-0 touch-min"
            >
              <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <h2 className="font-display-title text-base sm:text-xl font-bold tracking-tight truncate">{project.name}</h2>
                <StatusBadge status={project.status} size="sm" />
              </div>
              <p className="text-secondary text-[10px] sm:text-xs line-clamp-1 truncate">{project.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {can('project:write') && (
            <button
              onClick={handleDeleteProject}
              className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-xl hover:bg-danger/5 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Hapus
            </button>
            )}
            {can('project:write') && (
            <button
              onClick={handleRevision}
              className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-xl hover:bg-danger/5 transition-all"
            >
              Revisi
            </button>
            )}
            {canWriteProject && (
            <button
              onClick={handleApproveProject}
              className="px-5 py-1.5 bg-success text-white font-semibold text-xs rounded-xl hover:opacity-90 shadow-card transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Approve
            </button>
            )}
          </div>
        </div>
      </section>

      {/* Main scrollable area — stepper, tab nav, and tab content all scroll together */}
      <div className="flex-1 overflow-y-auto">
          {/* Dynamic Stepper — visible on ALL tabs for navigation */}
          {!(project.type === 'prospecting' && isFromNonPotensial) && (
            <PhaseStepper
              steps={stepperSteps}
              currentStepIndex={stepperIndex >= 0 ? stepperIndex : 0}
              accessibleUpToIndex={isTerminal ? stepperSteps.length : (stepperIndex >= 0 ? stepperIndex : 0)}
              onStepClick={(path) => navigate(`/projects/${projectId}/${path}`)}
              isStepUnlocked={(index) => {
                const step = stepperSteps[index];
                if (!step) return false;
                const st = project.status;
                const isBeforeLphs = st === 'RKS' || st === 'Review RKS' || st === 'Draft' || st === 'Revision';
                return step.label === 'Harga' && !isBeforeLphs;
              }}
            />
          )}

          {/* Tab Navigation Bar — visible on ALL tabs */}
          <nav className="bg-surface border-b border-border/60 px-3 sm:px-8 py-3 overflow-x-auto select-none scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab, index) => {
                const locked = isTabLocked(index);
                return (
                  <button
                    key={tab.label}
                    onClick={() => { if (!locked) handleTabChange(tab.path); }}
                    title={locked ? `Selesaikan tahap "${tabs[Math.min(accessibleUpToIndex, tabs.length - 1)]?.label}" terlebih dahulu` : tab.label}
                    className={`px-4 py-2 font-label-sm text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === tab.label
                        ? 'bg-primary text-white shadow-sm font-bold'
                        : locked
                          ? 'text-outline cursor-not-allowed opacity-40'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    {locked && <span className="material-symbols-outlined text-[14px]">lock</span>}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Tab Panel Content */}
          <div className="p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-5">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'Overview' && (
            <OverviewTab project={displayProject} onShowNotification={handleShowNotification} />
          )}

          {/* Locked tab restriction */}
          {activeTab !== 'Overview' && isTabLocked(activeTabIndex) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-outline">lock</span>
              <h3 className="font-heading-section text-base text-on-surface mt-4">Tahap Terkunci</h3>
              <p className="text-sm text-outline mt-2 max-w-md">
                {(() => {
                  const lockedTab = tabs[activeTabIndex];
                  if (['Harga', 'Kompetitor', 'Pemenang'].includes(lockedTab?.label || '')) {
                    return 'Tahap ini dapat diakses setelah Management mengklik "Lanjutkan ke Input Harga".';
                  }
                  return `Tahap ini belum dapat diakses. Selesaikan dan dapatkan persetujuan untuk tahap "${tabs[Math.min(accessibleUpToIndex, tabs.length - 1)]?.label}" terlebih dahulu.`;
                })()}
              </p>
            </div>
          )}

          {/* Non-locked tabs wrapper */}
          {(!isTabLocked(activeTabIndex) || activeTab === 'Overview') && (
            <>
          {/* TAB 2: TASKS */}
          {activeTab === 'Tasks' && (
            <TasksTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 3: RKS */}
          {activeTab === 'RKS' && (
            <RksTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 3: REVIEW RKS */}
          {activeTab === 'Review RKS' && (
            <ReviewRksTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 4: LPHS/SIOS */}
          {activeTab === 'LPHS/SIOS' && (
            <LphsSiosTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 5: HARGA */}
          {activeTab === 'Harga' && (
            <HargaTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 6: KOMPETITOR */}
          {activeTab === 'Kompetitor' && (
            <KompetitorTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 7: PEMENANG */}
          {activeTab === 'Pemenang' && (
            <PemenangTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 8: TIMELINE */}
          {activeTab === 'Timeline' && (
            <TimelineTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 9: DOKUMEN */}
          {activeTab === 'Dokumen' && (
            <DokumenTab project={project} onShowNotification={handleShowNotification} />
          )}
            </>
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
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDeleteProject} disabled={deleting} leftIcon={deleting ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> : undefined}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
