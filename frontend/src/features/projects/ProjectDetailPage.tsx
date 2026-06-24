import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Project } from '../../types/domain';
import { useProject } from '../../hooks/queries/useProjects';
import { INITIAL_TIMELINE_EVENTS, COMPETITORS } from '../../services/mock-data';

interface ProjectDetailViewProps {
  key?: string;
  project?: Project;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

export default function ProjectDetailView({
  project: propProject,
  onShowNotification,
  onNavigatePage,
}: ProjectDetailViewProps) {
  const { projectId, tab: urlTab } = useParams<{ projectId: string; tab: string }>();
  const navigate = useNavigate();

  const { data: apiRes, isLoading } = useProject(projectId || '');
  const project = propProject || (apiRes as any)?.data?.data || null;

  if (!propProject && isLoading) {
    return <div className="py-20 text-center text-secondary">Memuat proyek...</div>;
  }

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
        <h3 className="font-heading-section text-base text-on-surface">Project not found</h3>
        <p className="text-sm text-outline">The project you are looking for does not exist or has been removed.</p>
        <button onClick={() => onNavigatePage('projects')} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Back to Projects</button>
      </div>
    );
  }

  const tabPathMap: Record<string, string> = {
    'Overview': 'overview',
    'RKS': 'rks',
    'Review RKS': 'review-rks',
    'LPHS/SIOS': 'lphs',
    'Harga': 'harga',
    'Kompetitor': 'kompetitor',
    'Pemenang': 'pemenang',
    'Target Delivery': 'target-delivery',
    'Timeline': 'timeline',
    'Dokumen': 'dokumen',
  };

  const pathToTabMap: Record<string, string> = {
    'overview': 'Overview',
    'rks': 'RKS',
    'review-rks': 'Review RKS',
    'lphs': 'LPHS/SIOS',
    'harga': 'Harga',
    'kompetitor': 'Kompetitor',
    'pemenang': 'Pemenang',
    'target-delivery': 'Target Delivery',
    'timeline': 'Timeline',
    'dokumen': 'Dokumen',
  };

  const activeTab = pathToTabMap[urlTab || 'overview'] || 'Overview';
  const isOverview = activeTab === 'Overview';

  // Competitor list state
  const [competitors, setCompetitors] = useState(COMPETITORS);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('');
  const [newCompAdv, setNewCompAdv] = useState('');
  const [newCompNote, setNewCompNote] = useState('');

  // RKS data states
  const [nomorTender, setNomorTender] = useState('TND/2025/HQ/0042');
  const [namaTender, setNamaTender] = useState(project.name);
  const [deadlineTender, setDeadlineTender] = useState(project.deadlineTender || '2026-06-25');
  const [aanwijzing, setAanwijzing] = useState('Tidak / Belum Ada');
  const [workLocation, setWorkLocation] = useState(project.location || 'Site Office Area A, Jakarta Selatan');
  const [mainScope, setMainScope] = useState('Pembangunan infrastruktur data center terintegrasi meliputi instalasi kelistrikan, rack server, unit pendingin, dan fire suppression system.');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; time: string }>>([
    { name: 'RKS_Technical_Draft_v1.pdf', size: '4.2 MB', time: '2 mins ago' }
  ]);

  // Pricing inputs
  const [hargaPenawaran, setHargaPenawaran] = useState(project.pricing?.value || 1250000000);
  const [marginPercentage, setMarginPercentage] = useState(project.pricing?.margin || 12.5);
  const [pricingNotes, setPricingNotes] = useState(project.pricing?.note || '');

  // Pemenang outcome toggles
  const [outcome, setOutcome] = useState<'menang' | 'kalah' | null>(null);
  const [finalContractValue, setFinalContractValue] = useState('1250000000');
  const [durationDays, setDurationDays] = useState('180');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [failureReason, setFailureReason] = useState('');

  // Documents accordion collapse states
  const [docsOpened, setDocsOpened] = useState<Record<string, boolean>>({
    RKS: true,
    LPHS: false,
    SIOS: false,
    Harga: false,
    MISC: true,
  });

  // History version expansions
  const [historyExpanded, setHistoryExpanded] = useState<Record<string, boolean>>({});

  const [isOpenUploadDrawer, setIsOpenUploadDrawer] = useState(false);

  const toggleDocGroup = (key: string) => {
    setDocsOpened({ ...docsOpened, [key]: !docsOpened[key] });
  };

  const handleApplyWinnerOutcome = () => {
    onShowNotification(
      `Hasil tender berhasil terkonfirmasi dan diselesaikan sebagai proyek ${
        outcome === 'menang' ? 'MENANG' : 'KALAH'
      }!`,
      outcome === 'menang' ? 'success' : 'warning'
    );
  };

  const handleAddCompetitor = () => {
    if (!newCompName) {
      onShowNotification('Nama kompetitor harus diisi.', 'error');
      return;
    }
    const newItem = {
      id: String(competitors.length + 1),
      name: newCompName,
      estPrice: Number(newCompPrice) || 0,
      advantages: newCompAdv ? newCompAdv.split(',').map(s => s.trim()) : ['BIM Integration'],
      notes: newCompNote || '-'
    };
    setCompetitors([...competitors, newItem]);
    setNewCompName('');
    setNewCompPrice('');
    setNewCompAdv('');
    setNewCompNote('');
    onShowNotification(`Kompetitor ${newItem.name} berhasil ditambahkan ke proyek.`, 'success');
  };

  const handleSavePricing = () => {
    onShowNotification('Draf harga penawaran berhasil diperbarui!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky Project Header with Dynamic Breadcrumbs */}
      <section className="bg-white border-b border-border px-8 py-3.5 shadow-sm z-30">
        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-secondary mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigatePage('projects')}
            className="hover:text-primary transition-colors font-medium flex items-center gap-1 text-slate-500"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">tactic</span>
            Projects
          </button>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <button
            type="button"
            onClick={() => navigate(`/project/${projectId}/overview`)}
            className="hover:text-primary transition-colors font-semibold text-slate-600"
          >
            {project.code}
          </button>
          {!isOverview && (
            <>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-primary font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                {activeTab}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isOverview ? onNavigatePage('projects') : navigate(`/project/${projectId}/overview`)}
              className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center border border-border bg-white"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display-title text-xl font-bold tracking-tight">{project.code}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-status-indigo/10 text-status-indigo font-semibold text-xs border border-status-indigo/20">
                  {project.status}
                </span>
              </div>
              <p className="text-secondary text-sm line-clamp-1">{project.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-lg hover:bg-danger/5 transition-all">
              Revisi
            </button>
            <button
              onClick={() => onShowNotification('Aksi persetujuan proyek berhasil dikirim!', 'success')}
              className="px-5 py-1.5 bg-success text-white font-semibold text-xs rounded-lg hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Approve
            </button>
          </div>
        </div>
      </section>

      {isOverview && (
        <section className="bg-surface-container-lowest px-8 py-6 border-b border-border overflow-x-auto shrink-0 select-none">
          <div className="min-w-[800px] flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-0"></div>
            <div className="absolute top-1/2 left-0 w-3/5 h-0.5 bg-primary -translate-y-1/2 -z-0"></div>

            {['RKS', 'Dept Review', 'LPHS/SIOS', 'Harga', 'Pemenang'].map((step, index) => {
              const stepNum = index + 1;
              const isCompleted = stepNum < 3;
              const isActive = stepNum === 3;

              const stepToPathMap: Record<string, string> = {
                'RKS': 'rks',
                'Dept Review': 'review-rks',
                'LPHS/SIOS': 'lphs',
                'Harga': 'harga',
                'Pemenang': 'pemenang'
              };

              return (
                <div 
                  key={step} 
                  onClick={() => navigate(`/project/${projectId}/${stepToPathMap[step]}`)}
                  className="relative z-10 flex flex-col items-center gap-2 bg-surface-container-lowest px-4 cursor-pointer hover:scale-105 transition-transform"
                >
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                ) : isActive ? (
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-primary/10">
                    3
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-border text-on-surface-variant flex items-center justify-center font-bold text-sm">
                    {stepNum}
                  </div>
                )}
                <span className={`font-label-sm text-xs ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                  {step}
                </span>
              </div>
            );
            })}
          </div>
        </section>
      )}

      {isOverview && (
        <nav className="bg-white border-b border-border px-8 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-8 min-w-max">
            {[
              'Overview',
              'RKS',
              'Review RKS',
              'LPHS/SIOS',
              'Harga',
              'Kompetitor',
              'Pemenang',
              'Target Delivery',
              'Timeline',
              'Dokumen',
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => navigate(`/project/${projectId}/${tabPathMap[tab] || 'overview'}`)}
                className={`py-4 font-label-sm text-sm transition-all relative ${
                  activeTab === tab
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Main Tab Panel scroll area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-heading-section text-heading-section mb-4">Informasi Proyek</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <p className="text-secondary text-xs uppercase tracking-wider">Klien / Hub</p>
                      <p className="font-semibold text-on-surface text-base">{project.client}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs uppercase tracking-wider">Nilai Estimasi</p>
                      <p className="font-semibold text-primary text-base">Rp {project.estimatedValue.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs uppercase tracking-wider">Lokasi Pekerjaan resmi</p>
                      <p className="font-semibold text-on-surface">{project.location}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs uppercase tracking-wider">PIC Proyek</p>
                      <p className="font-semibold text-on-surface flex items-center gap-2 mt-1">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">BS</span>
                        {project.author}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress card */}
                <div className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-md overflow-hidden relative">
                  <div className="relative z-10">
                    <h3 className="font-heading-section text-heading-section text-white mb-2">Overall Progress</h3>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-4xl font-bold text-white">{project.progress}%</span>
                      <span className="font-caption-xs mb-1 opacity-80 text-white/90 text-sm">+12% from last week</span>
                    </div>
                    <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <p className="mt-4 font-caption-xs text-white/70 text-xs">Next: Finalisasi LPHS/SIOS persetujuan dari divisi operasional.</p>
                  </div>
                  <span className="material-symbols-outlined text-[130px] opacity-10 absolute -right-6 -bottom-6 text-white select-none">
                    trending_up
                  </span>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h4 className="font-label-sm text-sm text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-success">verified_user</span>
                    Security Clearance
                  </h4>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 bg-success rounded-full"></span> PKP Verified Status
                    </p>
                    <p className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 bg-success rounded-full"></span> Branch Pricing Lock-In Active
                    </p>
                    <p className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 bg-warning rounded-full"></span> Awaiting HQ Pre-Review
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RKS FORM */}
          {activeTab === 'RKS' && (
            <div className="space-y-8 animate-fade-in">
              {/* Title and Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display-title text-xl font-bold text-on-surface">Form Pengisian RKS</h3>
                  <p className="font-body-main text-sm text-secondary mt-1">
                    Project: {project.name} ({project.code})
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-warning/10 text-warning text-xs font-semibold rounded-lg border border-warning/20">
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                  <span className="uppercase tracking-wider">Awaiting Submission</span>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-2 relative">
                  <div className="h-1.5 rounded-full bg-primary relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-xs">1. RKS</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 rounded-full bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">circle</span>
                    <span className="text-xs">2. BOQ</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 rounded-full bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">circle</span>
                    <span className="text-xs">3. Evaluasi</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 rounded-full bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">circle</span>
                    <span className="text-xs">4. Kontrak</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 rounded-full bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">circle</span>
                    <span className="text-xs">5. Mobilisasi</span>
                  </div>
                </div>
              </div>

              {/* Main Form Sections */}
              <div className="space-y-6">
                
                {/* Section 1: Basic Tender Info */}
                <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">assignment</span>
                    </span>
                    <div>
                      <h3 className="font-heading-section text-base font-bold text-slate-800">Informasi Tender Utama</h3>
                      <p className="text-secondary text-xs">Identitas nomor tender dan nama paket di portal e-proc.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-sm text-xs font-semibold text-slate-600">Nomor Tender</label>
                      <input
                        value={nomorTender}
                        onChange={(e) => setNomorTender(e.target.value)}
                        className="px-4 py-2.5 bg-background border border-border rounded-lg font-mono text-sm"
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="font-label-sm text-xs font-semibold text-slate-600">Nama Tender</label>
                      <input
                        value={namaTender}
                        onChange={(e) => setNamaTender(e.target.value)}
                        className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-sm text-xs font-semibold text-slate-600">Deadline Tender</label>
                      <input
                        value={deadlineTender}
                        onChange={(e) => setDeadlineTender(e.target.value)}
                        className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                        type="date"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Document Upload */}
                <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
                      <span className="material-symbols-outlined">upload_file</span>
                    </span>
                    <div>
                      <h3 className="font-heading-section text-base font-bold text-slate-800">Dokumen RKS &amp; Lampiran</h3>
                      <p className="text-secondary text-xs">Unggah lembar acuan RKS resmi dari pihak klien.</p>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    id="hidden-file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                        setUploadedFiles((prev) => [
                          ...prev,
                          { name: file.name, size: `${sizeMB} MB`, time: 'Just now' },
                        ]);
                        onShowNotification(`File ${file.name} berhasil diunggah.`, 'success');
                      }
                    }}
                  />

                  <div
                    onClick={() => document.getElementById('hidden-file-upload')?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
                    <p className="font-label-sm text-sm text-slate-700 mb-1">
                      Drag and drop file here, or <span className="text-primary font-semibold hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">PDF or DOCX format (Max size: 25MB)</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-border rounded-lg hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="material-symbols-outlined text-danger shrink-0 text-[32px]">description</span>
                            <div className="truncate">
                              <p className="font-label-sm text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                              <p className="text-xs text-slate-400">{file.size} • Uploaded {file.time}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                              onShowNotification(`File ${file.name} berhasil dihapus.`, 'warning');
                            }}
                            className="p-1.5 hover:bg-red-50 hover:text-danger rounded-lg transition-colors text-slate-400"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Section 3: Ketentuan Pekerjaan */}
                <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-lg bg-status-teal/10 text-status-teal flex items-center justify-center">
                      <span className="material-symbols-outlined">quiz</span>
                    </span>
                    <div>
                      <h3 className="font-heading-section text-base font-bold text-slate-800">Ketentuan Pelaksanaan Pekerjaan</h3>
                      <p className="text-secondary text-xs">Sifat administrasi lapangan dan cakupan teknis proyek.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-semibold text-xs text-slate-700 mb-3">Apakah sudah ada jadwal penjelasan tender (Aanwijzing)?</p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="aanwijzing_opt"
                            checked={aanwijzing === 'Ya, Terjadwal'}
                            onChange={() => setAanwijzing('Ya, Terjadwal')}
                            className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                          />
                          <span className="text-sm text-slate-700 font-medium">Ya, Terjadwal</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="aanwijzing_opt"
                            checked={aanwijzing === 'Tidak / Belum Ada'}
                            onChange={() => setAanwijzing('Tidak / Belum Ada')}
                            className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                          />
                          <span className="text-sm text-slate-700 font-medium">Tidak / Belum Ada</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-sm text-xs font-semibold text-slate-600">Lokasi Pelaksanaan Pekerjaan Resmi</label>
                        <input
                          value={workLocation}
                          onChange={(e) => setWorkLocation(e.target.value)}
                          className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                          placeholder="Contoh: Site Office Area A, Jakarta Selatan"
                          type="text"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-sm text-xs font-semibold text-slate-600">Lingkup Pekerjaan Utama (Scope of Work)</label>
                        <textarea
                          value={mainScope}
                          onChange={(e) => setMainScope(e.target.value)}
                          className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm"
                          placeholder="Deskripsikan ruang lingkup utama dari pekerjaan konstruksi ini..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Additional Notes */}
                <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-status-purple/10 text-status-purple flex items-center justify-center">
                          <span className="material-symbols-outlined">notes</span>
                        </span>
                        <div>
                          <h3 className="font-heading-section text-base font-bold text-slate-800">Catatan Tambahan Internal</h3>
                          <p className="text-secondary text-xs">Instruksi internal dan konteks non-publik.</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 italic">Internal context only</span>
                    </div>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm"
                      placeholder="Masukkan instruksi khusus atau catatan untuk tim review..."
                      rows={4}
                    />
                  </div>
                </section>

                {/* Footer Action Card inside the grid box to prevent floating overflow layout gaps */}
                <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs text-center sm:text-left">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>Autosaved draft matches v2.4.0 CRM Engine specifications.</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onShowNotification('Draf RKS berhasil disimpan.', 'success')}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-white border border-border text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Simpan Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowNotification('RKS sukses dikirim ke tim Review!', 'success')}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2"
                    >
                      Kirim ke Review
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </div>
                </section>

              </div>
            </div>
          )}

          {/* TAB 3: REVIEW RKS */}
          {activeTab === 'Review RKS' && (
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
              <h3 className="font-heading-section text-heading-section flex items-center gap-2 pb-3 border-b border-border">
                <span className="material-symbols-outlined text-primary">quiz</span>
                Review RKS Komparatif
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border-l-4 border-success bg-surface-container-low">
                  <h5 className="font-semibold text-sm">Q1: Apakah spesifikasi server di lokasi Cabang Jakarta sudah sesuai standar redundansi tier-2?</h5>
                  <p className="text-xs text-secondary mt-1">Jawaban: Ya, UPS 2x3KVA dengan modul SNMP akan dipasang sesuai spesifikasi RKS Halaman 12.</p>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-success bg-surface-container-low">
                  <h5 className="font-semibold text-sm">Q2: Verifikasi ketersediaan bandwidth fiber optic ISP di area Menteng.</h5>
                  <p className="text-xs text-secondary mt-1">Jawaban: Provider Biznet sudah konsisten mengonfirmasi ketersediaan FO di lokasi dengan SLA 99.7%.</p>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-warning bg-surface-container border border-border">
                  <h5 className="font-semibold text-sm text-warning">Q3: Detail instalasi kelistrikan untuk rak server utama.</h5>
                  <p className="text-xs text-secondary mt-1 italic">Menunggu tanggapan atau analisis penambahan kabel grounding dari tim lapangan.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LPHS/SIOS */}
          {activeTab === 'LPHS/SIOS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Checklist review */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                  <h3 className="font-heading-section text-heading-section mb-6">Checklist Review</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 rounded-lg border border-border bg-surface-container-low cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-outline text-primary mr-3" />
                      <div>
                        <p className="font-label-sm text-sm font-semibold">Engineering &amp; Tech</p>
                        <p className="text-xs text-secondary">Validasi spesifikasi teknis lapangan</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 rounded-lg border border-border bg-surface-container-low cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-outline text-primary mr-3" />
                      <div>
                        <p className="font-label-sm text-sm font-semibold">Legal &amp; Compliance</p>
                        <p className="text-xs text-secondary">Tinjau regulasi dan syarat kontrak</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 rounded-lg border border-border bg-white cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-outline text-primary mr-3" />
                      <div>
                        <p className="font-label-sm text-sm font-semibold">Finance &amp; Tax</p>
                        <p className="text-xs text-secondary">Verifikasi margin dan perpajakan</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Dropzone */}
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                  <h3 className="font-heading-section text-heading-section mb-4">Upload LPHS</h3>
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:bg-surface-container-low transition-all">
                    <span className="material-symbols-outlined text-primary text-3xl mb-2">upload_file</span>
                    <p className="text-xs font-semibold">Seret draf LPHS di sini</p>
                  </div>
                </div>
              </div>

              {/* Status matrix */}
              <div className="lg:col-span-8 space-y-6 bg-white p-6 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <h3 className="font-heading-section text-heading-section">Status Approval Matriks</h3>
                  <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold uppercase">
                    In-Progress Review
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-surface-container-low">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-status-indigo text-2xl">engineering</span>
                      <span className="text-xs font-bold text-warning">75% Done</span>
                    </div>
                    <p className="font-semibold text-sm">Engineering</p>
                    <p className="text-xs text-secondary">Reviewer: Pak Adi</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-surface-container-low">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-status-purple text-2xl">gavel</span>
                      <span className="text-xs font-bold text-success">100% Done</span>
                    </div>
                    <p className="font-semibold text-sm">Legal</p>
                    <p className="text-xs text-secondary">Reviewer: Bu Maya</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-surface-container-low">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-status-teal text-2xl">payments</span>
                      <span className="text-xs font-bold text-status-orange">20% Done</span>
                    </div>
                    <p className="font-semibold text-sm">Finance</p>
                    <p className="text-xs text-secondary">Reviewer: Pak Deni</p>
                  </div>
                </div>

                {/* Ringkasan eksekutif */}
                <div className="bg-primary text-white p-6 rounded-xl shadow-sm relative overflow-hidden">
                  <h4 className="text-lg font-bold mb-2">Ringkasan Eksekutif</h4>
                  <p className="text-sm opacity-90 mb-4">
                    Proyek ini menunjukkan margin estimasi 18.4%. LPHS siap diajukan ke Management segera setelah Dept. Engineering memberikan persetujuan final.
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-white/10 p-2 px-4 rounded text-center">
                      <p className="text-[10px] uppercase font-bold opacity-60">Total Budget</p>
                      <p className="font-bold">IDR 1.250M</p>
                    </div>
                    <div className="bg-white/10 p-2 px-4 rounded text-center">
                      <p className="text-[10px] uppercase font-bold opacity-60">Est. Margin</p>
                      <p className="font-bold">18.4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HARGA PENAWARAN */}
          {activeTab === 'Harga' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-8 bg-white border border-border rounded-xl shadow-sm p-6 space-y-6">
                <h3 className="font-heading-section text-heading-section">Rincian Nilai Penawaran</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="font-semibold text-on-surface-variant block">Harga Penawaran (Rp)*</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-semibold font-mono">Rp</span>
                      <input
                        value={hargaPenawaran}
                        onChange={e => setHargaPenawaran(Number(e.target.value))}
                        className="w-full border border-border rounded-lg pl-10 pr-4 py-3 font-mono"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="font-semibold text-on-surface-variant block">Margin (%)*</label>
                    <div className="relative">
                      <input
                        value={marginPercentage}
                        onChange={e => setMarginPercentage(Number(e.target.value))}
                        className="w-full border border-border rounded-lg px-4 py-3 font-mono"
                        type="number"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-mono">%</span>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="font-semibold text-on-surface-variant block">Catatan Harga</label>
                    <textarea
                      value={pricingNotes}
                      onChange={e => setPricingNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-border rounded-lg p-3 outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end">
                  <button
                    onClick={handleSavePricing}
                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-4 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="bg-primary-container p-6 text-on-primary-container">
                  <h4 className="font-semibold uppercase tracking-widest text-xs opacity-80 mb-2">Ringkasan Finansial</h4>
                  <div className="text-3xl font-display-title font-bold text-white">Rp {hargaPenawaran.toLocaleString('id-ID')}</div>
                  <p className="text-xs mt-1 italic text-white/80">*Belum termasuk pajak PPN</p>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary font-semibold">Gross Margin ({marginPercentage}%)</span>
                    <span className="text-on-surface font-semibold text-success">
                      Rp {((hargaPenawaran * marginPercentage) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary font-semibold">Estimasi COGS</span>
                    <span className="text-on-surface font-semibold">
                      Rp {(hargaPenawaran - (hargaPenawaran * marginPercentage) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KOMPETITOR */}
          {activeTab === 'Kompetitor' && (
            <div className="space-y-6">
              <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                <h3 className="font-heading-section text-heading-section mb-4">Competitor Breakdown &amp; Market Position</h3>
                <div className="overflow-x-auto table-mobile-compact">
                  <table className="w-full text-left text-sm border-collapse table-auto">
                    <thead className="bg-surface-container-low text-on-surface border-b border-border">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Nama Kompetitor</th>
                        <th className="px-6 py-3 font-semibold">Estimasi Harga (IDR)</th>
                        <th className="px-6 py-3 font-semibold">Kelebihan</th>
                        <th className="px-6 py-3 font-semibold">Keterangan / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {competitors.map((row) => (
                        <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-semibold">{row.name}</td>
                          <td className="px-6 py-4 font-mono">{row.estPrice.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4">
                            <span className="bg-status-indigo/10 text-status-indigo px-2.5 py-0.5 rounded text-xs font-semibold badge-compact">
                              {row.advantages.join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-secondary text-xs">{row.notes}</td>
                        </tr>
                      ))}

                      {/* Inline competitor adder form */}
                      <tr className="bg-surface-container-low/40">
                        <td className="px-6 py-3">
                          <input
                            value={newCompName}
                            onChange={(e) => setNewCompName(e.target.value)}
                            placeholder="Cari / Ketik Nama kompetitor..."
                            className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                            type="text"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            value={newCompPrice}
                            onChange={(e) => setNewCompPrice(e.target.value)}
                            placeholder="Contoh: 142500000000"
                            className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm font-mono outline-none"
                            type="number"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            value={newCompAdv}
                            onChange={(e) => setNewCompAdv(e.target.value)}
                            placeholder="Kelebihan (pisahkan koma)"
                            className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary w-full text-sm outline-none"
                            type="text"
                          />
                        </td>
                        <td className="px-6 py-3 flex gap-2 justify-between items-center">
                          <input
                            value={newCompNote}
                            onChange={(e) => setNewCompNote(e.target.value)}
                            placeholder="Catatan..."
                            className="bg-white border border-border rounded px-3 py-1.5 focus:ring-1 focus:ring-primary text-sm flex-1 outline-none"
                            type="text"
                          />
                          <button
                            type="button"
                            onClick={handleAddCompetitor}
                            className="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow hover:bg-primary-container shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">add</span> Simpan
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PEMENNANG OUTCOME SELECTION */}
          {activeTab === 'Pemenang' && (
            <div className="space-y-8 animate-fade-in text-slate-800">
              <div className="bento-grid">
                {/* Outcome Selection Card */}
                <section className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-border shadow-sm p-6">
                  <h3 className="font-heading-section text-base font-bold text-on-surface mb-6 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-primary">gavel</span>
                    Penentuan Hasil Tender
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="font-label-sm text-xs font-semibold text-secondary mb-3 block">Hasil Tender</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setOutcome('menang')}
                          className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all group relative overflow-hidden ${
                            outcome === 'menang'
                              ? 'border-success bg-success/5 text-success'
                              : 'border-border hover:border-success/50'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${
                              outcome === 'menang' ? 'text-success' : 'text-outline-variant group-hover:text-success'
                            }`}>
                              emoji_events
                            </span>
                            <span className={`font-bold text-xs ${
                              outcome === 'menang' ? 'text-success' : 'text-secondary'
                            }`}>
                              PROYEK MENANG
                            </span>
                          </div>
                          {outcome === 'menang' && (
                            <div className="absolute top-2 right-2 text-success">
                              <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            </div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setOutcome('kalah')}
                          className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all group relative overflow-hidden ${
                            outcome === 'kalah'
                              ? 'border-danger bg-danger/5 text-danger'
                              : 'border-border hover:border-danger/50'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${
                              outcome === 'kalah' ? 'text-danger' : 'text-outline-variant group-hover:text-danger'
                            }`}>
                              sentiment_very_dissatisfied
                            </span>
                            <span className={`font-bold text-xs ${
                              outcome === 'kalah' ? 'text-danger' : 'text-secondary'
                            }`}>
                              PROYEK KALAH
                            </span>
                          </div>
                          {outcome === 'kalah' && (
                            <div className="absolute top-2 right-2 text-danger">
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-info">
                      <p className="text-xs text-on-surface-variant italic">
                        "Pastikan status pemenang telah sesuai dengan surat pengumuman resmi dari pihak pemberi kerja sebelum melakukan konfirmasi data."
                      </p>
                    </div>
                  </div>
                </section>

                {/* Dynamic Form Canvas */}
                <section className="col-span-12 lg:col-span-7">
                  {outcome === 'menang' ? (
                    /* WIN STATE FORM */
                    <div className="bg-white rounded-xl border border-border shadow-sm p-6 h-full transition-all duration-300 transform scale-100 opacity-100">
                      <h3 className="font-heading-section text-base font-bold text-success mb-6 flex items-center">
                        <span className="material-symbols-outlined mr-2">verified</span>
                        Detail Kontrak Pemenang
                      </h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="col-span-2">
                            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nilai Kontrak Akhir (IDR)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">Rp</span>
                              <input
                                value={finalContractValue}
                                onChange={(e) => setFinalContractValue(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                                type="text"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Mulai Proyek</label>
                            <input
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                              type="date"
                            />
                          </div>
                          <div>
                            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Durasi (Hari Kalender)</label>
                            <input
                              value={durationDays}
                              onChange={(e) => setDurationDays(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                              placeholder="Contoh: 180"
                              type="number"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Dokumen SPK / Kontrak</label>
                          <div
                            onClick={() => onShowNotification('Sistem unggah dokumen kontrak disimulasikan.', 'success')}
                            className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                          >
                            <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                            <p className="text-sm font-semibold text-secondary">Seret file ke sini atau <span className="text-primary underline">klik untuk unggah</span></p>
                            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, ZIP (Maks. 25MB)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : outcome === 'kalah' ? (
                    /* LOSE STATE FORM */
                    <div className="bg-white rounded-xl border border-border shadow-sm p-6 h-full transition-all duration-300 transform scale-100 opacity-100">
                      <h3 className="font-heading-section text-base font-bold text-danger mb-6 flex items-center">
                        <span className="material-symbols-outlined mr-2">report</span>
                        Analisa Kekalahan Tender
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Alasan Kekalahan (Master GAP-12)</label>
                          <select
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs bg-white text-slate-800"
                          >
                            <option value="">Pilih Alasan Utama...</option>
                            <option value="harga">Harga Penawaran Terlalu Tinggi</option>
                            <option value="teknis">Skor Teknis Dibawah Ambang Batas</option>
                            <option value="admin">Ketidaklengkapan Administrasi</option>
                            <option value="pesaing">Kompetitor Memiliki Pengalaman Spesifik</option>
                            <option value="internal">Pembatalan Tender oleh Owner</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Kekalahan</label>
                          <textarea
                            value={failureReason}
                            className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs resize-none text-slate-800"
                            placeholder="Berikan detail tambahan mengenai penyebab kekalahan atau poin-poin yang perlu diperbaiki untuk tender mendatang..."
                            rows={6}
                          />
                        </div>
                        <div className="flex items-center p-3 bg-danger/5 rounded-lg border border-danger/10">
                          <span className="material-symbols-outlined text-danger mr-3">info</span>
                          <p className="text-xs text-danger">Data ini akan digunakan untuk laporan efektivitas tender di akhir kuartal.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* EMPTY STATE */
                    <div className="bg-slate-50 rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                      <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">pending_actions</span>
                      <h4 className="font-heading-section text-base font-bold text-slate-500">Hasil Tender Belum Dipilih</h4>
                      <p className="text-on-surface-variant max-w-sm mt-2 text-xs text-slate-400">Pilih hasil tender di sisi kiri untuk melengkapi data penutupan proyek.</p>
                    </div>
                  )}
                </section>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4 border-t pt-6 border-border">
                <button
                  type="button"
                  onClick={() => onShowNotification('Draf hasil tender berhasil disimpan.', 'success')}
                  className="px-6 py-2.5 rounded-lg border border-border bg-white text-secondary hover:bg-slate-50 transition-all font-semibold text-xs flex items-center"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">drafts</span> Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={handleApplyWinnerOutcome}
                  className="px-8 py-2.5 rounded-lg bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-semibold text-xs flex items-center gap-2"
                >
                  Konfirmasi &amp; Selesaikan
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: TARGET DELIVERY */}
          {activeTab === 'Target Delivery' && (
            <div className="space-y-8 animate-fade-in text-slate-800">
              <div className="grid grid-cols-12 gap-8">
                {/* Form Input Section */}
                <div className="col-span-12 lg:col-span-8 bg-white border border-border rounded-xl shadow-sm p-8 space-y-8">
                  <div>
                    <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-primary">local_shipping</span>
                      Input Jadwal Pengiriman (Delivery Schedule)
                    </h3>
                    <p className="text-xs text-secondary">Silakan tentukan perkiraan tanggal mulai pengiriman material serta target estimasi kedatangan di lokasi proyek.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Mulai Delivery</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">calendar_month</span>
                          <input
                            type="date"
                            defaultValue="2026-06-20"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Estimasi Tanggal Sampai</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">event_available</span>
                          <input
                            type="date"
                            defaultValue="2026-06-28"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Instruksi Logistik</label>
                      <div className="relative">
                        <textarea
                          rows={6}
                          defaultValue="Kirim bertahap menggunakan kontainer transit utama. Seluruh armada truk wajib melewati ruko pengecekan berat muatan di gerbang exit tol barat."
                          className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none text-slate-800"
                          placeholder="Masukkan rincian khusus logistik atau persyaratan khusus di lapangan..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-4 border-t pt-6 border-border">
                    <button
                      type="button"
                      onClick={() => onShowNotification('Draf jadwal delivery berhasil disimpan.', 'success')}
                      className="px-6 py-2.5 rounded-lg border border-border bg-white text-secondary hover:bg-slate-50 transition-all font-semibold text-xs flex items-center"
                    >
                      <span className="material-symbols-outlined mr-2 text-[18px]">drafts</span> Simpan Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowNotification('Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi.', 'success')}
                      className="px-8 py-2.5 rounded-lg bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-semibold text-xs flex items-center gap-2"
                    >
                      Konfirmasi &amp; Selesaikan
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </div>
                </div>

                {/* Right Column Logistics Info Panel */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="bg-white border border-border rounded-xl shadow-sm p-6 space-y-6">
                    <h4 className="font-heading-section text-xs font-bold text-on-surface uppercase tracking-wider">Metrik Logistik</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                        <span className="text-secondary font-medium">Entitas Klien</span>
                        <span className="font-semibold text-slate-800">PT. PLN (Persero)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                        <span className="text-secondary font-medium">Nilai Proyek</span>
                        <span className="font-semibold text-slate-800 text-primary">Rp 1.420.000.000</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                        <span className="text-secondary font-medium">Rute Distribusi</span>
                        <span className="font-semibold text-slate-800">Jakarta Barat Gateway</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary font-medium">Sektor Pekerjaan</span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">Tender Sipil</span>
                      </div>
                    </div>
                  </div>

                  {/* Satellite Map Preview card */}
                  <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <span className="material-symbols-outlined mr-1.5 text-slate-400 text-[18px]">map</span>
                        Pratinjau Distribusi
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">Aktif</span>
                    </div>
                    <div className="relative h-44 bg-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        referrerPolicy="no-referrer"
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&amp;fit=crop&amp;w=400&amp;q=80"
                        alt="Logistics Map"
                        className="w-full h-full object-cover filter brightness-90 saturate-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 text-white flex flex-col">
                        <span className="text-[10px] font-mono tracking-wider opacity-90 uppercase">Transit Center Jakarta</span>
                        <span className="text-xs font-bold drop-shadow">Hub Rungkut, Gate #3 Depot</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: TIMELINE */}
          {activeTab === 'Timeline' && (
            <div className="space-y-8 animate-fade-in text-slate-800">
              {/* Header with filter buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 border border-border rounded-xl shadow-sm gap-4">
                <div>
                  <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
                    <span className="material-symbols-outlined mr-2 text-primary">history</span>
                    Timeline Audit Trail Proyek
                  </h3>
                  <p className="text-secondary text-xs mt-1">Daftar lengkap riwayat aktivitas, pengunggahan dokumen, dan persetujuan sepanjang siklus proyek.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full shadow-sm hover:brightness-110 cursor-pointer">Semua</button>
                  <button type="button" className="px-4 py-1.5 bg-slate-50 border border-border text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-100 cursor-pointer">Update Status</button>
                  <button type="button" className="px-4 py-1.5 bg-slate-50 border border-border text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-100 cursor-pointer">Dokumen</button>
                </div>
              </div>

              {/* Day Header & Events List */}
              <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 before:dashed before:z-0">
                
                {/* Date division */}
                <div className="relative z-10 flex items-center">
                  <div className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    Hari Ini, Tanggal Penginputan
                  </div>
                </div>

                {/* Event 1: Final Approval */}
                <div className="relative z-10 grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-11 bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Validasi &amp; Persetujuan Project Manager</h4>
                        <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          Ahmad Subarjo • Project Manager
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium">10:45 AM (Paling Baru)</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border-l-4 border-primary">
                      "Seluruh berkas administrasi dan RKS telah divalidasi dan siap untuk didaftarkan ke portal tender e-Procurement PLN."
                    </p>
                  </div>
                </div>

                {/* Event 2: Status Transition */}
                <div className="relative z-10 grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                    <div className="w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-11 bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Status Transisi &amp; Pembukaan Berkas</h4>
                        <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px]">settings</span>
                          Sistem Otomatisasi • System
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium">09:12 AM</span>
                    </div>
                    <div className="flex items-center gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200 w-fit">
                      <span className="text-xs font-semibold text-amber-800">Draf Awal</span>
                      <span className="material-symbols-outlined text-amber-600 text-sm">arrow_forward</span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Menunggu Review RKS</span>
                    </div>
                  </div>
                </div>

                {/* Date division */}
                <div className="relative z-10 flex items-center">
                  <div className="bg-slate-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    Kemarin, 18 Juni 2026
                  </div>
                </div>

                {/* Event 3: Document Uploaded */}
                <div className="relative z-10 grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-11 bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Dokumen Penawaran Teknis Diunggah</h4>
                        <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          Ahmad Subarjo • Project Manager
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium">04:30 PM</span>
                    </div>
                    
                    {/* File Attachment Card */}
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors w-full sm:w-2/3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">RKS_Tahap_1_Pondasi_Final.pdf</p>
                          <p className="text-[10px] text-slate-400">4.2 MB • Versi v2.4</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onShowNotification('Mengunduh berkas...', 'success')}
                        className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event 4: Price Alteration */}
                <div className="relative z-10 grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-11 bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Penyesuaian Nilai Penawaran Awal</h4>
                        <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          Siti Aminah • Estimator
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono">03:15 PM</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-border flex flex-col">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Nilai Sebelumnya</span>
                        <span className="text-sm font-semibold text-slate-500 line-through">Rp 1.350.000.000</span>
                      </div>
                      <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100 flex flex-col">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-rose-600">Nilai Menjadi</span>
                        <span className="text-sm font-bold text-rose-700">Rp 1.420.000.000</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic mt-3">
                      "Penyesuaian estimasi overhead serta penyesuaian harga beton cor K-350 sesuai survey lokal terbaru."
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Load Older Button */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => onShowNotification('Seluruh histori telah ditampilkan.', 'success')}
                  className="px-6 py-2 border border-border bg-white text-secondary hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors inline-flex items-center"
                >
                  <span className="material-symbols-outlined mr-1.5 text-[18px]">expand_more</span>
                  Muat Riwayat Lebih Lama
                </button>
              </div>
            </div>
          )}

          {/* TAB 10: DOKUMEN REPOSITORY */}
          {activeTab === 'Dokumen' && (
            <div className="space-y-8 animate-fade-in text-slate-800">
              
              {/* Folder statistics header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
                    <span className="material-symbols-outlined mr-2 text-primary">folder_open</span>
                    Dokumen Repository &amp; File Manager
                  </h3>
                  <p className="text-secondary text-xs mt-1">Kelola seluruh draf berkas, arsip RKS, data LPHS, serta dokumen penawaran harga secara terpusat.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenUploadDrawer(true)}
                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-lg shadow-sm hover:brightness-110 flex items-center gap-2 cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Unggah Dokumen Baru
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">folder</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Total Dokumen</p>
                    <p className="font-bold text-base text-slate-700">42 Files</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <span className="material-symbols-outlined text-2xl">storage</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Penyimpanan</p>
                    <p className="font-bold text-base text-slate-700">1.2 GB / 5 GB</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-2xl">update</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Gubahan Terbaru</p>
                    <p className="font-bold text-base text-slate-700">12 Hari Ini</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <span className="material-symbols-outlined text-2xl">fact_check</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Persetujuan Pending</p>
                    <p className="font-bold text-base text-slate-700">8 Dokumen</p>
                  </div>
                </div>
              </div>

              {/* Document Groups Accordions */}
              <div className="space-y-4">
                
                {/* RKS Accordion */}
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleDocGroup('RKS')}
                    className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-all font-semibold outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">RKS</span>
                      <div className="text-left">
                        <span className="text-sm font-bold text-slate-750 block">Rencana Kerja &amp; Syarat-Syarat</span>
                        <span className="text-[10px] text-slate-400 font-normal">2 draf dokumen diunggah</span>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${docsOpened.RKS ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {docsOpened.RKS && (
                    <div className="border-t border-border bg-white">
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-405 border-b border-border">
                        <div className="col-span-8 sm:col-span-6">Nama File</div>
                        <div className="hidden sm:block col-span-2 text-center">Versi</div>
                        <div className="col-span-2">Pengunggah</div>
                        <div className="col-span-2 text-right">Aksi</div>
                      </div>
                      <div className="divide-y divide-border">
                        <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/60 transition-all">
                          <div className="col-span-8 sm:col-span-6 flex items-center gap-3 truncate">
                            <span className="material-symbols-outlined text-red-500 text-3xl shrink-0">picture_as_pdf</span>
                            <div className="truncate">
                              <p className="text-xs font-bold truncate text-slate-700">RKS_Tahap_1_Pondasi_Final.pdf</p>
                              <p className="text-[10px] text-slate-400">4.2 MB • Diupload 12 Okt 2025</p>
                            </div>
                          </div>
                          <div className="hidden sm:block col-span-2 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold rounded text-[10px]">v2.4</span>
                          </div>
                          <div className="col-span-2 text-xs text-slate-500 truncate">Ahmad Subarjo</div>
                          <div className="col-span-2 text-right flex justify-end gap-1 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryExpanded({ ...historyExpanded, rks_pm: !historyExpanded['rks_pm'] });
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${historyExpanded.rks_pm ? 'bg-slate-100 text-primary' : 'hover:bg-slate-100 text-slate-400'}`}
                              title="Riwayat Versi"
                            >
                              <span className="material-symbols-outlined text-[18px]">history</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onShowNotification('Sistem mengunduh RKS_Tahap_1_Pondasi_Final.pdf (4.2 MB)', 'success')}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Version History with nice list style */}
                        {historyExpanded.rks_pm && (
                          <div className="bg-slate-50/60 px-8 sm:px-16 py-4 space-y-3 border-t border-b border-border/60">
                            <p className="text-[9px] font-bold text-slate-450 tracking-wider uppercase flex items-center">
                              <span className="material-symbols-outlined text-xs mr-1 text-slate-400">history_edu</span>
                              Arsip Riwayat Versi Terdahulu (GAP-14 Revision Tracking)
                            </p>
                            <div className="divide-y divide-border/40">
                              <div className="flex justify-between items-center text-xs py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold bg-slate-200 text-slate-650 px-1.5 py-0.5 rounded">v2.3</span>
                                  <span className="font-medium text-slate-600 text-xs">RKS_Tahap_1_Pondasi_Draft_B.pdf (4.0 MB)</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Diunggah 05 Okt 2025 • PM</span>
                                <span onClick={() => onShowNotification('Mengunduh draft versi v2.3...', 'success')} className="material-symbols-outlined text-slate-400 text-[18px] cursor-pointer hover:text-primary transition-colors">download</span>
                              </div>
                              <div className="flex justify-between items-center text-xs py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold bg-slate-200 text-slate-655 px-1.5 py-0.5 rounded">v2.0</span>
                                  <span className="font-medium text-slate-600 text-xs">RKS_Tahap_1_Pondasi_Initial.pdf (3.8 MB)</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Diunggah 28 Sep 2025 • PM</span>
                                <span onClick={() => onShowNotification('Mengunduh draft versi v2.0...', 'success')} className="material-symbols-outlined text-slate-400 text-[18px] cursor-pointer hover:text-primary transition-colors">download</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Other simulated accordion panels */}
                {['LPHS', 'SIOS', 'Harga', 'MISC'].map((grp) => {
                  const grpTitles: Record<string, string> = {
                    LPHS: 'Laporan Penilaian Harga Satuan',
                    SIOS: 'Surat Instruksi Operasional Site',
                    Harga: 'Dokumen Penawaran Harga Final',
                    MISC: 'Dokumen Lampiran & Foto Lapangan'
                  };

                  const isOpened = docsOpened[grp];

                  return (
                    <div key={grp} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleDocGroup(grp)}
                        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-all font-semibold outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{grp}</span>
                          <div className="text-left">
                            <span className="text-sm font-bold text-slate-750 block">{grpTitles[grp]}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {grp === 'MISC' ? '1 file terlampir' : 'Kategori folder kosong'}
                            </span>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isOpened ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {isOpened && (
                        <div className="border-t border-border bg-white">
                          {grp === 'MISC' ? (
                            /* MISC has some sample files */
                            <div className="divide-y divide-border">
                              <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/60 transition-all">
                                <div className="col-span-8 sm:col-span-6 flex items-center gap-3 truncate">
                                  <span className="material-symbols-outlined text-sky-500 text-3xl shrink-0">folder_zip</span>
                                  <div className="truncate">
                                    <p className="text-xs font-bold truncate text-slate-700">Site_Photos_Sept_2023.zip</p>
                                    <p className="text-[10px] text-slate-400">128 MB • Diupload 28 Sep 2025</p>
                                  </div>
                                </div>
                                <div className="hidden sm:block col-span-2 text-center">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded text-[10px]">v1.0</span>
                                </div>
                                <div className="col-span-2 text-xs text-slate-500 truncate">Siti Aminah</div>
                                <div className="col-span-2 text-right flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onShowNotification('Mengunduh Site_Photos_Sept_2023.zip (128 MB)...', 'success')}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                                    title="Download"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Empty folders layout */
                            <div className="p-10 text-center text-slate-400 text-xs italic border-t border-border bg-slate-50/40">
                              <span className="material-symbols-outlined text-3xl mb-2 text-slate-300 block">inventory_2</span>
                              Belum ada dokumen yang terunggah dalam kategori <span className="font-bold text-slate-500">{grpTitles[grp]} ({grp})</span>.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

              {/* Side Upload Drawer Overlay */}
              {isOpenUploadDrawer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in transition-opacity">
                  <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform animate-slide-in duration-300">
                    
                    {/* Drawer Header */}
                    <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                          Unggah Dokumen Tambahan
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Siklus pengunggahan instan &amp; pelacakan versi</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOpenUploadDrawer(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {/* Drawer Body Forms */}
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                      
                      {/* Name input */}
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nama Dokumen</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-850"
                          placeholder="Masukkan nama berkas..."
                        />
                      </div>

                      {/* Category select dropdown */}
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Kategori Folder</label>
                        <select className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800 bg-white">
                          <option value="RKS">Rencana Kerja &amp; Syarat-Syarat (RKS)</option>
                          <option value="LPHS">Laporan Penilaian Harga Satuan (LPHS)</option>
                          <option value="SIOS">Surat Instruksi Operasional Site (SIOS)</option>
                          <option value="Harga">Dokumen Penawaran Harga Final</option>
                          <option value="MISC">Dokumen Lampiran &amp; Foto Lapangan (MISC)</option>
                        </select>
                      </div>

                      {/* Draggable Dropzone area */}
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">File Ungguhan</label>
                        <div
                          onClick={() => onShowNotification('Sistem penyeretan / pemilihan berkas disimulasikan.', 'success')}
                          className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 hover:border-primary/50 transition-all cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                          <p className="text-xs font-semibold text-secondary">Klik untuk pilih berkas komputer</p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX, atau ZIP (Maks 50MB)</p>
                        </div>
                      </div>

                      {/* Additive Notes description */}
                      <div>
                        <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Tambahan (Opsional)</label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none text-slate-850"
                          placeholder="Tambahkan catatan singkat perubahan revisi berkas ini..."
                        />
                      </div>

                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsOpenUploadDrawer(false)}
                        className="px-4 py-2 rounded-lg border border-border bg-white text-secondary text-xs font-semibold hover:bg-slate-100 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onShowNotification('Dokumen berhasil diunggah dan disimpan ke repositori.', 'success');
                          setIsOpenUploadDrawer(false);
                        }}
                        className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors"
                      >
                        Simpan &amp; Upload
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
