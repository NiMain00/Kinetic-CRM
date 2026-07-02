import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function PurchaseRequestTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [prNumber, setPrNumber] = useState(procurement.prNumber || '');
  const [prDate, setPrDate] = useState(procurement.prDate || '');
  const [prNotes, setPrNotes] = useState(procurement.prNotes || '');

  useEffect(() => {
    setPrNumber(procurement.prNumber || '');
    setPrDate(procurement.prDate || '');
    setPrNotes(procurement.prNotes || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { prNumber, prDate, prNotes });
    if (procurement.status === 'Draft') {
      updateProcurement(procurement.id, {
        status: 'Purchase Request',
        phase: 'Purchase Request',
      });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'PR Dibuat',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'submit',
        description: `Purchase Request ${prNumber} berhasil dibuat.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">description</span>
            Purchase Request
          </h3>
          <p className="text-xs text-secondary">
            Lengkapi data Purchase Request untuk memulai proses pengadaan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Nomor PR
            </label>
            <input
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="PR-2026-001"
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal PR
            </label>
            <input
              type="date"
              value={prDate}
              onChange={(e) => setPrDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
            />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Catatan PR
            </label>
            <textarea
              value={prNotes}
              onChange={(e) => setPrNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none bg-surface text-on-surface"
              placeholder="Deskripsi kebutuhan pengadaan..."
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-6 border-border">
          <Button
            onClick={handleSave}
            rightIcon={
              <span className="material-symbols-outlined text-[18px]">save</span>
            }
          >
            {procurement.status === 'Draft' ? 'Simpan & Lanjutkan' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
