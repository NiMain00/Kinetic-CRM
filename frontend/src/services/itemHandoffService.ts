/**
 * Item Handoff Service — Pure functions untuk transformasi data antar modul.
 *
 * TIDAK mengakses store langsung. Hanya transform data (pure function).
 * Panggil dari komponen/hook, lalu hasilnya di-set ke store tujuan via getState().
 */
import type {
  DealLineItem,
  ProjectRequirementItem,
  ProcurementItem,
  ProcurementAllocation,
  ProcurementStatus,
} from '@/types/domain/item';

// ─── DEAL → PROJECT ─────────────────────────────────────────────────

/**
 * Konversi deal line items menjadi project requirement items (BOM).
 * Dipanggil saat deal berstatus won → create project.
 */
export function convertDealLinesToRequirements(
  dealId: string,
  projectId: string,
  lines: DealLineItem[],
): ProjectRequirementItem[] {
  return lines.map((line) => ({
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    item: { ...line.item },
    quantityRequired: line.quantity,
    quantityUsed: 0,
    quantityProcured: 0,
    sourceDealLineId: line.id,
    procurementStatus: 'none' as ProcurementStatus,
    price: { ...line.price },
  }));
}

// ─── PROJECT → PROCUREMENT ──────────────────────────────────────────

/**
 * Buat procurement items dari selected project requirements.
 * allocation menentukan berapa banyak dari tiap requirement yang diajukan.
 */
export function createProcurementItemsFromRequirements(
  procurementId: string,
  allocations: { requirementId: string; quantity: number }[],
  requirements: ProjectRequirementItem[],
): ProcurementItem[] {
  return allocations.map((alloc) => {
    const req = requirements.find((r) => r.id === alloc.requirementId);
    if (!req) throw new Error(`Requirement not found: ${alloc.requirementId}`);

    const totalPrice = alloc.quantity * req.price.basePrice;

    return {
      id: `pritem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      procurementId,
      item: { ...req.item },
      quantity: alloc.quantity,
      quantityReceived: 0,
      unitPrice: req.price.basePrice,
      totalPrice,
      status: 'pending',
      allocations: [
        {
          projectId: req.projectId,
          projectRequirementId: req.id,
          quantity: alloc.quantity,
        },
      ],
    };
  });
}

/**
 * Gabungkan beberapa allocation dari project berbeda untuk SKU yang sama
 * menjadi satu procurement item (konsolidasi).
 */
export function consolidateProcurementItems(
  procurementId: string,
  groups: {
    sku: string;
    item: { id: string; sku: string; name: string; type: 'barang' | 'jasa'; unit: string; categoryId: string; categoryName: string };
    unitPrice: number;
    allocations: ProcurementAllocation[];
  }[],
): ProcurementItem[] {
  return groups.map((group) => {
    const totalQty = group.allocations.reduce((sum, a) => sum + a.quantity, 0);
    return {
      id: `pritem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      procurementId,
      item: { ...group.item },
      quantity: totalQty,
      quantityReceived: 0,
      unitPrice: group.unitPrice,
      totalPrice: totalQty * group.unitPrice,
      status: 'pending',
      allocations: group.allocations,
    };
  });
}

// ─── PROCUREMENT RECEIVED → UPDATE REQUIREMENT ──────────────────────

/**
 * Hitung status baru requirement setelah barang diterima.
 * Return nilai baru untuk di-set ke store.
 */
export function calculateRequirementUsageAfterReceival(
  requirement: ProjectRequirementItem,
  receivedQty: number,
): {
  newQuantityProcured: number;
  newProcurementStatus: ProcurementStatus;
} {
  const newProcured = requirement.quantityProcured + receivedQty;
  const newStatus: ProcurementStatus =
    newProcured >= requirement.quantityRequired
      ? 'received'
      : newProcured > 0
        ? 'partial'
        : 'none';

  return {
    newQuantityProcured: newProcured,
    newProcurementStatus: newStatus,
  };
}

// ─── COMPUTED HELPERS ───────────────────────────────────────────────

/** Hitung sisa yang belum diajukan */
export function getQuantityPending(req: ProjectRequirementItem): number {
  return Math.max(0, req.quantityRequired - req.quantityProcured);
}

/** Hitung persentase pengajuan */
export function getProcurementProgress(req: ProjectRequirementItem): number {
  if (req.quantityRequired === 0) return 100;
  return Math.round((req.quantityProcured / req.quantityRequired) * 100);
}

/** Filter requirements yang bisa diajukan ke procurement */
export function getProcurableRequirements(
  requirements: ProjectRequirementItem[],
): ProjectRequirementItem[] {
  return requirements.filter((r) => getQuantityPending(r) > 0);
}

/** Group procurement items by SKU untuk konsolidasi */
export function groupItemsBySku(
  items: { item: { sku: string; name: string }; allocations: ProcurementAllocation[] }[],
): Map<string, { sku: string; name: string; totalQty: number; allocations: ProcurementAllocation[] }> {
  const groups = new Map<string, { sku: string; name: string; totalQty: number; allocations: ProcurementAllocation[] }>();

  for (const item of items) {
    const existing = groups.get(item.item.sku);
    if (existing) {
      existing.totalQty += item.allocations.reduce((s, a) => s + a.quantity, 0);
      existing.allocations.push(...item.allocations);
    } else {
      groups.set(item.item.sku, {
        sku: item.item.sku,
        name: item.item.name,
        totalQty: item.allocations.reduce((s, a) => s + a.quantity, 0),
        allocations: [...item.allocations],
      });
    }
  }

  return groups;
}
