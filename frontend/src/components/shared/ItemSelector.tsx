import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { MasterItem } from '@/types/domain/master-item';
import { useMasterDataStore } from '@/stores/masterDataStore';

interface ItemSelectorProps {
  value: string | null;
  onChange: (item: MasterItem | null) => void;
  filterType?: 'barang' | 'jasa' | 'all';
  placeholder?: string;
  label?: string;
}

export default function ItemSelector({
  value,
  onChange,
  filterType = 'all',
  placeholder = 'Cari barang/jasa...',
  label,
}: ItemSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const allItems = useMasterDataStore((s) => s.items);
  const items = useMemo(
    () =>
      filterType === 'all'
        ? allItems
        : allItems.filter((i) => i.type === filterType),
    [allItems, filterType],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.sku.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const selectedItem = value
    ? items.find((i) => i.id === value) ?? null
    : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative space-y-1" ref={ref}>
      {label && (
        <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider block">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2 border border-outline-variant rounded-lg text-sm bg-surface hover:border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
      >
        {selectedItem ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-on-surface font-medium truncate">
              {selectedItem.name}
            </span>
            <span className="text-outline text-[10px] shrink-0">
              {selectedItem.sku}
            </span>
          </div>
        ) : (
          <span className="text-outline">{placeholder}</span>
        )}
        <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border/60">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau SKU..."
              className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-outline">
                Item tidak ditemukan
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-container transition-colors ${
                    value === item.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'barang' ? 'bg-surface-container-high' : 'bg-primary/10'
                  }`}>
                    <span className="material-symbols-outlined text-sm text-primary">
                      {item.type === 'barang' ? 'inventory_2' : 'build'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-on-surface truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-outline">
                      {item.sku} · Rp {item.basePrice.toLocaleString('id-ID')}/{item.unit}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
