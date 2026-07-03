import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function ClosingTab({ procurement }: Props) {
  const navigate = useNavigate();
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const handleClose = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      status: 'Closed',
      phase: 'Closing',
      progress: 100,
      isClosed: true,
      closedAt: new Date().toISOString(),
      closedBy: procurement.createdBy,
    });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Pengadaan Selesai',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type: 'approve',
      description: `Pengadaan ${procurement.code} telah selesai dan ditutup.`,
    });
    toast.success(`Pengadaan ${procurement.code} berhasil ditutup!`);
    navigate('/procurement');
  };

  const handleCancel = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      status: 'Cancelled',
      phase: 'Selesai',
      isClosed: true,
      closedAt: new Date().toISOString(),
      closedBy: procurement.createdBy,
    });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Pengadaan Dibatalkan',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type: 'revision',
      description: `Pengadaan ${procurement.code} dibatalkan.`,
    });
    toast.success(`Pengadaan ${procurement.code} dibatalkan.`);
    navigate('/procurement');
  };

  const isClosed = procurement.status === 'Closed';
  const isCancelled = procurement.status === 'Cancelled';

  if (isClosed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-success mb-4">
          check_circle
        </span>
        <h3 className="font-heading-section text-lg font-bold text-on-surface">
          Pengadaan Selesai
        </h3>
        <p className="text-sm text-secondary mt-2">
          Pengadaan {procurement.code} telah ditutup pada{' '}
          {procurement.closedAt
            ? new Date(procurement.closedAt).toLocaleDateString('id-ID')
            : '-'}
          .
        </p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-danger mb-4">
          cancel
        </span>
        <h3 className="font-heading-section text-lg font-bold text-on-surface">
          Pengadaan Dibatalkan
        </h3>
        <p className="text-sm text-secondary mt-2">
          Pengadaan {procurement.code} telah dibatalkan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-8">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">
              flag
            </span>
            Penutupan Pengadaan
          </h3>
          <p className="text-xs text-secondary">
            Pastikan semua data telah lengkap sebelum menutup pengadaan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-xl p-5 border border-border">
            <h4 className="font-label-sm text-xs font-semibold text-on-surface mb-3">
              Ringkasan
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Kode</span>
                <span className="font-semibold">{procurement.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Klien</span>
                <span className="font-semibold">{procurement.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Status</span>
                <span className="font-semibold">{procurement.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Progress</span>
                <span className="font-semibold">{procurement.progress}%</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-warning">
                warning_amber
              </span>
              <div>
                <h4 className="font-label-sm text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Konfirmasi
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Pastikan semua unit telah diterima dan data delivery telah
                  lengkap sebelum menutup pengadaan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          <Button
            variant="danger"
            onClick={handleCancel}
            leftIcon={
              <span className="material-symbols-outlined text-[18px]">
                cancel
              </span>
            }
          >
            Batalkan Pengadaan
          </Button>
          <Button
            onClick={handleClose}
            rightIcon={
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
            }
          >
            Tutup Pengadaan
          </Button>
        </div>
      </div>
    </div>
  );
}
