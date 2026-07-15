import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useAuthStore } from '@/stores/authStore';
import { Stepper, type StepperStep } from '@/components/ui';
import { rksService } from '@/services/rks';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const RKS_STEPS: StepperStep[] = [
  { label: 'RKS' },
  { label: 'Pertanyaan' },
];

export default function RksTab({ project, onShowNotification }: TabProps) {
  const navigate = useNavigate();
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectRks = useProjectStore((s) => s.updateProjectRks);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; time: string }>>(project?.rks?.uploadedFiles || []);

  // Answers state for RKS questions
  const [answers, setAnswers] = useState<Record<string, string>>(project?.rks?.answers || {});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

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

  // Debounce backend save — 1.5 detik setelah perubahan terakhir
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
      Promise.all([
        updateProjectRks(project.id, rksData),
        rksService.save(project.id, rksData),
      ])
        .then(() => setAutoSaveStatus('saved'))
        .catch(() => {
          setAutoSaveStatus('unsaved');
          toast.error('Gagal menyimpan jawaban ke server');
        });
    }, 1500);
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
      rksService.save(project.id, rksData).catch(() => {});
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
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setUploadedFiles(prev => [...prev, { name: file.name, size: `${sizeMB} MB`, time: 'Just now' }]);
      }
    };
    input.click();
  };

  const handleDeleteFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
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
    rksService.save(project.id, rksData).catch(() => toast.error('Gagal menyimpan RKS ke server'));
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
    rksService.save(project.id, rksData).catch(() => toast.error('Gagal menyimpan RKS ke server'));
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
    // Save all RKS data including answers — await to guarantee persistence
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
      await Promise.all([
        updateProjectRks(project.id, rksData),
        rksService.save(project.id, rksData),
      ]);
      setAutoSaveStatus('saved');
    } catch {
      toast.error('Gagal menyimpan RKS ke server');
      return;
    }

    if (project.type === 'prospecting') {
      // Prospecting: skip Review RKS & LPHS/SIOS, langsung ke Harga
      await updateProject(project.id, { status: 'Input Harga', phase: 'Harga' });
      const event: TimelineEvent = {
        id: `evt-${Date.now()}`,
        title: 'RKS Disubmit (Prospecting)',
        actor: project.author,
        role: 'Project Manager',
        time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        type: 'submit',
        description: 'RKS dan pertanyaan telah disubmit. Proyek Prospecting melanjutkan ke tahap Harga.',
      };
      addTimelineEvent(project.id, event);
      onShowNotification?.('RKS berhasil dikirim. Melanjutkan ke tahap Harga...', 'success');
      navigate(`/projects/${project.id}/harga`);
    } else {
      // Tender: tetap ke Review RKS
      await updateProject(project.id, { status: 'Review RKS', phase: 'Review RKS' });
      // Buat approval item untuk PM review
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
        title: 'RKS Disubmit ke Review',
        actor: project.author,
        role: 'Project Manager',
        time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        type: 'submit',
        description: 'RKS dan pertanyaan telah disubmit untuk direview.',
      };
      addTimelineEvent(project.id, event);
      onShowNotification?.('Jawaban berhasil dikirim. Mengalihkan ke Review RKS...', 'success');
      navigate(`/projects/${project.id}/review-rks`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display-title text-xl font-bold text-on-surface">
            {currentStep === 0 ? 'Form Pengisian RKS' : 'Pertanyaan RKS'}
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
              onClick={handleUpload}
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
              <p className="font-label-sm text-sm text-on-surface mb-1">
                Drag and drop file here, atau <span className="text-primary font-semibold hover:underline">browse</span>
              </p>
              <p className="text-xs text-outline">PDF atau DOCX format (Max size: 25MB)</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low border border-border rounded-lg hover:border-border transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-danger shrink-0 text-[32px]">description</span>
                      <div className="truncate">
                        <p className="font-label-sm text-sm font-semibold text-on-surface truncate">{file.name}</p>
                        <p className="text-xs text-outline">{file.size} • Uploaded {file.time}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                      className="p-1.5 hover:bg-red-50 dark:bg-red-950/30 hover:text-danger rounded-lg transition-colors text-outline"
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
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
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
              <button onClick={handlePertanyaanSubmit} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2">
                {project?.type === 'Prospecting' ? 'Kirim & Lanjut ke Harga' : 'Kirim Jawaban'}
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
