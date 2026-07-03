/**
 * Item/Barang/Jasa — data contract konsisten untuk alur:
 *   Prospek (Deal Line Item) → Project (BOM Requirement) → Pengadaan (PR/PO Item)
 *
 * Setiap modul punya varian sendiri dengan field spesifik konteks,
 * tapi semuanya merujuk ke BaseItem yang sama via `sku`.
 */

/** Base identity — immutable, shared across all three modules */
export interface BaseItem {
  id: string;
  sku: string;
  name: string;
  type: 'barang' | 'jasa';
  unit: string; // pcs, unit, hari, bulan, tahun
  categoryId: string;
  categoryName: string;
}

/** Harga — dipisah dari BaseItem karena bisa berbeda tiap konteks */
export interface ItemPrice {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  totalPrice: number;
}

// ─── PROSPEK / DEAL LINE ITEM ────────────────────────────────────────

export interface DealLineItem {
  id: string;
  dealId: string;
  item: BaseItem;
  quantity: number;
  price: ItemPrice;
  notes?: string;
  /** Link ke project requirement — diisi saat deal won → konversi */
  projectRequirementId?: string;
}

// ─── PROJECT BOM / REQUIREMENT ITEM ──────────────────────────────────

export type ProcurementStatus =
  | 'none'
  | 'partial'
  | 'fully_submitted'
  | 'received';

export interface ProjectRequirementItem {
  id: string;
  projectId: string;
  item: BaseItem;
  quantityRequired: number;
  quantityUsed: number;
  quantityProcured: number;
  sourceDealLineId?: string;
  procurementStatus: ProcurementStatus;
  price: ItemPrice;
}

export interface ProjectRequirementItemComputed {
  /** Sisa yang belum diajukan ke procurement */
  quantityPending: number;
}

// ─── PROCUREMENT ITEM (PR/PO LINE) ───────────────────────────────────

export type ProcurementItemStatus =
  | 'pending'
  | 'ordered'
  | 'partial'
  | 'received'
  | 'cancelled';

export interface ProcurementAllocation {
  projectId: string;
  projectRequirementId: string;
  quantity: number;
}

export interface ProcurementItem {
  id: string;
  procurementId: string;
  item: BaseItem;
  quantity: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
  status: ProcurementItemStatus;
  allocations: ProcurementAllocation[];
}
