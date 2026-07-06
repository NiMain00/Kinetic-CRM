import React, { useState, useMemo } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { useRfqStore, generateRfqNumber } from '@/stores/rfqStore';
import { useSupplierStore } from '@/stores/supplierStore';
import type { Procurement } from '@/types/domain/procurement';
import type { Rfq, RfqQuote, RfqItem } from '@/types/domain/procurement';

interface Props {
  procurement: Procurement;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const RFQ_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'danger' }> = {
  draft: { label: 'Draft', variant: 'default' },
  sent: { label: 'Sent', variant: 'info' },
  evaluating: { label: 'Evaluating', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

export default function RfqTab({ procurement, onShowNotification }: Props) {
  const entities = useRfqStore((s) => s.entities);
  const addRfq = useRfqStore((s) => s.addRfq);
  const updateRfq = useRfqStore((s) => s.updateRfq);
  const addQuote = useRfqStore((s) => s.addQuote);
  const selectQuote = useRfqStore((s) => s.selectQuote);
  const submitRfq = useRfqStore((s) => s.submitRfq);
  const deleteRfq = useRfqStore((s) => s.deleteRfq);
  const suppliers = useSupplierStore((s) => s.suppliers);

  const rfqs = Object.values(entities).filter((r) => r.procurementId === procurement.id);
  const activeSuppliers = suppliers.filter((s) => s.status === 'active');

  const [showForm, setShowForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState<string | null>(null);
  const [expandedRfq, setExpandedRfq] = useState<string | null>(null);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formItems, setFormItems] = useState<RfqItem[]>([]);
  const [formSuppliers, setFormSuppliers] = useState<string[]>([]);

  const handleAddRfq = () => {
    if (!formTitle.trim()) return;
    const rfq: Rfq = {
      id: `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      procurementId: procurement.id,
      number: generateRfqNumber(rfqs.length + 1),
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      deadline: formDeadline,
      status: 'draft',
      items: formItems,
      suppliers: formSuppliers,
      quotes: [],
      documents: [],
      createdAt: new Date().toISOString(),
      createdBy: 'User',
    };
    addRfq(rfq);
    setFormTitle('');
    setFormDesc('');
    setFormDeadline('');
    setFormItems([]);
    setFormSuppliers([]);
    setShowForm(false);
    onShowNotification('RFQ berhasil dibuat.', 'success');
  };

  const addFormItem = () => {
    setFormItems([...formItems, { id: `item-${Date.now()}`, name: '', quantity: 1, unit: 'pcs' }]);
  };

  const updateFormItem = (idx: number, data: Partial<RfqItem>) => {
    setFormItems(formItems.map((item, i) => i === idx ? { ...item, ...data } : item));
  };

  const removeFormItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const toggleSupplier = (id: string) => {
    setFormSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleAddQuote = (rfqId: string) => {
    const rfq = entities[rfqId];
    if (!rfq) return;
    const selectedSuppliers = rfq.suppliers;

    selectedSuppliers.forEach((supplierId) => {
      if (rfq.quotes.some((q) => q.supplierId === supplierId)) return;
      const supplier = suppliers.find((s) => s.id === supplierId);
      if (!supplier) return;

      const quoteItems = rfq.items.map((item) => ({
        itemId: item.id,
        unitPrice: 0,
        totalPrice: 0,
        deliveryTime: '14 hari',
      }));

      const quote: RfqQuote = {
        id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: quoteItems,
        totalAmount: 0,
        deliveryTime: '14 hari kerja',
        validityPeriod: '30 hari',
        terms: '',
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };
      addQuote(rfqId, quote);
    });

    submitRfq(rfqId);
    setSelectedRfqForQuote(null);
    onShowNotification('Quote request dikirim ke supplier.', 'success');
  };

  const getRfqStatusBadge = (status: string) => {
    const cfg = RFQ_STATUS_CONFIG[status] || { label: status, variant: 'default' as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const formatCurrency = (val: number) =>
    `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-on-surface">RFQ Management</h3>
          <p className="text-sm text-secondary">{rfqs.length} RFQ</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(true)}
          leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
        >
          Buat RFQ
        </Button>
      </div>

      {rfqs.length === 0 ? (
        <div className="text-center py-12 text-secondary bg-surface rounded-xl border border-border/60">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">request_quote</span>
          <p className="font-semibold text-on-surface">Belum ada RFQ</p>
          <p className="text-sm">Buat RFQ untuk memulai perbandingan harga supplier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rfqs.map((rfq) => {
            const isExpanded = expandedRfq === rfq.id;
            return (
              <div key={rfq.id} className="bg-surface rounded-xl border border-border/60 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => setExpandedRfq(isExpanded ? null : rfq.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">description</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-on-surface">{rfq.number}</span>
                        {getRfqStatusBadge(rfq.status)}
                      </div>
                      <p className="text-xs text-secondary">{rfq.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-secondary">{rfq.items.length} item</span>
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/40 p-4 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-secondary">
                      <span>Deadline: {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('id-ID') : '-'}</span>
                      <span>Supplier: {rfq.suppliers.length}</span>
                      <span>Quotes: {rfq.quotes.length}</span>
                    </div>

                    {rfq.description && (
                      <p className="text-sm text-secondary">{rfq.description}</p>
                    )}

                    {/* Items */}
                    <div>
                      <h5 className="text-xs font-semibold text-secondary mb-2">Items</h5>
                      <div className="border border-border/40 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-container-low">
                            <tr>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold text-secondary">Item</th>
                              <th className="px-3 py-2 text-right text-[10px] font-semibold text-secondary">Qty</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold text-secondary">Unit</th>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold text-secondary">Spec</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {rfq.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-xs">{item.name || '-'}</td>
                                <td className="px-3 py-2 text-xs text-right">{item.quantity}</td>
                                <td className="px-3 py-2 text-xs">{item.unit}</td>
                                <td className="px-3 py-2 text-xs">{item.specifications || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quotes Comparison */}
                    {rfq.quotes.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-secondary mb-2">
                          Perbandingan Quote
                          {rfq.selectedQuoteId && (
                            <span className="ml-2 text-success">(Quote terpilih)</span>
                          )}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {rfq.quotes.map((quote) => (
                            <div
                              key={quote.id}
                              className={`rounded-xl border p-3 ${
                                quote.id === rfq.selectedQuoteId
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : quote.status === 'rejected'
                                    ? 'border-red-200 bg-red-50 opacity-60'
                                    : 'border-border/60 bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm">{quote.supplierName}</span>
                                {quote.id === rfq.selectedQuoteId && (
                                  <Badge variant="success">Selected</Badge>
                                )}
                              </div>
                              <div className="text-xs space-y-1 text-secondary">
                                <div className="flex justify-between">
                                  <span>Total:</span>
                                  <span className="font-semibold text-on-surface">
                                    {quote.totalAmount > 0 ? formatCurrency(quote.totalAmount) : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span>{quote.deliveryTime}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <span>{quote.status}</span>
                                </div>
                              </div>

                              {rfq.status !== 'completed' && (
                                <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                                  <input
                                    type="number"
                                    placeholder="Total"
                                    className="flex-1 px-2 py-1 text-xs border border-border rounded-lg bg-surface outline-none"
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const updatedQuotes = rfq.quotes.map((q) =>
                                        q.id === quote.id ? { ...q, totalAmount: val } : q,
                                      );
                                      updateRfq(rfq.id, { quotes: updatedQuotes });
                                    }}
                                  />
                                  {!rfq.selectedQuoteId && (
                                    <button
                                      onClick={() => {
                                        selectQuote(rfq.id, quote.id);
                                        onShowNotification(`Quote dari ${quote.supplierName} dipilih.`, 'success');
                                      }}
                                      className="px-2 py-1 text-[10px] font-semibold text-success border border-success rounded-lg hover:bg-success/5 transition-all"
                                    >
                                      Pilih
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      {rfq.status === 'draft' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedRfqForQuote(rfq.id)}
                            leftIcon={<span className="material-symbols-outlined text-[14px]">send</span>}
                          >
                            Kirim ke Supplier
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Hapus RFQ ini?')) {
                                deleteRfq(rfq.id);
                                onShowNotification('RFQ dihapus.', 'success');
                              }
                            }}
                          >
                            Hapus
                          </Button>
                        </>
                      )}
                      {rfq.status === 'sent' && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => updateRfq(rfq.id, { status: 'evaluating' })}
                        >
                          Mulai Evaluasi
                        </Button>
                      )}
                    </div>

                    {/* Simulate Quote Input Dialog */}
                    {selectedRfqForQuote === rfq.id && (
                      <div className="bg-surface-container-low rounded-xl border border-border/60 p-4 space-y-3">
                        <h5 className="font-semibold text-sm">Pilih Supplier untuk Request Quote</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                          {activeSuppliers
                            .filter((s) => rfq.suppliers.includes(s.id))
                            .map((supplier) => {
                              const alreadyQuoted = rfq.quotes.some((q) => q.supplierId === supplier.id);
                              return (
                                <div
                                  key={supplier.id}
                                  className={`p-2 rounded-lg border text-sm ${
                                    alreadyQuoted
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'border-border/60 bg-surface hover:border-primary cursor-pointer'
                                  }`}
                                  onClick={() => {
                                    if (!alreadyQuoted) {
                                      const quoteItems = rfq.items.map((item) => ({
                                        itemId: item.id,
                                        unitPrice: 0,
                                        totalPrice: 0,
                                        deliveryTime: '14 hari',
                                      }));
                                      const quote: RfqQuote = {
                                        id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
                                        supplierId: supplier.id,
                                        supplierName: supplier.name,
                                        items: quoteItems,
                                        totalAmount: 0,
                                        deliveryTime: '14 hari kerja',
                                        validityPeriod: '30 hari',
                                        terms: '',
                                        submittedAt: new Date().toISOString(),
                                        status: 'pending',
                                      };
                                      addQuote(rfq.id, quote);
                                      onShowNotification(`Quote dari ${supplier.name} ditambahkan.`, 'success');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-xs">{supplier.name}</span>
                                    {alreadyQuoted && (
                                      <span className="material-symbols-outlined text-[14px] text-emerald-500">check</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-secondary">{supplier.city}</span>
                                </div>
                              );
                            })}
                        </div>
                        <div className="flex justify-end">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setSelectedRfqForQuote(null);
                            submitRfq(rfq.id);
                            onShowNotification('RFQ telah dikirim.', 'success');
                          }}>
                            Selesai & Kirim RFQ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create RFQ Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Buat RFQ Baru"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleAddRfq}>Buat RFQ</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Judul RFQ</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nama RFQ..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Deskripsi</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none resize-none"
              rows={2}
              placeholder="Deskripsi..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Deadline</label>
            <input
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-secondary">Items</label>
              <button
                onClick={addFormItem}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Tambah Item
              </button>
            </div>
            {formItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateFormItem(idx, { name: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs bg-surface outline-none"
                  placeholder="Nama item"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateFormItem(idx, { quantity: Number(e.target.value) })}
                  className="w-16 px-2 py-1.5 border border-border rounded-lg text-xs bg-surface outline-none text-right"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateFormItem(idx, { unit: e.target.value })}
                  className="w-20 px-2 py-1.5 border border-border rounded-lg text-xs bg-surface outline-none"
                >
                  <option value="pcs">pcs</option>
                  <option value="unit">unit</option>
                  <option value="set">set</option>
                  <option value="meter">meter</option>
                  <option value="kg">kg</option>
                  <option value="hari">hari</option>
                  <option value="bulan">bulan</option>
                </select>
                <button
                  onClick={() => removeFormItem(idx)}
                  className="p-1.5 text-outline hover:text-danger transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                </button>
              </div>
            ))}
          </div>

          {/* Suppliers */}
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Supplier Tujuan</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-[150px] overflow-y-auto">
              {activeSuppliers.map((supplier) => (
                <label
                  key={supplier.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/40 text-sm cursor-pointer hover:bg-surface-container-low"
                >
                  <input
                    type="checkbox"
                    checked={formSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                    className="w-4 h-4 rounded border-border text-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{supplier.name}</span>
                    <span className="text-[10px] text-secondary ml-2">{supplier.city}</span>
                  </div>
                  <span className="text-[10px] text-secondary">
                    Rating: {supplier.rating}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
