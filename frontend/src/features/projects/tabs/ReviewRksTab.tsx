import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalStore } from '@/stores/approvalStore';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ReviewRksTab({ project, onShowNotification }: TabProps) {
  const navigate = useNavigate();
  const updateProject = useProjectStore((s) => s.updateProject);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);

  const authUser = useAuthStore((s) => s.user);
  const userRole = authUser?.roleName || '';
  const canReview = userRole === 'PM' || userRole === 'Admin' || userRole === 'Super Admin';
  const addNotification = useNotificationStore((s) => s.addNotification);
  const addApproval = useApprovalStore((s) => s.addApproval);
  const removeApproval = useApprovalStore((s) => s.removeApproval);
  const approvals = useApprovalStore((s) => s.approvals);

  const [reviewNotes, setReviewNotes] = useState('');

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

  const handleApprove = () => {
    if (!project?.id) return;
    updateProject(project.id, { status: 'LPHS/SIOS', phase: 'LPHS/SIOS' });
    // Hapus approval RKS yang sudah di-review
    const rksApproval = approvals.find(a => a.entityId === project.id && a.type === 'RKS');
    if (rksApproval) {
      removeApproval(rksApproval.id);
    }
    // Buat approval LPHS untuk tahap berikutnya
    addApproval({
      id: `app-lphs-${project.id}-${Date.now()}`,
      ref: `LPHS-${project.code}`,
      name: project.name,
      branch: project.location,
      waitingSince: new Date().toISOString(),
      slaStatus: 'Normal',
      type: 'LPHS',
      resourceType: 'lphs_sios',
      resourceId: project.id,
      client: project.client,
      entityId: project.id,
      entityType: 'project',
      assigneeUserId: authUser?.id,
    });
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'RKS Direview & Disetujui',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'Review RKS selesai, lanjut ke tahap LPHS/SIOS.',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.('Review RKS disetujui. Melanjutkan ke LPHS/SIOS.', 'success');
    addNotification({
      title: 'RKS Disetujui',
      message: `RKS proyek "${project.name}" telah disetujui. Melanjutkan ke tahap LPHS/SIOS.`,
      type: 'approval',
      entityId: project.id,
      entityType: 'project',
    });
    navigate(`/projects/${project.id}/lphs`);
  };

  const handleRevisi = () => {
    if (!project?.id) return;
    updateProject(project.id, { status: 'Revisi', phase: 'Revisi' });
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'RKS Perlu Revisi',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'revision',
      description: reviewNotes || 'RKS dikembalikan untuk direvisi.',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.('RKS dikembalikan untuk revisi.', 'warning');
    addNotification({
      title: 'RKS Perlu Revisi',
      message: `RKS proyek "${project.name}" dikembalikan untuk revisi. ${reviewNotes ? `Catatan: ${reviewNotes}` : ''}`,
      type: 'revision',
      entityId: project.id,
      entityType: 'project',
    });
    navigate(`/projects/${project.id}/rks`);
  };

  const handleSaveReview = () => {
    onShowNotification?.('Review RKS berhasil disimpan.', 'success');
  };

  if (!project) {
    return (
      <div className="text-center py-12 text-secondary">
        <p>Data proyek tidak tersedia.</p>
      </div>
    );
  }

  const rks = project.rks;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display-title text-xl font-bold text-on-surface">
            Review RKS Komparatif
          </h3>
          <p className="font-body-main text-sm text-secondary mt-1">
            Project: {project.name} ({project.code})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">
          <span className="material-symbols-outlined text-[18px]">rate_review</span>
          <span className="uppercase tracking-wider">Review RKS</span>
        </div>
      </div>

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
          <div className="mt-4">
            <p className="text-xs text-secondary font-semibold">Lingkup Pekerjaan</p>
            <p className="text-sm font-medium mt-1">{rks.mainScope || '-'}</p>
          </div>
          {rks.additionalNotes && (
            <div className="mt-4">
              <p className="text-xs text-secondary font-semibold">Catatan Tambahan</p>
              <p className="text-sm font-medium mt-1">{rks.additionalNotes}</p>
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
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {hasOptions && q.options && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {q.options.map((opt: string) => {
                        const isSelected = typeCode === 'checkbox'
                          ? jawaban.split(',').includes(opt)
                          : jawaban === opt;
                        return (
                          <span
                            key={opt}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              isSelected
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-surface-container text-outline border-border'
                            }`}
                          >
                            {opt}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {!hasOptions && (
                    <p className={`text-sm ${isAnswered ? 'text-secondary' : 'text-warning italic'}`}>
                      {isAnswered ? jawaban : 'Belum dijawab'}
                    </p>
                  )}
                  {q.help_text && (
                    <p className="text-xs text-outline mt-1">{q.help_text}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Catatan Review */}
      <section className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-lg bg-status-purple/10 text-status-purple flex items-center justify-center">
            <span className="material-symbols-outlined">notes</span>
          </span>
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface">Catatan Review</h3>
            <p className="text-secondary text-xs">Tambahkan catatan untuk tim proyek.</p>
          </div>
        </div>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm"
          placeholder="Masukkan catatan review..."
          rows={4}
        />
      </section>

      {/* Action Buttons */}
      <section className="bg-surface-container-low border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {canReview ? (
          <>
            <div className="flex items-center gap-2 text-secondary text-xs text-center sm:text-left">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Pastikan semua data RKS dan jawaban sudah sesuai sebelum approve.</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleRevisi}
                type="button"
                className="flex-1 sm:flex-initial px-6 py-2.5 border border-warning text-warning font-semibold text-sm rounded-lg hover:bg-warning/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Revisi
              </button>
              <button
                onClick={handleSaveReview}
                type="button"
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-surface-container-lowest border border-border text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container transition-all cursor-pointer"
              >
                Simpan Review
              </button>
              <button
                onClick={handleApprove}
                type="button"
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-success text-white font-semibold text-sm rounded-lg hover:opacity-90 shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Approve
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-secondary text-xs w-full">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Hanya PM, Admin, atau Super Admin yang dapat melakukan review dan approve RKS.</span>
          </div>
        )}
      </section>
    </div>
  );
}