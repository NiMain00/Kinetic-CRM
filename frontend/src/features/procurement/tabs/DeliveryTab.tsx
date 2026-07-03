import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function DeliveryTab({ procurement }: Props) {
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
  const [actualEndDate, setActualEndDate] = useState(
    procurement.actualEndDate || '',
  );
  const [deliveryNote, setDeliveryNote] = useState(
    procurement.deliveryNote || '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTargetStartDate(procurement.targetStartDate || '');
    setTargetEndDate(procurement.targetEndDate || '');
    setPoDate(procurement.poDate || '');
    setUnitReadyDate(procurement.unitReadyDate || '');
    setUnitShippedDate(procurement.unitShippedDate || '');
    setUnitReceivedDate(procurement.unitReceivedDate || '');
    setActualEndDate(procurement.actualEndDate || '');
    setDeliveryNote(procurement.deliveryNote || '');
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
    if (procurement.status === 'PO Process') {
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

  const handleConfirmDelivery = () => {
    if (!procurement.id) return;
    const errs: Record<string, string> = {};
    if (!targetStartDate) errs.targetStartDate = 'Wajib diisi';
    if (!targetEndDate) errs.targetEndDate = 'Wajib diisi';
    if (!unitReceivedDate) errs.unitReceivedDate = 'Wajib diisi untuk konfirmasi';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateProcurement(procurement.id, {
      targetStartDate,
      targetEndDate,
      poDate,
      unitReadyDate,
      unitShippedDate,
      unitReceivedDate,
      actualEndDate,
      deliveryNote,
      isDelivered: true,
      deliveredAt: new Date().toISOString(),
    });

    if (
      procurement.status === 'PO Process' ||
      procurement.status === 'Delivery'
    ) {
      updateProcurement(procurement.id, {
        status: 'Progress',
        phase: 'Progress',
      });
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
          'Pengiriman telah dikonfirmasi. Procurement memasuki tahap Progress.',
      });
      toast.success('Delivery dikonfirmasi! Procurement beralih ke tahap Progress.');
    }
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
          {isDelivered && (
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
                Tanggal Selesai Aktual
              </label>
              <input
                type="date"
                value={actualEndDate}
                onChange={(e) => setActualEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
                disabled
              />
            </div>
          )}
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
    </div>
  );
}
