import React from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Props {
  procurement: Procurement;
}

export default function OverviewTab({ procurement }: Props) {
  const hasPO = procurement.poNumber || procurement.poDate || procurement.poValue || procurement.poNotes;

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Nilai Kontrak</p>
          <p className="font-display-title text-lg font-bold text-on-surface">
            {formatCurrency(procurement.contractValue)}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Status</p>
          <p className="font-heading-section text-base font-bold text-on-surface">
            {procurement.status}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${procurement.progress}%` }}
              />
            </div>
            <span className="font-mono-data text-sm font-bold text-on-surface">
              {procurement.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Detail Information */}
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-heading-section text-sm font-bold text-on-surface">
          Informasi Pengadaan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-secondary font-medium">Kode Pengadaan</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.code}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Klien</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.client}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Lokasi</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.location || '-'}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Proyek Asal</p>
            <p className="text-on-surface font-semibold mt-0.5">
              {procurement.sourceProjectCode
                ? `${procurement.sourceProjectName || procurement.sourceProjectCode} (${procurement.sourceProjectCode})`
                : 'Manual'}
            </p>
          </div>
          <div>
            <p className="text-secondary font-medium">Dibuat Oleh</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.createdBy}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Tanggal Dibuat</p>
            <p className="text-on-surface font-semibold mt-0.5">
              {new Date(procurement.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      {procurement.selectedVendor && (
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Vendor Terpilih</p>
          <p className="font-subheading-entity font-bold text-on-surface">
            {procurement.selectedVendor}
          </p>
          {procurement.vendorPic && (
            <p className="text-xs text-secondary mt-1">PIC: {procurement.vendorPic}</p>
          )}
        </div>
      )}

      {/* PO Info */}
      {hasPO && (
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
            Purchase Order
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {procurement.poNumber && (
              <div>
                <p className="text-secondary font-medium">Nomor PO</p>
                <p className="text-on-surface font-semibold mt-0.5">{procurement.poNumber}</p>
              </div>
            )}
            {procurement.poDate && (
              <div>
                <p className="text-secondary font-medium">Tanggal PO</p>
                <p className="text-on-surface font-semibold mt-0.5">{formatDate(procurement.poDate)}</p>
              </div>
            )}
            {procurement.poValue && (
              <div>
                <p className="text-secondary font-medium">Nilai PO</p>
                <p className="text-on-surface font-semibold mt-0.5">{formatCurrency(procurement.poValue)}</p>
              </div>
            )}
          </div>
          {procurement.poNotes && (
            <div className="text-xs">
              <p className="text-secondary font-medium">Catatan PO</p>
              <p className="text-on-surface mt-0.5">{procurement.poNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
