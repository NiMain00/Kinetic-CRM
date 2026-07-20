import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, TimelineEvent, RksData, RksDepartmentApproval } from '@/types/domain';
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
  const updateProjectRks = useProjectStore((s) => s.updateProjectRks);
  const updateRksDepartmentApproval = useProjectStore((s) => s.updateRksDepartmentApproval);
  const updateRksStatus = useProjectStore((s) => s.updateRksStatus);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const questions = useMasterDataStore((s) => s.questions);
  const questionTypes = useMasterDataStore((s) => s.questionTypes);
  const departments = useMasterDataStore((s) => s.departments as any[]);

  const authUser = useAuthStore((s) => s.user);
  const userRole = authUser?.roleName || '';
  const isSuperAdmin = userRole === 'Super Admin';
  const isPM = userRole === 'PM' || isSuperAdmin;
  const isDeptHead = userRole === 'Dept Head' || isSuperAdmin;
  const addNotification = useNotificationStore((s) => s.addNotification);
  const addApproval = useApprovalStore((s) => s.addApproval);
  const removeApproval = useApprovalStore((s) => s.removeApproval);
  const approvals = useApprovalStore((s) => s.approvals);

  const rks = project?.rks;
  const deptApprovals = rks?.departmentApprovals || [];
  const allDeptsApproved = deptApprovals.length > 0 && deptApprovals.every(a => a.status === 'approved');
  const statusToShow = rks?.overallStatus || 'draft';

  const [reviewNotes, setReviewNotes] = useState(() => {
    return (project?.rks?.answers as Record<string, string>)?.['_reviewNotes'] || '';
  });
  const reviewNotesRef = useRef(reviewNotes);
  useEffect(() => { reviewNotesRef.current = reviewNotes; }, [reviewNotes]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [approving, setApproving] = useState(false);

  // Department-specific questions
  const [deptQuestions, setDeptQuestions] = useState<Record<string, string>>(() => {
    const saved = (rks?.answers as Record<string, string>)?.['_deptQuestions'];
    return saved ? JSON.parse(saved) : {};
  });
  const [newDeptQuestion, setNewDeptQuestion] = useState('');

  // Auto-save reviewNotes
  useEffect(() => {
    if (!project?.id || !reviewNotes) return;
    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      const existingRks = (useProjectStore.getState().entities[project.id]?.rks || {}) as any;
      const existingAnswers = (existingRks.answers || {}) as Record<string, string>;
      const mergedRks: RksData = {
        nomorTender: existingRks.nomorTender || '',
        namaTender: existingRks.namaTender || '',
        deadlineTender: existingRks.deadlineTender || '',
        aanwijzing: existingRks.aanwijzing || '',
        workLocation: existingRks.workLocation || '',
        mainScope: existingRks.mainScope || '',
        additionalNotes: existingRks.additionalNotes || '',
        uploadedFiles: existingRks.uploadedFiles || [],
        answers: { ...existingAnswers, _reviewNotes: reviewNotesRef.current },
        selectedDepartments: existingRks.selectedDepartments,
        departmentsLocked: existingRks.departmentsLocked,
        overallStatus: existingRks.overallStatus,
        departmentApprovals: existingRks.departmentApprovals,
      };
      updateProjectRks(project.id, mergedRks)
        .then(() => setAutoSaveStatus('saved'))
        .catch(() => { setAutoSaveStatus('unsaved'); });
    }, 800);
    return () => clearTimeout(timer);
  }, [reviewNotes, project?.id]);

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

  const needsDeptAction = deptApprovals.some(a =>
    a.status === 'reviewing' && canReviewDept(a.departmentId)
  );

  const handleDeptApprove = async (deptId: string) => {
    if (!project?.id) return;
    const dept = departments.find((d: any) => d.id === deptId);
    const approval: RksDepartmentApproval = {
      departmentId: deptId,
      departmentName: dept?.name || deptId,
      status: 'approved',
      approverName: authUser?.fullName || authUser?.name || 'User',
      approvedAt: new Date().toISOString(),
      revisionRound: deptApprovals.find(a => a.departmentId === deptId)?.revisionRound || 0,
    };
    updateRksDepartmentApproval(project.id, approval);

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: `Departemen ${approval.departmentName} Menyetujui RKS`,
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'Dept Head',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.(`Departemen ${approval.departmentName} menyetujui RKS.`, 'success');

    // Check if all depts approved -> prompt PM for final approval
    const updated = deptApprovals.map(a => a.departmentId === deptId ? approval : a);
    const allOk = updated.every(a => a.status === 'approved');
    if (allOk) {
      updateRksStatus(project.id, { overallStatus: 'pm_review', pmStatus: 'reviewing' });
      addNotification({
        title: 'Semua Departemen Menyetujui RKS',
        message: `Semua departemen telah menyetujui RKS proyek "${project.name}". PM dapat melakukan final approval.`,
        type: 'approval',
        entityId: project.id,
        entityType: 'project',
      });
      onShowNotification?.('Semua departemen menyetujui. Menunggu final approval PM.', 'success');
    }
  };

  const handleDeptRevision = async (deptId: string) => {
    if (!project?.id) return;
    const dept = departments.find((d: any) => d.id === deptId);
    const approval: RksDepartmentApproval = {
      departmentId: deptId,
      departmentName: dept?.name || deptId,
      status: 'revision',
      approverName: authUser?.fullName || authUser?.name || 'User',
      reviewNotes: reviewNotes,
      revisionRound: (deptApprovals.find(a => a.departmentId === deptId)?.revisionRound || 0) + 1,
    };
    updateRksDepartmentApproval(project.id, approval);
    updateRksStatus(project.id, { overallStatus: 'revision' });

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: `Departemen ${approval.departmentName} Minta Revisi RKS`,
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'Dept Head',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'revision',
      description: `Revisi diminta oleh ${approval.departmentName}. Catatan: ${reviewNotes || '(tanpa catatan)'}`,
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.(`Revisi diminta oleh departemen ${approval.departmentName}.`, 'warning');
  };

  const handlePmApprove = async () => {
    if (!project?.id || approving) return;
    setApproving(true);
    try {
      await updateProject(project.id, { status: 'LPHS/SIOS', phase: 'LPHS/SIOS' });
      updateRksStatus(project.id, { overallStatus: 'approved', pmStatus: 'approved' });

      const rksApproval = approvals.find(a => a.entityId === project.id && a.type === 'RKS');
      if (rksApproval) {
        await removeApproval(rksApproval.id);
      }
      await addApproval({
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
        title: 'RKS Final Disetujui',
        actor: project.author,
        role: 'Project Manager',
        time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        type: 'approve',
        description: 'Review multi-departemen selesai. RKS final approved, lanjut ke LPHS/SIOS.',
      };
      addTimelineEvent(project.id, event);
      onShowNotification?.('RKS final approved. Melanjutkan ke LPHS/SIOS.', 'success');
      addNotification({
        title: 'RKS Final Disetujui',
        message: `RKS proyek "${project.name}" telah mendapat final approval. Melanjutkan ke LPHS/SIOS.`,
        type: 'approval',
        entityId: project.id,
        entityType: 'project',
      });
      navigate(`/projects/${project.id}/lphs`);
    } catch {
      onShowNotification?.('Gagal approve RKS. Silakan coba lagi.', 'error');
    } finally {
      setApproving(false);
    }
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
                  {needAction && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleDeptApprove(a.departmentId)} className="px-4 py-1.5 bg-success text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Setujui
                      </button>
                      <button onClick={() => handleDeptRevision(a.departmentId)} className="px-4 py-1.5 border border-warning text-warning text-xs font-semibold rounded-lg hover:bg-warning/5 transition-all flex items-center gap-1 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        Minta Revisi
                      </button>
                    </div>
                  )}
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
                    <p className="text-sm font-medium text-on-surface">{val}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form tambah pertanyaan — hanya untuk user yang bisa review dept */}
          {needsDeptAction && (
            <div className="flex gap-2 items-start">
              <textarea
                value={newDeptQuestion}
                onChange={(e) => setNewDeptQuestion(e.target.value)}
                placeholder="Tulis pertanyaan untuk departemen ini..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg resize-none text-sm"
                rows={2}
              />
              <button
                onClick={() => {
                  if (!newDeptQuestion.trim()) return;
                  const targetDeptId = deptApprovals.find(a => a.status === 'reviewing' && canReviewDept(a.departmentId))?.departmentId;
                  if (!targetDeptId) return;
                  const key = `${targetDeptId}_q_${Date.now()}`;
                  const updated = { ...deptQuestions, [key]: newDeptQuestion.trim() };
                  setDeptQuestions(updated);
                  setNewDeptQuestion('');

                  // Simpan ke RKS answers
                  const existingRks = (useProjectStore.getState().entities[project.id!]?.rks || {}) as any;
                  const existingAnswers = (existingRks.answers || {}) as Record<string, string>;
                  const mergedRks: RksData = {
                    nomorTender: existingRks.nomorTender || '',
                    namaTender: existingRks.namaTender || '',
                    deadlineTender: existingRks.deadlineTender || '',
                    aanwijzing: existingRks.aanwijzing || '',
                    workLocation: existingRks.workLocation || '',
                    mainScope: existingRks.mainScope || '',
                    additionalNotes: existingRks.additionalNotes || '',
                    uploadedFiles: existingRks.uploadedFiles || [],
                    answers: { ...existingAnswers, _deptQuestions: JSON.stringify(updated) },
                    selectedDepartments: existingRks.selectedDepartments,
                    departmentsLocked: existingRks.departmentsLocked,
                    overallStatus: existingRks.overallStatus,
                    departmentApprovals: existingRks.departmentApprovals,
                  };
                  updateProjectRks(project.id!, mergedRks);
                  onShowNotification?.('Pertanyaan berhasil ditambahkan.', 'success');
                }}
                disabled={!newDeptQuestion.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 cursor-pointer"
              >
                Tambah
              </button>
            </div>
          )}
        </section>
      )}

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
        <div className="flex items-center gap-2 mt-2 text-xs">
          {autoSaveStatus === 'saving' && (
            <span className="text-warning flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
              Menyimpan...
            </span>
          )}
          {autoSaveStatus === 'saved' && reviewNotes && (
            <span className="text-success flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Tersimpan
            </span>
          )}
          {autoSaveStatus === 'unsaved' && reviewNotes && (
            <span className="text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Belum tersimpan
            </span>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <section className="bg-surface-container-low border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-secondary text-xs text-center sm:text-left">
          <span className="material-symbols-outlined text-[18px]">info</span>
          {statusToShow === 'dept_review' && deptApprovals.length > 0
            ? 'Departemen reviewer melakukan review. PM melakukan final approval setelah semua departemen approve.'
            : statusToShow === 'pm_review'
            ? 'Semua departemen sudah approve. PM lakukan final approval.'
            : statusToShow === 'approved'
            ? 'RKS telah disetujui. Melanjutkan ke tahap LPHS/SIOS.'
            : statusToShow === 'revision'
            ? 'RKS perlu direvisi berdasarkan masukan departemen. Kembali ke form RKS.'
            : 'Pastikan RKS telah disubmit sebelum review.'}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {statusToShow === 'revision' && (
            <button onClick={() => navigate(`/projects/${project.id}/rks`)} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-warning text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Revisi RKS
            </button>
          )}
          {statusToShow !== 'approved' && statusToShow !== 'revision' && isPM && (
            <>
              {allDeptsApproved ? null : null}
              {statusToShow === 'pm_review' || (allDeptsApproved && isPM) ? (
                <button onClick={handlePmApprove} disabled={approving} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-success text-white font-semibold text-sm rounded-lg hover:opacity-90 shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  <span className={`material-symbols-outlined text-[18px] ${approving ? 'animate-spin' : ''}`}>
                    {approving ? 'progress_activity' : 'check_circle'}
                  </span>
                  {approving ? 'Menyetujui...' : 'Final Approve (PM)'}
                </button>
              ) : (
                <span className="text-xs text-outline italic">Menunggu review departemen...</span>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}