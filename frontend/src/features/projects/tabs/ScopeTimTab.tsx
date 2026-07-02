import React, { useState, useMemo } from 'react';
import type { Project } from '@/types/domain';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { Modal, Button } from '@/components/ui';
import { authz } from '@/services/authz';
import type { ProjectMemberRecord } from '@/stores/rbacStore';

interface ScopeTimTabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ScopeTimTab({ project }: ScopeTimTabProps) {
  const projectId = project?.id || '';
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const departments = useRbacStore((s) => s.departments);
  const projectDepartments = useRbacStore((s) => s.projectDepartments);
  const projectMembers = useRbacStore((s) => s.projectMembers);
  const addProjectDept = useRbacStore((s) => s.addProjectDepartment);
  const removeProjectDept = useRbacStore((s) => s.removeProjectDepartment);
  const addProjMember = useRbacStore((s) => s.addProjectMember);
  const removeProjMember = useRbacStore((s) => s.removeProjectMember);

  const roles = useRbacStore((s) => s.roles);
  const masterUsers = useMasterDataStore((s) => s.users);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedDeptForMember, setSelectedDeptForMember] = useState<string | null>(null);

  // Derived data
  const involvedDeptIds = useMemo(
    () =>
      projectDepartments
        .filter((pd) => pd.projectId === projectId)
        .map((pd) => pd.departmentId),
    [projectDepartments, projectId],
  );

  const involvedDepts = useMemo(
    () => departments.filter((d) => involvedDeptIds.includes(d.id)),
    [departments, involvedDeptIds],
  );

  const members = useMemo(
    () => projectMembers.filter((pm) => pm.projectId === projectId),
    [projectMembers, projectId],
  );

  const membersByDept = useMemo(() => {
    const map = new Map<string, ProjectMemberRecord[]>();
    for (const m of members) {
      const list = map.get(m.departmentId) || [];
      list.push(m);
      map.set(m.departmentId, list);
    }
    return map;
  }, [members]);

  const availableDepts = useMemo(
    () => departments.filter((d) => !involvedDeptIds.includes(d.id) && d.is_active),
    [departments, involvedDeptIds],
  );

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;
  const getUserName = (uid: string) => masterUsers.find((u) => u.id === uid)?.name || uid;

  const canManage = userId
    ? authz.hasPermission(userId, 'project:manage:scope', { projectId })
    : false;

  if (!canManage) {
    return (
      <div className="space-y-6">
        <SectionCard title="Departemen Terlibat">
          {involvedDepts.length === 0 ? (
            <p className="text-sm text-secondary">Belum ada departemen yang ditambahkan.</p>
          ) : (
            <div className="space-y-2">
              {involvedDepts.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">business</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                    <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <InfoSummary deptCount={involvedDepts.length} memberCount={members.length} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Departemen Terlibat */}
      <SectionCard
        title="Departemen Terlibat"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowAddDeptModal(true)}>
            + Tambah Departemen
          </Button>
        }
      >
        {involvedDepts.length === 0 ? (
          <p className="text-sm text-secondary py-4 text-center">
            Belum ada departemen. Tambah departemen yang terlibat dalam proyek ini.
          </p>
        ) : (
          <div className="space-y-2">
            {involvedDepts.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">business</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                    <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeProjectDept(projectId, d.id)}
                  className="p-1.5 text-outline hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  title="Hapus departemen"
                >
                  <span className="material-symbols-outlined text-lg">remove_circle</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Section 2: Member per Department */}
      {involvedDepts.length > 0 &&
        involvedDepts.map((dept) => {
          const deptMembers = membersByDept.get(dept.id) || [];
          return (
            <SectionCard
              key={dept.id}
              title={`Anggota — ${dept.name}`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedDeptForMember(dept.id);
                    setShowAddMemberModal(true);
                  }}
                >
                  + Tambah Member
                </Button>
              }
            >
              {deptMembers.length === 0 ? (
                <p className="text-sm text-secondary py-2">Belum ada anggota.</p>
              ) : (
                <div className="space-y-2">
                  {deptMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {getUserName(m.userId).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{getUserName(m.userId)}</p>
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold uppercase">
                            {getRoleName(m.roleId).replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProjMember(projectId, m.userId)}
                        className="p-1 text-outline hover:text-danger rounded-lg transition-colors"
                        title="Hapus anggota"
                      >
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          );
        })}

      {/* Section 3: Info */}
      <InfoSummary deptCount={involvedDepts.length} memberCount={members.length} />

      {/* ── Add Department Modal ── */}
      <Modal isOpen={showAddDeptModal} onClose={() => setShowAddDeptModal(false)} title="Tambah Departemen" size="sm">
        <div className="space-y-2">
          {availableDepts.length === 0 ? (
            <p className="text-sm text-secondary text-center py-4">Semua departemen sudah ditambahkan.</p>
          ) : (
            availableDepts.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  addProjectDept(projectId, d.id);
                  setShowAddDeptModal(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-surface-container-lowest transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">business</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                  <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* ── Add Member Modal ── */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Tambah Anggota" size="sm">
        {selectedDeptForMember && (
          <AddMemberForm
            projectId={projectId}
            departmentId={selectedDeptForMember}
            assignedBy={userId || ''}
            onAdded={() => setShowAddMemberModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}

// ── Helper Components ──

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 p-4 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading-section text-sm sm:text-base text-on-surface font-bold">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoSummary({ deptCount, memberCount }: { deptCount: number; memberCount: number }) {
  const isComplete = deptCount > 0;
  return (
    <SectionCard title="Informasi Scope">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-surface-container rounded-xl text-center">
          <p className="text-2xl font-bold text-primary">{deptCount}</p>
          <p className="text-[10px] text-secondary uppercase">Departemen</p>
        </div>
        <div className="p-3 bg-surface-container rounded-xl text-center">
          <p className="text-2xl font-bold text-primary">{memberCount}</p>
          <p className="text-[10px] text-secondary uppercase">Anggota</p>
        </div>
        <div className="p-3 bg-surface-container rounded-xl text-center">
          {isComplete ? (
            <span className="material-symbols-outlined text-2xl text-success">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-2xl text-outline">hourglass_empty</span>
          )}
          <p className="text-[10px] text-secondary uppercase mt-1">
            {isComplete ? 'Lengkap' : 'Belum Lengkap'}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function AddMemberForm({
  projectId,
  departmentId,
  assignedBy,
  onAdded,
}: {
  projectId: string;
  departmentId: string;
  assignedBy: string;
  onAdded: () => void;
}) {
  const addProjMember = useRbacStore((s) => s.addProjectMember);
  const masterUsers = useMasterDataStore((s) => s.users);
  const roles = useRbacStore((s) => s.roles);
  const projectMembers = useRbacStore((s) => s.projectMembers);

  // Filter users in this department (based on userRoles)
  const deptUserIds = useRbacStore((s) => s.userRoles)
    .filter((ur) => ur.scopeType === 'department' && ur.scopeId === departmentId)
    .map((ur) => ur.userId);

  const existingMemberIds = projectMembers
    .filter((pm) => pm.projectId === projectId)
    .map((pm) => pm.userId);

  const availableUsers = masterUsers.filter(
    (u) => deptUserIds.includes(u.id) && !existingMemberIds.includes(u.id),
  );

  const projectRoles = roles.filter((r) =>
    ['project_viewer', 'project_contributor', 'project_manager'].includes(r.name),
  );

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState(projectRoles[0]?.id || '');

  const handleAdd = () => {
    if (!selectedUser || !selectedRole) return;
    addProjMember(projectId, selectedUser, selectedRole, departmentId, assignedBy);
    onAdded();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
          Pilih User
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm"
        >
          <option value="">— Pilih User —</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.branch})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
          Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm"
        >
          {projectRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="md" onClick={onAdded}>
          Batal
        </Button>
        <Button variant="primary" size="md" onClick={handleAdd} disabled={!selectedUser || !selectedRole}>
          Tambah
        </Button>
      </div>
    </div>
  );
}
