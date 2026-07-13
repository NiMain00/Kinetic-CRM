import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function DeliveryTab({ procurement }: Props) {
  const navigate = useNavigate();
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [targetStartDate, setTargetStartDate] = useState(
    procurement.targetStartDate || '',
  );
  const [targetEndDate, setTargetEndDate] = useState(
    procurement.targetEndDate || '',
  );
  const [poDate, setPoDate] = useState(procurement.poDate || '');
  const [unitReadyDate, setUnitReadyDate] = useState(
    procurement.unitReadyDate || '',
  );
  const [unitShippedDate, setUnitShippedDate] = useState(
    procurement.unitShippedDate || '',
  );
  const [unitReceivedDate, setUnitReceivedDate] = useState(
    procurement.unitReceivedDate || '',
  );
  const [deliveryNote, setDeliveryNote] = useState(
    procurement.deliveryNote || '',
  );
  const [progressNotes, setProgressNotes] = useState(
    procurement.progressNotes || '',
  );
  const [progressVal, setProgressVal] = useState(procurement.progress || 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTargetStartDate(procurement.targetStartDate || '');
    setTargetEndDate(procurement.targetEndDate || '');
    setPoDate(procurement.poDate || '');
    setUnitReadyDate(procurement.unitReadyDate || '');
    setUnitShippedDate(procurement.unitShippedDate || '');
    setUnitReceivedDate(procurement.unitReceivedDate || '');
    setDeliveryNote(procurement.deliveryNote || '');
    setProgressNotes(procurement.progressNotes || '');
    setProgressVal(procurement.progress || 0);
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      targetStartDate,
      targetEndDate,
      poDate,
      unitReadyDate,
      unitShippedDate,
      unitReceivedDate,
      deliveryNote,
    });
    if (procurement.status === 'Vendor Selection') {
      updateProcurement(procurement.id, {
        status: 'Delivery',
        phase: 'Delivery',
      });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'Target Delivery Disimpan',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'submit',
        description:
          'Target jadwal delivery telah ditetapkan. Procurement memasuki tahap Delivery.',
      });
      toast.success('Target delivery disimpan. Procurement beralih ke tahap Delivery.');
    } else {
      toast.success('Data delivery berhasil disimpan');
    }
  };

  const handleRevision = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      isDelivered: false,
      deliveredAt: undefined,
      deliveredBy: undefined,
      status: 'Delivery',
      phase: 'Delivery',
    });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Delivery Direvisi',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type: 'revision',
      description: 'Pengiriman dikembalikan ke tahap revisi untuk dilakukan perubahan data delivery.',
    });
    toast.success('Data delivery dikembalikan ke tahap revisi.');
  };

  const handleConfirmDelivery = () => {
    if (!procurement.id) return;
    const errs: Record<string, string> = {};
    if (!targetStartDate) errs.targetStartDate = 'Wajib diisi';
    if (!targetEndDate) errs.targetEndDate = 'Wajib diisi';
    if (!unitReceivedDate) errs.unitReceivedDate = 'Wajib diisi untuk konfirmasi';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const nextStatus =
      procurement.status === 'Vendor Selection' || procurement.status === 'Delivery'
        ? 'Delivery'
        : procurement.status;
    const nextPhase =
      procurement.status === 'Vendor Selection' || procurement.status === 'Delivery'
        ? 'Delivery'
        : procurement.phase;

    updateProcurement(procurement.id, {
      targetStartDate,
      targetEndDate,
      poDate,
      unitReadyDate,
      unitShippedDate,
      unitReceivedDate,
      deliveryNote,
      isDelivered: true,
      deliveredAt: new Date().toISOString(),
      status: nextStatus,
      phase: nextPhase,
    });

    if (
      procurement.status === 'Vendor Selection' ||
      procurement.status === 'Delivery'
    ) {
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'Delivery Dikonfirmasi',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'approve',
        description:
          'Pengiriman telah dikonfirmasi. Data progress pengadaan dapat diisi pada tab yang sama.',
      });
      toast.success('Delivery dikonfirmasi! Silakan isi data progress pengadaan.');
    }
  };

  const handleSaveProgress = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { progressNotes, progress: progressVal });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Progress Pengadaan Diperbarui',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'status_change',
      description: `Progress pengadaan diperbarui ke ${progressVal}%.`,
    });
    toast.success('Progress berhasil disimpan');
  };

  const handleContinueToClosing = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { progressNotes, progress: progressVal });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Lanjut ke Penutupan',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'submit',
      description: 'Delivery selesai, pengadaan dilanjutkan ke tahap penutupan.',
    });
    toast.success('Progress disimpan. Silakan tutup pengadaan di tab Closing.');
    navigate(`/procurement/${procurement.id}/closing`);
  };

  const isClosed =
    procurement.status === 'Closed' || procurement.status === 'Cancelled';
  const isDelivered = procurement.isDelivered;

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">
              local_shipping
            </span>
            Target Delivery & Tracking
          </h3>
          <p className="text-xs text-secondary">
            Lacak pengiriman unit dari PO hingga diterima di lokasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal PO
            </label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              disabled={isClosed}
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal Mulai Delivery <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={targetStartDate}
              onChange={(e) => {
                setTargetStartDate(e.target.value);
                setErrors((p) => ({ ...p, targetStartDate: '' }));
              }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface ${errors.targetStartDate ? 'border-danger' : 'border-border'}`}
              disabled={isClosed}
            />
            {errors.targetStartDate && (
              <p className="text-xs text-danger mt-1">
                {errors.targetStartDate}
              </p>
            )}
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Estimasi Tanggal Sampai <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={targetEndDate}
              onChange={(e) => {
                setTargetEndDate(e.target.value);
                setErrors((p) => ({ ...p, targetEndDate: '' }));
              }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface ${errors.targetEndDate ? 'border-danger' : 'border-border'}`}
              disabled={isClosed}
            />
            {errors.targetEndDate && (
              <p className="text-xs text-danger mt-1">{errors.targetEndDate}</p>
            )}
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal Unit Ready
            </label>
            <input
              type="date"
              value={unitReadyDate}
              onChange={(e) => setUnitReadyDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              disabled={isClosed}
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal Unit Terkirim
            </label>
            <input
              type="date"
              value={unitShippedDate}
              onChange={(e) => setUnitShippedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              disabled={isClosed}
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal Unit Diterima
            </label>
            <input
              type="date"
              value={unitReceivedDate}
              onChange={(e) => setUnitReceivedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              disabled={isClosed}
            />
          </div>
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
            Catatan Logistik
          </label>
          <textarea
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none bg-surface text-on-surface"
            placeholder="Rincian pengiriman, instruksi logistik..."
            disabled={isClosed}
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          {!isClosed && (
            <Button
              variant="secondary"
              onClick={handleSave}
              leftIcon={
                <span className="material-symbols-outlined text-[18px]">
                  drafts
                </span>
              }
            >
              Simpan Draft
            </Button>
          )}
          {isDelivered && !isClosed && (
            <Button
              variant="outline"
              className="border-danger text-danger hover:bg-danger/5"
              onClick={handleRevision}
              leftIcon={
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
              }
            >
              Revisi
            </Button>
          )}
          {!isDelivered && !isClosed && (
            <Button
              onClick={handleConfirmDelivery}
              rightIcon={
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              }
            >
              Konfirmasi & Lanjutkan
            </Button>
          )}
        </div>
      </div>

      {isDelivered && (
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">
                trending_up
              </span>
              Progress Pengadaan
            </h3>
            <p className="text-xs text-secondary">
              Pantau perkembangan proses pengadaan.
            </p>
          </div>

          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Progress (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-mono-data text-sm font-bold text-on-surface min-w-[3rem] text-right">
                {progressVal}%
              </span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressVal}%` }}
              />
            </div>
          </div>

          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Catatan Progress
            </label>
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none bg-surface text-on-surface"
              placeholder="Catatan perkembangan pengadaan..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6 border-border">
            <Button
              variant="secondary"
              onClick={handleSaveProgress}
              leftIcon={
                <span className="material-symbols-outlined text-[18px]">drafts</span>
              }
            >
              Simpan Draft
            </Button>
            <Button
              onClick={handleContinueToClosing}
              rightIcon={
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              }
            >
              Lanjutkan ke Closing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
