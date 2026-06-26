import { useState, useEffect, useMemo } from 'react';
import type { Project, LphsData, LphsDepartmentApproval, TimelineEvent, ApprovalItem } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useAuthStore } from '@/stores/authStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const defaultLphsData: LphsData = {
  selectedDepartments: [],
  departmentsLocked: false,
  pmStatus: 'pending',
  mgmtStatus: 'pending',
  overallStatus: 'draft',
  departmentApprovals: [],
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  approved: 'Disetujui',
  revision: 'Revisi',
  draft: 'Draft',
  dept_review: 'Review Dept',
  mgmt_review: 'Review Management',
};

const STATUS_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  pending: 'default',
  reviewing: 'info',
  approved: 'success',
  revision: 'warning',
};

export default function LphsSiosTab({ project, onShowNotification }: TabProps) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectLphs = useProjectStore((s) => s.updateProjectLphs);
  const updateLphsDepartmentApproval = useProjectStore((s) => s.updateLphsDepartmentApproval);
  const updateLphsStatus = useProjectStore((s) => s.updateLphsStatus);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const departments = useMasterDataStore((s) => s.departments);
  const authUser = useAuthStore((s) => s.user);
  const addApproval = useApprovalStore((s) => s.addApproval);
  const removeApproval = useApprovalStore((s) => s.removeApproval);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [lphs, setLphs] = useState<LphsData>(project?.lphs || defaultLphsData);
  const [lphsFile, setLphsFile] = useState<File | null>(null);
  const [siosFile, setSiosFile] = useState<File | null>(null);
  const [lphsUrl, setLphsUrl] = useState(project?.lphs?.lphsExternalUrl || '');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(project?.lphs?.selectedDepartments || []);
  const [revisionDialog, setRevisionDialog] = useState<{ open: boolean; targetDepts: string[]; notes: string; role: 'pm' | 'management' }>({ open: false, targetDepts: [], notes: '', role: 'pm' });
  const [deptRevisionDialog, setDeptRevisionDialog] = useState<{ open: boolean; departmentId: string; departmentName: string; notes: string }>({ open: false, departmentId: '', departmentName: '', notes: '' });

  useEffect(() => {
    if (project?.lphs) {
      setLphs(project.lphs);
      setSelectedDepts(project.lphs.selectedDepartments);
      setLphsUrl(project.lphs.lphsExternalUrl || '');
    }
  }, [project?.id]);

  // Determine user role capabilities
  const userRole = authUser?.roleName || '';
  const isSuperAdmin = userRole === 'Super Admin';
  const isPM = userRole === 'PM' || isSuperAdmin;
  const isCabang = userRole === 'Branch Manager' || userRole === 'Staff' || isSuperAdmin;
  const isManagement = userRole === 'Admin' || userRole === 'Management' || isSuperAdmin;
  const isDeptHead = userRole === 'Dept Head' || isSuperAdmin;

  const activeDepartments = useMemo(() => departments.filter(d => d.status), [departments]);

  // --- Document Upload Handlers ---
  const handleUploadLphs = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.xlsx,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLphsFile(file);
        onShowNotification?.('File LPHS dipilih: ' + file.name, 'success');
      }
    };
    input.click();
  };

  const handleUploadSios = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.xlsx,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSiosFile(file);
        onShowNotification?.('File SIOS dipilih: ' + file.name, 'success');
      }
    };
    input.click();
  };

  const handleRemoveLphsFile = () => {
    setLphsFile(null);
  };

  const handleRemoveSiosFile = () => {
    setSiosFile(null);
  };

  // --- Department Selection ---
  const toggleDept = (deptId: string) => {
    if (lphs.departmentsLocked) return;
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  // --- Submit Draft ---
  const handleSubmitDraft = () => {
    if (!project?.id) return;
    if (selectedDepts.length === 0) {
      onShowNotification?.('Minimal 1 departemen harus dipilih.', 'error');
      return;
    }
    if (!lphsFile && !lphsUrl && !lphs.lphsFileName) {
      onShowNotification?.('Dokumen LPHS wajib diupload atau URL wajib diisi.', 'error');
      return;
    }

    const departmentApprovals: LphsDepartmentApproval[] = selectedDepts.map(deptId => {
      const dept = departments.find(d => d.id === deptId);
      const existing = lphs.departmentApprovals.find(a => a.departmentId === deptId);
      return existing || {
        departmentId: deptId,
        departmentName: dept?.name || deptId,
        status: 'reviewing',
        revisionRound: 0,
        isTargetedRevision: false,
      };
    });

    const newLphs: LphsData = {
      lphsFileName: lphsFile?.name || lphs.lphsFileName,
      lphsFileSize: lphsFile ? `${(lphsFile.size / 1024 / 1024).toFixed(1)} MB` : lphs.lphsFileSize,
      lphsExternalUrl: lphsUrl || undefined,
      siosFileName: siosFile?.name || lphs.siosFileName,
      siosFileSize: siosFile ? `${(siosFile.size / 1024 / 1024).toFixed(1)} MB` : lphs.siosFileSize,
      selectedDepartments: selectedDepts,
      departmentsLocked: true,
      pmStatus: 'reviewing',
      mgmtStatus: 'pending',
      overallStatus: 'dept_review',
      submittedAt: new Date().toISOString(),
      departmentApprovals,
    };

    updateProjectLphs(project.id, newLphs);
    updateProject(project.id, { status: 'LPHS/SIOS', phase: 'LPHS/SIOS' });

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Dokumen LPHS/SIOS Disubmit',
      actor: authUser?.fullName || authUser?.name || 'User',
      role: userRole,
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'submit',
      description: `Dokumen LPHS/SIOS disubmit dengan ${selectedDepts.length} departemen reviewer.`,
    };
    addTimelineEvent(project.id, event);
    setLphs(newLphs);

    // Create LPHS approval item in approval inbox
    const approvalItem: ApprovalItem = {
      id: `app-lphs-${Date.now()}`,
      ref: `LPHS-${project.code}`,
      name: project.name,
      branch: project.location,
      waitingSince: new Date().toISOString(),
      slaStatus: 'Normal',
      type: 'LPHS',
      client: project.client,
      entityId: project.id,
      entityType: 'project',
    };
    addApproval(approvalItem);
    onShowNotification?.('Dokumen LPHS/SIOS berhasil disubmit.', 'success');
    addNotification({
      title: 'LPHS/SIOS Disubmit',
      message: `Dokumen LPHS/SIOS proyek "${project.name}" telah disubmit dengan ${selectedDepts.length} departemen reviewer.`,
      type: 'approval',
      entityId: project.id,
      entityType: 'project',
    });
  };

  // --- PM Approve ---
  const handlePmApprove = () => {
    if (!project?.id) return;
    updateLphsStatus(project.id, { pmStatus: 'approved' });
    updateProjectLphs(project.id, { ...lphs, pmStatus: 'approved', pmApprovedAt: new Date().toISOString() });
    setLphs(prev => ({ ...prev, pmStatus: 'approved', pmApprovedAt: new Date().toISOString() }));

    // Remove LPHS approval from inbox
    const existingApproval = useApprovalStore.getState().approvals.find(a => a.entityId === project.id && a.type === 'LPHS');
    if (existingApproval) removeApproval(existingApproval.id);

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'PM Menyetujui LPHS/SIOS',
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'PM',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.('LPHS/SIOS disetujui oleh PM.', 'success');
    addNotification({
      title: 'LPHS/SIOS Disetujui PM',
      message: `LPHS/SIOS proyek "${project.name}" telah disetujui oleh PM.`,
      type: 'approval',
      entityId: project.id,
      entityType: 'project',
    });

    // Check if all departments already approved → move to mgmt_review
    checkAllApproved(project.id);
  };

  // --- PM Targeted Revision ---
  const handlePmRevision = () => {
    setRevisionDialog({ open: true, targetDepts: [], notes: '', role: 'pm' });
  };

  // --- Department Approve ---
  const handleDeptApprove = (deptId: string) => {
    if (!project?.id) return;
    const dept = departments.find(d => d.id === deptId);
    const approval: LphsDepartmentApproval = {
      departmentId: deptId,
      departmentName: dept?.name || deptId,
      status: 'approved',
      approverName: authUser?.fullName || authUser?.name || 'User',
      approvedAt: new Date().toISOString(),
      revisionRound: lphs.departmentApprovals.find(a => a.departmentId === deptId)?.revisionRound || 0,
      isTargetedRevision: false,
    };
    updateLphsDepartmentApproval(project.id, approval);
    const updated = lphs.departmentApprovals.map(a => a.departmentId === deptId ? approval : a);
    updateProjectLphs(project.id, { ...lphs, departmentApprovals: updated });
    setLphs(prev => ({ ...prev, departmentApprovals: updated }));

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: `Departemen ${approval.departmentName} Menyetujui`,
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'Dept Head',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.(`Departemen ${approval.departmentName} menyetujui LPHS/SIOS.`, 'success');
    addNotification({
      title: `Departemen ${approval.departmentName} Menyetujui`,
      message: `Departemen ${approval.departmentName} telah menyetujui LPHS/SIOS proyek "${project.name}".`,
      type: 'approval',
      entityId: project.id,
      entityType: 'project',
    });

    // Check if all depts approved → mgmt_review
    if (lphs.pmStatus === 'approved') {
      checkAllApproved(project.id);
    }
  };

  // --- Department Revision ---
  const handleDeptRevisionClick = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    setDeptRevisionDialog({
      open: true,
      departmentId: deptId,
      departmentName: dept?.name || deptId,
      notes: '',
    });
  };

  const handleDeptRevisionSend = () => {
    if (!project?.id) return;
    const { departmentId, notes } = deptRevisionDialog;

    const updatedApprovals = lphs.departmentApprovals.map(a => {
      if (a.departmentId === departmentId) {
        return { ...a, status: 'revision' as const, reviewNotes: notes };
      }
      return a;
    });

    const updatedLphs = { ...lphs, departmentApprovals: updatedApprovals, overallStatus: 'revision' as const };
    updateProjectLphs(project.id, updatedLphs);
    setLphs(updatedLphs);

    const dept = departments.find(d => d.id === departmentId);
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: `Departemen ${dept?.name || departmentId} Minta Revisi`,
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'Dept Head',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'revision',
      description: `Revisi diminta oleh departemen ${dept?.name || departmentId}. Catatan: ${notes || '(tanpa catatan)'}`,
    };
    addTimelineEvent(project.id, event);
    setDeptRevisionDialog({ open: false, departmentId: '', departmentName: '', notes: '' });
    onShowNotification?.(`Revisi diminta oleh departemen ${dept?.name || departmentId}.`, 'warning');
  };

  // --- Management Approve ---
  const handleMgmtApprove = () => {
    if (!project?.id) return;
    updateLphsStatus(project.id, { mgmtStatus: 'approved', overallStatus: 'approved' });
    updateProjectLphs(project.id, { ...lphs, mgmtStatus: 'approved', mgmtApprovedAt: new Date().toISOString(), overallStatus: 'approved', finalApprovedAt: new Date().toISOString() });
    updateProject(project.id, { status: 'Input Harga', phase: 'Harga' });
    setLphs(prev => ({ ...prev, mgmtStatus: 'approved', mgmtApprovedAt: new Date().toISOString(), overallStatus: 'approved', finalApprovedAt: new Date().toISOString() }));

    // Remove LPHS approval from inbox
    const existingApproval = useApprovalStore.getState().approvals.find(a => a.entityId === project.id && a.type === 'LPHS');
    if (existingApproval) removeApproval(existingApproval.id);

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Management Final Approve LPHS/SIOS',
      actor: authUser?.fullName || authUser?.name || 'User',
      role: 'Management',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'LPHS/SIOS disetujui oleh Management. Proyek lanjut ke tahap Input Harga.',
    };
    addTimelineEvent(project.id, event);
    onShowNotification?.('LPHS/SIOS final approved oleh Management.', 'success');
    addNotification({
      title: 'Management Final Approve LPHS/SIOS',
      message: `LPHS/SIOS proyek "${project.name}" telah mendapat final approval dari Management. Proyek lanjut ke tahap Input Harga.`,
      type: 'approval',
      entityId: project.id,
      entityType: 'project',
    });
  };

  // --- Management Targeted Revision ---
  const handleMgmtRevision = () => {
    setRevisionDialog({ open: true, targetDepts: [], notes: '', role: 'management' });
  };

  // --- Send Targeted Revision ---
  const handleSendRevision = () => {
    if (!project?.id) return;
    if (revisionDialog.targetDepts.length === 0) {
      onShowNotification?.('Pilih minimal 1 departemen yang perlu revisi.', 'error');
      return;
    }

    const updatedApprovals = lphs.departmentApprovals.map(a => {
      if (revisionDialog.targetDepts.includes(a.departmentId)) {
        return {
          ...a,
          status: 'revision' as const,
          revisionNotes: revisionDialog.notes,
          revisionRound: a.revisionRound + 1,
          isTargetedRevision: true,
        };
      }
      return a;
    });

    const updatedLphs = {
      ...lphs,
      departmentApprovals: updatedApprovals,
      overallStatus: 'revision' as const,
      ...(revisionDialog.role === 'pm' ? { pmStatus: 'approved' as const } : { mgmtStatus: 'pending' as const }),
    };

    updateProjectLphs(project.id, updatedLphs);
    setLphs(updatedLphs);

    // Remove LPHS approval from inbox (action taken)
    const existingApproval = useApprovalStore.getState().approvals.find(a => a.entityId === project.id && a.type === 'LPHS');
    if (existingApproval) removeApproval(existingApproval.id);

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: `${revisionDialog.role === 'pm' ? 'PM' : 'Management'} Kirim Targeted Revision`,
      actor: authUser?.fullName || authUser?.name || 'User',
      role: revisionDialog.role === 'pm' ? 'PM' : 'Management',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'revision',
      description: `Revisi dikirim ke ${revisionDialog.targetDepts.length} departemen. Catatan: ${revisionDialog.notes}`,
    };
    addTimelineEvent(project.id, event);
    setRevisionDialog({ open: false, targetDepts: [], notes: '', role: 'pm' });
    onShowNotification?.('Targeted revision berhasil dikirim.', 'success');
  };

  // --- Re-upload after revision ---
  const handleReuploadRevision = () => {
    if (!project?.id) return;
    const updatedApprovals = lphs.departmentApprovals.map(a => {
      if (a.status === 'revision' && a.isTargetedRevision) {
        return { ...a, status: 'reviewing' as const };
      }
      return a;
    });
    const updatedLphs = { ...lphs, departmentApprovals: updatedApprovals, overallStatus: 'dept_review' as const };
    updateProjectLphs(project.id, updatedLphs);
    setLphs(updatedLphs);

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Revisi LPHS/SIOS Diupload Ulang',
      actor: authUser?.fullName || authUser?.name || 'User',
      role: userRole,
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'upload',
      description: 'Dokumen revisi LPHS/SIOS telah diupload.',
    };
    addTimelineEvent(project.id, event);

    // Create new LPHS approval item for re-review
    const approvalItem: ApprovalItem = {
      id: `app-lphs-${Date.now()}`,
      ref: `LPHS-${project.code}`,
      name: project.name,
      branch: project.location,
      waitingSince: new Date().toISOString(),
      slaStatus: 'Normal',
      type: 'LPHS',
      client: project.client,
      entityId: project.id,
      entityType: 'project',
    };
    addApproval(approvalItem);
    onShowNotification?.('Revisi berhasil diupload ulang.', 'success');
  };

  // --- Check All Approved ---
  const checkAllApproved = (projectId: string) => {
    const currentLphs = lphs;
    const pmOk = currentLphs.pmStatus === 'approved';
    const allDeptsOk = currentLphs.departmentApprovals.length > 0 && currentLphs.departmentApprovals.every(a => a.status === 'approved');
    if (pmOk && allDeptsOk) {
      updateLphsStatus(projectId, { overallStatus: 'mgmt_review', mgmtStatus: 'pending' });
      updateProjectLphs(projectId, { ...currentLphs, overallStatus: 'mgmt_review', mgmtStatus: 'pending' });
      setLphs(prev => ({ ...prev, overallStatus: 'mgmt_review', mgmtStatus: 'pending' }));
      onShowNotification?.('Semua approval terpenuhi. Management review dimulai.', 'success');
    }
  };

  // --- UI helpers ---
  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>;
      case 'reviewing': return <span className="material-symbols-outlined text-info text-[18px]">hourglass_top</span>;
      case 'revision': return <span className="material-symbols-outlined text-warning text-[18px]">edit_note</span>;
      default: return <span className="material-symbols-outlined text-slate-300 text-[18px]">radio_button_unchecked</span>;
    }
  };

  const isDeptApproved = (deptId: string) => lphs.departmentApprovals.find(a => a.departmentId === deptId);
  const canDeptApprove = (deptId: string) => {
    const approval = lphs.departmentApprovals.find(a => a.departmentId === deptId);
    if (!approval) return false;
    return approval.status === 'pending' || approval.status === 'reviewing' || approval.status === 'revision';
  };

  const needsRevisionReupload = lphs.overallStatus === 'revision' && lphs.departmentApprovals.some(a => a.status === 'revision' && a.isTargetedRevision);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel */}
      <div className="lg:col-span-4 space-y-6">
        {/* Dokumen LPHS */}
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Dokumen LPHS</h3>
          <p className="text-xs text-secondary mb-3">Lembar Permintaan Harga Satuan</p>

          {lphs.lphsFileName && !lphsFile && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{lphs.lphsFileName}</p>
                {lphs.lphsFileSize && <p className="text-[10px] text-slate-400">{lphs.lphsFileSize}</p>}
              </div>
              {!lphs.departmentsLocked && (
                <button onClick={() => { updateProjectLphs(project?.id || '', { ...lphs, lphsFileName: undefined, lphsFileSize: undefined }); setLphs(prev => ({ ...prev, lphsFileName: undefined, lphsFileSize: undefined })); }} className="text-slate-400 hover:text-danger cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          )}

          {lphsFile && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{lphsFile.name}</p>
                <p className="text-[10px] text-slate-400">{(lphsFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={handleRemoveLphsFile} className="text-slate-400 hover:text-danger cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {!lphs.departmentsLocked && isCabang && (
            <>
              <button onClick={handleUploadLphs} className="w-full border-2 border-dashed border-outline-variant rounded-xl p-4 text-center hover:bg-surface-container-low transition-all cursor-pointer mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                <p className="text-xs font-semibold mt-1">Upload dokumen LPHS</p>
                <p className="text-[10px] text-outline mt-0.5">PDF, DOCX, XLSX (Max 25MB)</p>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-slate-400">atau</span></div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">URL Eksternal (Google Docs, OneDrive, dll)</label>
                <input type="url" value={lphsUrl} onChange={e => setLphsUrl(e.target.value)} placeholder="https://docs.google.com/..." className="w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </>
          )}

          <div className="mt-3">
            <Badge variant={lphs.lphsFileName || lphsFile || lphsUrl ? 'success' : 'default'}>
              {lphs.lphsFileName || lphsFile || lphsUrl ? 'Dokumen Tersedia' : 'Belum Ada Dokumen'}
            </Badge>
          </div>
        </Card>

        {/* Dokumen SIOS */}
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Dokumen SIOS</h3>
          <p className="text-xs text-secondary mb-3">Surat Instruksi Operasional Site</p>

          {lphs.siosFileName && !siosFile && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{lphs.siosFileName}</p>
                {lphs.siosFileSize && <p className="text-[10px] text-slate-400">{lphs.siosFileSize}</p>}
              </div>
            </div>
          )}

          {siosFile && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{siosFile.name}</p>
                <p className="text-[10px] text-slate-400">{(siosFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={handleRemoveSiosFile} className="text-slate-400 hover:text-danger cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {!lphs.departmentsLocked && isCabang && (
            <button onClick={handleUploadSios} className="w-full border-2 border-dashed border-outline-variant rounded-xl p-4 text-center hover:bg-surface-container-low transition-all cursor-pointer">
              <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
              <p className="text-xs font-semibold mt-1">Upload dokumen SIOS</p>
              <p className="text-[10px] text-outline mt-0.5">PDF, DOCX (Max 25MB)</p>
            </button>
          )}

          <div className="mt-3">
            <Badge variant={lphs.siosFileName || siosFile ? 'success' : 'default'}>
              {lphs.siosFileName || siosFile ? 'Dokumen Tersedia' : 'Belum Ada Dokumen'}
            </Badge>
          </div>
        </Card>

        {/* Pilih Departemen Reviewer */}
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Departemen Reviewer</h3>
          {lphs.departmentsLocked && (
            <p className="text-[10px] text-warning mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span> Pilihan departemen sudah dikunci.
            </p>
          )}
          <div className="space-y-2">
            {activeDepartments.map(dept => {
              const approval = lphs.departmentApprovals.find(a => a.departmentId === dept.id);
              const isSelected = selectedDepts.includes(dept.id);
              const isDisabled = lphs.departmentsLocked;
              return (
                <div key={dept.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                  isDisabled ? (isSelected ? 'bg-slate-50 border-border' : 'bg-white border-border opacity-50') : 'hover:bg-slate-50 cursor-pointer'
                }`} onClick={() => !isDisabled && toggleDept(dept.id)}>
                  <input type="checkbox" checked={isSelected} disabled={isDisabled} readOnly className="accent-primary cursor-pointer" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{dept.name}</p>
                    <p className="text-[10px] text-slate-400">{dept.division} • {dept.head}</p>
                  </div>
                  {approval && (
                    <Badge variant={STATUS_BADGE[approval.status] || 'default'}>{STATUS_LABEL[approval.status]}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Ringkasan */}
        <div className="bg-primary-container text-on-primary-container rounded-xl p-5 relative overflow-hidden">
          <h4 className="font-semibold text-sm mb-1">Ringkasan LPHS/SIOS</h4>
          <div className="text-xs opacity-80 space-y-1">
            <p>Status: <strong>{STATUS_LABEL[lphs.overallStatus] || lphs.overallStatus}</strong></p>
            <p>PM: <strong>{STATUS_LABEL[lphs.pmStatus]}</strong></p>
            <p>Management: <strong>{STATUS_LABEL[lphs.mgmtStatus]}</strong></p>
            <p>Departemen: <strong>{lphs.departmentApprovals.filter(a => a.status === 'approved').length}/{lphs.departmentApprovals.length}</strong> approve</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Cabang: Submit Draft */}
          {!lphs.departmentsLocked && isCabang && (
            <Button onClick={handleSubmitDraft} className="w-full" rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
              Submit LPHS/SIOS
            </Button>
          )}

          {/* Re-upload after revision */}
          {needsRevisionReupload && isCabang && (
            <button onClick={handleReuploadRevision} className="w-full inline-flex items-center justify-center gap-2 font-label-sm font-semibold rounded-lg transition-all active:scale-[0.98] px-4 py-2 text-sm bg-amber-500 text-white hover:brightness-110" type="button">
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Upload Ulang Revisi
            </button>
          )}

        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-8">
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-heading-section text-heading-section">Status Matrix LPHS/SIOS</h3>
              <p className="text-xs text-secondary mt-0.5">Status approval dan review dokumen tender</p>
            </div>
            <Badge variant={lphs.overallStatus === 'approved' ? 'success' : lphs.overallStatus === 'revision' ? 'warning' : 'info'}>
              {STATUS_LABEL[lphs.overallStatus] || lphs.overallStatus}
            </Badge>
          </div>

          <div className="p-5">
            {/* PM Row */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-border mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">Project Manager</p>
                <p className="text-xs text-slate-400">{STATUS_LABEL[lphs.pmStatus]}{lphs.pmApprovedAt ? ` • ${new Date(lphs.pmApprovedAt).toLocaleDateString('id-ID')}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(lphs.pmStatus)}
                {(isPM && lphs.overallStatus === 'dept_review' && lphs.pmStatus !== 'approved') && (
                  <>
                    <button onClick={handlePmApprove} className="px-3 py-1.5 bg-success text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                      Setujui
                    </button>
                    <button onClick={handlePmRevision} className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                      Revisi
                    </button>
                  </>
                )}
                
              </div>
            </div>

            {/* Management Row */}
            {lphs.overallStatus !== 'draft' && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-700">verified</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">Management</p>
                  <p className="text-xs text-amber-600">{STATUS_LABEL[lphs.mgmtStatus]}{lphs.mgmtApprovedAt ? ` • ${new Date(lphs.mgmtApprovedAt).toLocaleDateString('id-ID')}` : lphs.overallStatus === 'mgmt_review' ? ' • Menunggu approval...' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(lphs.mgmtStatus)}
                  {(isManagement && lphs.pmStatus === 'approved' && lphs.overallStatus !== 'approved') && (
                    <>
                      <button onClick={handleMgmtApprove} className="px-3 py-1.5 bg-success text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                        Setujui
                      </button>
                      <button onClick={handleMgmtRevision} className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                        Revisi
                      </button>
                    </>
                  )}
                  
                </div>
              </div>
            )}

            {/* Department Table */}
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Departemen Reviewer</h4>
            <div className="space-y-2">
              {lphs.departmentApprovals.length === 0 && lphs.departmentsLocked === false && (
                <p className="text-sm text-slate-400 italic text-center py-8">Belum ada departemen dipilih. Pilih departemen reviewer sebelum submit.</p>
              )}
              {lphs.departmentApprovals.length === 0 && lphs.departmentsLocked === true && (
                <p className="text-sm text-slate-400 italic text-center py-8">Tidak ada data departemen.</p>
              )}
              {lphs.departmentApprovals.map(approval => {
                const dept = departments.find(d => d.id === approval.departmentId);
                return (
                  <div key={approval.departmentId} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border hover:shadow-xs transition-shadow">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-slate-500 text-[16px]">domain</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{approval.departmentName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{STATUS_LABEL[approval.status]}</span>
                        {approval.approverName && <span>• {approval.approverName}</span>}
                        {approval.approvedAt && <span>• {new Date(approval.approvedAt).toLocaleDateString('id-ID')}</span>}
                        {approval.revisionRound > 0 && <Badge variant="warning">Revisi ke-{approval.revisionRound}</Badge>}
                      </div>
                      {approval.reviewNotes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">"{approval.reviewNotes}"</p>
                      )}
                      {approval.revisionNotes && (
                        <p className="text-[10px] text-amber-600 mt-1 italic">Catatan revisi: {approval.revisionNotes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(approval.status)}
                      {/* Dept Head approve (bersamaan dengan PM) */}
                      {canDeptApprove(approval.departmentId) && (isDeptHead || isSuperAdmin) && (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeptApprove(approval.departmentId)} className="px-3 py-1.5 bg-success text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                            Setujui
                          </button>
                          <button onClick={() => handleDeptRevisionClick(approval.departmentId)} className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer">
                            Revisi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Dokumen Terupload */}
        {(lphs.lphsFileName || lphs.lphsExternalUrl || lphs.siosFileName) && (
          <Card padding="lg" className="mt-6">
            <h3 className="font-heading-section text-heading-section mb-4">Dokumen Terupload</h3>
            <div className="space-y-3">
              {lphs.lphsFileName && (
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">LPHS: {lphs.lphsFileName}</p>
                    {lphs.lphsFileSize && <p className="text-[10px] text-slate-400">{lphs.lphsFileSize}</p>}
                  </div>
                  {lphs.lphsExternalUrl && (
                    <a href={lphs.lphsExternalUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span> Buka
                    </a>
                  )}
                </div>
              )}
              {lphs.lphsExternalUrl && !lphs.lphsFileName && (
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">link</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">URL LPHS Eksternal</p>
                    <p className="text-[10px] text-slate-400 truncate">{lphs.lphsExternalUrl}</p>
                  </div>
                  <a href={lphs.lphsExternalUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> Buka
                  </a>
                </div>
              )}
              {lphs.siosFileName && (
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">SIOS: {lphs.siosFileName}</p>
                    {lphs.siosFileSize && <p className="text-[10px] text-slate-400">{lphs.siosFileSize}</p>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Targeted Revision Dialog */}
      {revisionDialog.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">
              {revisionDialog.role === 'pm' ? 'PM' : 'Management'} — Kirim Targeted Revision
            </h3>
            <p className="text-xs text-slate-400 mb-4">Pilih departemen yang perlu melakukan review ulang:</p>

            <div className="space-y-2 mb-4">
              {lphs.departmentApprovals.map(a => (
                <label key={a.departmentId} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={revisionDialog.targetDepts.includes(a.departmentId)} onChange={() => {
                    setRevisionDialog(prev => ({
                      ...prev,
                      targetDepts: prev.targetDepts.includes(a.departmentId)
                        ? prev.targetDepts.filter(d => d !== a.departmentId)
                        : [...prev.targetDepts, a.departmentId],
                    }));
                  }} className="accent-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{a.departmentName}</p>
                    <p className="text-[10px] text-slate-400">Status: {STATUS_LABEL[a.status]}</p>
                  </div>
                  {a.status === 'approved' && <Badge variant="success">OK</Badge>}
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Revisi</label>
              <textarea value={revisionDialog.notes} onChange={e => setRevisionDialog(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Jelaskan apa yang perlu direvisi..." />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setRevisionDialog({ open: false, targetDepts: [], notes: '', role: 'pm' })} className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={handleSendRevision} className="px-4 py-2 bg-warning text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">
                Kirim Revisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Revision Dialog */}
      {deptRevisionDialog.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">
              Revisi — {deptRevisionDialog.departmentName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Berikan catatan revisi untuk dokumen LPHS/SIOS:</p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Revisi</label>
              <textarea value={deptRevisionDialog.notes} onChange={e => setDeptRevisionDialog(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Jelaskan apa yang perlu direvisi..." />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeptRevisionDialog({ open: false, departmentId: '', departmentName: '', notes: '' })} className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={handleDeptRevisionSend} className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">
                Kirim Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
