import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Card, CurrencyInput } from '@/components/ui';
import type { Project } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useRbacStore, type RbacDepartment, type RbacRole } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { eventBus } from '@/services/eventBridge';
import { useActiveOptions } from '@/hooks/useInputConfig';
import type { Prospect } from '@/types/domain';
import { projectSchema, type ProjectFormData } from '@/utils/validators';

interface MemberEntry {
  deptId: string;
  userId: string;
  roleId: string;
}

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const createProject = useProjectStore((s) => s.createProject);
  const projectCount = useProjectStore((s) => s.projects.length);
  const user = useAuthStore((s) => s.user);
  const customers = useCustomerStore((s) => s.customers);
  const projectTypeOptions = useActiveOptions('project_types');

  // RBAC
  const departments = useMasterDataStore((s) => s.departments as unknown as RbacDepartment[]);
  const userRoles = useRbacStore((s) => s.userRoles);
  const roles = useMasterDataStore((s) => s.roles as unknown as RbacRole[]);
  const addProjectDept = useRbacStore((s) => s.addProjectDepartment);
  const addProjMember = useRbacStore((s) => s.addProjectMember);
  const masterUsers = useMasterDataStore((s) => s.users);

  const projectRoles = roles.filter((r) =>
    ['role-pm-viewer', 'role-pm-contrib', 'role-pm-manager'].includes(r.id),
  );

  // Pre-fill dari prospect jika ada
  const fromProspect = (location.state as { fromProspect?: Prospect })?.fromProspect;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: fromProspect?.name || '',
      client: fromProspect?.client || '',
      type: fromProspect?.projectType?.toLowerCase() || projectTypeOptions[0]?.value || '',
      location: fromProspect?.branch || '',
      estimatedValue: fromProspect?.estimatedValue !== undefined && fromProspect?.estimatedValue !== null ? Number(fromProspect.estimatedValue) : undefined,
      deadlineTender: undefined,
    },
  });

  // State untuk scope & team
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [deptError, setDeptError] = useState('');
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [newMemberDept, setNewMemberDept] = useState('');
  const [newMemberUser, setNewMemberUser] = useState('');
  const [newMemberRole, setNewMemberRole] = useState(projectRoles[0]?.id || '');

  const activeDepts = departments.filter((d) => d.is_active);

  const toggleDept = (deptId: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId],
    );
    setDeptError('');
    // Remove members from deselected departments
    setMembers((prev) => prev.filter((m) => m.deptId !== deptId));
  };

  // Users in a department (based on userRoles)
  const getUsersInDept = (deptId: string) => {
    const deptUserIds = userRoles
      .filter((ur) => ur.scopeType === 'department' && ur.scopeId === deptId)
      .map((ur) => ur.userId);
    return [...new Set(deptUserIds)];
  };

  const addMember = () => {
    if (!newMemberDept || !newMemberUser || !newMemberRole) return;
    // Cegah duplikat user dalam 1 department
    if (members.find((m) => m.deptId === newMemberDept && m.userId === newMemberUser)) {
      toast.error('User sudah ditambahkan di department ini.');
      return;
    }
    setMembers((prev) => [...prev, { deptId: newMemberDept, userId: newMemberUser, roleId: newMemberRole }]);
    setNewMemberUser('');
  };

  const removeMember = (deptId: string, userId: string) => {
    setMembers((prev) => prev.filter((m) => !(m.deptId === deptId && m.userId === userId)));
  };

  const getUserName = (uid: string) => {
    return masterUsers.find((u) => u.id === uid)?.name || uid;
  };

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name.replace(/_/g, ' ') || roleId;

  const onSubmit = async (data: ProjectFormData) => {
    if (selectedDeptIds.length === 0) {
      setDeptError('Pilih minimal satu departemen yang terlibat.');
      return;
    }
    setDeptError('');
      const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const projectId = `PR-${ts}`;
    const currentTime = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newProject: Project = {
      id: projectId,
      code: `PRJ-${String(projectCount + 1).padStart(4, '0')}-${ts}-${rand}`,
      name: data.name.trim(),
      client: data.client,
      status: 'RKS',
      phase: 'RKS',
      location: data.location.trim(),
      author: user?.fullName || user?.name || 'Admin',
      date: new Date().toISOString(),
      progress: 0,
      estimatedValue: Number(data.estimatedValue) || 0,
      type: data.type?.toLowerCase() || 'tender',
      deadlineTender: data.deadlineTender || undefined,
      createdByUserId: user?.id,
      scopeDepartments: selectedDeptIds,
      departmentId: user?.departmentId || 'dept-pm',
      currentStageId: 'stage-in-project',
      sourceProspectId: fromProspect?.id,
      timeline: [{
        id: `evt-${projectId}-created-${Date.now()}`,
        title: 'Proyek Dibuat',
        actor: user?.fullName || user?.name || 'System',
        role: 'Project Manager',
        time: currentTime,
        type: 'status_change',
        description: `Proyek "${data.name.trim()}" berhasil dibuat.`,
      }],
    };

      try {
        const created = await createProject(newProject);
        const savedId = created?.id || projectId;

      // Simpan project departments
      selectedDeptIds.forEach((deptId) => {
        addProjectDept(savedId, deptId);
      });

      // Simpan project members
      members.forEach((m) => {
        addProjMember(savedId, m.userId, m.roleId, m.deptId, user?.id || '');
      });

      // Jika dari prospek, emit event
      if (fromProspect) {
        eventBus.emit({
          type: 'PROSPECT_CONVERTED',
          prospectId: fromProspect.id,
          projectId: savedId,
          projectName: data.name.trim(),
          timestamp: new Date().toISOString(),
        });
      }

      toast.success(`Proyek "${newProject.name}" berhasil dibuat.`);
      navigate(`/projects/${savedId}/overview`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan proyek. Silakan coba lagi.');
    }
  };

  const fieldClass = (field: keyof ProjectFormData) =>
    `w-full rounded-xl border ${errors[field] ? 'border-danger' : 'border-border/60'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface">
            {fromProspect ? 'Konversi Prospek ke Proyek' : 'Buat Proyek Baru'}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {fromProspect
              ? `Prospek "${fromProspect.name}" siap dikonversi. Lengkapi data dan atur scope tim.`
              : 'Lengkapi informasi dasar proyek dan atur tim yang terlibat.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Informasi Dasar ── */}
          <Card padding="lg" className="space-y-5">
            <h2 className="font-heading-section text-base font-bold text-on-surface">Informasi Dasar</h2>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Nama Proyek *</label>
              <input
                {...register('name')}
                className={fieldClass('name')}
                placeholder="Contoh: Pembangunan Infrastruktur Data Center - Tahap II"
                type="text"
                aria-label="Nama Proyek"
              />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Client *</label>
                <select
                  {...register('client')}
                  className="w-full rounded-xl border border-border/60 p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-surface"
                  aria-label="Client"
                >
                  <option value="">Pilih client...</option>
                  {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errors.client && <p className="text-xs text-danger">{errors.client.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
                <select
                  {...register('type')}
                  className="w-full rounded-xl border border-border/60 p-2.5 focus:outline-none text-sm bg-surface"
                  aria-label="Tipe Proyek"
                >
                  {projectTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Lokasi Proyek *</label>
              <input
                {...register('location')}
                className={fieldClass('location')}
                placeholder="Contoh: Gatot Subroto, Jakarta"
                type="text"
                aria-label="Lokasi"
              />
              {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Controller
                  name="estimatedValue"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label="Estimasi Nilai Proyek"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      error={errors.estimatedValue?.message}
                      placeholder="Rp 0"
                      required
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">Batas Akhir Tender</label>
                <input
                  {...register('deadlineTender')}
                  className="w-full rounded-xl border border-border/60 p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  type="date"
                  aria-label="Batas Akhir Tender"
                />
              </div>
            </div>
          </Card>

          {/* ── Departemen Terlibat ── */}
          <Card padding="lg" className="space-y-4">
            <div>
              <h2 className="font-heading-section text-base font-bold text-on-surface">Departemen Terlibat</h2>
              <p className="text-xs text-secondary mt-0.5">Pilih departemen yang akan terlibat dalam proyek ini.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeDepts.map((dept) => {
                const selected = selectedDeptIds.includes(dept.id);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggleDept(dept.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface-container text-secondary hover:border-primary/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${selected ? 'bg-primary' : 'bg-outline'}`} />
                    {dept.name}
                    {selected && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
            {deptError && <p className="text-xs text-danger">{deptError}</p>}
          </Card>
          {selectedDeptIds.length > 0 && (
            <Card padding="lg" className="space-y-5">
              <div>
                <h2 className="font-heading-section text-base font-bold text-on-surface">Anggota Tim</h2>
                <p className="text-xs text-secondary mt-0.5">Tambahkan anggota tim untuk setiap departemen.</p>
              </div>

              {selectedDeptIds.map((deptId) => {
                const dept = activeDepts.find((d) => d.id === deptId);
                const deptMembers = members.filter((m) => m.deptId === deptId);
                const availableUsers = getUsersInDept(deptId);
                const addedUserIds = deptMembers.map((m) => m.userId);

                return (
                  <div key={deptId} className="border border-border/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[14px]">business</span>
                      </div>
                      <h3 className="font-semibold text-sm text-on-surface">{dept?.name || deptId}</h3>
                    </div>

                    {/* Daftar anggota */}
                    {deptMembers.length === 0 && (
                      <p className="text-xs text-secondary italic">Belum ada anggota.</p>
                    )}
                    {deptMembers.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between bg-surface-container-low rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">
                              {getUserName(m.userId).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{getUserName(m.userId)}</p>
                            <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold uppercase">
                              {getRoleName(m.roleId)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(deptId, m.userId)}
                          className="p-1 text-outline hover:text-danger rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                        </button>
                      </div>
                    ))}

                    {/* Form tambah anggota */}
                    {availableUsers.length > 0 && (
                      <div className="flex flex-wrap items-end gap-2 pt-1">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-secondary font-semibold uppercase tracking-wider block mb-0.5">
                            User
                          </label>
                          <select
                            value={newMemberDept === deptId ? newMemberUser : ''}
                            onChange={(e) => {
                              setNewMemberDept(deptId);
                              setNewMemberUser(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border/60 rounded-lg text-xs"
                          >
                            <option value="">— Pilih —</option>
                            {availableUsers
                              .filter((uid) => !addedUserIds.includes(uid))
                              .map((uid) => (
                                <option key={uid} value={uid}>{getUserName(uid)}</option>
                              ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] text-secondary font-semibold uppercase tracking-wider block mb-0.5">
                            Role
                          </label>
                          <select
                            value={newMemberDept === deptId ? newMemberRole : projectRoles[0]?.id || ''}
                            onChange={(e) => {
                              setNewMemberDept(deptId);
                              setNewMemberRole(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border/60 rounded-lg text-xs"
                          >
                            {projectRoles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={addMember}
                          disabled={!newMemberUser || newMemberDept !== deptId}
                          className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                          Tambah
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary */}
              <div className="flex gap-4 pt-2 border-t border-border">
                <div className="text-xs text-secondary">
                  <span className="font-bold text-primary">{selectedDeptIds.length}</span> Departemen
                </div>
                <div className="text-xs text-secondary">
                  <span className="font-bold text-primary">{members.length}</span> Anggota
                </div>
            </div>
          </Card>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : fromProspect ? 'Konversi ke Proyek' : 'Buat Proyek'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
