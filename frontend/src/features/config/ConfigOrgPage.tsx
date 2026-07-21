import React, { useState, useMemo, useEffect } from 'react';
import { useConfigStore } from '@/stores/configStore';
import type { OrgUnit } from '@/types/domain/config';
import { Modal, Button } from '@/components/ui';

interface TreeNode {
  unit: OrgUnit;
  children: TreeNode[];
  depth: number;
}

interface ConfigOrgViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const UNIT_TYPE_ICONS: Record<string, string> = {
  company: 'corporate_fare',
  division: 'account_tree',
  branch: 'location_on',
  department: 'group',
};

const TYPE_OPTIONS: { value: OrgUnit['unitType']; label: string }[] = [
  { value: 'company', label: 'Perusahaan' },
  { value: 'division', label: 'Divisi' },
  { value: 'branch', label: 'Cabang' },
  { value: 'department', label: 'Departemen' },
];

const TYPE_COLORS: Record<string, string> = {
  company: 'text-primary',
  division: 'text-status-purple',
  branch: 'text-primary',
  department: 'text-secondary',
};

export default function ConfigOrgView({ onShowNotification }: ConfigOrgViewProps) {
  const orgUnits = useConfigStore((s) => s.orgUnits);
  const addConfigData = useConfigStore((s) => s.addConfigData);
  const updateConfigData = useConfigStore((s) => s.updateConfigData);
  const deleteConfigData = useConfigStore((s) => s.deleteConfigData);
  const fetchOrgUnits = useConfigStore((s) => s.fetchOrgUnits);

  useEffect(() => {
    fetchOrgUnits();
  }, [fetchOrgUnits]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addProvince, setAddProvince] = useState('');
  const [addType, setAddType] = useState<OrgUnit['unitType']>('branch');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-select first unit on load
  const sortedUnits = useMemo(() =>
    [...orgUnits].sort((a, b) => a.sortOrder - b.sortOrder),
    [orgUnits],
  );

  const selectedUnit = useMemo(
    () => orgUnits.find((u) => u.id === selectedId) || sortedUnits[0],
    [orgUnits, selectedId, sortedUnits],
  );

  // Sync form when selectedUnit changes
  useEffect(() => {
    if (selectedUnit) {
      setFormName(selectedUnit.name);
      setFormCode(selectedUnit.code);
      setFormCity(selectedUnit.city || '');
      setFormProvince(selectedUnit.province || '');
      setFormActive(selectedUnit.isActive);
    }
  }, [selectedUnit?.id]);

  // Build tree from flat list
  const tree = useMemo(() => {
    const buildTree = (parentId: string | null, depth = 0): TreeNode[] => {
      return orgUnits
        .filter((u) => u.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((u) => ({
          unit: u,
          children: buildTree(u.id, depth + 1),
          depth,
        }));
    };
    return buildTree(null);
  }, [orgUnits]);

  // Select a unit and populate form
  const handleSelectUnit = (unit: OrgUnit) => {
    setSelectedId(unit.id);
    setFormName(unit.name);
    setFormCode(unit.code);
    setFormCity(unit.city || '');
    setFormProvince(unit.province || '');
    setFormActive(unit.isActive);
  };

  const handleSaveChanges = async () => {
    if (!selectedUnit) return;
    try {
      await updateConfigData('orgUnits', selectedUnit.id, {
        name: formName,
        code: formCode,
        city: formCity || undefined,
        province: formProvince || undefined,
        isActive: formActive,
      });
      onShowNotification(`Konfigurasi unit ${formName} berhasil disimpan!`, 'success');
    } catch {
      onShowNotification('Gagal menyimpan unit. Silakan coba lagi.', 'error');
    }
  };

  const handleAddUnit = async () => {
    if (!addName || !addCode) {
      onShowNotification('Nama dan kode unit wajib diisi.', 'error');
      return;
    }
    const maxSort = orgUnits
      .filter((u) => u.parentId === addParentId)
      .reduce((max, u) => Math.max(max, u.sortOrder), 0);
    const newUnit: OrgUnit = {
      id: crypto.randomUUID?.() || `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: addName,
      code: addCode.toUpperCase().replace(/\s+/g, '_'),
      parentId: addParentId,
      unitType: addType,
      isActive: true,
      sortOrder: maxSort + 10,
      city: addCity || undefined,
      province: addProvince || undefined,
    };
    try {
      await addConfigData('orgUnits', newUnit);
      setAddModalOpen(false);
      onShowNotification(`Unit ${addName} berhasil ditambahkan!`, 'success');
    } catch {
      onShowNotification('Gagal menambahkan unit. Silakan coba lagi.', 'error');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteConfirmId) return;
    // Cek apakah unit memiliki anak
    const hasChildren = orgUnits.some((u) => u.parentId === deleteConfirmId);
    if (hasChildren) {
      onShowNotification('Tidak dapat menghapus unit yang masih memiliki sub-unit. Hapus sub-unit terlebih dahulu.', 'error');
      setDeleteConfirmId(null);
      return;
    }
    try {
      await deleteConfigData('orgUnits', deleteConfirmId);
      setDeleteConfirmId(null);
      setSelectedId('');
      onShowNotification('Unit berhasil dihapus.', 'success');
    } catch {
      onShowNotification('Gagal menghapus unit. Silakan coba lagi.', 'error');
    }
  };

  const renderTreeNode = (
    nodes: TreeNode[],
  ): React.ReactNode => {
    return nodes.map(({ unit, children, depth }) => (
      <div key={unit.id}>
        <div
          onClick={() => handleSelectUnit(unit)}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition-all ${
            selectedId === unit.id
              ? depth > 0
                ? 'bg-primary-fixed text-primary border border-primary'
                : 'bg-primary/10 text-primary font-bold'
              : 'hover:bg-surface-container-low'
          } ${depth > 0 ? 'ml-6 mt-1' : 'mt-2'}`}
        >
          <span
            className={`material-symbols-outlined ${depth === 0 ? 'text-[20px]' : 'text-[18px]'} ${TYPE_COLORS[unit.unitType] || 'text-secondary'}`}
          >
            {unit.unitType === 'branch' ? 'location_on' : UNIT_TYPE_ICONS[unit.unitType] || 'corporate_fare'}
          </span>
          <span className="font-medium">{unit.name}</span>
          {!unit.isActive && (
            <span className="text-[10px] text-outline ml-auto">Non-Aktif</span>
          )}
        </div>
        {children.length > 0 && (
          <div className="border-l border-border ml-4 pl-2">
            {renderTreeNode(children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Konfigurasi Organisasi</h2>
          <nav className="flex gap-2 text-caption-xs text-secondary text-xs mt-1">
            <span>Konfigurasi</span>
            <span>/</span>
            <span className="text-primary font-semibold">Struktur Organisasi</span>
          </nav>
        </div>
        <div className="flex gap-3 text-xs md:text-sm">
          <button
            onClick={() => {
              setAddParentId(null);
              setAddName(''); setAddCode(''); setAddCity(''); setAddProvince('');
              setAddType('branch');
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-label-sm hover:opacity-90 active:scale-95 transition-all font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Unit Baru
          </button>
        </div>
      </div>

      {/* Duel Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Side: Tree panel */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-auto lg:h-[550px]">
          <div className="p-4 border-b border-border bg-surface-bright flex justify-between items-center shrink-0">
            <h3 className="font-label-sm text-primary text-sm font-bold">STRUKTUR HIERARKI</h3>
            <div className="flex gap-1 text-secondary">
              <span className="material-symbols-outlined hover:bg-surface-container rounded p-1 cursor-pointer text-lg">unfold_more</span>
              <span className="material-symbols-outlined hover:bg-surface-container rounded p-1 cursor-pointer text-lg">sync</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            {tree.length === 0 ? (
              <p className="text-xs text-outline text-center py-8">Belum ada unit organisasi.</p>
            ) : (
              renderTreeNode(tree)
            )}
          </div>
        </div>

        {/* Right Side: Form Editor */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-auto lg:h-[550px]">
          {/* Editor Header */}
          <div className="p-4 sm:p-6 border-b border-border bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed text-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">
                  {selectedUnit ? UNIT_TYPE_ICONS[selectedUnit.unitType] || 'location_on' : 'location_on'}
                </span>
              </div>
              <div>
                <h3 className="font-subheading-entity text-md font-bold">{formName || 'Pilih Unit'}</h3>
                <p className="font-caption-xs text-secondary text-xs">
                  {selectedUnit ? `ID: ${selectedUnit.code} • Tipe: ${selectedUnit.unitType}` : 'Pilih unit dari hierarki'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {formActive ? 'Aktif' : 'Non-Aktif'}
              </span>
              <button
                onClick={() => {
                  if (selectedUnit) setDeleteConfirmId(selectedUnit.id);
                }}
                className="p-2 text-secondary hover:text-danger transition-colors border rounded-lg"
                disabled={!selectedUnit}
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>

          {/* Form Fields body */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label htmlFor="org-name" className="font-semibold text-on-surface-variant block">Nama Unit</label>
                <input
                  id="org-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-code" className="font-semibold text-on-surface-variant block">Kode Unit</label>
                <input
                  id="org-code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary font-mono"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-city" className="font-semibold text-on-surface-variant block">Kota</label>
                <input
                  id="org-city"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-province" className="font-semibold text-on-surface-variant block">Provinsi</label>
                <input
                  id="org-province"
                  value={formProvince}
                  onChange={(e) => setFormProvince(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-2">
                <label className="font-semibold text-sm text-secondary uppercase tracking-widest text-xs">Status Unit</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="orgStatus" checked={formActive} onChange={() => setFormActive(true)} className="text-primary" />
                  <span className="text-xs font-medium">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="orgStatus" checked={!formActive} onChange={() => setFormActive(false)} className="text-primary" />
                  <span className="text-xs font-medium">Non-Aktif</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sticky editor footer */}
          <div className="p-4 border-t border-border bg-surface-bright flex justify-between items-center shrink-0">
            <button
              onClick={() => {
                if (!selectedUnit) return;
                setAddParentId(selectedUnit.id);
                setAddName(''); setAddCode(''); setAddCity(''); setAddProvince('');
                const childType: OrgUnit['unitType'] =
                  selectedUnit.unitType === 'company' ? 'division' :
                  selectedUnit.unitType === 'division' ? 'branch' :
                  'department';
                setAddType(childType);
                setAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline outline-none"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Tambah Sub-Unit (Node Anak)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedUnit) handleSelectUnit(selectedUnit);
                  onShowNotification('Form reset ke nilai awal.', 'success');
                }}
                className="px-4 py-1.5 border border-border bg-surface-container-lowest text-secondary rounded hover:bg-surface-container-low text-sm font-semibold"
              >
                Atur Ulang
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-5 py-1.5 bg-primary text-white rounded hover:bg-primary-container text-sm font-semibold shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Unit Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={addParentId ? 'Tambah Sub-Unit' : 'Tambah Unit Baru'}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setAddModalOpen(false)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleAddUnit}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label htmlFor="add-unit-name" className="font-semibold text-on-surface-variant block">Nama Unit *</label>
            <input id="add-unit-name" value={addName} onChange={e => setAddName(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary" placeholder="Nama unit" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="add-unit-code" className="font-semibold text-on-surface-variant block">Kode Unit *</label>
            <input id="add-unit-code" value={addCode} onChange={e => setAddCode(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary font-mono" placeholder="CONTOH_001" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="add-unit-type" className="font-semibold text-on-surface-variant block">Tipe Unit</label>
              <select id="add-unit-type" value={addType} onChange={e => setAddType(e.target.value as OrgUnit['unitType'])} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="add-unit-parent" className="font-semibold text-on-surface-variant block">Induk Unit</label>
              <input id="add-unit-parent" className="w-full px-4 py-2 border border-border rounded-lg bg-surface-container-low text-secondary" value={addParentId ? (orgUnits.find(u => u.id === addParentId)?.name || addParentId) : '(Root)'} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="add-unit-city" className="font-semibold text-on-surface-variant block">Kota</label>
              <input id="add-unit-city" value={addCity} onChange={e => setAddCity(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="add-unit-province" className="font-semibold text-on-surface-variant block">Provinsi</label>
              <input id="add-unit-province" value={addProvince} onChange={e => setAddProvince(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button variant="danger" size="md" onClick={handleDeleteUnit}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Apakah Anda yakin ingin menghapus unit <strong>{selectedUnit?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
