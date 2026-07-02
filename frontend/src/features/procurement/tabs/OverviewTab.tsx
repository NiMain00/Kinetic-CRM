import React from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  procurement: Procurement;
}

export default function OverviewTab({ procurement }: Props) {
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

      {/* PR / PO Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procurement.prNumber && (
          <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-secondary font-medium mb-1">Purchase Request</p>
            <p className="font-subheading-entity font-bold text-on-surface">
              {procurement.prNumber}
            </p>
            {procurement.prNotes && (
              <p className="text-xs text-secondary mt-1">{procurement.prNotes}</p>
            )}
          </div>
        )}
        {procurement.poNumber && (
          <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-secondary font-medium mb-1">Purchase Order</p>
            <p className="font-subheading-entity font-bold text-on-surface">
              {procurement.poNumber}
            </p>
            {procurement.poDate && (
              <p className="text-xs text-secondary mt-1">Tgl PO: {procurement.poDate}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
