import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function VendorSelectionTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [selectedVendor, setSelectedVendor] = useState(
    procurement.selectedVendor || '',
  );
  const [vendorPic, setVendorPic] = useState(procurement.vendorPic || '');
  const [vendorContact, setVendorContact] = useState(
    procurement.vendorContact || '',
  );

  useEffect(() => {
    setSelectedVendor(procurement.selectedVendor || '');
    setVendorPic(procurement.vendorPic || '');
    setVendorContact(procurement.vendorContact || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { selectedVendor, vendorPic, vendorContact });
    if (procurement.status === 'Purchase Request') {
      updateProcurement(procurement.id, {
        status: 'Vendor Selection',
        phase: 'Vendor Selection',
      });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'Vendor Dipilih',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'submit',
        description: `Vendor ${selectedVendor} terpilih untuk pengadaan ${procurement.code}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">
              business
            </span>
            Vendor Selection
          </h3>
          <p className="text-xs text-secondary">
            Tentukan vendor yang akan menangani pengadaan ini.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Nama Vendor
            </label>
            <input
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="PT. Supplier Utama"
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              PIC Vendor
            </label>
            <input
              value={vendorPic}
              onChange={(e) => setVendorPic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="Nama kontak person"
            />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Kontak Vendor
            </label>
            <input
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="Telepon / Email"
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
