/**
 * Master data item — disimpan di masterDataStore.
 * Ini adalah katalog barang/jasa yang bisa dipilih saat
 * membuat deal line item, project requirement, atau procurement item.
 */

export interface MasterItem {
  id: string;
  sku: string;
  name: string;
  type: 'barang' | 'jasa';
  unit: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  description: string;
  is_active: boolean;
}
