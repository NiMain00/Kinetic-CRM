import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import PhaseStepper from '@/components/shared/PhaseStepper';
import { StatusBadge } from '@/components/shared';
import { useProcurementStore } from './procurementStore';
import { useAuthz } from '@/hooks/useAuthz';
import { PROCUREMENT_PHASES } from '@/types/domain/procurement';

// Tab imports
import OverviewTab from './tabs/OverviewTab';
import VendorSelectionTab from './tabs/VendorSelectionTab';
import DeliveryTab from './tabs/DeliveryTab';
import ClosingTab from './tabs/ClosingTab';
import TimelineTab from './tabs/TimelineTab';
import DokumenTab from './tabs/DokumenTab';

export default function ProcurementDetailView() {
  const { procurementId, tab: urlTab } = useParams<{
    procurementId: string;
    tab: string;
  }>();
  const navigate = useNavigate();
  const store = useProcurementStore();
  const procurement = procurementId
    ? store.entities[procurementId]
    : undefined;
  const { can } = useAuthz();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(!procurement);

  useEffect(() => {
    if (procurementId && !store.entities[procurementId]) {
      setLoadingDetail(true);
      store.fetchProcurements().finally(() => setLoadingDetail(false));
    }
  }, [procurementId]);

  const activePhases = useMemo(
    () => [...PROCUREMENT_PHASES].filter((p) => p.isActive).sort((a, b) => a.order - b.order),
    [],
  );

  const currentStepIndex = useMemo(
    () => activePhases.findIndex((p) => p.status === procurement?.status),
    [procurement?.status, activePhases],
  );

  const tabs = useMemo(() => {
    const items = [
      { label: 'Overview', path: 'overview' },
      { label: 'Vendor Selection', path: 'vendor-selection' },
      { label: 'Delivery', path: 'delivery' },
      { label: 'Closing', path: 'closing' },
      { label: 'Timeline', path: 'timeline' },
      { label: 'Dokumen', path: 'dokumen' },
    ];
    return items;
  }, []);

  const activeTab =
    tabs.find((t) => t.path === (urlTab || 'overview'))?.label || 'Overview';
  const isOverview = activeTab === 'Overview';
  const isTerminal =
    procurement?.status === 'Closed' || procurement?.status === 'Cancelled';

  if (!procurement) {
    if (loadingDetail) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="bg-surface border-b border-border/60 px-4 sm:px-8 py-3 shadow-sm">
            <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-surface-container-high rounded-full animate-pulse" />
              <div className="h-6 w-32 bg-surface-container-high rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="py-20 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-outline">
            search_off
          </span>
          <h3 className="font-heading-section text-base text-on-surface">
            Pengadaan not found
          </h3>
          <p className="text-sm text-outline">
            Pengadaan tidak ditemukan atau telah dihapus.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/procurement')}
          >
            Kembali ke Pengadaan
          </Button>
        </div>
      </div>
    );
  }

  const handleTabChange = (path: string) => {
    navigate(`/procurement/${procurementId}/${path}`);
  };

  const confirmDelete = () => {
    if (!procurementId) return;
    store.deleteProcurement(procurementId);
    toast.success('Pengadaan berhasil dihapus');
    setShowDeleteModal(false);
    navigate('/procurement');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky Header */}
      <section className="bg-surface border-b border-border/60 px-4 sm:px-8 py-2 sm:py-3 shadow-sm z-30">
        <nav className="flex items-center gap-1 text-xs text-secondary mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/procurement')}
            className="hover:text-primary transition-colors font-medium flex items-center gap-1 text-secondary touch-min-h"
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-outline">
              inventory_2
            </span>
            <span className="hidden sm:inline">Pengadaan</span>
          </button>
          <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-outline">
            chevron_right
          </span>
          <span className="text-on-surface-variant font-semibold truncate max-w-[80px] sm:max-w-none text-xs sm:text-sm">
            {procurement.code}
          </span>
          {!isOverview && (
            <>
              <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-outline">
                chevron_right
              </span>
              <span className="text-primary font-bold bg-primary/5 px-1.5 sm:px-2 py-0.5 rounded border border-primary/20 text-xs truncate max-w-[80px] sm:max-w-none">
                {activeTab}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() =>
                isOverview
                  ? navigate('/procurement')
                  : navigate(`/procurement/${procurementId}`)
              }
              className="p-1 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border/60 bg-surface shrink-0 touch-min"
            >
              <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">
                arrow_back
              </span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <h2 className="font-display-title text-base sm:text-xl font-bold tracking-tight truncate">
                  {procurement.code}
                </h2>
                <StatusBadge status={procurement.status} size="md" />
              </div>
              <p className="text-secondary text-xs sm:text-sm line-clamp-1 truncate">
                {procurement.client}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {can('pengadaan:write') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="border-danger text-danger hover:bg-danger/5"
                leftIcon={<span className="material-symbols-outlined text-[16px]">delete</span>}
              >
                Hapus
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1">
        {isOverview && (
          <PhaseStepper
            steps={tabs.slice(0, 4)}
            currentStepIndex={currentStepIndex}
            accessibleUpToIndex={
              isTerminal ? tabs.length - 1 : currentStepIndex + 1
            }
            onStepClick={(path) => handleTabChange(path)}
            isStepUnlocked={(index) => index <= currentStepIndex + 1 || isTerminal}
          />
        )}

        {/* Tab Nav */}
        <nav className="bg-surface border-b border-border/60 px-3 sm:px-8 py-3 overflow-x-auto select-none scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => handleTabChange(tab.path)}
                className={`px-4 py-2 font-label-sm text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.label
                    ? 'bg-primary text-white shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Panels */}
        <div className="p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            {activeTab === 'Overview' && <OverviewTab procurement={procurement} />}

            {activeTab === 'Vendor Selection' && (
              <VendorSelectionTab procurement={procurement} />
            )}
            {activeTab === 'Delivery' && (
              <DeliveryTab procurement={procurement} />
            )}
            {activeTab === 'Closing' && (
              <ClosingTab procurement={procurement} />
            )}
            {activeTab === 'Timeline' && (
              <TimelineTab procurement={procurement} />
            )}
            {activeTab === 'Dokumen' && (
              <DokumenTab procurement={procurement} />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Apakah Anda yakin ingin menghapus pengadaan ini?
        </p>
      </Modal>
    </div>
  );
}
