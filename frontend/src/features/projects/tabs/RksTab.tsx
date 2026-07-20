import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useAuthStore } from '@/stores/authStore';
import { Stepper, type StepperStep } from '@/components/ui';
import { UPLOAD } from '@/config/constants';
import type { RbacDepartment } from '@/stores/rbacStore';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const RKS_STEPS: StepperStep[] = [
  { label: 'RKS' },
  { label: 'Pertanyaan' },
  { label: 'Departemen Reviewer' },
];

export default function RksTab({ project, onShowNotification }: TabProps) {
  const navigate = useNavigate();
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectRks = useProjectStore((s) => s.updateProjectRks);
  const updateRksDepartmentApproval = useProjectStore((s) => s.updateRksDepartmentApproval);
  const updateRksStatus = useProjectStore((s) => s.updateRksStatus);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const departments = useMasterDataStore((s) => s.departments as unknown as RbacDepartment[]);
  const addApproval = useApprovalStore((s) => s.addApproval);
  const authUser = useAuthStore((s) => s.user);

  const [currentStep, setCurrentStep] = useState(0);

  // Filter questions for RKS context (context === 'rks' or 'both'), active, sorted by sort_order
  const rksQuestions = useMemo(() => {
    return questions
      .filter((q: any) => {
        if (!q.is_active) return false;
        if (q.context === 'rks' || q.context === 'both') return true;
        if (!q.context) return true; // fallback for old data without context
        return false;
      })
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
  }, [questions]);

  // Helper to get question type code from question_type_id
  const getQuestionTypeCode = (questionTypeId: string): string => {
    const qt = questionTypes.find((t: any) => t.id === questionTypeId);
    return qt?.code || 'text';
  };

  const toDateInput = (v: any) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  // Initialize from project.rks or defaults
  const [nomorTender, setNomorTender] = useState(project?.rks?.nomorTender || '');
  const [namaTender, setNamaTender] = useState(project?.rks?.namaTender || project?.name || '');
  const [deadlineTender, setDeadlineTender] = useState(toDateInput(project?.rks?.deadlineTender || project?.deadlineTender));
  const [aanwijzing, setAanwijzing] = useState(project?.rks?.aanwijzing || 'Tidak / Belum Ada');
  const [workLocation, setWorkLocation] = useState(project?.rks?.workLocation || project?.location || '');
  const [mainScope, setMainScope] = useState(project?.rks?.mainScope || '');
  const [additionalNotes, setAdditionalNotes] = useState(project?.rks?.additionalNotes || '');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; time: string; progress?: number }>>(project?.rks?.uploadedFiles || []);
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Department review state
  const [selectedDepts, setSelectedDepts] = useState<string[]>(project?.rks?.selectedDepartments || []);
  const activeDepartments = useMemo(() => {
    if ((project?.type === 'Tender' || project?.type === 'tender') && project?.scopeDepartments && project.scopeDepartments!.length > 0) {
      return departments.filter(d => d.is_active && project.scopeDepartments!.includes(d.id));
    }
    return departments.filter(d => d.is_active);
  }, [departments, project?.scopeDepartments, project?.type]);

  const toggleDept = (deptId: string) => {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  // Answers state for RKS questions
  const [answers, setAnswers] = useState<Record<string, string>>(project?.rks?.answers || {});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [submitting, setSubmitting] = useState(false);

  // ── Auto-save answers to backend & store ─────────────────────────────
  // Ref untuk mengakses nilai terkini di dalam debounce tanpa re-trigger
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const fieldsRef = useRef({ nomorTender, namaTender, deadlineTender, aanwijzing, workLocation, mainScope, additionalNotes, uploadedFiles });
  fieldsRef.current = { nomorTender, namaTender, deadlineTender, aanwijzing, workLocation, mainScope, additionalNotes, uploadedFiles };

  // Tulis ke Zustand store secara synchronous setiap answers berubah
  // sehingga data selamat meski komponen unmount (persist middleware)
  useEffect(() => {
    if (!project?.id) return;
    const store = useProjectStore.getState();
    const current = store.entities[project.id];
    if (!current) return;
    const f = fieldsRef.current;
    const rksData = {
      nomorTender: f.nomorTender,
      namaTender: f.namaTender,
      deadlineTender: f.deadlineTender,
      aanwijzing: f.aanwijzing,
      workLocation: f.workLocation,
      mainScope: f.mainScope,
      additionalNotes: f.additionalNotes,
      uploadedFiles: f.uploadedFiles,
      answers,
    };
    useProjectStore.setState((s) => ({
      entities: {
        ...s.entities,
        [project.id]: { ...current, rks: rksData },
      },
    }));
  }, [answers, project?.id]);

  // Debounce backend save — 2 detik setelah perubahan terakhir
  useEffect(() => {
    if (!project?.id) return;
    if (Object.keys(answers).length === 0) return;

    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      const f = fieldsRef.current;
      const rksData = {
        nomorTender: f.nomorTender,
        namaTender: f.namaTender,
        deadlineTender: f.deadlineTender,
        aanwijzing: f.aanwijzing,
        workLocation: f.workLocation,
        mainScope: f.mainScope,
        additionalNotes: f.additionalNotes,
        uploadedFiles: f.uploadedFiles,
        answers: answersRef.current,
      };
      updateProjectRks(project.id, rksData)
        .then(() => setAutoSaveStatus('saved'))
        .catch(() => {
          setAutoSaveStatus('unsaved');
          toast.error('Gagal menyimpan jawaban ke server');
        });
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, project?.id]);

  // Simpan saat komponen akan unmount (pindah tab)
  useEffect(() => {
    return () => {
      const f = fieldsRef.current;
      const ans = answersRef.current;
      if (!project?.id || Object.keys(ans).length === 0) return;
      const rksData = {
        nomorTender: f.nomorTender,
        namaTender: f.namaTender,
        deadlineTender: f.deadlineTender,
        aanwijzing: f.aanwijzing,
        workLocation: f.workLocation,
        mainScope: f.mainScope,
        additionalNotes: f.additionalNotes,
        uploadedFiles: f.uploadedFiles,
        answers: ans,
      };
      updateProjectRks(project.id, rksData);
    };
  }, [project?.id]);

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Sync when switching projects
  useEffect(() => {
    const rawAnswers = project?.rks?.answers;
    const parsed = !rawAnswers ? {} : typeof rawAnswers === 'string' ? (() => { try { return JSON.parse(rawAnswers); } catch { return {}; } })() : rawAnswers;
    setNomorTender(project?.rks?.nomorTender || '');
    setNamaTender(project?.rks?.namaTender || project?.name || '');
    setDeadlineTender(toDateInput(project?.rks?.deadlineTender || project?.deadlineTender));
    setAanwijzing(project?.rks?.aanwijzing || 'Tidak / Belum Ada');
    setWorkLocation(project?.rks?.workLocation || project?.location || '');
    setMainScope(project?.rks?.mainScope || '');
    setAdditionalNotes(project?.rks?.additionalNotes || '');
    setUploadedFiles(project?.rks?.uploadedFiles || []);
    setAnswers(parsed);
  }, [project?.id]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.doc';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > UPLOAD.MAX_FILE_SIZE_MB) {
        toast.error(`File terlalu besar. Maksimal ${UPLOAD.MAX_FILE_SIZE_MB}MB`);
        return;
      }

      if (sizeMB > UPLOAD.LARGE_FILE_WARNING_MB) {
        const proceed = window.confirm(`File berukuran ${sizeMB.toFixed(1)}MB (di atas ${UPLOAD.LARGE_FILE_WARNING_MB}MB). Tetap upload?`);
        if (!proceed) return;
      }

      setFileSizeWarning(sizeMB > UPLOAD.LARGE_FILE_WARNING_MB ? `File besar (${sizeMB.toFixed(1)}MB). Upload mungkin memakan waktu.` : null);
      setUploading(true);
      setUploadProgress(0);

      // Simulasi progress bar untuk upload file besar
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 15;
          return next >= 95 ? 95 : next;
        });
      }, 300);

      // Simulasi waktu upload berdasarkan ukuran file
      const uploadTime = Math.min(3000, Math.max(500, sizeMB * 60));
      await new Promise(resolve => setTimeout(resolve, uploadTime));

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedFiles(prev => [...prev, { name: file.name, size: `${sizeMB.toFixed(1)} MB`, time: 'Just now', progress: 100 }]);
      setUploading(false);
      setFileSizeWarning(null);
      toast.success('File berhasil diupload');
    };
    input.click();
  };

  const handleDeleteFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    setFileSizeWarning(null);
  };

  const handleSave = () => {
    if (!project?.id) return;
    const rksData = {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
      answers,
    };
    updateProjectRks(project.id, rksData);
  };

  const handleSubmit = () => {
    if (!project?.id) return;
    // Persist RKS data first
    const rksData = {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
      answers,
    };
    updateProjectRks(project.id, rksData);
    // Add timeline event
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'RKS Disubmit',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'submit',
      description: 'RKS berhasil dikirim ke tim review.',
    };
    addTimelineEvent(project.id, event);
    // Advance to Pertanyaan step
    setCurrentStep(1);
  };

  const handlePertanyaanSubmit = async () => {
    if (!project?.id) return;
    const rksData = {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
      answers: answersRef.current,
    };
    try {
      await updateProjectRks(project.id, rksData);
      setAutoSaveStatus('saved');
    } catch {
      toast.error('Gagal menyimpan RKS ke server');
      return;
    }
    setCurrentStep(2);
  };

  const handleDeptSubmit = async () => {
    if (!project?.id || submitting) return;
    if (selectedDepts.length === 0) {
      toast.error('Minimal 1 departemen harus dipilih');
      return;
    }
    setSubmitting(true);

    const deptApprovals = selectedDepts.map(deptId => {
      const dept = departments.find(d => d.id === deptId);
      return {
        departmentId: deptId,
        departmentName: dept?.name || deptId,
        status: 'reviewing',
        revisionRound: 0,
      };
    });

    const rksData = {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
      answers: answersRef.current,
      selectedDepartments: selectedDepts,
      departmentsLocked: true,
      overallStatus: 'dept_review',
      departmentApprovals: deptApprovals,
    } as any;

    try {
      await updateProjectRks(project.id, rksData);

      if (project.type === 'prospecting') {
        await updateProject(project.id, { status: 'Input Harga', phase: 'Harga' });
        const event: TimelineEvent = {
          id: `evt-${Date.now()}`,
          title: 'RKS Disubmit (Prospecting)',
          actor: project.author,
          role: 'Project Manager',
          time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          type: 'submit',
          description: 'RKS, pertanyaan, dan departemen reviewer telah disubmit.',
        };
        addTimelineEvent(project.id, event);
        onShowNotification?.('RKS berhasil dikirim. Melanjutkan ke tahap Harga...', 'success');
        navigate(`/projects/${project.id}/harga`);
      } else {
        await updateProject(project.id, { status: 'Review RKS', phase: 'Review RKS' });
        addApproval({
          id: `app-rks-${project.id}-${Date.now()}`,
          ref: `RKS-${project.code}`,
          name: project.name,
          branch: project.location,
          waitingSince: new Date().toISOString(),
          slaStatus: 'Normal',
          type: 'RKS',
          resourceType: 'rks',
          resourceId: project.id,
          client: project.client,
          entityId: project.id,
          entityType: 'project',
          assigneeUserId: authUser?.id,
        });
        const event: TimelineEvent = {
          id: `evt-${Date.now()}`,
          title: 'RKS Disubmit ke Review Multi-Departemen',
          actor: project.author,
          role: 'Project Manager',
          time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          type: 'submit',
          description: `RKS dan pertanyaan telah disubmit ke ${selectedDepts.length} departemen untuk direview bersama.`,
        };
        addTimelineEvent(project.id, event);
        onShowNotification?.('RKS berhasil dikirim ke departemen reviewer.', 'success');
        navigate(`/projects/${project.id}/review-rks`);
      }
    } catch {
      toast.error('Gagal memperbarui status proyek');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display-title text-xl font-bold text-on-surface">
            {currentStep === 0 ? 'Form Pengisian RKS' : currentStep === 1 ? 'Pertanyaan RKS' : 'Pilih Departemen Reviewer'}
          </h3>
          <p className="font-body-main text-sm text-secondary mt-1">
            Project: {project?.name} ({project?.code})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-warning/10 text-warning text-xs font-semibold rounded-lg border border-warning/20">
          <span className="material-symbols-outlined text-[18px]">lock_clock</span>
          <span className="uppercase tracking-wider">
            {currentStep === 0 ? 'Awaiting Submission' : 'Menunggu Jawaban'}
          </span>
        </div>
        {currentStep === 1 && (
          <div className={`flex items-center gap-1.5 self-start px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            autoSaveStatus === 'saved'
              ? 'bg-success/10 text-success border-success/20'
              : autoSaveStatus === 'saving'
                ? 'bg-info/10 text-info border-info/20'
                : 'bg-warning/10 text-warning border-warning/20'
          }`}>
            <span className="material-symbols-outlined text-[16px]">
              {autoSaveStatus === 'saved' ? 'check_circle' : autoSaveStatus === 'saving' ? 'sync' : 'cloud_off'}
            </span>
            <span>
              {autoSaveStatus === 'saved' ? 'Tersimpan' : autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Belum tersimpan'}
            </span>
          </div>
        )}
      </div>

      <Stepper steps={RKS_STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      {currentStep === 0 && (
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">assignment</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-on-surface">Informasi Tender Utama</h3>
                <p className="text-secondary text-xs">Identitas nomor tender dan nama paket di portal e-proc.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant">Nomor Tender</label>
                <input
                  value={nomorTender}
                  onChange={(e) => setNomorTender(e.target.value)}
                  className="px-4 py-2.5 bg-background border border-border rounded-lg font-mono text-sm"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant">Nama Tender</label>
                <input
                  value={namaTender}
                  onChange={(e) => setNamaTender(e.target.value)}
                  className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant">Deadline Tender</label>
                <input
                  value={deadlineTender}
                  onChange={(e) => setDeadlineTender(e.target.value)}
                  className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                  type="date"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
                <span className="material-symbols-outlined">upload_file</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-on-surface">Dokumen RKS & Lampiran</h3>
                <p className="text-secondary text-xs">Unggah lembar acuan RKS resmi dari pihak klien.</p>
              </div>
            </div>

            <div
              onClick={uploading ? undefined : handleUpload}
              className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined text-4xl text-primary mb-3 animate-spin">sync</span>
                  <p className="font-label-sm text-sm text-primary mb-1">Mengupload file...</p>
                  <div className="w-full max-w-xs bg-surface-container-highest rounded-full h-2.5 mt-2">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-outline mt-1">{uploadProgress.toFixed(0)}%</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
                  <p className="font-label-sm text-sm text-on-surface mb-1">
                    Drag and drop file here, atau <span className="text-primary font-semibold hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-outline">PDF, DOCX atau DOC format (Max size: {UPLOAD.MAX_FILE_SIZE_MB}MB)</p>
                </>
              )}
            </div>

            {fileSizeWarning && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning mt-3">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{fileSizeWarning}</span>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low border border-border rounded-lg hover:border-border transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-danger shrink-0 text-[32px]">description</span>
                      <div className="truncate">
                        <p className="font-label-sm text-sm font-semibold text-on-surface truncate">{file.name}</p>
                        <p className="text-xs text-outline">{file.size} • Uploaded {file.time}</p>
                        {file.size && parseFloat(file.size) > UPLOAD.LARGE_FILE_WARNING_MB && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-warning mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            File besar
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                      className="p-1.5 hover:bg-danger-container dark:bg-red-950/30 hover:text-danger rounded-lg transition-colors text-outline"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-status-teal/10 text-status-teal flex items-center justify-center">
                <span className="material-symbols-outlined">quiz</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-on-surface">Ketentuan Pelaksanaan Pekerjaan</h3>
                <p className="text-secondary text-xs">Sifat administrasi lapangan dan cakupan teknis proyek.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-surface-container-low rounded-lg border border-border">
                <p className="font-semibold text-xs text-on-surface mb-3">Apakah sudah ada jadwal penjelasan tender (Aanwijzing)?</p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  {['Ya, Terjadwal', 'Tidak / Belum Ada'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="aanwijzing_opt"
                        checked={aanwijzing === opt}
                        onChange={() => setAanwijzing(opt)}
                        className="w-4 h-4 text-primary focus:ring-primary border-border"
                      />
                      <span className="text-sm text-on-surface font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant">Lokasi Pelaksanaan Pekerjaan Resmi</label>
                  <input
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                    placeholder="Contoh: Site Office Area A, Jakarta Selatan"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant">Lingkup Pekerjaan Utama (Scope of Work)</label>
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

          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-status-purple/10 text-status-purple flex items-center justify-center">
                  <span className="material-symbols-outlined">notes</span>
                </span>
                <div>
                  <h3 className="font-heading-section text-base font-bold text-on-surface">Catatan Tambahan Internal</h3>
                  <p className="text-secondary text-xs">Instruksi internal dan konteks non-publik.</p>
                </div>
              </div>
            </div>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm w-full"
              placeholder="Masukkan instruksi khusus atau catatan untuk tim review..."
              rows={4}
            />
          </section>

          <section className="bg-surface-container-low border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-secondary text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Pastikan semua data telah diisi sebelum submit.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleSave} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-surface-container-lowest border border-border text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container transition-all">
                Simpan Draft
              </button>
              <button onClick={handleSubmit} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2">
                Lanjut ke Pertanyaan
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">help</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-on-surface">Pertanyaan RKS</h3>
                <p className="text-secondary text-xs">Jawab pertanyaan berikut untuk melengkapi data RKS.</p>
              </div>
            </div>

            {rksQuestions.length === 0 ? (
              <div className="text-center py-8 text-outline">
                <span className="material-symbols-outlined text-4xl mb-2">help_outline</span>
                <p className="text-sm">Belum ada pertanyaan RKS yang tersedia.</p>
                <p className="text-xs mt-1">Silakan tambahkan pertanyaan di menu Master Data.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {rksQuestions.map((q: any, index: number) => {
                  const typeCode = getQuestionTypeCode(q.question_type_id);
                  return (
                    <div key={q.id} className="p-4 bg-surface-container-low rounded-lg border border-border">
                      <p className="font-semibold text-sm text-on-surface mb-3">
                        {index + 1}. {q.question_text}
                        {q.is_required && <span className="text-danger ml-1">*</span>}
                      </p>
                      {(typeCode === 'text' || typeCode === 'textarea') && (
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-border rounded-lg resize-none text-sm"
                          placeholder={q.placeholder_text || 'Jawab pertanyaan ini...'}
                          rows={typeCode === 'textarea' ? 4 : 2}
                        />
                      )}
                      {typeCode === 'number' && (
                        <input
                          type="number"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-border rounded-lg text-sm"
                          placeholder={q.placeholder_text || 'Masukkan angka...'}
                        />
                      )}
                      {typeCode === 'date' && (
                        <input
                          type="date"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-border rounded-lg text-sm"
                        />
                      )}
                      {typeCode === 'radio' && (
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                          {(q.options || ['Ya', 'Tidak']).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={answers[q.id] === opt}
                                onChange={() => handleAnswerChange(q.id, opt)}
                                className="w-4 h-4 text-primary focus:ring-primary border-border"
                              />
                              <span className="text-sm text-on-surface font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {typeCode === 'checkbox' && (
                        <div className="flex flex-col gap-2">
                          {(q.options || []).map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(answers[q.id] || '').split(',').includes(opt)}
                                onChange={() => {
                                  const current = (answers[q.id] || '').split(',').filter(Boolean);
                                  const next = current.includes(opt)
                                    ? current.filter((v: string) => v !== opt)
                                    : [...current, opt];
                                  handleAnswerChange(q.id, next.join(','));
                                }}
                                className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                              />
                              <span className="text-sm text-on-surface font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {typeCode === 'select' && (
                        <select
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-surface-container-lowest border border-border rounded-lg text-sm"
                        >
                          <option value="">Pilih jawaban...</option>
                          {(q.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {q.help_text && (
                        <p className="text-xs text-outline mt-2">{q.help_text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-surface-container-low border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-secondary text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Pastikan semua pertanyaan telah dijawab sebelum submit.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setCurrentStep(0)} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-surface-container-lowest border border-border text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
              </button>
              <button onClick={handlePertanyaanSubmit} disabled={submitting} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    Mengirim...
                  </>
                ) : (
                  <>
                    {project?.type === 'Prospecting' ? 'Kirim & Lanjut ke Harga' : 'Kirim Jawaban'}
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-on-surface">Pilih Departemen Reviewer</h3>
                <p className="text-secondary text-xs">Pilih departemen yang akan mereview RKS secara bersama.</p>
              </div>
            </div>

            <div className="space-y-2">
              {activeDepartments.length === 0 ? (
                <p className="text-sm text-outline">Tidak ada departemen aktif.</p>
              ) : (
                activeDepartments.map(dept => {
                  const isSelected = selectedDepts.includes(dept.id);
                  return (
                    <div
                      key={dept.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-surface-container-low ${
                        isSelected ? 'bg-primary/5 border-primary/30' : 'bg-surface-container-lowest border-border'
                      }`}
                      onClick={() => toggleDept(dept.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="accent-primary cursor-pointer w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{dept.name}</p>
                        <p className="text-xs text-outline">{dept.code}{dept.description ? ` • ${dept.description}` : ''}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="bg-surface-container-low border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-secondary text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Departemen yang dipilih akan mereview RKS. PM melakukan approval setelah semua departemen approve.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setCurrentStep(1)} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-surface-container-lowest border border-border text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
              </button>
              <button onClick={handleDeptSubmit} disabled={submitting || selectedDepts.length === 0} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Mengirim...</>
                ) : (
                  <>{project?.type === 'Prospecting' ? 'Kirim & Lanjut ke Harga' : 'Kirim ke Review Departemen'}<span className="material-symbols-outlined text-[18px]">send</span></>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
