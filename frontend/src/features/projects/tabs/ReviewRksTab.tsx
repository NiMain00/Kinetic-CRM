import { useMemo } from 'react';
import type { Project } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useAuthStore } from '@/stores/authStore';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ReviewRksTab({ project, onShowNotification }: TabProps) {
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const departments = useMasterDataStore((s) => s.departments as any[]);

  const authUser = useAuthStore((s) => s.user);
  const userRole = authUser?.roleName || '';
  const isSuperAdmin = userRole === 'Super Admin';

  const rks = project?.rks;
  const deptApprovals = rks?.departmentApprovals || [];
  const allDeptsApproved = deptApprovals.length > 0 && deptApprovals.every(a => a.status === 'approved');
  const statusToShow = rks?.overallStatus || 'draft';

  // Department-specific questions (read-only display)
  const deptQuestions = useMemo(() => {
    const saved = (rks?.answers as Record<string, string>)?.['_deptQuestions'];
    if (!saved) return {};
    try { return JSON.parse(saved); } catch { return {}; }
  }, [rks?.answers]);

  // Filter RKS questions
  const rksQuestions = useMemo(() => {
    return questions
      .filter((q: any) => {
        if (!q.is_active) return false;
        if (q.context === 'rks' || q.context === 'both') return true;
        if (!q.context) return true;
        return false;
      })
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
  }, [questions]);

  const getQuestionTypeCode = (questionTypeId: string): string => {
    const qt = questionTypes.find((t: any) => t.id === questionTypeId);
    return qt?.code || 'text';
  };

  const userDeptIds = useMemo(() => {
    if (!authUser?.departmentId) return [];
    const userDept = departments.find((d: any) => d.id === authUser.departmentId);
    if (userDept) return [userDept.id];
    return [];
  }, [authUser?.departmentId, departments]);

  const canReviewDept = (deptId: string) => {
    if (isSuperAdmin) return true;
    return userDeptIds.includes(deptId);
  };

  if (!project) {
    return (
      <div className="text-center py-12 text-secondary">
        <p>Data proyek tidak tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface">
            Review RKS Multi-Departemen
          </h3>
          <p className="text-sm text-secondary mt-1">
            Project: {project.name} ({project.code})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">
          <span className="material-symbols-outlined text-[18px]">rate_review</span>
          <span className="uppercase tracking-wider">
            {statusToShow === 'dept_review' ? 'Review Departemen' :
             statusToShow === 'pm_review' ? 'Final Approval PM' :
             statusToShow === 'approved' ? 'Disetujui' :
             statusToShow === 'revision' ? 'Revisi' : 'Review RKS'}
          </span>
        </div>
      </div>

      {/* Status bar */}
      {deptApprovals.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-on-surface">Status Review Departemen</h4>
            <span className="text-xs text-outline">{deptApprovals.filter(a => a.status === 'approved').length}/{deptApprovals.length} menyetujui</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {deptApprovals.map(a => (
              <span key={a.departmentId} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                a.status === 'approved'
                  ? 'bg-success/10 text-success border-success/20'
                  : a.status === 'revision'
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-surface-container text-outline border-border'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {a.status === 'approved' ? 'check_circle' : a.status === 'revision' ? 'edit_note' : 'hourglass_empty'}
                </span>
                {a.departmentName}
              </span>
            ))}
          </div>
          {allDeptsApproved && statusToShow === 'dept_review' && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Semua departemen telah menyetujui. PM dapat melakukan final approval.
            </div>
          )}
        </div>
      )}

      {/* Informasi Tender */}
      {rks && (
        <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">assignment</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-on-surface">Informasi Tender</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-secondary font-semibold">Nomor Tender</p>
              <p className="text-sm font-medium">{rks.nomorTender || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-secondary font-semibold">Nama Tender</p>
              <p className="text-sm font-medium">{rks.namaTender || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Deadline</p>
              <p className="text-sm font-medium">{rks.deadlineTender || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Aanwijzing</p>
              <p className="text-sm font-medium">{rks.aanwijzing || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Lokasi</p>
              <p className="text-sm font-medium">{rks.workLocation || '-'}</p>
            </div>
          </div>
          {rks.mainScope && (
            <div className="mt-4">
              <p className="text-xs text-secondary font-semibold">Lingkup Pekerjaan</p>
              <p className="text-sm font-medium mt-1">{rks.mainScope}</p>
            </div>
          )}
          {rks.uploadedFiles && rks.uploadedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-secondary font-semibold mb-2">Dokumen Terlampir</p>
              <div className="space-y-2">
                {rks.uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg border border-border">
                    <span className="material-symbols-outlined text-danger text-[20px]">description</span>
                    <div className="text-sm">
                      <span className="font-medium">{file.name}</span>
                      <span className="text-secondary ml-2">({file.size})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Department Review Cards */}
      {deptApprovals.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
              <span className="material-symbols-outlined">groups</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-on-surface">Review Per Departemen</h3>
              <p className="text-secondary text-xs">Setiap departemen memberikan persetujuan atau meminta revisi.</p>
            </div>
          </div>
          <div className="space-y-4">
            {deptApprovals.map(a => {
              const needAction = a.status === 'reviewing' && canReviewDept(a.departmentId);
              return (
                <div key={a.departmentId} className={`p-4 rounded-lg border-l-4 ${
                  a.status === 'approved' ? 'border-success bg-surface-container-low'
                  : a.status === 'revision' ? 'border-warning bg-surface-container-low'
                  : needAction ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface-container-low'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">
                        {a.status === 'approved' ? 'check_circle' : a.status === 'revision' ? 'edit_note' : 'hourglass_empty'}
                      </span>
                      <h4 className="font-semibold text-sm">{a.departmentName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'approved' ? 'bg-success/10 text-success'
                        : a.status === 'revision' ? 'bg-warning/10 text-warning'
                        : needAction ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container text-outline'
                      }`}>
                        {a.status === 'approved' ? 'Disetujui' : a.status === 'revision' ? 'Revisi' : needAction ? 'Perlu Tindakan' : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                  {a.approverName && (
                    <p className="text-xs text-secondary">Oleh: {a.approverName}{a.approvedAt ? ` • ${new Date(a.approvedAt).toLocaleDateString('id-ID')}` : ''}</p>
                  )}
                  {a.reviewNotes && (
                    <p className="text-xs text-outline mt-1 italic">Catatan: {a.reviewNotes}</p>
                  )}
                  {/* Buttons removed - read-only view */}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Jawaban Pertanyaan RKS */}
      <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-lg bg-status-teal/10 text-status-teal flex items-center justify-center">
            <span className="material-symbols-outlined">quiz</span>
          </span>
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface">Jawaban Pertanyaan RKS</h3>
            <p className="text-secondary text-xs">Review jawaban yang telah diisi oleh tim proyek.</p>
          </div>
        </div>

        {rksQuestions.length === 0 ? (
          <div className="text-center py-8 text-outline">
            <span className="material-symbols-outlined text-4xl mb-2">help_outline</span>
            <p className="text-sm">Belum ada pertanyaan RKS yang tersedia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rksQuestions.map((q: any, index: number) => {
              const typeCode = getQuestionTypeCode(q.question_type_id);
              const jawaban = rks?.answers?.[q.id] || '';
              const isAnswered = jawaban !== '';
              const hasOptions = typeCode === 'radio' || typeCode === 'checkbox' || typeCode === 'select';

              return (
                <div key={q.id} className={`p-4 rounded-lg border-l-4 ${isAnswered ? 'border-success bg-surface-container-low' : 'border-warning bg-surface-container border border-border'}`}>
                  <p className="font-semibold text-sm text-on-surface mb-2">
                    {index + 1}. {q.question_text}
                    {q.is_required && <span className="text-danger ml-1">*</span>}
                  </p>
                  {hasOptions && q.options && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {q.options.map((opt: string) => {
                        const isSelected = typeCode === 'checkbox'
                          ? jawaban.split(',').includes(opt)
                          : jawaban === opt;
                        return (
                          <span key={opt} className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            isSelected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface-container text-outline border-border'
                          }`}>{opt}</span>
                        );
                      })}
                    </div>
                  )}
                  {!hasOptions && (
                    <p className={`text-sm ${isAnswered ? 'text-secondary' : 'text-warning italic'}`}>
                      {isAnswered ? jawaban : 'Belum dijawab'}
                    </p>
                  )}
                  {q.help_text && <p className="text-xs text-outline mt-1">{q.help_text}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pertanyaan Spesifik Departemen */}
      {deptApprovals.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
              <span className="material-symbols-outlined">help_outline</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-on-surface">Pertanyaan Spesifik Departemen</h3>
              <p className="text-secondary text-xs">Setiap departemen dapat mengajukan pertanyaan spesifik terkait RKS.</p>
            </div>
          </div>

          {/* Daftar pertanyaan yang sudah diajukan */}
          {Object.keys(deptQuestions).length > 0 && (
            <div className="space-y-3 mb-4">
              {Object.entries(deptQuestions).map(([key, val]) => {
                const [deptId, qIndex] = key.split('_q_');
                const dept = departments.find((d: any) => d.id === deptId);
                return (
                  <div key={key} className="p-4 bg-surface-container-low rounded-lg border border-border">
                    <p className="text-xs text-outline font-semibold mb-1">{dept?.name || 'Departemen'}</p>
                    <p className="text-sm font-medium text-on-surface">{String(val)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form input removed - read-only view */}
        </section>
      )}

      {/* Catatan Review - hidden in read-only mode */}

      {/* Action Buttons - hidden in read-only mode */}
    </div>
  );
}