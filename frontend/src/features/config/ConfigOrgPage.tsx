import React, { useState } from 'react';

interface ConfigOrgViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ConfigOrgView({ onShowNotification }: ConfigOrgViewProps) {
  const [selectedNode, setSelectedNode] = useState('Jakarta Branch');
  const [unitName, setUnitName] = useState('Jakarta Branch');
  const [unitCode, setUnitCode] = useState('BR-JKT-001');
  const [city, setCity] = useState('Jakarta Selatan');
  const [province, setProvince] = useState('DKI Jakarta');

  const [departments, setDepartments] = useState([
    { id: '1', name: 'Engineering & Tech', code: 'DEPT-ENG', parent: 'Operations Division' },
    { id: '2', name: 'Legal & Compliance', code: 'DEPT-LGL', parent: 'Operations Division' },
    { id: '3', name: 'Finance & Tax', code: 'DEPT-FIN', parent: 'Operations Division' },
  ]);

  const [activeUnit, setActiveUnit] = useState(true);

  const handleSaveChanges = () => {
    onShowNotification(`Konfigurasi unit ${unitName} berhasil disimpan dengan aman ke database!`, 'success');
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
          <button className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg font-label-sm hover:bg-surface-container transition-colors font-semibold">
            <span className="material-symbols-outlined text-[20px]">cloud_download</span>
            Export Structure
          </button>
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

          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {/* Master Company Level */}
            <div className="relative">
              <div
                onClick={() => {
                  setSelectedNode('Kinetic Enterprise Group');
                  setUnitName('Kinetic Enterprise Group');
                  setUnitCode('CORP-01');
                }}
                className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer group ${
                  selectedNode === 'Kinetic Enterprise Group' ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
                <span className="text-sm">Kinetic Enterprise Group</span>
              </div>

              {/* Division Level */}
              <div className="ml-6 mt-2 space-y-2 relative border-l border-border pl-4">
                <div
                  onClick={() => {
                    setSelectedNode('Operations Division');
                    setUnitName('Operations Division');
                    setUnitCode('DIV-OPS-01');
                  }}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer group ${
                    selectedNode === 'Operations Division' ? 'bg-primary/10 text-primary font-bold' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">expand_more</span>
                  <span className="material-symbols-outlined text-status-purple text-[18px]">account_tree</span>
                  <span className="text-sm">Operations Division</span>
                </div>

                {/* Sub levels */}
                <div className="ml-6 space-y-2 border-l border-border pl-4">
                  <div
                    onClick={() => {
                      setSelectedNode('Jakarta Branch');
                      setUnitCode('BR-JKT-001');
                      setUnitName('Jakarta Branch');
                      setCity('Jakarta Selatan');
                    }}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border text-sm font-semibold transition-all shadow-sm ${
                      selectedNode === 'Jakarta Branch'
                        ? 'bg-primary-fixed text-primary border-primary'
                        : 'bg-white border-border text-on-surface hover:border-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>Jakarta Branch</span>
                  </div>

                  <div
                    onClick={() => {
                      setSelectedNode('Surabaya Branch');
                      setUnitCode('BR-SUB-002');
                      setUnitName('Surabaya Branch');
                      setCity('Surabaya Timur');
                    }}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border text-sm transition-all hover:bg-slate-50 cursor-pointer ${
                      selectedNode === 'Surabaya Branch' ? 'bg-primary/10 border-primary font-bold' : 'border-border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">location_on</span>
                    <span>Surabaya Branch</span>
                  </div>

                  <div
                    onClick={() => {
                      setSelectedNode('Medan Branch');
                      setUnitCode('BR-MDN-003');
                      setUnitName('Medan Branch');
                      setCity('Medan Belawan');
                    }}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border text-sm transition-all hover:bg-slate-50 cursor-pointer ${
                      selectedNode === 'Medan Branch' ? 'bg-primary/10 border-primary font-bold' : 'border-border'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">location_on</span>
                    <span>Medan Branch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Editor */}
        <div className="lg:col-span-8 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[550px]">
          {/* Editor Header */}
          <div className="p-6 border-b border-border bg-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed text-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">location_on</span>
              </div>
              <div>
                <h3 className="font-subheading-entity text-md font-bold">{unitName}</h3>
                <p className="font-caption-xs text-secondary text-xs">ID: {unitCode} • Last Modified: Oct 2023</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activeUnit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {activeUnit ? 'Active' : 'Non-Active'}
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
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Kode Unit</label>
                <input
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary font-mono"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Kota</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">Provinsi</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                />
              </div>
            </div>

            {/* Geographical Map Preview (Matches HTML design coordinates map card) */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-secondary uppercase tracking-widest text-xs">Lokasi Geografis</h4>
              <div className="w-full h-36 rounded-xl border border-border overflow-hidden bg-surface-variant relative select-none">
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-60 flex items-center justify-center text-secondary text-xs"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDg0ZgWOquKg5N1cBrdEKFwoySE-q1nKgHJokD6IENB-3otYWPKB0geo1ZMNeJjCrIV39vSCFZfeoc_XwDyeF-wpA1_C7COPXavSsmRoCEUNIRTxbY30ecUUdyv2DsiFjn0Rtbp2uHnqxA8qkLDKt8LwWvQYmISVIHOxhslimB9R4YWLFwQ5Ey1Q_wDuy_5JO8-f6-e4o8jK0Rq8B4lo9jbilBeoe0Fy-slpn3zAC-ngwfKKivBFY7d_r1UQYENmtyJjLl0Sx57Hcgf')`,
                  }}
                >
                  [South Jakarta Map coordinates view]
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary text-3xl font-bold">location_on</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-sm border border-border text-xs">
                  <p className="font-semibold text-primary">Jl. Sudirman Kav 52-53</p>
                  <p className="text-secondary">-6.2234, 106.8115</p>
                </div>
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
                  setUnitName(selectedNode);
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
