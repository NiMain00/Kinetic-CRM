import React, { useState, useMemo } from 'react';
import { useConfigStore } from '@/stores/configStore';
import type { OrgUnit } from '@/types/domain/config';

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

  const [selectedId, setSelectedId] = useState<string>('br-jkt');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formActive, setFormActive] = useState(true);

  const selectedUnit = useMemo(
    () => orgUnits.find((u) => u.id === selectedId),
    [orgUnits, selectedId],
  );

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

  const handleSaveChanges = () => {
    if (!selectedUnit) return;
    updateConfigData('orgUnits', selectedUnit.id, {
      name: formName,
      code: formCode,
      city: formCity || undefined,
      province: formProvince || undefined,
      isActive: formActive,
    });
    onShowNotification(`Konfigurasi unit ${formName} berhasil disimpan!`, 'success');
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
              : 'hover:bg-slate-50'
          } ${depth > 0 ? 'ml-6 mt-1' : 'mt-2'}`}
        >
          <span
            className={`material-symbols-outlined text-[${depth === 0 ? '20px' : '18px'}] ${TYPE_COLORS[unit.unitType] || 'text-secondary'}`}
          >
            {unit.unitType === 'branch' ? 'location_on' : UNIT_TYPE_ICONS[unit.unitType] || 'corporate_fare'}
          </span>
          <span className="font-medium">{unit.name}</span>
          {!unit.isActive && (
            <span className="text-[10px] text-slate-400 ml-auto">Non-Aktif</span>
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
    <div className="p-8 space-y-6 flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Konfigurasi Organisasi</h2>
          <nav className="flex gap-2 text-caption-xs text-secondary text-xs mt-1">
            <span>Configuration</span>
            <span>/</span>
            <span className="text-primary font-semibold">Organization Structure</span>
          </nav>
        </div>
        <div className="flex gap-3 text-xs md:text-sm">
          <button
            onClick={() => onShowNotification('Berhasil membuka form tambah unit organisasi.', 'success')}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-label-sm hover:opacity-90 active:scale-95 transition-all font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Unit Baru
          </button>
        </div>
      </div>

      {/* Duel Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Tree panel */}
        <div className="lg:col-span-4 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-border bg-surface-bright flex justify-between items-center shrink-0">
            <h3 className="font-label-sm text-primary text-sm font-bold">STRUKTUR HIERARKI</h3>
            <div className="flex gap-1 text-slate-500">
              <span className="material-symbols-outlined hover:bg-surface-container rounded p-1 cursor-pointer text-lg">unfold_more</span>
              <span className="material-symbols-outlined hover:bg-surface-container rounded p-1 cursor-pointer text-lg">sync</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            {tree.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada unit organisasi.</p>
            ) : (
              renderTreeNode(tree)
            )}
          </div>
        </div>

        {/* Right Side: Form Editor */}
        <div className="lg:col-span-8 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[550px]">
          {/* Editor Header */}
          <div className="p-6 border-b border-border bg-white flex justify-between items-center shrink-0">
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
                {formActive ? 'Active' : 'Non-Active'}
              </span>
              <button
                onClick={() => onShowNotification('Aksi hapus unit organisasi ditangguhkan.', 'warning')}
                className="p-2 text-secondary hover:text-danger transition-colors border rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>

          {/* Form Fields body */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Nama Unit</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Kode Unit</label>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary font-mono"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Kota</label>
                <input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Provinsi</label>
                <input
                  value={formProvince}
                  onChange={(e) => setFormProvince(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-sm text-secondary uppercase tracking-widest text-xs">Status</label>
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
              onClick={() => onShowNotification('Aksi tambah sub-unit ditangguhkan.', 'warning')}
              className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline outline-none"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Tambah Sub-Unit (Child Node)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedUnit) handleSelectUnit(selectedUnit);
                  onShowNotification('Form reset ke nilai awal.', 'success');
                }}
                className="px-4 py-1.5 border border-border bg-white text-secondary rounded hover:bg-slate-50 text-sm font-semibold"
              >
                Reset
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
    </div>
  );
}
