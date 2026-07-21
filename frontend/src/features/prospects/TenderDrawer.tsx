import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProspect } from '@/hooks/queries/useProspects';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useActiveOptions } from '@/hooks/useInputConfig';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Drawer, CurrencyInput } from '@/components/ui';
import { prospectService } from '@/services/prospects';

function resolveTypeCode(
  questionTypes: Array<{ id: string; code: string }>,
  typeId: string,
): string {
  const qt = questionTypes.find((t) => t.id === typeId);
  return qt?.code || 'text';
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-1/3 bg-surface-container-high rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-surface-container-high rounded-lg" />
        ))}
      </div>
      <div className="h-5 w-1/4 bg-surface-container-high rounded" />
      <div className="h-10 bg-surface-container-high rounded-lg" />
      <div className="h-20 bg-surface-container-high rounded-lg" />
      <div className="h-5 w-1/3 bg-surface-container-high rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 bg-surface-container-high rounded-lg" />
      ))}
    </div>
  );
}

interface TenderDrawerProps {
  prospectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TenderDrawer({ prospectId, isOpen, onClose }: TenderDrawerProps) {
  const queryClient = useQueryClient();
  const { data: prospect, isLoading } = useProspect(prospectId || undefined);

  // Master data
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const industries = useMasterDataStore((s) => s.industries);
  const competitors = useMasterDataStore((s) => s.competitors);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  const projectTypeOptions = useActiveOptions('project_types');

  // Load master data when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    if (industries.length === 0) fetchEntity('industries');
    if (competitors.length === 0) fetchEntity('competitors');
    if (questions.length === 0) fetchEntity('questions');
    if (questionTypes.length === 0) fetchEntity('questionTypes');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered prospect questions
  const prospectQuestions = useMemo(() => {
    return questions
      .filter(
        (q) => (q.context === 'prospect' || q.context === 'both') && q.is_active,
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [questions]);

  // ── Form state ──

  const [industryId, setIndustryId] = useState('');
  const [providerExisting, setProviderExisting] = useState('');
  const [projectType, setProjectType] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>(undefined);
  const [closingDate, setClosingDate] = useState('');
  const [source, setSource] = useState<'ho' | 'branch'>('branch');
  const [description, setDescription] = useState('');
  const [potensiUnit, setPotensiUnit] = useState('0');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ── Initialize form when prospect data loads ──

  const initialized = useRef(false);

  useEffect(() => {
    if (!prospect || initialized.current) return;

    setIndustryId(prospect.industryId || '');
    setProviderExisting(prospect.providerExisting || '');
    setProjectType(
      prospect.projectType || projectTypeOptions[0]?.value || 'Tender',
    );
    setEstimatedValue(prospect.estimatedValue);
    setClosingDate(prospect.date ? prospect.date.slice(0, 10) : '');
    setSource((prospect.source as 'ho' | 'branch') || 'branch');
    setDescription(prospect.description || '');
    setPotensiUnit(
      prospect.potensiUnit !== undefined ? String(prospect.potensiUnit) : '0',
    );
    setAnswers(prospect.answers || {});

    initialized.current = true;
  }, [prospect, projectTypeOptions]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
    }
  }, [isOpen]);

  // ── Auto-save mechanism ──

  // Serialized form snapshot for stable comparison
  const formSnapshot = JSON.stringify([
    industryId,
    providerExisting,
    projectType,
    estimatedValue,
    closingDate,
    source,
    description,
    potensiUnit,
    answers,
  ]);
  const formSnapshotRef = useRef(formSnapshot);
  formSnapshotRef.current = formSnapshot;

  const debouncedSnapshot = useDebouncedValue(formSnapshot, 1000);
  const initialSnapshot = useRef<string | null>(null);

  // Capture initial snapshot after form is initialized
  useEffect(() => {
    if (initialized.current && initialSnapshot.current === null) {
      initialSnapshot.current = formSnapshot;
    }
  }, [initialized.current, formSnapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset initial snapshot when drawer opens
  useEffect(() => {
    if (isOpen) initialSnapshot.current = null;
  }, [isOpen]);

  // Auto-save when debounced form changes
  useEffect(() => {
    if (initialSnapshot.current === null || !prospectId) return;
    if (debouncedSnapshot === initialSnapshot.current) return;

    const data: any[] = JSON.parse(debouncedSnapshot);

    setSaveStatus('saving');

    prospectService
      .update(prospectId, {
        industryId: data[0] || undefined,
        providerExisting: data[1] || undefined,
        projectType: data[2],
        estimatedValue: data[3],
        date: data[4] || undefined,
        source: data[5],
        description: data[6] || undefined,
        potensiUnit: Number(data[7]) || 0,
        answers: data[8],
      })
      .then(() => {
        setSaveStatus('saved');
        initialSnapshot.current = debouncedSnapshot;
        queryClient.invalidateQueries({ queryKey: ['prospects', prospectId] });
      })
      .catch(() => {
        setSaveStatus('error');
      });
  }, [debouncedSnapshot, prospectId, queryClient]);

  // Reset 'saved' status after 2s
  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  // ── Save on close to catch pending changes ──

  const handleClose = useCallback(() => {
    if (
      prospectId &&
      initialSnapshot.current &&
      formSnapshotRef.current !== initialSnapshot.current
    ) {
      const data: any[] = JSON.parse(formSnapshotRef.current);
      prospectService
        .update(prospectId, {
          industryId: data[0] || undefined,
          providerExisting: data[1] || undefined,
          projectType: data[2],
          estimatedValue: data[3],
          date: data[4] || undefined,
          source: data[5],
          description: data[6] || undefined,
          potensiUnit: Number(data[7]) || 0,
          answers: data[8],
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['prospects', prospectId] });
        })
        .catch(() => {});
    }
    onClose();
  }, [prospectId, onClose, queryClient]);

  // ── Save indicator ──

  const saveIndicator =
    saveStatus === 'saving' ? (
      <span className="text-xs text-outline flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Menyimpan...
      </span>
    ) : saveStatus === 'saved' ? (
      <span className="text-xs text-success flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">check</span>
        Tersimpan
      </span>
    ) : saveStatus === 'error' ? (
      <span className="text-xs text-danger flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">error</span>
        Gagal menyimpan
      </span>
    ) : null;

  const prospectName =
    prospect?.customerData?.name || prospect?.name || '';
  const prospectClient = prospect?.client || '';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={prospectName || 'Detail Tender'}
      subtitle={prospectClient}
      width="max-w-2xl"
    >
      {/* Loading State */}
      {isLoading && <DrawerSkeleton />}

      {/* Error State */}
      {!isLoading && !prospect && prospectId && (
        <div className="flex flex-col items-center justify-center py-16 text-outline">
          <span className="material-symbols-outlined text-4xl mb-3">
            error_outline
          </span>
          <p className="text-sm font-medium">Gagal memuat data prospek.</p>
          <p className="text-xs mt-1">Coba tutup dan buka kembali panel ini.</p>
        </div>
      )}

      {/* Empty state - no prospect selected */}
      {!isLoading && !prospectId && (
        <div className="flex flex-col items-center justify-center py-16 text-outline">
          <span className="material-symbols-outlined text-4xl mb-3">
            select_window
          </span>
          <p className="text-sm">Pilih prospek untuk melihat detail.</p>
        </div>
      )}

      {/* Loaded Form */}
      {!isLoading && prospect && (
        <div className="space-y-6 pb-4">
          {/* Save Status Indicator */}
          <div className="flex items-center justify-end min-h-[20px]">
            {saveIndicator}
          </div>

          {/* ── Customer Detail ── */}
          <section>
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 mb-4 pb-2 border-b border-border/60">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              Detail Customer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Bidang Industri
                </label>
                <select
                  value={industryId}
                  onChange={(e) => setIndustryId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                >
                  <option value="">Pilih Industri</option>
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Provider Existing
                </label>
                <select
                  value={providerExisting}
                  onChange={(e) => setProviderExisting(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                >
                  <option value="">Tidak Ada</option>
                  {competitors.map((prov) => (
                    <option key={prov.id} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Prospect Detail ── */}
          <section>
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 mb-4 pb-2 border-b border-border/60">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              Detail Prospek
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Tipe Proyek
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                >
                  {projectTypeOptions.length === 0 && (
                    <option value="Tender">Tender</option>
                  )}
                  {projectTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <CurrencyInput
                label="Estimasi Nilai Proyek"
                value={estimatedValue}
                onChange={setEstimatedValue}
                placeholder="Rp 0"
              />
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Estimasi Tanggal Closing
                </label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Sumber Lead
                </label>
                <select
                  value={source}
                  onChange={(e) =>
                    setSource(e.target.value as 'ho' | 'branch')
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                >
                  <option value="branch">Branch / Kantor Cabang</option>
                  <option value="ho">Head Office (HO)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Potensi Penambahan Unit
                </label>
                <input
                  type="number"
                  value={potensiUnit}
                  onChange={(e) => setPotensiUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow resize-none"
                placeholder="Keterangan singkat mengenai kebutuhan proyek..."
              />
            </div>
          </section>

          {/* ── Standard Questions ── */}
          <section>
            <h3 className="font-bold text-sm text-status-teal flex items-center gap-2 mb-4 pb-2 border-b border-border/60">
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              Pertanyaan Standar
            </h3>
            {prospectQuestions.length === 0 ? (
              <p className="text-sm text-secondary italic">
                Belum ada pertanyaan standar yang aktif.
              </p>
            ) : (
              <div className="space-y-4">
                {prospectQuestions.map((q) => {
                  const typeCode = resolveTypeCode(questionTypes, q.question_type_id);
                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-3"
                    >
                      <p className="font-semibold text-sm text-on-surface">
                        {q.question_text}
                        {q.is_required && (
                          <span className="text-danger ml-1">*</span>
                        )}
                      </p>
                      {q.help_text && (
                        <p className="text-xs text-secondary">{q.help_text}</p>
                      )}

                      {(typeCode === 'text' || typeCode === 'textarea') && (
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                          placeholder={
                            q.placeholder_text || 'Masukkan jawaban...'
                          }
                          rows={typeCode === 'textarea' ? 4 : 2}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none focus:ring-1 focus:ring-primary transition-shadow resize-none"
                        />
                      )}
                      {typeCode === 'number' && (
                        <input
                          type="number"
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                          placeholder={
                            q.placeholder_text || 'Masukkan angka...'
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        />
                      )}
                      {typeCode === 'date' && (
                        <input
                          type="date"
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        />
                      )}
                      {typeCode === 'checkbox' && (
                        <div className="flex gap-4 flex-wrap">
                          {(q.options || []).map((opt) => {
                            const vals = answers[q.id]
                              ? answers[q.id].split(', ')
                              : [];
                            const checked = vals.includes(opt);
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const nv = checked
                                      ? vals.filter((v) => v !== opt)
                                      : [...vals, opt];
                                    setAnswers({
                                      ...answers,
                                      [q.id]: nv.join(', '),
                                    });
                                  }}
                                  className="text-primary h-4 w-4 border-outline rounded cursor-pointer"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {typeCode === 'select' && (
                        <select
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        >
                          <option value="">Pilih jawaban...</option>
                          {(q.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {(typeCode === 'radio' ||
                        ![
                          'text',
                          'textarea',
                          'number',
                          'date',
                          'checkbox',
                          'select',
                        ].includes(typeCode)) && (
                        <div className="flex gap-4 flex-wrap">
                          {(q.options || ['Ya', 'Tidak']).map((opt) => (
                            <label
                              key={opt}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) =>
                                  setAnswers({
                                    ...answers,
                                    [q.id]: e.target.value,
                                  })
                                }
                                className="text-primary h-4 w-4 border-outline cursor-pointer"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
