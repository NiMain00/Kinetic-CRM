import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import type { Project } from '../../types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useStatusStepMap, useNextPhaseMap } from '@/hooks/useConfigData';
import { usePermission } from '@/hooks/usePermission';
import { useConfigStore } from '@/stores/configStore';

// Tab components
import OverviewTab from './tabs/OverviewTab';
import RksTab from './tabs/RksTab';
import ReviewRksTab from './tabs/ReviewRksTab';
import LphsSiosTab from './tabs/LphsSiosTab';
import HargaTab from './tabs/HargaTab';
import KompetitorTab from './tabs/KompetitorTab';
import PemenangTab from './tabs/PemenangTab';
import DeliveryTab from './tabs/DeliveryTab';
import TimelineTab from './tabs/TimelineTab';
import DokumenTab from './tabs/DokumenTab';
import ChatTab from './tabs/ChatTab';

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
  const storeProject = useProjectStore((s) => projectId ? s.projects.find(p => p.id === projectId) : undefined);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const getProspectById = useProspectStore((s) => s.getProspectById);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const { approvals, approveItem } = useApprovalStore();
  const { can } = usePermission();
  const STATUS_STEP_MAP = useStatusStepMap();
  const NEXT_PHASE_MAP = useNextPhaseMap();

  const project = propProject || storeProject;

  // Derive progress from current status
  const projectPhases = useConfigStore((s) => s.projectPhases);
  const displayProgress = React.useMemo(() => {
    if (!project) return 0;
    const active = projectPhases.filter((p) => p.isActive).sort((a, b) => a.order - b.order);
    const idx = active.findIndex((p) => p.status === project.status);
    if (idx < 0) return project.progress ?? 0;
    return Math.round((idx / (active.length - 1)) * 100);
  }, [project?.status, projectPhases]);

  // Override project progress with derived value for display
  const displayProject = project ? { ...project, progress: displayProgress } : undefined;

  // Cek apakah project berasal dari prospek Non Potensial (Fase 4 item 4.2)
  const sourceProspect = project?.sourceProspectId ? getProspectById(project.sourceProspectId) : undefined;
  const isFromNonPotensial = sourceProspect?.prospectType === 'non_potensial' || sourceProspect?.status === 'Non Potensial';
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
        <h3 className="font-heading-section text-base text-on-surface">Project not found</h3>
        <p className="text-sm text-outline">The project you are looking for does not exist or has been removed.</p>
        <button onClick={() => onNavigatePage('projects')} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Back to Projects</button>
      </div>
    );
  }

  // Single source of truth for tabs & stepper
  const tabs = React.useMemo(() => {
    // Non-potensial: hanya Overview, Timeline, Dokumen, Diskusi
    if (isFromNonPotensial) {
      return [
        { label: 'Overview', path: 'overview' },
        { label: 'Timeline', path: 'timeline' },
        { label: 'Dokumen', path: 'dokumen' },
        { label: 'Diskusi', path: 'diskusi' },
      ];
    }
    const items: Array<{ label: string; path: string }> = [
      { label: 'Overview', path: 'overview' },
      { label: 'RKS', path: 'rks' },
      { label: 'LPHS/SIOS', path: 'lphs' },
      { label: 'Harga', path: 'harga' },
      { label: 'Kompetitor', path: 'kompetitor' },
      { label: 'Pemenang', path: 'pemenang' },
      { label: 'Target Delivery', path: 'target-delivery' },
      { label: 'Timeline', path: 'timeline' },
      { label: 'Dokumen', path: 'dokumen' },
      { label: 'Diskusi', path: 'diskusi' },
    ];
    if (project.type === 'Tender') {
      items.splice(2, 0, { label: 'Review RKS', path: 'review-rks' });
    } else {
      // LPHS/SIOS only for Tender projects
      items.splice(2, 1);
    }
    return items;
  }, [project.type, isFromNonPotensial]);

  const activeTab = tabs.find(t => t.path === (urlTab || 'overview'))?.label || 'Overview';
  const isOverview = activeTab === 'Overview';

  // Tab restriction rules

  const phaseLabel = STATUS_STEP_MAP[project.status] || 'RKS';
  const currentStepIndex = tabs.findIndex(t => t.label === phaseLabel);
  const accessibleUpToIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const lphsMgmtApproved = project.lphs?.overallStatus === 'approved';
  const isMenang = project.winnerDetails?.outcome === 'menang';

  const isTabLocked = (tabIndex: number) => {
    const tab = tabs[tabIndex];
    if (!tab) return true;

    // Terminal states (Selesai, Kalah, Completed): all tabs unlocked
    if (project.status === 'Selesai' || project.status === 'Kalah' || project.status === 'Completed') return false;

    // Timeline, Dokumen & Diskusi: always unlocked
    if (tab.label === 'Timeline' || tab.label === 'Dokumen' || tab.label === 'Diskusi') return false;

    // Target Delivery: unlocked only when project outcome is menang
    if (tab.label === 'Target Delivery') return !isMenang;

    // Harga, Kompetitor, Pemenang: unlocked after LPHS management approval (Tender)
    // atau langsung unlocked untuk Prospecting (tidak perlu LPHS)
    if (['Harga', 'Kompetitor', 'Pemenang'].includes(tab.label)) {
      if (project.type === 'Prospecting') return false; // always unlocked for Prospecting
      return !lphsMgmtApproved;
    }

    // Default sequential locking (Overview, RKS, Review RKS, LPHS/SIOS)
    return tabIndex > accessibleUpToIndex;
  };

  const activeTabIndex = tabs.findIndex(t => t.path === (urlTab || 'overview'));

  // Auto-sync prospect data ke project jika ada sourceProspect
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

  const handleDeleteProject = () => {
    if (!projectId) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = () => {
    if (!projectId) return;
    // Jika proyek berasal dari prospek, reset status konversi
    if (project.sourceProspectId) {
      updateProspect(project.sourceProspectId, {
        isConverted: false,
        projectId: undefined,
      });
    }
    deleteProject(projectId);
    toast.success('Proyek berhasil dihapus.');
    setShowDeleteModal(false);
    onNavigatePage('projects');
  };

  const handleTabChange = (path: string) => {
    navigate(`/project/${projectId}/${path}`);
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
    updateProject(projectId, { status: 'Revision', phase: 'Revisi' });
    addTimelineEvent(projectId, {
      id: `evt-${Date.now()}`,
      title: 'Proyek Direvisi',
      actor: 'System',
      role: 'System',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'revision',
      description: 'Proyek dikembalikan ke tahap revisi.',
    });
    toast.success('Proyek dikembalikan ke tahap revisi.');
  };

  const handleShowNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    onShowNotification(message, type);
  };

  const isChatTab = activeTab === 'Diskusi';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky Project Header with Dynamic Breadcrumbs */}
      <section className="bg-white border-b border-border px-8 py-3.5 shadow-sm z-30">
        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-secondary mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigatePage('projects')}
            className="hover:text-primary transition-colors font-medium flex items-center gap-1 text-slate-500"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">tactic</span>
            Projects
          </button>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <button
            type="button"
            onClick={() => navigate(`/project/${projectId}/overview`)}
            className="hover:text-primary transition-colors font-semibold text-slate-600"
          >
            {project.code}
          </button>
          {!isOverview && (
            <>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-primary font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                {activeTab}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isOverview ? onNavigatePage('projects') : navigate(`/project/${projectId}/overview`)}
              className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center border border-border bg-white"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display-title text-xl font-bold tracking-tight">{project.code}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-status-indigo/10 text-status-indigo font-semibold text-xs border border-status-indigo/20">
                  {project.status}
                </span>
              </div>
              <p className="text-secondary text-sm line-clamp-1">{project.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {can('proyek_delete') && (
            <button
              onClick={handleDeleteProject}
              className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-lg hover:bg-danger/5 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Hapus
            </button>
            )}
            {can('proyek_edit') && (
            <button
              onClick={handleRevision}
              className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-lg hover:bg-danger/5 transition-all"
            >
              Revisi
            </button>
            )}
            {can('approval_process') && (
            <button
              onClick={handleApproveProject}
              className="px-5 py-1.5 bg-success text-white font-semibold text-xs rounded-lg hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Approve
            </button>
            )}
          </div>
        </div>
      </section>

      {/* Main scrollable area — stepper, tab nav, and tab content all scroll together */}
      {isChatTab ? (
        /* Chat tab: full-height, no scroll wrapper needed (chat has its own scroll) */
        <div className="flex-1 overflow-hidden">
          <ChatTab project={project} onShowNotification={handleShowNotification} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Dynamic Stepper: hanya di Overview */}
          {isOverview && !(project.type === 'Prospecting' && isFromNonPotensial) && (
            <section className="bg-surface-container-lowest px-8 py-6 border-b border-border overflow-x-auto select-none">
              <div className="min-w-[600px] flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-0"></div>

                {(() => {
                  const currentStep = accessibleUpToIndex;
                  return tabs.map((step, index) => {
                  const stepNum = index + 1;
                  const isCompleted = index < currentStep;
                  const isActive = index === currentStep;
                  // Unlock rules: Timeline/Dokumen always, Harga/Kompetitor/Pemenang after LPHS mgmt approval, Target Delivery after menang
                  const isSpecialUnlocked = (
                    step.label === 'Timeline' || step.label === 'Dokumen' ||
                    (['Harga', 'Kompetitor', 'Pemenang'].includes(step.label) && lphsMgmtApproved) ||
                    (step.label === 'Target Delivery' && isMenang)
                  );
                  const isFuture = !isCompleted && !isActive && !isSpecialUnlocked;

                  return (
                    <div
                      key={step.label}
                      onClick={() => {
                        if (!isFuture) navigate(`/project/${projectId}/${step.path}`);
                      }}
                      className={`relative z-10 flex flex-col items-center gap-2 bg-surface-container-lowest px-4 ${isFuture ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'} transition-transform`}
                    >
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                    ) : isActive ? (
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-primary/10">
                        {stepNum}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-border text-on-surface-variant flex items-center justify-center font-bold text-sm">
                        {stepNum}
                      </div>
                    )}
                    <span className={`font-label-sm text-xs whitespace-nowrap ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {step.label}
                    </span>
                  </div>
                );
                });
              })()}
              </div>
            </section>
          )}

          {/* Tab Navigation Bar — visible on ALL tabs */}
          <nav className="bg-white border-b border-border px-8 overflow-x-auto select-none">
            <div className="flex items-center gap-8 min-w-max">
              {tabs.map((tab, index) => {
                const locked = isTabLocked(index);
                return (
                  <button
                    key={tab.label}
                    onClick={() => { if (!locked) handleTabChange(tab.path); }}
                    title={locked ? `Selesaikan tahap "${tabs[Math.min(accessibleUpToIndex, tabs.length - 1)]?.label}" terlebih dahulu` : tab.label}
                    className={`py-4 font-label-sm text-sm transition-all relative flex items-center gap-1 ${
                      activeTab === tab.label
                        ? 'text-primary font-bold border-b-2 border-primary'
                        : locked
                          ? 'text-outline cursor-not-allowed opacity-50'
                          : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {locked && <span className="material-symbols-outlined text-[16px]">lock</span>}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Tab Panel Content */}
          <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-6">

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
                  if (lockedTab?.label === 'Target Delivery') {
                    return 'Tahap Target Delivery hanya dapat diakses setelah proyek dinyatakan MENANG. Silakan isi data Pemenang terlebih dahulu.';
                  }
                  if (['Harga', 'Kompetitor', 'Pemenang'].includes(lockedTab?.label || '')) {
                    return 'Tahap ini dapat diakses setelah LPHS/SIOS mendapat final approval dari Management.';
                  }
                  return `Tahap ini belum dapat diakses. Selesaikan dan dapatkan persetujuan untuk tahap "${tabs[Math.min(accessibleUpToIndex, tabs.length - 1)]?.label}" terlebih dahulu.`;
                })()}
              </p>
            </div>
          )}

          {/* Non-locked tabs wrapper */}
          {(!isTabLocked(activeTabIndex) || activeTab === 'Overview') && (
            <>
          {/* TAB 2: RKS */}
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

          {/* TAB 8: TARGET DELIVERY */}
          {activeTab === 'Target Delivery' && (
            <DeliveryTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 9: TIMELINE */}
          {activeTab === 'Timeline' && (
            <TimelineTab project={project} onShowNotification={handleShowNotification} />
          )}

          {/* TAB 10: DOKUMEN */}
          {activeTab === 'Dokumen' && (
            <DokumenTab project={project} onShowNotification={handleShowNotification} />
          )}
            </>
          )}

            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDeleteProject}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
