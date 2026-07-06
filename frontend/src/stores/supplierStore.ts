import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Supplier, SupplierEvaluation } from '@/types/domain/procurement';

interface SupplierState {
  entities: Record<string, Supplier>;
  ids: string[];
  suppliers: Supplier[];

  addSupplier: (s: Supplier) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  addEvaluation: (supplierId: string, evaluation: SupplierEvaluation) => void;
}

function deriveSuppliers(
  entities: Record<string, Supplier>,
  ids: string[],
): Supplier[] {
  const arr: Supplier[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'PT. Mitra Teknologi Indonesia',
    code: 'MTI',
    type: 'distributor',
    city: 'Jakarta Selatan',
    phone: '021-12345678',
    email: 'info@mitratek.id',
    picName: 'Andi Wijaya',
    picPosition: 'Sales Director',
    npwp: '01.234.567.8-091.000',
    rating: 4.5,
    totalProjects: 12,
    totalValue: 8500000000,
    onTimeDelivery: 92,
    qualityScore: 88,
    complianceScore: 95,
    status: 'active',
    categories: ['IT Infrastructure', 'Networking', 'Server'],
    certificates: ['ISO 9001:2015', 'ISO 27001:2013'],
    createdAt: '2024-01-15',
    evaluations: [],
  },
  {
    id: 'SUP-002',
    name: 'CV. Kabel Nusantara',
    code: 'CKN',
    type: 'manufacturer',
    city: 'Bandung',
    phone: '022-98765432',
    email: 'sales@kabelnusantara.co.id',
    picName: 'Rina Marlina',
    picPosition: 'Marketing Manager',
    npwp: '02.345.678.9-092.001',
    rating: 3.8,
    totalProjects: 25,
    totalValue: 15000000000,
    onTimeDelivery: 78,
    qualityScore: 82,
    complianceScore: 70,
    status: 'active',
    categories: ['Kabel', 'Listrik', 'Panel'],
    certificates: ['ISO 9001:2015', 'SNI'],
    createdAt: '2023-06-20',
    evaluations: [],
  },
  {
    id: 'SUP-003',
    name: 'Global Security Systems',
    code: 'GSS',
    type: 'agent',
    city: 'Jakarta Pusat',
    phone: '021-55551234',
    email: 'info@globalsecurity.co.id',
    picName: 'Bambang Sutejo',
    picPosition: 'General Manager',
    rating: 4.2,
    totalProjects: 8,
    totalValue: 4200000000,
    onTimeDelivery: 85,
    qualityScore: 90,
    complianceScore: 88,
    status: 'active',
    categories: ['CCTV', 'Security System', 'Access Control'],
    certificates: ['ISO 9001:2015', 'ISO 14001:2015'],
    createdAt: '2024-03-10',
    evaluations: [],
  },
  {
    id: 'SUP-004',
    name: 'PT. Bangun Sarana Perkasa',
    code: 'BSP',
    type: 'contractor',
    city: 'Surabaya',
    phone: '031-77788899',
    email: 'kontraktor@bsp.co.id',
    picName: 'Hendra Gunawan',
    picPosition: 'Project Director',
    npwp: '03.456.789.0-093.002',
    rating: 3.2,
    totalProjects: 18,
    totalValue: 28000000000,
    onTimeDelivery: 65,
    qualityScore: 70,
    complianceScore: 60,
    status: 'blacklisted',
    categories: ['Konstruksi', 'Sipil', 'Infrastruktur'],
    certificates: ['ISO 9001:2015', 'K3'],
    blacklistReason: 'Keterlambatan proyek berulang kali dan kualitas pekerjaan buruk',
    blacklistedAt: '2025-12-01',
    createdAt: '2023-01-05',
    evaluations: [],
  },
];

const { entities: initEntities, ids: initIds } = (() => {
  const entities: Record<string, Supplier> = {};
  const ids: string[] = [];
  INITIAL_SUPPLIERS.forEach((s) => {
    entities[s.id] = s;
    ids.push(s.id);
  });
  return { entities, ids };
})();

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      entities: initEntities,
      ids: initIds,
      suppliers: deriveSuppliers(initEntities, initIds),

      addSupplier: (s) =>
        set((state) => {
          const entities = { ...state.entities, [s.id]: s };
          const ids = [...state.ids, s.id];
          return { entities, ids, suppliers: deriveSuppliers(entities, ids) };
        }),

      updateSupplier: (id, data) =>
        set((state) => {
          const existing = state.entities[id];
          if (!existing) return state;
          const entities = { ...state.entities, [id]: { ...existing, ...data } };
          return { entities, suppliers: deriveSuppliers(entities, state.ids) };
        }),

      deleteSupplier: (id) =>
        set((state) => {
          const entities = { ...state.entities };
          delete entities[id];
          const ids = state.ids.filter((i) => i !== id);
          return { entities, ids, suppliers: deriveSuppliers(entities, ids) };
        }),

      getSupplierById: (id) => get().entities[id],

      addEvaluation: (supplierId, evaluation) =>
        set((state) => {
          const existing = state.entities[supplierId];
          if (!existing) return state;
          const evaluations = [...existing.evaluations, evaluation];
          const totalEvals = evaluations.length;
          const overall = evaluations.reduce((sum, e) => sum + e.overall, 0) / totalEvals;
          const entities = {
            ...state.entities,
            [supplierId]: {
              ...existing,
              evaluations,
              rating: Math.round(overall * 10) / 10,
            },
          };
          return { entities, suppliers: deriveSuppliers(entities, state.ids) };
        }),
    }),
    {
      name: 'kinetic-suppliers',
      version: 1,
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);
