import React, { useState, useEffect, useRef } from 'react';
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

  // --- Refs for auto-save ---
  const selectedVendorRef = useRef(selectedVendor);
  useEffect(() => { selectedVendorRef.current = selectedVendor; }, [selectedVendor]);
  const vendorPicRef = useRef(vendorPic);
  useEffect(() => { vendorPicRef.current = vendorPic; }, [vendorPic]);
  const vendorContactRef = useRef(vendorContact);
  useEffect(() => { vendorContactRef.current = vendorContact; }, [vendorContact]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    setSelectedVendor(procurement.selectedVendor || '');
    setVendorPic(procurement.vendorPic || '');
    setVendorContact(procurement.vendorContact || '');
  }, [procurement.id]);

  // Sync to Zustand store on every change (immediate)
  useEffect(() => {
    if (!procurement.id) return;
    const store = useProcurementStore.getState();
    const current = store.entities[procurement.id];
    if (!current) return;
    useProcurementStore.setState((s) => ({
      entities: {
        ...s.entities,
        [procurement.id]: {
          ...current,
          selectedVendor: selectedVendorRef.current,
          vendorPic: vendorPicRef.current,
          vendorContact: vendorContactRef.current,
        },
      },
    }));
  }, [selectedVendor, vendorPic, vendorContact, procurement.id]);

  // Auto-save to backend (debounced)
  useEffect(() => {
    if (!procurement.id) return;
    const hasData = selectedVendor || vendorPic || vendorContact;
    setAutoSaveStatus(hasData ? 'unsaved' : 'saved');
    if (!hasData) return;
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      updateProcurement(procurement.id, {
        selectedVendor: selectedVendorRef.current,
        vendorPic: vendorPicRef.current,
        vendorContact: vendorContactRef.current,
      }).then(() => setAutoSaveStatus('saved'))
        .catch(() => { setAutoSaveStatus('unsaved'); });
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedVendor, vendorPic, vendorContact, procurement.id]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (!procurement.id) return;
      const sv = selectedVendorRef.current;
      const vp = vendorPicRef.current;
      const vc = vendorContactRef.current;
      if (!sv && !vp && !vc) return;
      updateProcurement(procurement.id, {
        selectedVendor: sv,
        vendorPic: vp,
        vendorContact: vc,
      }).catch(() => {});
    };
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { selectedVendor, vendorPic, vendorContact });
    if (procurement.status === 'Draft') {
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
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5 block">
              Nama Vendor
            </label>
            <input
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="PT. Supplier Utama"
              aria-label="Nama Vendor"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5 block">
              PIC Vendor
            </label>
            <input
              value={vendorPic}
              onChange={(e) => setVendorPic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="Nama kontak person"
              aria-label="PIC Vendor"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5 block">
              Kontak Vendor
            </label>
            <input
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
              placeholder="Telepon / Email"
              aria-label="Kontak Vendor"
            />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 border-t pt-6 border-border">
          <div className="flex items-center gap-2 text-xs">
            {autoSaveStatus === 'saving' && (
              <span className="text-warning flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                Menyimpan...
              </span>
            )}
            {autoSaveStatus === 'saved' && (selectedVendor || vendorPic || vendorContact) && (
              <span className="text-success flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Tersimpan
              </span>
            )}
            {autoSaveStatus === 'unsaved' && (selectedVendor || vendorPic || vendorContact) && (
              <span className="text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Belum tersimpan
              </span>
            )}
          </div>
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
