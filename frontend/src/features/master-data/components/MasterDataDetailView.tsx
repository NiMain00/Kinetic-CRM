import React, { useState, useMemo } from 'react';
import DataTable from '@/components/shared/DataTable';
import { Modal, Button } from '@/components/ui';
import { useMasterDataStore } from '@/stores/masterDataStore';
import type { MasterDataEntry } from './masterDataConfig';

interface DropdownOption {
  label: string;
  value: string;
}

function getDropdownOptions(entityId: string, fieldName: string): DropdownOption[] | null {
  const store = useMasterDataStore.getState();

  if (entityId === 'users') {
    if (fieldName === 'role') {
      return store.roles.map((r) => ({ label: r.name, value: r.name }));
    }
    if (fieldName === 'branch') {
      return store.departments
        .filter((d) => d.status)
        .map((d) => ({ label: d.name, value: d.name }));
    }
  }

  if (entityId === 'customers') {
    if (fieldName === 'type') {
      return [
        { label: 'Swasta', value: 'swasta' },
        { label: 'BUMN', value: 'bumn' },
        { label: 'Pemerintah', value: 'pemerintah' },
        { label: 'Asing', value: 'asing' },
      ];
    }
    if (fieldName === 'industry_id') {
      return store.industries.map((i) => ({ label: i.name, value: i.id }));
    }
  }

  if (entityId === 'competitors' && fieldName === 'industry_id') {
    return store.industries.map((i) => ({ label: i.name, value: i.id }));
  }

  if (entityId === 'periods' && fieldName === 'type') {
    return [
      { label: 'Monthly', value: 'monthly' },
      { label: 'Quarterly', value: 'quarterly' },
      { label: 'Semester', value: 'semester' },
      { label: 'Annual', value: 'annual' },
    ];
  }

  if (entityId === 'holidays' && fieldName === 'type') {
    return [
      { label: 'National', value: 'national' },
      { label: 'Regional', value: 'regional' },
    ];
  }

  return null;
}

interface DetailViewProps {
  config: MasterDataEntry;
  data: Record<string, unknown>[];
}

export default function MasterDataDetailView({ config, data }: DetailViewProps) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);

  const isUsers = config.id === 'users';

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const sample = data[0];
    const dataColumns = Object.keys(sample)
      .filter((key) => !['id', 'roleColor', 'avatarColor', 'actionColor', 'userInitials'].includes(key))
      .slice(0, 8)
      .map((key) => ({
        key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sortable: typeof sample[key] !== 'object',
        render: (row: Record<string, unknown>) => {
          const val = row[key];
          if (val === null || val === undefined) return <span className="text-outline/40">-</span>;
          if (typeof val === 'boolean') {
            return (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${val ? 'text-success' : 'text-outline'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-success' : 'bg-outline'}`} />
                {val ? 'Aktif' : 'Nonaktif'}
              </span>
            );
          }
          if (typeof val === 'object') {
            return <span className="text-outline text-[10px]">{JSON.stringify(val).slice(0, 40)}</span>;
          }
          const str = String(val);
          if (str.startsWith('#') && str.length === 7) {
            return (
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded border" style={{ backgroundColor: str }} />
                <span className="text-[10px] font-mono text-outline">{str}</span>
              </span>
            );
          }
          return <span className="text-on-surface text-xs">{str}</span>;
        },
      }));

    // Add edit action column for users
    if (isUsers) {
      (dataColumns as any[]).push({
        key: '_actions',
        header: '',
        sortable: false,
        className: 'w-[50px]',
        render: (row: Record<string, unknown>) => (
          <button
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditItem(row); }}
            className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit pengguna"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        ),
      });
    }

    return dataColumns;
  }, [data, isUsers]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div className="bg-surface-container-lowest border border-border/50 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-60">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Cari data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-surface-container-low border border-border/60 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <span className="text-[11px] text-outline font-medium">{filtered.length} data</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tambah
          </button>
        </div>
      </div>
      <div>
        {columns.length > 0 ? (
          <DataTable
            columns={columns as any}
            data={filtered as any}
            keyExtractor={(row: any) => row.id}
            pageSize={10}
            showPagination
            exportable
            exportFilename={`master-${config.id}`}
          />
        ) : (
          <div className="text-center py-12 text-outline text-xs italic">Tidak ada data untuk ditampilkan.</div>
        )}
      </div>

      <AddDataModal
        config={config}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sample={data[0] as Record<string, unknown> | undefined}
      />

      {isUsers && (
        <EditDataModal
          config={config}
          isOpen={editItem !== null}
          onClose={() => setEditItem(null)}
          item={editItem}
        />
      )}
    </div>
  );
}

