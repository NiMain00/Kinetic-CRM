import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useInputConfigStore } from '@/stores/inputConfigStore';
import { useInputConfigMutations } from '@/hooks/useInputConfig';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { InputConfigGroup, InputOption, InputConfigCategory, InputConfigGroupKey } from '@/types/input-config';

const CATEGORY_TABS: { key: InputConfigCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'form', label: 'Form' },
  { key: 'filter', label: 'Filter' },
  { key: 'sla', label: 'SLA' },
  { key: 'workflow', label: 'Workflow' },
];

interface DrawerState {
  open: boolean;
  groupKey: InputConfigGroupKey | null;
  editingOption: InputOption | null;
  formValue: string;
  formLabel: string;
  formOrder: string;
  formColor: string;
}

const EMPTY_DRAWER: DrawerState = {
  open: false,
  groupKey: null,
  editingOption: null,
  formValue: '',
  formLabel: '',
  formOrder: '1',
  formColor: '',
};

export default function ConfigInputPage() {
  const groups = useInputConfigStore((s) => s.groups);
  const getGroup = useInputConfigStore((s) => s.getGroup);
  const fetchGroups = useInputConfigStore((s) => s.fetchGroups);
  const { addOption, updateOption, deleteOption, toggleOption } = useInputConfigMutations();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const [activeCategory, setActiveCategory] = useState<InputConfigCategory | 'all'>('all');
  const [drawer, setDrawer] = useState<DrawerState>(EMPTY_DRAWER);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (activeCategory !== 'all') {
      result = result.filter((g) => g.category === activeCategory);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.options.some((o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, activeCategory, debouncedSearch]);

  const totalOptions = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.length, 0),
    [groups],
  );
  const activeCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.filter((o) => o.is_active).length, 0),
    [groups],
  );

  const handleOpenAdd = (groupKey: InputConfigGroupKey) => {
    setDrawer({
      open: true,
      groupKey,
      editingOption: null,
      formValue: '',
      formLabel: '',
      formOrder: String((getGroup(groupKey)?.options.length || 0) + 1),
      formColor: '',
    });
  };

  const handleOpenEdit = (groupKey: InputConfigGroupKey, option: InputOption) => {
    setDrawer({
      open: true,
      groupKey,
      editingOption: option,
      formValue: option.value,
      formLabel: option.label,
      formOrder: String(option.sort_order),
      formColor: option.color_hex || '',
    });
  };

  const handleCloseDrawer = () => {
    setDrawer(EMPTY_DRAWER);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawer.groupKey) return;
    if (!drawer.formValue || !drawer.formLabel) {
      toast.error('Value dan label wajib diisi.');
      return;
    }

    try {
      if (drawer.editingOption) {
        await updateOption(drawer.groupKey, drawer.editingOption.value, {
          value: drawer.formValue,
          label: drawer.formLabel,
          sort_order: Number(drawer.formOrder) || 1,
          color_hex: drawer.formColor || undefined,
        });
        toast.success(`Opsi "${drawer.formLabel}" berhasil diperbarui.`);
      } else {
        const group = getGroup(drawer.groupKey);
        if (group && group.options.some((o) => o.value === drawer.formValue)) {
          toast.error(`Value "${drawer.formValue}" sudah ada di grup ini.`);
          return;
        }
        await addOption(drawer.groupKey, {
          value: drawer.formValue,
          label: drawer.formLabel,
          sort_order: Number(drawer.formOrder) || 1,
          is_active: true,
          color_hex: drawer.formColor || undefined,
        });
        toast.success(`Opsi "${drawer.formLabel}" berhasil ditambahkan.`);
      }
      handleCloseDrawer();
    } catch {
      toast.error('Gagal menyimpan opsi. Silakan coba lagi.');
    }
  };

  const handleDeleteOption = async (groupKey: InputConfigGroupKey, option: InputOption) => {
    if (!window.confirm(`Hapus opsi "${option.label}" (${option.value})?`)) return;
    try {
      await deleteOption(groupKey, option.value);
      toast.success(`Opsi "${option.label}" dihapus.`);
    } catch {
      toast.error('Gagal menghapus opsi. Silakan coba lagi.');
    }
  };

  const handleToggleOption = async (groupKey: InputConfigGroupKey, value: string) => {
    try {
      await toggleOption(groupKey, value);
      const group = getGroup(groupKey);
      const option = group?.options.find((o) => o.value === value);
      toast.success(
        `Opsi "${option?.label || value}" sekarang ${option?.is_active ? 'NON-AKTIF' : 'AKTIF'}.`,
      );
    } catch {
      toast.error('Gagal mengubah status opsi. Silakan coba lagi.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 shadow-sm z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Input</h2>
            <p className="text-[11px] text-outline mt-0.5">
              Kelola opsi dropdown, select, dan filter tabs yang dapat dikonfigurasi.
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Grup</span>
            <span className="ml-2 font-bold text-sm text-on-surface">{groups.length}</span>
          </div>
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Total Opsi</span>
            <span className="ml-2 font-bold text-sm text-on-surface">{totalOptions}</span>
          </div>
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Aktif</span>
            <span className="ml-2 font-bold text-sm text-success">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Category Tabs + Search */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-1 flex-wrap">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === tab.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari grup atau opsi..."
              className="w-full sm:w-56 px-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-lowest"
            />
          </div>

          {/* Groups */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">
              Tidak ada grup yang ditemukan.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <GroupAccordion
                key={group.id}
                group={group}
                onAdd={() => handleOpenAdd(group.key as InputConfigGroupKey)}
                onEdit={(opt) => handleOpenEdit(group.key as InputConfigGroupKey, opt)}
                onDelete={(opt) => handleDeleteOption(group.key as InputConfigGroupKey, opt)}
                onToggle={(opt) => handleToggleOption(group.key as InputConfigGroupKey, opt.value)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Drawer */}
      {drawer.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">
                  {drawer.editingOption ? 'Edit Opsi' : 'Tambah Opsi Baru'}
                </h3>
                <p className="text-[10px] text-outline mt-1">
                  Grup: {drawer.groupKey && (getGroup(drawer.groupKey)?.name || drawer.groupKey)}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveOption} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Value *</label>
                <input
                  type="text"
                  value={drawer.formValue}
                  onChange={(e) => setDrawer({ ...drawer, formValue: e.target.value })}
                  className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs bg-surface-container-lowest"
                  placeholder="Contoh: swasta"
                  required
                  disabled={!!drawer.editingOption}
                />
                <p className="text-[10px] text-outline italic">Identifier unik. Tidak bisa diubah setelah dibuat.</p>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Label *</label>
                <input
                  type="text"
                  value={drawer.formLabel}
                  onChange={(e) => setDrawer({ ...drawer, formLabel: e.target.value })}
                  className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs bg-surface-container-lowest"
                  placeholder="Contoh: Swasta"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Urutan</label>
                  <input
                    type="number"
                    value={drawer.formOrder}
                    onChange={(e) => setDrawer({ ...drawer, formOrder: e.target.value })}
                    className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs bg-surface-container-lowest"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Warna (opsional)</label>
                  <input
                    type="color"
                    value={drawer.formColor || '#000000'}
                    onChange={(e) => setDrawer({ ...drawer, formColor: e.target.value })}
                    className="w-full h-[38px] rounded-lg border border-border p-1 bg-surface-container-lowest cursor-pointer"
                  />
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOption}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer"
              >
                {drawer.editingOption ? 'Simpan Perubahan' : 'Tambah Opsi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Group Accordion ──

function GroupAccordion({
  group,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  group: InputConfigGroup;
  onAdd: () => void;
  onEdit: (option: InputOption) => void;
  onDelete: (option: InputOption) => void;
  onToggle: (option: InputOption) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const activeCount = group.options.filter((o) => o.is_active).length;

  return (
    <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline text-lg">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          <div>
            <h3 className="font-semibold text-sm text-on-surface">{group.name}</h3>
            <p className="text-[10px] text-outline">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded-full font-semibold">
            {activeCount}/{group.options.length} aktif
          </span>
          {group.is_system && (
            <span className="text-[9px] text-outline bg-surface-container px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
              System
            </span>
          )}
        </div>
      </button>

      {/* Options List */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {[...group.options]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((opt) => (
              <div key={opt.value} className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-3">
                  {opt.color_hex && (
                    <div
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: opt.color_hex }}
                    />
                  )}
                  <div>
                    <span className="text-xs font-medium text-on-surface">{opt.label}</span>
                    <span className="text-[9px] text-outline ml-2 font-mono">({opt.value})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle active/inactive */}
                  <button
                    onClick={() => onToggle(opt)}
                    className={`inline-flex items-center justify-center p-0.5 rounded-full w-8 h-4 transition-colors outline-none cursor-pointer ${
                      opt.is_active ? 'bg-success' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${
                        opt.is_active ? 'translate-x-1.5' : '-translate-x-1.5'
                      }`}
                    />
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => onEdit(opt)}
                    className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => onDelete(opt)}
                    className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-danger transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          {/* Add option button */}
          <div className="px-5 py-3">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tambah Opsi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
