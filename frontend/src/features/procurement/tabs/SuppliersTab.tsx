import React, { useState, useMemo } from 'react';
import { Modal, Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSupplierStore } from '@/stores/supplierStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Supplier, SupplierEvaluation } from '@/types/domain/procurement';

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  agent: 'Agent',
  contractor: 'Contractor',
  consultant: 'Consultant',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  blacklisted: 'danger',
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined text-[14px] ${
            star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'
          }`}
        >
          star
        </span>
      ))}
      <span className="text-xs font-semibold text-secondary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-secondary w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-secondary w-8 text-right">{score}%</span>
    </div>
  );
}

export default function SuppliersTab() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const updateSupplier = useSupplierStore((s) => s.updateSupplier);
  const deleteSupplier = useSupplierStore((s) => s.deleteSupplier);
  const addEvaluation = useSupplierStore((s) => s.addEvaluation);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEvalForm, setShowEvalForm] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !s.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [suppliers, searchQuery, typeFilter, statusFilter]);

  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => b.rating - a.rating);
  }, [filteredSuppliers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-on-surface">Supplier Database</h3>
          <p className="text-sm text-secondary">{suppliers.length} supplier terdaftar</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(true)}
          leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
        >
          Tambah Supplier
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-primary outline-none w-[220px]"
            placeholder="Cari supplier..."
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-xl text-sm bg-surface outline-none"
        >
          <option value="all">Semua Tipe</option>
          {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-xl text-sm bg-surface outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-secondary">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">inventory_2</span>
            <p>Tidak ada supplier ditemukan</p>
          </div>
        ) : (
          sortedSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-surface rounded-xl border border-border/60 p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedSupplier(supplier)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-on-surface">{supplier.name}</h4>
                    <Badge variant={STATUS_VARIANTS[supplier.status]}>{supplier.status}</Badge>
                  </div>
                  <p className="text-[11px] text-secondary">{supplier.code} · {SUPPLIER_TYPE_LABELS[supplier.type]}</p>
                </div>
                <RatingStars rating={supplier.rating} />
              </div>

              <div className="flex items-center gap-3 text-xs text-secondary mb-3">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_city</span>
                  {supplier.city}
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">folder</span>
                  {supplier.totalProjects} proyek
                </div>
              </div>

              <div className="space-y-1.5">
                <ScoreBar label="Delivery" score={supplier.onTimeDelivery} />
                <ScoreBar label="Quality" score={supplier.qualityScore} />
                <ScoreBar label="Compliance" score={supplier.complianceScore} />
              </div>

              {supplier.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {supplier.categories.map((cat) => (
                    <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/20">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Supplier Detail Modal */}
      <Modal
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier?.name || ''}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEvalForm(true)}>
              Tambah Evaluasi
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Code</span>
                <span>{selectedSupplier.code}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Type</span>
                <span>{SUPPLIER_TYPE_LABELS[selectedSupplier.type]}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">City</span>
                <span>{selectedSupplier.city}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Rating</span>
                <RatingStars rating={selectedSupplier.rating} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Phone</span>
                <span>{selectedSupplier.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Email</span>
                <span>{selectedSupplier.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">PIC</span>
                <span>{selectedSupplier.picName}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-secondary block">Position</span>
                <span>{selectedSupplier.picPosition}</span>
              </div>
            </div>

            {selectedSupplier.blacklistReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <span className="font-semibold">Blacklisted: </span>
                {selectedSupplier.blacklistReason}
              </div>
            )}

            {selectedSupplier.evaluations.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm mb-2">Riwayat Evaluasi</h5>
                {selectedSupplier.evaluations.map((ev) => (
                  <div key={ev.id} className="border border-border/40 rounded-lg p-3 mb-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{ev.projectName}</span>
                      <RatingStars rating={ev.overall} />
                    </div>
                    <p className="text-xs text-secondary">{ev.notes}</p>
                    <p className="text-[10px] text-secondary mt-1">{ev.evaluator} · {ev.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Evaluation Form Modal (placeholder) */}
      <Modal
        isOpen={showEvalForm}
        onClose={() => setShowEvalForm(false)}
        title="Tambah Evaluasi"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEvalForm(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm">Simpan</Button>
          </div>
        }
      >
        <p className="text-sm text-secondary">Form evaluasi akan ditambahkan di sini.</p>
      </Modal>
    </div>
  );
}
