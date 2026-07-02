import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button, CurrencyInput } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function PoTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [poNumber, setPoNumber] = useState(procurement.poNumber || '');
  const [poDate, setPoDate] = useState(procurement.poDate || '');
  const [poValue, setPoValue] = useState<number | undefined>(
    procurement.poValue,
  );
  const [poNotes, setPoNotes] = useState(procurement.poNotes || '');

  useEffect(() => {
    setPoNumber(procurement.poNumber || '');
    setPoDate(procurement.poDate || '');
    setPoValue(procurement.poValue);
    setPoNotes(procurement.poNotes || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { poNumber, poDate, poValue, poNotes });
    if (procurement.status === 'Vendor Selection') {
      updateProcurement(procurement.id, { status: 'PO Process', phase: 'PO' });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'PO Diterbitkan',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'submit',
        description: `Purchase Order ${poNumber} diterbitkan.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">
              receipt_long
            </span>
            Purchase Order
          </h3>
          <p className="text-xs text-secondary">
            Lengkapi data Purchase Order untuk proses pemesanan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Nomor PO
            </label>
            <input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="PO-2026-001"
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal PO
            </label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
            />
          </div>
          <div>
            <CurrencyInput
              label="Nilai PO"
              value={poValue}
              onChange={setPoValue}
              placeholder="Rp 0"
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Catatan PO
            </label>
            <input
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="Catatan..."
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
            Simpan & Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}
