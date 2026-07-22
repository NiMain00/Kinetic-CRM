import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowUpStore } from '@/stores/followUpStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { Button, Modal, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/formatters';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Belum',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-danger bg-danger/10 border-danger/20',
  medium: 'text-warning bg-warning/10 border-warning/20',
  low: 'text-secondary bg-surface-container-high border-border/40',
};

export default function FollowUpPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user) as { id?: string } | null;
  const {
    globalTasks,
    globalTotal,
    globalPage,
    globalLoading,
    fetchGlobalTasks,
    createTask,
    updateTask,
    deleteTask,
  } = useFollowUpStore();
  const { users, fetchUsers } = useUserStore();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [toUserId, setToUserId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState(1);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    toUserId: '',
    priority: 'medium' as string,
    notes: '',
    deadline: '',
  });

  // Edit modal
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    progress: 0,
    notes: '',
    title: '',
    deadline: '',
  });

  // Load users once
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch global tasks
  useEffect(() => {
    const params: any = { page };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (toUserId) params.toUserId = toUserId;
    if (searchText) params.search = searchText;
    fetchGlobalTasks(params);
  }, [page, statusFilter, priorityFilter, toUserId, searchText, fetchGlobalTasks]);

  const handleFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreateTask = async () => {
    if (!createForm.title) { toast.error('Judul tugas wajib diisi.'); return; }
    if (!createForm.toUserId) { toast.error('Pilih PIC tujuan.'); return; }
    try {
      await createTask({
        title: createForm.title,
        fromUserId: authUser?.id || '',
        toUserId: createForm.toUserId,
        priority: createForm.priority,
        notes: createForm.notes || undefined,
        deadline: createForm.deadline || undefined,
      });
      setCreateForm({ title: '', toUserId: '', priority: 'medium', notes: '', deadline: '' });
      setShowCreateModal(false);
      toast.success('Tugas berhasil dibuat.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat tugas.');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask, {
        status: editForm.status || undefined,
        progress: editForm.progress,
        title: editForm.title || undefined,
        notes: editForm.notes || undefined,
        deadline: editForm.deadline || undefined,
      });
      setEditingTask(null);
      toast.success('Tugas berhasil diperbarui.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui tugas.');
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task.id);
    setEditForm({
      status: task.status,
      progress: task.progress,
      notes: task.notes || '',
      title: task.title,
      deadline: task.deadline || '',
    });
  };

  const handleQuickStatus = async (task: any, newStatus: string) => {
    const progress = newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 25 : 0;
    try {
      await updateTask(task.id, { status: newStatus, progress });
      toast.success('Status tugas diperbarui.');
    } catch {
      toast.error('Gagal memperbarui status.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Tugas berhasil dihapus.');
    } catch {
      toast.error('Gagal menghapus tugas.');
    }
  };

  const totalPages = Math.ceil(globalTotal / 20);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      {/* Header */}
      <div className="bg-surface border-b border-border/60 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 shadow-card z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">assignment</span>
              Tindak Lanjut
            </h2>
            <p className="text-[11px] text-outline mt-0.5">Pantau seluruh tugas tindak lanjut di semua prospek.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => setShowCreateModal(true)}
          >
            Buat Tugas Baru
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari tugas..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
            className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Belum</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="completed">Selesai</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); handleFilterChange(); }}
            className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Prioritas</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>

          <select
            value={toUserId}
            onChange={(e) => { setToUserId(e.target.value); handleFilterChange(); }}
            className="px-3 py-1.5 bg-surface-container-low border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua PIC</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 custom-scrollbar">
        {globalLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : globalTasks.length === 0 ? (
          <div className="text-center py-20 text-outline">
            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">assignment</span>
            <p className="text-sm font-medium">Belum ada tugas tindak lanjut</p>
            <p className="text-xs mt-1">Buat tugas baru untuk memantau follow-up ke prospek atau customer.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-5xl mx-auto">
            {globalTasks.map((task: any) => {
              const pColor = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium;
              const progressColor = task.progress >= 100 ? 'bg-success' : task.progress >= 50 ? 'bg-warning' : 'bg-info';
              const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

              return (
                <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Top row: source + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Prospect/Customer link */}
                        {task.prospect && (
                          <button
                            onClick={() => navigate(`/prospects/${task.prospect.id}`)}
                            className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[11px]">person</span>
                            {task.prospect.name}
                            {task.prospect.client && (
                              <span className="text-outline font-normal"> - {task.prospect.client}</span>
                            )}
                          </button>
                        )}
                        {task.customer && (
                          <span className="text-[10px] font-semibold text-secondary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">business</span>
                            {task.customer.name}
                          </span>
                        )}
                        {!task.prospect && !task.customer && (
                          <span className="text-[10px] text-outline italic">— Tanpa prospek —</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-on-surface">{task.title}</h3>

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-secondary mt-1.5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">person_outline</span>
                          Dari: {task.fromUser?.fullName || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">person</span>
                          Untuk: {task.toUser?.fullName || '-'}
                        </span>
                        {task.deadline && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger font-semibold' : ''}`}>
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            Deadline: {formatDate(task.deadline)}
                            {isOverdue && ' ⚠️'}
                          </span>
                        )}
                        <span className="text-[10px] text-outline">
                          Dibuat: {formatDate(task.createdAt)}
                        </span>
                      </div>

                      {/* Notes */}
                      {task.notes && (
                        <p className="text-xs text-secondary bg-surface-container-low p-2 rounded-lg mt-2">{task.notes}</p>
                      )}

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-outline font-mono-data min-w-[32px] text-right">{task.progress}%</span>
                      </div>
                    </div>

                    {/* Right: badges + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pColor}`}>
                        {PRIORITY_LABEL[task.priority] || task.priority}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status] || ''}`}>
                        {STATUS_LABEL[task.status] || task.status}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border/40">
                    {task.status !== 'completed' && (
                      <>
                        {task.status === 'pending' && (
                          <Button variant="primary" size="xs" onClick={() => handleQuickStatus(task, 'in_progress')}>
                            Mulai
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button variant="success" size="xs" onClick={() => handleQuickStatus(task, 'completed')}>
                            Selesaikan
                          </Button>
                        )}
                      </>
                    )}
                    {task.status === 'completed' && (
                      <Button variant="secondary" size="xs" onClick={() => handleQuickStatus(task, 'pending')}>
                        Buka Kembali
                      </Button>
                    )}
                    <Button variant="secondary" size="xs" onClick={() => openEditModal(task)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => handleDeleteTask(task.id)}>
                      Hapus
                    </Button>
                  </div>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-xs text-secondary">
                <span>{globalTotal} tugas</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-outline">Halaman {globalPage} dari {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CREATE MODAL ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Buat Tugas Tindak Lanjut"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowCreateModal(false)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleCreateTask}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="followup-create-title" className="font-semibold text-sm">Judul *</label>
            <input
              id="followup-create-title"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contoh: Follow-up proposal ke customer"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-create-pic" className="font-semibold text-sm">PIC Tujuan *</label>
            <select
              id="followup-create-pic"
              value={createForm.toUserId}
              onChange={(e) => setCreateForm({ ...createForm, toUserId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Pilih PIC</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-create-priority" className="font-semibold text-sm">Prioritas</label>
            <select
              id="followup-create-priority"
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-create-deadline" className="font-semibold text-sm">Deadline</label>
            <input
              type="date"
              id="followup-create-deadline"
              value={createForm.deadline}
              onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-create-notes" className="font-semibold text-sm">Catatan</label>
            <textarea
              id="followup-create-notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
              placeholder="Deskripsi tugas..."
            />
          </div>
        </div>
      </Modal>

      {/* ─── EDIT MODAL ─── */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Tugas Tindak Lanjut"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditingTask(null)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleUpdateTask}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="followup-edit-title" className="font-semibold text-sm">Judul</label>
            <input
              id="followup-edit-title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-edit-status" className="font-semibold text-sm">Status</label>
            <select
              id="followup-edit-status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Belum</option>
              <option value="in_progress">Sedang Dikerjakan</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-edit-progress" className="font-semibold text-sm">Progress ({editForm.progress}%)</label>
            <input
              type="range"
              id="followup-edit-progress"
              min={0}
              max={100}
              step={5}
              value={editForm.progress}
              onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-edit-deadline" className="font-semibold text-sm">Deadline</label>
            <input
              type="date"
              id="followup-edit-deadline"
              value={editForm.deadline}
              onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="followup-edit-notes" className="font-semibold text-sm">Catatan</label>
            <textarea
              id="followup-edit-notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