function EditDataModal({
  config,
  isOpen,
  onClose,
  item,
}: {
  config: MasterDataEntry;
  isOpen: boolean;
  onClose: () => void;
  item: Record<string, unknown> | null;
}) {
  const updateData = useMasterDataStore((s) => s.updateData);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with new item
  React.useEffect(() => {
    if (isOpen && item) {
      const initial: Record<string, string> = {};
      for (const [key, val] of Object.entries(item)) {
        if (key === 'id' || key === 'roleColor' || key === 'avatarColor' || key === 'userInitials' || key === 'actionColor') continue;
        initial[key] = val === null || val === undefined ? '' : String(val);
      }
      setFormData(initial);
      setSaving(false);
    }
  }, [isOpen, item]);

  const fields = useMemo(() => {
    if (!item) return [];
    return Object.keys(item).filter(
      (key) => key !== 'id' && key !== 'roleColor' && key !== 'avatarColor' && key !== 'userInitials' && key !== 'actionColor'
    );
  }, [item]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!item?.id) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const field of fields) {
        const val = formData[field] ?? '';
        const sampleVal = item[field];
        if (typeof sampleVal === 'boolean') {
          updates[field] = val === 'true' || val === '1' || val === 'yes';
        } else if (typeof sampleVal === 'number') {
          updates[field] = Number(val) || 0;
        } else if (Array.isArray(sampleVal)) {
          updates[field] = val ? val.split(',').map((s) => s.trim()) : [];
        } else {
          updates[field] = val;
        }
      }
      updateData(config.storeKey as any, String(item.id), updates);
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const isValid = fields.every((f) => {
    const sampleVal = item?.[f];
    return typeof sampleVal === 'boolean' || typeof sampleVal === 'object' || (formData[f] || '').trim() !== '';
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${config.name}`} size="md">
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {fields.length === 0 ? (
          <p className="text-sm text-secondary text-center py-4">Tidak ada field yang bisa diedit.</p>
        ) : (
          fields.map((field) => {
            const sampleVal = item?.[field];
            const isBool = typeof sampleVal === 'boolean';
            const isArray = Array.isArray(sampleVal);
            const dropdownOptions = getDropdownOptions(config.id, field);
            const isOptional = isBool || isArray || typeof sampleVal === 'object';
            return (
              <div key={field}>
                <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
                  {field === 'industry_id' ? 'Industry' : field.replace(/_/g, ' ')}
                  {!isOptional && <span className="text-danger ml-1">*</span>}
                </label>
                {dropdownOptions ? (
                  <select
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  >
                    <option value="">Pilih {field.replace(/_/g, ' ')}...</option>
                    {dropdownOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : isBool ? (
                  <select
                    value={formData[field] || 'false'}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  >
                    <option value="false">Tidak</option>
                    <option value="true">Ya</option>
                  </select>
                ) : isArray ? (
                  <input
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder="Pisahkan dengan koma, misal: a, b, c"
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  />
                ) : (
                  <input
                    type={typeof sampleVal === 'number' ? 'number' : 'text'}
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={`Masukkan ${field.replace(/_/g, ' ')}`}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="md" onClick={onClose}>
          Batal
        </Button>
        <Button variant="primary" size="md" onClick={handleSave} disabled={!isValid || saving || !item} isLoading={saving}>
          Simpan
        </Button>
      </div>
    </Modal>
  );
}

function AddDataModal({
  config,
  isOpen,
  onClose,
  sample,
}: {
  config: MasterDataEntry;
  isOpen: boolean;
  onClose: () => void;
  sample?: Record<string, unknown>;
}) {
  const addData = useMasterDataStore((s) => s.addData);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({});
      setSaving(false);
    }
  }, [isOpen]);

  const fields = useMemo(() => {
    if (!sample) return [];
    return Object.keys(sample).filter(
      (key) => key !== 'id' && key !== 'roleColor' && key !== 'avatarColor' && key !== 'userInitials' && key !== 'actionColor'
    );
  }, [sample]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const newItem: Record<string, unknown> = { id: `${config.id.toUpperCase()}-${Date.now()}` };
      for (const field of fields) {
        const val = formData[field] || '';
        const sampleVal = sample?.[field];
        // Infer type from sample
        if (typeof sampleVal === 'boolean') {
          newItem[field] = val === 'true' || val === '1' || val === 'yes';
        } else if (typeof sampleVal === 'number') {
          newItem[field] = Number(val) || 0;
        } else if (Array.isArray(sampleVal)) {
          newItem[field] = val ? val.split(',').map((s) => s.trim()) : [];
        } else {
          newItem[field] = val;
        }
      }
      addData(config.storeKey as any, newItem);
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const isValid = fields.every((f) => {
    const sampleVal = sample?.[f];
    // Only require non-boolean, non-object fields
    return typeof sampleVal === 'boolean' || typeof sampleVal === 'object' || (formData[f] || '').trim() !== '';
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tambah ${config.name}`} size="md">
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {fields.length === 0 ? (
          <p className="text-sm text-secondary text-center py-4">Tidak ada field yang bisa ditambahkan.</p>
        ) : (
          fields.map((field) => {
            const sampleVal = sample?.[field];
            const isBool = typeof sampleVal === 'boolean';
            const isArray = Array.isArray(sampleVal);
            const dropdownOptions = getDropdownOptions(config.id, field);
            const isOptional = isBool || isArray || typeof sampleVal === 'object';
            return (
              <div key={field}>
                <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
                  {field === 'industry_id' ? 'Industry' : field.replace(/_/g, ' ')}
                  {!isOptional && <span className="text-danger ml-1">*</span>}
                </label>
                {dropdownOptions ? (
                  <select
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  >
                    <option value="">Pilih {field.replace(/_/g, ' ')}...</option>
                    {dropdownOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : isBool ? (
                  <select
                    value={formData[field] || 'false'}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  >
                    <option value="false">Tidak</option>
                    <option value="true">Ya</option>
                  </select>
                ) : isArray ? (
                  <input
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder="Pisahkan dengan koma, misal: a, b, c"
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  />
                ) : (
                  <input
                    type={typeof sampleVal === 'number' ? 'number' : 'text'}
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={`Masukkan ${field.replace(/_/g, ' ')}`}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border/60 rounded-xl text-sm"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="md" onClick={onClose}>
          Batal
        </Button>
        <Button variant="primary" size="md" onClick={handleSave} disabled={!isValid || saving} isLoading={saving}>
          Simpan
        </Button>
      </div>
    </Modal>
  );
}
