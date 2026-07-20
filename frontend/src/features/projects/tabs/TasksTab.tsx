import React, { useState, useMemo } from 'react';
import { Modal, Button, Select } from '@/components/ui';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { useRbacStore } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import type { Project } from '@/types/domain';

interface Props {
  project: Project;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-danger bg-danger-container border-danger/20', icon: 'priority_high' },
  high: { label: 'High', color: 'text-status-orange bg-orange-50 border-orange-200', icon: 'arrow_upward' },
  medium: { label: 'Medium', color: 'text-warning bg-warning-container border-warning/20', icon: 'remove' },
  low: { label: 'Low', color: 'text-success bg-success-container border-success/20', icon: 'arrow_downward' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  todo: { label: 'To Do', color: 'bg-surface-container text-secondary', icon: 'radio_button_unchecked' },
  in_progress: { label: 'In Progress', color: 'bg-info-container text-info', icon: 'progress_activity' },
  review: { label: 'Review', color: 'bg-status-purple/10 text-status-purple', icon: 'rate_review' },
  done: { label: 'Done', color: 'bg-success-container text-success', icon: 'check_circle' },
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Task) => void;
  depth?: number;
}

function TaskItem({ task, allTasks, onUpdate, onDelete, onAdd, depth = 0 }: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const subtasks = allTasks.filter((t) => t.parentId === task.id).sort((a, b) => a.order - b.order);
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: task.projectId,
      title: subtaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
      parentId: task.id,
      subtasks: [],
      createdAt: new Date().toISOString(),
      createdBy: 'User',
      order: subtasks.length,
    };
    onAdd(newTask);
    setSubtaskTitle('');
    setShowSubtaskForm(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border/40 pl-4' : ''}`}>
      <div className={`group flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-surface-container-low ${task.status === 'done' ? 'opacity-60' : ''}`}>
        <button
          onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === 'done'
              ? 'bg-success border-success text-white'
              : 'border-border hover:border-primary'
          }`}
        >
          {task.status === 'done' && (
            <span className="material-symbols-outlined text-[12px]">check</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-secondary' : 'text-on-surface'}`}>
              {task.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${priority.color}`}>
              {priority.label}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-secondary mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.assignee && (
              <div className="flex items-center gap-1 text-[11px] text-secondary">
                <span className="material-symbols-outlined text-[12px]">person</span>
                {task.assignee}
              </div>
            )}
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-[11px] ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger' : 'text-secondary'}`}>
                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                {new Date(task.dueDate).toLocaleDateString('id-ID')}
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-secondary">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {new Date(task.createdAt).toLocaleDateString('id-ID')}
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <StatusDropdown value={task.status} onChange={(v) => onUpdate(task.id, { status: v as Task['status'] })} />
            <button
              onClick={() => setShowSubtaskForm(!showSubtaskForm)}
              className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-all"
              title="Tambah Subtask"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
            </button>
            <button
              onClick={() => {
                const title = prompt('Edit task title:', task.title);
                if (title?.trim()) onUpdate(task.id, { title: title.trim() });
              }}
              className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-all"
              title="Edit"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Hapus task ini termasuk semua subtask-nya?')) onDelete(task.id);
              }}
              className="p-1 rounded-lg text-outline hover:text-danger hover:bg-surface-container-low transition-all"
              title="Hapus"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>

          {showSubtaskForm && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface focus:ring-primary outline-none focus:ring-2"
                placeholder="Nama subtask..."
                autoFocus
              />
              <Button variant="primary" size="sm" onClick={handleAddSubtask}>Tambah</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSubtaskForm(false)}>Batal</Button>
            </div>
          )}
        </div>
      </div>

      {subtasks.map((st) => (
        <TaskItem key={st.id} task={st} allTasks={allTasks} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} depth={depth + 1} />
      ))}
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-secondary outline-none cursor-pointer hover:border-primary transition-colors"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function TasksTab({ project, onShowNotification }: Props) {
  const entities = useTaskStore((s) => s.entities);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const projectMembers = useRbacStore((s) => s.projectMembers);
  const masterUsers = useMasterDataStore((s) => s.users);

  const teamMembers = useMemo(() => {
    const memberIds = projectMembers
      .filter((pm) => pm.projectId === project.id)
      .map((pm) => pm.userId);
    return masterUsers.filter((u) => memberIds.includes(u.id));
  }, [projectMembers, masterUsers, project.id]);

  const assigneeOptions = useMemo(() => {
    const opts = teamMembers.map((m) => ({ value: m.name, label: m.name }));
    const pm = project.author;
    if (pm && !teamMembers.some((m) => m.name === pm)) {
      opts.unshift({ value: pm, label: `${pm} (PM)` });
    }
    return opts;
  }, [teamMembers, project.author]);

  const allTasks = Object.values(entities).filter((t) => t.projectId === project.id);
  const rootTasks = allTasks.filter((t) => !t.parentId).sort((a, b) => a.order - b.order);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const todo = rootTasks.filter((t) => t.status === 'todo');
  const inProgress = rootTasks.filter((t) => t.status === 'in_progress');
  const review = rootTasks.filter((t) => t.status === 'review');
  const done = rootTasks.filter((t) => t.status === 'done');

  const handleAddTask = () => {
    if (!title.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: project.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignee: assignee || undefined,
      status: 'todo',
      dueDate: dueDate || undefined,
      subtasks: [],
      createdAt: new Date().toISOString(),
      createdBy: 'User',
      order: rootTasks.length,
    };
    addTask(task);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssignee('');
    setDueDate('');
    setShowForm(false);
    onShowNotification('Task berhasil ditambahkan.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-on-surface">Task Management</h3>
          <p className="text-sm text-secondary">{allTasks.length} task ({done.length} selesai)</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
        >
          Tambah Task
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface-container-low rounded-xl border border-border/60 p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:ring-primary outline-none focus:ring-2"
            placeholder="Nama task..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:ring-primary outline-none focus:ring-2 resize-none"
            placeholder="Deskripsi (opsional)"
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface outline-none"
              >
                <option value="">Pilih person...</option>
                {assigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={handleAddTask}>Simpan Task</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </div>
      )}

      {/* Kanban-style board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'todo', label: 'To Do', tasks: todo, color: 'border-t-gray-400' },
          { key: 'in_progress', label: 'In Progress', tasks: inProgress, color: 'border-t-blue-400' },
          { key: 'review', label: 'Review', tasks: review, color: 'border-t-purple-400' },
          { key: 'done', label: 'Done', tasks: done, color: 'border-t-emerald-400' },
        ].map((col) => (
          <div
            key={col.key}
            className={`bg-surface-container-low rounded-xl border border-border/60 border-t-4 ${col.color} p-3`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-on-surface">{col.label}</h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-secondary">
                {col.tasks.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {col.tasks.length === 0 ? (
                <p className="text-xs text-secondary/60 text-center py-4">Belum ada task</p>
              ) : (
                col.tasks.map((task) => {
                  const subtaskList = allTasks.filter((t) => t.parentId === task.id);
                  const doneSubtasks = subtaskList.filter((t) => t.status === 'done');
                  return (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg border border-border/40 p-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-on-surface leading-snug">{task.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PRIORITY_CONFIG[task.priority].color} shrink-0`}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {task.assignee}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger' : 'text-secondary'}`}>
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {new Date(task.dueDate).toLocaleDateString('id-ID')}
                      </div>
                    )}
                    {subtaskList.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs text-secondary font-semibold">Subtask</span>
                          <span className="text-xs text-secondary">
                            ({doneSubtasks.length}/{subtaskList.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {subtaskList.map((st) => (
                            <div key={st.id} className="flex items-center gap-2 text-sm group">
                              <button
                                onClick={() => updateTask(st.id, { status: st.status === 'done' ? 'todo' : 'done' })}
                                className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                  st.status === 'done'
                                    ? 'bg-success border-success text-white'
                                    : 'border-border hover:border-primary'
                                }`}
                              >
                                {st.status === 'done' && (
                                  <span className="material-symbols-outlined text-[11px]">check</span>
                                )}
                              </button>
                              <span
                                onClick={() => updateTask(st.id, { status: st.status === 'done' ? 'todo' : 'done' })}
                                className={`truncate cursor-pointer hover:text-on-surface transition-colors ${
                                  st.status === 'done' ? 'line-through text-secondary' : 'text-secondary'
                                }`}
                              >
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                      <StatusDropdown value={task.status} onChange={(v) => updateTask(task.id, { status: v as Task['status'] })} />
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed task list */}
      <div className="bg-surface rounded-xl border border-border/60 divide-y divide-border/40">
        {rootTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">task</span>
            <p className="font-semibold text-on-surface">Belum ada task</p>
            <p className="text-sm">Klik "Tambah Task" untuk mulai.</p>
          </div>
        ) : (
            rootTasks.map((task) => (
            <TaskItem key={task.id} task={task} allTasks={allTasks} onUpdate={updateTask} onDelete={deleteTask} onAdd={addTask} />
          ))
        )}
      </div>
    </div>
  );
}
