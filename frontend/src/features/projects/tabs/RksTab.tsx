import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { Stepper, type StepperStep } from '@/components/ui';

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

  // Initialize from project.rks or defaults
  const [nomorTender, setNomorTender] = useState(project?.rks?.nomorTender || '');
  const [namaTender, setNamaTender] = useState(project?.rks?.namaTender || project?.name || '');
  const [deadlineTender, setDeadlineTender] = useState(project?.rks?.deadlineTender || project?.deadlineTender || '');
  const [aanwijzing, setAanwijzing] = useState(project?.rks?.aanwijzing || 'Tidak / Belum Ada');
  const [workLocation, setWorkLocation] = useState(project?.rks?.workLocation || project?.location || '');
  const [mainScope, setMainScope] = useState(project?.rks?.mainScope || '');
  const [additionalNotes, setAdditionalNotes] = useState(project?.rks?.additionalNotes || '');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; time: string }>>(project?.rks?.uploadedFiles || []);

  // Answers state for RKS questions
  const [answers, setAnswers] = useState<Record<string, string>>(project?.rks?.answers || {});

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Sync when switching projects
  useEffect(() => {
    setNomorTender(project?.rks?.nomorTender || '');
    setNamaTender(project?.rks?.namaTender || project?.name || '');
    setDeadlineTender(project?.rks?.deadlineTender || project?.deadlineTender || '');
    setAanwijzing(project?.rks?.aanwijzing || 'Tidak / Belum Ada');
    setWorkLocation(project?.rks?.workLocation || project?.location || '');
    setMainScope(project?.rks?.mainScope || '');
    setAdditionalNotes(project?.rks?.additionalNotes || '');
    setUploadedFiles(project?.rks?.uploadedFiles || []);
    setAnswers(project?.rks?.answers || {});
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
    updateProjectRks(project.id, {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
    });
  };

  const handleSubmit = () => {
    if (!project?.id) return;
    // Persist RKS data first
    updateProjectRks(project.id, {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
    });
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

  const handlePertanyaanSubmit = () => {
    if (!project?.id) return;
    // Save all RKS data including answers
    updateProjectRks(project.id, {
      nomorTender,
      namaTender,
      deadlineTender,
      aanwijzing,
      workLocation,
      mainScope,
      additionalNotes,
      uploadedFiles,
      answers,
    });
    // Update project status & phase
    updateProject(project.id, { status: 'Review RKS', phase: 'Review RKS' });
    // Add timeline event
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
    // Auto-navigate to Review RKS tab
    navigate(`/project/${project.id}/review-rks`);
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
      </div>

      <Stepper steps={RKS_STEPS} currentStep={currentStep} />

      {currentStep === 0 && (
        <div className="space-y-6">
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

          <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
                <span className="material-symbols-outlined">upload_file</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-slate-800">Dokumen RKS & Lampiran</h3>
                <p className="text-secondary text-xs">Unggah lembar acuan RKS resmi dari pihak klien.</p>
              </div>
            </div>

            <div
              onClick={handleUpload}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
              <p className="font-label-sm text-sm text-slate-700 mb-1">
                Drag and drop file here, atau <span className="text-primary font-semibold hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-400">PDF atau DOCX format (Max size: 25MB)</p>
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
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                      className="p-1.5 hover:bg-red-50 hover:text-danger rounded-lg transition-colors text-slate-400"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

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
                  {['Ya, Terjadwal', 'Tidak / Belum Ada'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="aanwijzing_opt"
                        checked={aanwijzing === opt}
                        onChange={() => setAanwijzing(opt)}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <span className="text-sm text-slate-700 font-medium">{opt}</span>
                    </label>
                  ))}
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

          <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
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
            </div>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm w-full"
              placeholder="Masukkan instruksi khusus atau catatan untuk tim review..."
              rows={4}
            />
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Pastikan semua data telah diisi sebelum submit.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleSave} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-white border border-border text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all">
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
          <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">help</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-slate-800">Pertanyaan RKS</h3>
                <p className="text-secondary text-xs">Jawab pertanyaan berikut untuk melengkapi data RKS.</p>
              </div>
            </div>

            {rksQuestions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">help_outline</span>
                <p className="text-sm">Belum ada pertanyaan RKS yang tersedia.</p>
                <p className="text-xs mt-1">Silakan tambahkan pertanyaan di menu Master Data.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {rksQuestions.map((q: any, index: number) => {
                  const typeCode = getQuestionTypeCode(q.question_type_id);
                  return (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-semibold text-sm text-slate-700 mb-3">
                        {index + 1}. {q.question_text}
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {(typeCode === 'text' || typeCode === 'textarea') && (
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-border rounded-lg resize-none text-sm"
                          placeholder={q.placeholder_text || 'Jawab pertanyaan ini...'}
                          rows={typeCode === 'textarea' ? 4 : 2}
                        />
                      )}
                      {typeCode === 'number' && (
                        <input
                          type="number"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm"
                          placeholder={q.placeholder_text || 'Masukkan angka...'}
                        />
                      )}
                      {typeCode === 'date' && (
                        <input
                          type="date"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm"
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
                                className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                              />
                              <span className="text-sm text-slate-700 font-medium">{opt}</span>
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
                                className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                              />
                              <span className="text-sm text-slate-700 font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {typeCode === 'select' && (
                        <select
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm"
                        >
                          <option value="">Pilih jawaban...</option>
                          {(q.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {q.help_text && (
                        <p className="text-xs text-slate-400 mt-2">{q.help_text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Pastikan semua pertanyaan telah dijawab sebelum submit.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setCurrentStep(0)} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-white border border-border text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
              </button>
              <button onClick={handlePertanyaanSubmit} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2">
                Kirim Jawaban
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
